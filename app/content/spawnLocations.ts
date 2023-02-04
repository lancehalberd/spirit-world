import { CANVAS_HEIGHT } from 'app/gameConstants';
import { saveGame } from 'app/utils/saveGame';

import { GameState, ZoneLocation } from 'app/types';


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
    y: 132,
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
    y: 200,
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
export const SPAWN_HELIX_ENTRANCE: ZoneLocation = {
    zoneKey: 'helix',
    floor: 0,
    x: 248,
    y: 440,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 0},
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
export const SPAWN_FOREST_BACK: ZoneLocation = {
    zoneKey: 'treeVillage',
    floor: 1,
    x: 320,
    y: 375,
    z: 0,
    d: 'right',
    areaGridCoords: {x: 0, y: 0},
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
    x: 124,
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
    x: 124,
    y: 448,
    z: 0,
    d: 'down',
    areaGridCoords: {x: 0, y: 0},
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
    y: 300,
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
    x: 250,
    y: 440,
    z: 0,
    d: 'up',
    areaGridCoords: {y: 0, x: 0},
    isSpiritWorld: false,
};
export const SPAWN_STAFF_UPPER_ENTRANCE: ZoneLocation = {
    zoneKey: 'staffTower',
    floor: 2,
    x: 250,
    y: 456,
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
    x: 248,
    y: 248,
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
    state.hero.spawnLocation = spawnLocation;
    saveGame(state);
}

export function fixSpawnLocationOnLoad(state: GameState): void {
    // Rather than fix individual spawn locations like this, we should force the loaded spawn location to
    // be in an enumeration of defined spawn locations, and just have logic to choose the best one.
    if (state.hero.spawnLocation.zoneKey === 'newPeachCave') {
        state.hero.spawnLocation.zoneKey = 'peachCave';
    }
    // The player restarts at the defeated boss if they haven't made it to the overworld yet.
    if (state.hero.spawnLocation.zoneKey === 'peachCave' && state.savedState.objectFlags['peachCave:boss']) {
        state.hero.spawnLocation = SPAWN_LOCATION_PEACH_CAVE_BOSS;
    }
    // Once the elavator has been dropped, the player spawns in the elevator until it is fixed,
    // otherwise they have no path back to the basement.
    if (state.savedState.objectFlags.elevatorDropped && !state.savedState.objectFlags.elevatorFixed) {
        state.hero.spawnLocation = SPAWN_STAFF_ELEVATOR;
    }
    if (state.hero.spawnLocation.zoneKey === 'staffTower' && state.hero.activeTools.staff >= 2) {
        // Do not spawn inside the tower if the tower is not currently placed anywhere.
        state.hero.spawnLocation = SPAWN_LOCATION_PEACH_CAVE_EXIT;
    }
}

const prioritizedSpawnLocations = [
    SPAWN_LOCATION_WATERFALL_VILLAGE,
    SPAWN_LOCATION_PEACH_CAVE_EXIT,
    // Spirit world
    SPAWN_LOCATION_TOMB_ENTRANCE,
    SPAWN_WAR_TEMPLE_ENTRANCE,
    SPAWN_COCOON_ENTRANCE,
    SPAWN_HELIX_ENTRANCE,
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
        if (state.hero.spawnLocation.zoneKey !== 'warTemple') {
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
        if (state.hero.spawnLocation.zoneKey !== 'staffTower') {
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
        if (state.hero.spawnLocation.zoneKey !== 'riverTempleWater'
            && state.hero.spawnLocation.zoneKey !== 'riverTemple'
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
