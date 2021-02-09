import _ from 'lodash';

import { Enemy } from 'app/content/enemy';
import { ChestObject, LootObject } from 'app/content/lootObject';
import { CrystalSwitch } from 'app/content/crystalSwitch';
import { Door } from 'app/content/door';
import { FloorSwitch } from 'app/content/floorSwitch';
import { PushPullObject } from 'app/content/pushPullObject';
import { RollingBallObject } from 'app/content/rollingBallObject';
import { TippableObject } from 'app/content/tippableObject';

import { BallGoal } from 'app/content/objects/ballGoal';
import { Marker } from 'app/content/objects/marker';
import { PitEntrance } from 'app/content/objects/pitEntrance';

import {
    AreaInstance, GameState, ObjectDefinition, ObjectInstance, ObjectStatus,
} from 'app/types';

export function createObjectInstance(state: GameState, object: ObjectDefinition): ObjectInstance {
    if (object.type === 'ballGoal') {
        return new BallGoal(object);
    } else if (object.type === 'enemy') {
        return new Enemy(object);
    } else if (object.type === 'loot') {
        return new LootObject(object);
    } else if (object.type === 'chest') {
        return new ChestObject(state, object);
    } else if (object.type === 'door' || object.type === 'stairs') {
        return new Door(state, object);
    } else if (object.type === 'floorSwitch') {
        return new FloorSwitch(object);
    } else if (object.type === 'tippable') {
        return new TippableObject(object);
    } else if (object.type === 'rollingBall') {
        return new RollingBallObject(object);
    } else if (object.type === 'pushPull') {
        return new PushPullObject(object);
    } else if (object.type === 'crystalSwitch') {
        return new CrystalSwitch(object);
    } else if (object.type === 'pitEntrance') {
        return new PitEntrance(object);
    } else if (object.type === 'marker') {
        return new Marker(object);
    }

    console.error('Unhandled object type', object.type, object);
    return null;
}

export function findObjectInstanceById(areaInstance: AreaInstance, id: string, allowMissing: boolean = false): ObjectInstance {
    const object = _.find(areaInstance.objects, {definition: {id}});
    if (!object && !allowMissing) {
        console.error('Missing target', id);
    }
    return object;
}

export function checkIfAllSwitchesAreActivated(state: GameState, area: AreaInstance, switchInstance: BallGoal | CrystalSwitch | FloorSwitch): void {
    // Do nothing if there still exists a switch with the same target that is not active.
    if (area.objects.some(o =>
        (o.definition?.type === 'ballGoal' || o.definition?.type === 'crystalSwitch' || o.definition?.type === 'floorSwitch') &&
        o.definition?.targetObjectId === switchInstance.definition.targetObjectId &&
        o.status !== 'active'
    )) {
        return;
    }
    if (switchInstance.definition.targetObjectId) {
        const target = findObjectInstanceById(area, switchInstance.definition.targetObjectId);
        if (target) {
            activateTarget(state, target);
        }
        return;
    }
    for (const object of state.areaInstance.objects) {
        activateTarget(state, object);
    }
}

export function deactivateTargets(state: GameState, area: AreaInstance, targetObjectId: string = null): void {
    if (targetObjectId) {
        const target = findObjectInstanceById(area, targetObjectId);
        if (target && target.definition.status === 'closedSwitch') {
            changeObjectStatus(state, target, 'closedSwitch');
        }
        return;
    }
    for (const object of state.areaInstance.objects) {
        if (object.definition?.status === 'closedSwitch') {
            changeObjectStatus(state, object, 'closedSwitch');
        }
    }
}

export function activateTarget(state: GameState, target: ObjectInstance): void {
    if (target.status === 'hiddenSwitch') {
        changeObjectStatus(state, target, 'normal');
    }
    if (target.status === 'closedSwitch') {
        changeObjectStatus(state, target, 'normal');
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
