import {
    AreaGrid, AreaInstance,
    Frame, Hero, LootType, SavedHeroData, Rect, Zone, ZoneLocation,
} from 'app/types';

export type StaffTowerLocation = 'desert' | 'forest' | 'mountain';

export type SavedState = {
    objectFlags: {[key: string]: boolean},
    savedHeroData: SavedHeroData,
    dungeonInventories: {
        [key: string]: DungeonInventory,
    },
    staffTowerLocation: StaffTowerLocation,
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
    type: 'dialogueLoot'
    // The id of the object associated with this dialogue (used during randomization).
    id?: string
    lootType: LootType
    lootLevel?: number
    lootAmount?: number
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
    surfaceAreaInstance?: AreaInstance,
    underwaterAreaInstance?: AreaInstance,
    areaSection?: Rect,
    nextAreaInstance?: AreaInstance,
    nextAreaSection?: Rect,
    zone: Zone,
    areaGrid: AreaGrid,
    location: ZoneLocation,
    transitionState?: {
        // The location to switch to after the current screen wipe transition.
        nextLocation: ZoneLocation,
        // This is used for rendering the next area when diving/surfacing.
        // It is also used to avoid recreating areas when teleporting between spirit+material worlds.
        nextAreaInstance?: AreaInstance,
        // This is used to avoid recreating areas then teleporting between spirit+material worlds.
        nextAlternateAreaInstance?: AreaInstance,
        time: number,
        callback: () => void,
        patternCanvas?: HTMLCanvasElement,
        pattern?: CanvasPattern,
        type: 'circle' | 'fade' | 'portal' | 'diving' | 'surfacing',
        // The targetZ value for the hero after the transition.
        targetZ?: number,
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
        pages: (Frame[][] | DialogueLootDefinition | string)[],
    },
    isUsingKeyboard?: boolean,
    isUsingXbox?: boolean,
    fadeLevel: number,
}
