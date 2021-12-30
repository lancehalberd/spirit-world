import { find } from 'lodash';

import { Enemy } from 'app/content/enemy';
import { BigChest, ChestObject, LootObject } from 'app/content/lootObject';
import { CrystalSwitch } from 'app/content/crystalSwitch';
import { Door } from 'app/content/door';
import { FloorSwitch } from 'app/content/floorSwitch';
import { PushPullObject } from 'app/content/pushPullObject';
import { RollingBallObject } from 'app/content/rollingBallObject';
import { TippableObject } from 'app/content/tippableObject';

import { AirBubbles } from 'app/content/objects/airBubbles';
import { Decoration } from 'app/content/objects/decoration';
import { BallGoal } from 'app/content/objects/ballGoal';
import { BeadCascade, BeadGrate } from 'app/content/objects/beadCascade';
import { KeyBlock } from 'app/content/objects/keyBlock';
import { Marker } from 'app/content/objects/marker';
import { Narration } from 'app/content/objects/narration';
import { NPC } from 'app/content/objects/npc';
import { PitEntrance } from 'app/content/objects/pitEntrance';
import { Sign } from 'app/content/objects/sign';
import { StaffTowerPoint }  from 'app/content/objects/staffTowerPoint';
import { Teleporter } from 'app/content/objects/teleporter';
import { Torch } from 'app/content/objects/torch';
import { VineSprout } from 'app/content/objects/vineSprout';
import { WaterPot } from 'app/content/objects/waterPot';
import { playSound } from 'app/utils/sounds';

import { saveGame } from 'app/state';

import {
    AreaInstance, GameState, ObjectDefinition, ObjectInstance, ObjectStatus,
} from 'app/types';

export function createObjectInstance(state: GameState, object: ObjectDefinition): ObjectInstance {
    if (object.type === 'airBubbles') {
        return new AirBubbles(state, object);
    } else if (object.type === 'ballGoal') {
        return new BallGoal(object);
    } else if (object.type === 'beadGrate') {
        return new BeadGrate(state, object);
    } else if (object.type === 'beadCascade') {
        return new BeadCascade(state, object);
    } else  if (object.type === 'decoration') {
        return new Decoration(object);
    } else if (object.type === 'enemy' || object.type === 'boss') {
        return new Enemy(state, object);
    } else if (object.type === 'loot') {
        return new LootObject(state, object);
    } else if (object.type === 'bigChest') {
        return new BigChest(state, object);
    } else if (object.type === 'chest') {
        return new ChestObject(state, object);
    } else if (object.type === 'door' || object.type === 'stairs') {
        return new Door(state, object);
    } else if (object.type === 'floorSwitch') {
        return new FloorSwitch(state, object);
    } else if (object.type === 'keyBlock') {
        return new KeyBlock(state, object);
    }  else if (object.type === 'npc') {
        return new NPC(object);
    } else if (object.type === 'tippable') {
        return new TippableObject(object);
    } else if (object.type === 'rollingBall') {
        return new RollingBallObject(object);
    } else if (object.type === 'pushPull') {
        return new PushPullObject(object);
    } else if (object.type === 'crystalSwitch') {
        return new CrystalSwitch(state, object);
    } else if (object.type === 'pitEntrance') {
        return new PitEntrance(object);
    } else if (object.type === 'marker') {
        return new Marker(object);
    } else if (object.type === 'narration') {
        return new Narration(state, object);
    } else if (object.type === 'sign') {
        return new Sign(object);
    } else if (object.type === 'staffTowerPoint') {
        return new StaffTowerPoint(state, object);
    }  else if (object.type === 'teleporter') {
        return new Teleporter(state, object);
    } else if (object.type === 'torch') {
        return new Torch(state, object);
    } else if (object.type === 'vineSprout') {
        return new VineSprout(state, object);
    } else if (object.type === 'waterPot') {
        return new WaterPot(state, object);
    }

    console.error('Unhandled object type', object.type, object);
    return null;
}

export function findObjectInstanceById(areaInstance: AreaInstance, id: string, allowMissing: boolean = false): ObjectInstance {
    const object = find(areaInstance.objects, {definition: {id}});
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
            playSound('secretChime');
        }
    }
    if (target.status === 'closedSwitch') {
        changeObjectStatus(state, target, 'normal');
        if (playChime) {
            playSound('secretChime');
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
        : target.status !== 'hidden' && target.status !== 'hiddenSwitch' && target.status !== 'closedSwitch';
    if (isActive) {
        deactivateTarget(state, target);
    } else {
        activateTarget(state, target);
        playSound('secretChime');
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
    if (!treatment) {
        if (definition.type === 'boss') {
            treatment = 'forever';
        } else if (definition.type === 'enemy') {
            treatment = 'zone';
        } else if (definition.type === 'narration') {
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
            saveGame();
        } else if (!flag && hash[definition.id]) {
            delete hash[definition.id];
            saveGame();
        }
    }
}

export function getObjectStatus(this: void, state: GameState, definition: ObjectDefinition): boolean {
    if (!definition.id) {
        return false;
    }
    return state.savedState.zoneFlags[definition.id] || state.savedState.objectFlags[definition.id];
}
