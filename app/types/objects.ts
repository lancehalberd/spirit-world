import { Door } from 'app/content/objects/door';
import { Sign } from 'app/content/objects/sign';
import {
    Actor, AreaInstance, BossType,
    DecorationType, Direction, Enemy, EnemyType, FullZoneLocation,
    GameState, Hero, LogicDefinition, LootType,
    MagicElement, MinionType,
    NPCBehavior, NPCStyle,
    Rect, TileBehaviors,
} from 'app/types';

export type DrawPriority = 'background' | 'foreground' | 'sprites' | 'hud'
    // Currently just used for effects that should be rendered during defeat sequence.
    | 'background-special' | 'foreground-special';

export interface LootData {
    lootType: LootType
    // Only applies to 'money' loot currently.
    lootAmount?: number
    // Only matters for certain active tools, chakram, and some passive tools like charge.
    // If this is 0/unset it means it is progressive.
    lootLevel?: number
}


export type DialogueLootDefinition = LootData & {
    type: 'dialogueLoot'
    // The id of the object associated with this dialogue (used during randomization).
    id?: string
    // This can be set for shop loot.
    cost?: number
}

export type AnyLootDefinition = BossObjectDefinition | DialogueLootDefinition | LootObjectDefinition;

export interface LootWithLocation {
    // Either location will be set or dialogueKey+optionKey will be set
    location?: FullZoneLocation
    dialogueKey?: string
    optionKey?: string
    lootObject: AnyLootDefinition
    progressFlags?: string[]
}

export interface LootAssignment {
    source: LootWithLocation
    lootType: LootType
    lootLevel: number
    lootAmount: number
    target: LootWithLocation
}

export interface AssignmentState {
    // The array of loot assignments that can be used to apply this assignment state to the game.
    assignments: LootAssignment[]
    // The ids of all the checks that have contents assigned to them already.
    assignedLocations: string[]
    // The ids of all the check contents that have been assigned to some location.
    assignedContents: string[]
}

export interface ObjectInstance {
    isObject: true
    area?: AreaInstance
    definition?: ObjectDefinition
    linkedObject?: ObjectInstance
    behaviors?: TileBehaviors
    // If this is true behaviors will be applied to the behavior grid when this
    // object gets added.
    applyBehaviorsToGrid?: boolean
    getBehaviors?: (state: GameState) => TileBehaviors
    drawPriority?: DrawPriority
    getDrawPriority?: (state: GameState) => DrawPriority
    // Set this flag for objects that need to update during screen transitions, such as doorways.
    updateDuringTransition?: boolean
    changesAreas?: boolean
    // Setting this true is the same as returning true always for shouldReset+shouldRespawn.
    alwaysReset?: boolean
    ignorePits?: boolean
    // Setting this to true allows this object to press floor switches even if it isn't solid.
    canPressSwitches?: boolean
    // Called when area logic is refreshed. Use this if logic can change internal state of this object,
    // for example, whether a door is open or not.
    refreshLogic?: (state: GameState) => void
    // Should revert to its original state if still present
    shouldReset?: (state: GameState) => boolean
    // Should revert to its original state if missing (Defeated enemy, ball that fell in a pit)
    shouldRespawn?: (state: GameState) => boolean
    x: number
    y: number
    z?: number
    height?: number
    status: ObjectStatus
    // This status can be set on certain switch types to make them not count towards required
    // switches for activating a target. This was added to make dummy switches for randomization
    // to prevent memorization of certain puzzles, such as the ball goals in the Gauntlet zone.
    disabled?: boolean
    // This can be set on certain objects to render a true sight indicator over them if the player
    // has true sight. This can be used to make certain objects stand out to the player, such as
    // the correct ball goals in the Gauntlet zone.
    showTrueSightIndicator?: boolean
    changeStatus?: (state: GameState, status: ObjectStatus) => void
    cleanup?: (state: GameState) => void,
    // This is called when a user grabs a solid tile
    getHitbox?: (state?: GameState) => Readonly<Rect>
    // This hitbox will be used for movement instead of getHitbox if defined.
    getMovementHitbox?: () => Rect
    // This can be set to override the default yDepth calculation for an object.
    getYDepth?: () => number
    // The calculated yDepth for the object. This is update once per frame before rendering.
    yDepth?: number
    // This will be used for the hitbox for the editor only if it is defined.
    getEditorHitbox?: (state: GameState) => Rect
    onActivate?: (state: GameState) => boolean | void
    onDeactivate?: (state: GameState) => boolean | void
    onDestroy?: (state: GameState, dx: number, dy: number) => void
    onEnterArea?: (state: GameState) => void
    // When the hero tries to pick up the object with the passive skill button.
    // The direction is the direction the player is facing.
    onGrab?: (state: GameState, direction: Direction, hero: Hero) => void
    // When the hero hits the object with a weapon or tool
    onHit?: (state: GameState, hit: HitProperties) => HitResult
    // When the hero grabs an object and attempts to move.
    onPull?: (state: GameState, direction: Direction, hero: Hero) => void
    // When the hero walks into an object
    onPush?: (state: GameState, direction: Direction) => void
    pullingHeroDirection?: Direction
    update?: (state: GameState) => void
    add?: (state: GameState, area: AreaInstance) => void
    remove?: (state: GameState) => void
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    // Optional render method for previewing the object in the editor palette or area.
    // This method draws the object to a set target rectangle and should render the object
    // unambiguously so that editors can distinguish between different objects that may normally
    // look identical.
    renderPreview?: (context: CanvasRenderingContext2D, target: Rect) => void
    renderShadow?: (context: CanvasRenderingContext2D, state: GameState) => void
    renderForeground?: (context: CanvasRenderingContext2D, state: GameState) => void
    alternateRender?: (context: CanvasRenderingContext2D, state: GameState) => void
    alternateRenderShadow?: (context: CanvasRenderingContext2D, state: GameState) => void
    alternateRenderForeground?: (context: CanvasRenderingContext2D, state: GameState) => void
    isAllyTarget?: boolean
    isEnemyTarget?: boolean
    isNeutralTarget?: boolean
    isInvisible?: boolean
    // This function can be defined to override the default logic for checking if an object is active,
    // which is used by switch toggling logic to determine whether to activate or deactivate next.
    isActive?: (state: GameState) => boolean
    previewColor?: string
    getParts?: (state: GameState) => (ObjectInstance | EffectInstance)[]
}

export interface EffectInstance {
    isEffect: true
    area?: AreaInstance
    linkedObject?: EffectInstance
    // This is used for effects that create light around them.
    behaviors?: TileBehaviors
    getBehaviors?: (state: GameState) => TileBehaviors
    // Only used by the held chakram at the moment.
    changesAreas?: boolean
    drawPriority?: DrawPriority
    getDrawPriority?: (state: GameState) => DrawPriority
    // Set this flag for objects that need to update during screen transitions, such as doorways.
    updateDuringTransition?: boolean
    x?: number
    y?: number
    z?: number
    height?: number
    cleanup?: (state: GameState) => void
    // This is called when a user grabs a solid tile
    getHitbox?: (state?: GameState) => Readonly<Rect>
    // This hitbox will be used for movement instead of getHitbox if defined.
    getMovementHitbox?: () => Rect
    // This can be set to override the default yDepth calculation for an object.
    getYDepth?: () => number
    // The calculated yDepth for the object. This is update once per frame before rendering.
    yDepth?: number
    onEnterArea?: (state: GameState) => void
    // When the hero hits the effect with a weapon or tool.
    // This is used by certain enemy attacks, but it might be better to change those to objects.
    onHit?: (state: GameState, hit: HitProperties) => HitResult
    // When the hero walks into an object
    onPush?: (state: GameState, direction: Direction) => void
    update?: (state: GameState) => void
    add?: (state: GameState, area: AreaInstance) => void
    remove?: (state: GameState) => void
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    renderShadow?: (context: CanvasRenderingContext2D, state: GameState) => void
    renderForeground?: (context: CanvasRenderingContext2D, state: GameState) => void
    isAllyTarget?: boolean
    isEnemyTarget?: boolean
    isNeutralTarget?: boolean
    // This will cause this effect to be removed when a boss is defeated.
    isEnemyAttack?: boolean
    // Some enemies respond to player attacks.
    isPlayerAttack?: boolean
    isInvisible?: boolean
    // The following are added for convenience when we have ambiguous type `EffectInstance | ObjectInstance`
    status?: ObjectStatus
    definition?: ObjectDefinition
    getParts?: (state: GameState) => (ObjectInstance | EffectInstance)[]

}

export type ObjectStatus = 'active' | 'closed' | 'closedEnemy' | 'closedSwitch'
    | 'gone' | 'hidden' | 'hiddenSwitch' | 'hiddenEnemy' | 'normal'
    | 'locked' | 'bigKeyLocked' | 'cracked' | 'blownOpen' | 'frozen' | 'off';

export interface MovementProperties {
    boundingBox?: false | Rect
    // Can set an arbitrary array of rectangles that block this movement.
    blockedBoxes?: Rect[]
    // Can push objects
    canPush?: boolean
    // Can go over tiles with pits
    canFall?: boolean
    // Can go over tiles with deep water
    canSwim?: boolean
    // Can go over tiles with lava
    canMoveInLava?: boolean
    // If this is set this object cannot cross ground greater than this height.
    maxHeight?: number
    // Enemies with this prop can only move in deep water.
    mustSwim?: boolean
    // Can go on tiles marked as climbable
    canClimb?: boolean
    // Can go up ledges True when climbing.
    canCrossLedges?: boolean
    // Can go down ledges
    canJump?: boolean
    // Whether the mover should wiggle to fit into tight spaces.
    canWiggle?: boolean
    // Whether the mover can pass over solid walls that are low to medium height.
    // Used when throwing a clone, and maybe low flying enemies.
    canPassMediumWalls?: boolean
    // The direction of the movement, can effect whether a tile is considered open,
    // for example edges the player can jump off of in one or two directions.
    direction?: Direction
    // Objects to ignore for hit detection.
    excludedObjects?: Set<any>
    // Movement will fill if any pixels in the tile are blocked.
    needsFullTile?: boolean
    // The actor moving, if an actor. This will be used for hitting damaging tiles
    actor?: Actor
    // The delta for the complete movement.
    dx?: number
    dy?: number
}

export interface Projectile {
    // Set when the projectile passes over a ledge from high to low.
    // Once this is set the projectile can only hit objects marked very tall
    // and it can pass up ledges from low to high, which unsets the flag.
    isHigh?: boolean
    // This array of tile coordinates gets set to have their ledges ignored when a high
    // projectile passes up a ledge. This is done to prevent the same ledges from blocking
    // the projectile a frame later if it is still on the same tile.
    passedLedgeTiles?: {x: number, y: number}[]
    // Method for getting the hitbox of the projectile and used for adjusting
    // the coordinates of the projectile if it becomes stopped by hitting something.
    getHitbox: () => Rect
    // The coordinates of the projectile, which may be set during hit detection to
    // stop the projectile at a solid boundary since projectiles may move multiple
    // pixels a frame and run hit detection inside of solid objects.
    x: number
    y: number
    // Set if the projectile has been stopped by a barrier
    stopped?: boolean
}

export interface Ray {
    x1: number
    y1: number
    x2: number
    y2: number
    r: number
}
export interface Circle {
   x: number
   y: number
   r: number
}

export interface HitProperties {
    direction?: Direction
    damage?: number
    // When defined this damage will be used when hitting the spirit cloak.
    spiritCloakDamage?: number
    element?: MagicElement
    hitbox?: Rect
    hitCircle?: Circle
    hitRay?: Ray
    source?: Actor
    // Whether this hit can break crystal shields on certain enemies like
    // the Crystal Guardians and Crystal Collector in the Waterfall Tower.
    canDamageCrystalShields?: boolean
    // Lightning barriers hurt the hero even when rolling.
    canDamageRollingHero?: boolean
    // Normally spirit barrier + iron boots prevent the hero from being knocked back, but if this property is
    // set they will be knocked back no matter what.
    canAlwaysKnockback?: boolean
    // Whether this hit can push puzzle elements like rolling balls, push/pull blocks, etc.
    canPush?: boolean
    // Whether this can cut ground tiles like thorns.
    cutsGround?: boolean
    // Whether this can destroy destructible objects like pots and cracked doorways.
    destroysObjects?: boolean
    // If this is true, the hit will knock targets away from the hit itself based on the geometry.
    knockAwayFromHit?: boolean
    knockback?: {vx: number, vy: number, vz: number}
    // If this is set, knockback will be added as a vector from this point towards the hit target.
    knockAwayFrom?: {x: number, y: number}
    // The velocity of the object the hit is from, will effect the calculated direction of certain hits.
    // For example, if the hit is slightly to one side, but the velocity is vertical, the verical direction would be favored.
    vx?: number
    vy?: number
    zRange?: number[]
    // Hits enemies/bosses.
    hitEnemies?: boolean
    // Hits hero, clones, astral projection
    hitAllies?: boolean
    // Hits torches, crystals, rolling balls, etc
    hitObjects?: boolean
    // Hits background tiles like bushes, rocks, solid walls
    hitTiles?: boolean
    // Alternate hitbox to use when checking for tile hits.
    tileHitbox?: Rect
    // Targets to ignore.
    ignoreTargets?: Set<EffectInstance | ObjectInstance>
    // If true this hit will only apply to objects touching the ground.
    isGroundHit?: boolean
    // True if this is an arrow attack, targets may be strong/weak against arrows.
    isArrow?: boolean
    // True if this is a staff attack. Staff can activate/destroy certain objects.
    isStaff?: boolean
    isBonk?: boolean
    // True if this is a thrown object attack. Thrown rocks bypass golem defense.
    // We may need to make this more specific in the future, perhaps record the
    // tile index here, and then enemies can check for certain sets of indeces.
    isThrownObject?: boolean
    // If defined this hit will apply special projectile only logic like only checking very tall objects/tile
    // if the project is flagged with `isHigh`, and the hit logic may set certain properties like
    // `isHigh` or `stopX`/`stopY` on the projectile directly.
    projectile?: Projectile
}

export interface HitResult {
    // Indicates the hit connected with something solid.
    // This is generally true unless the hit is invalidated by some special condition like
    // an enemies invulnerability frames.
    hit?: boolean
    // Indicates amount of damage that was dealt by the hit, if any. Only calculated for
    // default hits to enemies currently.
    damageDealt?: number
    // Indicates the hit was blocked, preventing damage + knockback.
    // For example, some enemies have shields that protect them from all or certain kinds of damage.
    blocked?: boolean
    // Indicates the object was destroyed by the hit.
    // The chakram will not stop when hitting targets it destroyed unless stopped or reflected.
    destroyed?: boolean
    // If this is set the hero will be knocked back when they hit while holding the chakram in their hand.
    knockback?: {vx: number, vy: number, vz: number}
    // Indicates that a projectile should continue through this object even when it hit.
    pierced?: boolean
    // Indicates that a projectile should be knocked back and swap hitAllies/hitEnemies.
    reflected?: boolean
    returnHit?: HitProperties
    // Indicates that projectile should never pierce this object.
    // For example, projectiles hitting puzzle objects stop after hitting the first such object.
    stopped?: boolean
    // Indicates this element should be applied as a consequence of the hit.
    // For example an arrow hitting a lit torch will gain the 'fire' element.
    setElement?: MagicElement
    // Returns the set of targets hit.
    hitTargets?: Set<EffectInstance | ObjectInstance>
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
    // Key for the associated special behaviors from the specialBehaviors hash.
    specialBehaviorKey?: string
    // Whether this is a spirit object.
    spirit?: boolean
    // Stores optional style type for some objects, e.g., 'short' vs 'tall' signs.
    style?: string
    status: ObjectStatus
    isFrozen?: boolean
    // Invisible objects are only rendered if the hero has true sight.
    isInvisible?: boolean
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
    height?: number
    onInterval?: number
    offInterval?: number
}
export interface AnodeDefinition extends BaseObjectDefinition {
    type: 'anode'
    onInterval?: number
    offInterval?: number
}

export type TurretStyles = 'crystal' | 'arrow';
export interface TurretDefinition extends BaseObjectDefinition {
    type: 'turret'
    style?: TurretStyles
    // Milliseconds between arrows
    fireInterval?: number
    // Setting different offsets on turrets will make them fire at different times
    fireOffset?: number
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

export interface IndicatorDefinition extends BaseObjectDefinition {
    type: 'indicator',
    targetObjectId?: string,
}

export type LootObjectDefinition = BaseObjectDefinition & LootData & {
    type: 'bigChest' | 'chest' | 'loot' | 'shopItem',
    price?: number
}

export interface CrystalSwitchDefinition extends BaseObjectDefinition {
    type: 'crystalSwitch',
    element?: MagicElement,
    // If this is set, this crystal will de-activate after this many milliseconds.
    timer?: number,
    targetObjectId?: string,
}

export interface EntranceDefinition extends BaseObjectDefinition {
    type: 'teleporter' | 'pitEntrance' | 'door' | 'stairs'
    targetZone?: string
    targetObjectId?: string
    // This can be set to force a door to be open if the logic is true.
    openLogic?: LogicDefinition
    // This is the number of keys that the player must have access to use this door in
    // the randomizer logic. This value is calculated by the randomizer logic if it is not
    // manually set.
    requiredKeysForLogic?: number
    // This message will be displayed as a location indicator when arriving at this entrance.
    locationCue?: string
    // Southern facing doors can be locked with a price below them to require spending
    // money to open them.
    price?: number
}
export interface MarkerDefinition extends BaseObjectDefinition {
    type: 'marker' | 'spawnMarker',
    // This message will be displayed as a location indicator when arriving at this entrance.
    locationCue?: string,
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

export type SimpleObjectType = 'airBubbles' | 'beadGrate' | 'bell' | 'cathode'
    | 'flameTurret'
    | 'pushPull' | 'rollingBall' | 'saveStatue'
    | 'tippable' | 'torch' | 'vineSprout' | 'waterPot';

export interface SimpleObjectDefinition extends BaseObjectDefinition {
    type: SimpleObjectType,
}

export interface DecorationDefinition extends BaseObjectDefinition {
    type: 'decoration'
    decorationType: DecorationType
    drawPriority?: DrawPriority
    w: number,
    h: number,
}

export interface WaterfallDefinition extends BaseObjectDefinition {
    type: 'waterfall'
    w: number,
    h: number,
}

export interface NarrationDefinition extends BaseObjectDefinition {
    type: 'narration'
    message: string
    trigger?: 'touch' | 'activate' | 'enterSection'
    delay?: number
    w: number
    h: number
}

export interface EscalatorDefinition extends BaseObjectDefinition {
    type: 'escalator'
    speed: 'slow' | 'fast'
    w: number
    h: number
}

export interface SimpleMovementDefinition {
    d?: Direction
    speed: number
    turn: 'left' | 'right' | 'bounce'
}


export interface MovingPlatformDefinition extends BaseObjectDefinition, SimpleMovementDefinition {
    type: 'movingPlatform'
    w: number
    h: number
}

export interface SpikeBallDefinition extends BaseObjectDefinition, SimpleMovementDefinition {
    type: 'spikeBall'
}


export interface EscalatorDefinition extends BaseObjectDefinition {
    type: 'escalator'
    speed: 'slow' | 'fast'
    w: number
    h: number
}

export interface EnemyObjectDefinition extends BaseObjectDefinition {
    type: 'enemy',
    enemyType: EnemyType | MinionType,
    params?: {[key: string]: any},
}

export type BossObjectDefinition = BaseObjectDefinition & LootData & {
    type: 'boss',
    enemyType: BossType,
    params?: {[key: string]: any},
}

export type ObjectDefinition = SimpleObjectDefinition
    | AnodeDefinition
    | BallGoalDefinition
    | BeadCascadeDefinition
    | BossObjectDefinition
    | CrystalSwitchDefinition
    | DecorationDefinition
    | EntranceDefinition
    | EnemyObjectDefinition
    | EscalatorDefinition
    | FloorSwitchDefinition
    | IndicatorDefinition
    | KeyBlockDefinition
    | LootObjectDefinition
    | MarkerDefinition
    | MovingPlatformDefinition
    | NarrationDefinition
    | NPCDefinition
    | SignDefinition
    | SpikeBallDefinition
    | TurretDefinition
    | WaterfallDefinition
    ;

export type ObjectType = ObjectDefinition['type'];


export interface SpecialDoorBehavior {
    type: 'door'
    apply: (state: GameState, object: Door) => void
}
export interface SpecialEnemyBehavior {
    type: 'enemy'
    apply: (state: GameState, object: Enemy) => void
}

export interface SpecialSignBehavior {
    type: 'sign'
    apply: (state: GameState, object: Sign) => void
}

export interface SpecialSwitchBehavior {
    // This could be extended for floor switches and other switches.
    type: 'crystalSwitch' | 'floorSwitch' | 'ballGoal'
    apply?: (state: GameState, object: ObjectInstance) => void
    onActivate?: (state: GameState, object: ObjectInstance) => void
}

export interface SpecialPushPullBehavior {
    type: 'pushPull',
    apply?: (state: GameState, object: ObjectInstance) => void
}

export interface SpecialTippableBehavior {
    type: 'tippable',
    apply?: (state: GameState, object: ObjectInstance) => void
}

export interface SpecialAreaBehavior {
    type: 'area'
    apply: (state: GameState, area: AreaInstance) => void
}

export type SpecialBehavior
    = SpecialDoorBehavior
    | SpecialPushPullBehavior
    | SpecialSwitchBehavior
    | SpecialSignBehavior
    | SpecialTippableBehavior
    | SpecialAreaBehavior;
