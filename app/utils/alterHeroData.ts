import {Hero} from 'app/content/hero';
import {updateHeroMagicStats} from "app/render/spiritBar"
import {cloneDeep} from "app/utils/index";

export function backupHeroData(state: GameState) {
    if (!state.backupHeroData) {
        state.backupHeroData = state.hero.savedData;
    } else {
        throw new Error('Attempted to backup hero data without restoring it.');
    }
}

export function alterHeroData(state: GameState, newHeroData: SavedHeroData): void {
    const savedHeroData = cloneDeep(newHeroData);
    state.hero = new Hero(savedHeroData);
    state.hero.applySavedHeroData(savedHeroData);
    updateHeroMagicStats(state, true);
    // Start with full spirit energy if it is available at all.
    if (state.hero.maxMagic > 20) {
        state.hero.magic = state.hero.maxMagic;
    }
}

export function restoreHeroData(state: GameState): void {
    if (!state.backupHeroData) {
        throw new Error('No backup found to restore hero data from.');
    }
    state.hero = new Hero(state.backupHeroData);
    state.hero.applySavedHeroData(state.backupHeroData);
    updateHeroMagicStats(state, true);
    delete state.backupHeroData;
}

// Returns the actual SavedHeroData for the current game in progress, even
// when temporary hero data is being used for special circumstances.
export function getRealSavedHeroData(state: GameState): SavedHeroData {
    if (state.backupHeroData) {
        return state.backupHeroData;
    }
    return state.hero.savedData;
}
