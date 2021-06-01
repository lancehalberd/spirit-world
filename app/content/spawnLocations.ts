import _ from 'lodash';

import { CANVAS_HEIGHT } from 'app/gameConstants';
import { applySavedState, getDefaultSavedState, getState, returnToSpawnLocation, saveGame } from 'app/state';
import { MenuOption } from 'app/types';

import { GameState, SavedState, ZoneLocation } from 'app/types';


export const SPAWN_LOCATION_FULL: ZoneLocation = {
    zoneKey: 'newPeachCave',
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
    zoneKey: 'newPeachCave',
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
    floor: 2,
    x: 120,
    y: 440,
    z: 0,
    d: 'up',
    areaGridCoords: {x: 0, y: 0},
    isSpiritWorld: false,
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
export const RIVER_TEMPLE_BOSS: ZoneLocation = {
    zoneKey: 'riverTemple',
    floor: 0,
    x: 250,
    y: 440,
    z: 0,
    d: 'up',
    areaGridCoords: {y: 0, x: 0},
    isSpiritWorld: false,
};


function applyItems(savedState: SavedState, items: {[key: string]: number}, objectFlags: string[] = []): SavedState {
    const newState: SavedState = _.cloneDeep(savedState);
    for (const flag of objectFlags) {
        newState.objectFlags[flag] = true;
    }
    for (let key in items) {
        if (key === 'maxLife') {
            newState.hero.maxLife += items[key];
            continue;
        }
        if (key === 'money') {
            newState.hero.money += items[key];
            continue;
        }
        if (key === 'weapon') {
            newState.hero.weapon = items[key];
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
        if (typeof newState.hero.activeTools[key] !== 'undefined') {
            newState.hero.activeTools[key] = items[key];
            continue;
        }
        if (typeof newState.hero.elements[key] !== 'undefined') {
            newState.hero.elements[key] = items[key];
            continue;
        }
        if (typeof newState.hero.equipment[key] !== 'undefined') {
            newState.hero.equipment[key] = items[key];
            continue;
        }
        if (typeof newState.hero.passiveTools[key] !== 'undefined') {
            newState.hero.passiveTools[key] = items[key];
            continue;
        }
        console.log('Could not find key', key, items[key]);
    }
    return newState;
}

const defaultSavedState = getDefaultSavedState();
const peachBossState = applyItems(defaultSavedState, {weapon: 1, money: 50});
const peachCaveExitState = applyItems(peachBossState, {maxLife: 1, catEyes: 1});
const tombStartState = applyItems(peachCaveExitState, {bow: 1}, ['elderTomb', 'tombEntrance']);
tombStartState.hero.leftTool = 'bow';
const tombBossState = applyItems(tombStartState, {roll: 1, 'tomb:bigKey': 1});
const warTempleStart = applyItems(tombBossState, {maxLife: 1, spiritSight: 1},
    ['tombBoss', 'warTempleEntrance', 'tombTeleporter']);
const warTempleBoss = applyItems(warTempleStart, {gloves: 1, 'warTemple:bigKey': 1});
const cocoonStartState = applyItems(warTempleBoss, {maxLife: 1, astralProjection: 1}, ['warTempleBoss']);
const helixStartState = applyItems(cocoonStartState, {maxLife: 1, teleportation: 1, invisibility: 1},
    ['cocoonTeleporter', 'lakeTunneBoss']);
helixStartState.hero.rightTool = 'invisibility';
const helixEndState = applyItems(helixStartState, {charge: 1, staff: 1},
    ['elementalBeastsEscaped']);
const riverTempleStartState = applyItems(helixEndState, {ironBoots: 1});
const riverTempleBossState = applyItems(riverTempleStartState, {'riverTemple:bigKey': 1, 'fire': 1, 'lightning': 1});

const spawnLocations = {
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
    'Helix Start': {
        location: SPAWN_HELIX_ENTRANCE,
        savedState: helixStartState,
    },
    'Helix End': {
        location: SPAWN_LOCATION_PEACH_CAVE_EXIT,
        savedState: helixEndState,
    },
    'River Temple Start': {
        location: SPAWN_LOCATION_PEACH_CAVE_EXIT,
        savedState: riverTempleStartState,
    },
    'River Temple Boss': {
        location: RIVER_TEMPLE_BOSS,
        savedState: riverTempleBossState,
    },
};
window['spawnLocations'] = spawnLocations;

export function getSpawnLocationContextMenuOption(): MenuOption {
    return {
        getLabel() {
            return 'Teleport...';
        },
        getChildren() {
            const options = Object.keys(spawnLocations).map(name => {
                return {
                    label: `${name}`,
                    onSelect() {
                        const state = getState();
                        setSpawnLocation(state, spawnLocations[name].location);
                        returnToSpawnLocation(state);
                        state.scene = 'game';
                    }
                }
            });
            return options;
        }
    }
}

export function getTestStateContextMenuOption(): MenuOption {
    return {
        getLabel() {
            return 'Test State...';
        },
        getChildren() {
            const options = Object.keys(spawnLocations).map(name => {
                return {
                    label: `${name}`,
                    onSelect() {
                        const state = getState();
                        applySavedState(state, _.cloneDeep(spawnLocations[name].savedState));
                        setSpawnLocation(state, spawnLocations[name].location);
                        returnToSpawnLocation(state);
                        state.scene = 'game';
                    }
                }
            });
            return options;
        }
    }
}

export function fixSpawnLocationOnLoad(state: GameState): void {
    // The player restarts at the defeated boss if they haven't made it to the overworld yet.
    if (state.hero.spawnLocation.zoneKey === 'newPeachCave' && state.savedState.objectFlags['newPeachCave:boss']) {
        state.hero.spawnLocation = SPAWN_LOCATION_PEACH_CAVE_BOSS;
    }
}

export function setSpawnLocation(state: GameState, spawnLocation: ZoneLocation): void {
    state.hero.spawnLocation = spawnLocation;
    saveGame();
}

export function checkToUpdateSpawnLocation(state: GameState): void {
    if (state.location.zoneKey === 'overworld' && state.hero.spawnLocation.zoneKey === 'newPeachCave') {
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
}
