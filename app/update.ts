import { enterLocation } from 'app/content/areas';
import { Hero } from 'app/content/hero';
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
import { updateHeroMagicStats } from 'app/render/spiritBar';
import { updateScriptEvents } from 'app/scriptEvents'
import {
    getDefaultSavedState,
    getState,
    getTitleOptions,
    returnToSpawnLocation,
    saveGame,
    saveGamesToLocalStorage,
    selectSaveFile,
    setSaveFileToState,
    showHint,
} from 'app/state';
import { updateCamera } from 'app/updateCamera';
import { updateField } from 'app/updateField';
import { areAllImagesLoaded } from 'app/utils/images';
import { playSound, updateSoundSettings } from 'app/musicController';

import { ActiveTool, Equipment, GameState, MagicElement } from 'app/types';

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
        if (state.scene === 'title' || state.scene === 'chooseGameMode' ||
            state.scene === 'deleteSavedGame' || state.scene === 'deleteSavedGameConfirmation'
        ) {
            updateTitle(state);
            return;
        }
        if (wasGameKeyPressed(state, GAME_KEY.MENU)) {
            // Don't allow pausing while dialogue is displayed.
            if (state.paused ||
                !(state.messagePage?.length || state.defeatState.defeated || state.scriptEvents.blockFieldUpdates)
            ) {
                state.paused = !state.paused;
                state.menuIndex = 0;
                updateSoundSettings(state);
            }
        }
        if (state.paused && !(state.hideMenu && wasGameKeyPressed(state, GAME_KEY.MEDITATE))) {
            if (!state.hideMenu) {
                updateMenu(state);
            }
        } else if (state.transitionState && !state.areaInstance.priorityObjects?.length) {
            if (!state.paused) {
                updateTransition(state);
            }
        } else if (state.defeatState.defeated) {
            updateDefeated(state);
        } else {
            updateScriptEvents(state);
            // Make sure we don't handle script event input twice in one frame.
            // We could also manage this by unsetting game keys on the state.
            if (!state.scriptEvents.blockFieldUpdates && !state.scriptEvents.handledInput) {
                updateField(state);
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
                    saveGamesToLocalStorage();
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
    // Add 0.5s pause afer showing menu before taking input so that players don't accidentally take action.
    // This also gives them a bit to see the "Hang in there!" message before their life starts refilling
    // when they have a revive available.
    if (state.defeatState.time < 1500) {
        return;
    }
    if (state.hero.hasRevive) {
        if (state.defeatState.time % 200 === 0) {
            state.hero.life = Math.min(state.hero.maxLife, state.hero.life + 0.5);
            if (state.hero.life === state.hero.maxLife) {
                state.defeatState.defeated = false;
                state.hero.hasRevive = false;
                saveGame();
            }
        }
        return;
    }
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        state.menuIndex = (state.menuIndex + 1) % 2;
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        state.menuIndex = (state.menuIndex + 1) % 2;
    } else if (wasConfirmKeyPressed(state)) {
        if (state.menuIndex === 0) {
            returnToSpawnLocation(state);
            state.paused = false;
        } else if (state.menuIndex === 1) {
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
