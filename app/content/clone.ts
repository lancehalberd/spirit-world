//import { getAreaSize } from 'app/content/areas';
//import { GAME_KEY, getMovementDeltas, isKeyDown } from 'app/keyCommands';
import { renderHero } from 'app/renderActor';
//import { moveActor } from 'app/moveActor';
//import { getFrame } from 'app/utils/animations';

import {
    Action, ActiveTool, AreaInstance,
    Direction, DrawPriority, MagicElement, Equipment, Frame,
    GameState, Hero, LayerTile, ObjectInstance, ObjectStatus, PassiveTool,
    ShortRectangle, Tile, ZoneLocation
} from 'app/types';

export class Clone implements Hero, ObjectInstance {
    area: AreaInstance;
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
    pickUpFrame: number;
    pickUpTile: LayerTile;
    grabTile: Tile;
    grabObject: ObjectInstance;
    invulnerableFrames: number;
    leftTool: ActiveTool;
    rightTool: ActiveTool;
    invisibilityCost: number;
    invisible: boolean;
    spawnLocation: ZoneLocation;
    spiritRadius: number;
    constructor(hero: Hero) {
        for (let k in hero) {
            this[k] = hero[k];
        }
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    update(state: GameState) {
    }
    render = renderHero;
}
