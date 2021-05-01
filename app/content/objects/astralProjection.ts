import { getHeroFrame, renderCarriedTile } from 'app/renderActor';

import { drawFrame } from 'app/utils/animations';

import {
    Action, ActiveTool, AreaInstance, Clone,
    Direction, DrawPriority, MagicElement, Equipment, Frame,
    GameState, Hero, LayerTile, ObjectInstance, ObjectStatus, PassiveTool,
    ShortRectangle, Tile, TileBehaviors, ZoneLocation
} from 'app/types';

export class AstralProjection implements Hero, ObjectInstance {
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
    vx: number = 0;
    vy: number = 0;
    vz: number = 0;
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
    activeTools: {[key in ActiveTool]: number} = {} as any;
    equipment: {[key in Equipment]: number} = {} as any;
    passiveTools: {[key in PassiveTool]: number} = {} as any;
    elements: {[key in MagicElement]: number} = {} as any;
    activeClone: Clone;
    clones: Clone[] = [];
    stuckFrames: number = 0;
    status: ObjectStatus = 'normal';
    animationTime: number = 0;
    action: Action;
    actionTarget: any;
    actionDx: number = 0;
    actionDy: number = 0;
    actionFrame: number = 0;
    pickUpFrame: number = 0;
    pickUpTile: LayerTile;
    pickUpObject: ObjectInstance;
    grabTile: Tile;
    grabObject: ObjectInstance;
    invulnerableFrames: number;
    leftTool: ActiveTool;
    rightTool: ActiveTool;
    invisibilityCost: number;
    invisible: boolean;
    lightRadius: number;
    spawnLocation: ZoneLocation;
    spiritRadius: number;
    constructor(hero: Hero) {
        this.life = hero.magic;
        this.x = hero.x;
        this.y = hero.y;
        this.w = hero.w;
        this.h = hero.h;
        this.d = hero.d;
        this.invulnerableFrames = 0;
        this.leftTool = this.rightTool = null;
        this.z = 4;
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    render(this: Hero, context: CanvasRenderingContext2D, state: GameState): void {
        const hero = this;
        const frame = getHeroFrame(state, hero);
        const h1 = 14;
        const h2 = 4;
        const h3 = 4;
        context.save();
            context.globalAlpha = 0.7;
            drawFrame(context, {...frame, h: h1}, { x: hero.x - frame.content.x, y: hero.y - frame.content.y - hero.z + 4, w: frame.w, h: h1 });
            context.globalAlpha = 0.4;
            drawFrame(context, {...frame, y: frame.y + h1, h: h2}, { x: hero.x - frame.content.x, y: hero.y - frame.content.y - hero.z + 4 + h1, w: frame.w, h: h2 });
            context.globalAlpha = 0.1;
            drawFrame(context, {...frame, y: frame.y + h1 + h2, h: h3}, { x: hero.x - frame.content.x, y: hero.y - frame.content.y - hero.z + 4 + h1 + h2, w: frame.w, h: h3 });
        context.restore();
        if (hero.pickUpTile) {
            renderCarriedTile(context, state, hero);
        }
    }
}
