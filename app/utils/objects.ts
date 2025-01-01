import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { playAreaSound } from 'app/musicController';
import { isPixelInShortRect } from 'app/utils/index';
import { saveGame } from 'app/utils/saveGame';

export function initializeObject(state: GameState, object: ObjectInstance): void {
    // Do not apply special behavior here, as addObjectToArea can get called when persisting objects during
    // transitions (like lava drain), but apply should only be called once when the object is first created.
    if (object.definition?.specialBehaviorKey) {
        try {
            specialBehaviorsHash[object.definition.specialBehaviorKey].apply?.(state, object as any);
        } catch (error) {
            console.error(object.definition.specialBehaviorKey, error);
        }
    }
    // Note that this doesn't automatically update linked objects, so the `savePosition` flag should
    // match for linked objects to avoid inconsistencies.
    if (object.definition?.savePosition) {
        const p = getObjectStatus(state, object.definition, 'position');
        if (Array.isArray(p)) {
            object.x = p[0];
            object.y = p[1];
        }
    }
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
}
export function removeObjectFromArea(state: GameState, object: ObjectInstance): void {
    if (!object.area) {
        return;
    }
    if (object.definition) {
        object.area.removedObjectDefinitions.add(object.definition);
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

export function getObjectSaveTreatment(definition: ObjectDefinition, suffix = ''): 'forever' | 'zone' | 'never' {
    let treatment = definition.saveStatus;
    if (suffix === 'position') {
        treatment = definition.savePosition;
    }
    if (definition.type === 'door' && (
        definition.status === 'locked'
        || definition.status === 'bigKeyLocked'
        || definition.status === 'cracked'
        // Used for frozen doors.
        || suffix === 'melted'
    )) {
        treatment = 'forever';
    }
    if (treatment) {
        return treatment;
    }
    if (definition.type === 'boss') {
        return 'forever';
    } else if (definition.type === 'enemy') {
        return 'zone';
    } else if (definition.type === 'narration') {
        return 'forever';
    } else if (definition.type === 'saveStatue') {
        return 'forever';
    } else if (definition.type === 'pushStairs') {
        return 'forever';
    }
    return 'never';
}

export function saveObjectStatus(state: GameState, definition: ObjectDefinition, flag: boolean | number | number[] = true, suffix = ''): void {
    const treatment = getObjectSaveTreatment(definition, suffix);
    const fullKey =  definition.id + (suffix ? '-' + suffix : '');
    if (treatment === 'never') {
        return;
    }
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

export function getObjectStatus(this: void, state: GameState, definition: ObjectDefinition, suffix = ''): boolean | number | number[] | string {
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

export function getObjectBehaviors(this: void, state: GameState, object: ObjectInstance | EffectInstance, x?: number, y?: number): TileBehaviors | undefined {
    if (!object.getHitbox) {
        return undefined;
    }
    // If the point is passed in, only return behaviors if the point is in the hitbox.
    if (typeof x !== 'undefined' && !isPixelInShortRect(x, y, object.getHitbox(state))) {
        return undefined;
    }
    return object.getBehaviors?.(state, x, y) || object.behaviors;
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
        if (target.onActivate(state) && playChime) {
            playAreaSound(state, state.areaInstance, 'secretChime');
        }
        return;
    }
    if (target.status === 'hiddenSwitch') {
        changeObjectStatus(state, target, 'normal');
        saveObjectStatus(state, target.definition, true);
        if (playChime) {
            playAreaSound(state, state.areaInstance, 'secretChime');
        }
    } else if (target.status === 'closedSwitch') {
        changeObjectStatus(state, target, 'normal');
        saveObjectStatus(state, target.definition, true);
        if (playChime) {
            playAreaSound(state, state.areaInstance, 'secretChime');
        }
    }
}

export function deactivateTarget(state: GameState, target: ObjectInstance): void {
    if (target.onDeactivate) {
        if (target.onDeactivate(state)) {
            playAreaSound(state, state.areaInstance, 'secretChime');
        }
        return;
    }
    if (target.definition?.status === 'closedSwitch' && !target.definition.saveStatus) {
        changeObjectStatus(state, target, 'closedSwitch');
    }
}

export function getObjectAndParts(state: GameState, object: ObjectInstance): ObjectInstance[] {
    const objectAndParts = [object];
    const parts = (object.getParts?.(state) || []);
    for (const part of parts) {
        objectAndParts.push(...getObjectAndParts(state, part));
    }
    return objectAndParts;
}


export function getFieldInstanceAndParts(state: GameState, object: ObjectInstance|EffectInstance): (ObjectInstance|EffectInstance)[] {
    const objectAndParts = [object];
    const parts = (object.getParts?.(state) || []);
    for (const part of parts) {
        objectAndParts.push(...getFieldInstanceAndParts(state, part));
    }
    return objectAndParts;
}
