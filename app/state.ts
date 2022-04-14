import { enterLocation } from 'app/content/areas';
import {
    SPAWN_LOCATION_DEMO,
    SPAWN_LOCATION_FULL,
    fixSpawnLocationOnLoad,
} from 'app/content/spawnLocations';
import { zones } from 'app/content/zones';
import { parseScriptText, setScript } from 'app/scriptEvents';
import { updateHeroMagicStats } from 'app/render/spiritBar';
import { readGetParameter } from 'app/utils/index';

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

    const seed = parseInt(readGetParameter('seed'), 10) || 0;
    if (seed) {
        state.randomizer = {
            seed,
        };
    }
    const importedSaveData = window.localStorage.getItem('savedGames' + (seed || ''));
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
        if (seed) {
           state.savedGames = rawSavedGames.slice(0, 1);
        }
        return true;
    } else {
        if (seed) {
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

const isRandomizer = !!readGetParameter('seed');

export function selectSaveFile(savedGameIndex: number): void {
    let savedGame = state.savedGames[state.savedGameIndex];
    if (!savedGame) {
        // For now go directly to starting the full game when selecting "New Game".
        state.hero.spawnLocation = SPAWN_LOCATION_FULL;
        state.scene = 'game';
        updateHeroMagicStats(state);
        returnToSpawnLocation(state);
        if (!isRandomizer) {
            state.scriptEvents.queue = parseScriptText(state, 'Waaaaah!', 1000, false);
            state.scriptEvents.queue.push({type: 'clearTextBox'});
        } else {
            setScript(state, 'All the treasure in the world has been shuffled!');
        }
        return;
        // Old code for showing the "Choose Game Mode" menu when selecting "New Game".
        /*state.scene = 'chooseGameMode';
        state.menuIndex = 0;
        // Adjust the current state so we can show the correct background preview.
        state.hero = new Hero();
        state.hero.applySavedHeroData(getDefaultSavedState().savedHeroData);
        state.hero.spawnLocation = SPAWN_LOCATION_FULL;
        fixSpawnLocationOnLoad(state);
        updateHeroMagicStats(state);
        returnToSpawnLocation(state);
        return;*/
    }
    setSaveFileToState(savedGameIndex);
    state.scene = 'game';
    // Hack to prevent showing the falling animation a second time on loading a game in the peach cave.
    if (!state.hero.weapon) {
        state.hero.z = 0;
    }
    showHint(state);
}

export function showHint(state: GameState): void {
    if (isRandomizer) {
        setScript(state, 'All the treasure is shuffled!');
        return;
    }
    const flags = state.savedState.objectFlags;
    if (!state.hero.weapon) {
        if (state.location.zoneKey !== 'peachCave') {
            setScript(state, `Maybe I should explore that cave I fell in more.
                {|}The entrance was just east of the waterfall north of the lake.`);
        } else {
            setScript(state, 'I need to find a way out of this cave.');
        }
    } else if (!state.hero.passiveTools.catEyes) {
        if (state.location.zoneKey !== 'peachCave') {
            setScript(state, `I wonder if that glowing peach is still in that cave?
                {|}The entrance was just east of the waterfall north of the lake.`);
        } else {
            setScript(state, 'With this Chakram I should be able to climb out of this cave.');
        }
    } else if (!state.hero.activeTools.bow) {
        setScript(state, `I should talk to the Vanara Elder about my strange powers.
            {|}He lives in the woods to the southwest with the other Vanara. `);
    } else if (!state.hero.passiveTools.roll) {
        if (state.location.zoneKey !== 'tomb') {
            setScript(state, `The elder said I could learn more about my powers if I explore the Vanara Tomb.
                {|}The Tomb is North of the woods in the Southwest.`);
        } else {
            setScript(state, `The elder said I could learn more about my powers if I explore this Tomb.`);
        }
    } else if (!state.hero.passiveTools.spiritSight) {
        if (state.location.zoneKey !== 'tomb') {
            setScript(state, `I need to finish exploring the Vanara Tomb to learn about my powers.
                {|}The Tomb is North of the woods in the Southwest.`);
        } else {
            setScript(state, `I need to finish exploring this Tomb to learn about my powers.`);
        }
    } else if (!flags.warTempleEntrance) {
        setScript(state, `There must be some way to open the Temple in the southeastern ruins.
            {|}Maybe my new spirit sight will show the way.`);
    } else if (!state.hero.passiveTools.gloves) {
        setScript(state, `Maybe I can find something useful if I explore the ruins more.`);
    } else if (!state.hero.passiveTools.astralProjection) {
        setScript(state, `I'm sure I'll find what I need if I reach the top of the War Temple ruins.`);
    } else if (!flags.tombExit) {
        setScript(state, `The Guardian of the Tomb said to come back when I could "touch the spirit world".
            {|}There was a teleporter by the lake that will take me back to the Tomb.`);
    } else if (!state.hero.passiveTools.teleportation) {
        if (state.location.zoneKey === 'cocoon') {
            setScript(state, `There must be something important at the bottom of this strange cave.`);
        } else if (state.location.zoneKey === 'tomb') {
            setScript(state, `There must be something important in that strange cave behind this Tomb.`);
        } else {
            setScript(state, `There must be something important in that strange cave behind the Tomb.
                {|}There was a teleporter by the lake that will take me back to the Tomb.`);
        }
    } else if (!state.hero.activeTools.staff) {
        if (state.location.zoneKey !== 'helix') {
            setScript(state, `The Guardian said there is something called the 'Helix' beyond the Lake Tunnel.
                {|}With all my new spirit abilities, I should be able to get through now.`);
        } else {
            setScript(state, `The Guardian said I should seek answers at the top of this 'Helix'.`);
        }
    } else if (!state.hero.passiveTools.charge) {
        if (state.location.zoneKey === 'helix') {
            setScript(state, `Someone at the top of this Helix has the answers I'm looking for.`);
        } else {
            setScript(state, `Someone at the top of the Helix has the answers I'm looking for.
                {|}I should head back to that tunnel near the lake.`);
        }
    } else if (!flags.flameBeast || !flags.frostBeast) {
        setScript(state, `I need to explore the world and hunt down the escaped Spirit Beasts.
            {|}There is a portal to the spirit world in the Holy City to the northeast.`);
    } else if (state.hero.activeTools.cloak < 2) {
        setScript(state, `There is still something to find behind the waterfall at the top of the mountain.`);
    } else if (!state.hero.activeTools.clone) {
        setScript(state, `There is still something to find in the spirit world.`);
    } else {
        setScript(state, `Isn't there anywhere else interesting to go?
            {|}(The Storm Beast is coming soon. Want to play more now?
            {|}Try adding ?seed=20 to the url to play the randomizer).`);
    }
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
        maxLife: 4,
        hasRevive: false,
        money: 0,
        peachQuarters: 0,
        spiritTokens: 0,
        weapon: 0,
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
        fieldTime: 10000,
        // This is set when the player gains or uses a revive
        // and reviveAnimationTime = fieldTime - reviveTime
        reviveTime: 0,
        gameHasBeenInitialized: false,
        lastTimeRendered: 0,
        location: SPAWN_LOCATION_FULL,
        zone: zones.peachCave,
        areaGrid: zones.peachCave.floors[0].grid,
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
            handledInput: false,
            queue: [],
        },
        screenShakes: [],
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
    state.hero.hasBarrier = false;
    state.hero.isInvisible = false;
    state.activeStaff = null;
    state.hero.activeClone = null;
    state.hero.frozenDuration = 0;
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
