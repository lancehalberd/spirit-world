import {renderFileSelect} from 'app/scenes/fileSelect/renderFileSelect';
import {updateFileSelect} from 'app/scenes/fileSelect/updateFileSelect';
import {sceneHash} from 'app/scenes/sceneHash';
import {playTrack} from 'app/utils/sounds';

type FileSelectMode = 'select'|'customizeRandomizer'|'deleteSavedGame'|'deleteSavedGameConfirmation';

function getDailySeed(): number {
    const date = new Date();
    const year = (date.getFullYear() % 100).toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    // 10x so that you can easily increment to 10 new seeds before
    // running into the next daily seed.
    return parseInt(`${year}${month}${day}`, 10) * 10;
}

export class FileSelectScene implements GameScene {
    blocksInput = true;
    blocksUpdates = true;
    mode: FileSelectMode = 'select';
    cursorIndex = 0;
    savedGames: SavedState[] = [null];
    gameMode: GameMode = 'normal';
    randomizerBossGoalIndex = 0;
    randomizerConfig: SavedRandomizerState = {
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
        itemSeed: getDailySeed(),
    };
    update(state: GameState) {
        updateFileSelect(state, this);
    }
    updateMusic(state: GameState) {
        playTrack('mainTheme', 0);
        return true;
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        renderFileSelect(context, state, this);
    }
}


sceneHash.fileSelect = new FileSelectScene();
