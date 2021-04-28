import { Clone } from 'app/content/clone';
import { Staff } from 'app/content/staff';

import {
    AreaInstance, Direction, FrameAnimation, GameState, LayerTile,
    ObjectInstance, ObjectStatus, Tile, ZoneLocation,
} from 'app/types';

export type Action =
    'attack' | 'roll' | 'knocked' | 'hurt' | 'dead' | 'walking'
    | 'pushing' | 'grabbing' | 'carrying' | 'throwing' | 'thrown' | 'getItem'
    | 'beingCarried' | 'entering' | 'exiting'
    | 'falling' | 'fallen' | 'meditating'
    // Used when the player is in water. Player cannot use abilities.
    |'swimming'
    // Used for climbing vines on walls or ladders. The player moves more slowly and cannot use abilities while climbing.
    | 'climbing'
    // Used when jumping off of ledges. This causes the character to move in a specific fall trajectory
    // based on the direction they jump down until they "land" on a walkable tile.
    | 'jumpingDown';
export type ActiveTool = 'bow' | 'staff' | 'clone' | 'invisibility';
export type Equipment = 'cloudBoots' | 'ironBoots';
export type PassiveTool = 'gloves'
    | 'roll'
    | 'charge' | 'nimbusCloud'
    | 'catEyes' | 'spiritSight' | 'trueSight'
    | 'astralProjection' | 'telekinesis'
    | 'ironSkin' | 'goldMail' | 'phoenixCrown'
    | 'waterBlessing' | 'fireBlessing';
export type MagicElement = 'fire' | 'ice' | 'lightning';
export type Collectible = 'peachOfImmortality' | 'peachOfImmortalityPiece';
export type CommonLoot = 'money' | 'peach';
export type DungeonLoot = 'smallKey' | 'bigKey' | 'map';

export type LootType = 'weapon' | ActiveTool | Equipment | PassiveTool
    | MagicElement | Collectible | CommonLoot | DungeonLoot | 'unknown';


export interface LootTable {
    totalWeight: number,
    thresholds:  number[],
    loot: {type: LootType, amount?: number}[],
}

export type AnimationSet = {
    [key in Direction]?: FrameAnimation
}
export interface ActorAnimations {
    attack?: AnimationSet,
    climbing?: AnimationSet,
    death?: AnimationSet,
    falling?: AnimationSet,
    grab?: AnimationSet,
    hurt?: AnimationSet,
    idle: AnimationSet,
    move?: AnimationSet,
    wade?: AnimationSet,
    pull?: AnimationSet,
    push?: AnimationSet,
    roll?: AnimationSet,
}

export interface Actor {
    area: AreaInstance,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    vx: number,
    vy: number,
    vz: number,
    d: Direction,
    action?: Action,
    actionDx?: number,
    actionDy?: number,
    actionFrame?: number,
    actionTarget?: any,
    animationTime: number,
    jumpingTime?: number,
    // If this is set, the actor is being carried by a hero/clone.
    carrier?: Hero,
    explosionTime?: number,
    pickUpFrame?: number,
    pickUpObject?: ObjectInstance;
    pickUpTile?: LayerTile,
    grabTile?: Tile,
    grabObject?: ObjectInstance,
    invulnerableFrames?: number,
    life: number,
    render: (context: CanvasRenderingContext2D, state: GameState) => void,
    takeDamage?: (state: GameState, damage: number) => void,
    wading?: boolean,
    swimming?: boolean,
}


export interface Hero extends Actor {
    // stats
    maxLife: number,
    magic: number,
    // base: 20, max: 100, roll: 5, charge: 10, double-charge: 50
    maxMagic: number,
    // base 4, max 8-10
    magicRegen: number,
    lightRadius: number,
    // inventory
    money: number,
    arrows: number,
    peachQuarters: number,
    spiritTokens: number,
    toolCooldown: number,
    activeTools: {[key in ActiveTool]: number},
    equipment: {[key in Equipment]: number},
    passiveTools: {[key in PassiveTool]: number},
    elements: {[key in MagicElement]: number},
    clones: Clone[],
    activeClone?: Clone,
    activeStaff?: Staff,
    invisible: boolean,
    invisibilityCost: number,
    safeD: Direction,
    safeX: number,
    safeY: number,
    weapon: number,
    leftTool?: ActiveTool,
    rightTool?: ActiveTool,
    element?: MagicElement,
    spiritRadius: number,
    status: ObjectStatus,
    spawnLocation: ZoneLocation,
}

