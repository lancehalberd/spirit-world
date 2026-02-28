import {isSceneActive, sceneHash} from 'app/scenes/sceneHash';

export function showFieldScene(state: GameState) {
    state.sceneStack = [sceneHash.field];
}

export function isFieldSceneActive(state: GameState): boolean {
    return isSceneActive(state, sceneHash.field);
}

export function isFieldSceneInStack(state: GameState): boolean {
    return state.sceneStack.includes(sceneHash.field);
}
