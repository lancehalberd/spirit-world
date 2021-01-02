import {
    Enemy, Frame, GameState, LootType,
    ShortRectangle,
} from 'app/types';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface TileBehaviors {
    // Can be destroyed by weapon
    cuttable?: number,
    // Deals damage on contact
    damage?: number,
    // Blocks movement
    solid?: boolean,
    // Can be picked up with glove
    pickupWeight?: number,
    // Tile to display if this tile is removed (picked up, cut, blown up).
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
    objects: ObjectDefinition[],
    // Used to divide a larger super tile into smaller screens.
    sections: ShortRectangle[],
}

export type AreaGrid = AreaDefinition[][];

export interface AreaInstance {
    definition: AreaDefinition,
    palette: TilePalette,
    w: number,
    h: number,
    behaviorGrid: TileBehaviors[][],
    enemies: Enemy[],
    layers: AreaLayer[],
    objects: ObjectInstance[],
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    // This is used during transitions to indicate that the top left corner
    // of this area is offset from the camera origin by this many pixels.
    cameraOffset: {x: number, y: number},
}

export interface ObjectInstance {
    definition?: ObjectDefinition,
    behaviors?: TileBehaviors,
    drawPriority?: 'background' | 'foreground' | 'sprites',
    x: number, y: number,
    // This is called when a user grabs a solid tile
    getHitBox?: (state: GameState) => ShortRectangle,
    onGrab?: (state: GameState) => void,
    update?: (state: GameState) => void,
    render?: (context: CanvasRenderingContext2D, state: GameState) => void,
}

export type ObjectStatus = 'normal' | 'gone' | 'hiddenSwitch' | 'hiddenEnemy';
export interface BaseObjectDefinition {
    id: string,
    status: ObjectStatus,
    x: number,
    y: number,
}

export interface LootObjectDefinition extends BaseObjectDefinition {
    type: 'chest' | 'loot',
    lootType: LootType,
    amount?: number,
}

export interface EnemyObjectDefinition extends BaseObjectDefinition {
    type: 'enemy',
    enemyType: 'snake',
}

export type ObjectDefinition = LootObjectDefinition | EnemyObjectDefinition;

