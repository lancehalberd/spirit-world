import {sceneHash} from 'app/scenes/sceneHash';

export function showIntroScene(state: GameState) {
    state.sceneStack = [sceneHash.intro];
    sceneHash.intro.prologueTime = 0;
}
