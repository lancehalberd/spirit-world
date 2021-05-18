import {
    AreaGrid, AreaInstance,
    Frame, Hero, LootType, ShortRectangle, Zone, ZoneLocation,
} from 'app/types';

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

export interface DialogueLootDefinition {
    type: 'dialogueLoot',
    lootType: LootType,
    lootLevel?: number,
    lootAmount?: number,
}

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
        // This is used for rendering the next area when diving/surfacing.
        nextAreaInstance?: AreaInstance,
        time: number,
        callback: () => void,
        patternCanvas?: HTMLCanvasElement,
        pattern?: CanvasPattern,
        type: 'circle' | 'fade' | 'portal' | 'diving' | 'surfacing',
    },
    paused: boolean,
    menuIndex: number,
    menuRow: number,
    defeatState: {
        defeated: boolean,
        time: number,
    },
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
        pages: (Frame[][] | DialogueLootDefinition)[],
        progressFlag?: string,
    },
    isUsingKeyboard?: boolean,
    isUsingXbox?: boolean,
    fadeLevel: number,
}
