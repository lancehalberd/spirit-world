import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import {playAreaSound, stopAreaSound} from 'app/musicController';
import { appendScript } from 'app/scriptEvents';
import { saveGame } from 'app/utils/saveGame';
import {updateAllHeroes} from 'app/updateActor';

specialBehaviorsHash.craterLavaSwitch = {
    type: 'heavyFloorSwitch',
    onActivate(state: GameState, object: ObjectInstance) {
        if (state.savedState.objectFlags.craterLava1) {
            return;
        }
        // Set the desired end state flags and save first.
        // This will cause the game to be in the correct state
        // if the player reloads the game while the animation plays.
        state.savedState.objectFlags.craterLava1 = true;
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
        const rumbleSoundReference = playAreaSound(state, state.areaInstance, 'rumble');
        state.scriptEvents.activeEvents.push({
            type: 'update',
            update(state: GameState) {
                // Keep updating the hero (with controls disabled), to avoid getting stuck in an awkward frame
                // such as slamming the staff.
                updateAllHeroes(state);
                // Wait for the current transition to complete before starting the next.
                if (state.transitionState) {
                    return true;
                }
                if (state.savedState.objectFlags.craterLavaAnimation1_1) {
                    delete state.savedState.objectFlags.craterLavaAnimation1_1;
                    state.savedState.objectFlags.craterLavaAnimation1_2 = true;
                    object.area.needsLogicRefresh = true;
                    return true;
                }
                if (state.savedState.objectFlags.craterLavaAnimation1_2) {
                    delete state.savedState.objectFlags.craterLavaAnimation1_2;
                    state.savedState.objectFlags.craterLavaAnimation1_3 = true;
                    object.area.needsLogicRefresh = true;
                    return true;
                }
                if (state.savedState.objectFlags.craterLavaAnimation1_3) {
                    delete state.savedState.objectFlags.craterLavaAnimation1_3;
                    state.savedState.objectFlags.craterLavaAnimation1_4 = true;
                    object.area.needsLogicRefresh = true;
                    return true;
                }
                if (state.savedState.objectFlags.craterLavaAnimation1_4) {
                    delete state.savedState.objectFlags.craterLavaAnimation1_4;
                    state.savedState.objectFlags.craterLavaAnimation1_5 = true;
                    object.area.needsLogicRefresh = true;
                    return true;
                }
                if (state.savedState.objectFlags.craterLavaAnimation1_5) {
                    delete state.savedState.objectFlags.craterLavaAnimation1_5;
                    state.savedState.objectFlags.craterLavaAnimation1_6 = true;
                    object.area.needsLogicRefresh = true;
                    return true;
                }
                if (state.savedState.objectFlags.craterLavaAnimation1_6) {
                    delete state.savedState.objectFlags.craterLavaAnimation1_6;
                    state.savedState.objectFlags.craterLava1Objects = true;
                    object.area.needsLogicRefresh = true;
                    return true;
                }
                delete state.mutationDuration;
                appendScript(state, '{stopScreenShake:craterLava}');
                stopAreaSound(state, rumbleSoundReference);
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
    },
};


function drainFlameBeastLava(state: GameState) {
    state.savedState.objectFlags.craterLava4 = true;
    state.savedState.objectFlags.craterLavaAnimation4_1 = true;
    state.areaInstance.needsLogicRefresh = true;
    state.mutationDuration = 200;
    state.screenShakes.push({
        dx: 0.7,
        dy: 0.7,
        startTime: state.fieldTime,
        id: 'craterLava',
    });
    const rumbleSoundReference = playAreaSound(state, state.areaInstance, 'rumble');
    state.scriptEvents.activeEvents.push({
        type: 'update',
        update(state: GameState) {
            // Keep updating the hero (with controls disabled), to avoid getting stuck in an awkward frame
            // such as slamming the staff.
            updateAllHeroes(state);
            // Wait for the current transition to complete before starting the next.
            if (state.transitionState) {
                return true;
            }
            if (state.savedState.objectFlags.craterLavaAnimation4_1) {
                delete state.savedState.objectFlags.craterLavaAnimation4_1;
                state.savedState.objectFlags.craterLavaAnimation4_2 = true;
                state.areaInstance.needsLogicRefresh = true;
                return true;
            }
            if (state.savedState.objectFlags.craterLavaAnimation4_2) {
                delete state.savedState.objectFlags.craterLavaAnimation4_2;
                state.savedState.objectFlags.craterLavaAnimation4_3 = true;
                state.areaInstance.needsLogicRefresh = true;
                return true;
            }
            if (state.savedState.objectFlags.craterLavaAnimation4_3) {
                delete state.savedState.objectFlags.craterLavaAnimation4_3;
                state.savedState.objectFlags.craterLavaAnimation4_4 = true;
                // This is the frame the lava reaches the floor.
                state.savedState.objectFlags.craterLava4Objects = true;
                state.areaInstance.needsLogicRefresh = true;
                return true;
            }
            if (state.savedState.objectFlags.craterLavaAnimation4_4) {
                delete state.savedState.objectFlags.craterLavaAnimation4_4;
                state.savedState.objectFlags.craterLavaAnimation4_5 = true;
                state.areaInstance.needsLogicRefresh = true;
                return true;
            }
            if (state.savedState.objectFlags.craterLavaAnimation4_5) {
                delete state.savedState.objectFlags.craterLavaAnimation4_5;
                state.areaInstance.needsLogicRefresh = true;
                return true;
            }
            delete state.mutationDuration;
            appendScript(state, '{stopScreenShake:craterLava}');
            stopAreaSound(state, rumbleSoundReference);
            return false;
        }
    });
    state.scriptEvents.activeEvents.push({
        type: 'wait',
        time: 0,
        waitingOnActiveEvents: true,
        blockFieldUpdates: true,
    });
}

export function fillFlameBeastLava(state: GameState) {
    const startTime = state.fieldTime;
    state.mutationDuration = 20;
    state.screenShakes.push({
        dx: 0.7,
        dy: 0.7,
        startTime: state.fieldTime,
        id: 'craterLava',
    });
    const rumbleSoundReference = playAreaSound(state, state.areaInstance, 'rumble');
    state.scriptEvents.activeEvents.push({
        type: 'update',
        update(state: GameState) {
            const timeElapsed = state.fieldTime - startTime;
            // Do nothing if the game is still running a transition.
            if (timeElapsed === 2000) {
                state.savedState.objectFlags.craterLavaAnimation4_5 = true;
                state.areaInstance.needsLogicRefresh = true;
            }
            if (timeElapsed >= 3000 && state.savedState.objectFlags.craterLavaAnimation4_5) {
                delete state.savedState.objectFlags.craterLavaAnimation4_5;
                state.savedState.objectFlags.craterLavaAnimation4_4 = true;
                state.areaInstance.needsLogicRefresh = true;
            }
            if (timeElapsed >= 4000 && state.savedState.objectFlags.craterLavaAnimation4_4) {
                delete state.savedState.objectFlags.craterLavaAnimation4_4;
                // This is the frame the lava starts rising vertically.
                delete state.savedState.objectFlags.craterLava4Objects;
                state.savedState.objectFlags.craterLavaAnimation4_3 = true;
                state.areaInstance.needsLogicRefresh = true;
            }
            if (timeElapsed >= 4800 && state.savedState.objectFlags.craterLavaAnimation4_3) {
                delete state.savedState.objectFlags.craterLavaAnimation4_3;
                state.savedState.objectFlags.craterLavaAnimation4_2 = true;
                state.areaInstance.needsLogicRefresh = true;
            }
            if (timeElapsed >= 5600 && state.savedState.objectFlags.craterLavaAnimation4_2) {
                delete state.savedState.objectFlags.craterLavaAnimation4_2;
                state.savedState.objectFlags.craterLavaAnimation4_1 = true;
                state.areaInstance.needsLogicRefresh = true;
            }
            if (timeElapsed >= 6400 && state.savedState.objectFlags.craterLavaAnimation4_1) {
                delete state.savedState.objectFlags.craterLavaAnimation4_1;
                delete state.savedState.objectFlags.craterLava4;
                state.areaInstance.needsLogicRefresh = true;
            }
            if (timeElapsed >= 7000) {
                delete state.mutationDuration;
                appendScript(state, '{stopScreenShake:craterLava}');
                stopAreaSound(state, rumbleSoundReference);
                return false;
            }
            return true;
        }
    });
    /*state.scriptEvents.activeEvents.push({
        type: 'wait',
        time: 0,
        waitingOnActiveEvents: true,
        blockFieldUpdates: true,
        blockPlayerInput: true,
    });*/
}

specialBehaviorsHash.craterLavaSwitch4 = {
    type: 'heavyFloorSwitch',
    onActivate(state: GameState, object: ObjectInstance) {
        if (state.savedState.objectFlags.craterLava4) {
            return;
        }
        // Set the desired end state flags and save first.
        // This will cause the game to be in the correct state
        // if the player reloads the game while the animation plays.
        state.savedState.objectFlags.craterLava4 = true;
        state.savedState.objectFlags.craterLava4Objects = true;
        saveGame(state);
        // Set this flag to false while the animation plays out so that objects under
        // the lava don't appear until the animation completes.
        state.savedState.objectFlags.craterLava4Objects = false;
        drainFlameBeastLava(state);
        // appendScript(state, '{startScreenShake:2:0:craterLava}');
    },
};


specialBehaviorsHash.craterBossSwitch = {
    type: 'heavyFloorSwitch',
    apply(state: GameState, object: HeavyFloorSwitch) {
        object.status = 'active';
    },
    onActivate(state: GameState, object: HeavyFloorSwitch) {
        if (state.savedState.objectFlags.craterLava4) {
            return;
        }
        // Don't do anything until all revealed switches are pressed.
        for (const otherObject of object.area.objects) {
            if (otherObject.definition?.id !== object.definition?.id) {
                continue;
            }
            if (otherObject.status !== 'active') {
                return;
            }
        }
        // Drain lava once all the switches are pressed.
        drainFlameBeastLava(state);
    },
};
