import {
    FRAME_LENGTH,
    FADE_IN_DURATION, FADE_OUT_DURATION,
    FAST_FADE_IN_DURATION, FAST_FADE_OUT_DURATION,
    CIRCLE_WIPE_IN_DURATION, CIRCLE_WIPE_OUT_DURATION,
    WATER_TRANSITION_DURATION,
} from 'app/gameConstants';
import {updateCamera} from 'app/updateCamera';
import {enterLocation} from 'app/utils/enterLocation';


export function updateMutation(state: GameState, mutationState: MutationState) {
    mutationState.time += FRAME_LENGTH;
    if (mutationState.time === mutationState.duration) {
        enterLocation(state, {
                ...state.location,
                x: state.hero.x,
                y: state.hero.y,
            }, {
            isMutation: true,
        });
        updateCamera(state);
        delete state.mutationState;
    }
}

function switchToTransitionLocation(state: GameState, transitionState: TransitionState) {
    enterLocation(state, transitionState.nextLocation, {
        isEndOfTransition: true,
        callback: transitionState.callback,
    });
    updateCamera(state);
}

export function updateTransition(state: GameState, transitionState: TransitionState) {
    transitionState.time += FRAME_LENGTH;
    if (transitionState.type === 'diving' || transitionState.type === 'surfacing') {
        if (state.hero.z > transitionState.nextLocation.z) {
            state.hero.z = Math.max(transitionState.nextLocation.z, state.hero.z - 2.5);
        } else if (state.hero.z < transitionState.nextLocation.z) {
            state.hero.z = Math.min(transitionState.nextLocation.z, state.hero.z + 2.5);
        }
        if (transitionState.time === WATER_TRANSITION_DURATION) {
            delete state.transitionState;
        }
    } else if (transitionState.type === 'portal') {
        if (transitionState.time === CIRCLE_WIPE_OUT_DURATION) {
            switchToTransitionLocation(state, transitionState);
            delete state.transitionState;
        }
    } else if (transitionState.type === 'fade' || transitionState.type === 'fastFade') {
        const isFast = transitionState.type === 'fastFade';
        const fadeInDuration = isFast ? FAST_FADE_IN_DURATION : FADE_IN_DURATION;
        const fadeOutDuration = isFast ? FAST_FADE_OUT_DURATION : FADE_OUT_DURATION;
        if (transitionState.time === fadeOutDuration) {
            switchToTransitionLocation(state, transitionState);
        } else if (transitionState.time > fadeOutDuration + fadeInDuration) {
            delete state.transitionState;
        }
    } else {
        if (transitionState.time === CIRCLE_WIPE_OUT_DURATION) {
            switchToTransitionLocation(state, transitionState);
        } else if (transitionState.time > CIRCLE_WIPE_OUT_DURATION + CIRCLE_WIPE_IN_DURATION) {
            delete state.transitionState;
        }
    }
}
