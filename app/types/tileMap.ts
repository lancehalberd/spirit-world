import {
    DrawPriority,
    Frame, LootTable,
    ObjectDefinition, ObjectInstance,
    ShortRectangle,
} from 'app/types';

export type Direction = 'up' | 'down' | 'left' | 'right' | 'upleft' | 'upright' | 'downleft' | 'downright';

export interface TileBehaviors {
    // 0-1
    brightness?: number,
    defaultLayer?: 'floor' | 'field' | 'foreground',
    // In pixels
    lightRadius?: number,
    // Sets players action to 'climbing' while on the tile.
    climbable?: boolean,
    // Can be destroyed by weapon
    cuttable?: number,
    // Deals damage on contact
    damage?: number,
    // Can be destroyed by an explosion.
    destructible?: boolean,
    // This tile can be jumped over in this direction but is otherwise impassable.
    jumpDirection?: Direction,
    // If this is true then this tile will link to a tile with the given tile index in the alternate world.
    linkableTiles?: number[],
    // If this is set, then the default tile in the spirit world will be offset by this number.
    linkedOffset?: number,
    lootTable?: LootTable,
    // If this is true projectiles can pass over this tile even if it is solid.
    // Also, the bow won't cut low tiles like thorns.
    low?: boolean,
    // Indicates this tile is outside of the current area section.
    outOfBounds?: boolean,
    // Array of frames to use for particles when this tile/object is destroyed.
    particles?: Frame[],
    // If a player falls in a pit they will take damage and respawn at their last stable location.
    pit?: boolean,
    // Assign this to skip tiles in source images.
    skipped?: boolean,
    // Blocks movement
    solid?: boolean,
    solidMap?: Uint16Array,
    // Can be picked up with glove
    pickupWeight?: number,
    // Tile to display if this tile is removed (picked up, cut, blown up).
    underTile?: number,
    growTiles?: number[],
    shallowWater?: boolean,
    water?: boolean,
}

export type TilePalette = number[][];


export interface TileCoords {
    layerKey?: string,
    x: number,
    y: number,
}

export interface Tile {
    // The column/row coordinates of the tile in the source frame.
    x: number,
    y: number,
}

export interface FullTile {
    // The index of this tile in the `allTiles` array.
    index: number,
    frame: Frame,
    behaviors?: TileBehaviors,
    // This will be set to the linked tile when a player is carrying a linked tile.
    linkedTile?: FullTile,
}

export interface TileGridDefinition {
    // The dimensions of the grid.
    w: number,
    h: number,
    drawPriority?: DrawPriority,
    // The matrix of tiles
    tiles: number[][],
}

export interface TileGrid {
    // The dimensions of the grid.
    w: number,
    h: number,
    // The matrix of tiles
    tiles: FullTile[][],
}

export interface AreaTileGrid extends TileGrid {
    // The matrix of tiles as they should be on resetting the area (respawning bushes etc)
    // This is different than the definition because certain effects change the reset behavior
    // but should not actually change the definition of the area.
    originalTiles: FullTile[][],
}

export interface ZoneLocation {
    zoneKey: string,
    floor: number,
    areaGridCoords: {x: number, y: number},
    isSpiritWorld: boolean,
    x: number,
    y: number,
    // This can be set to have the player falling when they spawn.
    z?: number,
    d: Direction,
}


export interface AreaLayerDefinition {
    // Unique identifier for this layer.
    key: string,
    logicKey?: string,
    drawPriority?: DrawPriority,
    grid?: TileGridDefinition,
    // This is not saved on export and is just used when editing.
    visibilityOverride?: 'show' | 'hide',
    // Coordinates for the layer origin, if not (0, 0).
    x?: number,
    y?: number,
}

export interface AreaLayer extends AreaTileGrid {
    // Unique identifier for this layer.
    key: string,
    definition: AreaLayerDefinition,
    // Coordinates for the layer origin, if not (0, 0).
    x?: number,
    y?: number,
}

export interface AreaDefinition {
    default?: boolean,
    layers: AreaLayerDefinition[],
    objects: ObjectDefinition[],
    // Used to divide a larger super tile into smaller screens.
    sections: ShortRectangle[],
    // 0/undefined = fully lit, 100 = pitch black.
    dark?: number,
    // Spirit world areas with real counterparts have this reference set
    // to make it more convenient to translate real tiles/objects to the spirit world.
    parentDefinition?: AreaDefinition,
    // Set to true if this is a spirit world area.
    isSpiritWorld?: boolean,
}

export interface Zone {
    key: string,
    // If this zone is an underwater area, this key is set to the zone key of the surface area.
    // Travel to the surface is always from the top floor of the underwater zone to the bottom
    // floor of the surface zone.
    surfaceKey?: string,
    // If this zone has a corresponding underwater area, this key is set to the zone key of the underwater area.
    underwaterKey?: string,
    floors: Floor[],
}

export interface Floor {
    origin?: {x: number, y: number},
    grid?: AreaGrid,
    spiritGrid: AreaGrid,
}

export type AreaGrid = AreaDefinition[][];

export interface AreaInstance {
    alternateArea: AreaInstance,
    definition: AreaDefinition,
    w: number,
    h: number,
    behaviorGrid: TileBehaviors[][],
    checkToRedrawTiles: boolean,
    tilesDrawn: boolean[][],
    layers: AreaLayer[],
    objects: ObjectInstance[],
    priorityObjects: ObjectInstance[][],
    // These cached the tile backgrounds and are only updated when specific tile are marked to be redrawn.
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    // Foreground is only created as needed.
    foregroundCanvas?: HTMLCanvasElement,
    foregroundContext?: CanvasRenderingContext2D,
    // These cache the tile based lighting and are only created when lighting effects are in play.
    // These are recalculated when from scratch when tiles with lighting behavior are changed.
    lightingCanvas?: HTMLCanvasElement,
    lightingContext?: CanvasRenderingContext2D,
    // This is used during transitions to indicate that the top left corner
    // of this area is offset from the camera origin by this many pixels.
    cameraOffset: {x: number, y: number},
}


