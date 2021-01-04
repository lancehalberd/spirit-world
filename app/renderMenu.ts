import { lootFrames } from 'app/content/lootObject';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { drawFrame } from 'app/utils/animations';
import { fillRect, pad } from 'app/utils/index';

import { GameState, LootType } from 'app/types';

const MARGIN = 20;

export function renderMenu(context: CanvasRenderingContext2D, state: GameState): void {

    let r = {
        x: MARGIN,
        y: MARGIN,
        w: CANVAS_WIDTH - 2 * MARGIN,
        h: CANVAS_HEIGHT - 2 * MARGIN,
    };

    fillRect(context, r, 'white');
    fillRect(context, pad(r, -2), 'black');

    r = pad(r, -4);


    let x = r.x, y = r.y;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    function renderLoot(lootType: LootType, level: number): void {
        const frame = lootFrames[lootType];
        drawFrame(context, frame, {...frame, x: (x + 8 - frame.w / 2), y: (y + 8 - frame.h / 2)});
        context.fillStyle = 'white';
        context.fillText(`${level}`, x + 20, y + 8);
        x += 28;
        if (x + 24 >= r.x + r.w) {
            y += 20;
            x = r.x
        }
    }
    for (const toolMap of [state.hero.activeTools, state.hero.passiveTools, state.hero.equipment, state.hero.elements]) {
        for (let key in toolMap) {
            if (toolMap[key] > 0) {
                renderLoot(key as LootType, toolMap[key]);
            }
        }
    }
    const peachFrame = lootFrames.peachOfImmortalityPiece;
    const peachRect = { x: r.x + 4, y: r.y + r.h - 4 - peachFrame.h * 2, w: peachFrame.w, h: peachFrame.h};
    for (let i = 0; i < 4; i++) {
        fillRect(context, peachRect, i < state.hero.peachQuarters ? 'orange' : 'grey');
        peachRect.x += peachFrame.w;
        if (i === 1) {
            peachRect.x = r.x + 4;
            peachRect.y += peachFrame.h;
        }
    }
}
