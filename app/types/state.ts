import { Staff } from 'app/content/objects/staff';

import {
    ActiveScriptEvent, AreaGrid, AreaInstance,
    Floor, Hero, LootData, SavedHeroData, Rect, ScriptEvent, TextPage,
    Zone, ZoneLocation,
} from 'app/types';

export type StaffTowerLocation = 'desert' | 'forest' | 'mountain';

export type SavedState = {
    // Flags that are set permanently for objects, like opened treasure chests or defeated bosses.
    objectFlags: {[key: string]: boolean | number | string}
    // Flags that remain set as long as the character does not leave the current zone.
    zoneFlags: {[key: string]: boolean | number | string}
    savedHeroData: SavedHeroData
    dungeonInventories: {
        [key: string]: DungeonInventory
    }
    staffTowerLocation: StaffTowerLocation
}

// These settings are global and can be saved independent of saved state
export interface Settings {
    // Mute everything
    muteAllSounds?: boolean
    // Mute background music
    muteMusic?: boolean
    // Mute sound effects
    muteSounds?: boolean
}

export interface DungeonInventory {
    bigKey: boolean
    map: boolean
    smallKeys: number
}

export type Scene = 'title'
    | 'chooseGameMode' | 'deleteSavedGame' | 'deleteSavedGameConfirmation'
    | 'game' | 'credits' | 'options';

export type DialogueLootDefinition = LootData & {
    type: 'dialogueLoot'
    // The id of the object associated with this dialogue (used during randomization).
    id?: string
    // This can be set for shop loot.
    cost?: number
}

export interface ScreenShake {
    dx: number
    dy: number
    startTime: number
    endTime?: number
    // This can be set to help removing a specific screen shake later.
    id?: string
}

export interface GameState {
    savedState: SavedState
    settings: Settings
    savedGames: SavedState[]
    savedGameIndex: number
    hero: Hero
    activeStaff?: Staff
    camera: { x: number, y: number }
    fieldTime: number
    time: number
    // This marks when the last HUD revive animation started.
    reviveTime: number
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
    floor: Floor
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
    hideMenu?: boolean
    defeatState: {
        defeated: boolean
        reviving?: boolean
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
    messagePage?: TextPage
    randomizer?: {
        seed: number
        goal: number
    },
    scriptEvents: {
        activeEvents: ActiveScriptEvent[]
        blockEventQueue: boolean
        blockFieldUpdates: boolean
        handledInput: boolean
        queue: ScriptEvent[]
    }
    isUsingKeyboard?: boolean
    isUsingXbox?: boolean
    fadeLevel: number
    screenShakes: ScreenShake[]
}
