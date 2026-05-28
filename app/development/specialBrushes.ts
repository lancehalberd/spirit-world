import {getLayer, getOrAddLayer} from 'app/utils/layers';

const singlePitTileIndex = 4;
const cavePitExterior: NineSlice = {
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

// Where these tiles are present north of a pit they will be replaced with cavePitWallTiles
const caveWallTiles = new Set([762, 763]);
const cavePitWallTiles = [
    [380, 381], // The wall section (field2 to cover but preserve the wall)
    [382, 383], // The pit wall section (floor2)
];
// TL corner on the left, TR corner on the right
const cavePitAngledWallTiles = [
    [384, 385], // This goes on top of the full wall tile (field2 to cover but preserve the wall)
    [386, 387], // This is the start of the actual pit, floor2, clearing field+field2 or using for pit edge decorations.
    [388, 389], // This is the bottom of the pit wall, if visible, floor 2
];
/*const caveAngledWallTiles = [
    [758,755],
    [770,764],
    [770,767],
];*/

const cavePitTiles: Set<number> = new Set([
    singlePitTileIndex,
    336, 337, 338, 339, 340, 341, 342, 343, 344,
    ...cavePitWallTiles[1],
    ...cavePitAngledWallTiles[1],
    ...cavePitAngledWallTiles[2],
]);
const cavePitDecorationTiles: Set<number> = new Set([
    ...cavePitTiles,
    345, 346, 347, 348, 349, 350, 351,
    ...cavePitAngledWallTiles[0],
    ...cavePitWallTiles[0],
]);


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
        // TODO: when placing a diagonal pit, check for a diagonal wall above it to merge with.
    }
    if (!N) {
        // If the tile above this is not a pit, check the field layer to see if it is a wall so we can
        // convert this pit into wall pit that matches with the wall.
        if (caveWallTiles.has(getLayer('field', area)?.grid.tiles[y - 1]?.[x])) {
            return changeLayerTile(floor2Layer, {x, y}, cavePitWallTiles[1][x % 2]);
        }
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
    return changeLayerTile(floor2Layer, {x, y}, cavePitExterior.layers[0].grid[row][column]);
}
/*function hasCeilingTile(area: AreaDefinition, {x, y}: Point) {
    // TODO: Improve this check if it is giving false positives.
    console.log(getLayer('foreground', area)?.grid.tiles[y]?.[x], getLayer('foreground2', area)?.grid.tiles[y]?.[x]);
    return getLayer('foreground', area)?.grid.tiles[y]?.[x] !== 0
        || getLayer('foreground2', area)?.grid.tiles[y]?.[x] !== 0
}*/
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
        const tile = field2Layer.grid.tiles[y]?.[x];
        if (cavePitDecorationTiles.has(tile)) {
            update(field2Layer, {x, y}, 0);
        }
        return changed;
    }
    const C = cavePitTiles.has(floor2Layer.grid.tiles[y]?.[x]);
    const S = cavePitTiles.has(floor2Layer.grid.tiles[y + 1]?.[x]);
    if (!C) {
        // Add or remove cave pit wall decorations depending on whether there is a pit to
        // the south.
        // TODO: this should also support angled pit walls.
        if (S && caveWallTiles.has(fieldLayer.grid.tiles[y]?.[x])) {
            changed = changeLayerTile(field2Layer, {x, y}, cavePitWallTiles[0][x % 2]);
        } else {
            removeField2Decorations()
        }
        /*if ((E || N || W) && hasCeilingTile(area, {x, y})) {
            // TODO: set this to match pit edges instead of always using the interior pit tile.
            console.log('Adding pit under ceiling', x, y);
            changed = changeLayerTile(fieldLayer, {x, y}, cavePitExterior.layers[0].grid[1][1]) || changed;
        } else {
            removeFieldDecorations();
        }*/
        removeFieldDecorations();
        return changed;
    }
    const N = cavePitTiles.has(floor2Layer.grid.tiles[y - 1]?.[x]);
    const W = cavePitTiles.has(floor2Layer.grid.tiles[y]?.[x - 1]);
    const E = cavePitTiles.has(floor2Layer.grid.tiles[y]?.[x + 1]);
    // These flags will track which edges are part of the base pit sprite.
    let hasNEdge = false, hasSEdge = false, hasWEdge = false, hasEEdge = false;
    if (caveWallTiles.has(fieldLayer.grid.tiles[y - 1]?.[x])) {
        hasNEdge = true;
    } else if (!N && !E && !W && !S) {
    // 0 adjacent pits, this is a single pit tile with no decorations.
        removeFieldDecorations();
        removeField2Decorations();
        return changed;
    } else {
        if (!W) {
            hasWEdge = true;
        } else if (!E) {
            hasEEdge = true;
        }
        if (!N) {
            hasNEdge = true;
        } else if (!S) {
            hasSEdge = true;
        }
    }
    const decorationTiles: number[] = [];
    // Add any missing edges to the list of decorations needed.
    if (!N && !hasNEdge) {
        console.error('Unexpected missing North edge');
    }
    if (!W && !hasWEdge) {
        decorationTiles.push(cavePitInterior.layers[0].grid[1][2]);
        hasWEdge = true;
    }
    if (!E && !hasEEdge) {
        decorationTiles.push(cavePitInterior.layers[0].grid[1][0]);
        hasEEdge = true;
    }
    if (!S && !hasSEdge) {
        decorationTiles.push(cavePitInterior.layers[0].grid[0][1]);
        hasSEdge = true;
    }
    // Add any missing corners to the list of decorations needed.
    if (!hasNEdge && !hasWEdge && !cavePitTiles.has(floor2Layer.grid.tiles[y - 1]?.[x - 1])) {
        decorationTiles.push(cavePitInterior.layers[0].grid[2][2]);
    }
    if (!hasNEdge && !hasEEdge && !cavePitTiles.has(floor2Layer.grid.tiles[y - 1]?.[x + 1])) {
        decorationTiles.push(cavePitInterior.layers[0].grid[2][0]);
    }
    if (!hasSEdge && !hasWEdge && !cavePitTiles.has(floor2Layer.grid.tiles[y + 1]?.[x - 1])) {
        decorationTiles.push(cavePitInterior.layers[0].grid[0][2]);
    }
    if (!hasSEdge && !hasEEdge && !cavePitTiles.has(floor2Layer.grid.tiles[y + 1]?.[x + 1])) {
        decorationTiles.push(cavePitInterior.layers[0].grid[0][0]);
    }
    if (decorationTiles[0]) {
        update(fieldLayer, {x, y}, decorationTiles[0]);
    } else {
        removeFieldDecorations();
    }
    if (decorationTiles[1]) {
        update(field2Layer, {x, y}, decorationTiles[1]);
    } else {
        removeField2Decorations();
    }
    return changed;
}

export const specialBrushes: {[key in string]: SpecialBrush} = {
    cavePitBrush,
};
