import {
    AreaInstance, FullTile, Tile, TileBehaviors,
} from 'app/types';

// This resets the tile behavior for a specific tile to whatever the combined behavior of the layers are.
// This is useful when an object in a tile was overriding the tile behavior beneath it and we need to
// reconstruct the original behavior after the object is removed.
export function resetTileBehavior(area: AreaInstance, {x, y}: Tile): void {
    delete area.behaviorGrid?.[y]?.[x];
    for (const layer of area.layers) {
        const tile = layer.tiles[y]?.[x];
        if (!tile) {
            continue;
        }
        const isForeground = (layer.definition.drawPriority ?? layer.definition.key) === 'foreground';
        // The behavior grid combines behaviors of all layers, with higher layers
        // overriding the behavior of lower layers.
        if (tile.behaviors) {
            if (!area.behaviorGrid[y]) {
                area.behaviorGrid[y] = [];
            }
            applyTileToBehaviorGrid(area.behaviorGrid, {x, y}, tile, isForeground);
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

export function applyTileToBehaviorGrid(behaviorGrid: TileBehaviors[][], {x, y}: Tile, tile: FullTile, isForeground: boolean): void {
    const behaviors = tile.behaviors;
    // Tiles 0/1 are the null and empty tile and should not impact the tile behavior.
    if (!behaviors || tile.index < 2) {
        return;
    }
    // Lava + clouds erase the behaviors of tiles underneath them.
    if (behaviors.isLava || behaviors.cloudGround) {
        behaviorGrid[y][x] = {};
    }
    // Any background tile rendered on top of lava removes the lava behavior from it.
    if (!isForeground && behaviorGrid[y]?.[x]
        && !behaviors.isLava && !behaviors.isLavaMap && behaviors.isGround !== false
    ) {
        delete behaviorGrid[y][x].isLava;
        delete behaviorGrid[y][x].isLavaMap;
    }
    // Any background tile rendered on top of a pit removes the pit behavior.
    // If this causes issues with decorations like shadows we may need to explicitly set pit = false
    // on tiles that can cover up pits (like in the sky) and use that, or alternatively, make a separate
    // sky behavior that has this behavior instead of pits.
    if (!isForeground && behaviorGrid[y]?.[x]?.pit && !behaviors.pit && behaviors.isGround !== false) {
        delete behaviorGrid[y][x].pit;
    }
    if (!isForeground && behaviorGrid[y]?.[x]?.cloudGround && !behaviors.cloudGround) {
        delete behaviorGrid[y][x].cloudGround;
    }
    const lightRadius = Math.max(behaviorGrid[y][x]?.lightRadius || 0, behaviors.lightRadius || 0);
    const brightness = Math.max(behaviorGrid[y][x]?.brightness || 0, behaviors.brightness || 0);
    const baseSolidMap = behaviorGrid[y][x]?.solidMap;
    behaviorGrid[y][x] = {...(behaviorGrid[y][x] || {}), ...behaviors, lightRadius, brightness};
    if (baseSolidMap && behaviors.solidMap) {
        behaviorGrid[y][x].solidMap = new Uint16Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
        for (let row = 0; row < 16; row++) {
            behaviorGrid[y][x].solidMap[row] = baseSolidMap[row] | behaviors.solidMap[row];
        }
    }
}
