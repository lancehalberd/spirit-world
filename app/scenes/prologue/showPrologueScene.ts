import {sceneHash} from 'app/scenes/sceneHash';

export function showPrologueScene(state: GameState) {
    state.sceneStack = [sceneHash.prologue];
    sceneHash.prologue.time = 0;
}
