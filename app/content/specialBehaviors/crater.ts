import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { appendScript } from 'app/scriptEvents';
import { saveGame } from 'app/utils/saveGame';

specialBehaviorsHash.craterLavaSwitch = {
    type: 'floorSwitch',
    onActivate(state: GameState, object: ObjectInstance) {
        // The first time a switch for the tomb entrance is activated, the rival,
        // who is guarding the tomb, becomes enraged triggering a small boss fight.
        if (!state.savedState.objectFlags.craterLava1) {
            state.savedState.objectFlags.craterLava1 = true;
            // Make sure this is set to true before saving so that if the player refreshes
            // before the end of the animation, this flag is still set.
            state.savedState.objectFlags.craterLava1Objects = true;
            saveGame(state);
            // Set this flag to false while the animation plays out so that objects under
            // the lava don't appear until the animation completes.
            state.savedState.objectFlags.craterLava1Objects = false;
            state.savedState.objectFlags.craterLavaAnimation1_1 = true;
            object.area.needsLogicRefresh = true;
            state.mutationDuration = 200;
            // appendScript(state, '{startScreenShake:2:0:craterLava}');
            state.screenShakes.push({
                dx: 0.7,
                dy: 0.7,
                startTime: state.fieldTime,
                id: 'craterLava',
            });
            state.scriptEvents.activeEvents.push({
                type: 'update',
                update(state: GameState) {
                    // Do nothing if the game is still running a transition.
                    if (state.transitionState) {
                        return true;
                    }
                    if (state.savedState.objectFlags.craterLavaAnimation1_1) {
                        state.savedState.objectFlags.craterLavaAnimation1_1 = false;
                        state.savedState.objectFlags.craterLavaAnimation1_2 = true;
                        object.area.needsLogicRefresh = true;
                        return true;
                    }
                    if (state.savedState.objectFlags.craterLavaAnimation1_2) {
                        state.savedState.objectFlags.craterLavaAnimation1_2 = false;
                        state.savedState.objectFlags.craterLavaAnimation1_3 = true;
                        object.area.needsLogicRefresh = true;
                        return true;
                    }
                    if (state.savedState.objectFlags.craterLavaAnimation1_3) {
                        state.savedState.objectFlags.craterLavaAnimation1_3 = false;
                        state.savedState.objectFlags.craterLavaAnimation1_4 = true;
                        object.area.needsLogicRefresh = true;
                        return true;
                    }
                    if (state.savedState.objectFlags.craterLavaAnimation1_4) {
                        state.savedState.objectFlags.craterLavaAnimation1_4 = false;
                        state.savedState.objectFlags.craterLavaAnimation1_5 = true;
                        object.area.needsLogicRefresh = true;
                        return true;
                    }
                    if (state.savedState.objectFlags.craterLavaAnimation1_5) {
                        state.savedState.objectFlags.craterLavaAnimation1_5 = false;
                        state.savedState.objectFlags.craterLavaAnimation1_6 = true;
                        object.area.needsLogicRefresh = true;
                        return true;
                    }
                    if (state.savedState.objectFlags.craterLavaAnimation1_6) {
                        state.savedState.objectFlags.craterLavaAnimation1_6 = false;
                        state.savedState.objectFlags.craterLava1Objects = true;
                        object.area.needsLogicRefresh = true;
                        return true;
                    }
                    delete state.mutationDuration;
                    appendScript(state, '{stopScreenShake:craterLava}');
                    return false;
                }
            });
            state.scriptEvents.activeEvents.push({
                type: 'wait',
                time: 0,
                waitingOnActiveEvents: true,
                // Make sure the fight doesn't continue during this cutscene.
                blockFieldUpdates: true,
            });
        }
    },
};
