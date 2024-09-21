import { refreshAreaLogic } from 'app/content/areas';
import { dungeonMaps } from 'app/content/sections';
import {
    FRAME_LENGTH, GAME_KEY,
    FADE_IN_DURATION, FADE_OUT_DURATION,
    CIRCLE_WIPE_IN_DURATION, CIRCLE_WIPE_OUT_DURATION,
    MUTATE_DURATION, WATER_TRANSITION_DURATION,
} from 'app/gameConstants';
import { initializeGame } from 'app/initialize';
import {
    updateKeyboardState,
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import { updateControls } from 'app/scenes/controls/updateControls';
import { updateDefeated } from 'app/scenes/defeated/updateDefeated';
import { updateInventory } from 'app/scenes/inventory/updateInventory';
import { updatePrologue } from 'app/scenes/prologue/updatePrologue';
import { updateTitle } from 'app/scenes/title/updateTitle';
import {
    canPauseGame,
    getState,
    shouldHideMenu,
} from 'app/state';
import { updateCamera } from 'app/updateCamera';
import { updateField } from 'app/updateField';
import { updateScriptEvents } from 'app/updateScriptEvents';
import { enterLocation } from 'app/utils/enterLocation';
import { areAllImagesLoaded } from 'app/utils/images';
import { updateSoundSettings } from 'app/utils/soundSettings';

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
    try {
        // This has higher priority than anything and basically freezes the game to show the controls.
        if (state.showControls) {
            updateControls(state);
            return;
        }
        if (state.scene === 'prologue') {
            updatePrologue(state);
            return;
        }
        if (state.scene === 'title' || state.scene === 'chooseGameMode' ||
            state.scene === 'deleteSavedGame' || state.scene === 'deleteSavedGameConfirmation'
        ) {
            updateTitle(state);
            return;
        }
        if (wasGameKeyPressed(state, GAME_KEY.MENU)) {
            // Don't allow pausing while dialogue is displayed.
            if (state.paused
                || (canPauseGame(state)
                    && !(
                        state.messagePage?.frames?.length
                        || state.defeatState.defeated
                        || state.scriptEvents.blockFieldUpdates
                    )
                )
            ) {
                if (state.paused && state.showMap) {
                    // If the map was showing, just switch to the menu.
                    state.showMap = false;
                    state.menuIndex = 0;
                } else {
                    state.paused = !state.paused;
                    state.showMap = false;
                    state.menuIndex = 0;
                }
                updateSoundSettings(state);
            }
        }
        if (wasGameKeyPressed(state, GAME_KEY.MAP)) {
            // Don't allow pausing while dialogue is displayed.
            if (state.showMap
                || (canPauseGame(state)
                    && !(
                        state.messagePage?.frames?.length
                        || state.defeatState.defeated
                        || state.scriptEvents.blockFieldUpdates
                    )
                )
            ) {
                state.showMap = !state.showMap || !state.paused;
                const dungeonMap = dungeonMaps[state.areaSection?.definition.mapId];
                if (state.showMap && dungeonMap) {
                    state.menuIndex = Object.keys(dungeonMap.floors).indexOf(state.areaSection.definition.floorId);
                    if (state.menuIndex < 0) {
                        console.error('Could not find map floor', state.areaSection.definition.floorId, 'in', Object.keys(dungeonMap.floors));
                        state.menuIndex = 0;
                        debugger;
                    }
                }
                state.paused = state.showMap;
                updateSoundSettings(state);
            }
        }
        if (state.areaInstance?.needsLogicRefresh) {
            refreshAreaLogic(state, state.areaInstance);
        } else if (state.alternateAreaInstance?.needsLogicRefresh) {
            refreshAreaLogic(state, state.alternateAreaInstance);
        }
        const hideMenu = shouldHideMenu(state);
        if (state.paused && !(hideMenu && wasGameKeyPressed(state, GAME_KEY.PREVIOUS_ELEMENT))) {
            if (!hideMenu) {
                updateInventory(state);
            }
        } else if (state.transitionState && !state.areaInstance.priorityObjects?.length) {
            if (!state.paused) {
                updateTransition(state);
            }
        } else if (state.defeatState.defeated) {
            updateDefeated(state);
        } else {
            let messageIsAnimating = false;
            if (state.messagePage) {
                const shouldSkipForward = wasConfirmKeyPressed(state) || wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL);
                const {lineIndex, animationTime} = state.messagePage;
                if (lineIndex === 0) {
                    // Currently there is no initial animation for the first page of dialogue.
                    const initialAnimationDuration = 0;
                    if (animationTime < initialAnimationDuration) {
                        messageIsAnimating = true;
                        if (shouldSkipForward) {
                            state.messagePage.animationTime = initialAnimationDuration;
                        }
                    } else if (state.messagePage.frames.length <= 4) {
                        messageIsAnimating = false;
                        // Closing the message is handled by the containing script system.
                    } else {
                        messageIsAnimating = true;
                        if (shouldSkipForward) {
                            //console.log('Going to next page', state.messagePage.frames.length, lineIndex, ' -> ', lineIndex + 4);
                            state.messagePage.lineIndex += 4;
                            state.messagePage.animationTime = 0;
                        }
                    }
                } else {
                    const pageDurationTime = FRAME_LENGTH * 5 * 4;
                    if (animationTime < pageDurationTime) {
                        messageIsAnimating = true;
                        if (shouldSkipForward) {
                            //console.log('Skip paging animation', pageDurationTime);
                            state.messagePage.animationTime = pageDurationTime;
                        }
                    } else if (state.messagePage.frames.length <= lineIndex + 4) {
                        messageIsAnimating = false;
                        // Closing the message is handled by the containing script system.
                    } else {
                        messageIsAnimating = true;
                        if (shouldSkipForward) {
                            //console.log('Going to next page', state.messagePage.frames.length, lineIndex, ' -> ', lineIndex + 4);
                            state.messagePage.lineIndex += 4;
                            state.messagePage.animationTime = 0;
                        }
                    }
                }
                state.messagePage.animationTime += FRAME_LENGTH;
            }
            if (!messageIsAnimating) {
                updateScriptEvents(state);
                // Update the HUD opacity as long as script events can be run.
                if (state.hideHUD && state.hudOpacity > 0) {
                    state.hudOpacity = Math.max(0, state.hudOpacity - FRAME_LENGTH / 400);
                } else if (!state.hideHUD && state.hudOpacity < 1) {
                    state.hudOpacity = Math.min(1, state.hudOpacity + FRAME_LENGTH / 400);
                }

                //if (state.scriptEvents.blockPlayerInput) {
                //    clearKeyboardState(state);
                //}
                // Make sure we don't handle script event input twice in one frame.
                // We could also manage this by unsetting game keys on the state.
                if (!state.scriptEvents.blockFieldUpdates && !state.scriptEvents.handledInput) {
                    updateField(state);
                }
            }
        }
    } catch (e) {
        console.log(e.stack);
        debugger;
    }
}

function updateTransition(state: GameState) {
    state.transitionState.time += FRAME_LENGTH;
    if (state.transitionState.type === 'diving' || state.transitionState.type === 'surfacing') {
        if (state.hero.z > state.transitionState.nextLocation.z) {
            state.hero.z = Math.max(state.transitionState.nextLocation.z, state.hero.z - 2.5);
        } else if (state.hero.z < state.transitionState.nextLocation.z) {
            state.hero.z = Math.min(state.transitionState.nextLocation.z, state.hero.z + 2.5);
        }
        if (state.transitionState.time === WATER_TRANSITION_DURATION) {
            enterLocation(state, state.transitionState.nextLocation, true, state.transitionState.callback);
            updateCamera(state);
            state.transitionState = null;
        }
    } else if (state.transitionState.type === 'mutating') {
        if (state.transitionState.time === (state.mutationDuration || MUTATE_DURATION)) {
            enterLocation(state, state.transitionState.nextLocation, true, state.transitionState.callback, false, true);
            updateCamera(state);
            state.transitionState = null;
        }
    } else if (state.transitionState.type === 'portal') {
        if (state.transitionState.time === CIRCLE_WIPE_OUT_DURATION) {
            enterLocation(state, state.transitionState.nextLocation, true, state.transitionState.callback);
            updateCamera(state);
            state.transitionState = null;
        }
    } else if (state.transitionState.type === 'fade') {
        if (state.transitionState.time === FADE_OUT_DURATION) {
            enterLocation(state, state.transitionState.nextLocation, true, state.transitionState.callback);
            updateCamera(state);
        } else if (state.transitionState.time > FADE_OUT_DURATION + FADE_IN_DURATION) {
            state.transitionState = null;
        }
    } else {
        if (state.transitionState.time === CIRCLE_WIPE_OUT_DURATION) {
            enterLocation(state, state.transitionState.nextLocation, true, state.transitionState.callback);
            updateCamera(state);
        } else if (state.transitionState.time > CIRCLE_WIPE_OUT_DURATION + CIRCLE_WIPE_IN_DURATION) {
            state.transitionState = null;
        }
    }
}

