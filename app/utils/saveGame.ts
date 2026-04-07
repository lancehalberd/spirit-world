import {cloneDeep} from 'app/utils/index';

export function getSavedGames(state: GameState, gameMode: GameMode) {
    if (gameMode === 'normal') {
        return state.savedGames;
    }
    // Don't save when testing.
    if (gameMode === 'test') {
        return [];
    }
    return state.savedRandomizerGames;
}

export function saveGame(state: GameState): void {
    if (state.savedGameIndex < 0 || state.savedGameMode === 'test') {
        return;
    }
    // Do not save while the real hero data is stored on backupHeroData.
    if (state.backupHeroData) {
        return;
    }
    state.savedState.savedHeroData = cloneDeep(state.hero.savedData);
    // There is a bug where selecting the delete option in randomizer triggers the `saveGame`
    // function and saves a new file to the delete index which keeps creating more save files.
    // This is a hack to prevent this from happening.
    //if (state.savedGameIndex < state.savedGames.length) {
    //    state.savedGames[state.savedGameIndex] = state.savedState;
    //}
    const savedGames = getSavedGames(state, state.savedGameMode);
    savedGames[state.savedGameIndex] = state.savedState;
    // console.log(exportState(getState()));
    saveGamesToLocalStorage(state);
}
export function saveGamesToLocalStorage(state: GameState): void {
    try {
        if (state.savedGameMode === 'normal') {
            window.localStorage.setItem('savedGames', JSON.stringify(state.savedGames));
        } else if (state.savedGameMode === 'randomizer') {
            window.localStorage.setItem('savedRandomizerGames', JSON.stringify(state.savedRandomizerGames));
        }
    } catch (e) {
        console.error(e);
        debugger;
    }
}

export function setSaveSlot(state: GameState, index: number): void {
    state.savedGameIndex = index;
    saveGame(state);
}
