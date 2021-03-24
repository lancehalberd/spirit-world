import _ from 'lodash';

import {
    applyLayerToBehaviorGrid,
    initializeAreaLayerTiles, resetTileBehavior,
} from 'app/content/areas';
import { palettes } from 'app/content/palettes';
import { getLootFrame } from 'app/content/lootObject';
import { createObjectInstance } from 'app/content/objects';
import {
    deleteObject,
    getObjectFrame,
    getObjectProperties,
    getObjectTypeProperties,
    getSelectProperties,
    onMouseDownObject, onMouseDownSelect,
    onMouseMoveSelect,
    renderObjectPreview,
    combinedObjectTypes,
} from 'app/development/objectEditor';
import { displayPropertyPanel, hidePropertyPanel, updateBrushCanvas } from 'app/development/propertyPanel';
import { getZoneProperties, renderZoneEditor } from 'app/development/zoneEditor';
import { mainCanvas } from 'app/dom';
import { CANVAS_SCALE } from 'app/gameConstants';
import { KEY } from 'app/keyCommands';
import { translateContextForAreaAndCamera } from 'app/render';
import { getState, updateHeroMagicStats } from 'app/state';
import { drawFrame } from 'app/utils/animations';
import { getMousePosition, isMouseDown } from 'app/utils/mouse';

import {
    AreaInstance, AreaLayerDefinition, BossType, Direction,  EnemyType, GameState,
    LootType, MagicElement,
    ObjectDefinition, ObjectStatus, ObjectType,
    PanelRows, PropertyRow, ShortRectangle, Tile, TileGrid,
} from 'app/types';

type EditorToolType = 'brush' | 'delete' | 'object' | 'enemy' | 'boss' | 'replace' | 'select';
export interface EditingState {
    amount: number,
    tool: EditorToolType,
    isEditing: boolean,
    brush: TileGrid,
    direction: Direction,
    selectedLayerIndex: number,
    element?: MagicElement,
    bossType: BossType,
    enemyType: EnemyType,
    entranceTargetZone?: string,
    entranceTargetObjectId?: string,
    level: number,
    linked: boolean,
    lootType: LootType,
    message: string,
    objectStatus: ObjectStatus,
    objectType: ObjectType,
    replacePercentage: number,
    selectedObject?: ObjectDefinition,
    showZoneProperties: boolean,
    showFieldProperties: boolean,
    showInventoryProperties: boolean,
    spirit: boolean,
    style?: string,
    switchTargetObjectId?: string,
    timer: number,
    toggleOnRelease: boolean,
    dragOffset: {x: number, y: number},
}

export const editingState: EditingState = {
    amount: 1,
    tool: 'select',
    isEditing: false,
    brush: null,
    direction: 'up',
    // Default editing the field, not the floor.
    selectedLayerIndex: 1,
    element: null,
    bossType: 'beetleBoss',
    enemyType: 'snake',
    entranceTargetZone: null,
    entranceTargetObjectId: null,
    level: 0,
    linked: false,
    lootType: 'peachOfImmortalityPiece',
    message: '',
    objectStatus: 'normal',
    objectType: combinedObjectTypes[0],
    replacePercentage: 100,
    selectedObject: null,
    showZoneProperties: false,
    showFieldProperties: true,
    showInventoryProperties: false,
    spirit: false,
    style: null,
    switchTargetObjectId: null,
    timer: 0,
    toggleOnRelease: false,
    dragOffset: {x: 0, y: 0},
};
window['editingState'] = editingState;
export function toggleEditing() {
    const state = getState();
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
    displayTileEditorPropertyPanel();
    state.areaInstance.tilesDrawn = [];
    state.areaInstance.checkToRedrawTiles = true;
}

export function stopEditing(state: GameState) {
    hidePropertyPanel();
    state.areaInstance.tilesDrawn = [];
    state.areaInstance.checkToRedrawTiles = true;
}

export function displayTileEditorPropertyPanel() {
    const state = getState();
    if (editingState.selectedLayerIndex >= state.areaInstance.layers.length) {
        editingState.selectedLayerIndex = 0;
    }
    const selectedPaletteKey = state.areaInstance.layers[editingState.selectedLayerIndex].definition.grid.palette;
    let rows: PanelRows = [];
    rows = [...rows, ...getZoneProperties(state, editingState)];
    rows.push(' ');
    rows.push(' ');
    rows.push(' ');
    rows.push({
        name: editingState.showFieldProperties ? 'Layers -' : 'Layers +',
        onClick() {
            editingState.showFieldProperties = !editingState.showFieldProperties;
            displayTileEditorPropertyPanel();
        },
    });
    if (editingState.showFieldProperties) {
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
                displayTileEditorPropertyPanel();
            },
        });
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
                rows = [...rows, ...getObjectTypeProperties(state, editingState, {type: 'enemy'} as ObjectDefinition)];
                break;
            case 'boss':
                rows = [...rows, ...getObjectTypeProperties(state, editingState, {type: 'boss'} as ObjectDefinition)];
                break;
            case 'object':
                rows = [...rows, ...getObjectProperties(state, editingState)];
                break;
            case 'select':
                rows = [...rows, ...getSelectProperties(state, editingState)];
                break;
            default:
                break;
        }
    }
    rows.push(' ');
    rows.push(' ');
    rows.push(' ');
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
    displayPropertyPanel(rows);
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
            drawBrush(x, y);
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
            drawBrush(x, y);
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
        tiles[y][x] = {x: 0, y: 0};
        layer.tiles[y][x] = {x: 0, y: 0};
        applyTileChangeToSpiritWorld(area.alternateArea, editingState.selectedLayerIndex, x, y, {x: 0, y: 0});
    } else {
        // Clear the tile definition in the spirit world.
        tiles[y][x] = null;
        // And set the instance to use the tile from the parent definition.
        layer.tiles[y][x] =
            definition.parentDefinition.layers[editingState.selectedLayerIndex].grid.tiles[y][x];
    }
    area.tilesDrawn[y][x] = false;
    area.checkToRedrawTiles = true;
    resetTileBehavior(area, {x, y});
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
            return;
        }
        const tileRow = layerDefinition.grid.tiles[row];
        for (let x = 0; x < editingState.brush.w; x++) {
            const column = sx + x;
            if (column < 0 || column >= tileRow.length) {
                return;
            }
            const tile = editingState.brush.tiles[y][x]
            tileRow[column] = tile;
            layer.tiles[row][column] = tile;
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
    if (editingState.selectedObject && !state.areaInstance.definition.objects.find(o => o === editingState.selectedObject)) {
        editingState.selectedObject = null;
        displayTileEditorPropertyPanel();
    }
    renderEditorArea(context, state, state.areaInstance);
    if (state.nextAreaInstance) {
        renderEditorArea(context, state, state.nextAreaInstance);
    }
    if (editingState.showZoneProperties) {
        renderZoneEditor(context, state, editingState);
    }
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
            if (object.type === 'chest' || object.type === 'boss') {
                const frame = getLootFrame(object);
                drawFrame(context, frame, {...frame, x: object.x - (frame.content?.x || 0), y: object.y - (frame.content?.y || 0)});
            }
        }
        // These two are only drawn for the current area.
        if (area === state.areaInstance && editingState.tool === 'select' && editingState.selectedObject) {
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
        if (area === state.areaInstance && ['object', 'enemy', 'boss'].includes(editingState.tool)) {
            renderObjectPreview(context, state, editingState, x, y);
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
    if ((event.target as HTMLElement).closest('input')) {
        return;
    }
    if (event.which === KEY.BACK_SPACE) {
        if (editingState.selectedObject) {
            deleteObject(getState(), editingState.selectedObject);
            editingState.selectedObject = null;
        }
    }
});

