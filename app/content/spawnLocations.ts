import { CANVAS_HEIGHT } from 'app/gameConstants';
import { saveGame } from 'app/utils/saveGame';


export const SPAWN_LOCATION_TITLE: ZoneLocation = {
    zoneKey: 'title',
    floor: 0,
    x: 136,
    y: 384,
    z: 0,
    d: 'right',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: false,
};
export const SPAWN_LOCATION_TITLE_NO_BOTTOM_WALL: ZoneLocation = {
    zoneKey: 'titleNoBottomWall',
    floor: 0,
    x: 136,
    y: 384,
    z: 0,
    d: 'right',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: false,
};
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

export const SPAWN_DREAM_ENTRANCE: ZoneLocation = {
    zoneKey: 'dream',
    floor: 0,
    x: 312,
    y: 312,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 1, y: 2},
    isSpiritWorld: false,
};
export const SPAWN_DREAM_SPIRIT_ENTRANCE: ZoneLocation = {
    zoneKey: 'dream',
    floor: 0,
    x: 312,
    y: 312,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 1, y: 2},
    isSpiritWorld: false,
};
export const SPAWN_SPIRIT_TREE: ZoneLocation = {
    zoneKey: 'dream',
    floor: 0,
    x: 320,
    y: 192,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 1, y: 1},
    isSpiritWorld: false,
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
    x: 246,
    y: 408,
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


const prioritizedSpawnLocations = [
    // Spirit world
    SPAWN_LOCATION_TOMB_ENTRANCE,
    SPAWN_WAR_TEMPLE_ENTRANCE,
    SPAWN_COCOON_ENTRANCE,
    SPAWN_DREAM_ENTRANCE,
    SPAWN_DREAM_SPIRIT_ENTRANCE,
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

export function checkToUpdateSpawnLocation(state: GameState, location: ZoneLocation = state.location): void {
    // Only set the spawn location when in the game scene. This is to avoid accidentally setting
    // it from the title scene which can trigger unexpected saves.
    if (state.scene !== 'game') {
        return;
    }
    for (const spawnPoint of prioritizedSpawnLocations) {
        if (
            location.zoneKey === spawnPoint.zoneKey
            && location.floor === spawnPoint.floor
            && location.isSpiritWorld === spawnPoint.isSpiritWorld
            && location.areaGridCoords.x === spawnPoint.areaGridCoords.x
            && location.areaGridCoords.y === spawnPoint.areaGridCoords.y
        ) {
            return setSpawnLocation(state, spawnPoint);
        }
    }
}
