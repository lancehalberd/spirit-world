import {
    Actor, AreaInstance, BossType,
    DecorationType, Direction, EnemyType,
    GameState, Hero, LootType,
    MagicElement, MinionType,
    NPCBehavior, NPCStyle,
    Rect, StaffTowerLocation, TileBehaviors,
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
    getHitbox?: (state: GameState) => Rect,
    onActivate?: (state: GameState) => void,
    onDeactivate?: (state: GameState) => void,
    onDestroy?: (state: GameState, dx: number, dy: number) => void,
    // When the hero tries to pick up the object with the passive skill button.
    // The direction is the direction the player is facing.
    onGrab?: (state: GameState, direction: Direction, hero: Hero) => void,
    // When the hero hits the object with a weapon or tool
    onHit?: (state: GameState, hit: HitProperties) => HitResult,
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
    isAllyTarget?: boolean,
    isEnemyTarget?: boolean,
    isNeutralTarget?: boolean,
    // This function can be defined to override the default logic for checking if an object is active,
    // which is used by switch toggling logic to determine whether to activate or deactivate next.
    isActive?: (state: GameState) => boolean,
    // This will cause this effect to be removed when a boss is defeated.
    isEnemyAttack?: boolean
}

export type ObjectStatus = 'active' | 'closed' | 'closedEnemy' | 'closedSwitch'
    | 'gone' | 'hidden' | 'hiddenSwitch' | 'hiddenEnemy' | 'normal'
    | 'locked' | 'bigKeyLocked' | 'cracked' | 'blownOpen' | 'frozen';

export interface MovementProperties {
    boundToSection?: boolean
    boundToSectionPadding?: number
    canPush?: boolean
    canFall?: boolean
    canSwim?: boolean
    canClimb?: boolean
    canJump?: boolean
    // Whether the mover should wiggle to fit into tight spaces.
    canWiggle?: boolean
    // Objects to ignore for hit detection.
    excludedObjects?: Set<any>
    needsFullTile?: boolean
}

export interface HitProperties {
    direction?: Direction,
    damage?: number,
    element?: MagicElement,
    hitbox?: Rect,
    hitCircle?: {x: number, y: number, r: number},
    source?: Actor,
    // Whether this hit can break crystal shields on certain enemies like
    // the Crystal Guardians and Crystal Collector in the Waterfall Tower.
    canDamageCrystalShields?: boolean
    // Whether this hit can push puzzle elements like rolling balls, push/pull blocks, etc.
    canPush?: boolean,
    // Whether this can cut ground tiles like thorns.
    cutsGround?: boolean,
    knockback?: {vx: number, vy: number, vz: number},
    // If this is set, knockback will be added as a vector from this point towards the hit target.
    knockAwayFrom?: {x: number, y: number},
    // The velocity of the object the hit is from, will effect the calculated direction of certain hits.
    // For example, if the hit is slightly to one side, but the velocity is vertical, the verical direction would be favored.
    vx?: number,
    vy?: number,
    // Hits enemies/bosses.
    hitEnemies?: boolean,
    // Hits hero, clones, astral projection
    hitAllies?: boolean,
    // Hits torches, crystals, rolling balls, etc
    hitObjects?: boolean,
    // Hits background tiles like bushes, rocks, solid walls
    hitTiles?: boolean,
    // Alternate hitbox to use when checking for tile hits.
    tileHitbox?: Rect
    // Targets to ignore.
    ignoreTargets?: Set<ObjectInstance>,
}

export interface HitResult {
    // Indicates the hit connected with something solid.
    // This is generally true unless the hit is invalidated by some special condition like
    // an enemies invulnerability frames.
    hit?: boolean,
    // Indicates the hit was blocked, preventing damage + knockback.
    // For example, some enemies have shields that protect them from all or certain kinds of damage.
    blocked?: boolean,
    // If this is set the hero will be knocked back when they hit while holding the chakram in their hand.
    knockback?: {vx: number, vy: number, vz: number},
    // Indicates that a projectile should continue through this object even when it hit.
    pierced?: boolean,
    // Indicates that a projectile should be knocked back and swap hitAllies/hitEnemies.
    reflected?: boolean,
    returnHit?: HitProperties,
    // Indicates that projectile should never pierce this object.
    // For example, projectiles hitting puzzle objects stop after hitting the first such object.
    stopped?: boolean,
    // Indicates this element should be applied as a consequence of the hit.
    // For example an arrow hitting a lit torch will gain the 'fire' element.
    setElement?: MagicElement,
    // Returns the set of targets hit.
    hitTargets?: Set<ObjectInstance>,
}

export interface BaseObjectDefinition {
    id: string
    // Whether this is linked to an object in the physical/spirit world.
    linked?: boolean
    // If true, use the inverse of the given logic check.
    invertLogic?: boolean
    // This can be set to control the presence of this object with a logic check.
    // For example, frozen doors vs normal doors are displayed in river temple based on the status of the frost beast,
    // and doors for the Staff Tower are only added when the Staff Tower is in the corresponding location.
    logicKey?: string
    hasCustomLogic?: boolean
    customLogic?: string
    // Whether to save the status of this object permanently (for example switches to open dungeon doors).
    // If this is unset, the default behavior depends on the object type, for examples enemies are saved for
    // the zone, bosses are saved forever, and most objects aren't saved at all.
    saveStatus?: 'forever' | 'zone' | 'never'
    // Whether this is a spirit object.
    spirit?: boolean
    // Stores optional style type for some objects, e.g., 'short' vs 'tall' signs.
    style?: string
    status: ObjectStatus
    isFrozen?: boolean
    x: number
    y: number
    d?: Direction
}

export interface BallGoalDefinition extends BaseObjectDefinition {
    type: 'ballGoal',
    targetObjectId?: string,
}

export interface BeadCascadeDefinition extends BaseObjectDefinition {
    type: 'beadCascade'
    onInterval?: number
    offInterval?: number
}

export interface FloorSwitchDefinition extends BaseObjectDefinition {
    type: 'floorSwitch',
    toggleOnRelease?: boolean,
    targetObjectId?: string,
}

export interface KeyBlockDefinition extends BaseObjectDefinition {
    type: 'keyBlock',
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
    element?: MagicElement,
    // If this is set, this crystal will de-activate after this many milliseconds.
    timer?: number,
    targetObjectId?: string,
}

export interface EntranceDefinition extends BaseObjectDefinition {
    type: 'teleporter' | 'pitEntrance' | 'door' | 'stairs',
    targetZone?: string,
    targetObjectId?: string,
    // This is the number of keys that the player must have access to use this door in
    // the randomizer logic. This value is calculated by the randomizer logic if it is not
    // manually set.
    requiredKeysForLogic?: number,
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

export type SimpleObjectType = 'airBubbles' | 'beadGrate' | 'marker' | 'pushPull' | 'rollingBall'
    | 'tippable' | 'torch' | 'vineSprout' | 'waterPot';

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

export interface StaffTowerPointDefinition extends BaseObjectDefinition {
    type: 'staffTowerPoint',
    location: StaffTowerLocation,
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
    | BeadCascadeDefinition
    | BossObjectDefinition
    | CrystalSwitchDefinition
    | DecorationDefinition
    | EntranceDefinition
    | EnemyObjectDefinition
    | FloorSwitchDefinition
    | KeyBlockDefinition
    | LootObjectDefinition
    | NPCDefinition
    | SignDefinition
    | StaffTowerPointDefinition
    ;

export type ObjectType = ObjectDefinition['type'];
