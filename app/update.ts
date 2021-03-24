import { checkIfAllEnemiesAreDefeated, enterLocation } from 'app/content/areas';
import { Enemy } from 'app/content/enemy';
import { editingState } from 'app/development/tileEditor';
import {
    FRAME_LENGTH, GAME_KEY,
    FADE_IN_DURATION, FADE_OUT_DURATION,
    CIRCLE_WIPE_IN_DURATION, CIRCLE_WIPE_OUT_DURATION,
} from 'app/gameConstants';
import { updateKeyboardState } from 'app/keyCommands';
import { initializeGame } from 'app/initialize';
import { wasGameKeyPressed } from 'app/keyCommands';
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
import { updateAllHeroes } from 'app/updateActor';
import { updateCamera } from 'app/updateCamera';
import { areAllImagesLoaded } from 'app/utils/images';

import { ActiveTool, AreaInstance, GameState, MagicElement } from 'app/types';

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
        if (state.transitionState) {
            updateTransition(state);
        } else if (state.messageState?.pages) {
            updateMessage(state);
        } else if (state.scene === 'title' || state.scene === 'chooseGameMode' ||
            state.scene === 'deleteSavedGame' || state.scene === 'deleteSavedGameConfirmation'
        ) {
            updateTitle(state);
        } else if (state.defeated) {
            updateDefeated(state);
        } else {
            if (wasGameKeyPressed(state, GAME_KEY.MENU)) {
                state.paused = !state.paused;
                state.menuIndex = 0;
            }
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
        if (state.messageState.pageIndex >= state.messageState.pages.length) {
            state.messageState.pages = null;
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
    }
}

function updateDefeated(state: GameState) {
    if (wasGameKeyPressed(state, GAME_KEY.UP) || wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        state.menuIndex = (state.menuIndex + 1) % 2;
    } else if (isConfirmKeyPressed(state)) {
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
    updateAllHeroes(state);
    updateCamera(state);
    if (!editingState.isEditing) {
        if (wasGameKeyPressed(state, GAME_KEY.PREVIOUS_ELEMENT)) {
            switchElement(state, -1);
        } else if (wasGameKeyPressed(state, GAME_KEY.NEXT_ELEMENT)) {
            switchElement(state, 1);
        }
        removeDefeatedEnemies(state, state.alternateAreaInstance);
        removeDefeatedEnemies(state, state.areaInstance);
        if (!state.nextAreaInstance) {
            for (const object of state.alternateAreaInstance?.objects || []) {
                object.update?.(state);
            }
            for (const object of state.areaInstance.objects) {
                object.update?.(state);
            }
        }
    }
}

function updateTransition(state: GameState) {
    state.transitionState.time += FRAME_LENGTH;
    if (state.transitionState.type === 'fade') {
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

function removeDefeatedEnemies(state: GameState, area: AreaInstance): void {
    const originalLength = area.objects.length;
    area.objects = area.objects.filter(e => !(e instanceof Enemy) || (e.life > 0 && e.status !== 'gone'));
    // If an enemy was defeated, check if all enemies are defeated to see if any doors open or treasures appear.
    if (originalLength > area.objects.length) {
        checkIfAllEnemiesAreDefeated(state, area);
    }
}
