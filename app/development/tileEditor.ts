import _ from 'lodash';

import { palettes, setAreaSection } from 'app/content/areas';
import {
    deleteObject, getObjectFrame,
    getLootProperties, getSelectProperties,
    onMouseDownLoot, onMouseDownSelect,
    onMouseMoveSelect,
} from 'app/development/objectEditor';
import { displayPropertyPanel, hidePropertyPanel, updateBrushCanvas } from 'app/development/propertyPanel';
import { mainCanvas } from 'app/dom';
import { CANVAS_SCALE } from 'app/gameConstants';
import { KEY } from 'app/keyCommands';
import { getState } from 'app/state';
import { drawFrame } from 'app/utils/animations';
import { getMousePosition, isMouseDown } from 'app/utils/mouse';

import {
    EditorProperty, GameState,
    LootType, ObjectDefinition, PropertyRow, TileGrid,
} from 'app/types';

export interface EditingState {
    tool: 'select' | 'brush' | 'chest' | 'loot' | 'enemy' | 'object',
    isEditing: boolean,
    brush: TileGrid,
    selectedLayerIndex: number,
    newLootType?: LootType,
    selectedObject?: ObjectDefinition,
    dragOffset: {x: number, y: number},
}

export const editingState: EditingState = {
    tool: 'select',
    isEditing: false,
    brush: null,
    selectedLayerIndex: 0,
    newLootType: 'peachOfImmortalityPiece',
    selectedObject: null,
    dragOffset: {x: 0, y: 0},
};
window['editingState'] = editingState;
export function toggleEditing() {
    editingState.isEditing = !editingState.isEditing;
    if (editingState.isEditing) {
        startEditing();
    } else {
        stopEditing();
    }
}
export function startEditing() {
    const area = getState().areaInstance.definition;
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
}

export function stopEditing() {
    hidePropertyPanel();
}

const fullSection = {x: 0, y: 0, w: 32, h: 32};
const leftColumn = {x: 0, y: 0, w: 16, h: 32};
const rightColumn = {x: 16, y: 0, w: 16, h: 32};
const topRow = {x: 0, y: 0, w: 32, h: 16};
const bottomRow = {x: 0, y: 16, w: 32, h: 16};
const tlSection = {x: 0, y: 0, w: 16, h: 16};
const trSection = {x: 16, y: 0, w: 16, h: 16};
const blSection = {x: 0, y: 16, w: 16, h: 16};
const brSection = {x: 16, y: 16, w: 16, h: 16};

const sectionLayouts = {
    single: [fullSection],
    fourSquare: [tlSection, trSection, blSection, brSection],
    columns: [leftColumn, rightColumn],
    rows: [topRow, bottomRow],
    leftColumn: [leftColumn, trSection, brSection],
    rightColumn: [tlSection, blSection, rightColumn],
    topRow: [topRow, blSection, brSection],
    bottomRow: [tlSection, trSection, bottomRow],
}
export function displayTileEditorPropertyPanel() {
    const state = getState();
    const area = state.areaInstance.definition;
    const layer = area.layers[editingState.selectedLayerIndex];
    const palette = palettes[layer.grid.palette];
    let rows: (EditorProperty<any> | PropertyRow | string)[] = [];
    rows.push({
        name: 'tool',
        value: editingState.tool,
        values: ['select', 'brush', 'chest', 'loot'],
        onChange(tool: 'select' | 'brush' | 'chest' | 'loot') {
            editingState.tool = tool;
            displayTileEditorPropertyPanel();
        },
    });
    rows.push({
        name: 'sections',
        value: 'Change Sections',
        values: Object.keys(sectionLayouts),
        onChange(sectionType: string) {
            state.areaInstance.definition.sections = sectionLayouts[sectionType];
            setAreaSection(state, state.hero.d);
        }
    });
    switch (editingState.tool) {
        case 'brush':
            rows.push({
                name: 'brush',
                value: editingState.brush,
                palette,
                onChange(tiles: TileGrid) {
                    editingState.brush = tiles;
                    updateBrushCanvas(editingState.brush);
                }
            });
            break;
        case 'chest':
        case 'loot':
            rows = [...rows, ...getLootProperties(state, editingState)];
            break;
        case 'select':
            rows = [...rows, ...getSelectProperties(state, editingState)];
            break;
        default:
            break;
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
        case 'chest':
        case 'loot':
            onMouseDownLoot(state, editingState, x, y);
            break;
        case 'brush':
            drawBrush(x, y);
            break;
    }
});

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
            layer.tilesDrawn[row][column] = false;
            area.behaviorGrid[row][column] = palette.behaviors[`${tile.x}x${tile.y}`];
        }
    }
}

export function renderEditor(context: CanvasRenderingContext2D, state: GameState): void {
    if (!editingState.isEditing) {
        return;
    }
    context.save();
        context.translate(
            -state.camera.x + state.areaInstance.cameraOffset.x,
            -state.camera.y + state.areaInstance.cameraOffset.y
        );
        context.globalAlpha = 0.6;
        for (const object of state.areaInstance.definition.objects) {
            const frame = getObjectFrame(object);
            drawFrame(context, frame, {...frame, x: object.x, y: object.y});
            // While editing, draw the loot inside the chest on top as well.
            if (object.type === 'chest') {
                const frame = getObjectFrame({...object, type: 'loot'});
                drawFrame(context, frame, {...frame, x: object.x, y: object.y});
            }
        }
        if (editingState.tool === 'select' && editingState.selectedObject) {
            const frame = getObjectFrame(editingState.selectedObject);
            context.fillStyle = 'white';
            context.fillRect(editingState.selectedObject.x - 1, editingState.selectedObject.y - 1, frame.w + 2, frame.h + 2);
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

