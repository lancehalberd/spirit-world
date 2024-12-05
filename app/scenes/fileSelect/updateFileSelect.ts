import {
    SPAWN_LOCATION_DEMO,
    SPAWN_LOCATION_FULL,
} from 'app/content/spawnLocations';
import { Hero } from 'app/content/hero';
import { showHint } from 'app/content/hints';
import { isRandomizer, GAME_KEY, randomizerGoal, randomizerGoalType, randomizerTotal } from 'app/gameConstants';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import { playSound } from 'app/utils/sounds';
import { updateHeroMagicStats } from 'app/render/spiritBar';
import { getDefaultSavedState } from 'app/savedState'
import {
    getFileSelectOptions,
    setSaveFileToState,
} from 'app/state';
import { returnToSpawnLocation } from 'app/utils/returnToSpawnLocation'
import { saveGamesToLocalStorage, } from 'app/utils/saveGame';
import { parseScriptText, setScript } from 'app/scriptEvents';
import { showTitleScene } from 'app/scenes/title/showTitleScene';

export function updateFileSelect(state: GameState) {
    const options = getFileSelectOptions(state);
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
        if (state.scene === 'fileSelect' || state.scene === 'deleteSavedGame') {
            if (state.menuIndex < state.savedGames.length) {
                setSaveFileToState(state.menuIndex, 0);
            }
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
                    saveGamesToLocalStorage(state);
                }
                state.scene = 'fileSelect';
                state.menuIndex = state.savedGameIndex;
                setSaveFileToState(state.savedGameIndex, 0);
                break;
            case 'deleteSavedGame':
                if (state.menuIndex >= state.savedGames.length) {
                    state.scene = 'fileSelect';
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
                    state.hero.savedData.spawnLocation = SPAWN_LOCATION_FULL;
                    state.scene = 'game';
                    updateHeroMagicStats(state);
                    returnToSpawnLocation(state);
                } else if (state.menuIndex === 1) {
                    // Demo
                    state.hero.savedData.spawnLocation = SPAWN_LOCATION_DEMO;
                    state.scene = 'game';
                    updateHeroMagicStats(state);
                    returnToSpawnLocation(state);
                } else {
                    state.scene = 'fileSelect';
                    state.menuIndex = state.savedGameIndex;
                    setSaveFileToState(state.savedGameIndex, 0);
                }
                break;
            case 'fileSelect':
                if (state.menuIndex === state.savedGames.length
                        && options[state.menuIndex] === 'DELETE') {
                    state.scene = 'deleteSavedGame';
                    state.menuIndex = 0;
                    setSaveFileToState(state.menuIndex, 0);
                } else if (state.menuIndex > state.savedGames.length
                        && options[state.menuIndex] === 'TITLE') {
                    showTitleScene(state);
                } else {
                    selectSaveFile(state, state.menuIndex);
                }
                break;
        }
    }
}


function selectSaveFile(state: GameState, savedGameIndex: number): void {
    let savedGame = state.savedGames[state.savedGameIndex];
    if (!savedGame) {
        // For now go directly to starting the full game when selecting "New Game".
        state.hero.savedData.spawnLocation = SPAWN_LOCATION_FULL;
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
    }
    setSaveFileToState(savedGameIndex);
    state.scene = 'game';
    // Hack to prevent showing the falling animation a second time on loading a game in the peach cave.
    if (state.location.zoneKey === 'peachCave' && state.hero.z > 100) {
        state.hero.z = 0;
        state.hero.swimming = true;
    }
    if (!isRandomizer) {
        showHint(state);
    } else {
        // setScript(state, '{@mom.randomizer}');
    }
}
