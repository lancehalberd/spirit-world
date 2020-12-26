import { mainContext } from 'app/dom';
import { getTileFrame } from 'app/render';
import { createAnimation, drawFrame } from 'app/utils/animations';

import { Actor, Frame, GameState } from 'app/types';

const [mapTilesFrame] = createAnimation('gfx/tiles/overworld.png', {w: 384, h: 640}, {cols: 5}).frames;

const heroFrame: Frame = { image: mapTilesFrame.image, x: 48, y: 560, w: 16, h: 16};

export function renderActor(context: CanvasRenderingContext2D, state: GameState, actor: Actor): void {
    drawFrame(mainContext, heroFrame, { x: actor.x, y: actor.y, w: heroFrame.w, h: heroFrame.h });
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