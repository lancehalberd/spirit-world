import {CANVAS_WIDTH, CANVAS_HEIGHT, GAME_KEY} from 'app/gameConstants';
import {cursorFrame, frameSize} from 'app/content/menu';
import {contextMenuState, editingState} from 'app/development/editingState';
import {getCanvasScale} from 'app/development/getCanvasScale';
import {renderMenuFrame} from 'app/render/renderMenuFrame';
import {updateHeroMagicStats} from 'app/render/spiritBar';
import {getState} from 'app/state';
import {
    wasGameKeyPressed,
} from 'app/userInput';
import {drawFrameCenteredAt} from 'app/utils/animations';
import {createCanvasBuffer, drawCanvas, mainCanvas} from 'app/utils/canvas';
import {clamp, isPointInShortRect, pad} from 'app/utils/index';
import {getMousePosition} from 'app/utils/mouse';
import {drawText} from 'app/utils/simpleWhiteFont';
import {updateSoundSettings} from 'app/utils/soundSettings';


function selectClosestElement(scene: FieldMenuScene, x: number, y: number) {
    for (const panel of scene.panels) {
        // This padding should be adjusted to account for any gaps that appear between menus.
        if (isPointInShortRect(x, y, pad(panel, 5))) {
            scene.cursor.panelId = panel.id;
            const column = ((x - panel.x) / (panel.columnWidth ?? frameSize)) | 0;
            const row = ((y - panel.y) / (panel.rowHeight ?? frameSize)) | 0;
            scene.cursor.optionIndex = clamp(column + row * panel.columns, 0, panel.options.length - 1);
            return;
        }
    }
}

const menuRect: Rect = {
    x: 32,
    y: 35,
    w: CANVAS_WIDTH - 2 * 25,
    h: CANVAS_HEIGHT - 40,
}

function getActiveOption(scene: FieldMenuScene): MenuElement {
    const cursor = scene.cursor;
    let activePanel = scene.panels.find(panel => panel.id === cursor.panelId);
    // If the active panel is invalid, default to the first panel.
    if (!activePanel)  {
        activePanel = scene.panels[0];
        cursor.panelId = activePanel.id;
        cursor.optionIndex = 0;
    }
    if (!activePanel.options[cursor.optionIndex]) {
        cursor.optionIndex = 0;
    }
    return activePanel.options[cursor.optionIndex];
}

function renderPanels(context: CanvasRenderingContext2D, scene: FieldMenuScene): void {
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    for (const menuPanel of scene.panels) {
        renderMenuFrame(context, pad({
            x: menuRect.x + menuPanel.x,
            y: menuRect.y + menuPanel.y,
            w: menuPanel.w,
            h: menuPanel.h,
        }, 3));
    }
}

export class FieldMenuScene implements GameScene {
    sceneType = 'fieldMenu';
    blocksInput = true;
    blocksUpdates = true;
    needsRefresh = true;
    panels: MenuPanel[] = [];
    panelsBuffer: CanvasBuffer = createCanvasBuffer(CANVAS_WIDTH, CANVAS_HEIGHT);
    // buffer: CanvasBuffer = createCanvasBuffer(CANVAS_WIDTH, CANVAS_HEIGHT);
    cursor: {
        // Which panel the cursor is in
        panelId: string
        // Which option the cursor has selected.
        optionIndex: number
    }
    // These are used to set offsets for sub panels so they line up with options that open them.
    x = 0;
    y = 0;
    closeScene(state: GameState) {
        while (state.sceneStack.includes(this)) {
            state.sceneStack.pop();
        }
        updateSoundSettings(state);
    }
    getPanels(state: GameState): MenuPanel[] {
        return [];
    }
    update(state: GameState, interactive: boolean) {
        if (this.needsRefresh) {
            this.panels = this.getPanels(state);
            for (const panel of this.panels) {
                let row = 0, column = 0;
                for (const element of panel.options) {
                    element.x = panel.x + column * (panel.columnWidth ?? frameSize) + (panel.optionsOffset?.x ?? 0);
                    element.y = panel.y + row * (panel.rowHeight ?? frameSize) + (panel.optionsOffset?.y ?? 0);
                    column++;
                    if (column >= panel.columns) {
                        row++;
                        column = 0;
                    }
                }
            }
        }
        if (!interactive) {
            return;
        }
        if (wasGameKeyPressed(state, GAME_KEY.MENU) || wasGameKeyPressed(state, GAME_KEY.CANCEL)) {
            this.closeScene(state);
            return;
        }
        if (!this.panels.length) {
            return;
        }
        const activeOption = getActiveOption(this);
        const x = activeOption.x + frameSize / 2;
        const y = activeOption.y + frameSize / 2;

        // Moving the cursor is accomplished by just moving to the closest element when
        // moving the cursor by a set amount in any direction.
        const movementDelta = frameSize + 3;
        if (wasGameKeyPressed(state, GAME_KEY.UP)) {
            selectClosestElement(this, x, y - movementDelta);
        } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
            selectClosestElement(this, x, y + movementDelta);
        }
        if (wasGameKeyPressed(state, GAME_KEY.LEFT)) {
            selectClosestElement(this, x - movementDelta, y);
        } else if (wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
            selectClosestElement(this, x + movementDelta, y);
        }
        if (activeOption && (
            wasGameKeyPressed(state, GAME_KEY.CONFIRM)
            || wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL)
            || wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)
        )) {
            if (editingState.isEditing) {
                activeOption.onUpgrade?.(state);
                updateHeroMagicStats(state, true);
            } else if (activeOption.isVisible?.(state)) {
                let toolIndex: number;
                if (wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL)) {
                    toolIndex = 0;
                } else if (wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)) {
                    toolIndex = 1;
                }
                if (activeOption.onSelect?.(state, toolIndex)) {
                    this.closeScene(state);
                }
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        if (!this.panels.length) {
            return;
        }
        if (this.panelsBuffer.needsRefresh) {
            delete this.panelsBuffer.needsRefresh;
            renderPanels(this.panelsBuffer.context, this);
        }
        drawCanvas(context, this.panelsBuffer.canvas);
        context.save();
            context.translate(menuRect.x, menuRect.y);
            for (const panel of this.panels) {
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
            }

            const activeOption = getActiveOption(this);
            // Render the cursor last, on top of everything.
            // get active element and draw based on that (refactor active element code into menu code from updateFieldMenu)
            drawFrameCenteredAt(context, cursorFrame, activeOption);

            const label = activeOption.isVisible(state) && activeOption.getLabel(state);
            // Only show the label for the active option if this menu is at the top of the scene stack,
            // it is confusing to see labels for the main menu when submenus are open.
            if (state.sceneStack[state.sceneStack.length - 1] === this && label) {
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
            }
        context.restore();
    }
}

function elementUnderPoint(fieldMenuScene: FieldMenuScene, x: number, y: number): MenuElement|undefined {
    for (const panel of fieldMenuScene.panels) {
        if (isPointInShortRect(x, y, panel)) {
            for (const option of panel.options) {
                if (isPointInShortRect(x, y, option)) {
                    return option;
                }
                //const column = ((x - panel.x) / frameSize) | 0;
                //const row = ((y - panel.y) / frameSize) | 0;
                //return panel.options[column + row * panel.columns];
            }
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
    let fieldMenuScene: FieldMenuScene;
    const state = getState();
    for (let i = state.sceneStack.length - 1; i >= 0; i--) {
        const scene = state.sceneStack[i];
        if (scene instanceof FieldMenuScene) {
            fieldMenuScene = scene;
            break;
        }
    }
    // Only process inventory editing when the inventory is actually being displayed.
    if (!fieldMenuScene) {
        return;
    }
    const [mouseX, mouseY] = getMousePosition(mainCanvas, getCanvasScale());
    const menuElement = elementUnderPoint(fieldMenuScene, mouseX - menuRect.x, mouseY - menuRect.y);
    menuElement?.onUpgrade?.(state);
    updateHeroMagicStats(state, true);
});
