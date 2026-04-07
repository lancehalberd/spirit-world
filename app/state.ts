import {SPAWN_LOCATION_FULL} from 'app/content/spawnLocations';
import {zones} from 'app/content/zones';
import {getDefaultSavedState } from 'app/savedState'
import {setSaveFileToState} from 'app/scenes/fileSelect/setSaveFileToState';
import {showIntroScene} from 'app/scenes/intro/showIntroScene';
import {showPrologueScene} from 'app/scenes/prologue/showPrologueScene';
import {getFullZoneLocation, /*getShortZoneName*/ } from 'app/utils/getFullZoneLocation';
import {readGetParameterAsInt} from 'app/utils/index';

export function loadSavedData() {
    if (window.location.search.substr(1) === 'reset' && confirm('Clear your saved data?')) {
        return;
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
    const importedSaveData = window.localStorage.getItem('savedGames');
    if (importedSaveData) {
        const rawSavedGames = JSON.parse(importedSaveData);
        // Migrate hero => savedHeroData for older save files.
        for (const savedGame of rawSavedGames) {
            if (savedGame?.hero) {
                savedGame.savedHeroData = savedGame.hero;
                delete savedGame.hero;
            }
        }
        // Enfore a limit of 3 regular save files.
        state.savedGames = rawSavedGames.slice(0, 3);
    }
    const importedRandomizerSaveData = window.localStorage.getItem('savedRandomizerGames');
    if (importedRandomizerSaveData) {
        const rawSavedGames = JSON.parse(importedRandomizerSaveData);
        // Migrate hero => savedHeroData for older save files.
        for (const savedGame of rawSavedGames) {
            if (savedGame?.hero) {
                savedGame.savedHeroData = savedGame.hero;
                delete savedGame.hero;
            }
        }
        // Enfore a limit of 10 randomizer save files.
        state.savedRandomizerGames = rawSavedGames.slice(0, 10);
        // As long as there are fewer than 10 slots, make sure there is a new empty slot at the end of the list.
        if (state.savedRandomizerGames.length < 10 && state.savedRandomizerGames[state.savedRandomizerGames.length - 1] !== null) {
            state.savedRandomizerGames.push(null);
        }
    }
}

export function eraseAllSaves(): void {
    window.localStorage.clear()
}

export function getDefaultState(): GameState {
    const state: GameState = {
        sceneStack: [],
        savedState: getDefaultSavedState(),
        savedGames: [null, null, null],
        // Start with a single randomizer slot. This can be increased by up to 10.
        savedRandomizerGames: [null],
        savedGameIndex: -1,
        savedGameMode: 'normal',
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
        variantSeed: readGetParameterAsInt('variantSeed'),
        // logic nodes for generated content will be stored here.
        generatedLogicNodes: [],
    };
    return state;
}

let state: GameState;
export function initializeState() {
    state = getDefaultState();
    loadSavedData();
    setSaveFileToState(state, 0, 'normal');
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

