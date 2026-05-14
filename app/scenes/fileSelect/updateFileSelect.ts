import {GAME_KEY} from 'app/gameConstants';
import {getFileSelectOptions, popMenuStack} from 'app/scenes/fileSelect/getFileSelectOptions';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import {playSound} from 'app/utils/sounds';
import {saveSettings} from 'app/utils/saveSettings';

import type {FileSelectScene} from 'app/scenes/fileSelect/fileSelectScene';

export function updateFileSelect(state: GameState, scene: FileSelectScene) {
    // Randomizer is unlocked by default outside of the demo.
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
        return;
    }
    if (wasGameKeyPressed(state, GAME_KEY.CANCEL)) {
        popMenuStack(state, scene);
        return;
    }
    if (wasGameKeyPressed(state, GAME_KEY.LEFT)) {
        highlightedOption.onLeft?.(state, scene);
    }
    if (wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
        highlightedOption.onRight?.(state, scene);
    }
}


