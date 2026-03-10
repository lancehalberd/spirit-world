import {renderFileSelect} from 'app/scenes/fileSelect/renderFileSelect';
import {updateFileSelect} from 'app/scenes/fileSelect/updateFileSelect';
import {sceneHash} from 'app/scenes/sceneHash';
import {playTrack} from 'app/utils/sounds';

type FileSelectMode = 'select' | 'deleteSavedGame' | 'deleteSavedGameConfirmation';

export class FileSelectScene implements GameScene {
    blocksInput = true;
    blocksUpdates = true;
    mode: FileSelectMode = 'select';
    cursorIndex = 0;
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
