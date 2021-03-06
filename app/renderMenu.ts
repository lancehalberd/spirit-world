import { lootFrames } from 'app/content/lootObject';
import { LEFT_TOOL_COLOR, RIGHT_TOOL_COLOR, CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { fillRect, pad } from 'app/utils/index';

import { ActiveTool, GameState, LootType } from 'app/types';

const MARGIN = 20;


const [, fullPeach, threeQuartersPeach, halfPeach, quarterPeach] =
    createAnimation('gfx/hud/peaches.png', {w: 18, h: 18}, {cols: 3, rows: 2}).frames;

export function renderMenu(context: CanvasRenderingContext2D, state: GameState): void {

    let r = {
        x: MARGIN,
        y: MARGIN * 1.5,
        w: CANVAS_WIDTH - 2 * MARGIN,
        h: CANVAS_HEIGHT - 2.5 * MARGIN,
    };

    fillRect(context, r, 'white');
    fillRect(context, pad(r, -2), 'black');

    r = pad(r, -10);


    let x = r.x, y = r.y;

    const selectableItemFrames = [];
    function renderSelectableTool(tool: ActiveTool): void {
        const frame = lootFrames[tool] || lootFrames.unknown;
        const target = {...frame, x: (x + 8 - frame.w / 2), y: (y + 8 - frame.h / 2)};
        if (state.hero.leftTool === tool) {
            fillRect(context, pad(target, 2), LEFT_TOOL_COLOR);
        }
        if (state.hero.rightTool === tool) {
            fillRect(context, pad(target, 2), RIGHT_TOOL_COLOR);
        }
        drawFrame(context, frame, target);
        selectableItemFrames.push(target);
    }
    if (state.hero.activeTools.bow) {
        renderSelectableTool('bow');
    }
    x += 30;
    if (state.hero.activeTools.staff) {
        renderSelectableTool('staff');
    }
    x += 30;
    if (state.hero.activeTools.invisibility) {
        renderSelectableTool('invisibility');
    }
    x += 30;
    if (state.hero.activeTools.clone) {
        renderSelectableTool('clone');
    }
    x += 60;

    if (state.hero.weapon) {
        const frame = lootFrames.weapon || lootFrames.unknown;
        drawFrame(context, frame, {...frame, x: (x + 8 - frame.w / 2), y: (y + 8 - frame.h / 2)});
    }

    if (selectableItemFrames.length) {
        state.menuIndex = state.menuIndex % selectableItemFrames.length;
        const frame = pad(selectableItemFrames[state.menuIndex], 3.5);
        context.strokeStyle = 'white';
        context.beginPath();
        context.rect(frame.x, frame.y, frame.w, frame.h);
        context.stroke();
    }

    x = r.x, y += 30;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.font = '12px Arial';
    function renderLoot(lootType: LootType, level: number): void {
        const frame = lootFrames[lootType] || lootFrames.unknown;
        drawFrame(context, frame, {...frame, x: (x + 8 - frame.w / 2), y: (y + 8 - frame.h / 2)});
        context.fillStyle = 'white';
        context.fillText(`${level}`, x + 20, y + 8);
        x += 28;
        if (x + 24 >= r.x + r.w) {
            y += 20;
            x = r.x
        }
    }

    for (const toolMap of [state.hero.passiveTools, state.hero.equipment, state.hero.elements]) {
        for (let key in toolMap) {
            if (toolMap[key] > 0) {
                renderLoot(key as LootType, toolMap[key]);
            }
        }
    }
    let peachFrame = fullPeach;
    const peachRect = { x: r.x + 4, y: r.y + r.h - 4 - peachFrame.h, w: peachFrame.w, h: peachFrame.h};
    context.save();
        context.globalAlpha = 0.3;
        drawFrame(context, peachFrame, peachRect);
    context.restore();
    if (state.hero.peachQuarters === 3) {
        drawFrame(context, threeQuartersPeach, peachRect);
    } else if (state.hero.peachQuarters === 2) {
        drawFrame(context, halfPeach, peachRect);
    } else if (state.hero.peachQuarters === 1) {
        drawFrame(context, quarterPeach, peachRect);
    }
}
