import { lootFrames } from 'app/content/lootObject';
import { CANVAS_WIDTH, LEFT_TOOL_COLOR, RIGHT_TOOL_COLOR } from 'app/gameConstants';
import { drawFrame } from 'app/utils/animations';
import { fillRect, pad } from 'app/utils/index';

import { GameState } from 'app/types';

export function renderHUD(context: CanvasRenderingContext2D, state: GameState): void {
    for (let i = 0; i < state.hero.maxLife; i++) {
        context.fillStyle = 'white';
        context.fillRect(5 + i * 8, 5, 1, 10);
        context.fillRect(5 + i * 8, 5, 7, 1);
        context.fillRect(5 + i * 8 + 6, 5, 1, 10);
        context.fillRect(5 + i * 8, 5 + 9, 7, 1);
        if (i < state.hero.life) {
            context.fillStyle = 'red';
            context.fillRect(5 + i * 8 + 1, 5 + 1, 5, 8);
        }
    }
    context.fillStyle = 'black';
    context.fillRect(5, 16, Math.floor(state.hero.maxMagic), 4);
    context.fillStyle = 'lightblue';
    context.fillRect(5, 16, Math.floor(state.hero.magic), 4);

    if (state.hero.leftTool) {
        const frame = lootFrames[state.hero.leftTool] || lootFrames.unknown;
        const target = {...frame, x: CANVAS_WIDTH - 40, y: 4};
        fillRect(context, pad(target, 2), LEFT_TOOL_COLOR);
        drawFrame(context, frame, target)
    }
    if (state.hero.rightTool) {
        const frame = lootFrames[state.hero.rightTool] || lootFrames.unknown;
        const target = {...frame, x: CANVAS_WIDTH - 20, y: 4};
        fillRect(context, pad(target, 2), RIGHT_TOOL_COLOR);
        drawFrame(context, frame, target);
    }
}
