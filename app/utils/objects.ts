import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { playSound } from 'app/musicController';
import { applyBehaviorToTile } from 'app/utils/tileBehavior';
import { saveGame } from 'app/utils/saveGame';



function hitboxToGrid(hitbox: Rect): Rect {
    const x = (hitbox.x / 16) | 0;
    const w = (hitbox.w / 16) | 0;
    const y = (hitbox.y / 16) | 0;
    const h = (hitbox.h / 16) | 0;
    return {x, y, w, h};
}
export function addObjectToArea(state: GameState, area: AreaInstance, object: ObjectInstance): void {
    if (object.area && object.area !== area) {
        removeObjectFromArea(state, object);
    }
    object.area = area;
    if (object.add) {
        object.add(state, area);
    } else {
        area.objects.push(object);
    }
    if (object.definition?.specialBehaviorKey) {
        try {
            specialBehaviorsHash[object.definition.specialBehaviorKey].apply?.(state, object as any);
        } catch (error) {
            console.error(object.definition.specialBehaviorKey);
        }
    }

    if (object.applyBehaviorsToGrid && object.behaviors) {
        const gridRect = hitboxToGrid(object.getHitbox());
        for (let x = gridRect.x; x < gridRect.x + gridRect.w; x++) {
            for (let y = gridRect.y; y < gridRect.y + gridRect.h; y++) {
                applyBehaviorToTile(area, x, y, object.behaviors);
            }
        }
    }
}
export function removeObjectFromArea(state: GameState, object: ObjectInstance, trackId: boolean = true): void {
    if (!object.area) {
        return;
    }
    if (object.definition?.id && trackId) {
        object.area.removedObjectIds.push(object.definition.id);
    }
    if (object.remove) {
        object.remove(state);
        object.area = null;
    } else {
        if (object.cleanup) {
            object.cleanup(state);
        }
        const index = object.area.objects.indexOf(object);
        if (index >= 0) {
            object.area.objects.splice(index, 1);
        }
        object.area = null;
    }
}

export function changeObjectStatus(state: GameState, object: ObjectInstance, newStatus: ObjectStatus): void {
    if (object.changeStatus) {
        object.changeStatus(state, newStatus);
    } else {
        object.status = newStatus;
        if (object.linkedObject) {
            object.linkedObject.status = newStatus;
        }
    }
}

export function saveObjectStatus(this: void, state: GameState, definition: ObjectDefinition, flag: boolean | number = true, suffix = ''): void {
    let treatment = definition.saveStatus;
    // Make sure treatment is forever for locked doors. Might as well do the same for frozen/cracked doors.
    if (definition.type === 'door' && (
        definition.status === 'locked'
        || definition.status === 'bigKeyLocked'
        || definition.status === 'cracked'
        // Used for frozen doors.
        || suffix === 'melted'
    )) {
        treatment = 'forever';
        if (!definition.id) {
            console.error('Locked door was missing an id', this);
            debugger;
        }
    }
    if (!treatment) {
        if (definition.type === 'boss') {
            treatment = 'forever';
        } else if (definition.type === 'enemy') {
            treatment = 'zone';
        } else if (definition.type === 'narration') {
            treatment = 'forever';
        } else if (definition.type === 'saveStatue') {
            treatment = 'forever';
        } else if (definition.type === 'pushStairs') {
            treatment = 'forever';
        }
    }
    const fullKey =  definition.id + (suffix ? '-' + suffix : '');
    if (treatment === 'forever' || treatment === 'zone') {
        const hash = treatment === 'forever'
            ? state.savedState.objectFlags
            : state.savedState.zoneFlags;
        if (!definition.id) {
            console.error('Missing object id', definition);
            return;
        }
        if (flag !== false && hash[fullKey] !== flag) {
            hash[fullKey] = flag;
            saveGame(state);
        } else if (flag === false && hash[fullKey]) {
            delete hash[fullKey];
            saveGame(state);
        }
    }
}

export function getObjectStatus(this: void, state: GameState, definition: ObjectDefinition, suffix = ''): boolean | number | string {
    // Lucky beetles have special logic to prevent farming the same few over and over again.
    if (definition.type === 'enemy' && definition.enemyType === 'luckyBeetle') {
        // Lucky Beetle must have an id in order to appear.
        if (!definition.id) {
            return true;
        }
        return state.savedState.luckyBeetles.includes(definition.id);
    }
    if (!definition.id) {
        return false;
    }
    const fullKey = definition.id + (suffix ? '-' + suffix : '');
    if (state.savedState.zoneFlags[fullKey] !== undefined) {
        return state.savedState.zoneFlags[fullKey];
    }
    if (state.savedState.objectFlags[fullKey] !== undefined) {
        return state.savedState.objectFlags[fullKey];
    }
    return false;
}

export function getObjectBehaviors(this: void, state: GameState, object: ObjectInstance | EffectInstance) {
    return object.behaviors || object.getBehaviors?.(state);
}

export function deactivateTargets(state: GameState, area: AreaInstance, targetObjectId: string = null): void {
    for (const object of area.objects) {
        if (targetObjectId && object.definition?.id !== targetObjectId) {
            continue;
        }
        deactivateTarget(state, object);
    }
}

export function activateTarget(state: GameState, target: ObjectInstance, playChime = false): void {
    if (target.onActivate) {
        if (target.onActivate(state)) {
            playSound(state, 'secretChime');
        }
        return;
    }
    if (target.status === 'hiddenSwitch') {
        changeObjectStatus(state, target, 'normal');
        saveObjectStatus(state, target.definition, true);
        if (playChime) {
            playSound(state, 'secretChime');
        }
    } else if (target.status === 'closedSwitch') {
        changeObjectStatus(state, target, 'normal');
        saveObjectStatus(state, target.definition, true);
        if (playChime) {
            playSound(state, 'secretChime');
        }
    }
}

export function deactivateTarget(state: GameState, target: ObjectInstance): void {
    if (target.onDeactivate) {
        if (target.onDeactivate(state)) {
            playSound(state, 'secretChime');
        }
        return;
    }
    if (target.definition?.status === 'closedSwitch' && !target.definition.saveStatus) {
        changeObjectStatus(state, target, 'closedSwitch');
    }
}
