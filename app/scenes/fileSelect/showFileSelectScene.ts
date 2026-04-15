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
    // Initialize victory points the first time we show the randomizer. This isn't
    // hard coded because we want the amount to be lower if this is the demo mode.
    if (gameMode === 'randomizer' && !sceneHash.fileSelect.randomizerConfig.goal?.victoryPoints) {
        sceneHash.fileSelect.randomizerConfig.goal.victoryPoints = {
            // How many victory points are available
            total: state.isDemoMode ? 15 : 30,
            // How many victory points are required to finish.
            goal: state.isDemoMode ? 10 : 20,
        }
    }
    setSaveFileToState(state, 0, gameMode);
}
