import {
    Frame, GameState, Hero, LootType, MagicElement,
    ShortRectangle,
} from 'app/types';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface TileBehaviors {
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
    // If this is true then this tile will link to a matching tile in the alternate world.
    linked?: boolean,
    lootChance?: number,
    lootTypes?: LootType[],
    // If this is true projectiles can pass over this tile even if it is solid.
    // Also, the bow won't cut low tiles like thorns.
    low?: boolean,
    // Indicates this tile is outside of the current area section.
    outOfBounds?: boolean,
    // Array of frames to use for particles when this tile/object is destroyed.
    particles?: Frame[],
    // If a player falls in a pit they will take damage and respawn at their last stable location.
    pit?: boolean,
    // Blocks movement
    solid?: boolean,
    solidMap?: Uint16Array,
    // Can be picked up with glove
    pickupWeight?: number,
    // Tile to display if this tile is removed (picked up, cut, blown up).
    underTile?: {x: number, y: number},
    growTiles?: Tile[],
    water?: boolean,
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

export interface LayerTile {
    layerKey: string,
    linked?: boolean,
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
    grid?: TileGridDefinition,
    // Coordinates for the layer origin, if not (0, 0).
    x?: number,
    y?: number,
}

export interface AreaLayer extends TileGrid {
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
    dark?: boolean,
    // Spirit world areas with real counterparts have this reference set
    // to make it more convenient to translate real tiles/objects to the spirit world.
    parentDefinition?: AreaDefinition,
    // Set to true if this is a spirit world area.
    isSpiritWorld?: boolean,
}

export interface Zone {
    key: string,
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
    palette: TilePalette,
    w: number,
    h: number,
    behaviorGrid: TileBehaviors[][],
    checkToRedrawTiles: boolean,
    tilesDrawn: boolean[][],
    layers: AreaLayer[],
    objects: ObjectInstance[],
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    // This is used during transitions to indicate that the top left corner
    // of this area is offset from the camera origin by this many pixels.
    cameraOffset: {x: number, y: number},
}

export type DrawPriority = 'background' | 'foreground' | 'sprites'

export interface ObjectInstance {
    area?: AreaInstance,
    definition?: ObjectDefinition,
    linkedObject?: ObjectInstance,
    behaviors?: TileBehaviors,
    drawPriority?: DrawPriority,
    alwaysReset?: boolean,
    x: number, y: number, z?: number,
    status: ObjectStatus,
    changeStatus?: (state: GameState, status: ObjectStatus) => void,
    cleanup?: (state: GameState) => void,
    // This is called when a user grabs a solid tile
    getHitbox?: (state: GameState) => ShortRectangle,
    onDestroy?: (state: GameState, dx: number, dy: number) => void,
    // When the hero tries to pick up the object with the passive skill button.
    // The direction is the direction the player is facing.
    onGrab?: (state: GameState, direction: Direction, hero: Hero) => void,
    // When the hero hits the object with a weapon or tool
    onHit?: (state: GameState, direction: Direction, element?: MagicElement) => void,
    // When the hero grabs an object and attempts to move.
    onPull?: (state: GameState, direction: Direction, hero: Hero) => void,
    // When the hero walks into an object
    onPush?: (state: GameState, direction: Direction) => void,
    pullingHeroDirection?: Direction,
    update?: (state: GameState) => void,
    add?: (state: GameState, area: AreaInstance) => void,
    remove?: (state: GameState) => void,
    render: (context: CanvasRenderingContext2D, state: GameState) => void,
}

export type ObjectStatus = 'active' | 'closed' | 'closedEnemy' | 'closedSwitch'
    | 'gone' | 'hiddenSwitch' | 'hiddenEnemy' | 'normal';

export interface MovementProperties {
    canPush?: boolean,
    canFall?: boolean,
    canSwim?: boolean,
    canClimb?: boolean,
    // Whether the mover should wiggle to fit into tight spaces.
    canWiggle?: boolean,
}

export interface BaseObjectDefinition {
    id: string,
    // Whether this is linked to an object in the physical/spirit world.
    linked?: boolean,
    // Whether this is a spirit object.
    spirit?: boolean,
    // Stores optional style type for some objects, e.g., 'short' vs 'tall' signs.
    style?: string,
    status: ObjectStatus,
    x: number,
    y: number,
    d?: Direction,
}

export interface BallGoalDefinition extends BaseObjectDefinition {
    type: 'ballGoal',
    targetObjectId?: string,
}

export interface FloorSwitchDefinition extends BaseObjectDefinition {
    type: 'floorSwitch',
    toggleOnRelease?: boolean,
    targetObjectId?: string,
}

export interface LootObjectDefinition extends BaseObjectDefinition {
    type: 'chest' | 'loot',
    lootType: LootType,
    lootAmount?: number,
    // If this is 0/unset it means it is progressive.
    lootLevel?: number,
}

export interface CrystalSwitchDefinition extends BaseObjectDefinition {
    type: 'crystalSwitch',
    element: MagicElement,
    // If this is set, this crystal will de-activate after this many milliseconds.
    timer?: number,
    targetObjectId?: string,
}

export interface EntranceDefinition extends BaseObjectDefinition {
    type: 'pitEntrance' | 'door' | 'stairs',
    targetZone?: string,
    targetObjectId?: string,
}

export interface SignDefinition extends BaseObjectDefinition {
    type: 'sign',
    message: string,
}

export type SimpleObjectType = 'marker' | 'pushPull' | 'rollingBall' | 'tippable' | 'waterPot';

export interface SimpleObjectDefinition extends BaseObjectDefinition {
    type: SimpleObjectType,
}

export type EnemyType =
    'beetle' | 'beetleHorned' | 'beetleMini' | 'beetleWinged'
    | 'beetleBossWingedMinionDefinition'
    | 'snake';

export type BossType =
    'beetleBoss'

export interface EnemyObjectDefinition extends BaseObjectDefinition {
    type: 'enemy',
    enemyType: EnemyType,
}

export interface BossObjectDefinition extends BaseObjectDefinition {
    type: 'boss',
    enemyType: BossType,
    lootType: LootType,
    lootAmount?: number,
    // If this is 0/unset it means it is progressive.
    lootLevel?: number,
}

export type ObjectDefinition = SimpleObjectDefinition
    | BallGoalDefinition
    | BossObjectDefinition
    | CrystalSwitchDefinition
    | EntranceDefinition
    | EnemyObjectDefinition
    | FloorSwitchDefinition
    | LootObjectDefinition
    | SignDefinition
    ;

export type ObjectType = ObjectDefinition['type'];

