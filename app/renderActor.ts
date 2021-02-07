import _ from 'lodash';

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

const attackingGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16, w: 16, h: 16}};
const attackUpAnimation: FrameAnimation = createAnimation('gfx/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 2, duration: 3}, {loop: false});
const attackDownAnimation: FrameAnimation = createAnimation('gfx/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 0, duration: 3}, {loop: false});
const attackLeftAnimation: FrameAnimation = createAnimation('gfx/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 3, duration: 3}, {loop: false});
const attackRightAnimation: FrameAnimation = createAnimation('gfx/mcchakramthrow.png', attackingGeometry, { cols: 4, x: 1, y: 1, duration: 3}, {loop: false});

const rollGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 16, w: 16, h: 16}};
const rollUpAnimation: FrameAnimation = createAnimation('gfx/mcroll.png', rollGeometry, { cols: 4, x: 1, y: 2, duration: 4}, {loop: false});
const rollDownAnimation: FrameAnimation = createAnimation('gfx/mcroll.png', rollGeometry, { cols: 4, x: 1, y: 0, duration: 4}, {loop: false});
const rollLeftAnimation: FrameAnimation = createAnimation('gfx/mcroll.png', rollGeometry, { cols: 4, x: 1, y: 3, duration: 4}, {loop: false});
const rollRightAnimation: FrameAnimation = createAnimation('gfx/mcroll.png', rollGeometry, { cols: 4, x: 1, y: 1, duration: 4}, {loop: false});



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
    attack: {
        up: attackUpAnimation,
        down: attackDownAnimation,
        left: attackLeftAnimation,
        right: attackRightAnimation,
    },
    roll: {
        up: rollUpAnimation,
        down: rollDownAnimation,
        left: rollLeftAnimation,
        right: rollRightAnimation,
    }
};


const shadowFrame: Frame = createAnimation('gfx/shadow.png', { w: 16, h: 16 }).frames[0];

function getHeroFrame(state: GameState, hero: Hero): Frame {
    let animations: ActorAnimations['idle'];
    switch (hero.action) {
        case 'meditating':
            return getFrame(heroAnimations.idle.down, hero.animationTime);
        case 'walking':
        case 'pushing':
            animations = heroAnimations.move;
            break;
        case 'roll':
            animations = heroAnimations.roll;
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
            // context.globalAlpha = 0.6;
        } else if (hero.invulnerableFrames) {
            context.globalAlpha = 0.7 + 0.3 * Math.cos(2 * Math.PI * hero.invulnerableFrames * 3 / 50);
        }
        if (hero.action === 'falling') {
            const fallingFrame = {...frame, h: frame.h - hero.actionFrame * 2};
            drawFrame(context, fallingFrame, {
                x: hero.x - frame.content.x,
                y: hero.y - frame.content.y - hero.z + hero.actionFrame * 2,
                w: fallingFrame.w,
                h: fallingFrame.h,
            });
        } else {
            drawFrame(context, frame, { x: hero.x - frame.content.x, y: hero.y - frame.content.y - hero.z, w: frame.w, h: frame.h });
        }
    context.restore();
    if (hero.pickUpTile) {
        renderCarriedTile(context, state, hero);
    }
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
    drawFrame(context, frame,
        { x: actor.x + offset.x, y: actor.y + offset.y, w: frame.w, h: frame.h });
}


export function renderHeroShadow(context: CanvasRenderingContext2D, state: GameState, hero: Hero): void {
    if (hero.action === 'fallen' || hero.action === 'falling') {
        return;
    }
    drawFrame(context, shadowFrame, { ...shadowFrame, x: hero.x, y: hero.y - 3 });
}

export function renderShadow(context: CanvasRenderingContext2D, state: GameState, object: ObjectInstance): void {
    drawFrame(context, shadowFrame, { ...shadowFrame, x: object.x, y: object.y - 3 });
}
