import {sceneHash} from 'app/scenes/sceneHash';
import {setSaveFileToState} from 'app/scenes/fileSelect/setSaveFileToState';

export function showFileSelectScene(state: GameState) {
    // We render the field + hud behind the file select scene as a way to preview
    // the game when selecting a file.
    state.sceneStack = [sceneHash.field, sceneHash.hud, sceneHash.fileSelect];
    sceneHash.fileSelect.mode = 'select';
    sceneHash.fileSelect.menuIndex = 0;
    setSaveFileToState(state, 0, 0);
}
