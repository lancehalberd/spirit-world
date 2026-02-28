import {sceneHash} from 'app/scenes/sceneHash';
import {setSaveFileToState} from 'app/scenes/fileSelect/setSaveFileToState';

export function showFileSelectScene(state: GameState) {
    state.sceneStack = [sceneHash.fileSelect];
    sceneHash.fileSelect.mode = 'select';
    sceneHash.fileSelect.menuIndex = 0;
    setSaveFileToState(state, 0, 0);
}
