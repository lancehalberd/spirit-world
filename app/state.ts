import { enterArea, getAreaFromGridCoords } from 'app/content/areas';
import { zones } from 'app/content/zones';
import { renderHero } from 'app/renderActor';

import { GameState, Hero, SavedState } from 'app/types';

function getDefaultSavedState(): SavedState {
    return {
        coins: 0,
        collectedItems: {},
    };
}

function getDefaultHeroState(): Hero {
    return {
        x: 150, y: 445, z: 0,
        safeD: 'down', safeX: 150, safeY: 445,
        vx: 0, vy: 0, vz: 0,
        w: 16, h: 16,
        d: 'down',
        life: 4, maxLife: 4,
        magic: 0,
        // base: 20, max: 100, roll: 5, charge: 10, double-charge: 50
        maxMagic: 20,
        // base 4, max 8-10
        magicRegen: 4,
        // inventory
        money: 0,
        arrows: 0,
        peachQuarters: 0,
        spiritTokens: 0,
        toolCooldown: 0,
        weapon: 0,
        activeTools: {
            bow: 0,
            staff: 0,
            clone: 0,
            invisibility: 0,
        },
        equipment: {
            cloudBoots: 0,
            ironBoots: 0,
        },
        passiveTools: {
            gloves: 0,
            roll: 0,
            charge: 0,
            nimbusCloud: 0,
            catEyes: 0,
            spiritSight: 0,
            trueSight: 0,
            astralProjection: 0,
            telekinesis: 0,
            ironSkin: 0,
            goldMail: 0,
            phoenixCrown: 0,
            waterBlessing: 0,
            fireBlessing: 0,
        },
        element: null,
        elements: {
            fire: 0,
            ice: 0,
            lightning: 0,
        },
        clones: [],
        activeClone: null,
        status: 'normal',
        invisible: false,
        invisibilityCost: 0,
        render: renderHero,
        spiritRadius: 0,
        spawnLocation: {
            zoneKey: 'peachCave',
            floor: 0,
            x: 150,
            y: 445,
            d: 'down',
            areaGridCoords: {x: 1, y: 1},
        }
    };
}

export function updateHeroMagicStats(state: GameState) {
    state.hero.maxMagic = 20;
    state.hero.magicRegen = 4;
    if (state.hero.passiveTools.charge >= 1) {
        state.hero.maxMagic += 10;
        state.hero.magicRegen += 1;
    }
    if (state.hero.passiveTools.charge >= 2) {
        state.hero.maxMagic += 20;
        state.hero.magicRegen += 2;
    }
    if (state.hero.elements.fire) {
        state.hero.maxMagic += 10;
        state.hero.magicRegen += 1;
    }
    if (state.hero.elements.ice) {
        state.hero.maxMagic += 10;
        state.hero.magicRegen += 1;
    }
    if (state.hero.elements.lightning) {
        state.hero.maxMagic += 10;
        state.hero.magicRegen += 1;
    }
    if (state.hero.passiveTools.phoenixCrown) {
        state.hero.maxMagic += 20;
        state.hero.magicRegen += 5;
    }
}

function getDefaultState(): GameState {
    const state: GameState = {
        savedState: getDefaultSavedState(),
        hero: getDefaultHeroState(),
        camera: { x: 0, y: 0 },
        time: 0,
        gameHasBeenInitialized: false,
        lastTimeRendered: 0,
        zone: zones.peachCave,
        areaGrid: zones.peachCave.floors[0].grid,
        areaGridCoords: {x: 1, y: 1},
        floor: 0,
        paused: false,
        menuIndex: 0,
        defeated: false,
        defeatedIndex: 0,
    };
    updateHeroMagicStats(state);
    return state;
}

let state: GameState;
export function initializeState() {
    state = getDefaultState();
    returnToSpawnLocation(state);
}

export function returnToSpawnLocation(state: GameState) {
    state.hero.life = state.hero.maxLife;
    state.hero.magic = state.hero.maxMagic;
    state.defeated = false;
    // Clear out any state/flags that shouldn't be kept on the hero.
    state.hero.pickUpTile = null;
    state.hero.grabObject = null;
    state.hero.grabTile = null;
    state.hero.action = null;
    state.hero.invulnerableFrames = 0;
    state.hero.invisible = false;
    state.hero.activeStaff = null;
    state.hero.activeClone = null;
    state.hero.vx = 0;
    state.hero.vy = 0;
    state.hero.vz = 0;
    state.zone = zones[state.hero.spawnLocation.zoneKey];
    state.floor = state.hero.spawnLocation.floor;
    state.areaGrid = state.zone.floors[state.floor].grid;
    state.areaGridCoords.x = state.hero.spawnLocation.areaGridCoords.x;
    state.areaGridCoords.y = state.hero.spawnLocation.areaGridCoords.y;
    state.hero.d = state.hero.spawnLocation.d;
    enterArea(state,
        getAreaFromGridCoords(state.areaGrid, state.hero.spawnLocation.areaGridCoords),
        state.hero.spawnLocation.x, state.hero.spawnLocation.y
    );
}

export function getState(): GameState {
    return state;
}
window['getState'] = getState;

