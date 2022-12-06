//import { Staff } from 'app/content/objects/staff';
import {
    Direction, EffectInstance, FrameAnimation, FullTile, GameState, Hero,
    ObjectInstance, TileCoords, ZoneLocation,
} from 'app/types';

export type Action =
    'attack' | 'charging' | 'roll' | 'usingStaff'
    // Hero can be forced into screen transitions when knockedHard.
    | 'knocked' | 'knockedHard'
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
export type ActiveTool = 'bow' | 'staff' | 'clone' | 'cloak';
export type Equipment = 'leatherBoots' | 'cloudBoots' | 'ironBoots';
export type PassiveTool = 'gloves'
    | 'roll'
    | 'charge' | 'nimbusCloud'
    | 'catEyes' | 'spiritSight' | 'trueSight'
    | 'astralProjection' | 'teleportation'
    | 'ironSkin' | 'goldMail' | 'phoenixCrown'
    | 'waterBlessing' | 'fireBlessing' | 'lightningBlessing';
export type MagicElement = 'fire' | 'ice' | 'lightning';
export type Collectible = 'peachOfImmortality'
    | 'peachOfImmortalityPiece'
    | 'silverOre'
    | 'goldOre'
    | 'victoryPoint';
export type CommonLoot = 'money' | 'peach';
export type DungeonLoot = 'smallKey' | 'bigKey' | 'map';

export type LootType = 'empty' | 'weapon'
    // In the randomizer spiritSight, astralProjection + teleportation are changed to this progressive spirit power
    // ability so that you will always get the abilities in an order that they can be used immediately.
    | 'spiritPower'
    | 'secondChance'
    | ActiveTool | Equipment | PassiveTool
    | MagicElement | Collectible | CommonLoot | DungeonLoot | 'unknown';

export type MenuOptionType = LootType | 'help' | 'return';

export type WeaponUpgrades = 'normalDamage' | 'normalRange' | 'spiritDamage' | 'spiritRange';

export interface LootTable {
    totalWeight: number
    thresholds:  number[]
    loot: {type: LootType, amount?: number}[]
}

export type AnimationSet = {
    [key in Direction]?: FrameAnimation
}
export interface ActorAnimations {
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

export interface Actor extends ObjectInstance {
    w: number
    h: number
    vx: number
    vy: number
    vz: number
    d: Direction
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
    jumpingVx?: number
    jumpingVy?: number
    jumpingVz?: number
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
    lastTouchedObject?: EffectInstance | ObjectInstance
    invulnerableFrames?: number
    life: number
    knockBack?: (state: GameState, vector: {vx: number, vy: number, vz: number}) => void
    wading?: boolean
    slipping?: boolean
    swimming?: boolean
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
}
/* In case using the Hero class causes dependency issues, maybe switching to this interface could help.
export interface Hero extends Actor, SavedHeroData {
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
    safeD: Direction
    safeX: number
    safeY: number
    chargingLeftTool?: boolean
    chargingRightTool?: boolean
    chargingHeldObject?: boolean
    chargeTime?: number
    spiritRadius: number
}*/

export interface SavedHeroData {
    maxLife: number
    // If this isn't set, the hero will start with maxLife.
    life?: number
    hasRevive: boolean
    money: number
    silverOre: number
    goldOre: number
    peachQuarters: number
    spiritTokens: number
    victoryPoints: number
    activeTools: {[key in ActiveTool]: number}
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
