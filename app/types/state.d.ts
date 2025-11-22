type StaffTowerLocation = 'desert' | 'forest' | 'mountain';

interface SavedARState {
    gameData: {[key: string]: any}
}

interface SavedState {
    // Flags that are set permanently for objects, like opened treasure chests or defeated bosses.
    objectFlags: {[key: string]: boolean | number | number[] | string}
    // Flags that remain set as long as the character does not leave the current zone.
    zoneFlags: {[key: string]: boolean | number | number[] | string}
    savedHeroData: SavedHeroData
    savedArData: SavedARState
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
    globalVolume?: number
    musicVolume?: number
    soundVolume?: number
}

interface DungeonInventory {
    bigKey: boolean
    map: boolean
    smallKeys: number
    // Total number of small keys ever collected for this dungeon.
    totalSmallKeys: number
}

type Scene = 'intro' | 'prologue' | 'title' | 'fileSelect'
    | 'chooseGameMode' | 'deleteSavedGame' | 'deleteSavedGameConfirmation'
    | 'game' | 'credits' | 'options';


interface GameState {
    savedState: SavedState
    settings: Settings
    savedGames: SavedState[]
    savedGameIndex: number
    hero: Hero
    camera: { x: number, y: number, speed?: number }
    fieldTime: number
    // This can be used any time we want to track player idlesness,
    // for example to show the prologue again when the player is idle
    // on the title screen.
    idleTime: number
    prologueTime: number
    // Time that advances forward regardles of scene or whether the game is paused.
    time: number
    // This is set when the player gains or uses a revive
    // and reviveAnimationTime = fieldTime - reviveTime
    reviveTime: number
    gameHasBeenInitialized: boolean
    lastTimeRendered: number
    alternateAreaInstance?: AreaInstance
    areaInstance?: AreaInstance
    surfaceAreaInstance?: AreaInstance
    underwaterAreaInstance?: AreaInstance
    areaSection?: AreaSectionInstance
    alternateAreaSection?: AreaSectionInstance
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
        nextAreaSection?: AreaSectionInstance
        // This is used to avoid recreating areas then teleporting between spirit+material worlds.
        nextAlternateAreaInstance?: AreaInstance
        time: number
        callback: () => void
        patternCanvas?: HTMLCanvasElement
        patternContext?: CanvasRenderingContext2D
        pattern?: CanvasPattern
        underCanvas?: HTMLCanvasElement
        type: 'circle' | 'fade' | 'portal' | 'diving' | 'surfacing' | 'mutating'
        // Color to fade to, defaults to black.
        fadeColor?: string
        // The targetZ value for the hero after the transition.
        targetZ?: number
    }
    mutationDuration?: number
    paused: boolean
    showMap: boolean
    showControls: boolean
    menuIndex: number
    menuRow: number
    // This is mostly used for debugging animations.
    alwaysHideMenu?: boolean
    defeatState: {
        defeated: boolean
        reviving?: boolean
        time: number
    }
    scene: Scene
    keyboard: {
        gameKeyValues: number[]
        gameKeysDown: Set<number>
        gameKeysPressed: Set<number>
        // The set of most recent keys pressed, which is recalculated any time
        // a new key is pressed to be those keys pressed in that same frame.
        mostRecentKeysPressed: Set<number>
        gameKeysReleased: Set<number>
    }
    messagePage?: TextPageState
    randomizer?: {
        seed: number
        goal: number
    }
    scriptEvents: {
        activeEvents: ActiveScriptEvent[]
        blockEventQueue: boolean
        blockFieldUpdates: boolean
        blockPlayerInput: boolean
        blockPlayerUpdates: boolean
        cameraTarget?: Point
        handledInput: boolean
        overrideMusic?: TrackKey
        queue: ScriptEvent[]
        // This is the last time the player pressed the MENU button
        // during a cutscene. If they press it twice within 2 seconds
        // they will skip the cutscene.
        skipTime?: number
        onSkipCutscene?: (state: GameState) => void
    }
    isUsingKeyboard?: boolean
    isUsingXbox?: boolean
    // used to ease the darkness effect in and out
    fadeLevel: number
    // used to ease HUD in and out
    hudOpacity: number
    hideHUD: boolean
    hudTime: number
    // used to ease the hot effect in and out
    hotLevel: number
    screenShakes: ScreenShake[]
    loopingSoundEffects: AudioInstance[]
    map: {
        needsRefresh: boolean
        restoreOriginalTiles?: boolean
        renderedMapId?: string
        renderedFloorId?: string
    }
    arState: ARState
}

type ARGameID = 'dodger'|'hota'|'target'|'targetFPS';

interface ARState {
    active: boolean
    scene: 'choose'|ARGameID
    game?: any
}

interface ARGame {
    start: (state: GameState) => void
    update: (state: GameState) => void
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    renderHUD: (context: CanvasRenderingContext2D, state: GameState) => void
    disablesPlayerMovement?: boolean
}
