import { mainContext } from 'app/dom';
import { getTileFrame } from 'app/render';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';

import { Actor, ActorAnimations, FrameAnimation, FrameDimensions, GameState } from 'app/types';

const heroGeometry: FrameDimensions = {w: 18, h: 26, content: {x: 1, y: 10, w: 16, h: 16}};
const upAnimation: FrameAnimation = createAnimation('gfx/facing.png', heroGeometry, { cols: 1, x: 2});
const downAnimation: FrameAnimation = createAnimation('gfx/facing.png', heroGeometry, { cols: 1, x: 0});
const leftAnimation: FrameAnimation = createAnimation('gfx/facing.png', heroGeometry, { cols: 1, x: 3});
const rightAnimation: FrameAnimation = createAnimation('gfx/facing.png', heroGeometry, { cols: 1, x: 1});
const heroAnimations: ActorAnimations = {
    idle: {
        up: upAnimation,
        down: downAnimation,
        left: leftAnimation,
        right: rightAnimation,
    },
};

export function renderActor(context: CanvasRenderingContext2D, state: GameState, actor: Actor): void {
    const frame = getFrame(heroAnimations.idle[actor.d], 0);
    mainContext.save();
        if (actor.invulnerableFrames) {
            mainContext.globalAlpha = 0.7 + 0.3 * Math.cos(2 * Math.PI * actor.invulnerableFrames * 3 / 50);
        }
        if (state.hero.action === 'roll' && state.hero.actionFrame) {
            drawFrame(mainContext, frame, { x: actor.x - frame.content.x, y: actor.y - frame.content.y - 2 - actor.z, w: frame.w, h: frame.h });
        } else {
            drawFrame(mainContext, frame, { x: actor.x - frame.content.x, y: actor.y - frame.content.y - actor.z, w: frame.w, h: frame.h });
        }
    mainContext.restore();
    if (actor.pickUpTile) {
        renderCarriedTile(context, state, actor);
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