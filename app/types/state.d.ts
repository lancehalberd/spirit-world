type StaffTowerLocation = 'desert' | 'forest' | 'mountain';

type SavedState = {
    // Flags that are set permanently for objects, like opened treasure chests or defeated bosses.
    objectFlags: {[key: string]: boolean | number | string}
    // Flags that remain set as long as the character does not leave the current zone.
    zoneFlags: {[key: string]: boolean | number | string}
    savedHeroData: SavedHeroData
    dungeonInventories: {
        [key: string]: DungeonInventory
    }
    staffTowerLocation: StaffTowerLocation
    // Stores the last N lucky beetle ids defeated, which will not respawn.
    luckyBeetles: string[]
    exploredSections: number[]
    heardDialogue: number[]
}

// These settings are global and can be saved independent of saved state
interface Settings {
    // Mute everything
    muteAllSounds?: boolean
    // Mute background music
    muteMusic?: boolean
    // Mute sound effects
    muteSounds?: boolean
}

interface DungeonInventory {
    bigKey: boolean
    map: boolean
    smallKeys: number
    // Total number of small keys ever collected for this dungeon.
    totalSmallKeys: number
}

type Scene = 'title'
    | 'chooseGameMode' | 'deleteSavedGame' | 'deleteSavedGameConfirmation'
    | 'game' | 'credits' | 'options';


interface GameState {
    savedState: SavedState
    settings: Settings
    savedGames: SavedState[]
    savedGameIndex: number
    hero: Hero
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
    areaSection?: AreaSectionInstance
    nextAreaInstance?: AreaInstance
    nextAreaSection?: AreaSectionInstance
    zone: Zone
    floor: Floor
    areaGrid: AreaGrid
    location: FullZoneLocation
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
    mutationDuration?: number
    paused: boolean
    showMap: boolean
    menuIndex: number
    menuRow: number
    // This is mostly used for debugging animations.
    alwaysHideMenu?: boolean
    // Mostly used for debugging spirit energy balance.
    renderMagicCooldown?: boolean
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
    messagePage?: TextPageState
    randomizer?: {
        seed: number
        goal: number
    },
    scriptEvents: {
        activeEvents: ActiveScriptEvent[]
        blockEventQueue: boolean
        blockFieldUpdates: boolean
        blockPlayerInput: boolean
        handledInput: boolean
        overrideMusic?: TrackKey
        queue: ScriptEvent[]
    }
    isUsingKeyboard?: boolean
    isUsingXbox?: boolean
    // used to ease the darkness effect in and out
    fadeLevel: number
    // used to ease the hot effect in and out
    hotLevel: number
    screenShakes: ScreenShake[]
    map: {
        needsRefresh: boolean
        renderedMapId?: string
        renderedFloorId?: string
    }
}
