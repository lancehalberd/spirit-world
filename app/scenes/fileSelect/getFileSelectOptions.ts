
import {SPAWN_LOCATION_FULL, SPAWN_LOCATION_WATERFALL_VILLAGE} from 'app/content/spawnLocations';
import {showHint} from 'app/content/hints';
import {isDemoMode} from 'app/gameConstants';
import {generateZoneVariations} from 'app/generator/generateZoneVariations';
import {updateHeroMagicStats} from 'app/render/spiritBar';
import {showFieldScene} from 'app/scenes/field/showFieldScene';
import {setSaveFileToState} from 'app/scenes/fileSelect/setSaveFileToState';
import {showRandomizerScene} from 'app/scenes/randomizer/randomizerScene';
import {showTitleScene} from 'app/scenes/title/showTitleScene';
import {parseScriptText, setScript} from 'app/scriptEvents';
import {getDefaultState} from 'app/state';
import {getShortZoneName } from 'app/utils/getFullZoneLocation';
import {fillRect, pad} from 'app/utils/index';
import {returnToSpawnLocation} from 'app/utils/returnToSpawnLocation'
import {drawText} from 'app/utils/simpleWhiteFont';
import {getSavedGames, saveGamesToLocalStorage,} from 'app/utils/saveGame';

import type {FileSelectScene} from 'app/scenes/fileSelect/fileSelectScene';


interface FileSelectOption {
    // Called when the cursor moves to this option.
    onHighlight?: (state: GameState, scene: FileSelectScene) => void
    onConfirm?: (state: GameState, scene: FileSelectScene) => void
    onLeft?: (state: GameState, scene: FileSelectScene) => void
    onRight?: (state: GameState, scene: FileSelectScene) => void
    render: (context: CanvasRenderingContext2D, state: GameState, scene: FileSelectScene, r: Rect) => void
}


function optionLabelRenderer(label: string) {
    return (context: CanvasRenderingContext2D, state: GameState, scene: FileSelectScene, r: Rect) => {
        drawText(context, label, r.x, r.y + r.h / 2, textOptions);
    };
}

const textOptions = <const>{
    textBaseline: 'middle',
    textAlign: 'left',
    size: 16,
};

function simpleOption(label: string, onConfirm: (state: GameState, scene: FileSelectScene) => void): FileSelectOption {
    return {
        onConfirm,
        render: optionLabelRenderer(label),
    };
}

const backOption = simpleOption('BACK', (state: GameState, scene: FileSelectScene) => {
    scene.mode = 'select';
});

const cancelDeleteOption = simpleOption('CANCEL', (state: GameState, scene: FileSelectScene) => {
    scene.mode = 'select';
    scene.cursorIndex = state.savedGameIndex;
    setSaveFileToState(state, state.savedGameIndex, scene.gameMode);
});

const confirmDeleteOption = simpleOption('DELETE', (state: GameState, scene: FileSelectScene) => {
    scene.mode = 'select';
    if (scene.gameMode === 'randomizer') {
        scene.savedGames.splice(state.savedGameIndex, 1);
        // Make sure there is still a "New Game" option at the end of the list.
        if (scene.savedGames[scene.savedGames.length - 1] !== null) {
            scene.savedGames.push(null);
        }
    } else {
        scene.savedGames[state.savedGameIndex] = null;
    }
    saveGamesToLocalStorage(state);
    scene.cursorIndex = state.savedGameIndex;
    setSaveFileToState(state, state.savedGameIndex, scene.gameMode);
});

const customRandomizerOption = simpleOption('CUSTOMIZE', (state: GameState, scene: FileSelectScene) => {
    scene.mode = 'customizeRandomizer';
    scene.cursorIndex = 0;
    setSaveFileToState(state, -1, scene.gameMode);
});

const deleteOption = simpleOption('DELETE', (state: GameState, scene: FileSelectScene) => {
    scene.mode = 'deleteSavedGame';
    scene.cursorIndex = 0;
    setSaveFileToState(state, scene.cursorIndex, scene.gameMode);
});

const titleOption = simpleOption('TITLE', (state: GameState, scene: FileSelectScene) => {
    showTitleScene(state);
});

const seedOption: FileSelectOption = {
    onLeft(state: GameState, scene: FileSelectScene) {
        scene.randomizerConfig.itemSeed--;
        if (scene.randomizerConfig.itemSeed <= 0) {
            scene.randomizerConfig.itemSeed = 1e9 - 1;
        }
    },
    onRight(state: GameState, scene: FileSelectScene) {
        scene.randomizerConfig.itemSeed++;
        if (scene.randomizerConfig.itemSeed >= 1e9) {
            scene.randomizerConfig.itemSeed = 1;
        }
    },
    render: (context: CanvasRenderingContext2D, state: GameState, scene: FileSelectScene, r: Rect) => {
        drawText(context, `Seed < ${scene.randomizerConfig.itemSeed} >`, r.x, r.y + r.h / 2, textOptions);
    },
};

const pointsTotalOption: FileSelectOption = {
    onLeft(state: GameState, scene: FileSelectScene) {
        scene.randomizerConfig.goal.victoryPoints.total = (scene.randomizerConfig.goal.victoryPoints.total - 1 + 100) % 100;
        const {goal, total} = scene.randomizerConfig.goal.victoryPoints;
        scene.randomizerConfig.goal.victoryPoints.goal = Math.min(goal, total);
    },
    onRight(state: GameState, scene: FileSelectScene) {
        scene.randomizerConfig.goal.victoryPoints.total = (scene.randomizerConfig.goal.victoryPoints.total + 1) % 100;
        const {goal, total} = scene.randomizerConfig.goal.victoryPoints;
        scene.randomizerConfig.goal.victoryPoints.goal = Math.min(goal, total);
    },
    render: (context: CanvasRenderingContext2D, state: GameState, scene: FileSelectScene, r: Rect) => {
        drawText(context, `Points < ${scene.randomizerConfig.goal.victoryPoints.total} >`, r.x, r.y + r.h / 2, textOptions);
    },
};

const pointsGoalOption: FileSelectOption = {
    onLeft(state: GameState, scene: FileSelectScene) {
        scene.randomizerConfig.goal.victoryPoints.goal--;
        const {goal, total} = scene.randomizerConfig.goal.victoryPoints;
        if (goal <= 0) {
            scene.randomizerConfig.goal.victoryPoints.goal = total;
        }
    },
    onRight(state: GameState, scene: FileSelectScene) {
        scene.randomizerConfig.goal.victoryPoints.goal++;
        const {goal, total} = scene.randomizerConfig.goal.victoryPoints;
        if (goal > total) {
            scene.randomizerConfig.goal.victoryPoints.goal = Math.min(1, total);
        }
    },
    render: (context: CanvasRenderingContext2D, state: GameState, scene: FileSelectScene, r: Rect) => {
        drawText(context, `Goal < ${scene.randomizerConfig.goal.victoryPoints.goal} >`, r.x, r.y + r.h / 2, textOptions);
    },
};

const bossChoices = isDemoMode ? ['None', 'Guardian'] : ['None', 'Guardian', 'Beasts', 'Void Tree'];
const bossGoalOption: FileSelectOption = {
    onLeft(state: GameState, scene: FileSelectScene) {
        scene.randomizerBossGoalIndex--;
        if (scene.randomizerBossGoalIndex < 0) {
            scene.randomizerBossGoalIndex = bossChoices.length - 1;
        }
        updateBossGoal(scene);
    },
    onRight(state: GameState, scene: FileSelectScene) {
        scene.randomizerBossGoalIndex++;
        if (scene.randomizerBossGoalIndex >= bossChoices.length) {
            scene.randomizerBossGoalIndex = 0;
        }
        updateBossGoal(scene);
    },
    render: (context: CanvasRenderingContext2D, state: GameState, scene: FileSelectScene, r: Rect) => {
        drawText(context, `Boss < ${bossChoices[scene.randomizerBossGoalIndex]} >`, r.x, r.y + r.h / 2, textOptions);
    },
};

function updateBossGoal(scene: FileSelectScene) {
    switch (bossChoices[scene.randomizerBossGoalIndex]) {
        case 'None':
            delete scene.randomizerConfig.goal.bossPoints;
            break;
        case 'Void Tree':
            scene.randomizerConfig.goal.bossPoints = {
                goal: 1,
                bossPoints: {voidTree: 1},
            };
            break;
        case 'Beasts':
            scene.randomizerConfig.goal.bossPoints = {
                goal: 3,
                bossPoints: {flameBeast: 1, frostBeast: 1, stormBeast: 1},
            };
            break;
        case 'Guardian':
            scene.randomizerConfig.goal.bossPoints = {
                goal: 1,
                bossPoints: {guardian: 1},
            };
            break;
    }
}

const entranceOption: FileSelectOption = {
    onConfirm(state: GameState, scene: FileSelectScene) {
        if (scene.randomizerConfig.entranceSeed) {
            delete scene.randomizerConfig.entranceSeed;
        } else {
            scene.randomizerConfig.entranceSeed = scene.randomizerConfig.itemSeed;
        }
    },
    render: (context: CanvasRenderingContext2D, state: GameState, scene: FileSelectScene, r: Rect) => {
        drawText(context, `Entrances`, r.x, r.y + r.h / 2, textOptions);
        const s = 12;
        const checkBox = {x: r.x + 80, y: r.y + r.h / 2 - s / 2, w: s, h: s};
        fillRect(context, checkBox, 'white');
        fillRect(context, pad(checkBox, -1), 'black');
        if (scene.randomizerConfig.entranceSeed) {
            fillRect(context, pad(checkBox, -1), '#0F0');
        }
    },
};

export function getRandomizerOptions(state: GameState, scene: FileSelectScene): FileSelectOption[] {
    const options = [
        backOption,
        seedOption,
        entranceOption,
        pointsTotalOption,
        pointsGoalOption,
        bossGoalOption,
    ];

    return options;
}

function getSavedGameLabel(savedGame: SavedState): string {
    if (!savedGame) {
        return 'New Game';
    }
    if (savedGame.savedRandomizerData) {
        return `${savedGame.savedRandomizerData.itemSeed}`;
    }
    return getShortZoneName(savedGame.savedHeroData.spawnLocation);
}

export function getFileSelectOptions(state: GameState, scene: FileSelectScene): FileSelectOption[] {
    if (scene.mode === 'customizeRandomizer') {
        return getRandomizerOptions(state, scene);
    }
    if (scene.mode === 'deleteSavedGameConfirmation') {
        return [cancelDeleteOption, confirmDeleteOption];
    }
    const options: FileSelectOption[] = scene.savedGames.map(savedGame => {
        return {
            onHighlight(state: GameState, scene: FileSelectScene) {
                setSaveFileToState(state, scene.cursorIndex, scene.gameMode);
            },
            onConfirm(state: GameState, scene: FileSelectScene) {
                if (scene.mode === 'select') {
                    selectSaveFile(state, scene);
                } else if (scene.mode === 'deleteSavedGame') {
                    state.savedGameIndex = scene.cursorIndex;
                    scene.mode = 'deleteSavedGameConfirmation';
                    scene.cursorIndex = 0;
                }
            },
            render: optionLabelRenderer(getSavedGameLabel(savedGame)),
        };
    });
    if (scene.mode === 'deleteSavedGame') {
        return [...options, cancelDeleteOption];
    }
    if (scene.gameMode === 'randomizer') {
        options.push(customRandomizerOption);
    }
    options.push(deleteOption);
    options.push(titleOption);
    return options;
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
            state.savedState.savedRandomizerData = scene.randomizerConfig;
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
