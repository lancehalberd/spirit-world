import {
    cursorFrame,
    frameSize,
    getActivePanelAndOption,
} from 'app/content/menu';
import {contextMenuState, editingState} from 'app/development/editingState';
import {getCanvasScale} from 'app/development/getCanvasScale';
import {CANVAS_WIDTH, CANVAS_HEIGHT} from 'app/gameConstants';
import {drawCanvas, mainCanvas} from 'app/utils/canvas';
// import {characterMap} from 'app/utils/simpleWhiteFont';
import {createAnimation, drawFrame, drawFrameCenteredAt} from 'app/utils/animations';
import {isPointInShortRect, pad} from 'app/utils/index';
import {getMousePosition} from 'app/utils/mouse';
import {drawText} from 'app/utils/simpleWhiteFont';
import {getState, shouldHideMenu} from 'app/state';
import {updateHeroMagicStats} from 'app/render/spiritBar';

// const MARGIN = 20;

const menuSlices = createAnimation('gfx/hud/menu9slice.png', {w: 8, h: 8}, {cols: 3, rows: 3}).frames;

/*function subRect(container: Rect, target: Rect) {
    return {x: container.x + target.x, y: container.y + target.y, w: target.w, h: target.h};
}*/

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
    y: 35,
    w: CANVAS_WIDTH - 2 * 25,
    h: CANVAS_HEIGHT - 40,
}
export function renderFieldMenu(context: CanvasRenderingContext2D, state: GameState, renderBackground: RenderFunction): void {
    if (state.fieldMenuState.backgroundBuffer.needsRefresh || editingState.isEditing) {
        state.fieldMenuState.backgroundBuffer.needsRefresh = editingState.isEditing;
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

        const {activePanel, activeOption} = getActivePanelAndOption(state);
        const x = activePanel.x + activeOption.x;
        const y = activePanel.y + activeOption.y;
        // Render the cursor last, on top of everything.
        // get active element and draw based on that (refactor active element code into menu code from updateFieldMenu)
        drawFrameCenteredAt(context, cursorFrame, {
            x,
            y,
            w: frameSize, h: frameSize,
        });

        const label = activeOption.isVisible(state) && activeOption.getLabel(state);
        if (label) {
            const nameBoxWidth = label.length * 8 + 12, h = 18 + 8;
            const nameBoxRect = {
                x: menuRect.w + 8 - nameBoxWidth,
                y: menuRect.h - h,
                w: nameBoxWidth, h};
            renderMenuFrame(context, nameBoxRect);
            drawText(context, label, nameBoxRect.x + nameBoxRect.w - 6, nameBoxRect.y + nameBoxRect.h - 4, {
                textBaseline: 'bottom',
                textAlign: 'right',
                size: 16,
            });
            /*const menuTip = getMenuTip(state, selectedItem);
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
            }*/
        }
    context.restore();
}

function elementUnderPoint(state: GameState, x: number, y: number): MenuElement {
    for (const panel of state.fieldMenuState.panels) {
        if (isPointInShortRect(x, y, panel)) {
            const column = ((x - panel.x) / frameSize) | 0;
            const row = ((y - panel.y) / frameSize) | 0;
            return panel.options[column + row * panel.columns];
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
    const [mouseX, mouseY] = getMousePosition(mainCanvas, getCanvasScale());
    const menuElement = elementUnderPoint(state, mouseX - menuRect.x, mouseY - menuRect.y);
    menuElement?.onUpgrade?.(state);
    updateHeroMagicStats(state);
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
