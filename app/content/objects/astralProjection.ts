import { getCloneMovementDeltas } from 'app/keyCommands';
import { renderCarriedTile } from 'app/renderActor';
import { heroSpiritAnimations } from 'app/render/heroAnimations';
import { drawFrameAt, getFrame } from 'app/utils/animations';
import { directionMap, getDirection } from 'app/utils/field';

import {
    Action, ActiveTool, ActorAnimations, AreaInstance, Clone,
    Direction, DrawPriority, MagicElement, Equipment, Frame, FullTile,
    GameState, Hero, ObjectInstance, ObjectStatus, PassiveTool,
    ShortRectangle, TileBehaviors, TileCoords, ZoneLocation
} from 'app/types';


let lastPullAnimation = null;
export function getSpiritFrame(state: GameState, hero: Hero): Frame {
    let animations: ActorAnimations['idle'];
    switch (hero.action) {
        // Grabbing currently covers animations for pulling/pushing objects that are grabbed.
        case 'grabbing':
            const [dx, dy] = directionMap[hero.d];
            const oppositeDirection = getDirection(-dx, -dy);
            const [kdx, kdy] = getCloneMovementDeltas(state, hero);
            if (hero.grabObject?.pullingHeroDirection === oppositeDirection) {
                lastPullAnimation = heroSpiritAnimations.pull;
                return getFrame(lastPullAnimation[hero.d], hero.animationTime);
            } else if (hero.grabObject?.pullingHeroDirection) {
                lastPullAnimation = heroSpiritAnimations.push;
                return getFrame(lastPullAnimation[hero.d], hero.animationTime);
            } else if (kdx * dx < 0 || kdy * dy < 0) {
                // If the player is not moving but pulling away from the direction they are grabbing,
                // show the pull animation to suggest the player is *trying* to pull the object they
                // are grabbing even though it won't move.
                animations = heroSpiritAnimations.pull;
                return getFrame(animations[hero.d], hero.animationTime);
            }
            // If the player continously pushes/pulls there is one frame that isn't set correctly,
            // so we use this to play that last animation for an extra frame.
            if (lastPullAnimation) {
                const frame = getFrame(lastPullAnimation[hero.d], hero.animationTime);
                lastPullAnimation = null;
                return frame;
            }
            animations = heroSpiritAnimations.grab;
            break;
        case 'pushing':
            animations = heroSpiritAnimations.push;
            break;
        case 'entering':
        case 'exiting':
        case 'walking':
            animations = heroSpiritAnimations.move;
            break;
        default:
            animations = heroSpiritAnimations.idle;
    }
    return getFrame(animations[hero.d], hero.animationTime);
}

export class AstralProjection implements Hero, ObjectInstance {
    actualMagicRegen: number;
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
    pickUpTile: FullTile;
    pickUpObject: ObjectInstance;
    grabTile: TileCoords;
    grabObject: ObjectInstance;
    invulnerableFrames: number;
    leftTool: ActiveTool;
    rightTool: ActiveTool;
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
        const frame = getSpiritFrame(state, hero);
        context.save();
            context.globalAlpha = 0.7;
            if (state.hero.magic <= 10 || this.invulnerableFrames > 0) {
                // Spirit flashes when teleportation will end meditation by bringing magic under 10.
                context.globalAlpha = (this.animationTime % 200 < 100) ? 0.2 : 0.4;
            } else if (state.hero.magic < state.hero.maxMagic / 2) {
                context.globalAlpha = 0.7 * 2 * state.hero.magic / state.hero.maxMagic;
            }
            drawFrameAt(context, frame, { x: hero.x, y: hero.y });
        context.restore();
        if (hero.pickUpTile) {
            renderCarriedTile(context, state, hero);
        }
    }
    takeDamage(state: GameState, damage: number): boolean {
        // Astral projection damage is applied to the magic meter at 5x effectiveness.
        state.hero.magic -= Math.max(10, damage * 5);
        // Astral projection has fewer invulnerability frames since it can't be killed
        // and magic regenerates automatically.
        this.invulnerableFrames = 20;
        return true;
    }
}
