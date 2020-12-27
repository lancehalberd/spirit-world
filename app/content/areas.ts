import _ from 'lodash';

import { createAnimation } from 'app/utils/animations';
import { AreaDefinition, AreaInstance, AreaLayerDefinition, GameState, TilePalette } from 'app/types';

export const [mapTilesFrame] = createAnimation('gfx/tiles/overworld.png', {w: 384, h: 640}, {cols: 5}).frames;
const worldMapPalette: TilePalette = {
    w: 16, h: 16,
    // The source frame of the tiles.
    source: mapTilesFrame,
    // Array of tiles to randomly apply by default.
    defaultTiles: [{x: 0, y: 16}, {x: 1, y: 16}, {x: 2, y: 16}, {x: 3, y: 16}],
    behaviors: {
        '16x8': {solid: true, canPickup: true, underTile: {x: 1, y: 8}},
        '5x8': {solid: true},
        '7x8': {damage: 1},
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
    };
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

export function enterArea(state: GameState, area: AreaDefinition, x: number, y: number): void {
    state.areaInstance = createAreaInstance(area);
    state.hero.x = x;
    state.hero.y = y;
}

export function createAreaInstance(definition: AreaDefinition): AreaInstance {
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
    return {
        definition: definition,
        palette,
        w: definition.layers[0].grid.w,
        h: definition.layers[0].grid.h,
        behaviorGrid,
        layers: definition.layers.map(layer => ({
            ...layer,
            ...layer.grid,
            tilesDrawn: [],
            palette: palettes[layer.grid.palette]
        })),
        objects: [],
    };
}

