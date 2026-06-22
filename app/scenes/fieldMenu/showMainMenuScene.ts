import {showPauseScene} from 'app/scenes/pause/pauseScene';
import {pushScene, sceneHash} from 'app/scenes/sceneHash';
import {canOpenMenu} from 'app/state';
import {KEY, isKeyboardKeyDown} from 'app/userInput';
import {updateSoundSettings} from 'app/utils/soundSettings';

export function showMainMenuScene(state: GameState) {
    if (canOpenMenu(state)) {
        sceneHash.mainMenu.needsRefresh = true;
        sceneHash.mainMenu.update(state, false);
        pushScene(state, sceneHash.mainMenu);
        updateSoundSettings(state);
    } else if (isKeyboardKeyDown(KEY.SHIFT)){
        showPauseScene(state);
    }
}

export function isMainMenuSceneInStack(state: GameState) {
    return state.sceneStack.includes(sceneHash.mainMenu);
}

export function hideMainMenuScene(state: GameState) {
    sceneHash.mainMenu.closeScene(state);
}
