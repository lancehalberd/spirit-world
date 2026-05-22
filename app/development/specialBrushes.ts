import {getOrAddLayer} from 'app/utils/layers';

const singlePitTileIndex = 4;
const cavePitExteror: NineSlice = {
    w: 3,
    h: 3,
    r: {x: 1, y: 1, w: 1, h: 1},
    layers: [{
        key: 'floor2',
        grid: [
            [336, 337, 338],
            [339, 340, 341],
            [342, 343, 344],
        ],
    }],
};
const cavePitTiles: Set<number> = new Set([singlePitTileIndex, 336, 337, 338, 339, 340, 341, 342, 343, 344]);
const cavePitInterior: NineSlice = {
    w: 3,
    h: 3,
    r: {x: 1, y: 1, w: 1, h: 1},
    layers: [{
        key: 'field',
        grid: [
            [345, 346, 347],
            [348,   0, 349],
            [350, 337, 351],
        ],
    }],
};
const cavePitDecorationTiles: Set<number> = new Set([...cavePitTiles, 345, 346, 347, 348, 349, 350, 351]);


const cavePitBrush: SpecialBrush = {
    apply(area: AreaDefinition, alternateArea: AreaDefinition, {x, y}: Point, erase = false): Point[] {
        const updatedPoints: Point[] = [];
        const tx = (x / 16) | 0, ty = (y / 16) | 0;
        const floor2Layer = getOrAddLayer('floor2', area, alternateArea);
        if (ty < 0 || tx < 0 || ty >= floor2Layer.grid.h || tx >= floor2Layer.grid.w) {
            return updatedPoints;
        }
        if (erase !== cavePitTiles.has(floor2Layer.grid.tiles[ty]?.[tx])) {
            return updatedPoints;
        }
        updatedPoints.push({x: tx, y: ty});
        changeLayerTile(floor2Layer, {x: tx, y: ty}, erase ? 0 : singlePitTileIndex);
        for (const dy of [-1, 0, 1]) {
            const y = ty + dy;
            for (const dx of [-1, 0, 1]) {
                const x = tx +dx;
                if (setPitTiles(area, alternateArea, {x, y})) {
                    if (dx || dy) {
                        updatedPoints.push({x, y});
                    }
                }
            }
        }
        for (const dy of [-1, 0, 1]) {
            const y = ty + dy;
            for (const dx of [-1, 0, 1]) {
                const x = tx +dx;
                if (setPitDecorationTiles(area, alternateArea, {x, y})) {
                    if (dx || dy) {
                        updatedPoints.push({x, y});
                    }
                }
            }
        }
        return updatedPoints;
    },
};

function changeLayerTile(layer: AreaLayerDefinition, {x, y}: Point, tile: number): boolean {
    if (!layer.grid.tiles[y]) {
        layer.grid.tiles[y] = [];
    }
    if (layer.grid.tiles[y][x] === tile) {
        return false;
    }
    layer.grid.tiles[y][x] = tile;
    return true;
}

function setPitTiles(area: AreaDefinition, alternateArea: AreaDefinition, {x, y}: Point): boolean {
    const floor2Layer = getOrAddLayer('floor2', area, alternateArea);
    if (y < 0 || x < 0 || y >= floor2Layer.grid.h || x >= floor2Layer.grid.w) {
        return false;
    }
    const C = cavePitTiles.has(floor2Layer.grid.tiles[y]?.[x]);
    const N = cavePitTiles.has(floor2Layer.grid.tiles[y - 1]?.[x]);
    const S = cavePitTiles.has(floor2Layer.grid.tiles[y + 1]?.[x]);
    const W = cavePitTiles.has(floor2Layer.grid.tiles[y]?.[x - 1]);
    const E = cavePitTiles.has(floor2Layer.grid.tiles[y]?.[x + 1]);
    if (!C) {
        // Just clear the pit since we do not support diagonal pits yet.
        return changeLayerTile(floor2Layer, {x, y}, 0);
        // TODO: Support adding diagonal pits if exactly 2 adjacent tiles are pits
        //if (N && E && !S && !W) {
        //    update(floor2Layer, {x, y}, )
        //}
    }
    // Single isolated pit.
    if (!N && !S && !E && !W) {
        return changeLayerTile(floor2Layer, {x, y}, singlePitTileIndex);
    }
    let row = 0, column = 0;
    if (N && S) {
        row = 1;
    } else if (N && !S) {
        row = 2;
    }
    if (W && E) {
        column = 1;
    } else if (W && !E) {
        column = 2;
    }
    return changeLayerTile(floor2Layer, {x, y}, cavePitExteror.layers[0].grid[row][column]);
}
function setPitDecorationTiles(area: AreaDefinition, alternateArea: AreaDefinition, {x, y}: Point): boolean {
    let changed = false;
    function update(layer: AreaLayerDefinition, {x, y}: Point, tile: number) {
        changed = changeLayerTile(layer, {x, y}, tile) || changed;
        return changed;
    }
    const floor2Layer = getOrAddLayer('floor2', area, alternateArea);
    const fieldLayer = getOrAddLayer('field', area, alternateArea);
    const field2Layer = getOrAddLayer('field2', area, alternateArea);
    function removeFieldDecorations() {
        if (cavePitDecorationTiles.has(fieldLayer.grid.tiles[y]?.[x])) {
            update(fieldLayer, {x, y}, 0);
        }
        return changed;
    }
    function removeField2Decorations() {
        if (cavePitDecorationTiles.has(field2Layer.grid.tiles[y]?.[x])) {
            update(field2Layer, {x, y}, 0);
        }
        return changed;
    }
    const C = cavePitTiles.has(floor2Layer.grid.tiles[y]?.[x]);
    if (!C) {
        return removeFieldDecorations();
    }
    const N = cavePitTiles.has(floor2Layer.grid.tiles[y - 1]?.[x]);
    const S = cavePitTiles.has(floor2Layer.grid.tiles[y + 1]?.[x]);
    const W = cavePitTiles.has(floor2Layer.grid.tiles[y]?.[x - 1]);
    const E = cavePitTiles.has(floor2Layer.grid.tiles[y]?.[x + 1]);
    // 0 adjacent pits, this is a single pit tile with no decorations.
    if (!N && !E && !W && !S) {
        removeFieldDecorations();
        removeField2Decorations();
        return changed;
    }
    // 1 adjacent pits, this is a narrow pit with 3 edges, 2 on the floor2 layer,
    // and one missing to be added on the field layer.
    // For floor2, N edges are prioritized over S edges, and W edges are prioritized over E edges.
    if (!N && !E && !W) {
        // NW edges are in the floor2 layer
        // Just add the missing W edge.
        update(fieldLayer, {x, y}, cavePitInterior.layers[0].grid[1][0]);
        removeField2Decorations();
        return changed;
    }
    if (!S && !E && !W) {
        // SW edges are in the floor2 layer
        // Just add the missing W edge.
        update(fieldLayer, {x, y}, cavePitInterior.layers[0].grid[1][0]);
        removeField2Decorations();
        return changed;
    }
    if (!N && !E && !S) {
        // NE edges are in the floor2 layer
        // Just add the missing S edge.
        update(fieldLayer, {x, y}, cavePitInterior.layers[0].grid[0][1]);
        removeField2Decorations();
        return changed;
    }
    if (!N && !W && !S) {
        // NW edges are in the floor2 layer
        // Just add the missing S edge.
        update(fieldLayer, {x, y}, cavePitInterior.layers[0].grid[0][1]);
        removeField2Decorations();
        return changed;
    }
    // 2 or more adjacent pits, floor2 layer handles all the direct edges except
    // opposite ledges
    if (!N && !S) {
        // Just add the missing S edge.
        update(fieldLayer, {x, y}, cavePitInterior.layers[0].grid[0][1]);
        removeField2Decorations();
        return changed;
    }
    if (!E && !W) {
        // Just add the missing W edge.
        update(fieldLayer, {x, y}, cavePitInterior.layers[0].grid[1][0]);
        removeField2Decorations();
        return changed;
    }
    // All remaining decorations are corners pieces.
    // We could need 4 corner pieces if this is the center of a + shape, but I only want
    // to use floor2, field + field2, so we just stop once we reach 2 pieces, which supports
    // every other pattern.
    const cornerTiles: number[] = [];
    if (N && W && !cavePitTiles.has(floor2Layer.grid.tiles[y - 1]?.[x - 1])) {
        cornerTiles.push(cavePitInterior.layers[0].grid[2][2]);
    }
    if (N && E && !cavePitTiles.has(floor2Layer.grid.tiles[y - 1]?.[x + 1])) {
        cornerTiles.push(cavePitInterior.layers[0].grid[2][0]);
    }
    if (S && W && !cavePitTiles.has(floor2Layer.grid.tiles[y + 1]?.[x - 1])) {
        cornerTiles.push(cavePitInterior.layers[0].grid[0][2]);
    }
    if (S && E && !cavePitTiles.has(floor2Layer.grid.tiles[y + 1]?.[x + 1])) {
        cornerTiles.push(cavePitInterior.layers[0].grid[0][0]);
    }
    if (cornerTiles[0]) {
        update(fieldLayer, {x, y}, cornerTiles[0]);
    } else {
        removeFieldDecorations();
    }
    if (cornerTiles[1]) {
        update(field2Layer, {x, y}, cornerTiles[1]);
    } else {
        removeField2Decorations();
    }
    return changed;
}

export const specialBrushes: {[key in string]: SpecialBrush} = {
    cavePitBrush,
};
