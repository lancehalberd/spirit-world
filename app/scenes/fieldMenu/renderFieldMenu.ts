import {
    frameSize,
    cursorFrame,
} from 'app/content/menu';
import {contextMenuState, editingState} from 'app/development/editingState';
import {getCanvasScale} from 'app/development/getCanvasScale';
import {CANVAS_WIDTH, CANVAS_HEIGHT} from 'app/gameConstants';
import {drawCanvas, mainCanvas} from 'app/utils/canvas';
// import {characterMap} from 'app/utils/simpleWhiteFont';
import {createAnimation, drawFrame, drawFrameCenteredAt} from 'app/utils/animations';
import {pad} from 'app/utils/index';
import {getMousePosition} from 'app/utils/mouse';
// import {drawText} from 'app/utils/simpleWhiteFont';
import {getState, shouldHideMenu} from 'app/state';
import {requireFrame} from 'app/utils/packedImages';

// const MARGIN = 20;


const [, fullPeach, threeQuartersPeach, halfPeach, quarterPeach] =
    createAnimation('gfx/hud/peaches.png', {w: 18, h: 18}, {cols: 3, rows: 2}).frames;
const fullPeachFrame = requireFrame('gfx/hud/peaches.png', {x: 54, y: 0, w: 20, h: 20});

const menuSlices = createAnimation('gfx/hud/menu9slice.png', {w: 8, h: 8}, {cols: 3, rows: 3}).frames;

function subRect(container: Rect, target: Rect) {
    return {x: container.x + target.x, y: container.y + target.y, w: target.w, h: target.h};
}

export function renderMenuFrame(context: CanvasRenderingContext2D, r: Rect): void {
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

const screenRect: Rect = {
    x: 0,
    y: 0,
    w: CANVAS_WIDTH,
    h: CANVAS_HEIGHT,
};
const menuRect: Rect = {
    x: 25,
    y: 30,
    w: CANVAS_WIDTH - 2 * 25,
    h: CANVAS_HEIGHT - 2 * 25,
}
const peachRect = subRect(menuRect, { x: -8, y: menuRect.h + 8 - fullPeach.h, w: fullPeach.w, h: fullPeach.h});
export function renderFieldMenu(context: CanvasRenderingContext2D, state: GameState, renderBackground: RenderFunction): void {
    if (state.fieldMenuState.backgroundBuffer.needsRefresh) {
        delete state.fieldMenuState.backgroundBuffer.needsRefresh;
        renderBackground(state.fieldMenuState.backgroundBuffer.context, state);
    }
    if (state.fieldMenuState.panelsBuffer.needsRefresh) {
        delete state.fieldMenuState.panelsBuffer.needsRefresh;
        renderPanels(state.fieldMenuState.panelsBuffer.context, state);
    }
    drawCanvas(context, state.fieldMenuState.backgroundBuffer.canvas, screenRect, screenRect);
    drawCanvas(context, state.fieldMenuState.panelsBuffer.canvas, screenRect, screenRect);
    context.save();
        context.translate(menuRect.x, menuRect.y);
        for (const panel of state.fieldMenuState.panels) {
            context.save();
                context.translate(panel.x, panel.y);
                for (const menuElement of panel.options) {
                    if (!menuElement) {
                        continue;
                    }
                    const isVisible = menuElement?.isVisible?.(state);
                    if (!editingState.isEditing && !isVisible) {
                        continue;
                    }
                    if (menuElement.isSelected?.(state)) {
                        menuElement.renderSelection?.(context, state);
                    }
                    if (!isVisible) {
                        context.save();
                            context.globalAlpha *= 0.3;
                            menuElement.render(context, state);
                        context.restore();
                    } else {
                        menuElement.render(context, state);
                    }
                }
            context.restore();
        }
        /*for (let rowIndex = 0; rowIndex < state.fieldMenuState.grid.length; rowIndex++) {
            const row = state.fieldMenuState.grid[rowIndex];
            for (let columnIndex = 0; columnIndex < state.fieldMenuState.grid[rowIndex].length; columnIndex++) {
                const menuElement = row[columnIndex];
                if (!menuElement) {
                    continue;
                }
                const x = menuRect.x + columnIndex * frameSize, y = menuRect.y + rowIndex * frameSize;
                const isVisible = menuElement?.isVisible?.(state);
                if (!editingState.isEditing && !isVisible) {
                    continue;
                }
                if (menuElement.isSelected?.(state)) {
                    menuElement.renderSelection?.(context, state, x, y);
                }
                if (!isVisible) {
                    context.save();
                        context.globalAlpha *= 0.3;
                        menuElement.render(context, state, x, y);
                    context.restore();
                } else {
                    menuElement.render(context, state, x, y);
                }
            }
        }*/

        // Render the peach piece indicator
        drawFrame(context, fullPeachFrame, pad(peachRect, 1));
        if (state.hero.savedData.peachQuarters === 3) {
            drawFrame(context, threeQuartersPeach, peachRect);
        } else if (state.hero.savedData.peachQuarters === 2) {
            drawFrame(context, halfPeach, peachRect);
        } else if (state.hero.savedData.peachQuarters === 1) {
            drawFrame(context, quarterPeach, peachRect);
        }

        // Render the cursor last, on top of everything.
        drawFrameCenteredAt(context, cursorFrame, {
            x: state.fieldMenuState.cursor.x * frameSize,
            y: state.fieldMenuState.cursor.y * frameSize,
            w: frameSize, h: frameSize,
        });
    context.restore();
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
    const [mouseX, mouseY] = getMousePosition(mainCanvas, getCanvasScale());
    const rowIndex = Math.floor((mouseY - menuRect.y) / frameSize);
    const columnIndex = Math.floor((mouseX - menuRect.x) / frameSize);
    const menuElement = state.fieldMenuState.grid[rowIndex][columnIndex];
    menuElement?.onUpgrade?.(state);
});

export function renderPanels(context: CanvasRenderingContext2D, state: GameState): void {
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    for (const menuPanel of state.fieldMenuState.panels) {
        renderMenuFrame(context, pad({
            x: menuRect.x + menuPanel.x,
            y: menuRect.y + menuPanel.y,
            w: menuPanel.w,
            h: menuPanel.h,
        }, 3));
    }
}
