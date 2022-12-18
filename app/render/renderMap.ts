import { getMapTarget } from 'app/content/hints';
import { isLogicValid, logicHash } from 'app/content/logic';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { heroIcon } from 'app/render/heroAnimations';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { pad } from 'app/utils/index';

import { GameState } from 'app/types';

const [
    sky00, sky10, sky20, ground00, ground10, ground20,
    sky01, sky11, sky21, ground01, ground11, ground21,
         , sky12, froze, ground02, ground12, ground22,
] = createAnimation('gfx/hud/overworld.png', {w: 64, h: 64}, {xSpace: 2, ySpace: 2, rows: 3, cols: 6}).frames;

const menuSlices = createAnimation('gfx/hud/menu9slice.png', {w: 8, h: 8}, {cols: 3, rows: 3}).frames;

const borderSize = 4;
const worldSize = 192;

export function renderMap(context: CanvasRenderingContext2D, state: GameState): void {
    const w = worldSize + 2 * borderSize;
    const h = worldSize + 2 * borderSize;
    let r = {
        x: (CANVAS_WIDTH - w ) / 2,
        y: (CANVAS_HEIGHT - h ) / 2,
        w, h,
    };

    drawFrame(context, menuSlices[0], {x: r.x, y: r.y, w: 8, h: 8});
    drawFrame(context, menuSlices[1], {x: r.x + 8, y: r.y, w: r.w - 16, h: 8});
    drawFrame(context, menuSlices[2], {x: r.x + r.w - 8, y: r.y, w: 8, h: 8});

    drawFrame(context, menuSlices[3], {x: r.x, y: r.y + 8, w: 8, h: r.h - 16});
    drawFrame(context, menuSlices[4], {x: r.x + 8, y: r.y + 8, w: r.w - 16, h: r.h - 16});
    drawFrame(context, menuSlices[5], {x: r.x + r.w - 8, y: r.y + 8, w: 8, h: r.h - 16});

    drawFrame(context, menuSlices[6], {x: r.x, y: r.y + r.h - 8, w: 8, h: 8});
    drawFrame(context, menuSlices[7], {x: r.x + 8, y: r.y + r.h - 8, w: r.w - 16, h: 8});
    drawFrame(context, menuSlices[8], {x: r.x + r.w - 8, y: r.y + r.h - 8, w: 8, h: 8});

    r = pad(r, -borderSize);

    drawFrame(context, ground00, {x: r.x, y: r.y, w: 64, h: 64});
    drawFrame(context, ground10, {x: r.x + 64, y: r.y, w: 64, h: 64});
    drawFrame(context, ground20, {x: r.x + 128, y: r.y, w: 64, h: 64});
    drawFrame(context, ground01, {x: r.x, y: r.y + 64, w: 64, h: 64});
    if (isLogicValid(state, logicHash.frozenLake)) {
        drawFrame(context, froze, {x: r.x + 64, y: r.y + 64, w: 64, h: 64});
    } else {
        drawFrame(context, ground11, {x: r.x + 64, y: r.y + 64, w: 64, h: 64});
    }
    drawFrame(context, ground21, {x: r.x + 128, y: r.y + 64, w: 64, h: 64});
    drawFrame(context, ground02, {x: r.x, y: r.y + 128, w: 64, h: 64});
    drawFrame(context, ground12, {x: r.x + 64, y: r.y + 128, w: 64, h: 64});
    drawFrame(context, ground22, {x: r.x + 128, y: r.y + 128, w: 64, h: 64});

    if (state.location.zoneKey === 'sky') {
        context.save();
            context.globalAlpha *= 0.5;
            context.fillStyle = '#0FF';
            context.fillRect(r.x, r.y, r.w, r.h);
        context.restore();
        drawFrame(context, sky00, {x: r.x, y: r.y, w: 64, h: 64});
        drawFrame(context, sky10, {x: r.x + 64, y: r.y, w: 64, h: 64});
        drawFrame(context, sky20, {x: r.x + 128, y: r.y, w: 64, h: 64});
        drawFrame(context, sky01, {x: r.x, y: r.y + 64, w: 64, h: 64});
        drawFrame(context, sky11, {x: r.x + 64, y: r.y + 64, w: 64, h: 64});
        drawFrame(context, sky21, {x: r.x + 128, y: r.y + 64, w: 64, h: 64});
        drawFrame(context, sky12, {x: r.x + 64, y: r.y + 128, w: 64, h: 64});
    }

    if (state.location.zoneKey === 'overworld' || state.location.zoneKey === 'sky' || state.location.zoneKey === 'underwater') {
        if (state.time % 1000 <= 600) {
            drawFrame(context, heroIcon, {
                ...heroIcon,
                x: r.x + (state.location.areaGridCoords.x * 64 + state.location.x / 8 - heroIcon.w / 2) | 0,
                y: r.y + (state.location.areaGridCoords.y * 64 + state.location.y / 8 - heroIcon.h / 2) | 0,
            });

            const target = getMapTarget(state);
            if (target) {
                context.strokeStyle = 'red';
                context.beginPath();
                const x = r.x + target.x, y = r.y + target.y;
                context.moveTo(x - 6, y - 6);
                context.lineTo(x + 6, y + 6);
                context.moveTo(x + 6, y - 6);
                context.lineTo(x - 6, y + 6);
                context.stroke();
            }
        }
    }
}
