import { altGolemState } from "app/content/heroSavedStates";
import { cloneDeep } from "./index";
import { updateHeroMagicStats } from "app/render/spiritBar";

export function alterHeroData(state: GameState, newHero: SavedHeroData): void {
    state.savedState.backupHeroData = cloneDeep(state.hero.savedData);
    state.hero.savedData = newHero;
    delete(state.hero.savedData.leftTool);
    delete(state.hero.savedData.rightTool);
    state.hero.life = state.hero.savedData.maxLife;
    //state.savedState.savedHeroData.playTime = state.savedState.backupHeroData.playTime
    //state.hero.applySavedHeroData(state.savedState.savedHeroData);
}

export function restoreHeroData(state: GameState): void {
    //let newPlayTime = state.savedState.savedHeroData.playTime;
    state.hero.savedData = state.savedState.backupHeroData;
    //state.savedState.savedHeroData.playTime = newPlayTime;
    state.hero.applySavedHeroData(state.savedState.savedHeroData);
    updateHeroMagicStats(state);
    delete state.savedState.backupHeroData;
    fixAltStates();
    return;
}

function fixAltStates(): void {
    altGolemState.maxLife = 4;
}