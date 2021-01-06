import { Direction, FrameAnimation, ObjectInstance, Tile } from 'app/types';

export type Action = 'attack' | 'roll' | 'knocked' | 'hurt' | 'dead' | 'grabbing' | 'carrying' | 'throwing' | 'getItem';
export type ActiveTool = 'weapon' | 'bow' | 'staff' | 'clone' | 'invisibility';
export type Equipment = 'cloudBoots' | 'ironBoots';
export type PassiveTool = 'gloves'
    | 'roll' | 'cloudSomersalt'
    | 'charge' | 'nimbusCloud'
    | 'catEyes' | 'spiritSight' | 'trueSight'
    | 'astralProjection' | 'telekinesis'
    | 'ironSkin' | 'goldMail' | 'phoenixCrown'
    | 'waterBlessing' | 'fireBlessing';
export type Element = 'fire' | 'ice' | 'lightning';
export type Collectible = 'peachOfImmortality' | 'peachOfImmortalityPiece';
export type CommonLoot = 'money' | 'arrows' | 'peach';

export type LootType = ActiveTool | Equipment | PassiveTool | Element | Collectible | CommonLoot | 'unknown';


type AnimationSet = {
    [key in Direction]: FrameAnimation
}
export interface ActorAnimations {
    idle: AnimationSet,
    move?: AnimationSet,
    attack?: AnimationSet,
    hurt?: AnimationSet,
    death?: AnimationSet,
}

export interface Actor {
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
    pickUpFrame?: number,
    pickUpTile?: Tile,
    grabTile?: Tile,
    grabObject?: ObjectInstance,
    invulnerableFrames?: number,
    life: number,
    leftTool?: ActiveTool,
    rightTool?: ActiveTool,
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
    chakrams: number,
    arrows: number,
    peachQuarters: number,
    spiritTokens: number,
    toolCooldown: number,
    activeTools: {[key in ActiveTool]: number},
    equipment: {[key in Equipment]: number},
    passiveTools: {[key in PassiveTool]: number},
    elements: {[key in Element]: number},
}

