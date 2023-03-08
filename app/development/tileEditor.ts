import {
    //applyLayerToBehaviorGrid,
    initializeAreaLayerTiles,
    //mapTileNumbersToFullTiles,
} from 'app/content/areas';
import { allSections } from 'app/content/sections';
import { allTiles } from 'app/content/tiles';
import { zones } from 'app/content/zones';
import { getSelectionBounds } from 'app/development/brushSelection';
import { contextMenuState, editingState } from 'app/development/editingState';
import { addMissingLayer } from 'app/development/layers';
import {
    createObjectDefinition,
    deleteObject,
    fixObjectPosition,
    getObjectFrame,
    onMouseDownSelect,
    onMouseMoveSelect,
    unselectObject,
    updateObjectInstance,
} from 'app/development/objectEditor';
import { updateBrushCanvas } from 'app/development/propertyPanel';
import { setEditingTool } from 'app/development/toolTab';
import { CANVAS_SCALE } from 'app/gameConstants';
import { getDisplayedMapSections, getSectionUnderMouse, mouseCoordsToMapCoords } from 'app/render/renderMap';
import { getState } from 'app/state';
import { KEY, isKeyboardKeyDown } from 'app/userInput';
import { mainCanvas } from 'app/utils/canvas';
import { enterLocation } from 'app/utils/enterLocation';
import { getMousePosition, isMouseDown, /*isMouseOverElement*/ } from 'app/utils/mouse';
import { resetTileBehavior } from 'app/utils/tileBehavior';

import {
    AreaInstance, AreaLayer, AreaLayerDefinition, EditingState,
    FullTile, GameState, ObjectDefinition,
    Rect, TileGridDefinition, TilePalette,
} from 'app/types';

function refreshArea(state: GameState, doNotRefreshEditor = false) {
    enterLocation(state, state.location, true, undefined, true, false, doNotRefreshEditor);
}

mainCanvas.addEventListener('mousemove', function () {
    if (!editingState.isEditing || !isMouseDown() || contextMenuState.contextMenu) {
        return;
    }
    const state = getState();
    const [x, y] = getMousePosition(mainCanvas, CANVAS_SCALE);
    if (state.paused) {
        if (editingState.sectionDragData && state.showMap && isMouseDown() && editingState.selectedSections.length) {
            const sectionIndex = editingState.sectionDragData.sectionIndex;
            const section = allSections[sectionIndex].section;
            const mapCoords = mouseCoordsToMapCoords({x, y});
            // Calculate where the anchor section should be based on the map coords delta of the mouse drag and the original
            // position of the anchor section when the drag started.
            const tx = editingState.sectionDragData.originalSectionX + (mapCoords.x - editingState.sectionDragData.x);
            const ty = editingState.sectionDragData.originalSectionY + (mapCoords.y - editingState.sectionDragData.y);
            // Compute the map deltas for the anchor section based on where it currently is and where its target position is.
            const dx = tx - section.mapX;
            const dy = ty - section.mapY;
            editingState.sectionDragData.movedCount++;
            if (dx || dy || editingState.sectionDragData.movedCount > 1) {
                editingState.sectionDragData.dragged = true;
            }
            // Attempt to move all selected sections by the calculated map deltas.
            moveSections(editingState.selectedSections, dx, dy);
        }
        return;
    }
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
    if (event.which !== 1 || contextMenuState.contextMenu) {
        return;
    }
    if (!editingState.isEditing) {
        return;
    }
    const state = getState();
    const [x, y] = getMousePosition(mainCanvas, CANVAS_SCALE);
    if (state.paused) {
        if (state.showMap) {
            if (editingState.selectedSections.length && !isKeyboardKeyDown(KEY.SHIFT)) {
                const mapCoords = mouseCoordsToMapCoords({x, y});
                // The anchor section is arbitrarily set to the first selected section.
                // It will be used to keep track of how much we need to move the sections at any point
                // during the drag operation.
                const sectionIndex = editingState.selectedSections[0];
                const section = allSections[sectionIndex].section;
                editingState.sectionDragData = {
                    dragged: false,
                    movedCount: 0,
                    x: mapCoords.x,
                    y: mapCoords.y,
                    sectionIndex,
                    originalSectionX: section.mapX,
                    originalSectionY: section.mapY,
                };
            }
        }
        return;
    }
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
            replaceTiles(state, x, y);
            break;
    }
});
document.addEventListener('mouseup', (event) => {
    if (event.which !== 1 || contextMenuState.contextMenu) {
        return;
    }
    editingState.dragOffset = null;
    if (!editingState.sectionDragData?.dragged) {
        const state = getState();
        if (state.paused) {
            if (state.showMap) {
                const section = getSectionUnderMouse(state);
                if (isKeyboardKeyDown(KEY.SHIFT)) {
                    if (section) {
                        const arrayIndex = editingState.selectedSections.indexOf(section.index);
                        if (arrayIndex >= 0) {
                            editingState.selectedSections.splice(arrayIndex, 1);
                        } else {
                            editingState.selectedSections.push(section.index);
                        }
                    }
                } else if (!section || (editingState.selectedSections.length === 1 && editingState.selectedSections[0] === section.index)) {
                    editingState.selectedSections = [];
                } else {
                    editingState.selectedSections = [section.index];
                }
            }
        }
    }
    editingState.sectionDragData = null;
});

function onMouseDownObject(state: GameState, editingState: EditingState, x: number, y: number): void {
    const newObject: ObjectDefinition = createObjectDefinition(
        state,
        {
            ...editingState.selectedObject,
            x: Math.round(x + state.camera.x),
            y: Math.round(y + state.camera.y),
        }
    );
    // type: editingState.tool === 'object' ? editingState.objectType : editingState.tool as 'enemy' | 'boss',

    const frame = getObjectFrame(newObject);
    newObject.x -= (frame.content?.w || frame.w) / 2;
    newObject.y -= (frame.content?.h || frame.h) / 2;
    fixObjectPosition(state, newObject);
    updateObjectInstance(state, newObject, null, state.areaInstance, true);
    if (!isKeyboardKeyDown(KEY.SHIFT)) {
        setEditingTool('select');
        editingState.selectedObject = newObject;
        editingState.needsRefresh = true;
    }
}

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
            refreshArea(state);
            area = state.areaInstance;
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
function replaceTiles(state: GameState, x: number, y: number): void {
    // Tile replacement is only valid on a single layer, otherwise it is ambiguous what is being replaced.
    if (!editingState.selectedLayerKey) {
        return;
    }
    const brushTiles = editingState.brush.none.tiles;
    const layer = state.areaInstance.layers.find(l => l.key === editingState.selectedLayerKey);
    const parentLayer = state.areaInstance.definition.parentDefinition?.layers?.find(l => l.key === layer.key)
    const w = 16, h = 16;
    const tile = layer.tiles[((state.camera.y + y) / h) | 0]?.[((state.camera.x + x) / w) | 0];
    const r = state.areaSection;
    for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
            const t = layer.tiles[y][x];
            if (t === tile && Math.random() <= editingState.replacePercentage / 100) {
                const paintTile = brushTiles[y % brushTiles.length][x % brushTiles[0].length];
                paintSingleTile(state.areaInstance, layer, parentLayer, x, y, paintTile);
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
    if (state.paused) {
        if (state.showMap) {
            const allSections = getDisplayedMapSections(state);
            if (editingState.selectedSections.length === allSections.length) {
                editingState.selectedSections = [];
            } else {
                editingState.selectedSections = [...allSections];
            }
        }
        return;
    }
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
    const state = getState();
    if (event.which === KEY.BACK_SPACE) {
        if (editingState.tool === 'brush') {
            const [x, y] = getMousePosition(mainCanvas, CANVAS_SCALE);
            deleteTile(x, y);
        } else if (state.areaInstance.definition.objects.includes(editingState.selectedObject)) {
            deleteObject(state, editingState.selectedObject);
            unselectObject(editingState);
        }
    }
    if (event.which === KEY.ESCAPE) {
        editingState.selectedSections = [];
        if (editingState.selectedObject) {
            unselectObject(editingState);
        }
        if (editingState.tool === 'select') {
            setEditingTool(editingState.previousTool);
        }
    }
    /*
    // Don't support moving sections with keyboard because it
    // conflicts with controls for changing map floor.
    if (state.paused && state.showMap) {
        if (event.which === KEY.LEFT || event.which === KEY.A) {
            moveSections(editingState.selectedSections, -1, 0);
        }
        if (event.which === KEY.RIGHT || event.which === KEY.D) {
            moveSections(editingState.selectedSections, 1, 0);
        }
        if (event.which === KEY.UP || event.which === KEY.W) {
            moveSections(editingState.selectedSections, 0, -1);
        }
        if (event.which === KEY.DOWN || event.which === KEY.S) {
            moveSections(editingState.selectedSections, 0, 1);
        }
    }*/

});

function canMoveSection(sectionIndex: number, dx: number, dy: number): boolean {
    const section = allSections[sectionIndex].section;
    const l = section.mapX + dx, t = section.mapY + dy;
    const r = l + (section.w / 16) | 0, b = t + (section.h / 16) | 0;
    return l >= 0 && r <= 6 && t >= 0 && b <= 6;
}

function moveSections(sections: number[], dx: number, dy: number) {
    if (sections.every(section => canMoveSection(section, dx, dy))) {
        for (const sectionIndex of sections) {
            const section = allSections[sectionIndex].section;
            section.mapX += dx;
            section.mapY += dy;
        }
        getState().map.needsRefresh = true;
    }
}

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
                                    if (map[tileRow[x]] !== undefined) {
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
                refreshArea(state);
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
                refreshArea(state);
            }
            return;
        }
    }
}
window['fixMismatchedLayers'] = fixMismatchedLayers;

