import {Hero} from 'app/content/hero';
import {SPAWN_LOCATION_FULL, SPAWN_LOCATION_WATERFALL_VILLAGE} from 'app/content/spawnLocations';
import {updateHeroMagicStats} from 'app/render/spiritBar';
import {getSavedGames} from 'app/utils/saveGame';
import {getDefaultSavedState } from 'app/savedState'
import {fixProgressFlagsOnLoad, fixSpawnLocationOnLoad} from 'app/utils/fixState';
import {cloneDeep, mergeDeep} from 'app/utils/index';
import {returnToSpawnLocation } from 'app/utils/returnToSpawnLocation';


export function setSaveFileToState(state: GameState, savedGameIndex: number, gameMode: GameMode): void {
    state.savedGameIndex = savedGameIndex;
    state.savedGameMode = gameMode;
    let savedGame = getSavedGames(state, gameMode)[savedGameIndex];
    if (!savedGame) {
        savedGame = getDefaultSavedState();
        savedGame.savedHeroData.spawnLocation = gameMode === 'randomizer' ? SPAWN_LOCATION_WATERFALL_VILLAGE : SPAWN_LOCATION_FULL;
    }
    applySavedState(state, savedGame);
    if (gameMode === 'randomizer') {
        state.hero.magic = state.hero.maxMagic;
    }
}

export function applySavedState(state: GameState, savedState: Partial<SavedState>): void {
    state.savedState = getDefaultSavedState();
    mergeDeep(state.savedState, cloneDeep(savedState));
    state.hero = new Hero(state.savedState.savedHeroData);
    state.hero.applySavedHeroData(savedState.savedHeroData);
    fixProgressFlagsOnLoad(state);
    fixSpawnLocationOnLoad(state);
    updateHeroMagicStats(state, true);
    // Preserve zone flags when entering zone initially.
    returnToSpawnLocation(state, true);
}
