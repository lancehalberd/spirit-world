import { EXPLOSION_RADIUS, EXPLOSION_TIME } from 'app/gameConstants';
import { getCloneMovementDeltas } from 'app/keyCommands';
import { isHeroFloating, isHeroSinking } from 'app/utils/actor';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { carryMap, directionMap, getDirection } from 'app/utils/field';

import { Actor, ActorAnimations, Enemy, Frame, GameState, Hero } from 'app/types';

import {
    heroAnimations,
    heroChargeAnimations,
    heroShallowAnimations,
    heroSwimAnimations,
    Y_OFF,
} from 'app/render/heroAnimations';


export const shadowFrame: Frame = createAnimation('gfx/shadow.png', { w: 16, h: 16 }).frames[0];
export const smallShadowFrame: Frame = createAnimation('gfx/smallshadow.png', { w: 16, h: 16 }).frames[0];

let lastPullAnimation = null;
export function getHeroFrame(state: GameState, hero: Hero): Frame {
    let animations: ActorAnimations['idle'];
    if (state.transitionState?.type === 'surfacing' || state.transitionState?.type === 'diving') {
        animations = heroSwimAnimations.idle;
        return getFrame(animations[hero.d], hero.animationTime);
    }
    switch (hero.action) {
        case 'falling':
            animations = heroAnimations.falling;
            break;
        // Grabbing currently covers animations for pulling/pushing objects that are grabbed.
        case 'grabbing':
            const [dx, dy] = directionMap[hero.d];
            const oppositeDirection = getDirection(-dx, -dy);
            const [kdx, kdy] = getCloneMovementDeltas(state, hero);
            if (hero.grabObject?.pullingHeroDirection === oppositeDirection) {
                lastPullAnimation = hero.wading ? heroShallowAnimations.pull : heroAnimations.pull;
                return getFrame(lastPullAnimation[hero.d], hero.animationTime);
            } else if (hero.grabObject?.pullingHeroDirection) {
                lastPullAnimation = hero.wading ? heroShallowAnimations.push : heroAnimations.push;
                return getFrame(lastPullAnimation[hero.d], hero.animationTime);
            } else if (kdx * dx < 0 || kdy * dy < 0) {
                // If the player is not moving but pulling away from the direction they are grabbing,
                // show the pull animation to suggest the player is *trying* to pull the object they
                // are grabbing even though it won't move.
                animations = hero.wading ? heroShallowAnimations.pull : heroAnimations.pull;
                return getFrame(animations[hero.d], hero.animationTime);
            }
            // If the player continously pushes/pulls there is one frame that isn't set correctly,
            // so we use this to play that last animation for an extra frame.
            if (lastPullAnimation) {
                const frame = getFrame(lastPullAnimation[hero.d], hero.animationTime);
                lastPullAnimation = null;
                return frame;
            }
            animations = hero.wading ? heroShallowAnimations.grab : heroAnimations.grab;
            break;
        case 'meditating':
            return getFrame(hero.wading ? heroShallowAnimations.idle.down : heroAnimations.idle.down, hero.animationTime);
        case 'pushing':
            animations = hero.wading ? heroShallowAnimations.push : heroAnimations.push;
            break;
        case 'walking':
            if (isHeroFloating(state, hero)) {
                return heroAnimations.roll[hero.d].frames[0];
            }
            if (isHeroSinking(state, hero)) {
                return heroAnimations.idle[hero.d].frames[0];
            }
            if (hero.swimming) {
                animations = heroSwimAnimations.move;
            } else {
                animations = hero.wading ? heroShallowAnimations.move : heroAnimations.move;
            }
            break;
        case 'knocked':
            animations = heroAnimations.hurt;
            break;
        case 'beingCarried':
        case 'thrown':
        case 'jumpingDown':
        case 'roll':
            animations = heroAnimations.roll;
            break;
        case 'climbing':
            return getFrame(heroAnimations.climbing.up, hero.animationTime);
        case 'charging':
            if (hero.vx || hero.vy) {
                return getFrame(heroChargeAnimations.move[hero.d], hero.animationTime);
            } else {
                return getFrame(heroChargeAnimations.idle[hero.d], hero.animationTime);
            }
            return hero.wading ? heroShallowAnimations.attack[hero.d].frames[0] : heroAnimations.attack[hero.d].frames[0];
        case 'attack':
            animations = hero.wading ? heroShallowAnimations.attack : heroAnimations.attack;
            break;
        default:
            if (isHeroFloating(state, hero)) {
                return heroAnimations.roll[hero.d].frames[0];
            }
            if (isHeroSinking(state, hero)) {
                return heroAnimations.idle[hero.d].frames[0];
            }
            if (hero.swimming) {
                animations = heroSwimAnimations.idle;
            } else {
                animations = hero.wading ? heroShallowAnimations.idle : heroAnimations.idle;
            }
    }
    return getFrame(animations[hero.d], hero.animationTime);
}

export function renderHeroBarrier(context: CanvasRenderingContext2D, state: GameState, hero: Hero): void {
    // Don't render the shield when the full player sprite isn't rendered.
    if (hero.action === 'falling') {
        return;
    }
    context.save();
        if (hero.invulnerableFrames) {
            context.globalAlpha *= (0.7 + 0.3 * Math.cos(2 * Math.PI * hero.invulnerableFrames * 3 / 50));
        }
        context.beginPath();
        context.arc(hero.x + hero.w / 2, hero.y + hero.h / 2 - hero.z, 8, 0 , 2 * Math.PI);
        context.save();
            context.fillStyle = '#0088FF';
            context.globalAlpha *= 0.4 + 0.1 * Math.sin(state.time / 200);
            context.fill();
        context.restore();
        context.strokeStyle = '#00FFFF';
        context.stroke();
    context.restore();
}

export function renderHeroEyes(context: CanvasRenderingContext2D, state: GameState, hero: Hero) {
    const frame = getHeroFrame(state, hero);
    // This only works since we force this to be the idle down frame.
    /*const eyesFrame = {...frame, x: 3, y: 10, w: 12, h: 3};
    drawFrame(context, eyesFrame, {
        x: hero.x - eyesFrame.content.x + eyesFrame.x,
        y: hero.y - eyesFrame.content.y + eyesFrame.y - hero.z,
        w: eyesFrame.w,
        h: eyesFrame.h,
    });*/
    let eyeFrame = {...frame, x: 4, y: 11, w: 3, h: 2};
    drawFrame(context, eyeFrame, {
        x: hero.x - eyeFrame.content.x + eyeFrame.x,
        y: hero.y - eyeFrame.content.y + eyeFrame.y - hero.z,
        w: eyeFrame.w,
        h: eyeFrame.h,
    });
    eyeFrame = {...frame, x: 11, y: 11, w: 3, h: 2};
    drawFrame(context, eyeFrame, {
        x: hero.x - eyeFrame.content.x + eyeFrame.x,
        y: hero.y - eyeFrame.content.y + eyeFrame.y - hero.z,
        w: eyeFrame.w,
        h: eyeFrame.h,
    });
}

export function renderCarriedTile(context: CanvasRenderingContext2D, state: GameState, actor: Actor): void {
    const offset = carryMap[actor.d][Math.min(actor.pickUpFrame, carryMap[actor.d].length - 1)];
    const frame = actor.pickUpTile.frame;
    drawFrame(context, frame,
        { x: actor.x + offset.x, y: actor.y + offset.y, w: frame.w, h: frame.h });
}


export function renderHeroShadow(context: CanvasRenderingContext2D, state: GameState, hero: Hero, forceDraw: boolean = false): void {
    if (!forceDraw && (
        hero.action === 'fallen' || hero.action === 'falling' || hero.action === 'climbing' || hero.swimming || hero.wading
    )) {
        return;
    }
    const frame = hero.z >= 4 ? smallShadowFrame : shadowFrame;
    drawFrame(context, frame, { ...frame, x: hero.x, y: hero.y - 3 - Y_OFF });
}
export function renderExplosionRing(context: CanvasRenderingContext2D, state: GameState, hero: Hero): void {
    if (!(hero.explosionTime > 0)) {
        return;
    }
    const maxR = EXPLOSION_RADIUS;
    const r = maxR * hero.explosionTime / EXPLOSION_TIME;
    context.beginPath();
    // Alternate value: hero.y + hero.h / 2 - 3 - Y_OFF (based on shadow position)
    context.arc(hero.x + hero.w / 2, hero.y + hero.h / 2, maxR, 0, 2 * Math.PI);
    context.strokeStyle = 'red';
    context.stroke();
    context.save();
        context.globalAlpha *= (hero.explosionTime / EXPLOSION_TIME);
        context.beginPath();
        context.arc(hero.x + hero.w / 2, hero.y + hero.h / 2, r, 0, 2 * Math.PI);
        context.fillStyle = 'red';
        context.fill();
    context.restore();
}

export function renderEnemyShadow(context: CanvasRenderingContext2D, state: GameState, object: Enemy): void {
    const frame = object.z >= 4 ? smallShadowFrame : shadowFrame;
    drawFrame(context, frame, { ...frame,
        x: object.x + (object.w - shadowFrame.w) * object.scale / 2,
        y: object.y - 3 * object.scale,
        w: frame.w * object.scale,
        h: frame.h * object.scale,
    });
}
