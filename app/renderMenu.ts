import { getLootFrame, normalBoots, neutralElement } from 'app/content/objects/lootObject';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { characterMap } from 'app/utils/simpleWhiteFont';
import { createAnimation, drawFrame, drawFrameCenteredAt } from 'app/utils/animations';
import { fillRect, pad } from 'app/utils/index';

import { ActiveTool, Equipment, GameState, LootType, MagicElement } from 'app/types';

const MARGIN = 20;


const [, fullPeach, threeQuartersPeach, halfPeach, quarterPeach] =
    createAnimation('gfx/hud/peaches.png', {w: 18, h: 18}, {cols: 3, rows: 2}).frames;

const frameSize = 24;
const yellowFrame = createAnimation('gfx/hud/toprighttemp1.png', {w: frameSize, h: frameSize}).frames[0];
const blueFrame = createAnimation('gfx/hud/toprighttemp2.png', {w: frameSize, h: frameSize}).frames[0];
const cursor = createAnimation('gfx/hud/cursortemp.png', {w: frameSize, h: frameSize}).frames[0];

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
        const frame = getLootFrame(state, { lootType: tool, lootLevel: state.hero.activeTools[tool] });
        const target = {w: frameSize, h: frameSize, x, y};
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
    let target = {w: frameSize, h: frameSize, x, y};
    let frame = characterMap['?'];
    drawFrameCenteredAt(context, frame, target);
    if (state.menuRow === 0) {
        selectableItemFrames.push(target);
    }
    x += 30;
    if (state.hero.activeTools.bow) {
        renderSelectableTool('bow');
    }
    x += 30;
    if (state.hero.activeTools.staff) {
        renderSelectableTool('staff');
    }
    x += 30;
    if (state.hero.activeTools.cloak) {
        renderSelectableTool('cloak');
    }
    x += 30;
    if (state.hero.activeTools.clone) {
        renderSelectableTool('clone');
    }
    x += 35;

    if (state.hero.weapon) {
        const frame = getLootFrame(state, { lootType: 'weapon', lootLevel: state.hero.weapon });
        drawFrameCenteredAt(context, frame, {x, y, w: frameSize, h: frameSize});
    }

    function renderBoots(equipment: Equipment): void {
        const frame = getLootFrame(state, { lootType: equipment, lootLevel: state.hero.equipment[equipment] });
        const target = {w: frameSize, h: frameSize, x, y};
        if (state.hero.equipedGear[equipment]) {
            fillRect(context, target, 'white');
            fillRect(context, pad(target, -2), 'black');
        }
        drawFrameCenteredAt(context, frame, target);
        if (state.menuRow === 1) {
            selectableItemFrames.push(target);
        }
    }

    x = r.x, y += frameSize + 2;
    frame = normalBoots;
    target = {x, y, w: frameSize, h: frameSize};
    //fillRect(context, target, 'black');
    if (!state.hero.equipedGear.ironBoots && !state.hero.equipedGear.cloudBoots) {
        fillRect(context, target, 'white');
        fillRect(context, pad(target, -2), 'black');
    }
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

    function renderElement(element: MagicElement): void {
        const frame = getLootFrame(state, { lootType: element, lootLevel: state.hero.elements[element] });
        const target = {w: frameSize, h: frameSize, x, y};
        if (state.hero.element === element) {
            fillRect(context, target, 'white');
            fillRect(context, pad(target, -2), 'black');
        }
        drawFrameCenteredAt(context, frame, target);
        if (state.menuRow === 2) {
            selectableItemFrames.push(target);
        }
    }

    x = r.x, y += frameSize + 2;
    if (state.hero.passiveTools.charge > 0) {
        frame = neutralElement;
        target = {x, y, w: frameSize, h: frameSize};
        //fillRect(context, target, 'black');
        if (!state.hero.element) {
            fillRect(context, target, 'white');
            fillRect(context, pad(target, -2), 'black');
        }
        drawFrameCenteredAt(context, frame, target);
    }
    if (state.menuRow === 2) {
        selectableItemFrames.push(target);
    }
    x += 30;
    if (state.hero.elements.fire) {
        renderElement('fire');
    }
    x += 30;
    if (state.hero.elements.ice) {
        renderElement('ice');
    }
    x += 30;
    if (state.hero.elements.lightning) {
        renderElement('lightning');
    }

    if (selectableItemFrames.length) {
        state.menuIndex = state.menuIndex % selectableItemFrames.length;
        const frame = selectableItemFrames[state.menuIndex];
        drawFrame(context, cursor, frame);
    }

    x = r.x, y += 30;
    function renderLoot(lootType: LootType, lootLevel: number): void {
        const frame = getLootFrame(state, { lootType, lootLevel });
        drawFrameCenteredAt(context, frame, {x, y, w: frameSize, h: frameSize});
        x += 30;
        if (x + 30 >= r.x + r.w) {
            y += 22;
            x = r.x
        }
    }


    for (let key in state.hero.passiveTools) {
        if (key === 'charge') {
            continue;
        }
        if (state.hero.passiveTools[key] > 0) {
            renderLoot(key as LootType, state.hero.passiveTools[key]);
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
