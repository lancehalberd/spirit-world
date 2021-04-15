import { AreaGrid, AreaInstance, Frame, Hero, ShortRectangle, Zone, ZoneLocation } from 'app/types';

export type SavedState = {
    objectFlags: {[key: string]: boolean},
    hero: Hero,
    dungeonInventories: {
        [key: string]: DungeonInventory,
    },
}

export interface DungeonInventory {
    bigKey: boolean,
    map: boolean,
    smallKeys: number,
}

export type Scene = 'title'
    | 'chooseGameMode' | 'deleteSavedGame' | 'deleteSavedGameConfirmation'
    | 'game' | 'credits' | 'options';

export interface GameState {
    savedState: SavedState,
    savedGames: SavedState[],
    savedGameIndex: number,
    hero: Hero,
    camera: { x: number, y: number },
    time: number,
    gameHasBeenInitialized: boolean,
    lastTimeRendered: number,
    alternateAreaInstance?: AreaInstance,
    areaInstance?: AreaInstance,
    areaSection?: ShortRectangle,
    nextAreaInstance?: AreaInstance,
    nextAreaSection?: ShortRectangle,
    zone: Zone,
    areaGrid: AreaGrid,
    location: ZoneLocation,
    transitionState?: {
        // The location to switch to after the current screen wipe transition.
        nextLocation: ZoneLocation,
        time: number,
        callback: () => void,
        type: 'circle' | 'fade',
    },
    paused: boolean,
    menuIndex: number,
    defeated: boolean,
    scene: Scene,
    keyboard: {
        gameKeyValues: number[],
        gameKeysDown: Set<number>,
        gameKeysPressed: Set<number>,
        // The set of most recent keys pressed, which is recalculated any time
        // a new key is pressed to be those keys pressed in that same frame.
        mostRecentKeysPressed: Set<number>,
        gameKeysReleased: Set<number>,
    },
    messageState?: {
        pageIndex: number,
        pages: Frame[][][],
    },
    isUsingKeyboard?: boolean,
    isUsingXbox?: boolean,
    fadeLevel: number,
}
