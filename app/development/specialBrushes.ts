import {getLayer, getOrAddLayer} from 'app/utils/layers';

type PitStyle = 'cave'|'crystalCave';//|'vanara'|'futuristic'

interface PitTileDefinition {
    singlePit: number
    exterior: number[][]
    interior: number[][]
    angledPits?: number[][]
    pitWalls?: number[][]
    // Where these tiles are present north of a pit they will be replaced with tiles from pitWalls
    walls?: Set<number>
    // TL corner of the pit on the left, TR corner of the pit on the right
    angledPitWalls?: number[][]
    angledWallsNW?: Set<number>
    angledWallsNE?: Set<number>
}
interface PitTiles extends PitTileDefinition {
    corePitTiles: Set<number>
    allPitTiles: Set<number>
    decorationTiles: Set<number>
}

function makePitTiles({singlePit, exterior, interior, angledPits, pitWalls, walls, angledPitWalls, angledWallsNW, angledWallsNE}: PitTileDefinition): PitTiles{
    const corePitTiles: Set<number> = new Set([
        singlePit,
        ...exterior[0],
        ...exterior[1],
        ...exterior[2],
        ...(pitWalls?.[1] ?? []),
        ...(angledPitWalls?.[1] ?? []),
        ...(angledPitWalls?.[2] ?? []),
        // These are the full pit tiles that need to be placed below
        // the inserted angled pit tiles on the top of angled pits.
        ...(angledPits?.[1] ?? []),
    ]);
    const allPitTiles = new Set([
        ...corePitTiles,
        ...(angledPits?.[0] ?? []),
        ...(angledPits?.[2] ?? []),
    ]);
    // Any tile that is added to field/field2 on top of pit tiles.
    const decorationTiles: Set<number> = new Set([
        ...allPitTiles,
        ...interior[0],
        ...interior[1],
        ...interior[2],
        ...(angledPitWalls?.[0] ?? []),
        ...(pitWalls?.[0] ?? []),
    ]);
    return {
        singlePit,
        exterior,
        interior,
        angledPits,
        pitWalls,
        walls,
        angledPitWalls,
        angledWallsNW,
        angledWallsNE,
        corePitTiles,
        allPitTiles,
        decorationTiles,
    };
}

const pitStyles = {
    cave: makePitTiles({
        singlePit: 4,
        exterior: [
            [336, 337, 338],
            [339, 340, 341],
            [342, 343, 344],
        ],
        interior: [
            [345, 346, 347],
            [348, undefined, 349],
            [350, 337, 351],
        ],
        angledPits: [
            [79,80],
            [81,82],
            [83,84],
        ],
        pitWalls: [
            [380, 381], // The wall section (field2 to cover but preserve the wall)
            [382, 383], // The pit wall section (floor2)
        ],
        angledPitWalls: [
            [384, 385], // This goes on top of the full wall tile (field2 to cover but preserve the wall)
            [386, 387], // This is the start of the actual pit, floor2, clearing field+field2 or using for pit edge decorations.
            [388, 389], // This is the bottom of the pit wall, if visible, floor 2
        ],
        walls: new Set([762, 763]),
        angledWallsNW: new Set([773,774,758,770]),
        angledWallsNE: new Set([771,772,755,764,767]),
    }),
    crystalCave: makePitTiles({
        singlePit: 317,
        exterior: [
            [352, 353, 354],
            [355, 356, 357],
            [358, 359, 360],
        ],
        interior: [
            [361, 362, 363],
            [364, undefined, 365],
            [366, 353, 367],
        ],
        /*angledPits: [
            [79,80],
            [81,82],
            [83,84],
        ],*/
        pitWalls: [
            [1765, 1766], // The wall section (field2 to cover but preserve the wall)
            [1767, 1768], // The pit wall section (floor2)
        ],
        angledPitWalls: [
            [1769, 1770], // This goes on top of the full wall tile (field2 to cover but preserve the wall)
            [1771, 1772], // This is the start of the actual pit, floor2, clearing field+field2 or using for pit edge decorations.
            [1773, 1774], // This is the bottom of the pit wall, if visible, floor 2
        ],
        walls: new Set([991, 992]),
        //angledWalls: new Set([758, 770, 755, 764, 767]),
        /*angledWalls: [
            [758,755],
            [770,764],
            [770,767],
        ]*/
    }),
};

interface PitBrushOptions extends BrushOptions {
    // 'interior' replaces pit corners with angled tiles, 'exterior' replaces non-pit corners with angled tiles.
    smoothCorners?: 'none'|'exterior'|'interior'
    delete?: boolean
    style: PitStyle
}


const pitBrush: SpecialBrush<PitBrushOptions> = {
    options: {
        smoothCorners: ['none', 'exterior', 'interior'],
        delete: [false, true],
        // TODO: support 'vanara', 'futuristic'
        style: ['cave', 'crystalCave'],
    },
    // Pressing SHIFT while using the pit brush in the editor toggles the delete flag.
    modifyOptions(options: PitBrushOptions, isShiftDown: boolean) {
        return {
            ...options,
            delete: isShiftDown ? !options.delete : !!options.delete,
        };
    },
    apply(area: AreaDefinition, alternateArea: AreaDefinition, {x, y}: Point, options: PitBrushOptions): Point[] {
        const pitTiles = pitStyles[options.style];
        const erase = !!options.delete;
        const updatedPoints: Point[] = [];
        const tx = (x / 16) | 0, ty = (y / 16) | 0;
        const floor2Layer = getOrAddLayer('floor2', area, alternateArea);
        if (ty < 0 || tx < 0 || ty >= floor2Layer.grid.h || tx >= floor2Layer.grid.w) {
            return updatedPoints;
        }
        // This check attempts to short circuit tiles that are already pits, but the angled pits are ambiguous
        // about whether they reperesent "pit" tiles depending on how the smoothing option is set, so we
        // are just disabling this check.
        //if (erase !== pitTiles.corePitTiles.has(floor2Layer.grid.tiles[ty]?.[tx]) || allC) {
        //    return updatedPoints;
        //}
        if (!changeLayerTile(floor2Layer, {x: tx, y: ty}, erase ? 0 : pitTiles.singlePit)) {
            return updatedPoints;
        }
        updatedPoints.push({x: tx, y: ty});
        if (options.smoothCorners !== 'none' && pitTiles.angledPits) {
            const applyAngledPitFunction = options.smoothCorners === 'exterior' ? applyExteriorAngledPits : applyInteriorAngledPits;
            for (const dy of [-1, 0, 1]) {
                const y = ty + dy;
                if (y < 0 || y >= floor2Layer.grid.h) {
                    continue;
                }
                for (const dx of [-1, 0, 1]) {
                    const x = tx + dx;
                    if (x < 0 || x >= floor2Layer.grid.w) {
                        continue;
                    }
                    if (applyAngledPitFunction(area, alternateArea, {x, y}, pitTiles)) {
                        if (dx || dy) {
                            updatedPoints.push({x, y});
                        }
                    }
                }
            }
        }
        for (const dy of [-2, -1, 0, 1, 2]) {
            const y = ty + dy;
            if (y < 0 || y >= floor2Layer.grid.h) {
                continue;
            }
            for (const dx of [-2, -1, 0, 1, 2]) {
                const x = tx + dx;
                if (x < 0 || x >= floor2Layer.grid.w) {
                    continue;
                }
                if (setPitTiles(area, alternateArea, {x, y}, pitTiles)) {
                    if (dx || dy) {
                        updatedPoints.push({x, y});
                    }
                }
            }
        }
        for (const dy of [-2, -1, 0, 1, 2]) {
            const y = ty + dy;
            if (y < 0 || y >= floor2Layer.grid.h) {
                continue;
            }
            for (const dx of [-2, -1, 0, 1, 2]) {
                const x = tx + dx;
                if (x < 0 || x >= floor2Layer.grid.w) {
                    continue;
                }
                if (Math.abs(dx) + Math.abs(dy) > 3) {
                    continue;
                }
                if (setPitDecorationTiles(area, alternateArea, {x, y}, pitTiles)) {
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

function clearPitTile(layer: AreaLayerDefinition, {x, y}: Point, pitTiles: PitTiles): boolean {
    if (pitTiles.allPitTiles.has(layer.grid.tiles[y]?.[x])) {
        return changeLayerTile(layer, {x, y}, 0);
    }
    return false;
}

function makeAngledPit(area: AreaDefinition, alternateArea: AreaDefinition, {x, y}: Point, pitTiles: PitTiles, pitSet: Set<number>, defaultValue: number): boolean {
    const floor2Layer = getOrAddLayer('floor2', area, alternateArea);
    const N = pitSet.has(floor2Layer.grid.tiles[y - 1]?.[x]);
    const S = pitSet.has(floor2Layer.grid.tiles[y + 1]?.[x]);
    const W = pitSet.has(floor2Layer.grid.tiles[y]?.[x - 1]);
    const E = pitSet.has(floor2Layer.grid.tiles[y]?.[x + 1]);
    // TODO: when placing a diagonal pit, check for a diagonal wall above it to merge with.
    // Check to make this a diagonal pit if it borders exactly two pits that are on adjacent sides.
    if (N && W && !S && !E) {
        return changeLayerTile(floor2Layer, {x, y}, pitTiles.angledPits?.[2][1]);
    }
    if (N && E && !S && !W) {
        return changeLayerTile(floor2Layer, {x, y}, pitTiles.angledPits?.[2][0]);
    }
    if (S && W && !N && !E) {
        return changeLayerTile(floor2Layer, {x, y}, pitTiles.angledPits?.[0][1]);
    }
    if (S && E && !N && !W) {
        return changeLayerTile(floor2Layer, {x, y}, pitTiles.angledPits?.[0][0]);
    }
    if (defaultValue !== 0) {
        return changeLayerTile(floor2Layer, {x, y}, defaultValue);
    }
    return clearPitTile(floor2Layer, {x, y}, pitTiles);
}

function applyExteriorAngledPits(area: AreaDefinition, alternateArea: AreaDefinition, {x, y}: Point, pitTiles: PitTiles): boolean {
    const floor2Layer = getOrAddLayer('floor2', area, alternateArea);
    if (y < 0 || x < 0 || y >= floor2Layer.grid.h || x >= floor2Layer.grid.w) {
        return false;
    }
    const C = pitTiles.corePitTiles.has(floor2Layer.grid.tiles[y]?.[x]);
    // Exterior angled pits only apply to non-core pit tiles.
    if (C) {
        return false;
    }
    return makeAngledPit(area, alternateArea, {x, y}, pitTiles, pitTiles.corePitTiles, 0);
}

function applyInteriorAngledPits(area: AreaDefinition, alternateArea: AreaDefinition, {x, y}: Point, pitTiles: PitTiles): boolean {
    const floor2Layer = getOrAddLayer('floor2', area, alternateArea);
    if (y < 0 || x < 0 || y >= floor2Layer.grid.h || x >= floor2Layer.grid.w) {
        return false;
    }
    const C = pitTiles.allPitTiles.has(floor2Layer.grid.tiles[y]?.[x]);
    // Interior angled pits only apply to core pit tiles.
    if (!C) {
        return false;
    }
    return makeAngledPit(area, alternateArea, {x, y}, pitTiles, pitTiles.allPitTiles, pitTiles.singlePit);
}

function setPitTiles(area: AreaDefinition, alternateArea: AreaDefinition, {x, y}: Point, pitTiles: PitTiles): boolean {
    const floor2Layer = getOrAddLayer('floor2', area, alternateArea);
    if (y < 0 || x < 0 || y >= floor2Layer.grid.h || x >= floor2Layer.grid.w) {
        return false;
    }
    const isAnyPitTile = pitTiles.allPitTiles.has(floor2Layer.grid.tiles[y]?.[x]);
    const isCorePitTile = pitTiles.corePitTiles.has(floor2Layer.grid.tiles[y]?.[x]);
    // If these values do not match, it means this is an angled pit tile, in which case the correct
    // tile should already be set here.
    if (isCorePitTile !== isAnyPitTile) {
        return false;
    }
    const N = pitTiles.allPitTiles.has(floor2Layer.grid.tiles[y - 1]?.[x]);
    const S = pitTiles.allPitTiles.has(floor2Layer.grid.tiles[y + 1]?.[x]);
    const W = pitTiles.allPitTiles.has(floor2Layer.grid.tiles[y]?.[x - 1]);
    const E = pitTiles.allPitTiles.has(floor2Layer.grid.tiles[y]?.[x + 1]);
    if (!isCorePitTile) {
        // Tile is just a regular non-pit tile.
        return clearPitTile(floor2Layer, {x, y}, pitTiles);
    }
    if (!N) {
        // If the tile above this is not a pit, check the field layer to see if it is a wall so we can
        // convert this pit into wall pit that matches with the wall.
        if (pitTiles.walls.has(getLayer('field', area)?.grid.tiles[y - 1]?.[x])) {
            return changeLayerTile(floor2Layer, {x, y}, pitTiles.pitWalls[1][x % 2]);
        }
    }
    // A pit without a full pit tile of it may have an angled pit tile placed north of it.
    // By default, the needed edges for this pit are based on where there are not pits in each
    // direction. However, this values may be changed when angled pits are inserted on these tiles.
    let needsNEdge = !N, needsSEdge = !S, needsWEdge = !W, needsEEdge = !E;
    // Checking for north angled pits has special handling because the angled pit wall bleeds into
    // the tile to the south, requiring a specific tile to be selected.
    if (pitTiles.angledPits && floor2Layer.grid.tiles[y - 1]?.[x] === pitTiles.angledPits[0][0]) {
        return changeLayerTile(floor2Layer, {x, y}, pitTiles.angledPits[1][0]);
    }
    if (pitTiles.angledPits && floor2Layer.grid.tiles[y - 1]?.[x] === pitTiles.angledPits[0][1]) {
        return changeLayerTile(floor2Layer, {x, y}, pitTiles.angledPits[1][1]);
    }
    // If there is an angled pit wall north of this pit, continue the pattern down into this pit.
    if (pitTiles.angledPitWalls && N && pitTiles.angledWallsNW?.has(getLayer('field', area)?.grid.tiles[y - 1]?.[x])) {
        return changeLayerTile(floor2Layer, {x, y}, pitTiles.angledPitWalls[2][0]);
    }
    if (N && pitTiles.angledWallsNE?.has(getLayer('field', area)?.grid.tiles[y - 1]?.[x])) {
        return changeLayerTile(floor2Layer, {x, y}, pitTiles.angledPitWalls[2][1]);
    }
    // Single isolated pit.
    if (needsNEdge && needsSEdge && needsEEdge && needsWEdge) {
        return changeLayerTile(floor2Layer, {x, y}, pitTiles.singlePit);
    }
    let row = 0, column = 0;
    if (!needsNEdge) {
        row = needsSEdge ? 2 : 1;
    }
    if (!needsWEdge) {
        column = needsEEdge ? 2 : 1;
    }
    return changeLayerTile(floor2Layer, {x, y}, pitTiles.exterior[row][column]);
}
/*function hasCeilingTile(area: AreaDefinition, {x, y}: Point) {
    // TODO: Improve this check if it is giving false positives.
    console.log(getLayer('foreground', area)?.grid.tiles[y]?.[x], getLayer('foreground2', area)?.grid.tiles[y]?.[x]);
    return getLayer('foreground', area)?.grid.tiles[y]?.[x] !== 0
        || getLayer('foreground2', area)?.grid.tiles[y]?.[x] !== 0
}*/
function setPitDecorationTiles(area: AreaDefinition, alternateArea: AreaDefinition, {x, y}: Point, pitTiles: PitTiles): boolean {
    let changed = false;
    function update(layer: AreaLayerDefinition, {x, y}: Point, tile: number) {
        changed = changeLayerTile(layer, {x, y}, tile) || changed;
        return changed;
    }
    const floor2Layer = getOrAddLayer('floor2', area, alternateArea);
    const fieldLayer = getOrAddLayer('field', area, alternateArea);
    const field2Layer = getOrAddLayer('field2', area, alternateArea);
    function removeFieldDecorations() {
        if (pitTiles.decorationTiles.has(fieldLayer.grid.tiles[y]?.[x])) {
            update(fieldLayer, {x, y}, 0);
        }
        return changed;
    }
    function removeField2Decorations() {
        const tile = field2Layer.grid.tiles[y]?.[x];
        if (pitTiles.decorationTiles.has(tile)) {
            update(field2Layer, {x, y}, 0);
        }
        return changed;
    }
    const C = pitTiles.corePitTiles.has(floor2Layer.grid.tiles[y]?.[x]);
    // Using pitTiles.allPitTiles here includes information about added angled tiles.
    const S = pitTiles.allPitTiles.has(floor2Layer.grid.tiles[y + 1]?.[x]);
    if (!C) {
        // Add or remove cave pit wall decorations depending on whether there is a pit to
        // the south.
        if (S && pitTiles.walls.has(fieldLayer.grid.tiles[y]?.[x])) {
            update(field2Layer, {x, y}, pitTiles.pitWalls[0][x % 2]);
        } else if (S && pitTiles.angledWallsNW?.has(fieldLayer.grid.tiles[y]?.[x])) {
            update(field2Layer, {x, y}, pitTiles.angledPitWalls[0][0]);
        } else if (S && pitTiles.angledWallsNE?.has(fieldLayer.grid.tiles[y]?.[x])) {
            update(field2Layer, {x, y}, pitTiles.angledPitWalls[0][1]);
        } else {
            removeField2Decorations()
        }
        removeFieldDecorations();
        return changed;
    }
    if (pitTiles.angledWallsNW?.has(fieldLayer.grid.tiles[y]?.[x])) {
        return changeLayerTile(field2Layer, {x, y}, pitTiles.angledPitWalls[1][0]);
    } else if (pitTiles.angledWallsNE?.has(fieldLayer.grid.tiles[y]?.[x])) {
        return changeLayerTile(field2Layer, {x, y}, pitTiles.angledPitWalls[1][1]);
    }
    const N = pitTiles.allPitTiles.has(floor2Layer.grid.tiles[y - 1]?.[x]);
    const W = pitTiles.allPitTiles.has(floor2Layer.grid.tiles[y]?.[x - 1]);
    const E = pitTiles.allPitTiles.has(floor2Layer.grid.tiles[y]?.[x + 1]);
    let needsNEdge = !N, needsSEdge = !S, needsWEdge = !W, needsEEdge = !E;
    // These flags will track which edges are part of the base pit sprite.
    let hasNEdge = false, hasSEdge = false, hasWEdge = false, hasEEdge = false;
    const decorationTiles: number[] = [];
    if (pitTiles.walls.has(fieldLayer.grid.tiles[y - 1]?.[x])) {
        hasNEdge = true;
    } else if (pitTiles.angledWallsNW?.has(fieldLayer.grid.tiles[y - 1]?.[x])) {
        hasNEdge = true;
    } else if (pitTiles.angledWallsNE?.has(fieldLayer.grid.tiles[y - 1]?.[x])) {
        hasNEdge = true;
    } else if (needsNEdge && needsSEdge && needsWEdge && needsEEdge) {
        // 0 adjacent pits, this is a single pit tile with no decorations.
        removeFieldDecorations();
        removeField2Decorations();
        return changed;
    } else if (pitTiles.angledPits?.[1].includes(floor2Layer.grid.tiles[y]?.[x])) {
        needsNEdge = false;
    } else {
        if (needsNEdge) {
            hasNEdge = true;
        } else if (needsSEdge) {
            hasSEdge = true;
        }
        if (needsWEdge) {
            hasWEdge = true;
        } else if (needsEEdge) {
            hasEEdge = true;
        }
    }
    // Add any missing edges to the list of decorations needed.
    if (needsNEdge && !hasNEdge) {
        console.error('Unexpected missing North edge');
    }
    if (needsWEdge && !hasWEdge) {
        decorationTiles.push(pitTiles.interior[1][2]);
        hasWEdge = true;
    }
    if (needsEEdge && !hasEEdge) {
        decorationTiles.push(pitTiles.interior[1][0]);
        hasEEdge = true;
    }
    if (needsSEdge && !hasSEdge) {
        decorationTiles.push(pitTiles.interior[0][1]);
        hasSEdge = true;
    }
    // Add any missing corners to the list of decorations needed.
    if (!hasNEdge && !hasWEdge
        && !pitTiles.corePitTiles.has(floor2Layer.grid.tiles[y - 1]?.[x - 1])
        && floor2Layer.grid.tiles[y - 1]?.[x - 1] !== pitTiles.angledPits?.[0][0]
    ) {
        decorationTiles.push(pitTiles.interior[2][2]);
    }
    if (!hasNEdge && !hasEEdge
        && !pitTiles.corePitTiles.has(floor2Layer.grid.tiles[y - 1]?.[x + 1])
        && floor2Layer.grid.tiles[y - 1]?.[x + 1] !== pitTiles.angledPits?.[0][1]
    ) {
        decorationTiles.push(pitTiles.interior[2][0]);
    }
    if (!hasSEdge && !hasWEdge
        && !pitTiles.corePitTiles.has(floor2Layer.grid.tiles[y + 1]?.[x - 1])
        && floor2Layer.grid.tiles[y + 1]?.[x - 1] !== pitTiles.angledPits?.[2][0]
    ) {
        decorationTiles.push(pitTiles.interior[0][2]);
    }
    if (!hasSEdge && !hasEEdge
        && !pitTiles.corePitTiles.has(floor2Layer.grid.tiles[y + 1]?.[x + 1])
        && floor2Layer.grid.tiles[y + 1]?.[x + 1] !== pitTiles.angledPits?.[2][1]
    ) {
        decorationTiles.push(pitTiles.interior[0][0]);
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

export const specialBrushes = {
    pitBrush
};
