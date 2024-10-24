import { zones } from 'app/content/zones/zoneHash';
import { CANVAS_HEIGHT } from 'app/gameConstants';
import { saveGame } from 'app/utils/saveGame';



export const SPAWN_LOCATION_FULL: ZoneLocation = {
    zoneKey: 'peachCave',
    floor: 0,
    x: 112,
    y: 176,
    z: CANVAS_HEIGHT,
    d: 'up',
    areaGridCoords: {x: 0, y: 1},
    isSpiritWorld: false,
};
export const SPAWN_LOCATION_DEMO: ZoneLocation = {
    zoneKey: 'demo_entrance',
    floor: 0,
    x: 150,
    y: 100,
    d: 'up',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: false,
};

export const SPAWN_LOCATION_WATERFALL_VILLAGE: ZoneLocation = {
    zoneKey: 'overworld',
    floor: 0,
    x: 168,
    y: 290,
    z: 0,
    d: 'down',
    areaGridCoords: {x: 1, y: 0},
    isSpiritWorld: false,
};

export const SPAWN_LOCATION_PEACH_CAVE_BOSS: ZoneLocation = {
    zoneKey: 'peachCave',
    floor: 1,
    x: 120,
    y: 160,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: false,
};

export const SPAWN_LOCATION_PEACH_CAVE_EXIT: ZoneLocation = {
    zoneKey: 'overworld',
    floor: 0,
    x: 262,
    y: 122,
    z: 0,
    d: 'down',
    areaGridCoords: {x: 1, y: 1},
    isSpiritWorld: false,
};

export const SPAWN_LOCATION_TOMB_RIVAL: ZoneLocation = {
    zoneKey: 'overworld',
    floor: 0,
    x: 130,
    y: 180,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 1},
    isSpiritWorld: false,
};

export const SPAWN_LOCATION_TOMB_ENTRANCE: ZoneLocation = {
    zoneKey: 'tomb',
    floor: 1,
    x: 248,
    y: 440,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 1, y: 1},
    isSpiritWorld: false,
};
export const SPAWN_LOCATION_TOMB_BOSS: ZoneLocation = {
    zoneKey: 'tomb',
    floor: 0,
    x: 120,
    y: 170,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 1, y: 1},
    isSpiritWorld: false,
};

export const SPAWN_WAR_TEMPLE_ENTRANCE: ZoneLocation = {
    zoneKey: 'warTemple',
    floor: 0,
    x: 248,
    y: 440,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 1, y: 1},
    isSpiritWorld: false,
};
export const SPAWN_WAR_TEMPLE_ENTRANCE_SPIRIT: ZoneLocation = {
    zoneKey: 'warTemple',
    floor: 0,
    x: 248,
    y: 440,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 1, y: 1},
    isSpiritWorld: true,
};
export const SPAWN_WAR_TEMPLE_BOSS: ZoneLocation = {
    zoneKey: 'warTemple',
    floor: 2,
    x: 120,
    y: 170,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: false,
};
export const SPAWN_COCOON_ENTRANCE: ZoneLocation = {
    zoneKey: 'cocoon',
    floor: 3,
    x: 120,
    y: 440,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: false,
};
export const SPAWN_COCOON_BOSS: ZoneLocation = {
    zoneKey: 'cocoon',
    floor: 0,
    x: 112,
    y: 380,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: true,
};


export const SPAWN_LOCATION_LAKE_TUNNEL: ZoneLocation = {
    zoneKey: 'lakeTunnel',
    floor: 0,
    x: 120,
    y: 320,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: false,
};

export const SPAWN_LOCATION_HELIX_RIVAL: ZoneLocation = {
    zoneKey: 'lakeTunnel',
    floor: 0,
    x: 120,
    y: 128,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: false,
};

export const SPAWN_HELIX_ENTRANCE: ZoneLocation = {
    zoneKey: 'helix',
    floor: 0,
    x: 310,
    y: 530,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: false,
};

export const SPAWN_HELIX_MATERIAL_EXIT: ZoneLocation = {
    zoneKey: 'helix',
    floor: 3,
    x: 310,
    y: 530,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: false,
};

export const SPAWN_HELIX_SPIRIT_EXIT: ZoneLocation = {
    zoneKey: 'helix',
    floor: 3,
    x: 310,
    y: 530,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: true,
};

export const SPAWN_GRAND_TEMPLE_ENTRANCE: ZoneLocation = {
    zoneKey: 'grandTemple',
    floor: 0,
    x: 244,
    y: 470,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 1, y: 2},
    isSpiritWorld: false,
};


export const SPAWN_FOREST_ENTRANCE: ZoneLocation = {
    zoneKey: 'overworld',
    floor: 0,
    x: 400,
    y: 330,
    z: 0,
    d: 'down',
    areaGridCoords: {x: 0, y: 2},
    isSpiritWorld: true,
};
export const SPAWN_FOREST_BOSS: ZoneLocation = {
    zoneKey: 'forestTemple',
    floor: 0,
    x: 356,
    y: 488,
    z: 0,
    d: 'right',
    areaGridCoords: {x: 0, y: 1},
    isSpiritWorld: true,
};

export const SPAWN_WATERFALL_ENTRANCE: ZoneLocation = {
    zoneKey: 'waterfallTower',
    floor: 0,
    x: 424,
    y: 424,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 1},
    isSpiritWorld: true,
};
export const SPAWN_WATERFALL_BOSS: ZoneLocation = {
    zoneKey: 'waterfallTower',
    floor: 1,
    x: 240,
    y: 208,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 1},
    isSpiritWorld: true,
};

export const SPAWN_FORGE_ENTRANCE: ZoneLocation = {
    zoneKey: 'forge',
    floor: 0,
    x: 244,
    y: 448,
    z: 0,
    d: 'down',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: true,
};

export const SPAWN_GAUNTLET_ENTRANCE: ZoneLocation = {
    zoneKey: 'gauntlet',
    floor: 0,
    x: 56,
    y: 328,
    z: 0,
    d: 'down',
    areaGridCoords: {x: 0, y: 1},
    isSpiritWorld: false,
};

export const SPAWN_SKY_PALACE_ENTRANCE: ZoneLocation = {
    zoneKey: 'skyPalace',
    floor: 0,
    x: 250,
    y: 460,
    z: 0,
    d: 'down',
    areaGridCoords: {x: 1, y: 1},
    isSpiritWorld: true,
};

export const SPAWN_HOLY_SANCTUM_ENTRANCE: ZoneLocation = {
    zoneKey: 'holySanctum',
    floor: 0,
    x: 248,
    y: 368,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 1},
    isSpiritWorld: true,
};

export const RIVER_TEMPLE_LOWER_ENTRANCE: ZoneLocation = {
    zoneKey: 'riverTempleWater',
    floor: 0,
    x: 250,
    y: 390,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 1},
    isSpiritWorld: false,
};

export const RIVER_TEMPLE_UPPER_ENTRANCE: ZoneLocation = {
    zoneKey: 'riverTemple',
    floor: 1,
    x: 375,
    y: 312,
    z: 0,
    d: 'down',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: false,
};

export const RIVER_TEMPLE_BOSS: ZoneLocation = {
    zoneKey: 'riverTemple',
    floor: 0,
    x: 250,
    y: 440,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: false,
};

export const SPAWN_CRATER_ENTRANCE: ZoneLocation = {
    zoneKey: 'crater',
    floor: 0,
    x: 60,
    y: 440,
    z: 0,
    d: 'up',
    areaGridCoords: {y: 2, x: 0},
    isSpiritWorld: false,
};
export const SPAWN_CRATER_BOSS: ZoneLocation = {
    zoneKey: 'crater',
    floor: 0,
    x: 250,
    y: 180,
    z: 0,
    d: 'up',
    areaGridCoords: {y: 1, x: 1},
    isSpiritWorld: false,
};

export const SPAWN_STAFF_LOWER_ENTRANCE: ZoneLocation = {
    zoneKey: 'staffTower',
    floor: 0,
    x: 312,
    y: 592,
    z: 0,
    d: 'up',
    areaGridCoords: {y: 0, x: 0},
    isSpiritWorld: false,
};
export const SPAWN_STAFF_UPPER_ENTRANCE: ZoneLocation = {
    zoneKey: 'staffTower',
    floor: 2,
    x: 312,
    y: 592,
    z: 0,
    d: 'up',
    areaGridCoords: {y: 1, x: 0},
    isSpiritWorld: true,
};
export const SPAWN_STAFF_ELEVATOR: ZoneLocation = {
    zoneKey: 'staffTower',
    floor: 3,
    d: 'up',
    x: 248,
    y: 416,
    z: 0,
    areaGridCoords: {y: 1, x: 0},
    isSpiritWorld: true,
};
export const SPAWN_STAFF_BOSS: ZoneLocation = {
    zoneKey: 'staffTower',
    floor: 3,
    x: 312,
    y: 312,
    z: 0,
    d: 'up',
    areaGridCoords: {y: 0, x: 0},
    isSpiritWorld: false,
};

export const SPAWN_FINAL_BOSS_1: ZoneLocation = {
    zoneKey: 'void',
    floor: 0,
    x: 248,
    y: 448,
    z: 0,
    d: 'up',
    areaGridCoords: {y: 0, x: 0},
    isSpiritWorld: false,
};

export function setSpawnLocation(state: GameState, spawnLocation: ZoneLocation): void {
    state.hero.savedData.spawnLocation = spawnLocation;
    saveGame(state);
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

const prioritizedSpawnLocations = [
    // Spirit world
    SPAWN_LOCATION_TOMB_ENTRANCE,
    SPAWN_WAR_TEMPLE_ENTRANCE,
    SPAWN_COCOON_ENTRANCE,
    SPAWN_HELIX_ENTRANCE,
    SPAWN_HELIX_MATERIAL_EXIT,
    SPAWN_HELIX_SPIRIT_EXIT,
    SPAWN_GAUNTLET_ENTRANCE,
    SPAWN_FOREST_ENTRANCE,
    SPAWN_WATERFALL_ENTRANCE,
    SPAWN_FORGE_ENTRANCE,
    SPAWN_SKY_PALACE_ENTRANCE,
    SPAWN_HOLY_SANCTUM_ENTRANCE,
    SPAWN_CRATER_ENTRANCE,
    SPAWN_STAFF_UPPER_ENTRANCE,
    SPAWN_STAFF_LOWER_ENTRANCE,
    RIVER_TEMPLE_LOWER_ENTRANCE,
    RIVER_TEMPLE_UPPER_ENTRANCE,
    // Secret Lab
    // World Tree
];

export function checkToUpdateSpawnLocation(state: GameState): void {
    // Only set the spawn location when in the game scene. This is to avoid accidentally setting
    // it from the title scene which can trigger unexpected saves.
    if (state.scene !== 'game') {
        return;
    }
    // This spawn point cannot be used unless the war temple entrance is opened.
    /*if (state.location.zoneKey === 'warTemple' && state.savedState.objectFlags['warTempleEntrance']) {
        if (state.hero.savedData.spawnLocation.zoneKey !== 'warTemple') {
            setSpawnLocation(state, SPAWN_WAR_TEMPLE_ENTRANCE);
        }
        return;
    }
    if (state.location.zoneKey === 'staffTower') {
        if (
            state.location.floor === SPAWN_STAFF_UPPER_ENTRANCE.floor
            && state.location.isSpiritWorld === SPAWN_STAFF_UPPER_ENTRANCE.isSpiritWorld
        ) {
            return setSpawnLocation(state, SPAWN_STAFF_UPPER_ENTRANCE);
        }
        if (
            state.location.floor === SPAWN_STAFF_LOWER_ENTRANCE.floor
            && state.location.isSpiritWorld === SPAWN_STAFF_LOWER_ENTRANCE.isSpiritWorld
        ) {
            return setSpawnLocation(state, SPAWN_STAFF_LOWER_ENTRANCE);
        }
        // This should only apply when using the editor to bypass the normal entrances.
        if (state.hero.savedData.spawnLocation.zoneKey !== 'staffTower') {
            return setSpawnLocation(state, SPAWN_STAFF_LOWER_ENTRANCE);
        }
    }
    if (state.location.zoneKey === 'riverTempleWater' || state.location.zoneKey === 'riverTemple') {
        for (const spawnPoint of [RIVER_TEMPLE_LOWER_ENTRANCE, RIVER_TEMPLE_UPPER_ENTRANCE]) {
            if (
                state.location.zoneKey === spawnPoint.zoneKey
                && state.location.floor === spawnPoint.floor
                && state.location.isSpiritWorld === spawnPoint.isSpiritWorld
            ) {
                return setSpawnLocation(state, spawnPoint);
            }
        }
        // This should only apply when using the editor to bypass the normal entrances.
        if (state.hero.savedData.spawnLocation.zoneKey !== 'riverTempleWater'
            && state.hero.savedData.spawnLocation.zoneKey !== 'riverTemple'
        ) {
            return setSpawnLocation(state, RIVER_TEMPLE_UPPER_ENTRANCE);
        }
    }
    // If you are in the forest temple, or in overworld area that is part of the temple, respawn
    // at the forest temple entrance.
    if (state.location.zoneKey === 'forestTemple' || (
        state.location.zoneKey === 'overworld'
        && state.location.isSpiritWorld
        && state.location.areaGridCoords.x === 0
        && state.location.areaGridCoords.y === 2
    )) {
        return setSpawnLocation(state, SPAWN_FOREST_ENTRANCE);
    }*/
    for (const spawnPoint of prioritizedSpawnLocations) {
        if (
            state.location.zoneKey === spawnPoint.zoneKey
            && state.location.floor === spawnPoint.floor
            && state.location.isSpiritWorld === spawnPoint.isSpiritWorld
            && state.location.areaGridCoords.x === spawnPoint.areaGridCoords.x
            && state.location.areaGridCoords.y === spawnPoint.areaGridCoords.y
        ) {
            return setSpawnLocation(state, spawnPoint);
        }
    }
}
