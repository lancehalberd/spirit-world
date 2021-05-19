import { enterLocation } from 'app/content/areas';
import { getLoot } from 'app/content/lootObject';
import {
    SPAWN_LOCATION_DEMO,
    SPAWN_LOCATION_FULL,
} from 'app/content/spawnLocations';
import {
    FRAME_LENGTH, GAME_KEY,
    FADE_IN_DURATION, FADE_OUT_DURATION,
    CIRCLE_WIPE_IN_DURATION, CIRCLE_WIPE_OUT_DURATION,
} from 'app/gameConstants';
import { updateKeyboardState } from 'app/keyCommands';
import { initializeGame } from 'app/initialize';
import { wasGameKeyPressed } from 'app/keyCommands';
import { updateHeroMagicStats } from 'app/render/spiritBar';
import {
    getDefaultSavedState,
    getState,
    returnToSpawnLocation,
    saveGame,
    selectSaveFile,
    setSaveFileToState,
} from 'app/state';
import { updateCamera } from 'app/updateCamera';
import { updateField } from 'app/updateField';
import { areAllImagesLoaded } from 'app/utils/images';

import { ActiveTool, DialogueLootDefinition, Equipment, GameState } from 'app/types';

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
        if (state.scene === 'game' && wasGameKeyPressed(state, GAME_KEY.MENU)) {
            state.paused = !state.paused;
            state.menuIndex = 0;
        }
        if (state.transitionState) {
            if (!state.paused) {
                updateTransition(state);
            }
        } else if (state.messageState?.pages) {
            if (!state.paused) {
                updateMessage(state);
            }
        } else if (state.scene === 'title' || state.scene === 'chooseGameMode' ||
            state.scene === 'deleteSavedGame' || state.scene === 'deleteSavedGameConfirmation'
        ) {
            updateTitle(state);
        } else if (state.defeatState.defeated) {
            updateDefeated(state);
        } else {
            if (!state.paused) {
                updateField(state);
            } else {
                updateMenu(state);
            }
        }
    } catch (e) {
        console.log(e.stack);
        debugger;
    }
}

export function getTitleOptions(state: GameState): string[] {
    if (state.scene === 'chooseGameMode') {
        return ['Full Game', 'Quick Demo', 'Cancel'];
    }
    if (state.scene === 'deleteSavedGameConfirmation') {
        return ['CANCEL', 'DELETE'];
    }
    const gameFiles = state.savedGames.map(savedGame => {
        if (!savedGame) {
            return 'New Game';
        }
        return savedGame.hero.spawnLocation.zoneKey;// + ' ' + 'V'.repeat(savedGame.hero.maxLife) + ' life';
    });
    if (state.scene === 'deleteSavedGame') {
        return [...gameFiles, 'CANCEL'];
    }
    return [...gameFiles, 'DELETE'];
}

export function isConfirmKeyPressed(state: GameState): boolean {
    return !!(wasGameKeyPressed(state, GAME_KEY.WEAPON)
        || wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)
        || wasGameKeyPressed(state, GAME_KEY.MENU));
}

function updateTitle(state: GameState) {
    const options = getTitleOptions(state);
    let changedOption = false;
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        state.menuIndex = (state.menuIndex - 1 + options.length) % options.length;
        changedOption = true;
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        state.menuIndex = (state.menuIndex + 1) % options.length;
        changedOption = true;
    }
    if (changedOption) {
        if (state.scene === 'title' || state.scene === 'deleteSavedGame') {
            setSaveFileToState(state.menuIndex, 0);
        } else if (state.scene === 'chooseGameMode') {
            setSaveFileToState(state.savedGameIndex, state.menuIndex);
        }
    }
    if (isConfirmKeyPressed(state)) {
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
                state.hero = state.savedState.hero;
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
    if (isConfirmKeyPressed(state)) {
        state.messageState.pageIndex++;
        const pageOrLoot = state.messageState.pages[state.messageState.pageIndex]
        if (pageOrLoot?.['type'] === 'dialogueLoot') {
            getLoot(state, pageOrLoot as DialogueLootDefinition);
            // For now cancel remaining dialogue on receiving loot, we have no way to
            // show the loot animation and then continue dialogue. So all loot should
            // be set at the end of dialogue for now.
            state.messageState.pageIndex = state.messageState.pages.length;
            // TODO: allow obtaining loot in the middle of a message and replace the above
            // line with the one below.
            // state.messageState.pageIndex++;
        }
        if (state.messageState.pageIndex >= state.messageState.pages.length) {
            state.messageState.pages = null;
            if (state.messageState.progressFlag) {
                state.savedState.objectFlags[state.messageState.progressFlag] = true;
                saveGame();
                state.messageState.progressFlag = null;
            }
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
    if (state.hero.activeTools.invisibility) {
        selectableTools.push('invisibility');
    }
    if (state.hero.activeTools.clone) {
        selectableTools.push('clone');
    }
    if (wasGameKeyPressed(state, GAME_KEY.UP) || wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        state.menuRow = (state.menuRow + 1) % 2;
    }
    if(!selectableTools.length && state.menuRow === 0) {
        state.menuRow = 1;
    }
    if (state.menuRow === 0) {
        // The first row is for selecting tools.
        const selectedTool = selectableTools[state.menuIndex];
        if (wasGameKeyPressed(state, GAME_KEY.LEFT)) {
            state.menuIndex = (state.menuIndex + selectableTools.length - 1) % selectableTools.length;
        } else if (wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
            state.menuIndex = (state.menuIndex + 1) % selectableTools.length;
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
    } else {
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
    } else if (isConfirmKeyPressed(state)) {
        if (state.menuIndex === 0 && state.hero.money >= 50) {
            state.hero.money -= 50;
            state.hero.life = state.hero.maxLife;
            state.defeatState.defeated = false;
            saveGame();
        } else if (state.menuIndex === 1) {
            returnToSpawnLocation(state);
        } else if (state.menuIndex === 2) {
            state.scene = 'title';
            state.menuIndex = state.savedGameIndex;
            setSaveFileToState(state.menuIndex);
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
