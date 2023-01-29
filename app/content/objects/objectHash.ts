import { GameState, ObjectDefinition, ObjectInstance } from 'app/types';

interface ObjectInstanceConstructor {
    new (state: GameState, definition: ObjectDefinition): ObjectInstance 
}

export const objectHash: {[key in string]: ObjectInstanceConstructor} = {};
window['objectHash'] = objectHash;
