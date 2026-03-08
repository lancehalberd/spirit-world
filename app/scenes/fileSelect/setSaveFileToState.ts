import {Hero} from 'app/content/hero';
import {SPAWN_LOCATION_FULL} from 'app/content/spawnLocations';
import {updateHeroMagicStats} from 'app/render/spiritBar';
import {getDefaultSavedState } from 'app/savedState'
import {fixProgressFlagsOnLoad, fixSpawnLocationOnLoad} from 'app/utils/fixState';
import {cloneDeep, mergeDeep} from 'app/utils/index';
import {returnToSpawnLocation } from 'app/utils/returnToSpawnLocation';

export function setSaveFileToState(state: GameState, savedGameIndex: number, gameMode: number = 0): void {
    state.savedGameIndex = savedGameIndex;
    let savedGame = state.savedGames[state.savedGameIndex];
    if (!savedGame) {
        savedGame = getDefaultSavedState();
        savedGame.savedHeroData.spawnLocation = SPAWN_LOCATION_FULL;
    }
    applySavedState(state, savedGame);
}

export function applySavedState(state: GameState, savedState: Partial<SavedState>): void {
    state.savedState = getDefaultSavedState();
    mergeDeep(state.savedState, cloneDeep(savedState));
    state.hero = new Hero(state.savedState.savedHeroData);
    state.hero.applySavedHeroData(savedState.savedHeroData);
    fixProgressFlagsOnLoad(state);
    fixSpawnLocationOnLoad(state);
    updateHeroMagicStats(state);
    // Preserve zone flags when entering zone initially.
    returnToSpawnLocation(state, true);
}
