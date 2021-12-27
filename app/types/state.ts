import {
    AreaGrid, AreaInstance,
    Frame, Hero, LootType, SavedHeroData, Rect, Zone, ZoneLocation,
} from 'app/types';

export type StaffTowerLocation = 'desert' | 'forest' | 'mountain';

export type SavedState = {
    // Flags that are set permanently for objects, like opened treasure chests or defeated bosses.
    objectFlags: {[key: string]: boolean}
    // Flags that remain set as long as the character does not leave the current zone.
    zoneFlags: {[key: string]: boolean}
    savedHeroData: SavedHeroData
    dungeonInventories: {
        [key: string]: DungeonInventory
    }
    staffTowerLocation: StaffTowerLocation
}

export interface DungeonInventory {
    bigKey: boolean
    map: boolean
    smallKeys: number
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
    savedState: SavedState
    savedGames: SavedState[]
    savedGameIndex: number
    hero: Hero
    camera: { x: number, y: number }
    time: number
    gameHasBeenInitialized: boolean
    lastTimeRendered: number
    alternateAreaInstance?: AreaInstance
    areaInstance?: AreaInstance
    surfaceAreaInstance?: AreaInstance
    underwaterAreaInstance?: AreaInstance
    areaSection?: Rect
    nextAreaInstance?: AreaInstance
    nextAreaSection?: Rect
    zone: Zone
    areaGrid: AreaGrid
    location: ZoneLocation
    transitionState?: {
        // The location to switch to after the current screen wipe transition.
        nextLocation: ZoneLocation
        // This is used for rendering the next area when diving/surfacing.
        // It is also used to avoid recreating areas when teleporting between spirit+material worlds.
        nextAreaInstance?: AreaInstance
        // This is used to avoid recreating areas then teleporting between spirit+material worlds.
        nextAlternateAreaInstance?: AreaInstance
        time: number
        callback: () => void
        patternCanvas?: HTMLCanvasElement
        patternContext?: CanvasRenderingContext2D
        pattern?: CanvasPattern
        underCanvas?: HTMLCanvasElement
        type: 'circle' | 'fade' | 'portal' | 'diving' | 'surfacing' | 'mutating'
        // The targetZ value for the hero after the transition.
        targetZ?: number
    }
    paused: boolean
    menuIndex: number
    menuRow: number
    defeatState: {
        defeated: boolean
        time: number
    },
    scene: Scene
    keyboard: {
        gameKeyValues: number[]
        gameKeysDown: Set<number>
        gameKeysPressed: Set<number>
        // The set of most recent keys pressed, which is recalculated any time
        // a new key is pressed to be those keys pressed in that same frame.
        mostRecentKeysPressed: Set<number>
        gameKeysReleased: Set<number>
    },
    messageState?: {
        // How long to show each page before automatically advancing
        advanceTime?: number
        // Whether to continue updating the field in the background while text is displayed
        continueUpdatingState?: boolean
        // Time the current page was displayed
        currentPageTime: number
        pageIndex: number
        pages: (Frame[][] | DialogueLootDefinition | string)[]
    }
    isUsingKeyboard?: boolean
    isUsingXbox?: boolean
    fadeLevel: number
}
