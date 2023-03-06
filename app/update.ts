import { refreshAreaLogic } from 'app/content/areas';
import { addDustBurst, addReviveBurst } from 'app/content/effects/animationEffect';
import { Hero } from 'app/content/hero';
import { showHint } from 'app/content/hints';
import { getLootHelpMessage } from 'app/content/loot';
import {
    getMenuRows,
    setEquippedBoots,
    setEquippedElement,
    setLeftTool,
    setRightTool,
} from 'app/content/menu';
import {
    SPAWN_LOCATION_DEMO,
    SPAWN_LOCATION_FULL,
    fixSpawnLocationOnLoad,
} from 'app/content/spawnLocations';
import { zones } from 'app/content/zones/zoneHash';
import {
    FRAME_LENGTH, GAME_KEY,
    FADE_IN_DURATION, FADE_OUT_DURATION,
    CIRCLE_WIPE_IN_DURATION, CIRCLE_WIPE_OUT_DURATION,
    MUTATE_DURATION,
    isRandomizer, randomizerGoal, randomizerTotal, randomizerGoalType,
} from 'app/gameConstants';
import { initializeGame } from 'app/initialize';
import {
    clearKeyboardState,
    isGameKeyDown,
    updateKeyboardState,
    wasGameKeyPressed,
    wasConfirmKeyPressed,
    wasMenuConfirmKeyPressed,
} from 'app/userInput';
import { playSound, updateSoundSettings } from 'app/musicController';
import { updateHeroMagicStats } from 'app/render/spiritBar';
import { getDefaultSavedState } from 'app/savedState'
import { parseScriptText, setScript, showMessage } from 'app/scriptEvents';
import {
    canPauseGame,
    getState,
    getTitleOptions,
    setSaveFileToState,
    shouldHideMenu,
} from 'app/state';
import { updateCamera } from 'app/updateCamera';
import { updateField } from 'app/updateField';
import { updateScriptEvents } from 'app/updateScriptEvents';
import { enterLocation } from 'app/utils/enterLocation';
import { areAllImagesLoaded } from 'app/utils/images';
import { returnToSpawnLocation } from 'app/utils/returnToSpawnLocation'
import { saveGame, saveGamesToLocalStorage, } from 'app/utils/saveGame';

import { ActiveTool, PassiveTool, GameState, MagicElement } from 'app/types';

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
            if (state.paused
                || (canPauseGame(state)
                    && !(
                        state.messagePage?.frames?.length
                        || state.defeatState.defeated
                        || state.scriptEvents.blockFieldUpdates
                    )
                )
            ) {
                state.paused = !state.paused;
                state.showMap = false;
                state.menuIndex = 0;
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
                state.showMap = !state.showMap;
                if (state.showMap) {
                    state.menuIndex = state.location.floor;
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
        if (state.paused && !(hideMenu && wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL))) {
            if (!hideMenu) {
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
            if (state.scriptEvents.blockPlayerInput) {
                clearKeyboardState(state);
            }
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
        playSound(state, 'menuTick');
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        state.menuIndex = (state.menuIndex + 1) % options.length;
        changedOption = true;
        playSound(state, 'menuTick');
    }
    if (changedOption) {
        if (state.scene === 'title' || state.scene === 'deleteSavedGame') {
            if (state.menuIndex < state.savedGames.length) {
                setSaveFileToState(state.menuIndex, 0);
            }
        } else if (state.scene === 'chooseGameMode') {
            setSaveFileToState(state.savedGameIndex, state.menuIndex);
        }
    }
    if (wasConfirmKeyPressed(state)) {
        playSound(state, 'menuTick');
        switch (state.scene) {
            case 'deleteSavedGameConfirmation':
                if (state.menuIndex === 1) {
                    state.savedGames[state.savedGameIndex] = null;
                    saveGamesToLocalStorage(state);
                }
                state.scene = 'title';
                state.menuIndex = state.savedGameIndex;
                setSaveFileToState(state.savedGameIndex, 0);
                break;
            case 'deleteSavedGame':
                if (state.menuIndex >= state.savedGames.length) {
                    state.scene = 'title';
                    state.menuIndex = 0;
                    setSaveFileToState(state.menuIndex, 0);
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
                    setSaveFileToState(state.menuIndex, 0);
                } else {
                    selectSaveFile(state, state.menuIndex);
                }
                break;
        }
    }
}

function updateMenu(state: GameState) {
    if (state.showMap) {
        const zone = zones[state.location.zoneKey];
        if (wasGameKeyPressed(state, GAME_KEY.UP)) {
            state.menuIndex = (state.menuIndex + 1) % zone.floors.length;
        } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
            state.menuIndex = (state.menuIndex + zone.floors.length - 1) % zone.floors.length;
        }
        if (wasMenuConfirmKeyPressed(state)) {
            state.paused = false;
        }
        return;
    }
    const menuRows = getMenuRows(state);
    // Cycle to the next row that isn't empty.
    // There is always at least one row since the help tool is always there.
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        do {
            state.menuRow = (state.menuRow + menuRows.length - 1) % menuRows.length;
        } while (!menuRows[state.menuRow].length)
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        do {
            state.menuRow = (state.menuRow + 1) % menuRows.length;
        } while (!menuRows[state.menuRow].length)
    }
    const menuRow = menuRows[state.menuRow];
    state.menuIndex = Math.min(menuRow.length - 1, state.menuIndex);
    if (wasGameKeyPressed(state, GAME_KEY.LEFT)) {
        state.menuIndex = (state.menuIndex + menuRow.length - 1) % menuRow.length;
    } else if (wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
        state.menuIndex = (state.menuIndex + 1) % menuRow.length;
    }

    if (wasMenuConfirmKeyPressed(state)) {
        const menuItem = menuRow[state.menuIndex];
        if (menuItem === 'help') {
            state.paused = false;
            updateSoundSettings(state);
            showHint(state);
            return;
        }
        if (menuItem === 'return') {
            state.paused = false;
            updateSoundSettings(state);
            showMessage(state, '{@nimbusCloud.returnMenu}');
            return;
        }
        if (state.hero.activeTools[menuItem]) {
            if (wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)) {
                if (state.hero.leftTool === menuItem) {
                    setLeftTool(state, state.hero.rightTool);
                }
                setRightTool(state, menuItem as ActiveTool);
            } else {
                // Assign to left tool as default action.
                // If a generic confirm key was pressed, cycle the current left tool
                // over to the right tool slot.
                if (!wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL) && state.hero.leftTool !== menuItem) {
                    setRightTool(state, state.hero.leftTool);
                }
                if (state.hero.rightTool === menuItem) {
                    setRightTool(state, state.hero.leftTool);
                }
                setLeftTool(state, menuItem as ActiveTool);
            }
            return;
        }
        if (menuItem === 'leatherBoots' || menuItem === 'ironBoots' || menuItem === 'cloudBoots') {
            setEquippedBoots(state, menuItem);
            return;
        }
        if (menuItem === 'neutral' || state.hero.element === menuItem) {
            setEquippedElement(state, null);
            return;
        } else if (state.hero.elements[menuItem]) {
            setEquippedElement(state, menuItem as MagicElement);
            return;
        }
        if (menuItem === 'nimbusCloud') {
            state.paused = false;
            updateSoundSettings(state);
            showMessage(state, '{@nimbusCloud.chooseDestination}');
            return;
        }
        if (state.hero.passiveTools[menuItem as PassiveTool]) {
            state.paused = false;
            updateSoundSettings(state);
            const helpMessage = getLootHelpMessage(state, menuItem, state.hero.passiveTools[menuItem]);
            showMessage(state, helpMessage);
        }
    }
}

function updateDefeated(state: GameState) {
    if (!isGameKeyDown(state, GAME_KEY.WEAPON)) {
        // Uncomment to inspect the defeat animation.
        //return;
    }
    state.defeatState.time += FRAME_LENGTH;
    for (const effect of state.areaInstance.effects) {
        if (effect.drawPriority === 'background-special' || effect.drawPriority === 'foreground-special') {
            effect.update?.(state);
        }
    }
    if (state.defeatState.time === 1000) {
        const hitbox = state.hero.getHitbox(state);
        addDustBurst(state, state.areaInstance,
            hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, state.hero.z);
    }
    // Add 0.5s pause afer showing menu before taking input so that players don't accidentally take action.
    // This also gives them a bit to see the "Hang in there!" message before their life starts refilling
    // when they have a revive available.
    if (state.defeatState.time < 2000) {
        return;
    }
    if (state.hero.hasRevive) {
        state.defeatState.reviving = true;
        state.hero.hasRevive = false;
        state.hero.frozenDuration = 0;
        state.hero.burnDuration = 0;
    }
    if (state.defeatState.reviving) {
        // Show a burst of particles right before the MC gets up
        // and starts regaining life.
        if (state.defeatState.time === 2400) {
            const hitbox = state.hero.getHitbox(state);
            addReviveBurst(state, state.areaInstance,
                hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, state.hero.z);
        }
        if (state.defeatState.time < 2500) {
            return;
        }
        // This is a hack to make the reviveTime advance even though the fieldTime is paused while
        // reviving.
        state.reviveTime -= FRAME_LENGTH;
        if (state.defeatState.time % 200 === 0) {
            state.hero.life = Math.min(state.hero.maxLife, state.hero.life + 0.5);
            if (state.hero.life === state.hero.maxLife) {
                state.defeatState.defeated = false;
                saveGame(state);
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
            fixSpawnLocationOnLoad(state);
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
            enterLocation(state, state.transitionState.nextLocation, true, null, false, true);
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

function selectSaveFile(state: GameState, savedGameIndex: number): void {
    let savedGame = state.savedGames[state.savedGameIndex];
    if (!savedGame) {
        // For now go directly to starting the full game when selecting "New Game".
        state.hero.spawnLocation = SPAWN_LOCATION_FULL;
        state.scene = 'game';
        updateHeroMagicStats(state);
        returnToSpawnLocation(state);
        if (!isRandomizer) {
            state.scriptEvents.queue = parseScriptText(state, 'Waaaaah!', 1000, false);
            state.scriptEvents.queue.push({type: 'clearTextBox'});
        } else {
            if (randomizerGoalType === 'finalBoss') {
                setScript(state, `Defeat the final boss then talk to your mom to win!`);
            } else if (randomizerGoalType === 'victoryPoints') {
                setScript(state, `Find ${randomizerGoal} of ${randomizerTotal} Victory Points then talk to your mom to win!`);
            }

        }
        return;
        // Old code for showing the "Choose Game Mode" menu when selecting "New Game".
        /*state.scene = 'chooseGameMode';
        state.menuIndex = 0;
        // Adjust the current state so we can show the correct background preview.
        state.hero = new Hero();
        state.hero.applySavedHeroData(getDefaultSavedState().savedHeroData);
        state.hero.spawnLocation = SPAWN_LOCATION_FULL;
        fixSpawnLocationOnLoad(state);
        updateHeroMagicStats(state);
        returnToSpawnLocation(state);
        return;*/
    }
    setSaveFileToState(savedGameIndex);
    state.scene = 'game';
    // Hack to prevent showing the falling animation a second time on loading a game in the peach cave.
    if (!state.hero.weapon) {
        state.hero.z = 0;
    }
    if (!isRandomizer) {
        showHint(state);
    } else {
        // setScript(state, '{@mom.randomizer}');
    }
}
