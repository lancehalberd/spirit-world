import { enterLocation } from 'app/content/areas';
import {
    SPAWN_LOCATION_DEMO,
    SPAWN_LOCATION_FULL,
    fixSpawnLocationOnLoad,
} from 'app/content/spawnLocations';
import { zones } from 'app/content/zones';
import { updateHeroMagicStats } from 'app/render/spiritBar';
import { renderHero } from 'app/renderActor';

import { GameState, Hero, SavedState } from 'app/types';


export function loadSavedData(): boolean {
    //return false;
    if (window.location.search.substr(1) === 'reset' && confirm('Clear your saved data?')) {
        return false;
    }
    const importedSaveData = window.localStorage.getItem('savedGames');
    if (importedSaveData) {
        state.savedGames = JSON.parse(importedSaveData);
        return true;
    }
    return false;
}

export function saveGame(): void {
    const hero = {...state.hero};
    // sanitize hero object before saving it.
    delete hero.activeClone;
    delete hero.activeStaff;
    delete hero.actionTarget;
    delete hero.render;
    delete hero.area;
    delete hero.grabObject;
    delete hero.grabTile;
    delete hero.pickUpObject;
    delete hero.pickUpTile;
    hero.clones = [];
    state.savedState.hero = hero;
    state.savedGames[state.savedGameIndex] = state.savedState;
    // These can get set on other files when previewing the saved game.
    for (const savedGame of state.savedGames) {
        if (savedGame?.hero) {
            delete savedGame.hero.area;
        }
    }
    // console.log(exportState(getState()));
    try {
        window.localStorage.setItem('savedGames', JSON.stringify(state.savedGames));
    } catch (e) {
        console.error(e);
        debugger;
    }

}
export function eraseAllSaves(): void {
    window.localStorage.clear()
}

export function setSaveFileToState(savedGameIndex: number, gameMode: number = 0): void {
    state.savedGameIndex = savedGameIndex;
    let savedGame = state.savedGames[state.savedGameIndex];
    if (!savedGame) {
        savedGame = getDefaultSavedState();
        savedGame.hero.spawnLocation = gameMode === 0 ? SPAWN_LOCATION_FULL : SPAWN_LOCATION_DEMO;
    }
    const defaultSavedState = getDefaultSavedState();
    state.savedState = {
        ...defaultSavedState,
        ...savedGame,
        hero: {
            ...defaultSavedState.hero,
            ...savedGame.hero,
            render: renderHero,
            spiritRadius: 0,
            explosionTime: 0,
            invulnerableFrames: 0,
        },
    };
    state.hero = state.savedState.hero;
    fixSpawnLocationOnLoad(state);
    updateHeroMagicStats(state);
    returnToSpawnLocation(state);
}

export function selectSaveFile(savedGameIndex: number): void {
    let savedGame = state.savedGames[state.savedGameIndex];
    if (!savedGame) {
        state.scene = 'chooseGameMode';
        state.menuIndex = 0;
        // Adjust the current state so we can show the correct background preview.
        state.hero = getDefaultSavedState().hero;
        state.hero.spawnLocation = SPAWN_LOCATION_FULL;
        state.hero.render = renderHero;
        fixSpawnLocationOnLoad(state);
        updateHeroMagicStats(state);
        returnToSpawnLocation(state);
        return;
    }
    setSaveFileToState(savedGameIndex);
    state.scene = 'game';
}

export function getDefaultSavedState(): SavedState {
    return {
        dungeonInventories: {},
        objectFlags: {},
        hero: getDefaultHeroState(),
    };
}

function getDefaultHeroState(): Hero {
    return {
        area: null,
        x: 150, y: 445, z: 0,
        safeD: 'down', safeX: 150, safeY: 445,
        vx: 0, vy: 0, vz: 0,
        w: 16, h: 16,
        d: 'down',
        actionFrame: 0,
        animationTime: 0,
        life: 4, maxLife: 4,
        lightRadius: 20,
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
        spawnLocation: SPAWN_LOCATION_FULL,
    };
}

function getDefaultState(): GameState {
    const state: GameState = {
        savedState: getDefaultSavedState(),
        savedGames: [null, null, null],
        savedGameIndex: 0,
        hero: null,
        camera: { x: 0, y: 0 },
        time: 0,
        gameHasBeenInitialized: false,
        lastTimeRendered: 0,
        location: SPAWN_LOCATION_FULL,
        zone: zones.peachCave,
        areaGrid: zones.peachCave.floors[0].grid,
        paused: false,
        menuIndex: 0,
        defeatState: {
            defeated: false,
            time: 0,
        },
        scene: 'title',
        keyboard: {
            gameKeyValues: [],
            gameKeysDown: new Set(),
            gameKeysPressed: new Set(),
            gameKeysReleased: new Set(),
            mostRecentKeysPressed: new Set(),
        },
        fadeLevel: 0,
    };
    return state;
}

let state: GameState;
export function initializeState() {
    state = getDefaultState();
    loadSavedData();
    setSaveFileToState(0);
    state.scene = 'title';
}

export function returnToSpawnLocation(state: GameState) {
    state.hero.life = state.hero.maxLife;
    // Only fill the magic bar if the hero has some magic regen.
    if (state.hero.magicRegen) {
        state.hero.magic = state.hero.maxMagic;
    }
    state.defeatState.defeated = false;
    // Clear out any state/flags that shouldn't be kept on the hero.
    state.hero.pickUpTile = null;
    state.hero.pickUpObject = null;
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
    /*state.location = {
        ...state.hero.spawnLocation,
        areaGridCoords: {...state.hero.spawnLocation.areaGridCoords},
        z: 0,
    };
    state.zone = zones[state.location.zoneKey];
    state.areaGrid = state.zone.floors[state.location.floor].grid;*/
    state.hero.d = state.hero.spawnLocation.d;
    enterLocation(state, state.hero.spawnLocation);
    state.fadeLevel = (state.areaInstance.definition.dark || 0) / 100;
}

export function getState(): GameState {
    return state;
}
window['getState'] = getState;



