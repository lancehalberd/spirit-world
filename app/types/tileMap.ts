import {
    DrawPriority, EffectInstance, Enemy, Frame,
    HitProperties, LogicDefinition, LootTable, MagicElement,
    ObjectDefinition, ObjectInstance,
    Rect,
} from 'app/types';

export type Direction = 'up' | 'down' | 'left' | 'right' | 'upleft' | 'upright' | 'downleft' | 'downright';

export interface TileBehaviors {
    // 0-1
    brightness?: number
    defaultLayer?: 'floor' | 'floor2' | 'field' | 'field2' | 'foreground' | 'foreground2'
    // In pixels
    lightRadius?: number
    // Flag set to indicate tile is invalid for landing on when jumping down a cliff.
    cannotLand?: boolean
    // Sets players action to 'climbing' while on the tile.
    climbable?: boolean
    // Indicates this is a cloud ground tile that the player can walk on if they have cloud walking boots equipped.
    cloudGround?: boolean
    // Indicates this tile is already covered and cannot be covered by anything else. Added to prevent tile behavior
    // from getting messed up while the staff is covering the ground.
    covered?: boolean
    // Similar behavior to covered but only applied when the staff covers the ground.
    // Used to prevents staffs from overlapping.
    blocksStaff?: boolean
    // Can be destroyed by weapon
    cuttable?: number
    // Hit applies to enemies/heroes on contact.
    touchHit?: HitProperties
    // Special development flag indicating that this tile has been deleted from the game
    // and its index is available to be used by a new tile type.
    deleted?: boolean
    // Can be destroyed by an explosion.
    destructible?: boolean
    // Elemental association that can be passed to other objects.
    element?: MagicElement
    // If this is true then this tile will link to a tile with the given tile index in the alternate world.
    linkableTiles?: number[]
    // If this is set, then the default tile in the spirit world will be offset by this number.
    linkedOffset?: number
    lootTable?: LootTable
    // If this is true projectiles can pass over this tile even if it is solid.
    // Also, the bow won't cut low tiles like thorns.
    low?: boolean
    // Similar to low, but only applies when throwing clones over things.
    // Hack to make it so you can throw clones over bushes without making projectiles go over them.
    midHeight?: boolean
    // Low ceiling is solid if the hero has z > 4, also enemies can't move through it by default.
    lowCeiling?: boolean
    // Tile to replace this with if it is exposed to an element (fire melts/burns things, ice freezes things, etc)
    elementTiles?: {[key in MagicElement]?: number}
    // Indicates this tile is outside of the current area section.
    outOfBounds?: boolean
    maskFrame?: Frame
    // Array of frames to use for particles when this tile/object is destroyed.
    particles?: Frame[]
    // Number of particles to generate on destruction.
    numberParticles?: number
    // Key for the sound to play when this tile/object is destroyed.
    breakSound?: string
    // This ground is destroyed if the player walks on it or something lands on it.
    isBrittleGround?: boolean
    // If a player falls in a pit they will take damage and respawn at their last stable location.
    pit?: boolean
    isLava?: Boolean
    isLavaMap?: Uint16Array
    // If this is set to false, then a tile shouldn't override pit/lava behavior underneath it.
    // If this is set to true on an object then it should override ground behavior underneath it.
    isGround?: boolean
    // number of pixels to raise the player when on this tile. Created for the staff ground.
    groundHeight?: number
    // Assign this to skip tiles in source images.
    skipped?: boolean
    // Blocks movement
    solid?: boolean
    solidMap?: Uint16Array
    // Can be picked up with glove
    pickupWeight?: number
    // Tile to display if this tile is removed (picked up, cut, blown up).
    underTile?: number
    shallowWater?: boolean
    slippery?: boolean
    water?: boolean
    // How much damage this tile does if thrown.
    throwDamage?: number
    // Sets a standard transparency for this tile type when the editor is open.
    // This was added for lava tiles since I want to see what is underneath lava as I edit it.
    editorTransparency?: number

    // Indicates ledges that can be jumped down.
    // True values indicate that you can jump out of the tile in the indicated direction.
    // False values indicate that you can jump into the tile from the opposite direction
    // e.g. ledges: {up: false, left: true} means that you can jump south into this tile,
    // and moving north out of this tile is blocked, you can jump west out of this tile and
    // moving east into this tile is blocked.
    ledges?: {
        up?: boolean
        down?: boolean
        left?: boolean
        right?: boolean
    }
    // Only one diagonal ledge can be present in a tile, and it overrides ledges in the corresponding
    // directions. The direction here is the direction the character can jump down.
    diagonalLedge?: 'upleft' | 'upright' | 'downleft' | 'downright'
    // tiles with this behavior will not apply solid property to anything moving south. This should
    // be applied to south, southwest and southeast facing cliff faces so that projectiles can be
    // fired down them, but not up them.
    isSouthernWall?: boolean
    // Implies the tile is >32px tall and can block projectiles even if they
    isVeryTall?: boolean
}

export type TilePalette = number[][];

export interface SourcePalette {
    source: Frame
    // This stores the unique set of tiles that have already been imported
    // from this source palette.
    tiles: number[]
    // This stores a mapping of grid coordinates to full tiles that have been imported.
    // Determining matching tile requires comparing each pixel in a tile to existing tiles which
    // is quite expensive so this grid is only populated on demand as each tile is requested.
    grid: number[][]
}

// A hash for storing full tiles.
// Currently just used to map pixel strings to tiles when checking for unique
// or matching tiles in SourcePalettes.
export interface TileHashMap {
    [key: string]: FullTile
}


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
    maskTiles?: FullTile[][],
}

export interface ZoneLocation {
    zoneKey: string
    floor: number
    areaGridCoords: {x: number, y: number}
    isSpiritWorld: boolean
    x: number
    y: number
    // This can be set to have the player falling when they spawn.
    z?: number
    d: Direction
}

export type LogicalZoneKey =
    'overworld' | 'sky'
    // Material world towns
    | 'waterfallCave' | 'treeVillage'
    | 'holyCityInterior' | 'grandTemple'
    // Material world sub areas
    | 'ascentCave' | 'fertilityShrine'
    | 'peachCave' | 'bushCave'
    // Spirit world
    | 'spiritWorld' | 'spiritSky'
    // Spirit world towns
    | 'jadeCityInterior' | 'jadePalace'
    // Spirit world sub areas
    | 'ascentCaveSpirit' | 'fertilityShrineSpirit'
    | 'peachCaveSpirit'
    // Early dungeons
    | 'tomb' | 'warTemple' | 'cocoon' | 'helix'
    // Mid dungeons
    | 'gauntlet'
    | 'forestTemple'
    | 'waterfallTower'
    | 'forge'
    | 'skyPalace'
    | 'holySanctum'
    // Beast dungeons
    | 'riverTemple' | 'crater' | 'staffTower'
    // Final dungeons
    | 'warPalace' | 'lab' | 'tree' | 'void';

export interface FullZoneLocation extends ZoneLocation {
    logicalZoneKey: LogicalZoneKey
}


export interface AreaLayerDefinition {
    // Unique identifier for this layer.
    key: string
    logicKey?: string
    invertLogic?: boolean
    hasCustomLogic?: boolean
    customLogic?: string
    drawPriority?: DrawPriority
    grid?: TileGridDefinition
    mask?: TileGridDefinition
    // This is not saved on export and is just used when editing.
    visibilityOverride?: 'show' | 'fade' | 'hide'
    // Coordinates for the layer origin, if not (0, 0).
    x?: number
    y?: number
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
    default?: boolean
    layers: AreaLayerDefinition[]
    objects: ObjectDefinition[]
    // Used to divide a larger super tile into smaller screens.
    sections: Rect[]
    // 0/undefined = fully lit, 100 = pitch black.
    dark?: number
    hotLogic?: LogicDefinition
    corrosiveLogic?: LogicDefinition
    // Spirit world areas with real counterparts have this reference set
    // to make it more convenient to translate real tiles/objects to the spirit world.
    parentDefinition?: AreaDefinition
    specialBehaviorKey?: string
    // Set to true if this is a spirit world area.
    isSpiritWorld?: boolean
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
    alternateArea: AreaInstance
    definition: AreaDefinition
    w: number
    h: number
    behaviorGrid: TileBehaviors[][]
    checkToRedrawTiles: boolean
    dark?: number
    tilesDrawn: boolean[][]
    underwater?: boolean
    layers: AreaLayer[]
    effects: EffectInstance[]
    objects: ObjectInstance[]
    priorityObjects: (EffectInstance | ObjectInstance)[][]
    // List of objects to render that is updated each frame.
    // This is all effects+objects as well as any parts of effects+objects.
    objectsToRender: (EffectInstance | ObjectInstance)[]
    // Array of object ids that were created on this instance but have been removed.
    // This is used when refreshing area logic to only add objects that had not already been present.
    removedObjectIds: string[]
    // These cached the tile backgrounds and are only updated when specific tile are marked to be redrawn.
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    // Foreground is only created as needed.
    foregroundCanvas?: HTMLCanvasElement
    foregroundContext?: CanvasRenderingContext2D
    // These cache the tile based lighting and are only created when lighting effects are in play.
    // These are recalculated when from scratch when tiles with lighting behavior are changed.
    lightingCanvas?: HTMLCanvasElement
    lightingContext?: CanvasRenderingContext2D
    // These cache the tile based lights from tiles where you can surface under water and are stored
    // on the underwater area but updated any time the surfae area is redrawn.
    waterSurfaceCanvas?: HTMLCanvasElement
    waterSurfaceContext?: CanvasRenderingContext2D
    // This is used during transitions to indicate that the top left corner
    // of this area is offset from the camera origin by this many pixels.
    cameraOffset: {x: number, y: number}
    enemies: Enemy[]
    allyTargets: (EffectInstance | ObjectInstance)[]
    enemyTargets: (EffectInstance | ObjectInstance)[]
    neutralTargets: (EffectInstance | ObjectInstance)[]
    isHot?: boolean
    // This flag causes the hero to lose spirit energy over time unless they have the water blessing.
    // It is mainly used in waterfall tower, but is also used in the Ice portion of the Holy Sanctum.
    isCorrosive?: boolean
    needsLogicRefresh?: boolean
}


