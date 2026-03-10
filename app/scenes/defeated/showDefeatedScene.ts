import {pushScene, sceneHash} from 'app/scenes/sceneHash';

export function showDefeatedScene(state: GameState) {
    pushScene(state, sceneHash.defeated);
    sceneHash.defeated.time = 0;
    sceneHash.defeated.reviving = false;
}

export function showDefeatedMenuScene(state: GameState) {
    pushScene(state, sceneHash.defeatedMenu);
    sceneHash.defeatedMenu.cursorIndex = 0;
}

export function getActiveDefeatedScene(state: GameState) {
    if (state.sceneStack.includes(sceneHash.defeated)) {
        return sceneHash.defeated;
    }
}
