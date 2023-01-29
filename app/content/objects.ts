import { CrystalSwitch } from 'app/content/objects/crystalSwitch';
import { FloorSwitch } from 'app/content/objects/floorSwitch';
import { BallGoal } from 'app/content/objects/ballGoal';
import { playSound } from 'app/musicController';

import { saveGame } from 'app/utils/saveGame';

import {
    AreaInstance, EffectInstance, GameState, ObjectDefinition, ObjectInstance, ObjectStatus,
} from 'app/types';

export function checkIfAllSwitchesAreActivated(state: GameState, area: AreaInstance, switchInstance: BallGoal | CrystalSwitch | FloorSwitch): void {
    // Do nothing if there still exists a switch with the same target that is not active.
    if (area.objects.some(o =>
        (o.definition?.type === 'ballGoal' || o.definition?.type === 'crystalSwitch' || o.definition?.type === 'floorSwitch') &&
        o.definition?.targetObjectId === switchInstance.definition.targetObjectId &&
        o.status !== 'active'
    )) {
        return;
    }

    for (const object of area.objects) {
        if (switchInstance.definition.targetObjectId && object.definition?.id !== switchInstance.definition.targetObjectId) {
            continue;
        }
        activateTarget(state, object, true);
    }
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
        target.onActivate(state);
        return;
    }
    if (target.status === 'hiddenSwitch') {
        changeObjectStatus(state, target, 'normal');
        if (playChime) {
            playSound(state, 'secretChime');
        }
    }
    if (target.status === 'closedSwitch') {
        changeObjectStatus(state, target, 'normal');
        if (playChime) {
            playSound(state, 'secretChime');
        }
    }
}

export function deactivateTarget(state: GameState, target: ObjectInstance): void {
    if (target.onDeactivate) {
        target.onDeactivate(state);
        return;
    }
    if (target.definition?.status === 'closedSwitch' && !target.definition.saveStatus) {
        changeObjectStatus(state, target, 'closedSwitch');
    }
}

export function toggleTarget(state: GameState, target: ObjectInstance): void {
    const isActive = target.isActive
        ? target.isActive(state)
        : target.status !== 'hidden' && target.status !== 'hiddenSwitch' && target.status !== 'closedSwitch'
            && target.status !== 'off';
    // Consider moving these to properties on `ObjectInstance` instead.
    const playChimeOnActivation = target.definition?.type !== 'anode';
    const playChimeOnDeactivation = target.definition?.type === 'anode';
    if (isActive) {
        deactivateTarget(state, target);
        if (playChimeOnDeactivation) {
            playSound(state, 'secretChime');
        }
    } else {
        activateTarget(state, target);
        if (playChimeOnActivation) {
            playSound(state, 'secretChime');
        }
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

export function saveObjectStatus(this: void, state: GameState, definition: ObjectDefinition, flag: boolean = true): void {
    let treatment = definition.saveStatus;
    // Make sure treatment is forever for locked doors. Might as well do the same for frozen/cracked doors.
    if (definition.type === 'door' && (
        definition.status === 'locked'
        || definition.status === 'bigKeyLocked'
        || definition.status === 'cracked'
        || definition.status === 'frozen'
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
        }
    }
    if (treatment === 'forever' || treatment === 'zone') {
        const hash = treatment === 'forever'
            ? state.savedState.objectFlags
            : state.savedState.zoneFlags;
        if (!definition.id) {
            console.error('Missing object id', definition);
            return;
        }
        if (flag && !hash[definition.id]) {
            hash[definition.id] = true;
            saveGame(state);
        } else if (!flag && hash[definition.id]) {
            delete hash[definition.id];
            saveGame(state);
        }
    }
}

export function getObjectStatus(this: void, state: GameState, definition: ObjectDefinition): boolean {
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
    return !!state.savedState.zoneFlags[definition.id] || !!state.savedState.objectFlags[definition.id];
}

export function getObjectBehaviors(this: void, state: GameState, object: ObjectInstance | EffectInstance) {
    return object.behaviors || object.getBehaviors?.(state);
}
