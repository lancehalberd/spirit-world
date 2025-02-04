import {SPAWN_LOCATION_PEACH_CAVE_EXIT, SPAWN_LOCATION_PEACH_CAVE_BOSS} from 'app/content/spawnLocations';
import { zones } from 'app/content/zones/zoneHash';


export function fixProgressFlagsOnLoad(state: GameState) {
    if (!state.savedState.objectFlags.flameBeast && (state.savedState.objectFlags.craterLava4Objects || state.savedState.objectFlags.craterLava4)) {
        delete state.savedState.objectFlags.craterLava4Objects;
        delete state.savedState.objectFlags.craterLava4;
    }
}

export function fixSpawnLocationOnLoad(state: GameState): void {
    const { zoneKey, floor} = state.hero.savedData.spawnLocation
    // Rather than fix individual spawn locations like this, we should force the loaded spawn location to
    // be in an enumeration of defined spawn locations, and just have logic to choose the best one.
    if (state.hero.savedData.spawnLocation.zoneKey === 'newPeachCave') {
        state.hero.savedData.spawnLocation.zoneKey = 'peachCave';
    }

    // We don't want the player to respawn inside of the peach cave if they finish the peach cave and then quit
    // before hitting another save point. To that end if their save slot is in the peach cave, we will spawn them
    // outside of it unless they have already talked to their mom or obtained the bow.
    const respectPeachCaveSave = state.hero.savedData.activeTools.bow > 0 || state.savedState.objectFlags.momElder;
    if (state.hero.savedData.spawnLocation.zoneKey === 'peachCave' && !respectPeachCaveSave) {
        if (state.savedState.objectFlags.homeInstructions) {
            // Once the player has stepped into the world map, start them outside the cave if they didn't save elsewhere.
            state.hero.savedData.spawnLocation = SPAWN_LOCATION_PEACH_CAVE_EXIT;
        } else if (state.savedState.objectFlags.peachCaveTree) {
            // The player restarts at the defeated boss if they haven't made it to the overworld yet.
            state.hero.savedData.spawnLocation = SPAWN_LOCATION_PEACH_CAVE_BOSS;
        }
    }
    if (state.hero.savedData.spawnLocation.zoneKey === 'staffTower' && state.hero.savedData.activeTools.staff & 2) {
        // Do not spawn inside the tower if the tower is not currently placed anywhere.
        state.hero.savedData.spawnLocation = SPAWN_LOCATION_PEACH_CAVE_EXIT;
    }
    const zone = zones[zoneKey];
    if (!zone) {
        // Just spawn at the exit to the peach cave if the zone doesn't exist.
        state.hero.savedData.spawnLocation = SPAWN_LOCATION_PEACH_CAVE_EXIT;
    }
    if (!zone.floors[floor]) {
        state.hero.savedData.spawnLocation.floor = 0;
        state.hero.savedData.spawnLocation.areaGridCoords = {x: 0, y: 0};
    }
}
