import _ from 'lodash';

import { Enemy } from 'app/content/enemy';
import { ChestObject, LootObject } from 'app/content/lootObject';

import {
    GameState, ObjectDefinition, ObjectInstance,
} from 'app/types';

export function createObjectInstance(state: GameState, object: ObjectDefinition): ObjectInstance {
    if (object.type === 'enemy') {
        return new Enemy(object);
    } else if (object.type === 'loot' && !state.savedState.collectedItems[object.id]) {
        return new LootObject(object);
    } else if (object.type === 'chest') {
        return new ChestObject(object);
    }

    console.error('Unhandled object type', object.type, object);
    return null;
}
