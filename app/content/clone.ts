import { renderHero } from 'app/renderActor';

import { carryMap, directionMap, directionToLeftRotationsFromRight, rotateDirection } from 'app/utils/field';

import {
    Action, ActiveTool, AreaInstance,
    Direction, DrawPriority, MagicElement, Equipment, Frame, FullTile,
    GameState, Hero, ObjectInstance, ObjectStatus, PassiveTool,
    ShortRectangle, TileBehaviors, TileCoords, ZoneLocation
} from 'app/types';

export class Clone implements Hero, ObjectInstance {
    area: AreaInstance;
    behaviors: TileBehaviors = {
        solid: true,
    };
    definition = null;
    drawPriority: DrawPriority = 'sprites';
    frame: Frame;
    element: MagicElement;
    life: number;
    x: number;
    y: number;
    z: number;
    safeD:Direction;
    safeX: number;
    safeY: number;
    vx: number;
    vy: number;
    vz: number;
    w: number;
    h: number;
    d: Direction;
    arrows: number;
    peachQuarters: number;
    magic: number;
    magicRegen: number;
    money: number;
    maxLife: number;
    maxMagic: number;
    spiritTokens: number;
    toolCooldown: number;
    weapon: number;
    activeTools: {[key in ActiveTool]: number};
    equipment: {[key in Equipment]: number};
    passiveTools: {[key in PassiveTool]: number};
    elements: {[key in MagicElement]: number};
    activeClone: Clone;
    clones: Clone[]
    stuckFrames: number = 0;
    status: ObjectStatus = 'normal';
    animationTime: number = 0;
    action: Action;
    actionTarget: any;
    actionDx: number;
    actionDy: number;
    actionFrame: number;
    carrier: Hero;
    pickUpFrame: number;
    pickUpTile: FullTile;
    pickUpObject: ObjectInstance;
    grabTile: TileCoords;
    grabObject: ObjectInstance;
    invulnerableFrames: number;
    leftTool: ActiveTool;
    rightTool: ActiveTool;
    invisibilityCost: number;
    invisible: boolean;
    lightRadius: number;
    spawnLocation: ZoneLocation;
    spiritRadius: number;
    carryRotationOffset: number;
    constructor(hero: Hero) {
        for (let k in hero) {
            this[k] = hero[k];
        }
        this.invulnerableFrames = 0;
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }

    onGrab(state: GameState, direction: Direction, hero: Hero) {
        this.action = 'beingCarried';
        this.carrier = hero;
        // Track the clone rotation relative to the hero picking it up so we can rotate it correctly if the hero
        // changes directions.
        this.carryRotationOffset = directionToLeftRotationsFromRight[this.d] - directionToLeftRotationsFromRight[hero.d];
        hero.pickUpObject = this;
    }
    update(state: GameState) {
        if (this.carrier) {
            if (this.carrier.area === this.area) {
                this.updateCoords(state);
            } else {
                this.carrier = null;
                this.action = 'knocked';
                this.animationTime = 0;
            }
        }
    }
    updateCoords(state: GameState) {
        const offset = carryMap[this.carrier.d][Math.min(this.carrier.pickUpFrame, carryMap[this.carrier.d].length - 1)];
        if (!this.carrier || !offset) {
            debugger;
        }
        const [dx, dy] = directionMap[this.carrier.d];
        this.x = this.carrier.x + offset.x + dx;
        this.y = this.carrier.y + dy;
        this.z = -offset.y;
        this.d = rotateDirection(this.carrier.d, this.carryRotationOffset);
    }
    render = renderHero;
}
