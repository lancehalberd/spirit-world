import _ from 'lodash';

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
import { getLootFrame } from 'app/content/lootObject';
import { createObjectInstance } from 'app/content/objects';
import { allTiles } from 'app/content/tiles';
import { palettes } from 'app/content/palettes';
import { zones } from 'app/content/zones';
import {
    createObjectDefinition,
    deleteObject,
    getObjectFrame,
    getObjectProperties,
    onMouseDownObject,
    onMouseDownSelect,
    onMouseMoveSelect,
    renderObjectPreview,
    combinedObjectTypes,
    unselectObject,
} from 'app/development/objectEditor';
import {
    /*displayLeftPanel, */hideLeftPanel,
    displayPropertyPanel, hidePropertyPanel, updateBrushCanvas,
} from 'app/development/propertyPanel';
import { getZoneProperties, renderZoneEditor } from 'app/development/zoneEditor';
import { mainCanvas } from 'app/dom';
import { CANVAS_SCALE } from 'app/gameConstants';
import { KEY, isKeyboardKeyDown } from 'app/keyCommands';
import { translateContextForAreaAndCamera } from 'app/render';
import { updateHeroMagicStats } from 'app/render/spiritBar';
import { getState } from 'app/state';
import { drawFrame } from 'app/utils/animations';
import { getMousePosition, isMouseDown, /*isMouseOverElement*/ } from 'app/utils/mouse';

import {
    AreaInstance, AreaLayer, AreaLayerDefinition, BossObjectDefinition,
    DrawPriority,
    EnemyObjectDefinition, EnemyType,
    FullTile, GameState,
    ObjectDefinition,
    PanelRows, PropertyRow, Rect, TileGridDefinition, TilePalette,
} from 'app/types';

type EditorToolType = 'brush' | 'delete' | 'object' | 'enemy' | 'boss' | 'replace' | 'select';
export interface EditingState {
    tool: EditorToolType,
    isEditing: boolean,
    brush?: {[key: string]: TileGridDefinition},
    clipboardObject?: ObjectDefinition,
    paletteKey: string,
    selectedLayerKey?: string,
    replacePercentage: number,
    selectedObject?: ObjectDefinition,
    showZoneProperties: boolean,
    showFieldProperties: boolean,
    showInventoryProperties: boolean,
    showProgressProperties: boolean,
    spirit: boolean,
    dragOffset?: {x: number, y: number},
}

export const editingState: EditingState = {
    tool: 'select',
    isEditing: false,
    paletteKey: Object.keys(palettes)[0],
    // Default editing the field, not the floor.
    replacePercentage: 100,
    showZoneProperties: false,
    showFieldProperties: true,
    showInventoryProperties: false,
    showProgressProperties: false,
    spirit: false,
};
window['editingState'] = editingState;
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
        editingState.selectedObject = createObjectDefinition(state, editingState, {type: combinedObjectTypes[0]});
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
    hidePropertyPanel();
    hideLeftPanel();
    if (editingState.selectedLayerKey) {
        delete editingState.selectedLayerKey;
        enterLocation(state, state.location);
    }
    state.areaInstance.tilesDrawn = [];
    state.areaInstance.checkToRedrawTiles = true;
}

export function displayTileEditorPropertyPanel() {
    const state = getState();
    if (!state.areaInstance.definition.layers.find(layer => layer.key === editingState.selectedLayerKey)) {
        delete editingState.selectedLayerKey;
    }
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
    let rows: PanelRows = [];
    rows = [...rows, ...getZoneProperties(state, editingState)];
    rows.push(' ');
    rows.push(' ');
    rows.push(' ');
    rows = [...rows, ...getFieldProperties(state, editingState)];
    rows.push(' ');
    rows.push(' ');
    rows.push(' ');
    rows = [...rows, ...getInventoryProperties(state, editingState)];
    rows.push(' ');
    rows.push(' ');
    rows.push(' ');
    rows = [...rows, ...getProgressProperties(state, editingState)];
    displayPropertyPanel(rows);
}

function getFieldProperties(state: GameState, editingState: EditingState) {
    let rows: PanelRows = [];
    rows.push({
        name: editingState.showFieldProperties ? 'Layers -' : 'Layers +',
        onClick() {
            editingState.showFieldProperties = !editingState.showFieldProperties;
            displayTileEditorPropertyPanel();
        },
    });
    if (!editingState.showFieldProperties) {
        return rows;
    }
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
            values: ['auto', 'show', 'hide'],
            onChange(visibilityOverride: 'auto' | 'show' | 'hide') {
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
                    state.areaInstance.alternateArea.definition.layers.splice(i, 1);
                    enterLocation(state, state.location);
                    displayTileEditorPropertyPanel();
                },
            });
        }
        if (editingState.selectedLayerKey === definition.key) {
            rows.push(row);
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
                    state.areaInstance.alternateArea.definition.layers[i] = state.areaInstance.alternateArea.definition.layers[i - 1];
                    state.areaInstance.alternateArea.definition.layers[i - 1] = alternateDefinition;
                    enterLocation(state, state.location);
                    displayTileEditorPropertyPanel();
                },
            });
            rows.push(row);
            row = [{
                name: 'Logic',
                id: `layer-${i}-logic`,
                value: definition.logicKey || 'none',
                values: ['none', ...Object.keys(logicHash)],
                onChange(logicKey: string) {
                    if (logicKey === 'none') {
                        delete definition.logicKey;
                        delete alternateDefinition.logicKey;
                    } else {
                        definition.logicKey = logicKey;
                        if (alternateDefinition) {
                            alternateDefinition.logicKey = logicKey;
                        }
                    }
                    // Calling this will instantiate the area again and place the player back in their current location.
                    enterLocation(state, state.location);
                    displayTileEditorPropertyPanel();
                },
            }];
            row.push({
                name: 'v',
                id: `layer-${i}-down`,
                onClick() {
                    if (i >= state.areaInstance.definition.layers.length - 1) {
                        return;
                    }
                    state.areaInstance.definition.layers[i] = state.areaInstance.definition.layers[i + 1];
                    state.areaInstance.definition.layers[i + 1] = definition;
                    state.areaInstance.alternateArea.definition.layers[i] = state.areaInstance.alternateArea.definition.layers[i + 1];
                    state.areaInstance.alternateArea.definition.layers[i + 1] = alternateDefinition;
                    enterLocation(state, state.location);
                    displayTileEditorPropertyPanel();
                },
            });
        }
        rows.push(row);
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
            /*const alternateDefinition = state.alternateAreaInstance.definition;
            const key = 'layer-' + definition.layers.length;
            const topLayerDefinition = definition.layers[definition.layers.length - 1];
            const alternateTopLayerDefinition = alternateDefinition.layers[alternateDefinition.layers.length - 1];
            const layerDefinition: AreaLayerDefinition = {
                ...topLayerDefinition,
                key,
                grid: {
                    ...topLayerDefinition.grid,
                    // The matrix of tiles
                    tiles: [],
                },
            };
            const alternateLayerDefinition: AreaLayerDefinition = {
                ...alternateTopLayerDefinition,
                key,
                grid: {
                    ...alternateTopLayerDefinition.grid,
                    // The matrix of tiles
                    tiles: [],
                },
            };
            initializeAreaLayerTiles(layerDefinition);
            initializeAreaLayerTiles(alternateLayerDefinition);
            definition.layers.push(layerDefinition);
            alternateDefinition.layers.push(alternateLayerDefinition);*/
            // Calling this will instantiate the area again and place the player back in their current location.
            if (editingState.selectedLayerKey) {
                editingState.selectedLayerKey = key;
            }
            enterLocation(state, state.location);
            displayTileEditorPropertyPanel();
        }
    });
    rows.push({
        name: 'tool',
        value: editingState.tool,
        values: ['select', 'brush', 'delete', 'replace', 'object', 'enemy', 'boss'],
        onChange(tool: EditorToolType) {
            editingState.tool = tool;
            editingState.selectedObject = {
                ...editingState.selectedObject,
                id: null,
            };
            displayTileEditorPropertyPanel();
        },
    });
    switch (editingState.tool) {
        case 'brush':
            break;
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
        case 'enemy':
        case 'boss':
        case 'object':
        case 'select':
            rows = [...rows, ...getObjectProperties(state, editingState)];
            break;
        default:
            break;
    }
    if (editingState.tool !== 'object' && editingState.tool !== 'enemy' && editingState.tool !== 'boss') {
        rows.push({
            name: 'palette',
            value: editingState.paletteKey,
            values: Object.keys(palettes),
            onChange(key: string) {
                editingState.paletteKey = key;
                state.areaInstance.tilesDrawn = [];
                state.areaInstance.checkToRedrawTiles = true;
                displayTileEditorPropertyPanel();
            },
        });
        rows.push({
            name: 'brush',
            value: editingState.brush,
            palette: palettes[editingState.paletteKey],
            onChange(tiles: TileGridDefinition) {
                editingState.brush = {'none': tiles};
                updateBrushCanvas(editingState.brush);
                if (editingState.tool !== 'brush' && editingState.tool !== 'replace') {
                    editingState.tool = 'brush';
                    displayTileEditorPropertyPanel();
                }
            }
        });
    }
    return rows;
}

function getInventoryProperties(state: GameState, editingState: EditingState) {
    let rows: PanelRows = [];
    rows.push({
        name: editingState.showInventoryProperties ? 'Inventory -' : 'Inventory +',
        onClick() {
            editingState.showInventoryProperties = !editingState.showInventoryProperties;
            displayTileEditorPropertyPanel();
        },
    });
    if (editingState.showInventoryProperties) {
        rows.push([{
            name: 'life',
            value: state.hero.life || 1,
            onChange(value: number) {
                state.hero.life = value >= 1 ? value : 1;
                return state.hero.life;
            },
        }, {
            name: '/',
            value: state.hero.maxLife || 1,
            onChange(value: number) {
                state.hero.maxLife = value >= 1 ? value : 1;
                return state.hero.maxLife;
            },
        }]);
        rows.push([{
            name: 'magic',
            value: state.hero.maxMagic || 1,
            onChange(value: number) {
                state.hero.maxMagic = value >= 1 ? value : 1;
                return state.hero.maxMagic;
            },
        }, {
            name: 'regen',
            value: state.hero.magicRegen || 1,
            onChange(value: number) {
                state.hero.magicRegen = value >= 1 ? value : 1;
                return state.hero.magicRegen;
            },
        }]);
        let row: PropertyRow = [];
        function addTool(object, key) {
            row.push({
                name: key,
                value: object[key] || 0,
                onChange(value: number) {
                    object[key] = value;
                    updateHeroMagicStats(state);
                },
            });
            if (row.length === 2) {
                rows.push(row);
                row = [];
            }
        }
        addTool(state.hero, 'weapon');
        rows.push(row);
        row = [];
        for (let tool in state.hero.activeTools) {
            addTool(state.hero.activeTools, tool);
        }
        for (let tool in state.hero.passiveTools) {
            addTool(state.hero.passiveTools, tool);
        }
        for (let tool in state.hero.elements) {
            addTool(state.hero.elements, tool);
        }
        for (let tool in state.hero.equipment) {
            addTool(state.hero.equipment, tool);
        }
        if (row.length) {
            rows.push(row);
        }
    }
    return rows;
}

function getProgressProperties(state: GameState, editingState: EditingState) {
    let rows: PanelRows = [];
    rows.push({
        name: editingState.showProgressProperties ? 'Progress -' : 'Progress +',
        onClick() {
            editingState.showProgressProperties = !editingState.showProgressProperties;
            displayTileEditorPropertyPanel();
        },
    });
    if (editingState.showProgressProperties) {
        const setFlags = Object.keys(state.savedState.objectFlags);
        rows.push({
            name: 'flags',
            value: setFlags,
            values: setFlags,
            onChange(value: string[]) {
                for (const key of Object.keys(state.savedState.objectFlags)) {
                    if (value.indexOf(key) < 0) {
                        delete state.savedState.objectFlags[key];
                        state.location.x = state.hero.x;
                        state.location.y = state.hero.y;
                        // Calling this will instantiate the area again and place the player back in their current location.
                        enterLocation(state, state.location);
                        displayTileEditorPropertyPanel();
                        return;
                    }
                }
            }
        });
    }
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
        case 'delete':
            deleteTile(x, y);
            break;
    }
});
mainCanvas.addEventListener('mousedown', function () {
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
        case 'delete':
            deleteTile(x, y);
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
        const parentLayer = definition.parentDefinition?.layers.find(layer => layer.key === editingState.selectedLayerKey);
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
        key: layerKey,
        grid: {
            ...topLayerDefinition.grid,
            // The matrix of tiles
            tiles: [],
        },
    };
    const alternateLayerDefinition: AreaLayerDefinition = {
        ...alternateTopLayerDefinition,
        key: layerKey,
        grid: {
            ...alternateTopLayerDefinition.grid,
            // The matrix of tiles
            tiles: [],
        },
    };
    initializeAreaLayerTiles(layerDefinition);
    initializeAreaLayerTiles(alternateLayerDefinition);
    definition.layers.splice(layerIndex, 0, layerDefinition);
    alternateDefinition.layers.splice(layerIndex, 0, alternateLayerDefinition);
}
function addMissingLayer(state: GameState, layerKey: string) {
    const layerIndex = layersInOrder.indexOf(layerKey);
    const definition = state.areaInstance.definition;
    for (let i = 0; i < definition.layers.length; i++) {
        if (layersInOrder.indexOf(definition.layers[i].key) > layerIndex) {
            return addNewLayer(state, layerKey, i);
        }
    }
}
function drawBrush(x: number, y: number): void {
    const state = getState();
    const sy = Math.floor((state.camera.y + y) / 16);
    const sx = Math.floor((state.camera.x + x) / 16);
    const area = state.areaInstance;
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
    const parentLayer = state.areaInstance.definition.parentDefinition?.layers.find(l => l.key === layer.key)
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
    if (editingState.showZoneProperties) {
        renderZoneEditor(context, state, editingState);
    }
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
            instance.status = 'normal';
            instance.render(context, state);
            // drawFrame(context, frame, {...frame, x: object.x - (frame.content?.x || 0), y: object.y - (frame.content?.y || 0)});
            // While editing, draw the loot inside the chest/boss on top as well.
            if (object.type === 'bigChest' || object.type === 'chest' || object.type === 'boss') {
                const frame = getLootFrame(object);
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
                        x: Math.floor((state.camera.x + x) / w),
                        y: Math.floor((state.camera.y + y) / h),
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
                            const parentLayer = state.areaInstance.definition.parentDefinition?.layers.find(l => l.key === layerKey);
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
                                context.globalAlpha = 1;
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
                if (instance.getHitbox) {
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
                drawFrame(context, tile.frame, {x: tx * w, y: ty * h, w, h});
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
        if (state.areaInstance.definition.objects.includes(editingState.selectedObject)) {
            deleteObject(state, editingState.selectedObject);
            unselectObject(editingState);
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

