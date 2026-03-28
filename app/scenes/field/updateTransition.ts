import {
    FRAME_LENGTH,
    FADE_IN_DURATION, FADE_OUT_DURATION,
    FAST_FADE_IN_DURATION, FAST_FADE_OUT_DURATION,
    GAME_KEY,
    CIRCLE_WIPE_IN_DURATION, CIRCLE_WIPE_OUT_DURATION,
    MUTATE_DURATION, WATER_TRANSITION_DURATION,
} from 'app/gameConstants';
import {showPauseScene} from 'app/scenes/pause/pauseScene';
import {updateCamera} from 'app/updateCamera';
import {isKeyboardKeyDown, KEY, wasGameKeyPressed} from 'app/userInput';
import {enterLocation} from 'app/utils/enterLocation';


export function updateTransition(state: GameState) {
    if (isKeyboardKeyDown(KEY.SHIFT) && wasGameKeyPressed(state, GAME_KEY.MENU)) {
        showPauseScene(state);
        return;
    }
    state.transitionState.time += FRAME_LENGTH;
    if (state.transitionState.type === 'diving' || state.transitionState.type === 'surfacing') {
        if (state.hero.z > state.transitionState.nextLocation.z) {
            state.hero.z = Math.max(state.transitionState.nextLocation.z, state.hero.z - 2.5);
        } else if (state.hero.z < state.transitionState.nextLocation.z) {
            state.hero.z = Math.min(state.transitionState.nextLocation.z, state.hero.z + 2.5);
        }
        if (state.transitionState.time === WATER_TRANSITION_DURATION) {
            enterLocation(state, state.transitionState.nextLocation, {
                instant: true,
                isEndOfTransition: true,
                callback: state.transitionState.callback,
            });
            updateCamera(state);
            state.transitionState = null;
        }
    } else if (state.transitionState.type === 'mutating') {
        if (state.transitionState.time === (state.mutationDuration || MUTATE_DURATION)) {
            enterLocation(state, state.transitionState.nextLocation, {
                instant: true,
                isMutation: true,
                callback: state.transitionState.callback,
            });
            updateCamera(state);
            state.transitionState = null;
        }
    } else if (state.transitionState.type === 'portal') {
        if (state.transitionState.time === CIRCLE_WIPE_OUT_DURATION) {
            enterLocation(state, state.transitionState.nextLocation, {
                instant: true,
                isEndOfTransition: true,
                callback: state.transitionState.callback,
            });
            updateCamera(state);
            state.transitionState = null;
        }
    } else if (state.transitionState.type === 'fade' || state.transitionState.type === 'fastFade') {
        const isFast = state.transitionState.type === 'fastFade';
        const fadeInDuration = isFast ? FAST_FADE_IN_DURATION : FADE_IN_DURATION;
        const fadeOutDuration = isFast ? FAST_FADE_OUT_DURATION : FADE_OUT_DURATION;
        if (state.transitionState.time === fadeOutDuration) {
            enterLocation(state, state.transitionState.nextLocation, {
                instant: true,
                callback: state.transitionState.callback,
            });
            updateCamera(state);
        } else if (state.transitionState.time > fadeOutDuration + fadeInDuration) {
            state.transitionState = null;
        }
    } else {
        if (state.transitionState.time === CIRCLE_WIPE_OUT_DURATION) {
            enterLocation(state, state.transitionState.nextLocation, {
                instant: true,
                callback: state.transitionState.callback,
            });
            updateCamera(state);
        } else if (state.transitionState.time > CIRCLE_WIPE_OUT_DURATION + CIRCLE_WIPE_IN_DURATION) {
            state.transitionState = null;
        }
    }
}
