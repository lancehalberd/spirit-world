import _ from 'lodash';

import { Enemy } from 'app/content/enemy';
import { ChestObject, LootObject } from 'app/content/lootObject';
import { PushPullObject } from 'app/content/pushPullObject';
import { RollingBallObject } from 'app/content/rollingBallObject';
import { TippableObject } from 'app/content/tippableObject';

import {
    GameState, ObjectDefinition, ObjectInstance,
} from 'app/types';

export function createObjectInstance(state: GameState, object: ObjectDefinition): ObjectInstance {
    if (object.type === 'enemy') {
        return new Enemy(object);
    } else if (object.type === 'loot') {
        return new LootObject(object);
    } else if (object.type === 'chest') {
        return new ChestObject(object);
    } else if (object.type === 'tippable') {
        return new TippableObject(object);
    } else if (object.type === 'rollingBall') {
        return new RollingBallObject(object);
    } else if (object.type === 'pushPull') {
        return new PushPullObject(object);
    }

    console.error('Unhandled object type', object.type, object);
    return null;
}
