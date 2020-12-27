import { AnimationEffect, Frame, GameState, LootObject, ThrownObject } from 'app/types';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface TileBehaviors {
    damage?: number,
    solid?: boolean,
    canPickup?: boolean,
    underTile?: {x: number, y: number}
}

export interface TilePalette {
    // The size of the tiles
    w: number,
    h: number,
    // The source frame of the tiles.
    source: Frame,
    // Array of tiles to randomly apply by default.
    defaultTiles?: Tile[],
    behaviors?: {
        [key: string]: TileBehaviors,
    }
}

export interface Tile {
    // The column/row coordinates of the tile in the source frame.
    x: number,
    y: number,
}

export interface TileGrid {
    // The dimensions of the grid.
    w: number,
    h: number,
    // The palette to use for this grid (controls the size of tiles)
    palette: TilePalette,
    // The matrix of tiles
    tiles: Tile[][],
}

interface TileGridDefinition {
    // The dimensions of the grid.
    w: number,
    h: number,
    // The palette to use for this grid (controls the size of tiles)
    palette: string,
    // The matrix of tiles
    tiles: Tile[][],
}

export interface AreaLayerDefinition {
    // Unique identifier for this layer.
    key: string,
    grid?: TileGridDefinition,
    // Coordinates for the layer origin, if not (0, 0).
    x?: number,
    y?: number,
}

export interface AreaLayer extends TileGrid {
    // Unique identifier for this layer.
    key: string,
    // Coordinates for the layer origin, if not (0, 0).
    x?: number,
    y?: number,
    tilesDrawn: boolean[][],
}

export interface AreaDefinition {
    layers: AreaLayerDefinition[],
    objects?: any[],
}

export interface AreaInstance {
    definition: AreaDefinition,
    palette: TilePalette,
    w: number,
    h: number,
    behaviorGrid: TileBehaviors[][],
    layers: AreaLayer[],
    objects: ObjectInstance[],
}

export interface BaseObjectInstance {
    type: string,
    update?: (state) => void,
    render?: (context: CanvasRenderingContext2D, state: GameState) => void,
}

export type ObjectInstance = AnimationEffect | ThrownObject | LootObject;

