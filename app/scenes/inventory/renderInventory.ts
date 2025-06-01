import { getMenuName, getMenuRows, getMenuTip } from 'app/content/menu';
import { getLootFrame, lootFrames, neutralElement } from 'app/content/loot';
import { getCanvasScale } from 'app/development/getCanvasScale';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { mainCanvas } from 'app/utils/canvas';
import { characterMap } from 'app/utils/simpleWhiteFont';
import { createAnimation, drawFrame, drawFrameCenteredAt } from 'app/utils/animations';
import { fillRect, isPointInShortRect, pad } from 'app/utils/index';
import { getMousePosition } from 'app/utils/mouse';
import { drawText } from 'app/utils/simpleWhiteFont';
import { contextMenuState, editingState } from 'app/development/editingState';
import { getState, shouldHideMenu } from 'app/state';
import { parseMessage } from 'app/render/renderMessage';
import { updateHeroMagicStats } from 'app/render/spiritBar';

const MARGIN = 20;


const [, fullPeach, threeQuartersPeach, halfPeach, quarterPeach] =
    createAnimation('gfx/hud/peaches.png', {w: 18, h: 18}, {cols: 3, rows: 2}).frames;

const frameSize = 24;
const yellowFrame = createAnimation('gfx/hud/toprighttemp1.png', {w: frameSize, h: frameSize}).frames[0];
const blueFrame = createAnimation('gfx/hud/toprighttemp2.png', {w: frameSize, h: frameSize}).frames[0];
const cursor = createAnimation('gfx/hud/cursortemp.png', {w: frameSize, h: frameSize}).frames[0];

const [keyFrame, bigKeyFrame] = createAnimation('gfx/hud/icons.png',
    {w: 20, h: 20, content: {x: 2, y: 2, w: 16, h: 16}}, {x: 2, cols: 2}
).frames;

const menuSlices = createAnimation('gfx/hud/menu9slice.png', {w: 8, h: 8}, {cols: 3, rows: 3}).frames;

function renderFaded(context: CanvasRenderingContext2D, fade: boolean, render: () => void) {
    if (fade) {
        context.save();
        context.globalAlpha *= 0.3;
        render();
        context.restore();
    } else {
        render();
    }
}

function subRect(container: Rect, target: Rect) {
    return {x: container.x + target.x, y: container.y + target.y, w: target.w, h: target.h};
}

export const outerMenuFrame = {
    x: MARGIN * 1.5,
    y: MARGIN * 1.5,
    w: CANVAS_WIDTH - 3 * MARGIN,
    h: CANVAS_HEIGHT - 2.5 * MARGIN,
};

export const innerMenuFrame = pad(outerMenuFrame, -10);

const weapon1Rect = subRect(innerMenuFrame, {x: 150, y: 0, w: frameSize, h: frameSize});
const weapon2Rect = subRect(innerMenuFrame, {x: 155, y: 0, w: frameSize, h: frameSize});

const silverRect = subRect(innerMenuFrame, {x: 140, y: 26, w: frameSize, h: frameSize});
const goldRect = subRect(innerMenuFrame, {x: 140, y: 50, w: frameSize, h: frameSize});

const peachRect = subRect(innerMenuFrame, { x: 4, y: innerMenuFrame.h - 4 - fullPeach.h, w: fullPeach.w, h: fullPeach.h});

const mapFrame = lootFrames.map;
const mapRect = {...peachRect, x: peachRect.x + peachRect.w + 10, w: mapFrame.w, h: mapFrame.h };
const bigKeyRect = {...mapRect, x: mapRect.x + mapRect.w + 2, w: bigKeyFrame.w, h: bigKeyFrame.h };
const smallKeyRect = {...bigKeyRect, x: bigKeyRect.x + bigKeyRect.w + 2, w: keyFrame.w, h: keyFrame.h };

export function renderMenuFrame(context: CanvasRenderingContext2D, state: GameState, r: Rect): void {
    drawFrame(context, menuSlices[0], {x: r.x, y: r.y, w: 8, h: 8});
    drawFrame(context, menuSlices[1], {x: r.x + 8, y: r.y, w: r.w - 16, h: 8});
    drawFrame(context, menuSlices[2], {x: r.x + r.w - 8, y: r.y, w: 8, h: 8});

    drawFrame(context, menuSlices[3], {x: r.x, y: r.y + 8, w: 8, h: r.h - 16});
    drawFrame(context, menuSlices[4], {x: r.x + 8, y: r.y + 8, w: r.w - 16, h: r.h - 16});
    drawFrame(context, menuSlices[5], {x: r.x + r.w - 8, y: r.y + 8, w: 8, h: r.h - 16});

    drawFrame(context, menuSlices[6], {x: r.x, y: r.y + r.h - 8, w: 8, h: 8});
    drawFrame(context, menuSlices[7], {x: r.x + 8, y: r.y + r.h - 8, w: r.w - 16, h: 8});
    drawFrame(context, menuSlices[8], {x: r.x + r.w - 8, y: r.y + r.h - 8, w: 8, h: 8});
}

export function renderInventory(context: CanvasRenderingContext2D, state: GameState): void {
    renderMenuFrame(context, state, outerMenuFrame);

    //fillRect(context, r, 'white');
    //fillRect(context, pad(r, -2), 'black');

    const r = innerMenuFrame;
    let x = r.x, y = r.y;

    function renderSelectableTool(tool: ActiveTool): void {
        const frame = getLootFrame(state, { lootType: tool, lootLevel: state.hero.savedData.activeTools[tool] || 1 });
        const target = {w: frameSize, h: frameSize, x, y};
        if (state.hero.savedData.leftTool === tool) {
            drawFrame(context, blueFrame, target);
        }
        if (state.hero.savedData.rightTool === tool) {
            drawFrame(context, yellowFrame, target);
        }
        renderFaded(context, !state.hero.savedData.activeTools[tool], () => drawFrameCenteredAt(context, frame, target));
    }
    function renderBoots(equipment: Equipment): void {
        const frame = getLootFrame(state, { lootType: equipment, lootLevel: state.hero.savedData.equipment[equipment] || 1 });
        const target = {w: frameSize, h: frameSize, x, y};

        if (state.hero.savedData.equippedBoots === equipment) {
            fillRect(context, target, 'white');
            fillRect(context, pad(target, -2), 'black');
        }

        const scrollTarget = {...target, x: target.x + 4, y: target.y - 2};
        const hideSpikeBootsRecipe = !state.hero.savedData.blueprints.spikeBoots || state.hero.savedData.equipment.leatherBoots > 1;
        if (equipment === 'leatherBoots' && (!hideSpikeBootsRecipe || editingState.isEditing)) {
            renderFaded(context, hideSpikeBootsRecipe, () => drawFrameCenteredAt(context, lootFrames.spikeBoots, scrollTarget));
        }
        const hideFlyingBootsRecipe = !state.hero.savedData.blueprints.flyingBoots || state.hero.savedData.equipment.cloudBoots > 1;
        if (equipment === 'cloudBoots' && (!hideFlyingBootsRecipe || editingState.isEditing)) {
            renderFaded(context, hideFlyingBootsRecipe, () => drawFrameCenteredAt(context, lootFrames.flyingBoots, scrollTarget));
        }
        const hideForgeBootsRecipe = !state.hero.savedData.blueprints.forgeBoots || state.hero.savedData.equipment.ironBoots > 1;
        if (equipment === 'ironBoots' && (!hideForgeBootsRecipe || editingState.isEditing)) {
            renderFaded(context, hideForgeBootsRecipe, () => drawFrameCenteredAt(context, lootFrames.forgeBoots, scrollTarget));
        }

        renderFaded(context, !state.hero.savedData.equipment[equipment], () => drawFrameCenteredAt(context, frame, target));
    }
    function renderElement(element: MagicElement): void {
        const frame = getLootFrame(state, { lootType: element, lootLevel: state.hero.savedData.elements[element] || 1 });
        const target = {w: frameSize, h: frameSize, x, y};
        if (state.hero.savedData.element === element) {
            fillRect(context, target, 'white');
            fillRect(context, pad(target, -2), 'black');
        }
        renderFaded(context, !state.hero.savedData.elements[element], () => drawFrameCenteredAt(context, frame, target));
    }
    function renderLoot(lootType: LootType, lootLevel: number): void {
        const frame = getLootFrame(state, { lootType, lootLevel: lootLevel || 1 });
        renderFaded(context, !lootLevel, () => drawFrameCenteredAt(context, frame, {x, y, w: frameSize, h: frameSize}));
    }

    const rowHeight = 25, rowWidth = 26;
    const menuRows = getMenuRows(state);
    for (const menuRow of menuRows) {
        for (const menuItem of menuRow) {
            if (menuItem === 'help') {
                drawFrameCenteredAt(context, characterMap['?'], {w: frameSize, h: frameSize, x, y});
            } else if (menuItem === 'return') {
                renderLoot('nimbusCloud', 1);
            } else if (menuItem === 'bow' || menuItem === 'cloak' || menuItem === 'staff' || menuItem === 'clone') {
                renderSelectableTool(menuItem);
            } else if (menuItem === 'leatherBoots' || menuItem === 'ironBoots' || menuItem === 'cloudBoots') {
                renderBoots(menuItem);
            } else if (menuItem === 'neutral') {
                drawFrameCenteredAt(context, neutralElement, {x, y, w: frameSize, h: frameSize});
            } else if (menuItem === 'fire' || menuItem === 'ice' || menuItem === 'lightning') {
                renderElement(menuItem as MagicElement);
            } else if (state.hero.savedData.passiveTools[menuItem as PassiveTool] || editingState.isEditing) {
                renderLoot(menuItem as LootType, state.hero.savedData.passiveTools[menuItem as PassiveTool]);
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

    // Weapon isn't currently part of the selectable menu rows.
    if ((state.hero.savedData.weapon & 1) || editingState.isEditing) {
        const frame = getLootFrame(state, { lootType: 'weapon', lootLevel: 1 });
        renderFaded(context, !(state.hero.savedData.weapon & 1),
            () => drawFrameCenteredAt(context, frame, weapon1Rect));
    }
    if ((state.hero.savedData.weapon & 2) || editingState.isEditing) {
        const frame = getLootFrame(state, { lootType: 'weapon', lootLevel: state.hero.savedData.weapon });
        renderFaded(context, !(state.hero.savedData.weapon & 2),
            () => drawFrameCenteredAt(context, frame, weapon2Rect));
    }
    if (state.hero.savedData.silverOre || editingState.isEditing) {
        const frame = getLootFrame(state, {lootType: 'silverOre'});
        renderFaded(context, !state.hero.savedData.silverOre,
            () => drawFrameCenteredAt(context, frame, silverRect));
        drawText(context, `${state.hero.savedData.silverOre}`, silverRect.x + 24, silverRect.y + frameSize / 2, {
            textBaseline: 'middle',
            textAlign: 'left',
            size: 16,
        });
    }
    if (state.hero.savedData.goldOre || editingState.isEditing) {
        const frame = getLootFrame(state, {lootType: 'goldOre'});
        renderFaded(context, !state.hero.savedData.goldOre,
            () => drawFrameCenteredAt(context, frame, goldRect));
        drawText(context, `${state.hero.savedData.goldOre}`, goldRect.x + 24, goldRect.y + frameSize / 2, {
            textBaseline: 'middle',
            textAlign: 'left',
            size: 16,
        });
    }

    context.save();
        context.globalAlpha = 0.3;
        drawFrame(context, fullPeach, peachRect);
    context.restore();
    if (state.hero.savedData.peachQuarters === 3) {
        drawFrame(context, threeQuartersPeach, peachRect);
    } else if (state.hero.savedData.peachQuarters === 2) {
        drawFrame(context, halfPeach, peachRect);
    } else if (state.hero.savedData.peachQuarters === 1) {
        drawFrame(context, quarterPeach, peachRect);
    }

    if (editingState.isEditing) {
        const dungeonInventory = state.savedState.dungeonInventories[state.location.logicalZoneKey] || {} as DungeonInventory;
        renderFaded(context, !dungeonInventory.bigKey, () => drawFrameCenteredAt(context, bigKeyFrame, bigKeyRect));
        renderFaded(context, !dungeonInventory.map, () => drawFrameCenteredAt(context, mapFrame, mapRect));
        renderFaded(context, !dungeonInventory.smallKeys, () => drawFrameCenteredAt(context, keyFrame, smallKeyRect));
        drawText(context, `${dungeonInventory.smallKeys || 0}`, smallKeyRect.x + 16, smallKeyRect.y + frameSize / 2, {
            textBaseline: 'middle',
            textAlign: 'left',
            size: 16,
        });
    } else {
        const dungeonInventory = state.savedState.dungeonInventories[state.location.logicalZoneKey] || {} as DungeonInventory;
        if (dungeonInventory.map) {
            drawFrameCenteredAt(context, mapFrame, mapRect);
        }
    }

    if (selectedItem) {
        const lootName = getMenuName(state, selectedItem);
        const nameBoxWidth = lootName.length * 8 + 12, h = 18 + 8;
        const nameBoxRect = {
            x: outerMenuFrame.x + outerMenuFrame.w + 8 - nameBoxWidth,
            y: outerMenuFrame.y + outerMenuFrame.h + 8 - h - 20,
            w: nameBoxWidth, h};
        renderMenuFrame(context, state, nameBoxRect);
        drawText(context, lootName, nameBoxRect.x + nameBoxRect.w - 6, nameBoxRect.y + nameBoxRect.h - 4, {
            textBaseline: 'bottom',
            textAlign: 'right',
            size: 16,
        });
        const menuTip = getMenuTip(state, selectedItem);
        if (menuTip) {
            const textFrames = parseMessage(state, menuTip.buttons)[0].frames[0].filter(v => v);
            let buttonW = 0;
            for (const frame of textFrames) {
                buttonW += frame ? frame.w : 8;
            }
            const padding = 2;

            const w = buttonW + padding + menuTip.action.length * 8 + 12, h = 18 + 8;
            const textRect = {
                x: nameBoxRect.x + nameBoxRect.w - w,//nameBoxRect.x + nameBoxRect.w / 2 - w / 2,//outerMenuFrame.x + outerMenuFrame.w + 12 - w,
                y: outerMenuFrame.y + outerMenuFrame.h + 10 - h,
                w, h
            };
            renderMenuFrame(context, state, textRect);
            const characterWidth = 8;
            let x = textRect.x + 4;
            for (const frame of textFrames) {
                if (!frame) {
                    x += characterWidth;
                    continue;
                }
                drawFrame(context, frame, {
                    x: x - (frame.content?.x || 0),
                    y: textRect.y + 6 - (frame.content?.y || 0), w: frame.w, h: frame.h
                });
                x += frame.w;
            }
            drawText(context, menuTip.action, textRect.x + 4 + buttonW + padding, textRect.y + textRect.h - 4, {
                textBaseline: 'bottom',
                textAlign: 'left',
                size: 16,
            });
        }
    }
}


// While the editor is open, all possible items are displayed, and you can
// click them to enabled/upgrade/disable them.
mainCanvas.addEventListener('click', function (event) {
    if (event.which !== 1 || contextMenuState.contextMenu) {
        return;
    }
    if (!editingState.isEditing) {
        return;
    }
    const state = getState();
    // Only process inventory editing when the inventory is actually being displayed.
    if (!state.paused || state.showMap || shouldHideMenu(state)) {
        return;
    }
    const rowHeight = 25, rowWidth = 26;
    const [mouseX, mouseY] = getMousePosition(mainCanvas, getCanvasScale());
    let {x, y} = innerMenuFrame;

    if (isPointInShortRect(mouseX, mouseY, weapon1Rect) || isPointInShortRect(mouseX, mouseY, weapon2Rect)) {
        state.hero.savedData.weapon = ((state.hero.savedData.weapon || 0) + 1) % 4;
        return;
    }
    if (isPointInShortRect(mouseX, mouseY, peachRect)) {
        state.hero.savedData.peachQuarters = ((state.hero.savedData.peachQuarters || 0) + 1) % 4;
        if (state.hero.savedData.peachQuarters === 0) {
            state.hero.savedData.maxLife++;
        }
        return;
    }
    if (isPointInShortRect(mouseX, mouseY, silverRect)) {
        state.hero.savedData.silverOre = ((state.hero.savedData.silverOre || 0) + 1) % 6;
        return;
    }
    if (isPointInShortRect(mouseX, mouseY, goldRect)) {
        state.hero.savedData.goldOre = ((state.hero.savedData.goldOre || 0) + 1) % 6;
        return;
    }
    state.savedState.dungeonInventories[state.location.logicalZoneKey]
        = state.savedState.dungeonInventories[state.location.logicalZoneKey] || {bigKey: false, map: false, smallKeys: 0, totalSmallKeys: 0};
    const dungeonInventory = state.savedState.dungeonInventories[state.location.logicalZoneKey];
    if (isPointInShortRect(mouseX, mouseY, bigKeyRect)) {
        dungeonInventory.bigKey = !dungeonInventory.bigKey;
        return;
    }
    if (isPointInShortRect(mouseX, mouseY, mapRect)) {
        dungeonInventory.map =  !dungeonInventory.map;
        return;
    }
    if (isPointInShortRect(mouseX, mouseY, smallKeyRect)) {
        dungeonInventory.smallKeys = ((dungeonInventory.smallKeys || 0) + 1) % 5;
        return;
    }
    // Handle big key/small key/map

    const menuRows = getMenuRows(state);
    for (const menuRow of menuRows) {
        for (const menuItem of menuRow) {
            const r = {x, y, w: frameSize, h: frameSize};
            if (isPointInShortRect(mouseX, mouseY, r)) {
                if (menuItem === 'help' || menuItem === 'empty' || menuItem === 'weapon'
                    || menuItem === 'spiritPower' || menuItem === 'secondChance'
                    || menuItem === 'spikeBoots' || menuItem === 'forgeBoots' || menuItem === 'flyingBoots'
                    || menuItem === 'peachOfImmortality' || menuItem === 'peachOfImmortalityPiece'
                    || menuItem === 'money' || menuItem === 'peach' || menuItem === 'victoryPoint'
                    || menuItem === 'goldOre' || menuItem === 'silverOre' || menuItem === 'unknown'
                    || menuItem === 'smallKey' || menuItem === 'bigKey' || menuItem === 'map'
                    || menuItem === 'arDevice' || menuItem === 'aetherCrystal'
                ) {
                    // No handling
                } else if (menuItem === 'return') {
                    // No handling
                } else if (menuItem === 'bow' || menuItem === 'cloak' || menuItem === 'staff' || menuItem === 'clone') {
                    state.hero.savedData.activeTools[menuItem] = ((state.hero.savedData.activeTools[menuItem] || 0) + 1) % 4;
                } else if (menuItem === 'leatherBoots') {
                    if (state.hero.savedData.equipment.leatherBoots === 2) {
                        state.hero.savedData.equipment.leatherBoots = 1;
                        state.hero.savedData.blueprints.spikeBoots = 0;
                    } else if (state.hero.savedData.blueprints.spikeBoots) {
                        state.hero.savedData.equipment.leatherBoots = 2;
                    } else {
                        state.hero.savedData.blueprints.spikeBoots = 1;
                    }
                } else if (menuItem === 'cloudBoots') {
                    if (state.hero.savedData.equipment.cloudBoots === 2) {
                        state.hero.savedData.equipment.cloudBoots = 0;
                        state.hero.savedData.blueprints.flyingBoots = 0;
                    } else if (state.hero.savedData.blueprints.flyingBoots) {
                        state.hero.savedData.equipment.cloudBoots = 2;
                    } else if (state.hero.savedData.equipment.cloudBoots) {
                        state.hero.savedData.blueprints.flyingBoots = 1;
                    } else {
                        state.hero.savedData.equipment.cloudBoots = 1;
                    }
                } else if (menuItem === 'ironBoots') {
                    if (state.hero.savedData.equipment.ironBoots === 2) {
                        state.hero.savedData.equipment.ironBoots = 0;
                        state.hero.savedData.blueprints.forgeBoots = 0;
                    } else if (state.hero.savedData.blueprints.forgeBoots) {
                        state.hero.savedData.equipment.ironBoots = 2;
                    } else if (state.hero.savedData.equipment.ironBoots) {
                        state.hero.savedData.blueprints.forgeBoots = 1;
                    } else {
                        state.hero.savedData.equipment.ironBoots = 1;
                    }

                } else if (menuItem === 'neutral') {
                    // No handling
                } else if (menuItem === 'fire' || menuItem === 'ice' || menuItem === 'lightning') {
                    state.hero.savedData.elements[menuItem] = ((state.hero.savedData.elements[menuItem] || 0) + 1) % 2;
                } else {
                    if (menuItem === 'gloves' || menuItem === 'roll') {
                        // These passive tools have 2 levels.
                        state.hero.savedData.passiveTools[menuItem] = ((state.hero.savedData.passiveTools[menuItem] || 0) + 1) % 4;
                    } else {
                        state.hero.savedData.passiveTools[menuItem] = ((state.hero.savedData.passiveTools[menuItem] || 0) + 1) % 2;
                    }
                }
                updateHeroMagicStats(state);
                return;
            }
            x += rowWidth;
        }
        x = innerMenuFrame.x;
        y += rowHeight;
    }


});
