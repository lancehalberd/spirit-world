import _ from 'lodash';

import { mainContext } from 'app/dom';
import { getTileFrame } from 'app/render';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';

import { Actor, ActorAnimations, Frame, FrameAnimation, FrameDimensions, GameState, Hero, ObjectInstance } from 'app/types';

const heroGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 15, w: 16, h: 16}};
const upAnimation: FrameAnimation = createAnimation('gfx/facing.png', heroGeometry, { x: 2});
const downAnimation: FrameAnimation = createAnimation('gfx/facing.png', heroGeometry, { x: 0});
const leftAnimation: FrameAnimation = createAnimation('gfx/facing.png', heroGeometry, { x: 3});
const rightAnimation: FrameAnimation = createAnimation('gfx/facing.png', heroGeometry, { x: 1});

const walkingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16, w: 16, h: 16}};
const walkUpAnimation: FrameAnimation = createAnimation('gfx/mcwalking.png', walkingGeometry, { cols: 8, y: 2, duration: 4});
const walkDownAnimation: FrameAnimation = createAnimation('gfx/mcwalking.png', walkingGeometry, { cols: 8, y: 0, duration: 4});
const walkLeftAnimation: FrameAnimation = createAnimation('gfx/mcwalking.png', walkingGeometry, { cols: 8, y: 3, duration: 4});
const walkRightAnimation: FrameAnimation = createAnimation('gfx/mcwalking.png', walkingGeometry, { cols: 8, y: 1, duration: 4});

export const heroAnimations: ActorAnimations = {
    idle: {
        up: upAnimation,
        down: downAnimation,
        left: leftAnimation,
        right: rightAnimation,
    },
    move: {
        up: walkUpAnimation,
        down: walkDownAnimation,
        left: walkLeftAnimation,
        right: walkRightAnimation,
    },
};


const shadowFrame: Frame = createAnimation('gfx/shadow.png', { w: 16, h: 16 }).frames[0];

export function renderHero(this: Hero, context: CanvasRenderingContext2D, state: GameState): void {
    const hero = this;
    if (state.hero.invisible || hero.action === 'fallen') {
        return;
    }
    const animations = (
            hero.action === 'walking' || hero.action === 'pushing' || hero.action === 'roll'
        )
        ? heroAnimations.move
        : heroAnimations.idle;
    const frame = getFrame(animations[hero.d], hero.animationTime);
    const activeClone = state.hero.activeClone || state.hero;
    mainContext.save();
        if (hero !== activeClone) {
            // mainContext.globalAlpha = 0.6;
        } else if (hero.invulnerableFrames) {
            mainContext.globalAlpha = 0.7 + 0.3 * Math.cos(2 * Math.PI * hero.invulnerableFrames * 3 / 50);
        }
        if (hero.action === 'roll' && hero.actionFrame) {
            drawFrame(mainContext, frame, { x: hero.x - frame.content.x, y: hero.y - frame.content.y - 2 - hero.z, w: frame.w, h: frame.h });
        } else if (hero.action === 'falling') {
            const fallingFrame = {...frame, h: frame.h - hero.actionFrame * 2};
            drawFrame(mainContext, fallingFrame, {
                x: hero.x - frame.content.x,
                y: hero.y - frame.content.y - hero.z + hero.actionFrame * 2,
                w: fallingFrame.w,
                h: fallingFrame.h,
            });
        } else {
            drawFrame(mainContext, frame, { x: hero.x - frame.content.x, y: hero.y - frame.content.y - hero.z, w: frame.w, h: frame.h });
        }
    mainContext.restore();
    if (hero.pickUpTile) {
        renderCarriedTile(context, state, hero);
    }
}

// 15, 4, 4,
const carryMap = {
    'right': [{x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 9, y: -13}, {x: 7, y: -16}, {x: 0, y: -17}],
    'left': [{x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -9, y: -13}, {x: -7, y: -16}, {x: 0, y: -17}],
    'down': [{x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: -4}, {x: 0, y: -9}, {x: 0, y: -17}],
    'up': [{x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -16}, {x: 0, y: -17}, {x: 0, y: -17}],
};
export function renderCarriedTile(context: CanvasRenderingContext2D, state: GameState, actor: Actor): void {
    const offset = carryMap[actor.d][Math.min(actor.pickUpFrame, carryMap[actor.d].length - 1)];
    const frame = getTileFrame(state.areaInstance, actor.pickUpTile);
    drawFrame(mainContext, frame,
        { x: actor.x + offset.x, y: actor.y + offset.y, w: frame.w, h: frame.h });
}


export function renderHeroShadow(context: CanvasRenderingContext2D, state: GameState, hero: Hero): void {
    if (hero.action === 'fallen' || hero.action === 'falling') {
        return;
    }
    drawFrame(mainContext, shadowFrame, { ...shadowFrame, x: hero.x, y: hero.y - 3 });
}

export function renderShadow(context: CanvasRenderingContext2D, state: GameState, object: ObjectInstance): void {
    drawFrame(mainContext, shadowFrame, { ...shadowFrame, x: object.x, y: object.y - 3 });
}
