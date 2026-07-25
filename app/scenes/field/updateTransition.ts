import {
    FRAME_LENGTH,
    FADE_IN_DURATION, FADE_OUT_DURATION,
    FAST_FADE_IN_DURATION, FAST_FADE_OUT_DURATION,
    CIRCLE_WIPE_IN_DURATION, CIRCLE_WIPE_OUT_DURATION,
    WATER_TRANSITION_DURATION,
} from 'app/gameConstants';
import {finishTransition, finishMutation} from 'app/utils/enterLocation';


export function updateMutation(state: GameState, mutationState: MutationState) {
    mutationState.time += FRAME_LENGTH;
    if (mutationState.time >= mutationState.duration) {
        finishMutation(state);
    }
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
            const applyEnvironmentChangesGradually = true;
            finishTransition(state, applyEnvironmentChangesGradually);
        }
    } else if (transitionState.type === 'portal') {
        if (transitionState.time === CIRCLE_WIPE_OUT_DURATION) {
            const applyEnvironmentChangesGradually = true;
            finishTransition(state, applyEnvironmentChangesGradually);
        }
    } else if (transitionState.type === 'fade' || transitionState.type === 'fastFade') {
        const isFast = transitionState.type === 'fastFade';
        const fadeInDuration = isFast ? FAST_FADE_IN_DURATION : FADE_IN_DURATION;
        const fadeOutDuration = isFast ? FAST_FADE_OUT_DURATION : FADE_OUT_DURATION;
        if (transitionState.time === fadeOutDuration) {
            // Since we cut fully to black, we should apply environment changes instantly.
            const applyEnvironmentChangesGradually = false;
            // The transition isn't finished yet so we cannot delete transitionState yet.
            const preserveTransitionState = true;
            finishTransition(state, applyEnvironmentChangesGradually, preserveTransitionState);
        } else if (transitionState.time > fadeOutDuration + fadeInDuration) {
            delete state.transitionState;
        }
    } else {
        if (transitionState.time === CIRCLE_WIPE_OUT_DURATION) {
            // Since we cut fully to black, we should apply environment changes instantly.
            const applyEnvironmentChangesGradually = false;
            // The transition isn't finished yet so we cannot delete transitionState yet.
            const preserveTransitionState = true;
            finishTransition(state, applyEnvironmentChangesGradually, preserveTransitionState);
        } else if (transitionState.time > CIRCLE_WIPE_OUT_DURATION + CIRCLE_WIPE_IN_DURATION) {
            delete state.transitionState;
        }
    }
}
