import { enterLocation } from 'app/content/areas';
import {
    SPAWN_LOCATION_DEMO,
    SPAWN_LOCATION_FULL,
    fixSpawnLocationOnLoad,
} from 'app/content/spawnLocations';
import { zones } from 'app/content/zones';
import { updateHeroMagicStats } from 'app/render/spiritBar';
import { randomizerSeed, randomizerGoal } from 'app/gameConstants';

import { GameState, Hero, SavedHeroData, SavedState } from 'app/types';

export function loadSavedData(): boolean {
    //return false;
    if (window.location.search.substr(1) === 'reset' && confirm('Clear your saved data?')) {
        return false;
    }
    const importedSettings = window.localStorage.getItem('settings');
    if (importedSettings) {
        const defaultState = getDefaultState();
        state.settings = {
            ...defaultState.settings,
            ...JSON.parse(importedSettings),
        };
    }

    if (randomizerSeed) {
        state.randomizer = {
            seed: randomizerSeed,
            goal: randomizerGoal,
        };
    }
    const importedSaveData = window.localStorage.getItem('savedGames' + (randomizerSeed || ''));
    if (importedSaveData) {
        const rawSavedGames = JSON.parse(importedSaveData);
        // Migrate hero => savedHeroData for older save files.
        for (const savedGame of rawSavedGames) {
            if (savedGame?.hero) {
                savedGame.savedHeroData = savedGame.hero;
                delete savedGame.hero;
            }
        }
        state.savedGames = rawSavedGames.slice(0, 3);
        // Only show a single save file when using seeds.
        if (randomizerSeed) {
           state.savedGames = rawSavedGames.slice(0, 1);
        }
        return true;
    } else {
        if (randomizerSeed) {
            state.savedGames = [null];
        }
    }
    return false;
}

export function saveGame(): void {
    state.savedState.savedHeroData = state.hero.exportSavedHeroData();
    // There is a bug where selecting the delete option in randomizer triggers the `saveGame`
    // function and saves a new file to the delete index which keeps creating more save files.
    // This is a hack to prevent this from happening.
    //if (state.savedGameIndex < state.savedGames.length) {
    //    state.savedGames[state.savedGameIndex] = state.savedState;
    //}
    state.savedGames[state.savedGameIndex] = state.savedState;
    // console.log(exportState(getState()));
    saveGamesToLocalStorage();
}
export function saveGamesToLocalStorage(): void {
    try {
        const seed = state.randomizer?.seed || 0;
        window.localStorage.setItem('savedGames' + (seed || ''), JSON.stringify(state.savedGames));
    } catch (e) {
        console.error(e);
        debugger;
    }
}
export function saveSettings(state: GameState) {
    window.localStorage.setItem('settings', JSON.stringify(state.settings));
}
export function eraseAllSaves(): void {
    window.localStorage.clear()
}

export function setSaveFileToState(savedGameIndex: number, gameMode: number = 0): void {
    state.savedGameIndex = savedGameIndex;
    let savedGame = state.savedGames[state.savedGameIndex];
    if (!savedGame) {
        savedGame = getDefaultSavedState();
        savedGame.savedHeroData.spawnLocation = gameMode === 0 ? SPAWN_LOCATION_FULL : SPAWN_LOCATION_DEMO;
    }
    applySavedState(state, savedGame);
}

export function applySavedState(state: GameState, savedState: SavedState): void {
    const defaultSavedState = getDefaultSavedState();
    state.hero = new Hero();
    state.hero.applySavedHeroData(defaultSavedState.savedHeroData, savedState.savedHeroData);
    state.savedState = {
        ...defaultSavedState,
        ...savedState,
        savedHeroData: state.hero.exportSavedHeroData(),
    };
    fixSpawnLocationOnLoad(state);
    updateHeroMagicStats(state);
    returnToSpawnLocation(state);
}

export function getDefaultSavedState(): SavedState {
    return {
        dungeonInventories: {},
        objectFlags: {},
        zoneFlags: {},
        savedHeroData: getDefaultSavedHeroData(),
        staffTowerLocation: 'desert',
    };
}

function getDefaultSavedHeroData(): SavedHeroData {
    return {
        playTime: 0,
        winTime: 0,
        maxLife: 4,
        hasRevive: false,
        money: 0,
        silverOre: 0,
        goldOre: 0,
        peachQuarters: 0,
        spiritTokens: 0,
        victoryPoints: 0,
        weapon: 0,
        weaponUpgrades: {},
        activeTools: {
            bow: 0,
            staff: 0,
            clone: 0,
            cloak: 0,
        },
        element: null,
        elements: {
            fire: 0,
            ice: 0,
            lightning: 0,
        },
        equipment: {
            leatherBoots: 1,
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
            teleportation: 0,
            ironSkin: 0,
            goldMail: 0,
            phoenixCrown: 0,
            waterBlessing: 0,
            fireBlessing: 0,
            lightningBlessing: 0,
        },
        spawnLocation: SPAWN_LOCATION_FULL,
    };
}

export function getDefaultState(): GameState {
    const state: GameState = {
        savedState: getDefaultSavedState(),
        savedGames: [null, null, null],
        savedGameIndex: 0,
        settings: {
            muteAllSounds: false,
        },
        hero: null,
        camera: { x: 0, y: 0 },
        // This always updates.
        time: 0,
        // This only advances when the field is updating.
        // Set this positive because some initial times set to 0
        // such as the attack buffer time will trigger if this
        // is near 0.
        fieldTime: 10000,
        // This is set when the player gains or uses a revive
        // and reviveAnimationTime = fieldTime - reviveTime
        reviveTime: 0,
        gameHasBeenInitialized: false,
        lastTimeRendered: 0,
        location: SPAWN_LOCATION_FULL,
        zone: zones.peachCave,
        areaGrid: zones.peachCave.floors[0].grid,
        floor: zones.peachCave.floors[0],
        paused: false,
        menuIndex: 0,
        menuRow: 0,
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
        scriptEvents: {
            activeEvents: [],
            blockEventQueue: false,
            blockFieldUpdates: false,
            blockPlayerInput: false,
            handledInput: false,
            queue: [],
        },
        screenShakes: [],
    };
    return state;
}

export function cleanState(state: GameState) {
    const defaultState = getDefaultState();
    state.scriptEvents = defaultState.scriptEvents;
    state.screenShakes = defaultState.screenShakes;
    state.defeatState = defaultState.defeatState;
    state.paused = false;
    delete state.transitionState;
    delete state.messagePage;
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
    state.hero.hasBarrier = false;
    state.hero.isInvisible = false;
    state.activeStaff = null;
    state.hero.frozenDuration = 0;
    state.hero.vx = 0;
    state.hero.vy = 0;
    state.hero.vz = 0;
    state.hero.d = state.hero.spawnLocation.d;
    enterLocation(state, state.hero.spawnLocation, true, null, true);
    state.fadeLevel = (state.areaInstance.dark || 0) / 100;
}

export function getState(): GameState {
    return state;
}
window['getState'] = getState;

export function getTitleOptions(state: GameState): string[] {
    if (state.scene === 'chooseGameMode') {
        return ['Full Game', 'Quick Demo', 'Cancel'];
    }
    if (state.scene === 'deleteSavedGameConfirmation') {
        return ['CANCEL', 'DELETE'];
    }
    const gameFiles = state.savedGames.map(savedGame => {
        if (!savedGame) {
            return 'New Game';
        }
        return savedGame.savedHeroData.spawnLocation.zoneKey;// + ' ' + 'V'.repeat(savedGame.hero.maxLife) + ' life';
    });
    if (state.scene === 'deleteSavedGame') {
        return [...gameFiles, 'CANCEL'];
    }
    return [...gameFiles, 'DELETE'];
}
