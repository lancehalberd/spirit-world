import {generateZoneVariations} from 'app/generator/generateZoneVariations';
import {SPAWN_LOCATION_FULL, SPAWN_LOCATION_WATERFALL_VILLAGE} from 'app/content/spawnLocations';
import {showHint} from 'app/content/hints';
import {GAME_KEY, itemSeed, entranceSeed} from 'app/gameConstants';
import {updateHeroMagicStats} from 'app/render/spiritBar';
import {showFieldScene} from 'app/scenes/field/showFieldScene';
import {setSaveFileToState} from 'app/scenes/fileSelect/setSaveFileToState';
import {getFileSelectOptions} from 'app/scenes/fileSelect/getFileSelectOptions';
import {showRandomizerScene} from 'app/scenes/randomizer/randomizerScene';
import {showTitleScene} from 'app/scenes/title/showTitleScene';
import {parseScriptText, setScript} from 'app/scriptEvents';
import {getDefaultState} from 'app/state';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import {playSound} from 'app/utils/sounds';
import {returnToSpawnLocation} from 'app/utils/returnToSpawnLocation'
import {getSavedGames, saveGamesToLocalStorage,} from 'app/utils/saveGame';
import {saveSettings} from 'app/utils/saveSettings';

import type {FileSelectScene} from 'app/scenes/fileSelect/fileSelectScene';

export function updateFileSelect(state: GameState, scene: FileSelectScene) {
    // Any users that try to use the old URL params for item or entrance randomization
    // will have the randomizer mode automatically unlocked for them instead of
    // manually unlocking it through beating the game or using the context menu.
    if (!state.settings.isRandomizerUnlocked && !(itemSeed || entranceSeed)) {
        state.settings.isRandomizerUnlocked = true;
        saveSettings(state);
    }
    const options = getFileSelectOptions(state, scene);
    let changedOption = false;
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        scene.cursorIndex = (scene.cursorIndex - 1 + options.length) % options.length;
        changedOption = true;
        playSound('menuTick');
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        scene.cursorIndex = (scene.cursorIndex + 1) % options.length;
        changedOption = true;
        playSound('menuTick');
    }
    if (changedOption) {
        if (scene.mode === 'select' || scene.mode === 'deleteSavedGame') {
            if (scene.cursorIndex < scene.savedGames.length) {
                setSaveFileToState(state, scene.cursorIndex, scene.gameMode);
            }
        }
    }
    if (wasConfirmKeyPressed(state)) {
        playSound('menuTick');
        switch (scene.mode) {
            case 'customizeRandomizer':
                if (scene.cursorIndex === 0) {
                    scene.mode = 'select';
                }
                break;
            case 'deleteSavedGameConfirmation':
                if (scene.cursorIndex === 1) {
                    scene.savedGames[state.savedGameIndex] = null;
                    saveGamesToLocalStorage(state);
                }
                scene.mode = 'select';
                scene.cursorIndex = state.savedGameIndex;
                setSaveFileToState(state, state.savedGameIndex, scene.gameMode);
                break;
            case 'deleteSavedGame':
                if (scene.cursorIndex >= scene.savedGames.length) {
                    scene.mode = 'select';
                    scene.cursorIndex = 0;
                    setSaveFileToState(state, scene.cursorIndex, scene.gameMode);
                } else {
                    state.savedGameIndex = scene.cursorIndex;
                    scene.mode = 'deleteSavedGameConfirmation';
                    scene.cursorIndex = 0;
                }
                break;
            case 'select':
                if (scene.cursorIndex < scene.savedGames.length) {
                    selectSaveFile(state, scene);
                    break;
                }
                switch (options[scene.cursorIndex]) {
                    case 'DELETE':
                        scene.mode = 'deleteSavedGame';
                        scene.cursorIndex = 0;
                        setSaveFileToState(state, scene.cursorIndex, scene.gameMode);
                        break;
                    case 'TITLE':
                        showTitleScene(state);
                        break;
                    case 'CUSTOMIZE':
                        scene.mode = 'customizeRandomizer';
                        scene.cursorIndex = 0;
                        setSaveFileToState(state, -1, scene.gameMode);
                        break;
                }
                break;
        }
    }
}


function selectSaveFile(state: GameState, scene: FileSelectScene): void {
    let savedGame = getSavedGames(state, scene.gameMode)[scene.cursorIndex];
    if (!savedGame) {
        // Choose correct starting location and condition based on game mode.
        if (scene.gameMode === 'randomizer') {
            state.hero.savedData.spawnLocation = SPAWN_LOCATION_WATERFALL_VILLAGE;
        } else {
            state.hero.savedData.spawnLocation = SPAWN_LOCATION_FULL;
        }
        if (scene.gameMode === 'randomizer') {
            state.savedState.savedRandomizerData = {
                goal: {
                    victoryPoints: {
                        // How many victory points are available
                        total: 30,
                        // How many victory points are required to finish.
                        goal: 20,
                    }
                },
                //enemySeed?: number
                //entranceSeed?: number
                itemSeed: Date.now(),
            };
            showRandomizerScene(state, state.savedState.savedRandomizerData);
            const {goal, total} = state.savedState.savedRandomizerData.goal?.victoryPoints ?? {};
            if (goal && total) {
                setScript(state, `Find ${goal} of ${total} Victory Points then talk to your mom to win!`);
            }
            /*if (randomizerGoalType === 'finalBoss') {
                setScript(state, `Defeat the final boss then talk to your mom to win!`);
            } else if (randomizerGoalType === 'victoryPoints') {
                setScript(state, `Find ${randomizerGoal} of ${randomizerTotal} Victory Points then talk to your mom to win!`);
            }*/
        } else {
            // Note that currently variantSeed is not saved on non-randomizer save files.
            // Changes between variants are intended to be mild enough that it won't effect
            // your game progress to switch from one variant to another.
            state.variantSeed = getDefaultState().variantSeed;
            generateZoneVariations(state);
            updateHeroMagicStats(state, true);
            returnToSpawnLocation(state);
            showFieldScene(state);
            state.scriptEvents.queue = parseScriptText(state, 'Waaaaah!', false);
            state.scriptEvents.queue.push({type: 'wait', duration: 1000});
            state.scriptEvents.queue.push({type: 'clearTextBox'});
        }
        return;
    }
    setSaveFileToState(state, scene.cursorIndex, scene.gameMode);
    // If we are loading a saved file with randomization, we have to regenerate the
    // random assignments from the randomizer data before loading the game.
    if (savedGame.savedRandomizerData) {
        showRandomizerScene(state, savedGame.savedRandomizerData);
        return;
    }
    state.variantSeed = getDefaultState().variantSeed;
    generateZoneVariations(state);
    showFieldScene(state);
    // Hack to prevent showing the falling animation a second time on loading a game in the peach cave.
    if (state.location.zoneKey === 'peachCave' && state.hero.z > 100) {
        state.hero.z = 0;
        state.hero.swimming = true;
    }
    showHint(state);
}
