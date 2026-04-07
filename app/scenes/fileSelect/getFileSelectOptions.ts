import type {FileSelectScene} from 'app/scenes/fileSelect/fileSelectScene';
import {getShortZoneName } from 'app/utils/getFullZoneLocation';

export function getFileSelectOptions(state: GameState, scene: FileSelectScene): string[] {
    if (scene.mode === 'customizeRandomizer') {
        return ['BACK'];
    }
    if (scene.mode === 'deleteSavedGameConfirmation') {
        return ['CANCEL', 'DELETE'];
    }
    const gameFiles = scene.savedGames.map(savedGame => {
        if (!savedGame) {
            return 'New Game';
        }
        return getShortZoneName(savedGame.savedHeroData.spawnLocation);
    });
    if (scene.mode === 'deleteSavedGame') {
        return [...gameFiles, 'CANCEL'];
    }
    if (scene.gameMode === 'randomizer') {
        gameFiles.push('CUSTOMIZE');
    }
    gameFiles.push('DELETE');
    gameFiles.push('TITLE');
    return gameFiles;
}
