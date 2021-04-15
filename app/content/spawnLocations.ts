
import { CANVAS_HEIGHT } from 'app/gameConstants';
import { saveGame } from 'app/state';

import { GameState, ZoneLocation } from 'app/types';


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

export function fixSpawnLocationOnLoad(state: GameState): void {
    // The player restarts at the defeated boss if they haven't made it to the overworld yet.
    if (state.hero.spawnLocation.zoneKey === 'newPeachCave' && state.savedState.objectFlags['newPeachCave:boss']) {
        state.hero.spawnLocation = SPAWN_LOCATION_PEACH_CAVE_BOSS;
    }
}

export function setSpawnLocation(state: GameState, spawnLocation: ZoneLocation): void {
    state.savedState.hero.spawnLocation = spawnLocation;
    saveGame();
}

export function checkToUpdateSpawnLocation(state: GameState): void {
    if (state.location.zoneKey === 'tomb') {
        return setSpawnLocation(state, SPAWN_LOCATION_TOMB_ENTRANCE);
    }
    if (state.location.zoneKey === 'overworld' && state.hero.spawnLocation.zoneKey === 'newPeachCave') {
        return setSpawnLocation(state, SPAWN_LOCATION_PEACH_CAVE_EXIT);
    }
}
