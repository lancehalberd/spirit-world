import {SPAWN_LOCATION_FULL} from 'app/content/spawnLocations';
import {showHint} from 'app/content/hints';
import {isRandomizer, GAME_KEY, randomizerGoal, randomizerGoalType, randomizerTotal} from 'app/gameConstants';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import {playSound} from 'app/utils/sounds';
import {updateHeroMagicStats} from 'app/render/spiritBar';
import {showFieldScene} from 'app/scenes/field/showFieldScene';
import {setSaveFileToState} from 'app/scenes/fileSelect/setSaveFileToState';
import {getFileSelectOptions} from 'app/scenes/fileSelect/getFileSelectOptions';
import {returnToSpawnLocation} from 'app/utils/returnToSpawnLocation'
import {saveGamesToLocalStorage,} from 'app/utils/saveGame';
import {parseScriptText, setScript} from 'app/scriptEvents';
import {showTitleScene} from 'app/scenes/title/showTitleScene';
import type {FileSelectScene} from 'app/scenes/fileSelect/fileSelectScene';

export function updateFileSelect(state: GameState, scene: FileSelectScene) {
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
            if (scene.cursorIndex < state.savedGames.length) {
                setSaveFileToState(state, scene.cursorIndex, 0);
            }
        }
    }
    if (wasConfirmKeyPressed(state)) {
        playSound('menuTick');
        switch (scene.mode) {
            case 'deleteSavedGameConfirmation':
                if (scene.cursorIndex === 1) {
                    state.savedGames[state.savedGameIndex] = null;
                    saveGamesToLocalStorage(state);
                }
                scene.mode = 'select';
                scene.cursorIndex = state.savedGameIndex;
                setSaveFileToState(state, state.savedGameIndex, 0);
                break;
            case 'deleteSavedGame':
                if (scene.cursorIndex >= state.savedGames.length) {
                    scene.mode = 'select';
                    scene.cursorIndex = 0;
                    setSaveFileToState(state, scene.cursorIndex, 0);
                } else {
                    state.savedGameIndex = scene.cursorIndex;
                    scene.mode = 'deleteSavedGameConfirmation';
                    scene.cursorIndex = 0;
                }
                break;
            case 'select':
                if (scene.cursorIndex === state.savedGames.length
                        && options[scene.cursorIndex] === 'DELETE') {
                    scene.mode = 'deleteSavedGame';
                    scene.cursorIndex = 0;
                    setSaveFileToState(state, scene.cursorIndex, 0);
                } else if (scene.cursorIndex > state.savedGames.length
                        && options[scene.cursorIndex] === 'TITLE') {
                    showTitleScene(state);
                } else {
                    selectSaveFile(state, scene.cursorIndex);
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
        showFieldScene(state);
        updateHeroMagicStats(state);
        returnToSpawnLocation(state);
        if (!isRandomizer) {
            state.scriptEvents.queue = parseScriptText(state, 'Waaaaah!', false);
            state.scriptEvents.queue.push({type: 'wait', duration: 1000});
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
    setSaveFileToState(state, savedGameIndex);
    showFieldScene(state);
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
