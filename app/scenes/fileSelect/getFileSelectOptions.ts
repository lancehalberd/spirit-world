import type {FileSelectScene} from 'app/scenes/fileSelect/fileSelectScene';
import {getShortZoneName } from 'app/utils/getFullZoneLocation';

export function getFileSelectOptions(state: GameState, scene: FileSelectScene): string[] {
    if (scene.mode === 'deleteSavedGameConfirmation') {
        return ['CANCEL', 'DELETE'];
    }
    const gameFiles = state.savedGames.map(savedGame => {
        if (!savedGame) {
            return 'New Game';
        }
        return getShortZoneName(savedGame.savedHeroData.spawnLocation);
    });
    if (scene.mode === 'deleteSavedGame') {
        return [...gameFiles, 'CANCEL'];
    }
    return [...gameFiles, 'DELETE', 'TITLE'];
}
