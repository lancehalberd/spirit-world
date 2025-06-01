type Action =
    'attack' | 'charging' | 'roll' | 'preparingSomersault' | 'usingStaff'
    // Hero can be forced into screen transitions when knockedHard.
    | 'kneel' | 'knocked' | 'knockedHard'
    | 'hurt' | 'dead' | 'walking'
    | 'pushing' | 'grabbing' | 'carrying' | 'throwing' | 'thrown' | 'getItem'
    | 'beingCarried'
    | 'falling' | 'fallen'
    | 'sinkingInLava' | 'sankInLava'
    | 'chargingCloneExplosion'
    | 'meditating'
    // Used for climbing vines on walls or ladders. The player moves more slowly and cannot use abilities while climbing.
    | 'climbing'
    // Used when jumping off of ledges. This causes the character to move in a specific fall trajectory
    // based on the direction they jump down until they "land" on a walkable tile.
    | 'jumpingDown';


type AnimationSet = {
    [key in Direction]?: FrameAnimation
}
interface ActorAnimations {
    attack?: AnimationSet
    cloak?: AnimationSet
    climbing?: AnimationSet
    death?: AnimationSet
    falling?: AnimationSet
    grab?: AnimationSet
    hurt?: AnimationSet
    idle: AnimationSet
    move?: AnimationSet
    pull?: AnimationSet
    push?: AnimationSet
    roll?: AnimationSet
    staffJump?: AnimationSet
    staffSlam?: AnimationSet
    still?: AnimationSet //displays a still frame
    [key: string]: AnimationSet
}

interface Actor extends ObjectInstance {
    w: number
    h: number
    vx: number
    vy: number
    vz: number
    d: CardinalDirection
    action?: Action
    actionDx?: number
    actionDy?: number
    actionFrame?: number
    actionTarget?: any
    animationTime: number
    // This value is set if the player attempts to use the chakram while it is still in
    // flight. If the player catches the chakram shortly after this time, the chakram
    // will re-arm as if they pressed the button right when they caught it.
    attackBufferTime?: number
    // like being knocked but doesn't stop MC charge or other actions.
    bounce?: {vx: number, vy: number, frames: number}
    groundHeight: number
    hasBarrier?: boolean
    isInvisible?: boolean
    // How long the hero has been falling for in ms. Currently used to calculate if a fall is hard
    // since we cap the fall velocity too low to calculate based on velocity.
    jumpingTime?: number
    jumpingVx?: number
    jumpingVy?: number
    jumpingVz?: number
    isJumpingWrecklessly?: boolean
    canTrampoline?: boolean
    // This is set when the actor jumps south and is used to determine when to
    // start checking for a landing position.
    jumpingDownY?: number
    // If this is set the actor is being carried by a hero/clone.
    carrier?: Hero
    explosionTime?: number
    pickUpFrame?: number
    pickUpObject?: ObjectInstance
    pickUpTile?: FullTile
    grabTile?: TileCoords
    grabObject?: ObjectInstance
    lastPushTime?: number
    lastTouchedObject?: EffectInstance | ObjectInstance
    invulnerableFrames?: number
    life: number
    knockBack?: (state: GameState, vector: {vx: number, vy: number, vz: number}) => void
    wading?: boolean
    slipping?: boolean
    swimming?: boolean
    // Set to true if the actor is rolling or hasn't touched the ground for a full frame.
    // An airborn actor is pushed more easily.
    isAirborn?: boolean
    isRunning?: boolean
    floating?: boolean
    sinking?: boolean
    inAirBubbles?: boolean
    frozenDuration?: number
    // If the hero is touching a pit we won't update there safe location.
    isTouchingPit?: boolean
    isOverPit?: boolean
    // These flags are set when an actor is being forced to move through door objects.
    isUsingDoor?: boolean
    // This flag insures that when the user is exiting a door we don't accidentally try
    // to switch to the connected exit. We could probably solve this some other way.
    isExitingDoor?: boolean
    // Generic flag set to remove player control when the hero is controlled by
    // various objects like a BeadCascade BeadSection that sweeps them south.
    isControlledByObject?: boolean
    // This will get set when the actor is standing on an object that acts as ground and covers ledges.
    ignoreLedges?: boolean
    // Used to distinguish between actors that can jump off of ledges like heroes.
    canJumpOffLedges?: boolean
}
/* In case using the Hero class causes dependency issues, maybe switching to this interface could help.
interface Hero extends Actor, SavedHeroData {
    isAstralProjection: boolean
    isClone: boolean


    // stats
    magic: number
    // base: 20, max: 100, roll: 5, charge: 10, double-charge: 50
    maxMagic: number
    // base 4, max 8-10 (target mana regen rate)
    magicRegen: number
    // This is the actual mana regen rate, which changes depending on circumstances and can even become negative.
    actualMagicRegen: number
    lightRadius: number
    // inventory
    toolCooldown: number
    astralProjection?: Hero
    clones: Hero[]
    barrierElement?: MagicElement
    barrierLevel?: number
    safeD: CardinalDirection
    safeX: number
    safeY: number
    chargingLeftTool?: boolean
    chargingRightTool?: boolean
    chargingHeldObject?: boolean
    chargeTime?: number
    spiritRadius: number
}*/

interface SavedHeroData {
    maxLife: number
    ironSkinLife: number
    equippedBoots: Equipment
    previousBoots?: Equipment
    // If this isn't set, the hero will start with maxLife.
    life?: number
    hasRevive: boolean
    money: number
    // Aether is used as currency in the Spirit World and can be obtained by selling
    // Aether Crystals or collectable AR content.
    aether: number
    // Karma is used as currency in the Vanara Dream World and can be obtained by
    // completing Vanara quests or completing optional Dream World challenges.
    karma: number
    // Generic Aether Crystal can be sold for Aether.
    aetherCrystals: number
    silverOre: number
    goldOre: number
    // Total silver/gold ore ever found, used for randomizer logic.
    totalSilverOre: number
    totalGoldOre: number
    peachQuarters: number
    spiritTokens: number
    victoryPoints: number
    activeTools: {[key in ActiveTool]: number}
    blueprints: {[key in Blueprints]: number}
    equipment: {[key in Equipment]: number}
    passiveTools: {[key in PassiveTool]: number}
    elements: {[key in MagicElement]: number}
    weapon: number
    weaponUpgrades: {[key in WeaponUpgrades]?: boolean}
    leftTool?: ActiveTool
    rightTool?: ActiveTool
    element?: MagicElement
    spawnLocation: ZoneLocation
    // How long the player has been playing
    playTime: number
    // How long the player had been playing when they "won" the game.
    winTime: number
}

type Computable<T> = T | (() => T);
interface StatModifier {
    flatBonus?: number
    percentBonus?: number
    multiplier?: number
}
interface ModifiableStat {
    (): number
    addModifier(modifier: StatModifier): void
    removeModifier(modifier: StatModifier): void
    baseValue: Computable<number>
    flatBonus: number
    percentBonus: number
    multipliers: number[]
    finalValue: number
    isDirty: boolean
    minValue?: number
    maxValue?: number
}
