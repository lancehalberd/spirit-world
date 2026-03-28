import {SPAWN_LOCATION_FULL} from 'app/content/spawnLocations';
import {zones} from 'app/content/zones';
import {randomizerSeed, randomizerGoal } from 'app/gameConstants';
import {getDefaultSavedState } from 'app/savedState'
import {setSaveFileToState} from 'app/scenes/fileSelect/setSaveFileToState';
import {showIntroScene} from 'app/scenes/intro/showIntroScene';
import {showPrologueScene} from 'app/scenes/prologue/showPrologueScene';
//import {fixProgressFlagsOnLoad, fixSpawnLocationOnLoad} from 'app/utils/fixState';
import {getFullZoneLocation, /*getShortZoneName*/ } from 'app/utils/getFullZoneLocation';
//import {cloneDeep, mergeDeep} from 'app/utils/index';
//import {returnToSpawnLocation } from 'app/utils/returnToSpawnLocation';

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
    // This window variable should be set on page load from the users stored preferences.
    state.settings.muteAllSounds = window['muteAllSounds'] ?? state.settings.muteAllSounds;

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

export function eraseAllSaves(): void {
    window.localStorage.clear()
}

export function getDefaultState(): GameState {
    const state: GameState = {
        sceneStack: [],
        savedState: getDefaultSavedState(),
        savedGames: [null, null, null],
        savedGameIndex: -1,
        settings: {
            muteAllSounds: false,
        },
        hero: null,
        camera: { x: 0, y: 0 },
        time: 0,
        // This only advances when the field is updating.
        // Set this positive because some initial times set to 0
        // such as the attack buffer time will trigger if this
        // is near 0.
        fieldTime: 10000,
        reviveTime: 0,
        prologueTime: 0,
        gameHasBeenInitialized: false,
        lastTimeRendered: 0,
        location: getFullZoneLocation(SPAWN_LOCATION_FULL),
        zone: zones.peachCave,
        areaGrid: zones.peachCave.floors[0].grid,
        floor: zones.peachCave.floors[0],
        showControls: false,
        menuIndex: 0,
        menuRow: 0,
        keyboard: {
            gameKeyValues: [],
            gameKeysDown: new Set(),
            gameKeysPressed: new Set(),
            gameKeysReleased: new Set(),
            mostRecentKeysPressed: new Set(),
        },
        fadeLevel: 0,
        hudOpacity: 1,
        hideHUD: false,
        hudTime: 0,
        hotLevel: 0,
        scriptEvents: {
            activeEvents: [],
            blockEventQueue: false,
            blockFieldUpdates: false,
            blockPlayerInput: false,
            blockPlayerUpdates: false,
            handledInput: false,
            queue: [],
        },
        screenShakes: [],
        loopingSoundEffects: [],
        map: {
            needsRefresh: true,
        },
        arState: {
            active: false,
            scene: 'choose',
        },
    };
    return state;
}

let state: GameState;
export function initializeState() {
    state = getDefaultState();
    loadSavedData();
    setSaveFileToState(state, 0);
    if (Math.random() < 0.5) {
        showIntroScene(state);
    } else {
        showPrologueScene(state);
    }
}

export function getState(): GameState {
    return state;
}
window['getState'] = getState;

export function shouldHideMenu(state: GameState): boolean {
    return !!(
        state.alwaysHideMenu || state.hero.isExitingDoor || state.hero.isControlledByObject
        || state.scriptEvents.blockFieldUpdates || state.scriptEvents.handledInput
        || state.scriptEvents.blockPlayerInput
        || state.transitionState
        || state.nextAreaSection || state.nextAreaInstance
        || state.areaInstance.priorityObjects?.length
        || state.hero.action === 'falling' || state.hero.action === 'fallen'
        || state.hideHUD
    );
}

export function canPauseGame(state: GameState): boolean {
    return state.alwaysHideMenu || !shouldHideMenu(state);
}

