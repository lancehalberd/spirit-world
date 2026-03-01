/**
 * Remove any temporary effects from the state such as script events,
 * transition effects, screen shakes, defeated state, camera speed, etc.
 *
 * This is called after setting state from the test menu or after skipping
 * most cutscenes to make sure special settings from the cutscene are
 * removed.
 */
export function cleanState(state: GameState) {
    state.screenShakes = [];
    state.defeatState = {
        defeated: false,
        time: 0,
    };
    state.scriptEvents = {
        activeEvents: [],
        blockEventQueue: false,
        blockFieldUpdates: false,
        blockPlayerInput: false,
        blockPlayerUpdates: false,
        handledInput: false,
        queue: [],
    };
    state.paused = false;
    state.hideHUD = false;
    delete state.camera.speed;
    delete state.hero.action;
    delete state.messagePage;
    delete state.transitionState;
}
