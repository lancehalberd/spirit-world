import _ from 'lodash';

import {
    applyLayerToBehaviorGrid,
    initializeAreaLayerTiles, resetTileBehavior,
    enterLocation,
} from 'app/content/areas';
import { bossTypes, enemyTypes } from 'app/content/enemy';
import { palettes } from 'app/content/palettes';
import { getLootFrame } from 'app/content/lootObject';
import { createObjectInstance } from 'app/content/objects';
import {
    createObjectDefinition,
    deleteObject,
    getObjectFrame,
    getObjectProperties,
    onMouseDownObject, onMouseDownSelect,
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
    AreaInstance, AreaLayerDefinition, BossObjectDefinition,  EnemyObjectDefinition, EnemyType,
    Frame, GameState,
    ObjectDefinition,
    PanelRows, PropertyRow, ShortRectangle, Tile, TileGrid,
} from 'app/types';

type EditorToolType = 'brush' | 'delete' | 'object' | 'enemy' | 'boss' | 'replace' | 'select';
export interface EditingState {
    tool: EditorToolType,
    isEditing: boolean,
    brush: TileGrid,
    selectedLayerIndex: number,
    replacePercentage: number,
    selectedObject?: ObjectDefinition,
    showZoneProperties: boolean,
    showFieldProperties: boolean,
    showInventoryProperties: boolean,
    showProgressProperties: boolean,
    spirit: boolean,
    dragOffset: {x: number, y: number},
}

export const editingState: EditingState = {
    tool: 'select',
    isEditing: false,
    brush: null,
    // Default editing the field, not the floor.
    selectedLayerIndex: 1,
    replacePercentage: 100,
    selectedObject: null,
    showZoneProperties: false,
    showFieldProperties: true,
    showInventoryProperties: false,
    showProgressProperties: false,
    spirit: false,
    dragOffset: {x: 0, y: 0},
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
    const area = state.areaInstance.definition;
    const layer = area.layers[editingState.selectedLayerIndex];
    const palette = palettes[layer.grid.palette];
    if (!editingState.brush) {
        editingState.brush = {
            // The dimensions of the grid.
            w: 1,
            h: 1,
            // The palette to use for this grid (controls the size of tiles)
            palette,
            // The matrix of tiles
            tiles: [[_.sample(palette.defaultTiles)]],
        }
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
    state.areaInstance.tilesDrawn = [];
    state.areaInstance.checkToRedrawTiles = true;
}

export function displayTileEditorPropertyPanel() {
    const state = getState();
    if (editingState.selectedLayerIndex >= state.areaInstance.layers.length) {
        editingState.selectedLayerIndex = 0;
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
    const selectedPaletteKey = state.areaInstance.layers[editingState.selectedLayerIndex].definition.grid.palette;
    if (!editingState.showFieldProperties) {
        return rows;
    }
    for (let i = 0; i < state.areaInstance.layers.length; i++) {
        const layer = state.areaInstance.layers[i];
        const row: PropertyRow = [
        {
            name: '',
            id: `layer-${i}-key`,
            value: layer.key,
            onChange(key: string) {
                layer.key = key
                layer.definition.key = key;
                // editingState.selectedLayerIndex = i;
                displayTileEditorPropertyPanel();
            },
        }];
        if (i > 0) {
            row.push({
                name: '^',
                id: `layer-${i}-up`,
                onClick() {
                    state.areaInstance.layers[i] = state.areaInstance.layers[i - 1];
                    state.areaInstance.definition.layers[i] = state.areaInstance.definition.layers[i - 1];
                    state.areaInstance.layers[i - 1] = layer;
                    state.areaInstance.definition.layers[i - 1] = layer.definition;
                    state.areaInstance.tilesDrawn = [];
                    state.areaInstance.checkToRedrawTiles = true;
                    if (editingState.selectedLayerIndex === i - 1) {
                        editingState.selectedLayerIndex = i;
                    } else if (editingState.selectedLayerIndex === i) {
                        editingState.selectedLayerIndex = i - 1;
                    }
                    displayTileEditorPropertyPanel();
                },
            });
        }
        if (i < state.areaInstance.layers.length - 1) {
            row.push({
                name: 'v',
                id: `layer-${i}-down`,
                onClick() {
                    state.areaInstance.layers[i] = state.areaInstance.layers[i + 1];
                    state.areaInstance.definition.layers[i] = state.areaInstance.definition.layers[i + 1];
                    state.areaInstance.layers[i + 1] = layer;
                    state.areaInstance.definition.layers[i + 1] = layer.definition;
                    state.areaInstance.tilesDrawn = [];
                    state.areaInstance.checkToRedrawTiles = true;
                    if (editingState.selectedLayerIndex === i + 1) {
                        editingState.selectedLayerIndex = i;
                    } else if (editingState.selectedLayerIndex === i) {
                        editingState.selectedLayerIndex = i + 1;
                    }
                    displayTileEditorPropertyPanel();
                },
            });
        }
        if (editingState.selectedLayerIndex !== i) {
            row.unshift({
                name: '>',
                id: `layer-${i}-select`,
                onClick() {
                    editingState.selectedLayerIndex = i;
                    state.areaInstance.tilesDrawn = [];
                    state.areaInstance.checkToRedrawTiles = true;
                    displayTileEditorPropertyPanel();
                }
            })
        } else {
            row.unshift('**');
        }
        rows.push(row);
    }
    rows.push({
        name: 'Add Layer',
        onClick() {
            const definition = state.areaInstance.definition;
            const alternateDefinition = state.alternateAreaInstance.definition;
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
            alternateDefinition.layers.push(layerDefinition);
            state.areaInstance.layers.push({
                definition: layerDefinition,
                ...layerDefinition,
                ...layerDefinition.grid,
                tiles: _.cloneDeep(layerDefinition.grid.tiles),
                originalTiles: _.cloneDeep(layerDefinition.grid.tiles),
                palette: palettes[layerDefinition.grid.palette],
            });
            state.alternateAreaInstance.layers.push({
                definition: alternateLayerDefinition,
                ...alternateLayerDefinition,
                ...alternateLayerDefinition.grid,
                tiles: _.cloneDeep(alternateLayerDefinition.grid.tiles),
                originalTiles: _.cloneDeep(alternateLayerDefinition.grid.tiles),
                palette: palettes[alternateLayerDefinition.grid.palette],
            });
            applyLayerToBehaviorGrid(state.areaInstance.behaviorGrid, layerDefinition,
                state.areaInstance.definition.isSpiritWorld ? null : alternateLayerDefinition);
            applyLayerToBehaviorGrid(state.alternateAreaInstance.behaviorGrid, alternateLayerDefinition,
                state.areaInstance.definition.isSpiritWorld ? layerDefinition : null);
            editingState.selectedLayerIndex = _.findIndex(state.areaInstance.layers, { key });
            state.areaInstance.tilesDrawn = [];
            state.alternateAreaInstance.tilesDrawn = [];
            state.areaInstance.checkToRedrawTiles = true;
            state.alternateAreaInstance.checkToRedrawTiles = true;
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
            value: selectedPaletteKey,
            values: Object.keys(palettes),
            onChange(key: string) {
                state.areaInstance.definition.layers[editingState.selectedLayerIndex].grid.palette = key;
                state.areaInstance.layers[editingState.selectedLayerIndex].palette = palettes[key];
                state.areaInstance.tilesDrawn = [];
                state.areaInstance.checkToRedrawTiles = true;
                displayTileEditorPropertyPanel();
            },
        });
        rows.push({
            name: 'brush',
            value: editingState.brush,
            palette: palettes[selectedPaletteKey],
            onChange(tiles: TileGrid) {
                editingState.brush = tiles;
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
            if (isKeyboardKeyDown(KEY.SHIFT)) {
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

function deleteTile(x: number, y: number): void {
    const state = getState();
    const palette = editingState.brush.palette;
    y = Math.floor((state.camera.y + y) / palette.h);
    x = Math.floor((state.camera.x + x) / palette.w);
    const area = state.areaInstance;
    const definition = area.definition;
    const layer = area.layers[editingState.selectedLayerIndex];
    const layerDefinition = definition.layers[editingState.selectedLayerIndex];
    const tiles = layerDefinition.grid.tiles;
    if (x < 0 || x > tiles[0].length - 1 || y < 0 || y > tiles.length - 1) {
        return;
    }
    if (!definition.isSpiritWorld) {
        // In the physical world we just replace tiles with the empty tile.
        layer.originalTiles[y][x] = layer.tiles[y][x] = tiles[y][x] = {x: 0, y: 0};
        applyTileChangeToSpiritWorld(area.alternateArea, editingState.selectedLayerIndex, x, y, {x: 0, y: 0});
    } else {
        // Clear the tile definition in the spirit world.
        tiles[y][x] = null;
        // And set the instance to use the tile from the parent definition.
        layer.originalTiles[y][x] = layer.tiles[y][x] =
            definition.parentDefinition.layers[editingState.selectedLayerIndex].grid.tiles[y][x];
    }
    area.tilesDrawn[y][x] = false;
    area.checkToRedrawTiles = true;
    resetTileBehavior(area, {x, y});
}

function getSelectionBounds(state: GameState, x1: number, y1: number, x2: number, y2: number): {L: number, R: number, T: number, B: number} {
    const layerDefinition = state.areaInstance.definition.layers[editingState.selectedLayerIndex];
    const palette = palettes[layerDefinition.grid.palette];
    const tx1 = Math.floor((state.camera.x + x1) / palette.w);
    const ty1 = Math.floor((state.camera.y + y1) / palette.h);
    const tx2 = Math.floor((state.camera.x + x2) / palette.w);
    const ty2 = Math.floor((state.camera.y + y2) / palette.h);
    const L = Math.max(0, Math.min(tx1, tx2));
    const R = Math.min(layerDefinition.grid.w - 1, Math.max(tx1, tx2));
    const T = Math.max(0, Math.min(ty1, ty2));
    const B = Math.min(layerDefinition.grid.h - 1, Math.max(ty1, ty2));
    return {L, R, T, B};
}

function updateBrushSelection(x: number, y: number): void {
    const state = getState();
    const layerDefinition = state.areaInstance.definition.layers[editingState.selectedLayerIndex];
    const {L, R, T, B} = getSelectionBounds(state, editingState.dragOffset.x, editingState.dragOffset.y, x, y);
    editingState.brush.w = R - L + 1;
    editingState.brush.h = B - T + 1;
    editingState.brush.tiles = [];
    for (let y = 0; y < editingState.brush.h; y++) {
        editingState.brush.tiles[y] = [];
        for (let x = 0; x < editingState.brush.w; x++) {
            editingState.brush.tiles[y][x] = layerDefinition.grid.tiles[T + y][L + x];
        }
    }
    updateBrushCanvas(editingState.brush);
}
function drawBrush(x: number, y: number): void {
    const state = getState();
    const palette = editingState.brush.palette;
    const sy = Math.floor((state.camera.y + y) / palette.h);
    const sx = Math.floor((state.camera.x + x) / palette.w);
    const area = state.areaInstance;
    const definition = area.definition;
    const layer = area.layers[editingState.selectedLayerIndex];
    const layerDefinition = definition.layers[editingState.selectedLayerIndex];
    for (let y = 0; y < editingState.brush.h; y++) {
        const row = sy + y;
        if (row < 0 || row >= layerDefinition.grid.tiles.length) {
            continue;
        }
        const tileRow = layerDefinition.grid.tiles[row];
        for (let x = 0; x < editingState.brush.w; x++) {
            const column = sx + x;
            if (column < 0 || column >= tileRow.length) {
                continue;
            }
            const tile = editingState.brush.tiles[y][x]
            tileRow[column] = tile;
            layer.tiles[row][column] = tile;
            layer.originalTiles[row][column] = tile;
            applyTileChangeToSpiritWorld(area.alternateArea, editingState.selectedLayerIndex, column, row, tile);
            state.areaInstance.tilesDrawn[row][column] = false;
            state.areaInstance.checkToRedrawTiles = true;
            resetTileBehavior(area, {x: column, y: row});
        }
    }
}
function replaceTiles(x: number, y: number): void {
    const state = getState();
    const layer = state.areaInstance.layers[editingState.selectedLayerIndex];
    const { w, h } = layer.palette;
    const tile = layer.tiles[((state.camera.y + y) / h) | 0]?.[((state.camera.x + x) / w) | 0];
    const replacement = editingState.brush.tiles[0][0];
    if (!tile) {
        return;
    }
    for (let y = 0; y < layer.tiles.length; y++) {
        for (let x = 0; x < layer.tiles[y].length; x++) {
            const t = layer.tiles[y][x];
            if (t.x === tile.x && t.y === tile.y && Math.random() <= editingState.replacePercentage / 100) {
                layer.definition.grid.tiles[y][x] = replacement;
                layer.tiles[y][x] = replacement;
                layer.originalTiles[y][x] = replacement;
                state.areaInstance.tilesDrawn[y][x] = false;
                state.areaInstance.checkToRedrawTiles = true;
                resetTileBehavior(state.areaInstance, {x, y});
                applyTileChangeToSpiritWorld(state.alternateAreaInstance, editingState.selectedLayerIndex, x, y, replacement);
            }
        }
    }
}
// Apply a tile change to the spirit world if it doesn't have its own tile definition (the tile is null).
function applyTileChangeToSpiritWorld(area: AreaInstance, layerIndex: number, x: number, y: number, tile: Tile): void {
    if (!area.definition.isSpiritWorld || !area.definition.layers[layerIndex]) {
        return;
    }
    if (area.definition.layers[layerIndex].grid.tiles[y][x]) {
        return;
    }
    area.layers[layerIndex].tiles[y][x] = tile;
    if (area.tilesDrawn[y]?.[x]) {
        area.tilesDrawn[y][x] = false;
    }
    area.checkToRedrawTiles = true;
    resetTileBehavior(area, {x, y});
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

export function selectSection() {
    const state = getState();
    const layerDefinition = state.areaInstance.definition.layers[editingState.selectedLayerIndex];
    editingState.brush.tiles = [];
    const L = state.areaSection.x;
    const T = state.areaSection.y;
    editingState.brush.w = state.areaSection.w;
    editingState.brush.h = state.areaSection.h;
    for (let y = 0; y < editingState.brush.h; y++) {
        editingState.brush.tiles[y] = [];
        for (let x = 0; x < editingState.brush.w; x++) {
            editingState.brush.tiles[y][x] = layerDefinition.grid.tiles[T + y][L + x];
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
                const palette = editingState.brush.palette;
                const {w, h} = palette;
                if (isKeyboardKeyDown(KEY.SHIFT)) {
                    let x1 = x, y1 = y;
                    if (isMouseDown()) {
                        x1 = editingState.dragOffset.x;
                        y1 = editingState.dragOffset.y;
                    }
                    const {L, R, T, B} = getSelectionBounds(state, x1, y1, x, y);
                    context.lineWidth = 2;
                    context.strokeStyle = 'white';
                    context.strokeRect(L * w, T * h, (R - L + 1) * w, (B - T + 1) * h);
                } else {
                    const sy = Math.floor((state.camera.y + y) / h);
                    const sx = Math.floor((state.camera.x + x) / w);
                    for (let y = 0; y < editingState.brush.h; y++) {
                        const ty = sy + y;
                        for (let x = 0; x < editingState.brush.w; x++) {
                            const tx = sx + x;
                            const tile = editingState.brush.tiles[y][x];
                            const frame: Frame = {
                                image: palette.source.image,
                                x: palette.source.x + tile.x * w,
                                y: palette.source.y + tile.y * h,
                                w, h
                            };
                            drawFrame(context, frame, {x: tx * w, y: ty * h, w, h});
                        }
                    }
                }
            }
            if (editingState.tool === 'select' && editingState.selectedObject?.id) {
                const instance = createObjectInstance(state, editingState.selectedObject);
                let target: ShortRectangle;
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
        if (editingState.selectedObject?.id) {
            deleteObject(getState(), editingState.selectedObject);
            unselectObject(editingState);
        }
    }
});

