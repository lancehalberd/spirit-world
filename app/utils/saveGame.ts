import {cloneDeep} from 'app/utils/index';

export function saveGame(state: GameState): void {
    if (state.savedGameIndex < 0) {
        return;
    }
    state.savedState.savedHeroData = cloneDeep(state.hero.savedData);
    // There is a bug where selecting the delete option in randomizer triggers the `saveGame`
    // function and saves a new file to the delete index which keeps creating more save files.
    // This is a hack to prevent this from happening.
    //if (state.savedGameIndex < state.savedGames.length) {
    //    state.savedGames[state.savedGameIndex] = state.savedState;
    //}
    state.savedGames[state.savedGameIndex] = state.savedState;
    // console.log(exportState(getState()));
    saveGamesToLocalStorage(state);
}
export function saveGamesToLocalStorage(state: GameState): void {
    try {
        const seed = state.randomizer?.seed || 0;
        window.localStorage.setItem('savedGames' + (seed || ''), JSON.stringify(state.savedGames));
    } catch (e) {
        console.error(e);
        debugger;
    }
}

export function setSaveSlot(state: GameState, index: number): void {
    state.savedGameIndex = index;
    saveGame(state);
}
