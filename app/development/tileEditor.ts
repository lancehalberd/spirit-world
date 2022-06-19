import {
    //applyLayerToBehaviorGrid,
    enterLocation,
    initializeAreaLayerTiles,
    //mapTileNumbersToFullTiles,
    resetTileBehavior,
} from 'app/content/areas';
import { bossTypes } from 'app/content/bosses';
import { enemyTypes } from 'app/content/enemies';
import { logicHash } from 'app/content/logic';
import { getLootFrame } from 'app/content/objects/lootObject';
import { createObjectInstance } from 'app/content/objects';
import { allTiles } from 'app/content/tiles';
import { palettes, sourcePalettes } from 'app/content/palettes';
import { zones } from 'app/content/zones';
import {
    createObjectDefinition,
    deleteObject,
    getObjectFrame,
    getObjectProperties,
    getObjectTypeProperties,
    onMouseDownObject,
    onMouseDownSelect,
    onMouseMoveSelect,
    renderObjectPreview,
    combinedObjectTypes,
    unselectObject,
} from 'app/development/objectEditor';
import { renderProgressTabContainer } from 'app/development/progressEditor';
import {
    displayPanel, displayPropertyPanel, hideAllPropertyPanels, renderPropertyRows, updateBrushCanvas,
} from 'app/development/propertyPanel';
import { TabContainer } from 'app/development/tabContainer';
import { checkToRefreshMinimap, renderZoneTabContainer, renderZoneEditor } from 'app/development/zoneEditor';
import { mainCanvas } from 'app/dom';
import { CANVAS_SCALE } from 'app/gameConstants';
import { KEY, isKeyboardKeyDown } from 'app/keyCommands';
import { translateContextForAreaAndCamera } from 'app/render';
import { getState } from 'app/state';
import { drawFrame } from 'app/utils/animations';
import { readImageFromFile } from 'app/utils/index';
import { getMousePosition, isMouseDown, /*isMouseOverElement*/ } from 'app/utils/mouse';

import {
    AreaInstance, AreaLayer, AreaLayerDefinition, BossObjectDefinition,
    DrawPriority,
    EnemyObjectDefinition, EnemyType,
    FullTile, GameState,
    ObjectDefinition, ObjectType,
    PanelRows, PropertyRow, Rect, TileGridDefinition, TilePalette,
} from 'app/types';

type EditorToolType = 'brush' | 'object' | 'enemy' | 'boss' | 'replace' | 'select';
export interface EditingState {
    tool: EditorToolType
    previousTool: EditorToolType
    hasChanges: boolean
    isEditing: boolean
    brush?: {[key: string]: TileGridDefinition}
    clipboardObject?: ObjectDefinition
    paletteKey: string
    selectedLayerKey?: string
    refreshMinimap?: boolean
    replacePercentage: number
    selectedObject?: ObjectDefinition
    spirit: boolean
    dragOffset?: {x: number, y: number}
}

export const editingState: EditingState = {
    tool: 'brush',
    previousTool: 'select',
    hasChanges: false,
    isEditing: false,
    paletteKey: Object.keys(palettes)[0],
    // Default editing the field, not the floor.
    refreshMinimap: true,
    replacePercentage: 100,
    spirit: false,
};
window['editingState'] = editingState;
window.onbeforeunload = () => {
    if (editingState.hasChanges) {
        // Chrome ignores this message but displays an appropriate message.
        return 'You have may unsaved changes.';
    }
}


const toolTabContainer = new TabContainer<EditorToolType>('brush', [
    {
        key: 'select',
        label: '↖',
        render(container: HTMLElement) {
            renderPropertyRows(container, getObjectPaletteProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
    {
        key: 'brush',
        label: '🖌',
        render(container: HTMLElement) {
            renderPropertyRows(container, getBrushPaletteProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
    {
        key: 'replace',
        label: '▧',
        render(container: HTMLElement) {
            renderPropertyRows(container, getBrushPaletteProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
    {
        key: 'object',
        label: 'object',
        render(container: HTMLElement) {
            renderPropertyRows(container, getObjectPaletteProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
    {
        key: 'enemy',
        label: 'enemy',
        render(container: HTMLElement) {
            renderPropertyRows(container, getObjectPaletteProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    },
    {
        key: 'boss',
        label: 'boss',
        render(container: HTMLElement) {
            renderPropertyRows(container, getObjectPaletteProperties());
        },
        refresh(container: HTMLElement) {
            this.render(container);
        },
    }
], (selectedKey) => {
    editingState.previousTool = editingState.tool;
    editingState.tool = selectedKey;
    editingState.selectedObject = {
        ...editingState.selectedObject,
        id: null,
    };
    // Always switch back to default saveStatus when switching tool type.
    delete editingState.selectedObject.saveStatus;
    applyToolToSelectedObject();
    // Refresh the context panel when the selected tool changes.
    displayContextPanel(getState());
});

export function setEditingTool(toolType: EditorToolType) {
    toolTabContainer.showTab(toolType);
}

export function renderToolTabContainer(): HTMLElement {
    toolTabContainer.render();
    return toolTabContainer.element;
}

export function toggleEditing() {
    const state = getState();
    state.scene = 'game';
    state.hero.z = 0;
    state.hero.actionTarget = null;
    editingState.isEditing = !editingState.isEditing;
    if (editingState.isEditing) {
        startEditing(state);
    } else {
        stopEditing(state);
    }
}
export function startEditing(state: GameState) {
    if (!editingState.brush) {
        editingState.brush = {'none': {w: 1,h: 1,tiles: [[0]]}};
    }
    if (!editingState.selectedObject) {
        editingState.selectedObject = createObjectDefinition(state,
            {type: combinedObjectTypes[0]} as Partial<ObjectDefinition> & { type: ObjectType }
        );
    }
    displayTileEditorPropertyPanel();
    state.areaInstance.tilesDrawn = [];
    state.areaInstance.checkToRedrawTiles = true;
    // This was a drag+drop experiment for dialogue editing, but I'm not adding this to
    // the editor for now, it works better to just edit directly in the code for now.
    /*const div = document.createElement('div');
    div.innerHTML = 'DIALOGUE'
    const dragContainer = document.createElement('div');
    for (let i = 0; i < 5; i++) {
        const dragElement = document.createElement('div');
        dragElement.style.border = '1px solid #888';
        dragElement.style.padding = '2px';
        dragElement.style.marginBottom = '2px';
        dragElement.style.display = 'flex';
        const dragHandle = document.createElement('div');
        dragHandle.style.minHeight = '20px';
        dragHandle.style.width = '5px';
        dragHandle.style.borderLeft = '5px double #666';
        dragHandle.style.cursor = 'move';
        const dragContent = document.createElement('div');
        dragContent.style.flexGrow = '1';
        dragContent.innerHTML = `Element ${i}`;
        dragElement.appendChild(dragHandle);
        dragElement.appendChild(dragContent);
        dragContainer.appendChild(dragElement);
        let dragHelper: HTMLElement;
        let mouseOffset: number[];
        function onDrag(event: MouseEvent) {
            const [x, y] = getMousePosition();
            dragHelper.style.left = `${x - mouseOffset[0]}px`;
            dragHelper.style.top = `${y - mouseOffset[1]}px`;
            let after = false;
            for (const otherElement of dragContainer.children) {
                if (otherElement === dragElement) {
                    after = true;
                    continue;
                }
                if (isMouseOverElement(otherElement as HTMLElement)) {
                    after
                        ? otherElement.after(dragElement)
                        : otherElement.before(dragElement);
                    break;
                }
            }
        }
        function stopDrag(event: MouseEvent) {
            dragHandle.onmousemove = null;
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
            dragHelper.remove();
            dragHelper = null;
            dragElement.style.opacity = '1';
        }
        dragHandle.onmousedown = (event: MouseEvent) => {
            event.preventDefault();
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
            mouseOffset = getMousePosition(dragElement);
            dragHelper = dragElement.cloneNode(true) as HTMLElement;
            dragHelper.style.position = 'absolute';
            dragHelper.style.width = `${dragElement.clientWidth}px`;
            onDrag(event);
            document.body.append(dragHelper);
            dragElement.style.opacity = '0.5';
        }
    }
    div.appendChild(dragContainer);
    displayLeftPanel(div);*/
}

export function stopEditing(state: GameState) {
    hideAllPropertyPanels();
    if (editingState.selectedLayerKey) {
        delete editingState.selectedLayerKey;
        enterLocation(state, state.location);
    }
    state.areaInstance.tilesDrawn = [];
    state.areaInstance.checkToRedrawTiles = true;
}

function applyToolToSelectedObject() {
    if (editingState.tool === 'enemy') {
        editingState.selectedObject.type = 'enemy';
        const enemyDefinition = editingState.selectedObject as EnemyObjectDefinition;
        // TS incorrectly requires search element type to be a subset of the array.
        if (!enemyTypes.includes(enemyDefinition.enemyType as EnemyType)) {
            enemyDefinition.enemyType = enemyTypes[0];
        }
    } else if (editingState.tool === 'boss') {
        editingState.selectedObject.type = 'boss';
        const bossDefinition = editingState.selectedObject as BossObjectDefinition;
        if (!bossTypes.includes(bossDefinition.enemyType)) {
            bossDefinition.enemyType = bossTypes[0];
        }
    } else if (editingState.tool === 'object') {
        if (editingState.selectedObject.type === 'enemy' || editingState.selectedObject.type === 'boss') {
            editingState.selectedObject.type = combinedObjectTypes[0] as any;
        }
    }
}

export function displayTileEditorPropertyPanel() {
    const state = getState();
    if (!state.areaInstance.definition.layers.find(layer => layer.key === editingState.selectedLayerKey)) {
        delete editingState.selectedLayerKey;
    }
    applyToolToSelectedObject();
    checkToRefreshMinimap(state);
    displayZonePanel(state);
    displayProgressPanel(state);
    displayToolPanel(state);
    displayContextPanel(state);
}
function displayZonePanel(state: GameState): void {
    displayPanel('left', 'top', renderZoneTabContainer());
}
function displayProgressPanel(state: GameState): void {
    displayPanel('left', 'bottom', renderProgressTabContainer());
}
function displayToolPanel(state: GameState): void {
    displayPanel('right', 'top', renderToolTabContainer());
}
function displayContextPanel(state: GameState): void {
    displayPropertyPanel(getContextProperties(), 'right', 'bottom');
}

function getObjectPaletteProperties(): PanelRows {
    return getObjectTypeProperties();
}

function getBrushPaletteProperties(): PanelRows {
    const state = getState();
    let rows: PanelRows = [];
    switch (editingState.tool) {
        case 'replace':
            rows.push({
                name: 'percent',
                value: editingState.replacePercentage,
                onChange(percent: number) {
                    editingState.replacePercentage = Math.max(0, Math.min(100, percent));
                    return editingState.replacePercentage;
                }
            });
            break;
        default:
            break;
    }
    rows.push([{
        name: 'palette',
        value: editingState.paletteKey,
        values: [...Object.keys(palettes), ...Object.keys(sourcePalettes)],
        onChange(key: string) {
            editingState.paletteKey = key;
            state.areaInstance.tilesDrawn = [];
            state.areaInstance.checkToRedrawTiles = true;
            displayTileEditorPropertyPanel();
        },
    },{
        name: 'Add Source',
        async onClick() {
            const { image, fileName } = await readImageFromFile();
            sourcePalettes[fileName] = {
                source: {
                    image,
                    x: 0, y: 0, w: image.width, h: image.height,
                },
                tiles: [],
                grid: [],
            };
            editingState.paletteKey = fileName;
            state.areaInstance.tilesDrawn = [];
            state.areaInstance.checkToRedrawTiles = true;
            displayTileEditorPropertyPanel();
        },
    }]);
    if (palettes[editingState.paletteKey]) {
        rows.push({
            name: 'brush',
            value: editingState.brush,
            palette: palettes[editingState.paletteKey],
            onChange(tiles: TileGridDefinition) {
                editingState.brush = {'none': tiles};
                updateBrushCanvas(editingState.brush);
                if (editingState.tool !== 'brush' && editingState.tool !== 'replace') {
                    setEditingTool('brush');
                }
            }
        });
    } else if (sourcePalettes[editingState.paletteKey]) {
        rows.push({
            name: 'brush',
            value: editingState.brush,
            sourcePalette: sourcePalettes[editingState.paletteKey],
            onChange(tiles: TileGridDefinition) {
                editingState.brush = {'none': tiles};
                updateBrushCanvas(editingState.brush);
                if (editingState.tool !== 'brush' && editingState.tool !== 'replace') {
                    setEditingTool('brush');
                }
            }
        });
    }
    return rows;
}

function getContextProperties(): PanelRows {
    if (editingState.tool === 'brush' || editingState.tool === 'replace') {
        return getBrushContextProperties();
    } else {
        return getObjectProperties(getState(), editingState);
    }
}

function getBrushContextProperties(): PanelRows {
    const state = getState();
    let rows: PanelRows = [];
    for (let i = 0; i < state.areaInstance.definition.layers.length; i++) {
        const definition = state.areaInstance.definition.layers[i];
        const alternateDefinition = state.areaInstance.alternateArea.definition.layers[i];
        const layer: AreaLayer | null = state.areaInstance.layers.find(layer => layer.definition === definition);
        const alternateLayer: AreaLayer | null = state.areaInstance.alternateArea.layers.find(layer => layer.definition === alternateDefinition);
        let row: PropertyRow = [
        {
            name: '',
            id: `layer-${i}-key`,
            value: definition.key,
            onChange(key: string) {
                definition.key = key;
                if (alternateDefinition) {
                    alternateDefinition.key = key;
                }
                if (layer) {
                    layer.key = key;
                }
                if (alternateLayer) {
                    alternateLayer.key = key;
                }
                displayTileEditorPropertyPanel();
            },
        }];
        if (editingState.selectedLayerKey !== definition.key) {
            row.unshift({
                name: '>',
                id: `layer-${i}-select`,
                onClick() {
                    editingState.selectedLayerKey = definition.key;
                    enterLocation(state, state.location);
                    displayTileEditorPropertyPanel();
                }
            })
        } else {
            row.unshift({
                name: '**',
                id: `layer-${i}-unselect`,
                onClick() {
                    delete editingState.selectedLayerKey;
                    enterLocation(state, state.location);
                    displayTileEditorPropertyPanel();
                }
            })
        }
        row.push({
            name: '',
            id: `layer-${i}-visibility`,
            value: definition.visibilityOverride || 'auto',
            values: ['auto', 'show', 'fade', 'hide'],
            onChange(visibilityOverride: 'auto' | 'show' | 'fade' | 'hide') {
                if (visibilityOverride === 'auto') {
                    delete definition.visibilityOverride;
                    if (alternateDefinition) {
                        delete alternateDefinition.visibilityOverride;
                    }
                } else {
                    definition.visibilityOverride = visibilityOverride;
                    if (alternateDefinition) {
                        alternateDefinition.visibilityOverride = visibilityOverride;
                    }
                }
                // Calling this will instantiate the area again and place the player back in their current location.
                enterLocation(state, state.location);
                displayTileEditorPropertyPanel();
            },
        });
        // Deleting all layers can causes errors, so don't allow it.
        if (state.areaInstance.definition.layers.length > 1) {
            row.push({
                name: 'X',
                id: `layer-${i}-delete`,
                onClick() {
                    state.areaInstance.definition.layers.splice(i, 1);
                    if (state.areaInstance.alternateArea.definition.layers) {
                        state.areaInstance.alternateArea.definition.layers.splice(i, 1);
                    }
                    enterLocation(state, state.location);
                    displayTileEditorPropertyPanel();
                },
            });
        }
        rows.push(row);
        if (editingState.selectedLayerKey === definition.key) {
            row = [{
                name: 'Priority',
                id: `layer-${i}-priority`,
                value: definition.drawPriority || (
                    definition.key === 'foreground' ? 'foreground' : 'background'
                ),
                values: ['background', 'foreground'] as DrawPriority[],
                onChange(drawPriority: DrawPriority) {
                    definition.drawPriority = drawPriority;
                    if (alternateDefinition) {
                        alternateDefinition.drawPriority = drawPriority;
                    }
                    enterLocation(state, state.location);
                },
            }];
            row.push({
                name: '^',
                id: `layer-${i}-up`,
                onClick() {
                    if (i <= 0) {
                        return;
                    }
                    state.areaInstance.definition.layers[i] = state.areaInstance.definition.layers[i - 1];
                    state.areaInstance.definition.layers[i - 1] = definition;
                    if (state.areaInstance.alternateArea.definition.layers) {
                        state.areaInstance.alternateArea.definition.layers[i]
                            = state.areaInstance.alternateArea.definition.layers[i - 1];
                        state.areaInstance.alternateArea.definition.layers[i - 1] = alternateDefinition;
                    }
                    enterLocation(state, state.location);
                    displayTileEditorPropertyPanel();
                },
            });
            row.push({
                name: 'v',
                id: `layer-${i}-down`,
                onClick() {
                    if (i >= state.areaInstance.definition.layers.length - 1) {
                        return;
                    }
                    state.areaInstance.definition.layers[i] = state.areaInstance.definition.layers[i + 1];
                    state.areaInstance.definition.layers[i + 1] = definition;
                    if (state.areaInstance.alternateArea.definition.layers) {
                        state.areaInstance.alternateArea.definition.layers[i] = state.areaInstance.alternateArea.definition.layers[i + 1];
                        state.areaInstance.alternateArea.definition.layers[i + 1] = alternateDefinition;
                    }
                    enterLocation(state, state.location);
                    displayTileEditorPropertyPanel();
                },
            });
            rows.push(row);
            rows.push({
                name: 'Logic',
                id: `layer-${i}-logic`,
                value: definition.hasCustomLogic ? 'custom' : (definition.logicKey || 'none'),
                values: ['none', 'custom', ...Object.keys(logicHash)],
                onChange(logicKey: string) {
                    if (logicKey === 'none') {
                        delete definition.logicKey;
                        delete definition.hasCustomLogic;
                        if (alternateDefinition) {
                            delete alternateDefinition.logicKey;
                            delete alternateDefinition.hasCustomLogic;
                        }
                    } else if (logicKey === 'custom') {
                        definition.hasCustomLogic = true;
                        delete definition.logicKey;
                        if (alternateDefinition) {
                            alternateDefinition.hasCustomLogic = true;
                            delete alternateDefinition.logicKey;
                        }
                    } else {
                        definition.logicKey = logicKey;
                        delete definition.hasCustomLogic;
                        if (alternateDefinition) {
                            alternateDefinition.logicKey = logicKey;
                            delete alternateDefinition.hasCustomLogic;
                        }
                    }
                    // Calling this will instantiate the area again and place the player back in their current location.
                    enterLocation(state, state.location);
                    displayTileEditorPropertyPanel();
                },
            });
            if (definition.hasCustomLogic ) {
                rows.push({
                    name: 'Custom Logic',
                    value: definition.customLogic || '',
                    onChange(customLogic: string) {
                        definition.customLogic = customLogic;
                        if (alternateDefinition) {
                            alternateDefinition.customLogic = customLogic;
                        }
                        // Calling this will instantiate the area again and place the player back in their current location.
                        enterLocation(state, state.location);
                        displayTileEditorPropertyPanel();
                    },
                });
            }
            rows.push({
                name: 'Invert Logic',
                value: definition.invertLogic || false,
                onChange(invertLogic: boolean) {
                    if (invertLogic) {
                        definition.invertLogic = invertLogic;
                        if (alternateDefinition) {
                            alternateDefinition.invertLogic = invertLogic;
                        }
                    } else {
                        delete definition.invertLogic;
                        if (alternateDefinition) {
                            delete alternateDefinition.invertLogic;
                        }
                    }
                    // Calling this will instantiate the area again and place the player back in their current location.
                    enterLocation(state, state.location);
                    displayTileEditorPropertyPanel();
                },
            });
        }
    }
    rows.push({
        name: 'Add Layer',
        onClick() {
            const definition = state.areaInstance.definition;
            const lastLayer = definition.layers[definition.layers.length - 1];
            const previousLayerKey = editingState.selectedLayerKey || lastLayer.key;
            const previousLayerIndex = definition.layers.findIndex(layer => layer.key === previousLayerKey);
            const lastLayerIndex = layersInOrder.indexOf(previousLayerKey);
            let key = 'layer-' + definition.layers.length;
            if (lastLayerIndex + 1 < layersInOrder.length) {
                // Use the next default layer key.
                key = layersInOrder[lastLayerIndex + 1];
                // If the key is in use, go back to the default key.
                if (definition.layers.find(layer => layer.key === key)) {
                    key = 'layer-' + definition.layers.length;
                }
            }
            addNewLayer(state, key, previousLayerIndex + 1);
            // Calling this will instantiate the area again and place the player back in their current location.
            if (editingState.selectedLayerKey) {
                editingState.selectedLayerKey = key;
            }
            enterLocation(state, state.location);
            displayTileEditorPropertyPanel();
        }
    });
    return rows;
}

mainCanvas.addEventListener('mousemove', function () {
    if (!editingState.isEditing || !isMouseDown()) {
        return;
    }
    const state = getState();
    const [x, y] = getMousePosition(mainCanvas, CANVAS_SCALE);
    switch(editingState.tool) {
        case 'select':
            onMouseMoveSelect(state, editingState, x, y);
            break;
        case 'brush':
            if (isKeyboardKeyDown(KEY.SHIFT) && editingState.dragOffset) {
                updateBrushSelection(x, y);
            } else {
                drawBrush(x, y);
            }
            break;
    }
});
mainCanvas.addEventListener('mousedown', function (event) {
    if (event.which !== 1) {
        return;
    }
    if (!editingState.isEditing) {
        return;
    }
    const state = getState();
    const [x, y] = getMousePosition(mainCanvas, CANVAS_SCALE);
    switch(editingState.tool) {
        case 'select':
            onMouseDownSelect(state, editingState, x, y);
            break;
        case 'boss':
        case 'enemy':
        case 'object':
            onMouseDownObject(state, editingState, x, y);
            break;
        case 'brush':
            if (isKeyboardKeyDown(KEY.SHIFT)) {
                editingState.dragOffset = {x, y};
                updateBrushSelection(x, y);
            } else {
                drawBrush(x, y);
            }
            break;
        case 'replace':
            replaceTiles(x, y);
            break;
    }
});
document.addEventListener('mouseup', () => {
    editingState.dragOffset = null;
});

function deleteTile(x: number, y: number): void {
    const state = getState();
    const ty = Math.floor((state.camera.y + y) / 16);
    const tx = Math.floor((state.camera.x + x) / 16);
    const area = state.areaInstance;
    if (editingState.selectedLayerKey) {
        deleteTileFromLayer(tx, ty, area, area.layers.find(layer => layer.key === editingState.selectedLayerKey));
    } else {
        for (const layer of area.layers) {
            deleteTileFromLayer(tx, ty, area, layer);
        }
    }
    area.tilesDrawn[ty][tx] = false;
    area.checkToRedrawTiles = true;
    resetTileBehavior(area, {x: tx, y: ty});
}
function deleteTileFromLayer(tx: number, ty: number, area: AreaInstance, layer: AreaLayer): void {
    const definition = area.definition;
    const layerDefinition = layer.definition;
    const tiles = layerDefinition.grid.tiles;
    if (tx < 0 || tx > tiles[0].length - 1 || ty < 0 || ty > tiles.length - 1) {
        return;
    }
    if (layerDefinition.mask?.tiles?.[ty]?.[tx]) {
        layerDefinition.mask.tiles[ty][tx] = null;
        layer.maskTiles[ty][tx] = null;
    }
    if (!definition.isSpiritWorld) {
        // In the physical world we just replace tiles with the empty tile.
        layer.originalTiles[ty][tx] = layer.tiles[ty][tx] = null;
        tiles[ty][tx] = 0;
        applyTileChangeToSpiritWorld(area.alternateArea, layerDefinition, tx, ty, allTiles[0]);
    } else {
        // Clear the tile definition in the spirit world.
        tiles[ty][tx] = 0;
        // And set the instance to use the tile from the parent definition.
        const parentLayer = definition.parentDefinition?.layers?.find(layer => layer.key === editingState.selectedLayerKey);
        if (parentLayer) {
            layer.originalTiles[ty][tx] = layer.tiles[ty][tx] = allTiles[parentLayer.grid.tiles[ty][tx]];
        }
    }
}

function getSelectionBounds(state: GameState, x1: number, y1: number, x2: number, y2: number): {L: number, R: number, T: number, B: number} {
    const layerDefinition = state.areaInstance.definition.layers[0];
    const tx1 = Math.floor((state.camera.x + x1) / 16);
    const ty1 = Math.floor((state.camera.y + y1) / 16);
    const tx2 = Math.floor((state.camera.x + x2) / 16);
    const ty2 = Math.floor((state.camera.y + y2) / 16);
    const L = Math.max(0, Math.min(tx1, tx2));
    const R = Math.min(layerDefinition.grid.w - 1, Math.max(tx1, tx2));
    const T = Math.max(0, Math.min(ty1, ty2));
    const B = Math.min(layerDefinition.grid.h - 1, Math.max(ty1, ty2));
    return {L, R, T, B};
}

function updateBrushSelection(x: number, y: number): void {
    const state = getState();
    const {L, R, T, B} = getSelectionBounds(state, editingState.dragOffset.x, editingState.dragOffset.y, x, y);
    const rectangle = {x: L, y: T, w: R - L + 1, h: B - T + 1};
    editingState.brush = {};
    if (editingState.selectedLayerKey) {
        const layerDefinition = state.areaInstance.definition.layers.find(layer => layer.key === editingState.selectedLayerKey);
        editingState.brush.none = getTileGridFromLayer(layerDefinition, rectangle);
    } else {
        for (const layerDefinition of state.areaInstance.definition.layers) {
            editingState.brush[layerDefinition.key] = getTileGridFromLayer(layerDefinition, rectangle);
        }
    }
    updateBrushCanvas(editingState.brush);
}

const layersInOrder = ['floor', 'floor2', 'field', 'field2', 'foreground', 'foreground2'];
function addNewLayer(state: GameState, layerKey: string, layerIndex: number) {
    const definition = state.areaInstance.definition;
    const alternateDefinition = state.alternateAreaInstance.definition;
    const topLayerDefinition = definition.layers[definition.layers.length - 1];
    const alternateTopLayerDefinition = alternateDefinition.layers[alternateDefinition.layers.length - 1];
    const layerDefinition: AreaLayerDefinition = {
        ...topLayerDefinition,
        drawPriority: layerKey.startsWith('foreground') ? 'foreground' : 'background',
        key: layerKey,
        grid: {
            ...topLayerDefinition.grid,
            tiles: [],
        },
    };
    initializeAreaLayerTiles(layerDefinition);
    definition.layers.splice(layerIndex, 0, layerDefinition);
    if (alternateDefinition.layers) {
        const alternateLayerDefinition: AreaLayerDefinition = {
            ...alternateTopLayerDefinition,
            drawPriority: layerKey.startsWith('foreground') ? 'foreground' : 'background',
            key: layerKey,
            grid: {
                ...alternateTopLayerDefinition.grid,
                tiles: [],
            },
        };
        initializeAreaLayerTiles(alternateLayerDefinition);
        alternateDefinition.layers.splice(layerIndex, 0, alternateLayerDefinition);
    }
}
function addMissingLayer(state: GameState, layerKey: string) {
    const layerIndex = layersInOrder.indexOf(layerKey);
    const definition = state.areaInstance.definition;
    for (let i = 0; i < definition.layers.length; i++) {
        if (layersInOrder.indexOf(definition.layers[i].key) > layerIndex) {
            return addNewLayer(state, layerKey, i);
        }
    }
    return addNewLayer(state, layerKey, definition.layers.length);
}
function drawBrush(targetX: number, targetY: number): void {
    const state = getState();
    const sampleGrid = Object.values(editingState.brush)[0];
    const sx = Math.floor((state.camera.x + targetX + 8) / 16 - sampleGrid.w / 2);
    const sy = Math.floor((state.camera.y + targetY + 8) / 16 - sampleGrid.h / 2);
    let area = state.areaInstance;
    // If no layer is currently selected, iterate over the brush contents
    // and add any missing layers necessary to complete the draw operation
    // before we attempt to draw.
    if (!editingState.selectedLayerKey) {
        let addedNewLayer = false;
        for (let layerKey in editingState.brush) {
            if (layerKey === 'none') {
                const brushGrid = editingState.brush.none;
                for (let y = 0; y < brushGrid.h; y++) {
                    for (let x = 0; x < brushGrid.w; x++) {
                        const tile = brushGrid.tiles[y][x];
                        let fullTile = allTiles[tile];
                        const defaultLayer = fullTile ? (fullTile.behaviors?.defaultLayer || 'floor') : 'field';
                        if (!area.definition.layers.find(layer => layer.key === defaultLayer)) {
                            addMissingLayer(state, defaultLayer);
                            addedNewLayer = true;
                        }
                    }
                }
            } else {
                if (!area.definition.layers.find(layer => layer.key === layerKey)) {
                    addMissingLayer(state, layerKey);
                    addedNewLayer = true;
                }
            }
        }
        if (addedNewLayer) {
            // Calling this will instantiate the area again and place the player back in their current location.
            enterLocation(state, state.location);
            area = state.areaInstance;
            displayTileEditorPropertyPanel();
        }
    }
    for (const layer of area.layers) {
        const layerDefinition = layer.definition;
        const parentLayer = area.definition.parentDefinition?.layers?.find(parentLayer => parentLayer.key === layer.key);
        // When a layer is selected, only draw to it.
        if (editingState.selectedLayerKey && layer.key !== editingState.selectedLayerKey) {
            continue;
        }
        let brushGrid = editingState.brush[layerDefinition.key];
        if (editingState.selectedLayerKey && !brushGrid) {
            // If a specific layer is selected, apply the 'none' brush to it.
            brushGrid = editingState.brush.none;
            if (!brushGrid) {
                continue;
            }
        } else if (!brushGrid) {
            brushGrid = editingState.brush.none;
            if (!brushGrid) {
                continue;
            }
            for (let y = 0; y < brushGrid.h; y++) {
                const row = sy + y;
                if (row < 0 || row >= layerDefinition.grid.tiles.length) {
                    continue;
                }
                const tileRow = layerDefinition.grid.tiles[row];
                for (let x = 0; x < brushGrid.w; x++) {
                    const column = sx + x;
                    if (column < 0 || column >= tileRow.length) {
                        continue;
                    }
                    const tile = brushGrid.tiles[y][x];
                    let fullTile = allTiles[tile];
                    const defaultLayer = fullTile ? (fullTile.behaviors?.defaultLayer || 'floor') : 'field';
                    // Only apply tiles to their default layer when a specific layer isn't selected.
                    if (defaultLayer !== layer.key) {
                        continue;
                    }
                    paintSingleTile(area, layer, parentLayer, column, row, tile);
                }
            }
            continue;
        }
        for (let y = 0; y < brushGrid.h; y++) {
            const grid = layerDefinition.grid;
            const row = sy + y;
            if (row < 0 || row >= grid.h) {
                continue;
            }
            for (let x = 0; x < brushGrid.w; x++) {
                const column = sx + x;
                if (column < 0 || column >= grid.w) {
                    continue;
                }
                const tile = brushGrid.tiles[y][x];
                paintSingleTile(area, layer, parentLayer, column, row, tile);
            }
        }
    }
}
function paintSingleTile(area: AreaInstance, layer: AreaLayer, parentDefinition: AreaLayerDefinition, x: number, y: number, tile: number) {
    if (!layer) {
        return;
    }
    editingState.hasChanges = true;
    let fullTile = allTiles[tile];
    // If this tile was erased, replace it with the tile dictated by the parent definition if there is one.
    if (!fullTile && parentDefinition) {
        const parentTile = allTiles[parentDefinition.grid?.tiles[y][x]];
        // Tiles with linked offsets map to different tiles than the parent definition.
        const linkedOffset = parentTile?.behaviors?.linkedOffset || 0;
        fullTile = linkedOffset ? allTiles[parentTile.index + linkedOffset] : parentTile;
    }
    if (fullTile?.behaviors?.maskFrame) {
        if (!layer.definition.mask) {
            layer.definition.mask = {
                w: layer.definition.grid.w,
                h: layer.definition.grid.h,
                tiles: [],
            };
        }
        layer.definition.mask.tiles[y] = layer.definition.mask.tiles[y] || [];
        layer.definition.mask.tiles[y][x] = tile;
        layer.maskTiles = layer.maskTiles || [];
        layer.maskTiles[y] = layer.maskTiles[y] || [];
        layer.maskTiles[y][x] = fullTile;
        // console.log(layer.key, layer.tiles[y][x], layer.maskTiles[y][x]);
    } else {
        layer.definition.grid.tiles[y][x] = tile;
        layer.tiles[y][x] = fullTile;
        layer.originalTiles[y][x] = fullTile;
    }
    applyTileChangeToSpiritWorld(area.alternateArea, layer.definition, x, y, fullTile);
    if (area.tilesDrawn[y]?.[x]) {
        area.tilesDrawn[y][x] = false;
    }
    area.checkToRedrawTiles = true;
    resetTileBehavior(area, {x, y});
}
function replaceTiles(x: number, y: number): void {
    const state = getState();
    const layer = editingState.selectedLayerKey
        ? state.areaInstance.layers.find(layer => layer.key === editingState.selectedLayerKey)
        : (
            state.areaInstance.layers.find(l => l.key === 'field')
            || state.areaInstance.layers[state.areaInstance.layers.length - 1]
        );
    const parentLayer = state.areaInstance.definition.parentDefinition?.layers?.find(l => l.key === layer.key)
    const w = 16, h = 16;
    const tile = layer.tiles[((state.camera.y + y) / h) | 0]?.[((state.camera.x + x) / w) | 0];
    const replacement: number = editingState.brush.none.tiles[0][0];
    for (let y = 0; y < layer.tiles.length; y++) {
        for (let x = 0; x < layer.tiles[y].length; x++) {
            const t = layer.tiles[y][x];
            if (t === tile && Math.random() <= editingState.replacePercentage / 100) {
                paintSingleTile(state.areaInstance, layer, parentLayer, x, y, replacement);
            }
        }
    }
}
// Apply a tile change to the spirit world if it doesn't have its own tile definition (the tile is null).
function applyTileChangeToSpiritWorld(area: AreaInstance, parentDefinition: AreaLayerDefinition, x: number, y: number, tile: FullTile): void {
    const layerDefinition = area.definition.layers.find(layer => layer.key === parentDefinition.key);
    if (!area.definition.isSpiritWorld || !layerDefinition) {
        return;
    }
    if (layerDefinition.grid.tiles[y][x]) {
        return;
    }
    const areaLayer = area.layers.find(layer => layer.definition === layerDefinition);
    paintSingleTile(area, areaLayer, parentDefinition, x, y, 0);
}

export function renderEditor(context: CanvasRenderingContext2D, state: GameState): void {
    if (!editingState.isEditing) {
        return;
    }
    // Unselect objects that are no longer in the current area.
    if (editingState.selectedObject?.id && !state.areaInstance.definition.objects.find(o => o === editingState.selectedObject)) {
        unselectObject(editingState);
    }
    renderEditorArea(context, state, state.areaInstance);
    if (state.nextAreaInstance) {
        renderEditorArea(context, state, state.nextAreaInstance);
    }
    renderZoneEditor(context, state, editingState);
}


function getTileGridFromLayer(layerDefinition: AreaLayerDefinition, rectangle: Rect): TileGridDefinition {
    const gridDefinition: TileGridDefinition = {
        tiles: [],
        w: rectangle.w,
        h: rectangle.h
    }
    for (let y = 0; y < gridDefinition.h; y++) {
        gridDefinition.tiles[y] = [];
        for (let x = 0; x < gridDefinition.w; x++) {
            gridDefinition.tiles[y][x] = layerDefinition.grid.tiles[rectangle.y + y][rectangle.x + x];
        }
    }
    return gridDefinition;
}

export function selectSection() {
    const state = getState();
    editingState.brush = {};
    if (editingState.selectedLayerKey) {
        const layerDefinition = state.areaInstance.definition.layers.find(l => l.key === editingState.selectedLayerKey);
        editingState.brush = {
            none: getTileGridFromLayer(layerDefinition, state.areaSection),
        };
    } else {
        for (const layer of state.areaInstance.definition.layers) {
            editingState.brush[layer.key] = getTileGridFromLayer(layer, state.areaSection);
        }
    }
    updateBrushCanvas(editingState.brush);
}

function renderEditorArea(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance): void {
    const [x, y] = getMousePosition(mainCanvas, CANVAS_SCALE);
    context.save();
        translateContextForAreaAndCamera(context, state, area);
        context.globalAlpha = 0.6;
        for (const object of area.definition.objects) {
            const instance = createObjectInstance(state, object);
            context.save();
                context.globalAlpha *= 0.3;
                context.fillStyle = instance.previewColor || 'blue';
                const hitbox = instance?.getHitbox(state) || {x: instance.x, y: instance.y, w: 16, h: 16};
                context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
            context.restore();
            if (instance.renderPreview) {
                instance.renderPreview(context, instance.getHitbox(state));
            } else {
                instance.area = area;
                instance.status = 'normal';
                instance.render(context, state);
            }
            // drawFrame(context, frame, {...frame, x: object.x - (frame.content?.x || 0), y: object.y - (frame.content?.y || 0)});
            // While editing, draw the loot inside the chest/boss on top as well.
            if (object.type === 'bigChest' || object.type === 'chest' || object.type === 'boss') {
                const frame = getLootFrame(state, object);
                drawFrame(context, frame, {...frame, x: object.x - (frame.content?.x || 0), y: object.y - (frame.content?.y || 0)});
            }
        }
        // Tool previews are only drawn for the current area.
        if (area === state.areaInstance) {
            if (editingState.tool === 'brush') {
                const w = 16, h = 16;
                if (isKeyboardKeyDown(KEY.SHIFT)) {
                    let x1 = x, y1 = y;
                    if (isMouseDown() && editingState.dragOffset) {
                        x1 = editingState.dragOffset.x;
                        y1 = editingState.dragOffset.y;
                    }
                    const {L, R, T, B} = getSelectionBounds(state, x1, y1, x, y);
                    context.lineWidth = 2;
                    context.strokeStyle = 'white';
                    context.strokeRect(L * w, T * h, (R - L + 1) * w, (B - T + 1) * h);
                } else {
                    const firstBrushGrid = Object.values(editingState.brush)[0];
                    // Erase existing layers so we can draw an accurate preview.
                    const rectangle = {
                        x: Math.floor((state.camera.x + x + 8) / w - firstBrushGrid.w / 2),
                        y: Math.floor((state.camera.y + y + 8) / h - firstBrushGrid.h / 2),
                        w: firstBrushGrid.w,
                        h: firstBrushGrid.h,
                    };
                    context.clearRect(rectangle.x * 16, rectangle.y * 16, rectangle.w * 16, rectangle.h * 16);

                    // Create the combined set of layer + brush keys for building the preview.
                    const allLayerKeys = state.areaInstance.layers.map(l => l.key);
                    // Include extra layer keys. Eventually painting will add extra layers if they are on the brush.
                    for (let key in editingState.brush) {
                        if (key !== 'none' && !allLayerKeys.includes(key)) {
                            allLayerKeys.push(key);
                        }
                    }
                    // If the default brush layer is used and no layer is selected, add all the default layer keys.
                    if (editingState.brush.none && !editingState.selectedLayerKey) {
                        if (!allLayerKeys.includes('floor')) {
                            allLayerKeys.push('floor');
                        }
                        if (!allLayerKeys.includes('field')) {
                            allLayerKeys.push('field');
                        }
                        if (!allLayerKeys.includes('foreground')) {
                            allLayerKeys.push('foreground');
                        }
                    }
                    const selectedLayer = state.areaInstance.definition.layers.find(l => l.key === editingState.selectedLayerKey);
                    // Draw background layers, then foreground layers.
                    for (const priorityToDraw of ['background', 'foreground']) {
                        for (const layerKey of allLayerKeys) {
                            const currentLayer = state.areaInstance.definition.layers.find(l => l.key === layerKey);
                            const parentLayer = state.areaInstance.definition.parentDefinition?.layers?.find(l => l.key === layerKey);
                            let brush: TileGridDefinition = null, defaultBrush: TileGridDefinition = null;
                            if (currentLayer && currentLayer === selectedLayer) {
                                brush = editingState.brush[layerKey] || editingState.brush.none;
                            } else {
                                brush = editingState.brush[layerKey];
                                // Default brush is only used when no layers are selected.
                                if (!selectedLayer) {
                                    defaultBrush = editingState.brush.none;
                                }
                            }
                            if (selectedLayer && currentLayer !== selectedLayer) {
                                context.globalAlpha = 0.5;
                            } else {
                                if (currentLayer?.visibilityOverride === 'fade') {
                                    context.globalAlpha = 0.3;
                                } else {
                                    context.globalAlpha = 1;
                                }
                            }
                            let drawPriority = currentLayer?.drawPriority || brush?.drawPriority || (layerKey === 'foreground' ? 'foreground' : 'background');
                            if (drawPriority === priorityToDraw) {
                                drawBrushLayerPreview(
                                    context,
                                    state,
                                    layerKey,
                                    currentLayer,
                                    parentLayer,
                                    brush,
                                    defaultBrush,
                                    rectangle,
                                );
                            }
                        }
                    }
                }
            }
            context.globalAlpha = 0.6;
            if (editingState.tool === 'select' && state.areaInstance.definition.objects.includes(editingState.selectedObject)) {
                const instance = createObjectInstance(state, editingState.selectedObject);
                let target: Rect;
                if (instance.getEditorHitbox) {
                    target = instance.getEditorHitbox(state);
                } else if(instance.getHitbox) {
                    target = instance.getHitbox(state);
                } else {
                    const frame = getObjectFrame(editingState.selectedObject);
                    target = {
                        x: editingState.selectedObject.x + (frame.content?.x || 0) - 1,
                        y: editingState.selectedObject.y + (frame.content?.y || 0) - 1,
                        w: (frame.content?.w || frame.w) + 2,
                        h: (frame.content?.h || frame.h) + 2,
                    };
                }
                context.fillStyle = 'white';
                context.fillRect(target.x, target.y, target.w, target.h);
            }
            if (['object', 'enemy', 'boss'].includes(editingState.tool)) {
                renderObjectPreview(context, state, editingState, x, y);
            }
        }
    context.restore();
}


function drawBrushLayerPreview(
    context: CanvasRenderingContext2D,
    state: GameState,
    // The key of the layer being drawn, needed in case the actual layer does not exist.
    layerKey: string,
    layer: AreaLayerDefinition | null,
    parentLayer: AreaLayerDefinition | null,
    brush: TileGridDefinition | null,
    defaultBrush: TileGridDefinition | null,
    rectangle: Rect,
): void {
    const w = 16, h = 16;
    for (let y = 0; y < rectangle.h; y++) {
        const ty = rectangle.y + y;
        if (ty < 0 || ty >= 32) continue;
        for (let x = 0; x < rectangle.w; x++) {
            const tx = rectangle.x + x;
            if (tx < 0 || tx >= 32) continue;
            let tile = null;
            // The brush is used if it is defined.
            if (brush) {
                tile = allTiles[brush.tiles[y][x]];
            } else if (defaultBrush) {
                // If no brush is defined, check if the default brush applies, otherwise use the existing
                // layer tile if present.
                const defaultTile = allTiles[defaultBrush.tiles[y][x]];
                const defaultLayer = defaultTile ? (defaultTile.behaviors?.defaultLayer ?? 'floor') : 'field';
                if (defaultLayer === layerKey) {
                    tile = defaultTile;
                } else if (layer) {
                    tile = allTiles[layer.grid.tiles[ty][tx]];
                }
            }else if (layer) {
                // If there is no brush or default brush just use the existing layer tile if present
                tile = allTiles[layer.grid.tiles[ty][tx]];
            }
            if (!tile && parentLayer) {
                const parentTile = allTiles[parentLayer.grid?.tiles[ty][tx]];
                // Tiles with linked offsets map to different tiles than the parent definition.
                const linkedOffset = parentTile?.behaviors?.linkedOffset || 0;
                tile = linkedOffset ? allTiles[parentTile.index + linkedOffset] : parentTile;
            }
            if (tile) {
                context.save();
                if (tile.behaviors?.editorTransparency) {
                    context.globalAlpha *= tile.behaviors.editorTransparency;
                }
                drawFrame(context, tile.frame, {x: tx * w, y: ty * h, w, h});
                context.restore();
            }
        }
    }
}

document.addEventListener('keydown', function(event: KeyboardEvent) {
    if (!editingState.isEditing) {
        return;
    }
    if (event.repeat) {
        return;
    }
    // Don't process keys if an input is targeted, otherwise we prevent typing in
    // the input.
    if ((event.target as HTMLElement).closest('input')
        || (event.target as HTMLElement).closest('textarea')
        || (event.target as HTMLElement).closest('select')) {
        return;
    }
    if (event.which === KEY.BACK_SPACE) {
        const state = getState();
        if (editingState.tool === 'brush') {
            const [x, y] = getMousePosition(mainCanvas, CANVAS_SCALE);
            deleteTile(x, y);
        } else if (state.areaInstance.definition.objects.includes(editingState.selectedObject)) {
            deleteObject(state, editingState.selectedObject);
            unselectObject(editingState);
        }
    }
    if (event.which === KEY.ESCAPE) {
        if (editingState.selectedObject) {
            unselectObject(editingState);
        }
        if (editingState.tool === 'select') {
            setEditingTool(editingState.previousTool);
        }
    }
});

function performGlobalTileReplacement(oldPalette: TilePalette, newPalette: TilePalette): void {
    const map: number[] = [];
    for (let y = 0; y < oldPalette.length; y++) {
        for (let x = 0; x < oldPalette[y].length; x++) {
            map[oldPalette[y][x]] = newPalette[y][x];
        }
    }
    for (let zoneKey in zones) {
        const zone = zones[zoneKey];
        let changed = false;
        for (const floor of zone.floors) {
            for (const grid of [floor.grid, floor.spiritGrid]) {
                if (!grid) continue;
                for (const areaRow of grid) {
                    for (const area of areaRow) {
                        if (!area?.layers) continue;
                        for (const layer of area.layers) {
                            for (const tileRow of layer.grid.tiles) {
                                for (let x = 0; x < tileRow.length; x++) {
                                    if (map[tileRow[x]]) {
                                        console.log(tileRow[x] + ' => ' + map[tileRow[x]]);
                                        tileRow[x] = map[tileRow[x]];
                                        changed = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        if (changed) {
            console.log('Updated' + zone.key);
            const state = getState();
            if (state.location.zoneKey !== zoneKey) {
                state.location.zoneKey = zoneKey;
                state.location.floor = 0;
                enterLocation(state, state.location);
                displayTileEditorPropertyPanel();
            }
            return;
        }
    }
}
window['performGlobalTileReplacement'] = performGlobalTileReplacement;


function fixMismatchedLayers(): void {
    for (let zoneKey in zones) {
        const zone = zones[zoneKey];
        let changed = false;
        for (const floor of zone.floors) {
            for (let row = 0; row < floor.grid.length; row++) {
                for (let column = 0; column < floor.grid[row].length; column++) {
                    const area = floor.grid[row][column];
                    const spiritArea = floor.spiritGrid[row][column];
                    if (!spiritArea?.layers) {
                        continue;
                    }
                    spiritArea.layers = area.layers.map(layer => {
                        const spiritLayer = spiritArea.layers.find(spiritLayer => spiritLayer.key === layer.key);
                        if (spiritLayer) {
                            return spiritLayer;
                        }
                        changed = true;
                        return initializeAreaLayerTiles({
                            key: layer.key,
                            grid: {
                                ...layer.grid,
                                // The matrix of tiles
                                tiles: [],
                            },
                        });
                    });
                }
            }
        }
        if (changed) {
            console.log('Updated' + zone.key);
            const state = getState();
            if (state.location.zoneKey !== zoneKey) {
                state.location.zoneKey = zoneKey;
                state.location.floor = 0;
                enterLocation(state, state.location);
                displayTileEditorPropertyPanel();
            }
            return;
        }
    }
}
window['fixMismatchedLayers'] = fixMismatchedLayers;

