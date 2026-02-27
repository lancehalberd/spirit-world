import {SPAWN_LOCATION_FULL} from 'app/content/spawnLocations';
import {zones} from 'app/content/zones';
import {CANVAS_HEIGHT, CANVAS_WIDTH, randomizerSeed, randomizerGoal } from 'app/gameConstants';
import {getDefaultSavedState } from 'app/savedState'
import {setSaveFileToState} from 'app/scenes/fileSelect/setSaveFileToState';
import {showIntroScene} from 'app/scenes/intro/showIntroScene';
import {createCanvasAndContext} from 'app/utils/canvas';

import {getFullZoneLocation, getShortZoneName } from 'app/utils/getFullZoneLocation';

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



const [backgroundCanvas, backgroundContext] = createCanvasAndContext(CANVAS_WIDTH, CANVAS_HEIGHT);
const [panelsCanvas, panelsContext] = createCanvasAndContext(CANVAS_WIDTH, CANVAS_HEIGHT);

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
        paused: false,
        showControls: false,
        showMap: false,
        fieldMenuState:{
            needsRefresh: true,
            backgroundBuffer: {
                needsRefresh: true,
                canvas: backgroundCanvas,
                context: backgroundContext,
            },
            panelsBuffer: {
                needsRefresh: true,
                canvas: panelsCanvas,
                context: panelsContext,
            },
            panels: [],
            cursor: {panelId: 'tools', optionIndex: 0},
        },
        menuIndex: 0,
        menuRow: 0,
        defeatState: {
            defeated: false,
            time: 0,
        },
        scene: 'prologue',
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
        // TODO: Change to prologue.
        showIntroScene(state);
    }
}

export function getState(): GameState {
    return state;
}
window['getState'] = getState;

export function getFileSelectOptions(state: GameState): string[] {
    if (state.scene === 'deleteSavedGameConfirmation') {
        return ['CANCEL', 'DELETE'];
    }
    const gameFiles = state.savedGames.map(savedGame => {
        if (!savedGame) {
            return 'New Game';
        }
        return getShortZoneName(savedGame.savedHeroData.spawnLocation);
    });
    if (state.scene === 'deleteSavedGame') {
        return [...gameFiles, 'CANCEL'];
    }
    return [...gameFiles, 'DELETE', 'TITLE'];
}

export function getSettingsOptions(state: GameState): string[] {
    // add volume, other global game settings here
    const settingsMenu = ['VIEW CONTROLS'];
    // only display 'FULLSCREEN' toggle if game is being played inside of Electron as a desktop app
    if (window.electronAPI && state.gameHasBeenInitialized) {
        return [...settingsMenu, 'FULLSCREEN', 'RESUME'];
    }
    return [...settingsMenu, 'RESUME'];
}

export function shouldHideMenu(state: GameState): boolean {
    return !!(
        state.alwaysHideMenu || state.hero.isExitingDoor || state.hero.isControlledByObject
        || state.scriptEvents.blockFieldUpdates || state.scriptEvents.handledInput
        || state.scriptEvents.blockPlayerInput
        // This prevents the player from pausing during script events that don't otherwise block player
        // input. Let's delete these if the more specific checks above don't cause any issues with allowing
        // players to pause during cutscenes.
        //|| state.scriptEvents.queue.length || state.scriptEvents.activeEvents.length
        || state.messagePage || state.transitionState || state.defeatState.defeated
        || state.nextAreaSection || state.nextAreaInstance
        || state.areaInstance.priorityObjects?.length
        || state.hero.action === 'falling' || state.hero.action === 'fallen'
        || state.hideHUD
    );
}

export function canPauseGame(state: GameState): boolean {
    return state.alwaysHideMenu || !shouldHideMenu(state);
}

