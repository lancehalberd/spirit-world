import {FRAME_LENGTH, GAME_KEY} from 'app/gameConstants';
import {initializeGame} from 'app/initialize';
import {
    updateKeyboardState,
    wasGameKeyPressed,
} from 'app/userInput';
import {appendCallback, showMessage, waitForARGameToFinish} from 'app/scriptEvents';
import {getState} from 'app/state';
import {areAllImagesLoaded} from 'app/utils/images';
import {updateSoundSettings} from 'app/utils/soundSettings';

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
    // Player input cannot be blocked while the game is paused, otherwise the player will be unable to unpause the game.
    /*if (state.paused && state.scriptEvents?.blockPlayerInput) {
        delete state.scriptEvents?.blockPlayerInput;
    }*/
    updateKeyboardState(state);
    // Make a copy of the scene stack before processing it so that we ignore any updates to the scene stack
    // this frame until the next frame.
    const sceneStack = [...state.sceneStack];
    if (sceneStack.length) {
        let blockInput = false;
        for (let i = sceneStack.length - 1; i >= 0; i--) {
            const scene = sceneStack[i];
            if (!scene) {
                debugger;
            }
            scene.update(state, !blockInput);
            if (!blockInput) {
                blockInput = scene.blocksInput;
            }
            // Skip updating scenes below this if this scene blocks updates.
            if (scene.blocksUpdates) {
                break;
            }
        }
        return;
    }
    try {
        if (wasGameKeyPressed(state, GAME_KEY.MENU)) {
            //state.hideHUD = false;
            //if (!state.alwaysHideMenu && state.arState.active && canPauseGame(state)) {
            if (state.arState.active && !state.scriptEvents.blockFieldUpdates) {
                const isWaiting = state.scriptEvents.activeEvents.length > 0;
                showMessage(state, '{@arGame.quit}');
                if (isWaiting) {
                    state.scriptEvents.activeEvents = [];
                    state.scriptEvents.blockPlayerUpdates = true;
                    appendCallback(state, () => {
                        waitForARGameToFinish(state);
                        state.scriptEvents.blockPlayerUpdates = true;
                    });
                }
                return;
            }
        }
    } catch (e) {
        console.log(e.stack);
        debugger;
    }
}


