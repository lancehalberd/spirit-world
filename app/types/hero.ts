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
    | 'falling' | 'fallen' | 'meditating';
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

export type LootType = 'weapon' | ActiveTool | Equipment | PassiveTool | MagicElement | Collectible | CommonLoot | 'unknown';


type AnimationSet = {
    [key in Direction]: FrameAnimation
}
export interface ActorAnimations {
    attack?: AnimationSet,
    death?: AnimationSet,
    falling?: AnimationSet,
    grab?: AnimationSet,
    hurt?: AnimationSet,
    idle: AnimationSet,
    move?: AnimationSet,
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
}

export interface Hero extends Actor {
    // stats
    maxLife: number,
    magic: number,
    // base: 20, max: 100, roll: 5, charge: 10, double-charge: 50
    maxMagic: number,
    // base 4, max 8-10
    magicRegen: number,
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

