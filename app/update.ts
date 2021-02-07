import { Enemy } from 'app/content/enemy';
import { editingState } from 'app/development/tileEditor';
import { FRAME_LENGTH, KEY_THRESHOLD } from 'app/gameConstants';
import { updateKeysStillDown } from 'app/keyCommands';
import { initializeGame } from 'app/initialize';
import { GAME_KEY, isKeyDown } from 'app/keyCommands';
import {
    getDefaultSavedState,
    getState,
    returnToSpawnLocation,
    selectSaveFile,
    setSaveFileToState,
    updateHeroMagicStats,
    SPAWN_LOCATION_DEMO,
    SPAWN_LOCATION_FULL,
} from 'app/state';
import { updateHero } from 'app/updateActor';
import { updateCamera } from 'app/updateCamera';
import { areFontsLoaded } from 'app/utils/drawText';
import { areAllImagesLoaded } from 'app/utils/images';

import { ActiveTool, GameState, MagicElement } from 'app/types';

let isGameInitialized = false;
export function update() {
    // Don't run the main loop until everything necessary is initialized.
    if (!isGameInitialized) {
        if (areFontsLoaded() && areAllImagesLoaded())  {
            initializeGame();
            isGameInitialized = true;
        }
        return;
    }
    const state = getState();
    state.time += FRAME_LENGTH;
    try {
        if (state.scene === 'title' || state.scene === 'chooseGameMode' ||
            state.scene === 'deleteSavedGame' || state.scene === 'deleteSavedGameConfirmation'
        ) {
            updateTitle(state);
        } else if (state.defeated) {
            updateDefeated(state);
        } else {
            if (isKeyDown(GAME_KEY.MENU, KEY_THRESHOLD)) {
                state.paused = !state.paused;
                state.menuIndex = 0;
            }
            if (!state.paused) {
                updateField(state);
            } else {
                updateMenu(state);
            }
        }
        // Do this after all key checks, since doing it before we cause the key
        // to appear not pressed if there is a release threshold assigned.
        updateKeysStillDown();
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

export function isConfirmKeyPressed(): boolean {
    return !!(isKeyDown(GAME_KEY.WEAPON, KEY_THRESHOLD)
        || isKeyDown(GAME_KEY.PASSIVE_TOOL, KEY_THRESHOLD)
        || isKeyDown(GAME_KEY.MENU, KEY_THRESHOLD));
}

function updateTitle(state: GameState) {
    const options = getTitleOptions(state);
    let changedOption = false;
    if (isKeyDown(GAME_KEY.UP, KEY_THRESHOLD)) {
        state.menuIndex = (state.menuIndex - 1 + options.length) % options.length;
        changedOption = true;
    } else if (isKeyDown(GAME_KEY.DOWN, KEY_THRESHOLD)) {
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
    if (isConfirmKeyPressed()) {
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
    if(selectableTools.length) {
        const selectedTool = selectableTools[state.menuIndex];
        if (isKeyDown(GAME_KEY.LEFT, KEY_THRESHOLD)) {
            state.menuIndex = (state.menuIndex + selectableTools.length - 1) % selectableTools.length;
        } else if (isKeyDown(GAME_KEY.RIGHT, KEY_THRESHOLD)) {
            state.menuIndex = (state.menuIndex + 1) % selectableTools.length;
        } else if (isKeyDown(GAME_KEY.LEFT_TOOL, KEY_THRESHOLD)) {
            if (state.hero.rightTool === selectedTool) {
                state.hero.rightTool = state.hero.leftTool;
            }
            state.hero.leftTool = selectedTool;
        } else if (isKeyDown(GAME_KEY.RIGHT_TOOL, KEY_THRESHOLD)) {
            if (state.hero.leftTool === selectedTool) {
                state.hero.leftTool = state.hero.rightTool;
            }
            state.hero.rightTool = selectedTool;
        }
    }
}

function updateDefeated(state: GameState) {
    if (isKeyDown(GAME_KEY.UP, KEY_THRESHOLD) || isKeyDown(GAME_KEY.DOWN, KEY_THRESHOLD)) {
        state.menuIndex = (state.menuIndex + 1) % 2;
    } else if (isConfirmKeyPressed()) {
        if (state.menuIndex === 0) {
            returnToSpawnLocation(state);
        } else if (state.menuIndex === 1) {
            state.scene = 'title';
            state.menuIndex = state.savedGameIndex;
            setSaveFileToState(state.menuIndex);
        }
    }
}

function switchElement(state: GameState, delta: number): void {
    const allElements: MagicElement[] = [null];
    for (const element of ['fire', 'ice', 'lightning'] as MagicElement[]) {
        if (state.hero.elements[element]) {
            allElements.push(element);
        }
    }
    const index = allElements.indexOf(state.hero.element);
    state.hero.element = allElements[(index + delta + allElements.length) % allElements.length];
}

function updateField(state: GameState) {
    updateHero(state);
    updateCamera(state);
    if (!editingState.isEditing) {
        if (isKeyDown(GAME_KEY.PREVIOUS_ELEMENT, KEY_THRESHOLD)) {
            switchElement(state, -1);
        } else if (isKeyDown(GAME_KEY.NEXT_ELEMENT, KEY_THRESHOLD)) {
            switchElement(state, 1);
        }
        const originalLength = state.areaInstance.objects.length;
        state.areaInstance.objects = state.areaInstance.objects.filter(e => !(e instanceof Enemy) || e.life > 0);
        // If an enemy was defeated, check if all enemies are defeated to see if any doors open or treasures appear.
        if (originalLength > state.areaInstance.objects.length) {
            if (!state.areaInstance.objects.some(e => (e instanceof Enemy) && e.isInCurrentSection(state))) {
                for (const object of state.areaInstance.objects) {
                    if (object.status === 'hiddenEnemy') {
                        object.status = 'normal';
                    }
                    if (object.status === 'closedEnemy') {
                        if (object.changeStatus) {
                            object.changeStatus(state, 'normal');
                        } else {
                            object.status = 'normal';
                        }
                    }
                }
            }
        }
        for (const object of state.alternateAreaInstance?.objects || []) {
            object.update?.(state);
        }
        for (const object of state.areaInstance.objects) {
            object.update?.(state);
        }
    }
}
