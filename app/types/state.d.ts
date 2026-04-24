type StaffTowerLocation = 'desert' | 'forest' | 'mountain';

interface SavedARState {
    gameData: {[key: string]: any}
}

interface SavedBossRushRecord {
    bestTime: number
    highScore: number
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
    bossRushData: {[key in BossRushKey]?: SavedBossRushRecord}
    savedRandomizerData?: SavedRandomizerState
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
    isRandomizerUnlocked?: boolean
}

interface DungeonInventory {
    bigKey: boolean
    map: boolean
    smallKeys: number
    // Total number of small keys ever collected for this dungeon.
    totalSmallKeys: number
}

type TransitionType = 'circle' | 'fade' | 'fastFade' | 'portal' | 'diving' | 'surfacing' | 'mutating';

type GameMode = 'normal'|'randomizer'|'test';

interface GameState {
    sceneStack: GameScene[]
    savedState: SavedState
    settings: Settings
    savedRandomizerGames: SavedState[]
    savedGames: SavedState[]
    savedGameIndex: number
    // Different game modes use different save slot arrays, so we need to track
    // the current game mode in order to determine which array to save to.
    savedGameMode: GameMode
    hero: Hero
    camera: { x: number, y: number, speed?: number }
    fieldTime: number
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
        type: TransitionType
        // Color to fade to, defaults to black.
        fadeColor?: string
        // The targetZ value for the hero after the transition.
        targetZ?: number
    }
    mutationDuration?: number
    showControls: boolean
    // This is mostly used for debugging animations.
    alwaysHideMenu?: boolean
    keyboard: {
        gameKeyValues: number[]
        gameKeysDown: Set<number>
        gameKeysPressed: Set<number>
        // The set of most recent keys pressed, which is recalculated any time
        // a new key is pressed to be those keys pressed in that same frame.
        mostRecentKeysPressed: Set<number>
        gameKeysReleased: Set<number>
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
    bossRushState?: BossRushState
    randomizerState?: RandomizerState
    // This seed is used for randomizing minor variations in the game, such as the solution to some puzzles
    // and certain random elements and areas. By default it is 0 in the normal game and uses the same
    // value as the randomizer seed for randomized games.
    variantSeed: number
    travel?: (zoneKey: string, markerId: string, options?: any) => void
    // This stores the current hero data when we apply special configurations to the hero
    // data for certain mini games, such as special conditions during Boss Rush battles.
    backupHeroData?: SavedHeroData
    generatedLogicNodes: LogicNode[]
    isDemoMode?: boolean
}
interface RandomizerGoal {
    // How many combined points are required to finish.
    combinedGoal?: number
    victoryPoints?: {
        // How many victory points are required to finish.
        goal?: number
        // How many victory points are available
        total: number
    }
    bossPoints?: {
        // How many boss points are required to finish.
        goal?: number
        // Map of boss key to point value for defeating that boss.
        bossPoints: {[key in BossKey]?: number}
    }
}

interface SimpleDoorLocation {
    location: ZoneLocation
    definition: EntranceDefinition
}

interface DoorLocation {
    key: string
    originalTargetKey: string
    location: ZoneLocation
    definition: EntranceDefinition|MarkerDefinition
    node: LogicNode
    isEntrance?: boolean
    isExit?: boolean
    isUnderWater?: boolean
    linkedDoors?: Set<string>
}
interface EntranceData {
    targetZone?: string
    targetObjectId?: string
    status?: ObjectStatus
}

interface RandomizerEntrances {
    // This represents the progress/result of randomizing the entrances in the game.
    // Entrances in the game will check for their `${zoneKey}:${objectId}` on this map
    // and use the defined targetZone+targetObjectId if found
    entranceAssignments: {[key in string]: EntranceData}
    random: SRandom
    fixedNimbusCloudZones: Set<string>
    targetIdMap: {[key in string]: DoorLocation[]}
}
type NodesByZoneKey = {[zoneKey in string]: LogicNode[]};
type NodesById = {[nodeId in string]: LogicNode};
interface RandomizerItems {
    // This represents the progress/result of randomizing the items in the game.
    // When loot is found during the game, it will be replaced based on this assignment if one is present.
    // Maps object.id (which uses `${dialogueKey}:${optionKey}` for loot gained in dialogue)
    // to the LootData that has been assigned by the randomizer.
    lootAssignments?: {[key in string]: LootData}
    random?: SRandom
    // Maps entranceId => # of zone keys to put that entrance in logic.
    // This does not include zone on the key since entranceIds are shared across all zones
    // and locked doors should not be shared between zones since small keys are zone specific.
    requiredKeysMap?: RequiredKeysMap
    // It is necessary to remap certain dialogue options in order to change the the item
    // rewards given by talking to NPCs.
    dialogueReplacements: {[npcKey: string]: {
        [optionKey: string]: TextScript
    }}
    // State used to store assignment data while generating item randomization.
    assignmentsState?: AssignmentState
    // All items remaining to be placed grouped and prioritize by category
    allItemSets?: LootWithLocation[][]
    // All items remaining to be placed. Until an item is going to be placed, it is assumed to be collected by the
    // player before determining which placement locations are in logic for the currently placed item.
    remainingLoot?: LootWithLocation[]
    // The initial state used as a starting point for calculating what is in logic for each item placement.
    initialState?: GameState
    // Items that do not effect game logic and can be quickly placed randomly after all other assignments have been made.
    trashLoot?: LootWithLocation[]
}

type RequiredKeysMap = {[key in string]: number};
// Randomizer data that must be saved in order to recreate a randomizer seed.
interface SavedRandomizerState {
    goal: RandomizerGoal
    itemSeed?: number
    enemySeed?: number
    entranceSeed?: number
}
interface RandomizerState extends SavedRandomizerState {
    // The full set of logic nodes that are in bounds for randomization.
    // Typically this should include any node in the game that either contains a randomizable element
    // or is relevant to traveling between nodes with randomizable elements.
    allNodes: LogicNode[]
    allNodesById: NodesById
    allNodesByZoneKey: NodesByZoneKey
    // The set of all loot objects found within the randomized nodes.
    // This does not include every check found in reachable nodes.
    // For example, only the first item from the merchant will be present in demo mode since the
    // other items cannot be purchased until after the end of the demo.
    allLootObjects: LootWithLocation[]
    // The set of all loot etrances that can be used within the nodes.
    // This does not include every entrance/exit in reachable nodes.
    // For example, this does not include the grand temple entrance in demo mode, because even though
    // it is in the node, it cannot be used in the demo.
    allEntrances: DoorLocation[]
    // The set of nodes that are possible starting places for the player in the randomizer.
    startingNodes: LogicNode[]
    allChecks: Set<string>
    lootAssignmentByKey: {[key: string]: LootAssignment}
    checksByZone: {[key: string]: Set<string>}
    dungeonItemCountByZone: {[key: string]: number}
    logicalZoneKeyByCheckKey: {[key: string]: LogicalZoneKey}
    items?: RandomizerItems
    entrances?: RandomizerEntrances
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
