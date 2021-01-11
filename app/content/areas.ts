import _ from 'lodash';

import { createObjectInstance } from 'app/content/objects';
import { palettes } from 'app/content/palettes';
import { LootDropObject } from 'app/content/lootObject';
import { createCanvasAndContext } from 'app/dom';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from 'app/gameConstants';
import { isPointInShortRect } from 'app/utils/index';
import { updateCamera } from 'app/updateCamera';

import {
    AreaDefinition, AreaGrid, AreaInstance, AreaLayerDefinition,
    Direction, GameState, LayerTile, ObjectInstance, ShortRectangle, Tile, TileBehaviors,
} from 'app/types';



export function getDefaultArea(): AreaDefinition {
    return {
        layers: [
            {
                key: 'floor',
                grid: {
                    // The dimensions of the grid.
                    w: 32,
                    h: 32,
                    // The palette to use for this grid (controls the size of tiles)
                    palette: 'floor',
                    // The matrix of tiles
                    tiles: [],
                },
            },
            {
                key: 'field',
                grid: {
                    // The dimensions of the grid.
                    w: 32,
                    h: 32,
                    // The palette to use for this grid (controls the size of tiles)
                    palette: 'field',
                    // The matrix of tiles
                    tiles: [],
                },
            },
        ],
        objects: [],
        sections: [{ x: 0, y: 0, w: 32, h: 32}],
    };
}


export function getAreaFromGridCoords(grid: AreaGrid, {x, y}: {x: number, y: number}): AreaDefinition {
    if (!grid[y][x]) {
        grid[y][x] = initializeAreaTiles(getDefaultArea());
    }
    return grid[y][x];
}

export function initializeAreaLayerTiles(layer: AreaLayerDefinition) {
    const palette = palettes[layer.grid.palette];
    const tiles = layer.grid.tiles;
    for (let y = 0; y < layer.grid.h; y++) {
        tiles[y] = tiles[y] || [];
        for (let x = 0; x < layer.grid.w; x++) {
            tiles[y][x] = tiles[y][x] || _.sample(palette.defaultTiles);
        }
    }
}

export function initializeAreaTiles(area: AreaDefinition): AreaDefinition {
    area.layers.map(initializeAreaLayerTiles);
    return area;
}

export function removeAllClones(state: GameState): void {
    if (state.hero.activeClone) {
        console.log(state.hero.x, state.hero.y);
        state.hero.x = state.hero.activeClone.x;
        state.hero.y = state.hero.activeClone.y;
        console.log(state.hero.x, state.hero.y);
    }
    for (const clone of state.hero.clones) {
        removeObjectFromArea(state, state.areaInstance, clone);
    }
    state.hero.clones = []
    state.hero.activeClone = null;
}

export function enterArea(state: GameState, area: AreaDefinition, x: number, y: number): void {
    // Remove all clones on changing areas.
    removeAllClones(state);
    state.hero.activeStaff?.remove(state, state.areaInstance);
    state.areaInstance = createAreaInstance(state, area);
    state.hero.x = x;
    state.hero.y = y;
    state.hero.safeX = x;
    state.hero.safeY = y;
    setAreaSection(state, state.hero.d);
    updateCamera(state, 512);
}

export function enterAreaGrid(state: GameState, areaGrid: AreaGrid): void {
    if (!areaGrid) {
        console.log('Invalid area', areaGrid);
        return;
    }
    state.areaGrid = areaGrid;
    const row = state.areaGridCoords.y % state.areaGrid.length;
    const column = state.areaGridCoords.x % state.areaGrid[row].length;
    enterArea(state, state.areaGrid[row][column], state.hero.x, state.hero.y);
}

export function setAreaSection(state: GameState, d: Direction): void {
    const lastAreaSection = state.areaSection;
    state.areaSection = state.areaInstance.definition.sections[0];
    let x = state.hero.x / state.areaInstance.palette.w;
    let y = state.hero.y / state.areaInstance.palette.h;
    if (d === 'right') {
        x += state.hero.w / state.areaInstance.palette.w;
    }
    if (d === 'down') {
        y += state.hero.h / state.areaInstance.palette.h;
    }
    for (const section of state.areaInstance.definition.sections) {
        if (isPointInShortRect(x, y, section)) {
            state.areaSection = section;
            break;
        }
    }
    if (lastAreaSection !== state.areaSection) {
        removeAllClones(state);
        state.hero.activeStaff?.remove(state, state.areaInstance);
        state.hero.safeX = state.hero.x;
        state.hero.safeY = state.hero.y;
    }
    refreshOffscreenObjects(state);
}

export function scrollToArea(state: GameState, area: AreaDefinition, direction: Direction): void {
    removeAllClones(state);
    state.nextAreaInstance = createAreaInstance(state, area);
    if (direction === 'up') {
        state.nextAreaInstance.cameraOffset.y = -state.nextAreaInstance.canvas.height;
    }
    if (direction === 'down') {
        state.nextAreaInstance.cameraOffset.y = state.areaInstance.canvas.height;
    }
    if (direction === 'left') {
        state.nextAreaInstance.cameraOffset.x = -state.nextAreaInstance.canvas.width;
    }
    if (direction === 'right') {
        state.nextAreaInstance.cameraOffset.x = state.areaInstance.canvas.width;
    }
}

export function applyLayerToBehaviorGrid(behaviorGrid: TileBehaviors[][], layer: AreaLayerDefinition): void {
    const grid = layer.grid;
    const palette = palettes[grid.palette];
    for (let y = 0; y < grid.tiles.length; y++) {
        behaviorGrid[y] = [];
        for (let x = 0; x < grid.tiles.length; x++) {
            const tile = grid.tiles[y][x];
            if (!tile) {
                continue;
            }
            const behaviors = palette.behaviors[`${tile.x}x${tile.y}`];
            // The behavior grid combines behaviors of all layers, with higher layers
            // overriding the behavior of lower layers.
            if (behaviors) {
                behaviorGrid[y][x] = {...(behaviorGrid[y][x] || {}), ...behaviors};
            }

        }
    }
}

// This resets the tile behavior for a specific tile to whatever the combined behavior of the layers are.
// This is useful when an object in a tile was overriding the tile behavior beneath it and we need to
// reconstruct the original behavior after the object is removed.
export function resetTileBehavior(area: AreaInstance, {x, y}: Tile): void {
    delete area.behaviorGrid?.[y]?.[x];
    for (const layer of area.layers) {
        const palette = layer.palette;
        const tile = layer.tiles[y][x];
        if (!tile) {
            continue;
        }
        const behaviors = palette.behaviors[`${tile.x}x${tile.y}`];
        // The behavior grid combines behaviors of all layers, with higher layers
        // overriding the behavior of lower layers.
        if (behaviors) {
            area.behaviorGrid[y][x] = {...(area.behaviorGrid[y][x] || {}), ...behaviors};
        }
    }
}

export function createAreaInstance(state: GameState, definition: AreaDefinition): AreaInstance {
    const behaviorGrid: TileBehaviors[][] = [];
    for (const layer of definition.layers) {
        applyLayerToBehaviorGrid(behaviorGrid, layer);
    }
    // Currently all layers should use matching grids, so just grab the first.
    const palette = palettes[definition.layers[0].grid.palette];
    const [canvas, context] = createCanvasAndContext(
        palette.w * definition.layers[0].grid.w,
        palette.h * definition.layers[0].grid.h,
    );
    const instance: AreaInstance = {
        definition: definition,
        palette,
        w: definition.layers[0].grid.w,
        h: definition.layers[0].grid.h,
        behaviorGrid,
        tilesDrawn: [],
        checkToRedrawTiles: true,
        layers: definition.layers.map(layer => ({
            definition: layer,
            ...layer,
            ...layer.grid,
            tiles: _.cloneDeep(layer.grid.tiles),
            palette: palettes[layer.grid.palette]
        })),
        objects: [],
        canvas,
        context,
        cameraOffset: {x: 0, y: 0},
    };
    definition.objects.map(o => addObjectToArea(state, instance, createObjectInstance(state, o)));
    return instance;
}

export function getAreaSize(state: GameState): {w: number, h: number, section: ShortRectangle} {
    const area = state.areaInstance;
    return {
        w: area.palette.w * area.w,
        h: area.palette.h * area.h,
        section: {
            x: state.areaSection.x * state.areaInstance.palette.w,
            y: state.areaSection.y * state.areaInstance.palette.h,
            w: state.areaSection.w * state.areaInstance.palette.w,
            h: state.areaSection.h * state.areaInstance.palette.h,
        }
    }
}

export function refreshOffscreenObjects(state: GameState): void {
    const l = state.camera.x + state.areaInstance.cameraOffset.x;
    const t = state.camera.y + state.areaInstance.cameraOffset.y;
    for (let i = 0; i < state.areaInstance.objects.length; i++) {
        const object = state.areaInstance.objects[i];
        if (object.definition && object.definition.type !== 'enemy') {
            if (object.x < l || object.x > l + CANVAS_WIDTH || object.y < t || object.y > t + CANVAS_HEIGHT) {
                if (state.areaInstance.objects[i].alwaysReset) {
                    state.areaInstance.objects[i] = createObjectInstance(state, object.definition);
                }
            }
        }
    }
}
export function addObjectToArea(state: GameState, area: AreaInstance, object: ObjectInstance): void {
    if (object.add) {
        object.add(state, area);
    } else {
        area.objects.push(object);
    }
}
export function removeObjectFromArea(state: GameState, area: AreaInstance, object: ObjectInstance): void {
    if (object.remove) {
        object.remove(state, area);
    } else {
        const index = area.objects.indexOf(object);
        if (index >= 0) {
            area.objects.splice(index, 1);
        }
    }
}

export function destroyTile(state: GameState, target: LayerTile): void {
    const area = state.areaInstance;
    const layer = _.find(area.layers, { key: target.layerKey });
    if (!layer) {
        console.error(`Missing target layer: ${target.layerKey}`);
        return;
    }
    const behavior = area.behaviorGrid?.[target.y]?.[target.x];
    area.tilesDrawn[target.y][target.x] = false;
    area.checkToRedrawTiles = true;
    const underTile = behavior?.underTile || {x: 0, y: 0};
    const key = `${underTile.x}x${underTile.y}`;
    layer.tiles[target.y][target.x] = underTile;
    area.behaviorGrid[target.y][target.x] = layer.palette.behaviors[key];
    if (Math.random() < behavior?.lootChance) {
        const lootType = _.sample(behavior.lootTypes || []);
        if (lootType) {
            const drop = new LootDropObject({
                id: 'drop',
                type: 'loot',
                lootType,
                x: target.x * area.palette.w,
                y: target.y * area.palette.h,
                status: 'normal'
            });
            addObjectToArea(state, area, drop);
            drop.x += (area.palette.w - drop.frame.w) / 2;
            drop.y += (area.palette.h - drop.frame.h) / 2;
        }
    }
}

