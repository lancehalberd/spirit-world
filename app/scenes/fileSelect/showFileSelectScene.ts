import {sceneHash} from 'app/scenes/sceneHash';
import {setSaveFileToState} from 'app/scenes/fileSelect/setSaveFileToState';
import {getSavedGames} from 'app/utils/saveGame';

export function showFileSelectScene(state: GameState, gameMode: GameMode) {
    // We render the field + hud behind the file select scene as a way to preview
    // the game when selecting a file.
    state.sceneStack = [sceneHash.field, sceneHash.hud, sceneHash.fileSelect];
    sceneHash.fileSelect.mode = 'select';
    sceneHash.fileSelect.cursorIndex = 0;
    sceneHash.fileSelect.gameMode = gameMode;
    sceneHash.fileSelect.savedGames = getSavedGames(state, gameMode);
    setSaveFileToState(state, 0, gameMode);
}
