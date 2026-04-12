import {GAME_KEY} from 'app/gameConstants';
import {getFileSelectOptions} from 'app/scenes/fileSelect/getFileSelectOptions';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import {playSound} from 'app/utils/sounds';
import {saveSettings} from 'app/utils/saveSettings';

import type {FileSelectScene} from 'app/scenes/fileSelect/fileSelectScene';

export function updateFileSelect(state: GameState, scene: FileSelectScene) {
    // Any users that try to use the old URL params for item or entrance randomization
    // will have the randomizer mode automatically unlocked for them instead of
    // manually unlocking it through beating the game or using the context menu.
    if (!state.settings.isRandomizerUnlocked && !state.isDemoMode) {
        state.settings.isRandomizerUnlocked = true;
        saveSettings(state);
    }
    const options = getFileSelectOptions(state, scene);
    let changedOption = false;
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        scene.cursorIndex = (scene.cursorIndex - 1 + options.length) % options.length;
        changedOption = true;
        playSound('menuTick');
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        scene.cursorIndex = (scene.cursorIndex + 1) % options.length;
        changedOption = true;
        playSound('menuTick');
    }
    const highlightedOption = options[scene.cursorIndex];
    if (changedOption) {
        highlightedOption.onHighlight?.(state, scene);
    }
    if (wasConfirmKeyPressed(state)) {
        highlightedOption.onConfirm?.(state, scene);
    }
    if (wasGameKeyPressed(state, GAME_KEY.LEFT)) {
        highlightedOption.onLeft?.(state, scene);
    }
    if (wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
        highlightedOption.onRight?.(state, scene);
    }
}


