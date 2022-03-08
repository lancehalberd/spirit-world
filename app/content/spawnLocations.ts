import { cloneDeep } from 'lodash';

import { CANVAS_HEIGHT } from 'app/gameConstants';
import { applySavedState, getDefaultSavedState, getState, returnToSpawnLocation, saveGame } from 'app/state';
import { MenuOption } from 'app/types';

import { GameState, SavedState, ZoneLocation } from 'app/types';


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
    x: 448,
    y: 448,
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

function applyItems(savedState: SavedState, items: {[key: string]: number}, objectFlags: string[] = []): SavedState {
    const newState: SavedState = cloneDeep(savedState);
    for (const flag of objectFlags) {
        newState.objectFlags[flag] = true;
    }
    for (let key in items) {
        if (key === 'maxLife') {
            newState.savedHeroData.maxLife += items[key];
            continue;
        }
        if (key === 'money') {
            newState.savedHeroData.money += items[key];
            continue;
        }
        if (key === 'weapon') {
            newState.savedHeroData.weapon = items[key];
            continue;
        }
        if (key.indexOf(':') >= 0) {
            const [zoneKey, item] = key.split(':');
            newState.dungeonInventories[zoneKey] = {
                ...newState.dungeonInventories[zoneKey],
                [item]: items[key],
            };
            continue;
        }
        if (typeof newState.savedHeroData.activeTools[key] !== 'undefined') {
            newState.savedHeroData.activeTools[key] = items[key];
            continue;
        }
        if (typeof newState.savedHeroData.elements[key] !== 'undefined') {
            newState.savedHeroData.elements[key] = items[key];
            continue;
        }
        if (typeof newState.savedHeroData.equipment[key] !== 'undefined') {
            newState.savedHeroData.equipment[key] = items[key];
            continue;
        }
        if (typeof newState.savedHeroData.passiveTools[key] !== 'undefined') {
            newState.savedHeroData.passiveTools[key] = items[key];
            continue;
        }
        console.log('Could not find key', key, items[key]);
    }
    return newState;
}

const defaultSavedState = getDefaultSavedState();
const peachBossState = applyItems(defaultSavedState, {weapon: 1, money: 50},
    ['peachCave:0:0x0-weapon-0', 'peachCaveSprout1', 'peachCaveSprout2']
);
const peachCaveExitState = applyItems(peachBossState, {maxLife: 1, catEyes: 1},
    ['peachCave:boss', 'peachCave:fullPeach', 'homeInstructions']
);
const tombStartState = applyItems(peachCaveExitState, {bow: 1},
    ['treeVillage:1:0x0-bow-0', 'closedBowDoor', 'elderTomb', 'tombEntrance']
);
tombStartState.savedHeroData.leftTool = 'bow';
const tombBossState = applyItems(tombStartState, {roll: 1, 'tomb:bigKey': 1},
    ['tombKey1', 'tombKey2', 'tombBigKey', 'tomb:1:1x0-roll-0']
);
const warTempleStart = applyItems(tombBossState, {maxLife: 1, spiritSight: 1},
    ['tombBoss', 'warTempleEntrance', 'tombTeleporter']);
const warTempleBoss = applyItems(warTempleStart, {gloves: 1, 'warTemple:bigKey': 1});
const cocoonStartState = applyItems(warTempleBoss, {maxLife: 1, astralProjection: 1}, ['warTempleBoss', 'tombExit']);
const cocoonBossState = applyItems(cocoonStartState, {'cocoon:bigKey': 1, 'cloak': 1}, []);
cocoonBossState.savedHeroData.rightTool = 'cloak';
const helixStartState = applyItems(cocoonBossState, {maxLife: 1, teleportation: 1},
    ['cocoonTeleporter', 'lakeTunneBoss']);
const helixEndState = applyItems(helixStartState, {charge: 1, staff: 1},
    ['elementalBeastsEscaped']);
const forestBackState = applyItems(helixEndState, {cloudBoots: 1, 'forestTemple:bigKey': 1});
const waterfallBossState = applyItems(helixEndState, {ironBoots: 1});

const riverTempleStartState = applyItems(helixEndState, {
    cloudBoots: 1, clone: 1,
    ironBoots: 1, cloak: 2,
    maxLife: 2,
    staff: 2, lightning: 1,
    fireBlessing: 1, fire: 1,
}, ['flameBeast', 'stormBeast']);
const riverTempleBossState = applyItems(riverTempleStartState,
    {'riverTemple:bigKey': 1, 'fire': 1, 'lightning': 1},
    ['bossBubblesNorth','bossBubblesSouth', 'bossBubblesWest', 'bossBubblesEast']
);

const craterStartState = applyItems(helixEndState, {
    cloudBoots: 1, clone: 1,
    ironBoots: 1, cloak: 2,
    maxLife: 2,
    staff: 2, lightning: 1,
    waterBlessing: 1, ice: 1,
}, ['frostBeast', 'stormBeast']);
const craterBossState = applyItems(craterStartState, {fireBlessing: 1},
    ['craterLava1', 'craterLava2', 'craterLava3', 'craterLava4', 'craterLava5']
);

const staffStartState = applyItems(helixEndState, {
    cloudBoots: 1, clone: 1,
    ironBoots: 1, cloak: 2,
    maxLife: 2,
    fireBlessing: 1, fire: 1,
    waterBlessing: 1, ice: 1,
}, ['frostBeast', 'flameBeast']);
const staffBossState = applyItems(staffStartState, {}, [
    'staffTowerSpiritEntrance', 'tower2FBarrier',
    'elevatorDropped', 'elevatorFixed',
    'tower3FBarrier', 'staffTowerSkyEntrance',
]);
const staffAquiredState = applyItems(staffBossState, {lightning: 1}, [
    'stormBeast',
    'staffTowerActivated'
]);

const warshipStartState = applyItems(staffAquiredState, {staff: 2});

interface SpawnLocationOptions {
    [key: string]: {location: ZoneLocation, savedState: SavedState},
}

const earlySpawnLocations: SpawnLocationOptions = {
    'Peach Cave Start': {
        location: SPAWN_LOCATION_FULL,
        savedState: defaultSavedState,
    },
    'Peach Cave Boss': {
        location: SPAWN_LOCATION_PEACH_CAVE_BOSS,
        savedState: peachBossState,
    },
    'Peach Cave Exit': {
        location: SPAWN_LOCATION_PEACH_CAVE_EXIT,
        savedState: peachCaveExitState,
    },
    'Tomb Start': {
        location: SPAWN_LOCATION_TOMB_ENTRANCE,
        savedState: tombStartState,
    },
    'Tomb Boss': {
        location: SPAWN_LOCATION_TOMB_BOSS,
        savedState: tombBossState,
    },
    'War Temple Start': {
        location: SPAWN_WAR_TEMPLE_ENTRANCE,
        savedState: warTempleStart,
    },
    'War Temple Boss': {
        location: SPAWN_WAR_TEMPLE_BOSS,
        savedState: warTempleBoss,
    },
    'Cocoon Start': {
        location: SPAWN_COCOON_ENTRANCE,
        savedState: cocoonStartState,
    },
    'Cocoon Boss': {
        location: SPAWN_COCOON_BOSS,
        savedState: cocoonBossState,
    },
    'Helix Start': {
        location: SPAWN_HELIX_ENTRANCE,
        savedState: helixStartState,
    },
};

const middleSpawnLocations: SpawnLocationOptions = {
    'Forest Start': {
        location: SPAWN_FOREST_ENTRANCE,
        savedState: helixEndState,
    },
    'Forest Back': {
        location: SPAWN_FOREST_BACK,
        savedState: forestBackState,
    },
    'Waterfall Start': {
        location: SPAWN_WATERFALL_ENTRANCE,
        savedState: helixEndState,
    },
    'Waterfall Boss': {
        location: SPAWN_WATERFALL_BOSS,
        savedState: waterfallBossState,
    },
};

const lateSpawnLocations: SpawnLocationOptions = {
    'Lake Start': {
        location: SPAWN_LOCATION_PEACH_CAVE_EXIT,
        savedState: riverTempleStartState,
    },
    'Lake Boss': {
        location: RIVER_TEMPLE_BOSS,
        savedState: riverTempleBossState,
    },
    'Crater Start': {
        location: SPAWN_CRATER_ENTRANCE,
        savedState: craterStartState,
    },
    'Crater Boss': {
        location: SPAWN_CRATER_BOSS,
        savedState: craterBossState,
    },
    'Tower Lower': {
        location: SPAWN_STAFF_LOWER_ENTRANCE,
        savedState: staffStartState,
    },
    'Tower Upper': {
        location: SPAWN_STAFF_UPPER_ENTRANCE,
        savedState: staffStartState,
    },
    'Tower Boss': {
        location: SPAWN_STAFF_BOSS,
        savedState: staffBossState,
    },
    'Tower Aquired': {
        location: SPAWN_STAFF_LOWER_ENTRANCE,
        savedState: staffAquiredState,
    },
    'Warship Start': {
        location: SPAWN_WAR_TEMPLE_ENTRANCE_SPIRIT,
        savedState: warshipStartState,
    },
};

function getSpawnLocationOptions(spawnLocations: SpawnLocationOptions, useSavedState = false) {
    return Object.keys(spawnLocations).map(name => {
        return {
            label: `${name}`,
            onSelect() {
                const state = getState();
                if (useSavedState) {
                    applySavedState(state, cloneDeep(spawnLocations[name].savedState));
                }
                setSpawnLocation(state, spawnLocations[name].location);
                returnToSpawnLocation(state);
                state.scene = 'game';
            }
        }
    });
}

export function getSpawnLocationContextMenuOption(): MenuOption {
    return {
        getLabel() {
            return 'Teleport...';
        },
        getChildren() {
            return [
                { label: 'Teleport To...'},
                {
                    label: 'Early',
                    getChildren() {
                        return getSpawnLocationOptions(earlySpawnLocations);
                    }
                },
                {
                    label: 'Mid',
                    getChildren() {
                        return getSpawnLocationOptions(middleSpawnLocations);
                    }
                },
                {
                    label: 'Late',
                    getChildren() {
                        return getSpawnLocationOptions(lateSpawnLocations);
                    }
                },
            ];
        }
    }
}

export function getTestStateContextMenuOption(): MenuOption {
    return {
        getLabel() {
            return 'Test State...';
        },
        getChildren() {
            return [
                { label: 'Set State To...'},
                {
                    label: 'Early',
                    getChildren() {
                        return getSpawnLocationOptions(earlySpawnLocations, true);
                    }
                },
                {
                    label: 'Mid',
                    getChildren() {
                        return getSpawnLocationOptions(middleSpawnLocations, true);
                    }
                },
                {
                    label: 'Late',
                    getChildren() {
                        return getSpawnLocationOptions(lateSpawnLocations, true);
                    }
                },
            ];
        }
    }
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
}

export function setSpawnLocation(state: GameState, spawnLocation: ZoneLocation): void {
    state.hero.spawnLocation = spawnLocation;
    saveGame();
}

export function checkToUpdateSpawnLocation(state: GameState): void {
    // Only set the spawn location when in the game scene. This is to avoid accidentally setting
    // it from the title scene which can trigger unexpected saves.
    if (state.scene !== 'game') {
        return;
    }
    if (state.location.zoneKey === 'overworld') {
        return setSpawnLocation(state, SPAWN_LOCATION_PEACH_CAVE_EXIT);
    }
    if (state.location.zoneKey === 'tomb') {
        return setSpawnLocation(state, SPAWN_LOCATION_TOMB_ENTRANCE);
    }
    if (state.location.zoneKey === 'warTemple' && state.savedState.objectFlags['warTempleEntrance']) {
        return setSpawnLocation(state, SPAWN_WAR_TEMPLE_ENTRANCE);
    }
    if (state.location.zoneKey === 'cocoon') {
        return setSpawnLocation(state, SPAWN_COCOON_ENTRANCE);
    }
    if (state.location.zoneKey === 'helix') {
        return setSpawnLocation(state, SPAWN_HELIX_ENTRANCE);
    }
    if (state.location.zoneKey === 'waterfallTower') {
        return setSpawnLocation(state, SPAWN_WATERFALL_ENTRANCE);
    }
    if (state.location.zoneKey === 'crater') {
        return setSpawnLocation(state, SPAWN_CRATER_ENTRANCE);
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
        && state.location.areaGridCoords[0] === 0
        && state.location.areaGridCoords[0] === 1
    )) {
        return setSpawnLocation(state, SPAWN_FOREST_ENTRANCE);
    }
}
