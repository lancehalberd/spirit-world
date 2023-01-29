import { Enemy } from 'app/content/enemy';
import { BigChest, ChestObject, LootObject, ShopObject } from 'app/content/objects/lootObject';
import { CrystalSwitch } from 'app/content/objects/crystalSwitch';
import { Door } from 'app/content/objects/door';
import { FloorSwitch } from 'app/content/objects/floorSwitch';
import { Anode, Cathode } from 'app/content/objects/lightningBarrier';
import { PushPullObject } from 'app/content/objects/pushPullObject';
import { RollingBallObject } from 'app/content/objects/rollingBallObject';
import { SaveStatue } from 'app/content/objects/saveStatue';
import { TippableObject } from 'app/content/objects/tippableObject';
import { WallTurret } from 'app/content/objects/wallTurret';

import { AirBubbles } from 'app/content/objects/airBubbles';
import { Decoration } from 'app/content/objects/decoration';
import { Escalator } from 'app/content/objects/escalator';
import { BallGoal } from 'app/content/objects/ballGoal';
import { BeadCascade, BeadGrate } from 'app/content/objects/beadCascade';
import { Indicator } from 'app/content/objects/indicator';
import { KeyBlock } from 'app/content/objects/keyBlock';
import { Marker } from 'app/content/objects/marker';
import { Narration } from 'app/content/objects/narration';
import { NPC } from 'app/content/objects/npc';
import { PitEntrance } from 'app/content/objects/pitEntrance';
import { Sign } from 'app/content/objects/sign';
import { SpikeBall } from 'app/content/objects/spikeBall';
import { Teleporter } from 'app/content/objects/teleporter';
import { Torch } from 'app/content/objects/torch';
import { VineSprout } from 'app/content/objects/vineSprout';
import { Waterfall } from 'app/content/objects/waterfall';
import { WaterPot } from 'app/content/objects/waterPot';

import {
    GameState, ObjectDefinition, ObjectInstance,
} from 'app/types';

export function createObjectInstance(state: GameState, object: ObjectDefinition): ObjectInstance {
    if (object.type === 'anode') {
        return new Anode(state, object);
    } else if (object.type === 'cathode') {
        return new Cathode(object);
    } else if (object.type === 'airBubbles') {
        return new AirBubbles(state, object);
    } else if (object.type === 'ballGoal') {
        return new BallGoal(object);
    } else if (object.type === 'beadGrate') {
        return new BeadGrate(state, object);
    } else if (object.type === 'beadCascade') {
        return new BeadCascade(state, object);
    } else  if (object.type === 'decoration') {
        return new Decoration(object);
    } else if (object.type === 'indicator') {
        return new Indicator(state, object);
    } else  if (object.type === 'waterfall') {
        return new Waterfall(object);
    }  else if (object.type === 'enemy' || object.type === 'boss') {
        return new Enemy(state, object);
    } else if (object.type === 'loot') {
        return new LootObject(state, object);
    } else if (object.type === 'bigChest') {
        return new BigChest(state, object);
    } else if (object.type === 'shopItem') {
        return new ShopObject(state, object);
    } else if (object.type === 'chest') {
        return new ChestObject(state, object);
    } else if (object.type === 'door' || object.type === 'stairs') {
        return new Door(state, object);
    } else if (object.type === 'escalator') {
        return new Escalator(state, object);
    }  else if (object.type === 'floorSwitch') {
        return new FloorSwitch(state, object);
    } else if (object.type === 'keyBlock') {
        return new KeyBlock(state, object);
    } else if (object.type === 'npc') {
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
    } else if (object.type === 'marker' || object.type === 'spawnMarker') {
        return new Marker(object);
    } else if (object.type === 'narration') {
        return new Narration(state, object);
    } else if (object.type === 'saveStatue') {
        return new SaveStatue(object);
    } else if (object.type === 'sign') {
        return new Sign(object);
    } else if (object.type === 'spikeBall') {
        return new SpikeBall(state, object);
    }  else if (object.type === 'teleporter') {
        return new Teleporter(state, object);
    } else if (object.type === 'torch') {
        return new Torch(state, object);
    } else if (object.type === 'vineSprout') {
        return new VineSprout(state, object);
    } else if (object.type === 'turret') {
        return new WallTurret(state, object);
    }  else if (object.type === 'waterPot') {
        return new WaterPot(state, object);
    }

    console.error('Unhandled object type', object.type, object);
    return null;
}
