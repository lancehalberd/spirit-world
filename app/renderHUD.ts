import { lootFrames } from 'app/content/lootObject';
import { CANVAS_WIDTH, LEFT_TOOL_COLOR, RIGHT_TOOL_COLOR } from 'app/gameConstants';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { fillRect, pad } from 'app/utils/index';

import { GameState } from 'app/types';

const [emptyHeart, fullHeart, threeQuarters, halfHeart, quarterHeart] =
    createAnimation('gfx/hud/hearts.png', {w: 10, h: 10}, {cols: 5}).frames;

export function renderHUD(context: CanvasRenderingContext2D, state: GameState): void {
    for (let i = 0; i < state.hero.maxLife; i++) {
        drawFrame(context, emptyHeart, {...emptyHeart, x: 5 + i * 11, y: 5});
        let frame = fullHeart;
        if (i >= state.hero.life) {
            frame = emptyHeart;
        } else if (i >= state.hero.life - 0.25) {
            frame = quarterHeart;
        } else if (i >= state.hero.life - 0.5) {
            frame = halfHeart;
        } else if (i >= state.hero.life - 0.75) {
            frame = threeQuarters;
        }
        drawFrame(context, frame, {...frame, x: 5 + i * 11, y: 5});
    }
    context.fillStyle = 'black';
    context.fillRect(5, 16, Math.floor(state.hero.maxMagic), 4);
    let manaColor = '#AAA';
    if (state.hero.element === 'fire') {
        manaColor = '#F00';
    } else if (state.hero.element === 'ice') {
        manaColor = '#AAF';
    } else if (state.hero.element === 'lightning') {
        manaColor = '#FF8';
    }
    context.fillStyle = manaColor;
    context.fillRect(5, 16, Math.floor(state.hero.magic), 4);

    let frame = lootFrames[state.hero.leftTool] || lootFrames.unknown;
    let target = {...frame, x: CANVAS_WIDTH - 44, y: 4};
    fillRect(context, pad(target, 2), LEFT_TOOL_COLOR);
    if (state.hero.leftTool) {
        drawFrame(context, frame, target)
    } else {
        fillRect(context, target, 'black');
    }
    frame = lootFrames[state.hero.rightTool] || lootFrames.unknown;
    target = {...frame, x: CANVAS_WIDTH - 20, y: 4};
    fillRect(context, pad(target, 2), RIGHT_TOOL_COLOR);
    if (state.hero.rightTool) {
        drawFrame(context, frame, target);
    } else {
        fillRect(context, target, 'black');
    }
}
