import { enterLocation, refreshAreaLogic } from 'app/content/areas';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { Hero } from 'app/content/hero';
import { getLoot } from 'app/content/lootObject';
import {
    SPAWN_LOCATION_DEMO,
    SPAWN_LOCATION_FULL,
} from 'app/content/spawnLocations';
import {
    FRAME_LENGTH, GAME_KEY,
    FADE_IN_DURATION, FADE_OUT_DURATION,
    CIRCLE_WIPE_IN_DURATION, CIRCLE_WIPE_OUT_DURATION,
    MUTATE_DURATION,
} from 'app/gameConstants';
import { updateKeyboardState } from 'app/keyCommands';
import { initializeGame } from 'app/initialize';
import { wasGameKeyPressed, wasConfirmKeyPressed } from 'app/keyCommands';
import { showMessage } from 'app/render/renderMessage';
import { updateHeroMagicStats } from 'app/render/spiritBar';
import { updateScriptEvents } from 'app/scriptEvents'
import {
    getDefaultSavedState,
    getState,
    getTitleOptions,
    returnToSpawnLocation,
    saveGame,
    selectSaveFile,
    setSaveFileToState,
    showHint,
} from 'app/state';
import { updateCamera } from 'app/updateCamera';
import { updateField } from 'app/updateField';
import { areAllImagesLoaded } from 'app/utils/images';
import { playSound } from 'app/utils/sounds';

import { ActiveTool, DialogueChoiceDefinition, DialogueLootDefinition, Equipment, GameState, MagicElement } from 'app/types';

let isGameInitialized = false;
export function update() {
    // Don't run the main loop until everything necessary is initialized.
    if (!isGameInitialized) {
        if (areAllImagesLoaded())  {
            initializeGame();
            isGameInitialized = true;
        }
        return;
    }
    const state = getState();
    state.time += FRAME_LENGTH;
    updateKeyboardState(state);
    try {
        if (state.messageState?.pages) {
            updateMessage(state);
            if (!state.messageState.continueUpdatingState) {
                return;
            }
        }
        if (state.transitionState && !state.areaInstance.priorityObjects?.length) {
            if (wasGameKeyPressed(state, GAME_KEY.MENU)) {
                state.paused = !state.paused;
                state.menuIndex = 0;
            }
            if (!state.paused) {
                updateTransition(state);
            }
        } else if (state.scene === 'title' || state.scene === 'chooseGameMode' ||
            state.scene === 'deleteSavedGame' || state.scene === 'deleteSavedGameConfirmation'
        ) {
            updateTitle(state);
        } else if (state.defeatState.defeated) {
            updateDefeated(state);
        } else {
            updateScriptEvents(state);
            if (!state.scriptEvents.blockFieldUpdates) {
                // Make sure we don't handle script event input twice in one frame.
                // We could also manage this by unsetting game keys on the state.
                if (!state.scriptEvents.handledInput  && wasGameKeyPressed(state, GAME_KEY.MENU)) {
                    state.paused = !state.paused;
                    state.menuIndex = 0;
                }
                if (!state.paused) {
                    updateField(state);
                } else {
                    updateMenu(state);
                }
            }
        }
    } catch (e) {
        console.log(e.stack);
        debugger;
    }
}

function updateTitle(state: GameState) {
    const options = getTitleOptions(state);
    let changedOption = false;
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        state.menuIndex = (state.menuIndex - 1 + options.length) % options.length;
        changedOption = true;
        playSound('menuTick');
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        state.menuIndex = (state.menuIndex + 1) % options.length;
        changedOption = true;
        playSound('menuTick');
    }
    if (changedOption) {
        if (state.scene === 'title' || state.scene === 'deleteSavedGame') {
            setSaveFileToState(state.menuIndex, 0);
        } else if (state.scene === 'chooseGameMode') {
            setSaveFileToState(state.savedGameIndex, state.menuIndex);
        }
    }
    if (wasConfirmKeyPressed(state)) {
        playSound('menuTick');
        switch (state.scene) {
            case 'deleteSavedGameConfirmation':
                if (state.menuIndex === 1) {
                    state.savedGames[state.savedGameIndex] = null;
                }
                state.scene = 'title';
                state.menuIndex = state.savedGameIndex;
                setSaveFileToState(state.savedGameIndex, 0);
                break;
            case 'deleteSavedGame':
                if (state.menuIndex >= state.savedGames.length) {
                    state.scene = 'title';
                    state.menuIndex = 0;
                } else {
                    state.savedGameIndex = state.menuIndex;
                    state.scene = 'deleteSavedGameConfirmation';
                    state.menuIndex = 0;
                }
                break;
            case 'chooseGameMode':
                state.savedState = getDefaultSavedState();
                state.hero = new Hero();
                state.hero.applySavedHeroData(state.savedState.savedHeroData);
                if (state.menuIndex === 0) {
                    // Full Game
                    state.hero.spawnLocation = SPAWN_LOCATION_FULL;
                    state.scene = 'game';
                    updateHeroMagicStats(state);
                    returnToSpawnLocation(state);
                } else if (state.menuIndex === 1) {
                    // Demo
                    state.hero.spawnLocation = SPAWN_LOCATION_DEMO;
                    state.scene = 'game';
                    updateHeroMagicStats(state);
                    returnToSpawnLocation(state);
                } else {
                    state.scene = 'title';
                    state.menuIndex = state.savedGameIndex;
                    setSaveFileToState(state.savedGameIndex, 0);
                }
                break;
            case 'title':
                if (state.menuIndex >= state.savedGames.length) {
                    state.scene = 'deleteSavedGame';
                    state.menuIndex = 0;
                } else {
                    selectSaveFile(state.menuIndex);
                }
                break;
        }
    }
}

function updateMessage(state: GameState) {
    // This is needed in case a message starts with non-dialogue pages.
    processNonDialoguePages(state);
    if (!state.messageState?.pages) {
        return;
    }
    if (state.messageState.choice) {
        updateMessageChoice(state);
        if (!state.messageState?.pages) {
            return;
        }
    }
    if (state.messageState.currentPageTime >= state.time) {
        return;
    }
    // Advance to the next page if the player pressed a confirm key or if the auto time duration expires.
    if (typeof state.messageState.pages[state.messageState.pageIndex] === 'string'
        || wasConfirmKeyPressed(state) || (
        state.messageState.advanceTime > 0 &&
        state.time - state.messageState.currentPageTime >= state.messageState.advanceTime
    )) {
        state.messageState.pageIndex++;
        processNonDialoguePages(state);
        if (state.messageState.pageIndex >= state.messageState.pages?.length) {
            state.messageState.pages = null;
        }
    }
}

function processNonDialoguePages(state: GameState) {
    while (state.messageState.pageIndex < state.messageState.pages.length) {
        const pageOrLootOrFlag = state.messageState.pages[state.messageState.pageIndex];
        if (typeof pageOrLootOrFlag === 'string') {
            // This is a redirect token.
            if (pageOrLootOrFlag.startsWith('@')) {
                followMessagePointer(state, pageOrLootOrFlag.substring(1));
                return;
            }
            if (pageOrLootOrFlag.startsWith('!')) {
                applyMessageAction(state, pageOrLootOrFlag.substring(1));
                return;
            }
            state.savedState.objectFlags[pageOrLootOrFlag] = true;
            saveGame();
            refreshAreaLogic(state, state.areaInstance);
            refreshAreaLogic(state, state.areaInstance.alternateArea);
        } else if (pageOrLootOrFlag?.['type'] === 'dialogueLoot') {
            getLoot(state, pageOrLootOrFlag as DialogueLootDefinition);
            // For now cancel remaining dialogue on receiving loot, we have no way to
            // show the loot animation and then continue dialogue. So all loot should
            // be set at the end of dialogue for now.
            // state.messageState.pageIndex = state.messageState.pages.length;
            // TODO: allow obtaining loot in the middle of a message and replace the above
            // line with the one below.
            // state.messageState.pageIndex++;
        } else if (typeof pageOrLootOrFlag?.['prompt'] === 'string') {
            if (!state.messageState.choice) {
                state.messageState.choice = pageOrLootOrFlag as DialogueChoiceDefinition;
                state.messageState.choiceIndex = 0;
            }
            return;
        } else {
            return;
        }
        state.messageState.pageIndex++;
        state.messageState.currentPageTime = state.time;
    }
}

function updateMessageChoice(state: GameState) {
    if (wasConfirmKeyPressed(state)) {
        const option = state.messageState.choice.choices[state.messageState.choiceIndex];
        delete state.messageState.choice;
        followMessagePointer(state, option.key);
        return;
    }
    const optionCount = state.messageState.choice.choices.length;
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        state.messageState.choiceIndex = (state.messageState.choiceIndex + optionCount - 1) % optionCount;
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        state.messageState.choiceIndex = (state.messageState.choiceIndex + 1) % optionCount;
    }
}

function applyMessageAction(state: GameState, action: string) {
    if (action === 'rest') {
        state.messageState.pages = null;
        state.transitionState = {
            callback() {
                state.hero.life = state.hero.maxLife;
            },
            nextLocation: state.location,
            time: 0,
            type: 'fade',
        };
        return;
    }
    console.error('Unhandled dialogue action', action);
}

function followMessagePointer(state: GameState, pointer: string) {
    const [dialogueKey, optionKey] = pointer.split('.');
    const dialogueSet = dialogueHash[dialogueKey];
    if (!dialogueSet) {
        console.error('Missing dialogue set', dialogueKey, pointer);
        return;
    }
    const text = dialogueSet.mappedOptions[optionKey];
    showMessage(state, text);
}

function updateMenu(state: GameState) {
    const selectableTools: ActiveTool[] = [];
    if (state.hero.activeTools.bow) {
        selectableTools.push('bow');
    }
    if (state.hero.activeTools.staff) {
        selectableTools.push('staff');
    }
    if (state.hero.activeTools.cloak) {
        selectableTools.push('cloak');
    }
    if (state.hero.activeTools.clone) {
        selectableTools.push('clone');
    }
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        state.menuRow = (state.menuRow + 2) % 3;
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        state.menuRow = (state.menuRow + 1) % 3;
    }
    if(!state.hero.passiveTools.charge && state.menuRow === 2) {
        state.menuRow = 1;
    }
    if (state.menuRow === 0) {
        // The first row is for selecting tools.
        const numberOfOptions = selectableTools.length + 1;
        const toolIndex = state.menuIndex - 1;
        const selectedTool = selectableTools[toolIndex];
        if (wasGameKeyPressed(state, GAME_KEY.LEFT)) {
            state.menuIndex = (state.menuIndex + numberOfOptions - 1) % numberOfOptions;
        } else if (wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
            state.menuIndex = (state.menuIndex + 1) % numberOfOptions;
        } else if (state.menuIndex === 0 && (
            wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL)
            || wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)
            || wasGameKeyPressed(state, GAME_KEY.WEAPON)
        )) {
            state.paused = false;
            showHint(state);
            return;
        } else if (wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL)) {
            if (state.hero.rightTool === selectedTool) {
                state.hero.rightTool = state.hero.leftTool;
            }
            state.hero.leftTool = selectedTool;
        } else if (wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)) {
            if (state.hero.leftTool === selectedTool) {
                state.hero.leftTool = state.hero.rightTool;
            }
            state.hero.rightTool = selectedTool;
        }
    } else if (state.menuRow === 1) {
        // The second row is for equipping boots.
        const selectableEquipment: Equipment[] = [null];
        if (state.hero.equipment.ironBoots) {
            selectableEquipment.push('ironBoots');
        }
        if (state.hero.equipment.cloudBoots) {
            selectableEquipment.push('cloudBoots');
        }
        if (wasGameKeyPressed(state, GAME_KEY.LEFT)) {
            state.menuIndex = (state.menuIndex + selectableEquipment.length - 1) % selectableEquipment.length;
        } else if (wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
            state.menuIndex = (state.menuIndex + 1) % selectableEquipment.length;
        } else if (wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL)
            || wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)
            || wasGameKeyPressed(state, GAME_KEY.WEAPON)
        ) {
            const selectedEquipment = selectableEquipment[state.menuIndex];
            if (!selectableEquipment || state.hero.equipedGear[selectedEquipment]) {
                state.hero.equipedGear = {};
            } else {
                state.hero.equipedGear = {};
                state.hero.equipedGear[selectedEquipment] = true;
            }
        }
    }  else if (state.menuRow === 2) {
        // The second row is for equipping boots.
        const selectableElements: MagicElement[] = [null];
        if (state.hero.elements.fire) {
            selectableElements.push('fire');
        }
        if (state.hero.elements.ice) {
            selectableElements.push('ice');
        }
        if (state.hero.elements.lightning) {
            selectableElements.push('lightning');
        }
        if (wasGameKeyPressed(state, GAME_KEY.LEFT)) {
            state.menuIndex = (state.menuIndex + selectableElements.length - 1) % selectableElements.length;
        } else if (wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
            state.menuIndex = (state.menuIndex + 1) % selectableElements.length;
        } else if (wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL)
            || wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)
            || wasGameKeyPressed(state, GAME_KEY.WEAPON)
        ) {
            if (state.hero.element === selectableElements[state.menuIndex]) {
                state.hero.setElement(null);
            } else {
                state.hero.setElement(selectableElements[state.menuIndex]);
            }
        }
    }
}

function updateDefeated(state: GameState) {
    state.defeatState.time += FRAME_LENGTH;
    if (state.menuIndex === 0 && state.hero.money < 50) {
        state.menuIndex = 1;
    }
    // Add 0.5s pause afer showing menu before taking input so that players don't accidentally take action.
    if (state.defeatState.time < 1500) {
        return;
    }
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        state.menuIndex = (state.menuIndex + 2) % 3;
        if (state.menuIndex === 0 && state.hero.money < 50) {
            state.menuIndex = 2;
        }
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        state.menuIndex = (state.menuIndex + 1) % 3;
        if (state.menuIndex === 0 && state.hero.money < 50) {
            state.menuIndex = 1;
        }
    } else if (wasConfirmKeyPressed(state)) {
        if (state.menuIndex === 0 && state.hero.money >= 50) {
            state.hero.money -= 50;
            state.hero.life = state.hero.maxLife;
            state.defeatState.defeated = false;
            saveGame();
            state.paused = false;
        } else if (state.menuIndex === 1) {
            returnToSpawnLocation(state);
            state.paused = false;
        } else if (state.menuIndex === 2) {
            state.scene = 'title';
            state.menuIndex = state.savedGameIndex;
            setSaveFileToState(state.menuIndex);
            state.paused = false;
        }
    }
}

function updateTransition(state: GameState) {
    state.transitionState.time += FRAME_LENGTH;
    if (state.transitionState.type === 'diving' || state.transitionState.type === 'surfacing') {
        if (state.hero.z > state.transitionState.nextLocation.z) {
            state.hero.z = Math.max(state.transitionState.nextLocation.z, state.hero.z - 1);
        } else if (state.hero.z < state.transitionState.nextLocation.z) {
            state.hero.z = Math.min(state.transitionState.nextLocation.z, state.hero.z + 1);
        }
        if (state.transitionState.time === CIRCLE_WIPE_OUT_DURATION) {
            enterLocation(state, state.transitionState.nextLocation, true);
            state.transitionState.callback?.();
            updateCamera(state);
            state.transitionState = null;
        }
    } else if (state.transitionState.type === 'mutating') {
        if (state.transitionState.time === MUTATE_DURATION) {
            enterLocation(state, state.transitionState.nextLocation, true);
            state.transitionState.callback?.();
            updateCamera(state);
            state.transitionState = null;
        }
    } else if (state.transitionState.type === 'portal') {
        if (state.transitionState.time === CIRCLE_WIPE_OUT_DURATION) {
            enterLocation(state, state.transitionState.nextLocation, true);
            state.transitionState.callback?.();
            updateCamera(state);
            state.transitionState = null;
        }
    } else if (state.transitionState.type === 'fade') {
        if (state.transitionState.time === FADE_OUT_DURATION) {
            enterLocation(state, state.transitionState.nextLocation, true);
            state.transitionState.callback?.();
            updateCamera(state);
        } else if (state.transitionState.time > FADE_OUT_DURATION + FADE_IN_DURATION) {
            state.transitionState = null;
        }
    } else {
        if (state.transitionState.time === CIRCLE_WIPE_OUT_DURATION) {
            enterLocation(state, state.transitionState.nextLocation, true);
            state.transitionState.callback?.();
            updateCamera(state);
        } else if (state.transitionState.time > CIRCLE_WIPE_OUT_DURATION + CIRCLE_WIPE_IN_DURATION) {
            state.transitionState = null;
        }
    }
}
