import {FRAME_LENGTH, GAME_KEY, isDebugMode} from 'app/gameConstants';
import {initializeGame} from 'app/initialize';
import {isGamePaused, showPauseScene} from 'app/scenes/pause/pauseScene';
import {updateSkipCutscene} from 'app/scriptEvents';
import {getState} from 'app/state';
import {updateKeyboardState} from 'app/userInput';
import {areAllImagesLoaded} from 'app/utils/images';
import {updateSoundSettings} from 'app/utils/soundSettings';
import {KEY, isKeyboardKeyDown, wasGameKeyPressed} from 'app/userInput';

let isGameInitialized = false;
export function update() {
    // Don't run the main loop until everything necessary is initialized.
    if (!isGameInitialized) {
        if (areAllImagesLoaded())  {
            initializeGame();
            isGameInitialized = true;
            updateSoundSettings(getState());
        }
        return;
    }
    const state = getState();
    state.time += FRAME_LENGTH;
    updateKeyboardState(state);
    // HUD opacity always updates currently.
    if (state.hideHUD && state.hudOpacity > 0) {
        state.hudOpacity = Math.max(0, state.hudOpacity - FRAME_LENGTH / 400);
    } else if (!state.hideHUD && state.hudOpacity < 1) {
        state.hudOpacity = Math.min(1, state.hudOpacity + FRAME_LENGTH / 400);
    }
    // Always allow pausing the game if debug mode is enabled.
    if (isDebugMode && wasGameKeyPressed(state, GAME_KEY.MENU) && isKeyboardKeyDown(KEY.SHIFT) && !isGamePaused(state)) {
        // This is a noop if the game is already paused.
        showPauseScene(state);
        return;
    }
    if (updateSkipCutscene(state)) {
        // Do not process any updates on the same frame a cutscene was skipped just to be safe.
        // At the very least we should block input on this frame to avoid opening the menu since the player
        // pressed the MENU button this frame to skip the cutscene.
        return;
    }
    // Make a copy of the scene stack before processing it so that we ignore any updates to the scene stack
    // this frame until the next frame.
    const sceneStack = [...state.sceneStack];
    let blocksInput = false;
    for (let i = sceneStack.length - 1; i >= 0; i--) {
        const scene = sceneStack[i];
        if (!scene) {
            debugger;
        }
        scene.update?.(state, !blocksInput);
        if (!blocksInput) {
            blocksInput = scene.blocksInput;
        }
        // Skip updating scenes below this if this scene blocks updates.
        if (scene.blocksUpdates) {
            break;
        }
    }
}
