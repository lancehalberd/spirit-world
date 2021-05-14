import {
    AreaInstance, BossType,
    DecorationType, Direction, EnemyType,
    GameState, Hero, LootType,
    MagicElement, MinionType,
    NPCBehavior, NPCStyle,
    ShortRectangle, TileBehaviors,
} from 'app/types';

export type DrawPriority = 'background' | 'foreground' | 'sprites'

export interface ObjectInstance {
    area?: AreaInstance,
    definition?: ObjectDefinition,
    linkedObject?: ObjectInstance,
    behaviors?: TileBehaviors,
    drawPriority?: DrawPriority,
    // Set this flag for objects that need to update during screen transitions, such as doorways.
    updateDuringTransition?: boolean,
    changesAreas?: boolean,
    // Setting this true is the same as returning true always for shouldReset+shouldRespawn.
    alwaysReset?: boolean,
    ignorePits?: boolean,
    // Should revert to its original state if still present
    shouldReset?: (state: GameState) => boolean,
    // Should revert to its original state if missing (Defeated enemy, ball that fell in a pit)
    shouldRespawn?: (state: GameState) => boolean,
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
    renderShadow?: (context: CanvasRenderingContext2D, state: GameState) => void,
    renderForeground?: (context: CanvasRenderingContext2D, state: GameState) => void,
}

export type ObjectStatus = 'active' | 'closed' | 'closedEnemy' | 'closedSwitch'
    | 'gone' | 'hidden' | 'hiddenSwitch' | 'hiddenEnemy' | 'normal'
    | 'locked' | 'bigKeyLocked' | 'cracked' | 'blownOpen';

export interface MovementProperties {
    boundToSection?: boolean,
    boundToSectionPadding?: number,
    canPush?: boolean,
    canFall?: boolean,
    canSwim?: boolean,
    canClimb?: boolean,
    // Whether the mover should wiggle to fit into tight spaces.
    canWiggle?: boolean,
    // Objects to ignore for hit detection.
    excludedObjects?: Set<any>
}

export interface BaseObjectDefinition {
    id: string,
    // Whether this is linked to an object in the physical/spirit world.
    linked?: boolean,
    // Whether to save the status of this object permanently (for example switches to open dungeon doors).
    saveStatus?: boolean,
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
    type: 'bigChest' | 'chest' | 'loot',
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
    type: 'teleporter' | 'pitEntrance' | 'door' | 'stairs',
    targetZone?: string,
    targetObjectId?: string,
}

export interface SignDefinition extends BaseObjectDefinition {
    type: 'sign',
    message: string,
}

export interface NPCDefinition extends BaseObjectDefinition {
    type: 'npc',
    behavior: NPCBehavior,
    style: NPCStyle,
    dialogueKey?: string,
    dialogue?: string,
}

export type SimpleObjectType = 'marker' | 'pushPull' | 'rollingBall' | 'tippable' | 'waterPot';

export interface SimpleObjectDefinition extends BaseObjectDefinition {
    type: SimpleObjectType,
}

export interface DecorationDefinition extends BaseObjectDefinition {
    type: 'decoration',
    decorationType: DecorationType,
    drawPriority?: DrawPriority,
    w: number,
    h: number,
}

export interface EnemyObjectDefinition extends BaseObjectDefinition {
    type: 'enemy',
    enemyType: EnemyType | MinionType,
    params?: {[key: string]: any},
}

export interface BossObjectDefinition extends BaseObjectDefinition {
    type: 'boss',
    enemyType: BossType,
    params?: {[key: string]: any},
    lootType: LootType,
    lootAmount?: number,
    // If this is 0/unset it means it is progressive.
    lootLevel?: number,
}

export type ObjectDefinition = SimpleObjectDefinition
    | BallGoalDefinition
    | BossObjectDefinition
    | CrystalSwitchDefinition
    | DecorationDefinition
    | EntranceDefinition
    | EnemyObjectDefinition
    | FloorSwitchDefinition
    | LootObjectDefinition
    | NPCDefinition
    | SignDefinition
    ;

export type ObjectType = ObjectDefinition['type'];