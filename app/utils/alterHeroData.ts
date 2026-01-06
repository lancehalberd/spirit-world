import { cloneDeep } from "./index";

export function alterHeroData(state: GameState, newHero: SavedHeroData): void {
    state.savedState.backupHeroData = cloneDeep(state.savedState.savedHeroData);
    state.savedState.savedHeroData = newHero;
    state.savedState.savedHeroData.playTime = state.savedState.backupHeroData.playTime
    state.hero.applySavedHeroData(state.savedState.savedHeroData);
}

export function restoreHeroData(state: GameState): void {
    let newPlayTime = state.savedState.savedHeroData.playTime;
    state.savedState.savedHeroData = cloneDeep(state.savedState.backupHeroData);
    state.savedState.savedHeroData.playTime = newPlayTime;
    state.hero.applySavedHeroData(state.savedState.savedHeroData);
}