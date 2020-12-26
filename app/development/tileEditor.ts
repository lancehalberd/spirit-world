import _ from 'lodash';

import { palettes } from 'app/content/areas';
import { displayPropertyPanel, hidePropertyPanel, updateBrushCanvas } from 'app/development/propertyPanel';
import { mainCanvas } from 'app/dom';
import { CANVAS_SCALE } from 'app/gameConstants';
import { getState } from 'app/state';
import { getMousePosition, isMouseDown } from 'app/utils/mouse';

import { TileGrid } from 'app/types';

export const editingState: {
    isEditing: boolean,
    brush: TileGrid,
    selectedLayerIndex: number
} = {
    isEditing: false,
    brush: null,
    selectedLayerIndex: 0,
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

export function displayTileEditorPropertyPanel() {
    const area = getState().areaInstance.definition;
    const layer = area.layers[editingState.selectedLayerIndex];
    const palette = palettes[layer.grid.palette];
    displayPropertyPanel([
        {
            name: 'brush',
            value: editingState.brush,
            palette,
            onChange(tiles: TileGrid) {
                editingState.brush = tiles;
                updateBrushCanvas(editingState.brush);
            }
        }
    ])
}
mainCanvas.addEventListener('mousemove', function () {
    if (!editingState.isEditing || !isMouseDown()) {
        return;
    }
    const [x, y] = getMousePosition(mainCanvas, CANVAS_SCALE);
    drawBrush(x, y);
});
mainCanvas.addEventListener('mousedown', function () {
    if (!editingState.isEditing) {
        return;
    }
    const [x, y] = getMousePosition(mainCanvas, CANVAS_SCALE);
    drawBrush(x, y);
});

function drawBrush(x: number, y: number): void {
    const state = getState();
    const palette = editingState.brush.palette;
    const sy = Math.floor((state.camera.y + y) / palette.h);
    const sx = Math.floor((state.camera.x + x) / palette.w);
    const area = getState().areaInstance;
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
