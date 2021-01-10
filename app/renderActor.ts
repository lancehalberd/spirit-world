import { mainContext } from 'app/dom';
import { getTileFrame } from 'app/render';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';

import { Actor, ActorAnimations, Frame, FrameAnimation, FrameDimensions, GameState, Hero, ObjectInstance } from 'app/types';

const heroGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 15, w: 16, h: 16}};
const upAnimation: FrameAnimation = createAnimation('gfx/facing.png', heroGeometry, { cols: 1, x: 2});
const downAnimation: FrameAnimation = createAnimation('gfx/facing.png', heroGeometry, { cols: 1, x: 0});
const leftAnimation: FrameAnimation = createAnimation('gfx/facing.png', heroGeometry, { cols: 1, x: 3});
const rightAnimation: FrameAnimation = createAnimation('gfx/facing.png', heroGeometry, { cols: 1, x: 1});
export const heroAnimations: ActorAnimations = {
    idle: {
        up: upAnimation,
        down: downAnimation,
        left: leftAnimation,
        right: rightAnimation,
    },
};

const shadowFrame: Frame = createAnimation('gfx/shadow.png', { w: 16, h: 16 }).frames[0];

export function renderHero(this: Hero, context: CanvasRenderingContext2D, state: GameState): void {
    const hero = this;
    if (state.hero.invisible) {
        return;
    }
    const frame = getFrame(heroAnimations.idle[hero.d], 0);
    const activeClone = state.hero.activeClone || state.hero;
    mainContext.save();
        if (hero !== activeClone) {
            // mainContext.globalAlpha = 0.6;
        } else if (hero.invulnerableFrames) {
            mainContext.globalAlpha = 0.7 + 0.3 * Math.cos(2 * Math.PI * hero.invulnerableFrames * 3 / 50);
        }
        if (hero.action === 'roll' && hero.actionFrame) {
            drawFrame(mainContext, frame, { x: hero.x - frame.content.x, y: hero.y - frame.content.y - 2 - hero.z, w: frame.w, h: frame.h });
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
    const palette = state.areaInstance.palette;
    const offset = carryMap[actor.d][Math.min(actor.pickUpFrame, carryMap[actor.d].length - 1)];
    drawFrame(mainContext, getTileFrame(palette, actor.pickUpTile),
        { x: actor.x + offset.x, y: actor.y+ offset.y, w: palette.w, h: palette.h });
}


export function renderHeroShadow(context: CanvasRenderingContext2D, state: GameState, hero: Hero): void {
    drawFrame(mainContext, shadowFrame, { ...shadowFrame, x: hero.x, y: hero.y - 3 });
}

export function renderShadow(context: CanvasRenderingContext2D, state: GameState, object: ObjectInstance): void {
    drawFrame(mainContext, shadowFrame, { ...shadowFrame, x: object.x, y: object.y - 3 });
}
