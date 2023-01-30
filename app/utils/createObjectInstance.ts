import { objectHash } from 'app/content/objects/objectHash';

import { GameState, ObjectDefinition, ObjectInstance } from 'app/types';

export function createObjectInstance(state: GameState, object: ObjectDefinition): ObjectInstance {
    if (!objectHash[object.type]) {
        console.error('Unhandled object type', object.type, object);
        return null;
    }
    return new objectHash[object.type](state, object);
}
