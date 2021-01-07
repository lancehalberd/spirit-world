import _ from 'lodash';

import { createObjectInstance } from 'app/content/objects';
import { LootDropObject } from 'app/content/lootObject';
import { createCanvasAndContext } from 'app/dom';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from 'app/gameConstants';
import { createAnimation } from 'app/utils/animations';
import { isPointInShortRect } from 'app/utils/index';
import { updateCamera } from 'app/updateCamera';

import {
    AreaDefinition, AreaGrid, AreaInstance, AreaLayerDefinition,
    Direction, GameState, ObjectInstance, ShortRectangle, Tile, TilePalette,
} from 'app/types';

export const [mapTilesFrame] = createAnimation('gfx/tiles/overworld.png', {w: 384, h: 640}).frames;
const worldMapPalette: TilePalette = {
    w: 16, h: 16,
    // The source frame of the tiles.
    source: mapTilesFrame,
    // Array of tiles to randomly apply by default.
    defaultTiles: [{x: 0, y: 16}, {x: 1, y: 16}, {x: 2, y: 16}, {x: 3, y: 16}],
    behaviors: {
        '11x3': {pit: true},
        '16x8': {solid: true, pickupWeight: 1, underTile: {x: 1, y: 8}, lootChance: 0.2, lootTypes: ['peach']},
        '16x9': {solid: true, pickupWeight: 1, underTile: {x: 1, y: 9}, lootChance: 0.2, lootTypes: ['peach']},
        '16x10': {solid: true, pickupWeight: 1, underTile: {x: 1, y: 10}, lootChance: 0.2, lootTypes: ['peach']},
        '17x8': {solid: true, pickupWeight: 2, underTile: {x: 1, y: 8}, lootChance: 0.2, lootTypes: ['peach']},
        '17x9': {solid: true, pickupWeight: 2, underTile: {x: 1, y: 9}, lootChance: 0.2, lootTypes: ['peach']},
        '17x10': {solid: true, pickupWeight: 2, underTile: {x: 1, y: 10}, lootChance: 0.2, lootTypes: ['peach']},
        '18x8': {solid: true, pickupWeight: 3, underTile: {x: 1, y: 8}, lootChance: 0.2, lootTypes: ['peach']},
        '18x9': {solid: true, pickupWeight: 3, underTile: {x: 1, y: 9}, lootChance: 0.2, lootTypes: ['peach']},
        '18x10': {solid: true, pickupWeight: 3, underTile: {x: 1, y: 10}, lootChance: 0.2, lootTypes: ['peach']},
        '5x8': {solid: true},
        '5x9': {solid: true},
        '5x10': {solid: true},
        '6x8': {solid: true, pickupWeight: 0, cuttable: 1, underTile: {x: 0, y: 16}, lootChance: 0.5, lootTypes: ['peach'] },
        '6x9': {solid: true, pickupWeight: 0, cuttable: 1, underTile: {x: 1, y: 23}, lootChance: 0.5, lootTypes: ['peach']},
        '6x10': {solid: true, pickupWeight: 0, cuttable: 1, underTile: {x: 13, y: 13}, lootChance: 0.5, lootTypes: ['peach']},
        '7x8': {damage: 1, cuttable: 1, underTile: {x: 0, y: 16}},
        '7x9': {damage: 1, cuttable: 1, underTile: {x: 1, y: 23}},
        '7x10': {damage: 1, cuttable: 1, underTile: {x: 13, y: 13}},
    },
};

export const palettes: {[key: string]: TilePalette} = {
    worldMap: worldMapPalette
};

export function getDefaultArea(): AreaDefinition {
    return {
        layers: [
            {
                key: 'background',
                grid: {
                    // The dimensions of the grid.
                    w: 32,
                    h: 32,
                    // The palette to use for this grid (controls the size of tiles)
                    palette: 'worldMap',
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
    for (const clone of state.hero.clones) {
        const index = state.areaInstance.objects.indexOf(clone);
        if (index >= 0) {
            state.areaInstance.objects.splice(index, 1);
        }
    }
    state.hero.clones = []
    state.hero.activeClone = null;
}

export function enterArea(state: GameState, area: AreaDefinition, x: number, y: number): void {
    // Remove all clones on changing areas.
    removeAllClones(state);
    state.hero.activeStaff?.remove(state);
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
        state.hero.activeStaff?.remove(state);
        state.hero.safeX = state.hero.x;
        state.hero.safeY = state.hero.y;
    }
    refreshOffscreenObjects(state);
}

export function scrollToArea(state: GameState, area: AreaDefinition, direction: Direction): void {
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

export function createAreaInstance(state: GameState, definition: AreaDefinition): AreaInstance {
    const grid = definition.layers[0].grid;
    const palette = palettes[grid.palette];
    const behaviorGrid = [];
    for (let y = 0; y < grid.tiles.length; y++) {
        behaviorGrid[y] = [];
        for (let x = 0; x < grid.tiles.length; x++) {
            const tile = grid.tiles[y][x];
            if (!tile) {
                continue;
            }
            behaviorGrid[y][x] = palette.behaviors[`${tile.x}x${tile.y}`];
        }
    }
    const [canvas, context] = createCanvasAndContext(
        palette.w * definition.layers[0].grid.w,
        palette.h * definition.layers[0].grid.h,
    );
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    return {
        definition: definition,
        palette,
        w: definition.layers[0].grid.w,
        h: definition.layers[0].grid.h,
        behaviorGrid,
        layers: definition.layers.map(layer => ({
            ...layer,
            ...layer.grid,
            tiles: _.cloneDeep(layer.grid.tiles),
            tilesDrawn: [],
            palette: palettes[layer.grid.palette]
        })),
        objects: definition.objects.map(o => createObjectInstance(state, o)).filter(o => o),
        canvas,
        context,
        cameraOffset: {x: 0, y: 0},
    };
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
                state.areaInstance.objects[i] = createObjectInstance(state, object.definition);
            }
        }
    }
}

export function removeObjectFromArea(area: AreaInstance, object: ObjectInstance): void {
    const index = area.objects.indexOf(object);
    if (index >= 0) {
        area.objects.splice(index, 1);
    }
}

export function destroyTile(state: GameState, target: Tile): void {
    const area = state.areaInstance;
    const layer = area.layers[0];
    const behavior = area.behaviorGrid?.[target.y]?.[target.x];
    layer.tiles[target.y][target.x] = behavior?.underTile;
    layer.tilesDrawn[target.y][target.x] = false;
    const key = `${behavior?.underTile.x}x${behavior?.underTile.y}`;
    area.behaviorGrid[target.y][target.x] = area.palette.behaviors[key];
    if (Math.random() < behavior.lootChance) {
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
            area.objects.push(drop);
            drop.x += (area.palette.w - drop.frame.w) / 2;
            drop.y += (area.palette.h - drop.frame.h) / 2;
        }
    }
}

