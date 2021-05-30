import { getLootFrame } from 'app/content/lootObject';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { createAnimation, drawFrame, drawFrameCenteredAt } from 'app/utils/animations';
import { fillRect, pad } from 'app/utils/index';

import { ActiveTool, Equipment, GameState, LootType } from 'app/types';

const MARGIN = 20;


const [, fullPeach, threeQuartersPeach, halfPeach, quarterPeach] =
    createAnimation('gfx/hud/peaches.png', {w: 18, h: 18}, {cols: 3, rows: 2}).frames;

const yellowFrame = createAnimation('gfx/hud/toprighttemp1.png', {w: 22, h: 22}).frames[0];
const blueFrame = createAnimation('gfx/hud/toprighttemp2.png', {w: 22, h: 22}).frames[0];
const cursor = createAnimation('gfx/hud/cursortemp.png', {w: 22, h: 22}).frames[0];

const menuSlices = createAnimation('gfx/hud/menu9slice.png', {w: 8, h: 8}, {cols: 3, rows: 3}).frames;

export function renderMenu(context: CanvasRenderingContext2D, state: GameState): void {

    let r = {
        x: MARGIN * 1.5,
        y: MARGIN * 1.5,
        w: CANVAS_WIDTH - 3 * MARGIN,
        h: CANVAS_HEIGHT - 2.5 * MARGIN,
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

    //fillRect(context, r, 'white');
    //fillRect(context, pad(r, -2), 'black');

    r = pad(r, -10);


    let x = r.x, y = r.y;

    const selectableItemFrames = [];
    function renderSelectableTool(tool: ActiveTool): void {
        const frame = getLootFrame({ lootType: tool, lootLevel: state.hero.activeTools[tool] });
        const target = {w: 22, h: 22, x, y};
        if (state.hero.leftTool === tool) {
            drawFrame(context, blueFrame, target);
        }
        if (state.hero.rightTool === tool) {
            drawFrame(context, yellowFrame, target);
        }
        drawFrameCenteredAt(context, frame, target);
        if (state.menuRow === 0) {
            selectableItemFrames.push(target);
        }
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
        const frame = getLootFrame({ lootType: 'weapon', lootLevel: state.hero.weapon });
        drawFrameCenteredAt(context, frame, {x, y, w: 22, h: 22});
    }

    function renderBoots(equipment: Equipment): void {
        const frame = getLootFrame({ lootType: equipment, lootLevel: state.hero.equipment[equipment] });
        const target = {w: 22, h: 22, x, y};
        if (state.hero.equipedGear[equipment]) {
            fillRect(context, target, 'white');
            fillRect(context, pad(target, -2), 'black');
        }
        drawFrameCenteredAt(context, frame, target);
        if (state.menuRow === 1) {
            selectableItemFrames.push(target);
        }
    }

    x = r.x, y += 30;
    const frame = getLootFrame({ lootType: 'empty' });
    const target = {x, y, w: 22, h: 22};
    fillRect(context, target, 'black');
    drawFrameCenteredAt(context, frame, target);
    if (state.menuRow === 1) {
        selectableItemFrames.push(target);
    }
    x += 30;
    if (state.hero.equipment.ironBoots) {
        renderBoots('ironBoots');
    }
    x += 30;
    if (state.hero.equipment.cloudBoots) {
        renderBoots('cloudBoots');
    }

    if (selectableItemFrames.length) {
        state.menuIndex = state.menuIndex % selectableItemFrames.length;
        const frame = selectableItemFrames[state.menuIndex];
        drawFrame(context, cursor, frame);
    }

    x = r.x, y += 40;
    function renderLoot(lootType: LootType, lootLevel: number): void {
        const frame = getLootFrame({ lootType, lootLevel });
        drawFrameCenteredAt(context, frame, {x, y, w: 22, h: 22});
        x += 30;
        if (x + 30 >= r.x + r.w) {
            y += 30;
            x = r.x
        }
    }

    for (const toolMap of [state.hero.passiveTools, state.hero.elements]) {
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
