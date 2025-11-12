import {BITMAP_EMPTY, BITMAP_FULL} from 'app/content/bitMasks';
import {getDrawPriority} from 'app/utils/layers';

// This resets the tile behavior for a specific tile to whatever the combined behavior of the layers are.
// This is useful when an object in a tile was overriding the tile behavior beneath it and we need to
// reconstruct the original behavior after the object is removed.
export function resetTileBehavior(area: AreaInstance, {x, y}: Tile): void {
    delete area.behaviorGrid?.[y]?.[x];
    for (const layer of area.layers) {
        if (layer.definition.disableBehaviors) {
            continue;
        }
        const tile = layer.tiles[y]?.[x];
        const maskTile = layer.maskTiles?.[y]?.[x];
        const isForeground = getDrawPriority(layer.definition) === 'foreground';
        // The mask tile behavior is used instead of the behavior masked by it as the mask typically covers
        // most of the tile.
        if (maskTile) {
            if (maskTile?.behaviors) {
                if (tile?.index !== 1 && tile?.behaviors && maskTile?.behaviors.isMaskedMap) {
                    const maskedBehavior = getMaskedBehaviors(tile.behaviors, maskTile.behaviors.isMaskedMap);
                    applyTileToBehaviorGrid(area.behaviorGrid, {x, y}, maskedBehavior, isForeground);
                }
                // For drawing frozen tiles correctly, it is important that the isFrozen behavior is kept even when masked.
                //const behaviors = (tile.index !== 1 ? tile.behaviors : undefined);
                //applyTileToBehaviorGrid(area.behaviorGrid, {x, y}, {...maskTile.behaviors, isFrozen: behaviors?.isFrozen}, isForeground);
                applyTileToBehaviorGrid(area.behaviorGrid, {x, y}, maskTile.behaviors, isForeground);

            }
            continue;
        }
        if (!tile) {
            continue;
        }

        // tile 1 is used a lot but has no meaningful behavior so skip it.
        const behaviors = (tile.index !== 1 ? tile.behaviors : undefined);
        // The behavior grid combines behaviors of all layers, with higher layers
        // overriding the behavior of lower layers.
        if (behaviors) {
            applyTileToBehaviorGrid(area.behaviorGrid, {x, y}, behaviors, isForeground);
        }
    }
}


function applyBehaviorMask(baseBehavior: PixelBehavior, mask: Uint16Array): PixelBehavior {
    // If the mask is empty, no behaviors come through.
    if (mask === BITMAP_EMPTY || baseBehavior === BITMAP_EMPTY || !baseBehavior) {
        return false;
    }
    // If the mask is full, we use the exact behaviors from the base tile.
    if (mask === BITMAP_FULL) {
        return baseBehavior;
    }
    // If the tile is full, we use the map from the mask.
    if (baseBehavior === true || baseBehavior === BITMAP_FULL) {
        return mask;
    }
    return maskBitmap(baseBehavior, mask);
}

// For any behaviors that support pixel precision, this will return those behaviors where they exist
// in the behaviors and are exposed through the isMaskedMap.
export function getMaskedBehaviors(behaviors: TileBehaviors, isMaskedMap: Uint16Array): TileBehaviors {
    const maskedBehaviors: TileBehaviors = {};
    if (behaviors.solid) {
        maskedBehaviors.solid = applyBehaviorMask(behaviors.solid, isMaskedMap);
    }
    // isGround defaults behavior is true when undefined so it is important to set it to false to
    // prevent the mask from covering behaviors it shouldn't.
    if (behaviors.isGround !== false || behaviors.isGroundMap) {
        const result = applyBehaviorMask(behaviors.isGround ?? behaviors.isGroundMap, isMaskedMap);
        if (result === true || result === false) {
            maskedBehaviors.isGround = result;
        } else {
            maskedBehaviors.isGroundMap = result;
        }
    } else {
        maskedBehaviors.isGround = false;
    }
    if (behaviors.isLava || behaviors.isLavaMap) {
        const result = applyBehaviorMask(behaviors.isLava ?? behaviors.isLavaMap, isMaskedMap);
        if (result === true) {
            maskedBehaviors.isLava = true;
        } else if (result !== false) {
            maskedBehaviors.isLavaMap = result;
        }
    }
    if (behaviors.pit || behaviors.pitMap) {
        const result = applyBehaviorMask(behaviors.pit ?? behaviors.pitMap, isMaskedMap);
        if (result === true) {
            maskedBehaviors.pit = true;
        } else if (result !== false) {
            maskedBehaviors.pitMap = result;
        }
    }
    if (behaviors.pitWall || behaviors.pitWallMap) {
        const result = applyBehaviorMask(behaviors.pitWall ?? behaviors.pitWallMap, isMaskedMap);
        if (result === true) {
            maskedBehaviors.pitWall = true;
        } else if (result !== false) {
            maskedBehaviors.pitWallMap = result;
        }
    }
    if (behaviors.water) {
        maskedBehaviors.water = applyBehaviorMask(behaviors.water, isMaskedMap);
    }
    if (behaviors.shallowWater) {
        maskedBehaviors.shallowWater = applyBehaviorMask(behaviors.shallowWater, isMaskedMap);
    }
    return maskedBehaviors;
}

export function applyLayerToBehaviorGrid(behaviorGrid: TileBehaviors[][], layer: AreaLayer): void {
    if (layer.definition.disableBehaviors) {
        return;
    }
    const tiles = layer.tiles;
    const isForeground = getDrawPriority(layer) === 'foreground';
    for (let y = 0; y < tiles.length; y++) {
        if (!behaviorGrid[y]) {
            behaviorGrid[y] = [];
        }
        for (let x = 0; x < tiles.length; x++) {
            const tile = tiles[y]?.[x];
            // The mask tile behavior is used instead of the behavior masked by it as the mask typically covers
            // most of the tile.
            const maskTile = layer.maskTiles?.[y]?.[x];
            if (maskTile) {
                if (maskTile?.behaviors) {
                    if (tile && tile.index !== 1 && tile.behaviors && maskTile.behaviors.isMaskedMap) {
                        const maskedBehavior = getMaskedBehaviors(tile.behaviors, maskTile.behaviors.isMaskedMap);
                        applyTileToBehaviorGrid(behaviorGrid, {x, y}, maskedBehavior, isForeground);
                    }
                    applyTileToBehaviorGrid(behaviorGrid, {x, y}, maskTile.behaviors, isForeground);
                }
                continue;
            }
            if (!tile) {
                continue;
            }
            // tile 1 is used a lot but has no meaningful behavior so skip it.
            const behaviors = (tile.index !== 1 ? tile.behaviors : undefined);
            if (behaviors) {
                applyTileToBehaviorGrid(behaviorGrid, {x, y}, behaviors, isForeground);
            }
        }
    }
}

export function applyBehaviorToTile(area: AreaInstance, x: number, y: number, behavior: TileBehaviors): void {
    if (!area.behaviorGrid[y]) {
        area.behaviorGrid[y] = [];
    }
    if (!area.behaviorGrid[y][x]) {
        area.behaviorGrid[y][x] = {};
    }
    area.behaviorGrid[y][x] = {...area.behaviorGrid[y][x], ...behavior};
}

export function applyLedgesToBehaviorGridTile(behaviorGrid: TileBehaviors[][], x: number, y: number, ledges: TileBehaviors['ledges']): void {
    if (!behaviorGrid[y]) {
        behaviorGrid[y] = [];
    }
    if (!behaviorGrid[y][x]) {
        behaviorGrid[y][x] = {};
    }
    if (!behaviorGrid[y][x].ledges) {
        behaviorGrid[y][x].ledges = ledges
    } else {
        behaviorGrid[y][x].ledges = {...behaviorGrid[y][x].ledges, ...ledges};
    }
}

export function removeLedgeFromBehaviorTileGrid(behaviorGrid: TileBehaviors[][], x: number, y: number, key: 'up' | 'down' | 'left' | 'right'): void {
    if (!behaviorGrid[y]?.[x]?.ledges) {
        return;
    }
    delete behaviorGrid[y][x].ledges[key];
    if (!Object.keys(behaviorGrid[y][x].ledges).length) {
        delete behaviorGrid[y][x].ledges;
    }
}


function mergeBitmaps(baseFlag: boolean, baseMap: Uint16Array, newFlag: boolean, newMap: Uint16Array, overrideFlags: Boolean[], subtractedMaps: Uint16Array[]) {
    // If the new flag is true, it overrides all other values.
    if (newFlag === true) {
        return BITMAP_FULL;
    }
    // If the new flag is false, the base values are ignored.
    if (newFlag === false || (!baseFlag && !baseMap)) {
        return newMap || BITMAP_EMPTY;
    }
    let resultMap = baseFlag ? BITMAP_FULL : (baseMap || BITMAP_EMPTY);
    // If any override flag is set, then we ignore the values from baseFlag/baseMap.
    if (resultMap !== BITMAP_EMPTY) {
        for (const overrideFlag of overrideFlags) {
            if (overrideFlag) {
                resultMap = BITMAP_EMPTY;
                break;
            }
        }
    }
    if (resultMap !== BITMAP_EMPTY) {
        for (const subtractedMap of subtractedMaps) {
            if (subtractedMap) {
                resultMap = subtractBitmap(resultMap, subtractedMap);
            }
        }
    }
    if (newMap) {
        resultMap = addBitmaps(resultMap, newMap);
    }
    return resultMap;
}

function mergePixelBehaviors(baseBehavior: PixelBehavior, newBehavior: PixelBehavior|undefined, coveringBehaviors: (PixelBehavior|undefined)[]): PixelBehavior {
    // Case where the new behavior completely obscures the base behavior, or the base behavior is empty.
    if (newBehavior === true || newBehavior === false || baseBehavior === false || baseBehavior === undefined) {
        return newBehavior;
    }
    let resultMap = (baseBehavior === true) ? BITMAP_FULL : (baseBehavior || BITMAP_EMPTY);
    // Apply any behaviors that cover up this behavior, for example, pit tiles would cover up lava or water underneath them.
    if (resultMap !== BITMAP_EMPTY) {
        for (const coveringBehavior of coveringBehaviors) {
            if (coveringBehavior === undefined || coveringBehavior === false || coveringBehavior === BITMAP_EMPTY) {
                continue;
            }
            if (coveringBehavior === true || coveringBehavior === BITMAP_FULL) {
                resultMap = BITMAP_EMPTY;
                break;
            }
            resultMap = subtractBitmap(resultMap, coveringBehavior);
        }
    }
    if (resultMap === BITMAP_FULL) {
        return true;
    }
    if (resultMap === BITMAP_EMPTY) {
        return false;
    }
    if (newBehavior) {
        resultMap = addBitmaps(resultMap, newBehavior);
    }
    return resultMap;
}

export function applyTileToBehaviorGrid(
    behaviorGrid: TileBehaviors[][],
    {x, y}: Tile,
    behaviors: TileBehaviors,
    isForeground: boolean,
): void {
    if (!behaviors) {
        return;
    }
    if (!behaviorGrid[y]) {
        behaviorGrid[y] = [];
    }
    const baseBehaviors: TileBehaviors = behaviorGrid[y][x] || {};
    let resultingBehaviors: TileBehaviors = {...baseBehaviors};
    // Lava + clouds erase the behaviors of tiles underneath them.
    // Technically we might do this with pit + solid tiles, but this is more of a problem with cloud+lava tiles because they are often
    // drawn over ledges and other tiles while allowing the player to move over them.
    // So currently, if a pit tile was drawn over a lava tile, graphically it should just be a pit
    if (behaviors.isLava || behaviors.isLavaMap || behaviors.cloudGround || behaviors.isGround === true || behaviors.isGroundMap) {
        // Undo ledges that might have been set by this tile to adjacent tiles when we clear false ledges.
        if (baseBehaviors.ledges?.up === false && y > 0) {
            removeLedgeFromBehaviorTileGrid(behaviorGrid, x, y - 1, 'down');
        }
        if (baseBehaviors.ledges?.down === false && y < behaviorGrid.length - 1) {
            removeLedgeFromBehaviorTileGrid(behaviorGrid, x, y + 1, 'up');
        }
        if (baseBehaviors.ledges?.left === false && x > 0) {
            removeLedgeFromBehaviorTileGrid(behaviorGrid, x - 1, y, 'right');
        }
        if (baseBehaviors.ledges?.right === false && x < behaviorGrid[0].length - 1) {
            removeLedgeFromBehaviorTileGrid(behaviorGrid, x + 1, y, 'left');
        }
        resultingBehaviors = {};
    }
    // Any background tile rendered on top of lava should remove the lava behavior from it.
    // This requires explicitly setting isGround = false on backgrounds tiles like shadows
    const removeLava = (!isForeground && !behaviors.isLava && !behaviors.isLavaMap && behaviors.isGround !== false && !behaviors.isGroundMap);
    //const removeWater = (!isForeground && !behaviors.water && behaviors.isGround !== false && !behaviors.isGroundMap);
    //const removeShallowWater = (!isForeground && !behaviors.shallowWater && behaviors.isGround !== false && !behaviors.isGroundMap);
    // Any background tile rendered on top of a pit/shallow water/water/slipper tile removes that special behavior.
    // If this causes issues with decorations like shadows we may need to explicitly set pit = false
    // on tiles that can cover up pits (like in the sky) and use that, or alternatively, make a separate
    // sky behavior that has this behavior instead of pits.
    const removePit = (!isForeground && !behaviors.pit && !behaviors.pitMap && behaviors.isGround !== false && !behaviors.isGroundMap);
    // For the rest of these, we can delete these straight from the resultingBehaviors as there is no further
    // calculation for these. If we add pixel resolution to these, we would want to handle them the same way we do
    // for lava and pits.
    if (!isForeground && resultingBehaviors.shallowWater && !behaviors.shallowWater && behaviors.isGround !== false) {
        delete resultingBehaviors.shallowWater;
    }
    if (!isForeground && resultingBehaviors.water && !behaviors.water && behaviors.isGround !== false) {
        delete resultingBehaviors.water;
    }
    if (!isForeground && resultingBehaviors.slippery && !behaviors.slippery && behaviors.isGround !== false) {
        delete resultingBehaviors.slippery;
    }
    if (!isForeground && resultingBehaviors.cloudGround && !behaviors.cloudGround) {
        delete resultingBehaviors.cloudGround;
    }
    if (!isForeground && resultingBehaviors.touchHit && !behaviors.touchHit && behaviors.isGround !== false) {
        delete resultingBehaviors.touchHit;
    }
    if (!isForeground && resultingBehaviors.isBrittleGround && !behaviors.isBrittleGround && behaviors.isGround !== false) {
        delete resultingBehaviors.isBrittleGround;
    }
    const lightRadius = Math.max(resultingBehaviors.lightRadius || 0, behaviors.lightRadius || 0);
    const brightness = Math.max(resultingBehaviors.brightness || 0, behaviors.brightness || 0);
    resultingBehaviors = {...resultingBehaviors, ...behaviors, lightRadius, brightness};

    /*const newSolidMap = mergeBitmaps(
        baseBehaviors.solid,
        baseBehaviors.solidMap,
        behaviors.solid,
        behaviors.solidMap,
        [behaviors.isGround, behaviors.isLava, behaviors.pit, behaviors.cloudGround],
        [behaviors.isGroundMap, behaviors.isLavaMap, behaviors.pitMap],
    );
    if (newSolidMap === BITMAP_FULL) {
        resultingBehaviors.solid = true;
        delete resultingBehaviors.solidMap;
    } else if (newSolidMap === BITMAP_EMPTY) {
        delete resultingBehaviors.solid;
        delete resultingBehaviors.solidMap;
    } else {
        delete resultingBehaviors.solid;
        resultingBehaviors.solidMap = newSolidMap;
    }*/
    const isGround = behaviors.isGround === true || (behaviors.isGround === undefined && !behaviors.isGroundMap);
    resultingBehaviors.solid = mergePixelBehaviors(baseBehaviors.solid, behaviors.solid, isForeground ? [] : [
        behaviors.water,
        behaviors.shallowWater,
        behaviors.cloudGround,
        isGround, behaviors.isGroundMap,
        behaviors.isLava, behaviors.isLavaMap,
        behaviors.pit, behaviors.pitMap,
    ]);
    if (!resultingBehaviors.solid) {
        delete resultingBehaviors.solid;
    }
    const newIsLavaMap = mergeBitmaps(
        baseBehaviors.isLava,
        baseBehaviors.isLavaMap,
        behaviors.isLava,
        behaviors.isLavaMap,
        isForeground ? [] : [removeLava, isGround, behaviors.pit, behaviors.cloudGround],
        [behaviors.isGroundMap, behaviors.pitMap],
    );
    if (newIsLavaMap === BITMAP_FULL) {
        resultingBehaviors.isLava = true;
        delete resultingBehaviors.isLavaMap;
    } else if (newIsLavaMap === BITMAP_EMPTY) {
        delete resultingBehaviors.isLava;
        delete resultingBehaviors.isLavaMap;
    } else {
        delete resultingBehaviors.isLava;
        resultingBehaviors.isLavaMap = newIsLavaMap;
    }
    const newPitMap = mergeBitmaps(
        baseBehaviors.pit,
        baseBehaviors.pitMap,
        behaviors.pit,
        behaviors.pitMap,
        isForeground ? [removePit] : [removePit, isGround, behaviors.isLava, behaviors.cloudGround],
        [behaviors.isGroundMap, behaviors.isLavaMap],
    );
    if (newPitMap === BITMAP_FULL) {
        resultingBehaviors.pit = true;
        delete resultingBehaviors.pitMap;
    } else if (newPitMap === BITMAP_EMPTY) {
        delete resultingBehaviors.pit;
        delete resultingBehaviors.pitMap;
    } else {
        delete resultingBehaviors.pit;
        resultingBehaviors.pitMap = newPitMap;
    }

    resultingBehaviors.water = mergePixelBehaviors(baseBehaviors.water, behaviors.water, isForeground ? [] : [
        behaviors.cloudGround,
        behaviors.shallowWater,
        isGround, behaviors.isGroundMap,
        behaviors.isLava, behaviors.isLavaMap,
        behaviors.pit, behaviors.pitMap,
    ]);
    if (!resultingBehaviors.water) {
        delete resultingBehaviors.water;
    }
    resultingBehaviors.shallowWater = mergePixelBehaviors(baseBehaviors.shallowWater, behaviors.shallowWater, isForeground ? [] : [
        behaviors.cloudGround,
        behaviors.water,
        isGround, behaviors.isGroundMap,
        behaviors.isLava, behaviors.isLavaMap,
        behaviors.pit, behaviors.pitMap,
    ]);
    if (!resultingBehaviors.shallowWater) {
        delete resultingBehaviors.shallowWater;
    }

    behaviorGrid[y][x] = resultingBehaviors;

    // It is convenient for the projectile hit detection system to assume that ledges are always defined as going down
    // from the current tile into the adjacent tile, so we conver all false ledges (which are used to specify the reverse direction)
    // to setting true ledges on the tile they are next to.
    if (behaviors.ledges?.up === false && y > 0) {
        applyLedgesToBehaviorGridTile(behaviorGrid, x, y - 1, {down: true});
    }
    if (behaviors.ledges?.down === false && y < behaviorGrid.length - 1) {
        applyLedgesToBehaviorGridTile(behaviorGrid, x, y + 1, {up: true});
    }
    if (behaviors.ledges?.left === false && x > 0) {
        applyLedgesToBehaviorGridTile(behaviorGrid, x - 1, y, {right: true});
    }
    if (behaviors.ledges?.right === false && x < behaviorGrid[0].length - 1) {
        applyLedgesToBehaviorGridTile(behaviorGrid, x + 1, y, {left: true});
    }
}

function addBitmaps(A: Uint16Array, B: Uint16Array): Uint16Array {
    const result = new Uint16Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
    for (let row = 0; row < 16; row++) {
        result[row] = A[row] | B[row];
    }
    return result;
}
function subtractBitmap(A: Uint16Array, B: Uint16Array): Uint16Array {
    const result = new Uint16Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
    for (let row = 0; row < 16; row++) {
        result[row] = A[row] & ~B[row];
    }
    return result;
}
function maskBitmap(A: Uint16Array, mask: Uint16Array): Uint16Array {
    const result = new Uint16Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
    for (let row = 0; row < 16; row++) {
        result[row] = A[row] & mask[row];
    }
    return result;
}
