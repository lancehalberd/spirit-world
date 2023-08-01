import { getMenuName, getMenuRows } from 'app/content/menu';
import { getLootFrame, neutralElement } from 'app/content/loot';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { characterMap } from 'app/utils/simpleWhiteFont';
import { createAnimation, drawFrame, drawFrameCenteredAt } from 'app/utils/animations';
import { fillRect, pad } from 'app/utils/index';
import { drawText } from 'app/utils/simpleWhiteFont';

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
    }
    function renderBoots(equipment: Equipment): void {
        const frame = getLootFrame(state, { lootType: equipment, lootLevel: state.hero.equipment[equipment] });
        const target = {w: frameSize, h: frameSize, x, y};
        if (state.hero.equippedBoots === equipment) {
            fillRect(context, target, 'white');
            fillRect(context, pad(target, -2), 'black');
        }
        drawFrameCenteredAt(context, frame, target);
    }
    function renderElement(element: MagicElement): void {
        const frame = getLootFrame(state, { lootType: element, lootLevel: state.hero.elements[element] });
        const target = {w: frameSize, h: frameSize, x, y};
        if (state.hero.element === element) {
            fillRect(context, target, 'white');
            fillRect(context, pad(target, -2), 'black');
        }
        drawFrameCenteredAt(context, frame, target);
    }
    function renderLoot(lootType: LootType, lootLevel: number): void {
        const frame = getLootFrame(state, { lootType, lootLevel });
        drawFrameCenteredAt(context, frame, {x, y, w: frameSize, h: frameSize});
    }

    const rowHeight = 25, rowWidth = 26;
    const menuRows = getMenuRows(state);
    for (const menuRow of menuRows) {
        for (const menuItem of menuRow) {
            if (menuItem === 'help') {
                drawFrameCenteredAt(context, characterMap['?'], {w: frameSize, h: frameSize, x, y});
            } else if (menuItem === 'return') {
                renderLoot('nimbusCloud', 1);
            } else if (state.hero.activeTools[menuItem]) {
                renderSelectableTool(menuItem as ActiveTool);
            } else if (state.hero.equipment[menuItem]) {
                renderBoots(menuItem as Equipment);
            } else if (menuItem === 'neutral') {
                drawFrameCenteredAt(context, neutralElement, {x, y, w: frameSize, h: frameSize});
            } else if (state.hero.elements[menuItem]) {
                renderElement(menuItem as MagicElement);
            } else if (state.hero.passiveTools[menuItem as PassiveTool]) {
                renderLoot(menuItem as LootType, state.hero.passiveTools[menuItem]);
            }
            x += rowWidth;
        }
        x = r.x;
        y += rowHeight;
    }

    // Draw the selection cursor.
    drawFrame(context, cursor, {
        ...cursor,
        x: r.x + state.menuIndex * rowWidth,
        y: r.y + state.menuRow * rowHeight,
    });

    const selectedItem = menuRows[state.menuRow]?.[state.menuIndex];
    if (selectedItem) {
        const lootName = getMenuName(state, selectedItem);
        drawText(context, lootName, r.x + r.w - 4, r.y + r.h - 4, {
            textBaseline: 'bottom',
            textAlign: 'right',
            size: 16,
        });
    }

    // Weapon isn't currently part of the selectable menu rows.
    if (state.hero.weapon === 1) {
        const frame = getLootFrame(state, { lootType: 'weapon', lootLevel: 1 });
        drawFrameCenteredAt(context, frame, {x: r.x + 155, y: r.y, w: frameSize, h: frameSize});
    } else if (state.hero.weapon >= 2) {
        let frame = getLootFrame(state, { lootType: 'weapon', lootLevel: 1 });
        drawFrameCenteredAt(context, frame, {x: r.x + 150, y: r.y, w: frameSize, h: frameSize});
        frame = getLootFrame(state, { lootType: 'weapon', lootLevel: state.hero.weapon });
        drawFrameCenteredAt(context, frame, {x: r.x + 155, y: r.y, w: frameSize, h: frameSize});
    }
    if (state.hero.silverOre) {
        const frame = getLootFrame(state, {lootType: 'silverOre'});
        const x = r.x + 140, y = r.y + 26;
        drawFrameCenteredAt(context, frame, {x, y, w: frameSize, h: frameSize});
        drawText(context, `${state.hero.silverOre}`, x + 24, y + frameSize / 2, {
            textBaseline: 'middle',
            textAlign: 'left',
            size: 16,
        });
    }
    if (state.hero.goldOre) {
        const frame = getLootFrame(state, {lootType: 'goldOre'});
        const x = r.x + 140, y = r.y + 50;
        drawFrameCenteredAt(context, frame, {x, y, w: frameSize, h: frameSize});
        drawText(context, `${state.hero.goldOre}`, x + 24, y + frameSize / 2, {
            textBaseline: 'middle',
            textAlign: 'left',
            size: 16,
        });
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
