interface PackedImage extends Rect {
    originalSource: string
}

interface PackedImageData {
    packedImages: PackedImage[]
    image: HTMLImageElement | HTMLCanvasElement
}

// PackedImageData with additional fields used while packing.
interface PackingImageData extends PackedImageData {
    grid: boolean[][]
    context: CanvasRenderingContext2D
}

interface PaletteTarget {
    key: string
    x: number
    y: number
}

interface TileSource {
    // The size of the tiles
    w: number
    h: number
    // The source frame of the tiles.
    source: Frame
    behaviors?: {
        [key: string]: TileBehaviors
    }
    tileCoordinates?: number[][]
    paletteTargets?: PaletteTarget[]
    animationProps?: {
        // How many source frames are in this animation
        frames: number
        // The sequence to display the source frames in.
        // Should be 2, 3 or 6 long to loop smoothly
        frameSequence: number[]
        // The offset between each frame in tiles.
        offset: Point
    }
}

interface NineSlice {
    w: number
    h: number
    // Rectangle that defines the center of the nine slice
    r: Rect
    layers: {
        key: string
        grid: number[][]
    }[]
}

type MapIcon = 'door' | 'chest' | 'down' | 'up'

type DefaultLayer = 'water' | 'floor' | 'floor2' | 'field' | 'field2' | 'behaviors' | 'foreground' | 'foreground2';

interface TileBehaviors {
    // 0-1
    brightness?: number
    defaultLayer?: DefaultLayer
    // In pixels
    lightRadius?: number
    lightColor?: LightColor
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
    // Entrance tiles are open tiles in doorways that the hero can move onto, but other objects treat as solid.
    isEntrance?: boolean
    // Tile to replace this with if it is exposed to an element (fire melts/burns things, ice freezes things, etc)
    elementTiles?: {[key in MagicElement]?: number}
    // Specifies tile replacements when exposed to an element based on an offset rather than absolute tile index.
    elementOffsets?: {[key in MagicElement]?: number}
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
    // The same as pit but with pixel precision.
    pitMap?: Uint16Array
    // If a player falls over a single tile pit they will be eased towards being tile aligned.
    isSingleTilePit?: boolean
    // This can be set to true for pit tiles to indicate that they are the wall background for a pit
    // and that the player should move south until they hit a regular pit tile while falling,
    // otherwise they will appear to fall into the wall.
    pitWall?: boolean
    isLava?: boolean
    // The same as isLava but with pixel precision.
    isLavaMap?: Uint16Array
    // If this is set to false, then a tile shouldn't override pit/lava behavior underneath it.
    // If this is set to true on an object then it should override ground behavior underneath it.
    isGround?: boolean
    // The same as isGround but with pixel precision.
    isGroundMap?: Uint16Array
    // If this is set on an object, it will override solid behavior behind it, but not ground behavior.
    isNotSolid?: boolean
    // If this is true, this tile is an overlay on top of the ground and should have cover effects applied
    // to the layer beneath it instead of on top of it.
    // For example, shadows are typically on `field2` which is in the background, but freezing tiles shuold
    // apply to the layers beneath the shadow, otherwise the frozen tile will be rendered over the shadow
    // instead of under it.
    isOverlay?: boolean
    // number of pixels to raise the player when on this tile. Created for the staff ground.
    groundHeight?: number
    // Indicates that this tile shouldn't push the player towards pits when the player is in the falling animation.
    // Player eases away from non-pit tiles to pit tiles when falling so they will appear to fall into the abyss
    // and not through non pit tiles. However, some objects like moving platforms allow the player to fall under them
    // and don't require pushing the player towards pit tiles.
    canFallUnder?: boolean
    // Assign this to skip tiles in source images.
    skipped?: boolean
    // Blocks movement
    solid?: boolean
    // The same as solid but with pixel precision.
    solidMap?: Uint16Array
    // Can be picked up with glove
    pickupWeight?: number
    // Tile to display if this tile is removed (picked up, cut, blown up).
    underTile?: number
    // Tile to display when this tile is picked up, if different than the tile itself.
    // For example, a full carrot tile is displayed when a buried carrot is picked up,
    pickupTile?: number
    // Boolean flag indicating underTile should be rendered right before rendering this tile.
    // Useful if the tile over the underTile is intended to be transparent like for ice.
    showUnderTile?: boolean
    shallowWater?: boolean
    // Indicates the tile is frozen which causes it to have an ice overlay and slippery behavior.
    isFrozen?: boolean
    slippery?: boolean
    // To be used if we add pixel precision to ice floors for ice attacks.
    slipperyMap?: Uint16Array
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
    // If defined, this function will be called each time this tile should be rendered instead of the
    // default drawing behavior.
    // Used primarily to add debugging information when the editor is enabled.
    render?: (context: CanvasRenderingContext2D, tile: FullTile, target: Rect, frame: number) => void
}

type TilePalette = number[][];

interface SourcePalette {
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
interface TileHashMap {
    [key: string]: FullTile
}


interface TileCoords {
    layerKey?: string,
    x: number,
    y: number,
}

interface Tile {
    // The column/row coordinates of the tile in the source frame.
    x: number,
    y: number,
}

interface FullTile {
    // The index of this tile in the `allTiles` array.
    index: number
    frame: Frame
    // The 2,3 or 6 frame animation for an animated tile.
    animation?: FrameAnimation
    behaviors?: TileBehaviors
    // This will be set to the linked tile when a player is carrying a linked tile.
    linkedTile?: FullTile
}

interface TileGridDefinition {
    // The dimensions of the grid.
    w: number,
    h: number,
    drawPriority?: DrawPriority,
    // The matrix of tiles
    tiles: number[][],
}

interface TileGrid {
    // The dimensions of the grid.
    w: number,
    h: number,
    // The matrix of tiles
    tiles: FullTile[][],
}

interface AreaTileGrid extends TileGrid {
    // The matrix of tiles as they should be on resetting the area (respawning bushes etc)
    // This is different than the definition because certain effects change the reset behavior
    // but should not actually change the definition of the area.
    originalTiles: FullTile[][],
    maskTiles?: FullTile[][],
}

interface ZoneLocation {
    zoneKey: string
    floor: number
    areaGridCoords: {x: number, y: number}
    isSpiritWorld: boolean
    x: number
    y: number
    // This can be set to have the player falling when they spawn.
    z?: number
    d: CardinalDirection
}

type LogicalZoneKey =
    'overworld' | 'sky'
    // Material world towns
    | 'waterfallCave' | 'treeVillage'
    | 'holyCityInterior' | 'grandTemple'
    // Material world sub areas
    | 'ascentCave' | 'fertilityShrine'
    | 'peachCave' | 'bushCave' | 'frozenCave' | 'lakeTunnel' | 'treeCave'
    // Spirit world
    | 'spiritWorld' | 'spiritSky'
    // Spirit world towns
    | 'jadeCityInterior' | 'jadePalace'
    // Spirit world sub areas
    | 'ascentCaveSpirit' | 'fertilityShrineSpirit'
    | 'peachCaveSpirit' | 'hypeCave' | 'bellCave' | 'cloneCave'
    | 'warPalaceWestRoom'
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
    | 'warPalace' | 'lab' |
    // This functions as a single dungeon, but currently it is too large to fit both on a single map.
    'tree' | 'treeSpirit'
    | 'void';

interface FullZoneLocation extends ZoneLocation {
    logicalZoneKey: LogicalZoneKey
}


interface AreaLayerDefinition {
    // Unique identifier for this layer.
    key: string
    logicKey?: string
    invertLogic?: boolean
    hasCustomLogic?: boolean
    customLogic?: string
    drawPriority?: DrawPriority
    grid?: TileGridDefinition
    mask?: TileGridDefinition
    // This is not saved on and is just used when editing.
    visibilityOverride?: 'show' | 'fade' | 'hide'
    // Coordinates for the layer origin, if not (0, 0).
    x?: number
    y?: number
}

interface AreaLayer extends AreaTileGrid {
    // Unique identifier for this layer.
    key: string,
    definition: AreaLayerDefinition,
    // Coordinates for the layer origin, if not (0, 0).
    x?: number,
    y?: number,
}

interface AreaSection extends Rect {
    hotLogic?: LogicDefinition
    fogLogic?: LogicDefinition
    // Unique identifier for this section that can be used to look it up
    // and is used when tracking whether the player has explored a section.
    index?: number
    // The ID of the map to display this section in, defaults to the zoneKey of the section.
    mapId?: string
    // The ID of the map floor to display this section in. Defaults to `${floorIndex + 1}F`
    floorId?: string
    // The map grid coordinates of this section
    mapX?: number
    mapY?: number
    // The entrance to render the hero marker at for sections that display the world map
    // instead of dungeon maps.
    entranceId?: string
    hideMap?: boolean
}

interface AreaSectionInstance extends AreaSection {
    // Just added this here for convenient access when editing.
    definition: AreaSection
    isFoggy?: boolean
    isHot?: boolean
}

interface AreaDefinition {
    default?: boolean
    w?: number
    h?: number
    layers: AreaLayerDefinition[]
    objects: ObjectDefinition[]
    variants?: VariantData[]
    // Used to divide a larger super tile into smaller screens.
    sections: AreaSection[]
    // 0/undefined = fully lit, 100 = pitch black.
    dark?: number
    corrosiveLogic?: LogicDefinition
    // Spirit world areas with real counterparts have this reference set
    // to make it more convenient to translate real tiles/objects to the spirit world.
    parentDefinition?: AreaDefinition
    specialBehaviorKey?: string
    // Set to true if this is a spirit world area.
    isSpiritWorld?: boolean
}

interface Zone {
    key: string
    // If this zone is an underwater area, this key is set to the zone key of the surface area.
    // Travel to the surface is always from the top floor of the underwater zone to the bottom
    // floor of the surface zone.
    surfaceKey?: string
    // If this zone has a corresponding underwater area, this key is set to the zone key of the underwater area.
    underwaterKey?: string
    floors: Floor[]
    // How large each area is in this zone. Since each floor is on a grid, areas must have consistent sizes in order
    // to be laid out without gaps between them.
    // If this is not set, a default value of {w: 32, h: 32} is assumed.
    areaSize?: {w: number, h: number}
}

interface Floor {
    origin?: {x: number, y: number}
    grid?: AreaGrid
    spiritGrid: AreaGrid
}

type AreaGrid = AreaDefinition[][];

interface AreaFrame {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
    frameIndex: number
    isForeground: boolean
    tilesDrawn: boolean[][]
}

interface AreaInstance {
    alternateArea: AreaInstance
    definition: AreaDefinition
    w: number
    h: number
    behaviorGrid: TileBehaviors[][]
    checkToRedrawTiles: boolean
    // Flag indicating that water surface beneath this area should be redrawn.
    checkToRedrawWaterSurface?: boolean
    tilesDrawn: boolean[][]
    // Tracks which area frames have been drawn since the last time checkToRedrawTiles was set.
    drawnFrames: Set<AreaFrame>
    dark?: number
    underwater?: boolean
    layers: AreaLayer[]
    effects: EffectInstance[]
    objects: ObjectInstance[]
    // Update each frame to include all objects/effects+parts that were interactive in the area before the last round of updating objects.
    allActiveObjects: (EffectInstance | ObjectInstance)[]
    priorityObjects: (EffectInstance | ObjectInstance)[][]
    // List of objects to render that is updated each frame.
    // This is all effects+objects as well as any parts of effects+objects.
    objectsToRender: (EffectInstance | ObjectInstance)[]
    // Array of object definitions that were created on this instance but have been removed.
    // This is used when refreshing area logic to only add objects that had not already been present.
    removedObjectDefinitions: Set<ObjectDefinition>
    // These cache the tile backgrounds and are only updated when specific tile are marked to be redrawn.
    // Each as an array of 6 elements corresponding to the 6 frames of animation used for background tiles.
    backgroundFrames: AreaFrame[]
    foregroundFrames: AreaFrame[]
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
    // This flag causes the hero to lose spirit energy over time unless they have the water blessing.
    // It is mainly used in waterfall tower, but is also used in the Ice portion of the Holy Sanctum.
    isCorrosive?: boolean
    needsLogicRefresh?: boolean
    needsIceRefresh?: boolean
}


