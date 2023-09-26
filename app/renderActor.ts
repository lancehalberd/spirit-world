import { EXPLOSION_RADIUS, EXPLOSION_TIME, FRAME_LENGTH } from 'app/gameConstants';
import { getCloneMovementDeltas } from 'app/userInput';
import { isHeroFloating, isHeroSinking } from 'app/utils/actor';
import { createAnimation, drawFrame, drawFrameAt, getFrame } from 'app/utils/animations';
import { carryMap, directionMap, getDirection } from 'app/utils/direction';

import {
    heroAnimations,
    heroChargeBowAnimations,
    heroChargeChakramAnimations,
    heroShallowAnimations,
    heroCarryAnimations,
    heroSwimAnimations,
    heroUnderwaterAnimations,
    Y_OFF,
} from 'app/render/heroAnimations';

const shallowGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16 + Y_OFF, w: 16, h: 16}};
export const shadowFrame: Frame = createAnimation('gfx/shadow.png', { w: 16, h: 16 }).frames[0];
export const smallShadowFrame: Frame = createAnimation('gfx/smallshadow.png', { w: 16, h: 16 }).frames[0];
export const wadingAnimation = createAnimation('gfx/shallowloop.png', shallowGeometry, {cols: 3, duration: 10});

const cloakGeometry: FrameDimensions = {w: 32, h: 32, content: {x: 3, y: 5, w: 26, h: 26}};
export const spiritBarrierStartAnimation = createAnimation('gfx/effects/cloak.png', cloakGeometry, {x: 0, cols: 1, duration: 5});
export const spiritBarrierAnimation = createAnimation('gfx/effects/cloak.png', cloakGeometry, {x: 1, cols: 6, duration: 5});
export const spiritBarrierSmallCracksAnimation = createAnimation('gfx/effects/cloak.png', cloakGeometry, {x: 7, cols: 6, duration: 5});
export const spiritBarrierMediumCracksAnimation = createAnimation('gfx/effects/cloak.png', cloakGeometry, {x: 13, cols: 6, duration: 5});
export const spiritBarrierLargeCracksAnimation = createAnimation('gfx/effects/cloak.png', cloakGeometry, {x: 19, cols: 6, duration: 5});
export const spiritBarrierBreakingAnimation = createAnimation('gfx/effects/cloak.png', cloakGeometry, {x: 25, cols: 4, duration: 5}, { loop: false });

let lastPullAnimation = null;
export function getHeroFrame(state: GameState, hero: Hero): Frame {
    let animations: ActorAnimations['idle'];
    if (state.defeatState.defeated) {
        if (state.defeatState.reviving) {
            animations = state.defeatState.time >= 3000 ? heroAnimations.kneel : heroAnimations.death;
        } else {
            animations = state.defeatState.time >= 1000 ? heroAnimations.death : heroAnimations.kneel;
        }
        return getFrame(animations[hero.d], hero.animationTime);
    }
    if (state.transitionState?.type === 'surfacing' || state.transitionState?.type === 'diving') {
        animations = heroSwimAnimations.idle;
        return getFrame(animations[hero.d], hero.animationTime);
    }
    if (hero.toolOnCooldown === 'cloak') {
        animations = heroAnimations.cloak;
        return getFrame(animations[hero.d], hero.animationTime);
    }
    const holdingObject = hero.pickUpTile || hero.pickUpObject;
    if (holdingObject) {
        const grabAnimation = heroCarryAnimations.grab[hero.d];
        const grabAnimationTime = hero.pickUpFrame * 20;
        if (grabAnimationTime < grabAnimation.duration) {
            return getFrame(grabAnimation, grabAnimationTime);
        }
        if (hero.action === 'walking') {
            return getFrame(heroCarryAnimations.move[hero.d], hero.animationTime);
        }
        return getFrame(heroCarryAnimations.idle[hero.d], hero.animationTime);
    }
    if (hero.explosionTime > 0 && hero.action !== 'thrown' && hero.action !== 'falling') {
        if (hero.isUncontrollable) {
            return getFrame(heroAnimations.kneel[hero.d], hero.animationTime);
        }
        return getFrame(heroAnimations.kneel.down, hero.animationTime);
    }
    switch (hero.action) {
        case 'usingStaff':
            const jumpAnimation = heroAnimations.staffJump[hero.d];
            if (hero.animationTime < jumpAnimation.duration) {
                return getFrame(jumpAnimation, hero.animationTime);
            }
            const slamAnimation = heroAnimations.staffSlam[hero.d];
            return getFrame(slamAnimation, hero.animationTime - jumpAnimation.duration);
        case 'falling':
        case 'sinkingInLava':
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
            } else if (kdx || kdy) {
                lastPullAnimation = hero.wading ? heroShallowAnimations.push : heroAnimations.push;
                return getFrame(lastPullAnimation[hero.d], hero.animationTime);
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
                animations =  heroUnderwaterAnimations.idle;
            } else  if (isHeroSinking(state, hero)) {
                animations =  heroUnderwaterAnimations.idle;
            } else if (hero.swimming) {
                animations = heroSwimAnimations.move;
            } else {
                animations = hero.wading ? heroShallowAnimations.move : heroAnimations.move;
            }
            break;
        case 'knockedHard':
        case 'knocked':
            animations = heroAnimations.hurt;
            break;
        case 'beingCarried':
        case 'thrown':
        case 'jumpingDown':
        case 'preparingSomersault':
        case 'roll':
            animations = heroAnimations.roll;
            break;
        case 'climbing':
            return getFrame(heroAnimations.climbing.up, hero.animationTime);
        case 'charging':
            const isChargingBow = (hero.chargingRightTool && hero.savedData.rightTool === 'bow')
                || (hero.chargingLeftTool && hero.savedData.leftTool === 'bow');
            const animationSet = isChargingBow ? heroChargeBowAnimations : heroChargeChakramAnimations;
            let direction = hero.d;
            if (!isChargingBow) {
                if (hero.heldChakram) {
                    direction = getDirection(hero.heldChakram.vx, hero.heldChakram.vy, true, hero.d);
                }
            } else {
                direction = getDirection(hero.actionDx, hero.actionDy, true, hero.d);
            }
            if (hero.vx || hero.vy) {
                return getFrame(animationSet.move[direction], hero.animationTime);
            } else {
                return getFrame(animationSet.idle[direction], hero.animationTime);
            }
        case 'attack':
            animations = hero.wading ? heroShallowAnimations.attack : heroAnimations.attack;
            break;
        default:
            if (isHeroFloating(state, hero)) {
                animations =  heroUnderwaterAnimations.idle;
            } else if (isHeroSinking(state, hero)) {
                animations =  heroUnderwaterAnimations.idle;
            } else if (hero.swimming) {
                animations = heroSwimAnimations.idle;
            } else {
                if (hero.life < 1) {
                    animations = heroAnimations.kneel;
                } else {
                    animations = hero.wading ? heroShallowAnimations.idle : heroAnimations.idle;
                }
            }
    }
    return getFrame(animations[hero.d], hero.animationTime);
}

export function renderHeroBarrier(context: CanvasRenderingContext2D, state: GameState, hero: Hero): void {
    // Don't render the shield when the full player sprite isn't rendered.
    if (hero.action === 'falling' || hero.action === 'sinkingInLava') {
        return;
    }
    let frame = getFrame(spiritBarrierAnimation, state.fieldTime);
    //if (hero.invulnerableFrames) {
    //    context.globalAlpha *= (0.7 + 0.3 * Math.cos(2 * Math.PI * hero.invulnerableFrames * 3 / 50));
    //}
    const isChargingBurst = (hero.chargingLeftTool && hero.savedData.leftTool === 'cloak')
        || (hero.chargingRightTool && hero.savedData.rightTool === 'cloak');
    if (state.hero.magic < 10 || (isChargingBurst && state.hero.chargeTime >= 300)) {
        frame = getFrame(spiritBarrierLargeCracksAnimation, state.fieldTime);
    } else if (state.hero.magic < 15 || state.hero.magic < state.hero.maxMagic * 0.2
        || (isChargingBurst && state.hero.chargeTime >= 100)
    ) {
        frame = getFrame(spiritBarrierMediumCracksAnimation, state.fieldTime);
    } else if (state.hero.magic < 20 || state.hero.magic < state.hero.maxMagic * 0.4
        || isChargingBurst
    ) {
        frame = getFrame(spiritBarrierSmallCracksAnimation, state.fieldTime);
    }
    if (hero.toolOnCooldown === 'cloak') {
        // Render nothing while the hero is throwing the cape.
        if (hero.toolCooldown > 40) {
            return;
        }
        // This is only a single frame currently, we would need to set the animation time correctly
        // if we want to add multiple frames later.
        frame = getFrame(spiritBarrierStartAnimation, 0);
    }
    drawFrameAt(context, frame, {x: hero.x - 5, y: hero.y - hero.z - 10});
}

export function renderHeroEyes(context: CanvasRenderingContext2D, state: GameState, hero: Hero) {
    const frame = heroAnimations.idle.down.frames[0];
    let xOffset = 4, yOffset = 11;
    let eyeFrame = {...frame, x: frame.x + xOffset, y: frame.y + yOffset, w: 3, h: 2};
    drawFrame(context, eyeFrame, {
        x: hero.x - eyeFrame.content.x + xOffset,
        y: hero.y - eyeFrame.content.y + yOffset - hero.z,
        w: eyeFrame.w,
        h: eyeFrame.h,
    });
    // Until we get new graphics for this, just color the irises light blue for contrast.
    context.fillStyle = '#0CF';
    context.fillRect((hero.x - eyeFrame.content.x + xOffset + 1) | 0, (hero.y - eyeFrame.content.y + yOffset - hero.z) | 0, 1, 2);
    /*context.fillStyle = '#08D';
    context.fillRect(hero.x - eyeFrame.content.x + xOffset, hero.y - eyeFrame.content.y + yOffset - hero.z, 1, 1);
    context.fillStyle = '#0CF';
    context.fillRect(hero.x - eyeFrame.content.x + xOffset, hero.y - eyeFrame.content.y + yOffset - hero.z + 1, 1, 1);*/
    xOffset = 11;
    eyeFrame = {...frame, x: frame.x + xOffset, y: frame.y + 11, w: 3, h: 2};
    drawFrame(context, eyeFrame, {
        x: hero.x - eyeFrame.content.x + xOffset,
        y: hero.y - eyeFrame.content.y + yOffset - hero.z,
        w: eyeFrame.w,
        h: eyeFrame.h,
    });
    context.fillRect((hero.x - eyeFrame.content.x + xOffset + 1) | 0, (hero.y - eyeFrame.content.y + yOffset - hero.z) | 0, 1, 2);
    /*context.fillStyle = '#08D';
    context.fillRect(hero.x - eyeFrame.content.x + xOffset + 2, hero.y - eyeFrame.content.y + yOffset - hero.z, 1, 1);
    context.fillStyle = '#0CF';
    context.fillRect(hero.x - eyeFrame.content.x + xOffset + 2, hero.y - eyeFrame.content.y + yOffset - hero.z + 1, 1, 1);*/
}

export function renderCarriedTile(context: CanvasRenderingContext2D, state: GameState, actor: Actor): void {
    const offset = carryMap[actor.d][Math.min(actor.pickUpFrame, carryMap[actor.d].length - 1)];
    const frame = actor.pickUpTile.frame;
    let yBounce = 0;
    const grabAnimation = heroCarryAnimations.grab[actor.d];
    if (actor.pickUpFrame >= grabAnimation.frames.length * grabAnimation.frameDuration && actor.action === 'walking') {
        // The arms of the MC are higher for 2 frames, then lower for 2 frames, etc.
        const bounceDuration = 2 * heroCarryAnimations.move.up.frameDuration * FRAME_LENGTH;
        const frameIndex = (actor.animationTime / bounceDuration) | 0;
        if (frameIndex % 2 === 1) {
            yBounce += 1;
        }
    }
    drawFrame(context, frame,
        { x: actor.x + offset.x, y: actor.y + offset.y + yBounce, w: frame.w, h: frame.h });
}


export function renderHeroShadow(this: void, context: CanvasRenderingContext2D, state: GameState, hero: Hero, forceDraw: boolean = false): void {
   /* if (hero.isOverClouds && hero.action === 'falling' && hero.animationTime < cloudPoofAnimation.frameDuration * FRAME_LENGTH) {
        const frame = getFrame(cloudPoofAnimation, hero.animationTime);
        drawFrameAt(context, frame, { x: hero.x, y: hero.y - hero.z });
        return;
    }*/

    if (hero.wading && !hero.swimming) {
        const frame = getFrame(wadingAnimation, hero.animationTime);
        drawFrameAt(context, frame, { x: hero.x, y: hero.y - hero.z });
        return;
    }

    if (!forceDraw && (
        hero.action === 'fallen' || hero.action === 'falling'
        || hero.action === 'sinkingInLava'  || hero.action === 'sankInLava'
        || hero.action === 'climbing'
        || hero.swimming || hero.wading
    )) {
        return;
    }
    const frame = (hero.z >= hero.groundHeight + 4) ? smallShadowFrame : shadowFrame;
    drawFrame(context, frame, { ...frame, x: hero.x, y: hero.y - 3 - Y_OFF - hero.groundHeight });
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
        context.globalAlpha *= 0.4;
        context.beginPath();
        context.arc(hero.x + hero.w / 2, hero.y + hero.h / 2, r, 0, 2 * Math.PI);
        context.fillStyle = 'red';
        context.fill();
    context.restore();
}

export function renderEnemyShadow(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
    const frame = enemy.z >= 4 ? smallShadowFrame : shadowFrame;
    const hitbox = enemy.getHitbox(state);
    const shadowScale = Math.round(hitbox.w / shadowFrame.w);
    const target = {
        x: hitbox.x + (hitbox.w - frame.w * shadowScale) / 2,
        y: hitbox.y + hitbox.h - frame.h * shadowScale + enemy.z, // - 3 * enemy.scale,
        w: frame.w * shadowScale,
        h: frame.h * shadowScale,
    };
    drawFrame(context, frame, target);
}
