import _ from 'lodash';

import { EXPLOSION_RADIUS, EXPLOSION_TIME } from 'app/gameConstants';
import { getCloneMovementDeltas } from 'app/keyCommands';
import { getTileFrame } from 'app/render';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { carryMap, directionMap, getDirection } from 'app/utils/field';

import { Actor, ActorAnimations, Enemy, Frame, GameState, Hero } from 'app/types';

import { heroAnimations, Y_OFF} from 'app/render/heroAnimations';


const shadowFrame: Frame = createAnimation('gfx/shadow.png', { w: 16, h: 16 }).frames[0];

let lastPullAnimation = null;
function getHeroFrame(state: GameState, hero: Hero): Frame {
    let animations: ActorAnimations['idle'];
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
                lastPullAnimation = heroAnimations.pull;
                return getFrame(lastPullAnimation[hero.d], hero.animationTime);
            } else if (hero.grabObject?.pullingHeroDirection) {
                lastPullAnimation = heroAnimations.push;
                return getFrame(lastPullAnimation[hero.d], hero.animationTime);
            } else if (kdx * dx < 0 || kdy * dy < 0) {
                // If the player is not moving but pulling away from the direction they are grabbing,
                // show the pull animation to suggest the player is *trying* to pull the object they
                // are grabbing even though it won't move.
                return getFrame(heroAnimations.pull[hero.d], hero.animationTime);
            }
            // If the player continously pushes/pulls there is one frame that isn't set correctly,
            // so we use this to play that last animation for an extra frame.
            if (lastPullAnimation) {
                const frame = getFrame(lastPullAnimation[hero.d], hero.animationTime);
                lastPullAnimation = null;
                return frame;
            }
            animations = heroAnimations.grab;
            break;
        case 'meditating':
            return getFrame(heroAnimations.idle.down, hero.animationTime);
        case 'pushing':
            animations = heroAnimations.push;
            break;
        case 'entering':
        case 'exiting':
        case 'swimming':
        case 'walking':
            if (hero.swimming) {
                animations = heroAnimations.wade;
            } else if (hero.wading) {
                animations = heroAnimations.wade;
            } else {
                animations = heroAnimations.move;
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
            return getFrame(heroAnimations.push.up, hero.animationTime);
            break;
        case 'attack':
            animations = heroAnimations.attack;
            break;
        default:
            animations = heroAnimations.idle;
    }
    return getFrame(animations[hero.d], hero.animationTime);
}

export function renderHero(this: Hero, context: CanvasRenderingContext2D, state: GameState): void {
    const hero = this;
    if (state.hero.invisible || hero.action === 'fallen') {
        return;
    }
    const frame = getHeroFrame(state, hero);
    const activeClone = state.hero.activeClone || state.hero;
    context.save();
        if (hero !== activeClone) {
            context.globalAlpha = 0.8;
        } else if (hero.invulnerableFrames) {
            context.globalAlpha = 0.7 + 0.3 * Math.cos(2 * Math.PI * hero.invulnerableFrames * 3 / 50);
        }
        if (hero.swimming || hero.action === 'swimming') {
            drawFrame(context, {...frame, h: 16}, { x: hero.x - frame.content.x, y: hero.y - frame.content.y - hero.z + frame.h - 22, w: frame.w, h: 16 });
        } else {
            drawFrame(context, frame, { x: hero.x - frame.content.x, y: hero.y - frame.content.y - hero.z, w: frame.w, h: frame.h });
        }
    context.restore();
    if (hero.pickUpTile) {
        renderCarriedTile(context, state, hero);
    }
    renderExplosionRing(context, state, hero);
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
    const frame = getTileFrame(state.areaInstance, actor.pickUpTile);
    drawFrame(context, frame,
        { x: actor.x + offset.x, y: actor.y + offset.y, w: frame.w, h: frame.h });
}


export function renderHeroShadow(context: CanvasRenderingContext2D, state: GameState, hero: Hero): void {
    if (hero.action === 'fallen' || hero.action === 'falling' || hero.action === 'swimming' || hero.swimming || hero.wading) {
        return;
    }
    drawFrame(context, shadowFrame, { ...shadowFrame, x: hero.x, y: hero.y - 3 - Y_OFF });
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
        context.globalAlpha = hero.explosionTime / EXPLOSION_TIME;
        context.beginPath();
        context.arc(hero.x + hero.w / 2, hero.y + hero.h / 2, r, 0, 2 * Math.PI);
        context.fillStyle = 'red';
        context.fill();
    context.restore();
}

export function renderEnemyShadow(context: CanvasRenderingContext2D, state: GameState, object: Enemy): void {
    drawFrame(context, shadowFrame, { ...shadowFrame,
        x: object.x + (object.w - shadowFrame.w) * object.scale / 2,
        y: object.y - 3 * object.scale,
        w: shadowFrame.w * object.scale,
        h: shadowFrame.h * object.scale,
    });
}
