import { objectHash } from 'app/content/objects/objectHash';


export function createObjectInstance(state: GameState, object: ObjectDefinition): ObjectInstance {
    if (!objectHash[object.type]) {
        console.error('Unhandled object type', object.type, object);
        debugger;
        return null;
    }
    return new objectHash[object.type](state, object);
}
