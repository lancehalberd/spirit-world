type DrawPriority = 'none' | 'background' | 'foreground' | 'sprites' | 'hud'
    // Currently just used for effects that should be rendered during defeat sequence.
    | 'background-special' | 'foreground-special';

interface LootData {
    lootType: LootType
    // Only applies to 'money' loot currently.
    lootAmount?: number
    // Only matters for certain active tools, chakram, and some passive tools like charge.
    // If this is 0/unset it means it is progressive.
    lootLevel?: number
}


type DialogueLootDefinition = LootData & {
    type: 'dialogueLoot'
    // The id of the object associated with this dialogue (used during randomization).
    id?: string
    // This can be set for shop loot.
    cost?: number
}

type AnyLootDefinition = BossObjectDefinition | DialogueLootDefinition | LootObjectDefinition;

interface LootWithLocation {
    // Either location will be set or dialogueKey+optionKey will be set
    location?: FullZoneLocation
    dialogueKey?: string
    optionKey?: string
    lootObject: AnyLootDefinition
    progressFlags?: string[]
}

interface LootAssignment {
    source: LootWithLocation
    lootType: LootType
    lootLevel: number
    lootAmount: number
    target: LootWithLocation
}

interface AssignmentState {
    // The array of loot assignments that can be used to apply this assignment state to the game.
    assignments: LootAssignment[]
    // The ids of all the checks that have contents assigned to them already.
    assignedLocations: string[]
    // The ids of all the check contents that have been assigned to some location.
    assignedContents: string[]
}

interface LightColor {
    r: number
    g: number
    b: number
}

interface LightSource {
    x: number
    y: number
    brightness: number
    radius: number
    color?: LightColor
    colorIntensity?: number
}

interface BaseFieldInstance {
    area?: AreaInstance
    behaviors?: TileBehaviors
    getBehaviors?: (state: GameState, x?: number, y?: number) => TileBehaviors
    getLightSources?: (state: GameState) => LightSource[]
    drawPriority?: DrawPriority
    // Only supported when drawPriority === 'background' currently.
    // Objects with lower `drawPriorityIndex` are drawn before others. Default value is 0.
    // Can be set to -1 to draw behind objects with the default value.
    drawPriorityIndex?: number
    doesNotFall?: boolean
    // Set this to true to always update this every frame even when the hero is meditating.
    neverSkipFrames?: boolean
    getDrawPriority?: (state: GameState) => DrawPriority
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    renderShadow?: (context: CanvasRenderingContext2D, state: GameState) => void
    renderForeground?: (context: CanvasRenderingContext2D, state: GameState) => void
    alternateRender?: (context: CanvasRenderingContext2D, state: GameState) => void
    renderForeground2?: (context: CanvasRenderingContext2D, state: GameState) => void
    alternateRenderShadow?: (context: CanvasRenderingContext2D, state: GameState) => void
    alternateRenderForeground?: (context: CanvasRenderingContext2D, state: GameState) => void
    // Called after the object is added to an area and initialized.
    // isActiveArea will be set to false when this object is being initialized in an inactive area,
    // for example areas initialized when drawing maps.
    onInitialize?: (state: GameState, isActiveArea: boolean) => void
    // When the hero hits the effect with a weapon or tool.
    // This is used by certain enemy attacks, but it might be better to change those to objects.
    onHit?: (state: GameState, hit: HitProperties) => HitResult
    // When the hero walks into an object
    onPush?: (state: GameState, direction: Direction, actor: Actor) => void
    // If set this object will not be rendered by the area and is expected to be rendered by the parent object.
    renderParent?: BaseFieldInstance
    getParts?: (state: GameState) => BaseFieldInstance[]
    getHitbox?: (state?: GameState) => Readonly<Rect>
    checkToCull?: (state?: GameState) => boolean
    // The source of this object or effect, if any. This is often set to enemies for effects that
    // are part of enemy attacks.
    source?: Actor
}

interface ObjectInstance extends BaseFieldInstance {
    isObject: true
    definition?: ObjectDefinition
    linkedObject?: ObjectInstance
    // Optional render method for previewing the object in the editor palette or area.
    // This method draws the object to a set target rectangle and should render the object
    // unambiguously so that editors can distinguish between different objects that may normally
    // look identical.
    renderPreview?: (context: CanvasRenderingContext2D, target?: Rect) => void
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
    // Stores the last calculated ground height for this object.
    groundHeight?: number
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
    getFloorHitbox?: () => Readonly<Rect>
    // This hitbox will be used for movement instead of getHitbox if defined.
    getMovementHitbox?: () => Rect
    // This point will be used as the center of the object for targeting calculations.
    getTargetingAnchorPoint?: () => Point
    // This can be set to override the default yDepth calculation for an object.
    getYDepth?: () => number
    // The calculated yDepth for the object. This is update once per frame before rendering.
    yDepth?: number
    // This will be used for the hitbox for the editor only if it is defined.
    getEditorHitbox?: (state: GameState) => Rect
    onActivate?: (state: GameState) => boolean | void
    onDeactivate?: (state: GameState) => boolean | void
    onDestroy?: (state: GameState, dx: number, dy: number) => void
    // Optional method returning whether this object can be grabbed.
    // By default if this method is undefined, an object can be grabbed if it is solid
    // or defines the onGrab method.
    canGrab?: (state: GameState) => boolean
    // When the hero tries to pick up the object with the passive skill button.
    // The direction is the direction the player is facing.
    onGrab?: (state: GameState, direction: Direction, hero: Hero) => void
    // When the hero grabs an object and attempts to move.
    onPull?: (state: GameState, direction: Direction, hero: Hero) => void
    pullingHeroDirection?: Direction
    update?: (state: GameState) => void
    add?: (state: GameState, area: AreaInstance) => void
    remove?: (state: GameState) => void
    isAllyTarget?: boolean
    isEnemyTarget?: boolean
    isNeutralTarget?: boolean
    isInvisible?: boolean
    // This function can be defined to override the default logic for checking if an object is active,
    // which is used by switch toggling logic to determine whether to activate or deactivate next.
    isActive?: (state: GameState) => boolean
    previewColor?: string
    getParts?: (state: GameState) => ObjectInstance[]
}

interface EffectInstance extends BaseFieldInstance {
    isEffect: true
    linkedObject?: EffectInstance
    // Only used by the held chakram at the moment.
    changesAreas?: boolean
    // Set this flag for objects that need to update during screen transitions, such as doorways.
    updateDuringTransition?: boolean
    x?: number
    y?: number
    z?: number
    height?: number
    cleanup?: (state: GameState) => void
    // This hitbox will be used for movement instead of getHitbox if defined.
    getMovementHitbox?: () => Rect
    // This point will be used as the center of the object for targeting calculations.
    getTargetingAnchorPoint?: () => Point
    // This can be set to override the default yDepth calculation for an object.
    getYDepth?: () => number
    // The calculated yDepth for the object. This is update once per frame before rendering.
    yDepth?: number
    update?: (state: GameState) => void
    add?: (state: GameState, area: AreaInstance) => void
    remove?: (state: GameState) => void
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
    getParts?: (state: GameState) => EffectInstance[]
}

type Target = EffectInstance | ObjectInstance;

type ObjectStatus = 'active' | 'closed' | 'closedEnemy' | 'closedSwitch'
    | 'gone' | 'hidden' | 'hiddenSwitch' | 'hiddenEnemy' | 'normal'
    | 'locked' | 'bigKeyLocked' | 'cracked' | 'blownOpen' | 'frozen' | 'off';

interface MovementProperties {
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
    // Enemies with this prop can only move on climbable pixels.
    mustClimb?: boolean
    // Can go up ledges True when climbing.
    canCrossLedges?: boolean
    // Can go down ledges
    canJump?: boolean
    // Whether the mover should wiggle to fit into tight spaces.
    canWiggle?: boolean
    // Whether the mover can pass over solid walls that are low height.
    // Many projectiles pass low walls but are blocked by medium walls.
    canPassLowWalls?: boolean
    // Whether the mover can pass over solid walls that are low to medium height.
    // Used when throwing a clone, and maybe low flying enemies.
    canPassMediumWalls?: boolean
    // Whether the mover can pass through solid tiles. Does not allow passing across ledges.
    // Used when determining whether a ledge is being crossed in `getActorTarget`.
    canPassWalls?: boolean
    // Objects to ignore for hit detection.
    excludedObjects?: Set<any>
    // Movement will fail if any pixels in the tile are blocked.
    needsFullTile?: boolean
    // The actor moving, if an actor. This will be used for hitting damaging tiles
    actor?: Actor
    // The delta for the complete movement.
    // Currently this is only used for knocing the actor backwards when moving into something that knocks back
    // like a thorn bush.
    dx?: number
    dy?: number
    // If this is set, allow moving through objects that can be lifted with this power level:
    // 0 - bushes, 1 - light stones, 2 - heavy stones.
    // This was added to support the staff destroying bushes/small rocks, but might be used for enemies as well.
    crushingPower?: number
    // Used to prevent most things from moving into doorways, and to prevent the hero from
    // being knocked into doorways.
    canMoveIntoEntranceTiles?: boolean
}

interface Projectile {
    // Set when the projectile passes over a ledge from high to low.
    // Once this is set the projectile can only hit objects marked very tall
    // and it can pass up ledges from low to high, which unsets the flag.
    isHigh?: boolean
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

interface Ray {
    x1: number
    y1: number
    x2: number
    y2: number
    r: number
}
interface Circle {
   x: number
   y: number
   r: number
}

interface HitProperties {
    direction?: Direction
    damage?: number
    // When defined this damage will be used when hitting the spirit cloak.
    spiritCloakDamage?: number
    element?: MagicElement
    hitbox?: Rect
    hitCircle?: Circle
    hitRay?: Ray
    // Source of the hit, can be set to null for things we explicitly don't care about tracking like traps and damaging tiles.
    source: Actor | null
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
    // Whether this attack will break brittle ground tiles.
    breaksGround?: boolean
    // Describes the heavyness of liftable tiles that this hit can destroy.
    crushingPower?: number
    // Whether this can destroy destructible objects like pots and cracked doorways.
    destroysObjects?: boolean
    // If this is true, the hit will knock targets away from the hit itself based on the geometry.
    knockAwayFromHit?: boolean
    // How strong the knockback is, default is 1, not supported for all knockback types yet.
    knockbackForce?: number
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
    // True if the staff could actually be placed.
    // This is used to prevent hitting heavy switches through enemies.
    isStaffValid?: boolean
    isBonk?: boolean
    // Indicates this projectile attack should go through certain objects such as enemies.
    isPiercing?: boolean
    // Indicates the hit came from something falling hard enough to depress a heavy switch,
    // such as a hero falling at max velocity or with iron boots.
    isStomp?: boolean
    // True if this is a thrown object attack. Thrown rocks bypass golem defense.
    // We may need to make this more specific in the future, perhaps record the
    // tile index here, and then enemies can check for certain sets of indeces.
    isThrownObject?: boolean
    // This can be set to indicate a specific point for the hit for the sake of height determination.
    // The entire hit will be considered to be above/below ledges based on where the anchor point is
    // relative to the ledges.
    anchorPoint?: Point
    // If this is true, this hit only applies when there is a positive ledge delta between the anchor point and the target.
    // If this is false, this hit only applies when there is no ledge delta between the anchor point and the target.
    // This is ignored if anchorPoint is not set. If this is unset the hit ignores ledges entirely.
    isHigh?: boolean
}

interface HitResult {
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
    // Additional data can be returned with a HitResult that might be helpful when debugging.
    debug?: any
}

// Logic fields can be set to control the presence of this object with a logic check.
// For example, doors for the Staff Tower are only added when the Staff Tower is in the corresponding location.
interface BaseObjectDefinition extends LogicDefinition {
    // Defaults to ''
    id?: string
    // Draw priority to use for this object, if it is configurable.
    drawPriority?: DrawPriority
    // Whether this is linked to an object in the physical/spirit world.
    linked?: boolean

    // Whether to save the status of this object permanently (for example switches to open dungeon doors).
    // If this is unset, the default behavior depends on the object type, for examples enemies are saved for
    // the zone, bosses are saved forever, and most objects aren't saved at all.
    saveStatus?: 'forever' | 'zone' | 'never'
    // If this is set to 'zone' the object will keep its last position when the area refreshes.
    savePosition?: 'forever' | 'zone' | 'never'
    // Key for the associated special behaviors from the specialBehaviors hash.
    specialBehaviorKey?: string
    // Whether this is a spirit object.
    spirit?: boolean
    // Stores optional style type for some objects, e.g., 'short' vs 'tall' signs.
    style?: string
    // Defaults to 'normal'
    status?: ObjectStatus
    // Currently unused in favor of more flexible `frozenLogic` used on entrances.
    isFrozen?: boolean
    // Invisible objects are only rendered if the hero has true sight.
    isInvisible?: boolean
    x: number
    y: number
    z?: number
    d?: CardinalDirection
    // Development only. These get set during a drag operation to keep track of where the object was
    // at the start of a drag operation.
    _dragStartX?: number
    _dragStartY?: number
    // Set when copying objects to easily refer to the section and calculate their relative section coordinates.
    _sourceSection?: AreaSection
}

interface BallGoalDefinition extends BaseSwitchDefinition {
    type: 'ballGoal',
}

interface BeadCascadeDefinition extends BaseObjectDefinition {
    type: 'beadCascade'
    height?: number
    onInterval?: number
    offInterval?: number
}
interface AnodeDefinition extends BaseObjectDefinition {
    type: 'anode'
    onInterval?: number
    offInterval?: number
}

type TurretStyle = 'crystal' | 'arrow';
interface TurretDefinition extends BaseObjectDefinition {
    type: 'turret'
    style?: TurretStyle
    // Milliseconds between arrows
    fireInterval?: number
    // Setting different offsets on turrets will make them fire at different times
    fireOffset?: number
}
interface AirStreamDefinition extends BaseObjectDefinition {
    type: 'airStream'
    length?: number
    onInterval?: number
    offInterval?: number
}

interface BaseSwitchDefinition extends BaseObjectDefinition {
    targetObjectId?: string
    // This will default to true.
    requireAll?: boolean
}

interface FloorSwitchDefinition extends BaseSwitchDefinition {
    type: 'floorSwitch' | 'heavyFloorSw'
    toggleOnRelease?: boolean
    // If this is set, the switch will turn off the flag tied to
    // its ID.
    isInverted?: boolean
}

interface HeavyFloorSwitchDefinition extends BaseSwitchDefinition {
    type: 'heavyFloorSwitch'
}

interface KeyBlockDefinition extends BaseSwitchDefinition {
    type: 'keyBlock'
    freezePlayer?: boolean
}

interface IndicatorDefinition extends BaseObjectDefinition {
    type: 'indicator'
    targetObjectId?: string
}

type LootObjectDefinition = BaseObjectDefinition & LootData & {
    type: 'bigChest' | 'chest' | 'loot' | 'shopItem',
    price?: number
}

interface CrystalSwitchDefinition extends BaseSwitchDefinition {
    type: 'crystalSwitch'
    element?: MagicElement,
    // If this is set, this crystal will de-activate after this many milliseconds.
    timer?: number
    stayOnAfterActivation?: boolean
}

interface EntranceDefinition extends BaseObjectDefinition {
    type:  'door' | 'ladder' | 'pitEntrance' | 'staffTower' | 'teleporter' | 'helixTop'
    targetZone?: string
    targetObjectId?: string
    mapIcon?: MapIcon
    // This can be set to force a door to be open if the logic is true.
    openLogic?: LogicDefinition
    // If this logic is present and true, the door is frozen until the unfrozen flag is set.
    frozenLogic?: LogicDefinition
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
interface MarkerDefinition extends BaseObjectDefinition {
    type: 'marker' | 'spawnMarker',
    // This message will be displayed as a location indicator when arriving at this entrance.
    locationCue?: string,
}

interface SignDefinition extends BaseObjectDefinition {
    type: 'sign'
    message: string
}

interface NPCDefinition extends BaseObjectDefinition {
    type: 'npc'
    behavior: NPCBehavior
    dialogueKey?: string
    dialogue?: string
    dialogueType?: DialogueType
    // If this NPC stores dialogue directly on it, then this dialogueIndex
    // should be set to a unique identifier that can be used to look it up
    // and is used when tracking whether the player has read this dialogue.
    dialogueIndex?: number
}

type SimpleObjectType = 'airBubbles' | 'arGame' | 'beadGrate' | 'bell' | 'cathode'
    | 'flameTurret' | 'jadeChampion'
    | 'peachTree' | 'pushPull' | 'rollingBall' | 'saveStatue' | 'shieldingUnit'
    | 'torch' | 'trampoline' | 'vineSprout';

interface SimpleObjectDefinition extends BaseObjectDefinition {
    type: SimpleObjectType
}

interface DecorationDefinition extends BaseObjectDefinition, VariantSeedData {
    type: 'decoration'
    decorationType: DecorationType
    w: number
    h: number
    // Useful for fixing the layering of decorations on top of other objects.
    z?: number
    // Some decorations can combine with other objects, in particular bed decorations
    // may target NPCs to render NPCs inside of the bed.
    targetObjectId?: string
}

type DirectionalObjectType = 'waterPot';
interface DirectionalObjectDefinition extends BaseObjectDefinition {
    type: DirectionalObjectType
    d?: CardinalDirection
}

interface WaterfallDefinition extends BaseObjectDefinition {
    type: 'lavafall' | 'waterfall'
    w: number,
    h: number,
}

interface NarrationDefinition extends BaseObjectDefinition {
    type: 'narration'
    message: string
    trigger?: 'touch' | 'activate' | 'enterSection'
    delay?: number
    // If this flag is set, the trigger will apply in modes like randomizer that
    // suppress unnecessary dialogue+cutscenes.
    important?: boolean
    w: number
    h: number
}

interface ElevatorDefinition extends BaseObjectDefinition {
    type: 'elevator'
    floor: number
}

interface SimpleMovementDefinition {
    d?: CardinalDirection
    speed: number
    turn: 'left' | 'right' | 'bounce'
}


interface MovingPlatformDefinition extends BaseObjectDefinition, SimpleMovementDefinition {
    type: 'movingPlatform'
    w: number
    h: number
}

interface SpikeBallDefinition extends BaseObjectDefinition, SimpleMovementDefinition {
    type: 'spikeBall'
}


interface EscalatorDefinition extends BaseObjectDefinition {
    type: 'escalator'
    speed: 'slow' | 'fast'
    w: number
    h: number
}

interface StairsDefinition extends BaseObjectDefinition {
    type: 'stairs'
    w: number
    h: number
}

interface PushStairsDefinition extends BaseObjectDefinition {
    type: 'pushStairs'
    w: number
    offset: number
}

interface TippableObjectDefinition extends BaseObjectDefinition {
    type: 'tippable'
    shattered?: boolean
}

interface EnemyObjectDefinition extends BaseObjectDefinition {
    type: 'enemy'
    enemyType: EnemyType | MinionType
    difficulty?: number
    params?: {[key: string]: any}
    z?: number
}

type BossObjectDefinition = BaseObjectDefinition & LootData & {
    type: 'boss'
    enemyType: BossType
    difficulty?: number
    params?: {[key: string]: any}
    z?: number
}

type ObjectDefinition = SimpleObjectDefinition
    | DirectionalObjectDefinition
    | AirStreamDefinition
    | AnodeDefinition
    | BallGoalDefinition
    | BeadCascadeDefinition
    | BossObjectDefinition
    | CrystalSwitchDefinition
    | DecorationDefinition
    | ElevatorDefinition
    | EntranceDefinition
    | EnemyObjectDefinition
    | EscalatorDefinition
    | FloorSwitchDefinition
    | HeavyFloorSwitchDefinition
    | IndicatorDefinition
    | KeyBlockDefinition
    | LootObjectDefinition
    | MarkerDefinition
    | MovingPlatformDefinition
    | NarrationDefinition
    | NPCDefinition
    | PushStairsDefinition
    | SignDefinition
    | SpikeBallDefinition
    | StairsDefinition
    | TippableObjectDefinition
    | TurretDefinition
    | WaterfallDefinition
    ;

type ObjectType = ObjectDefinition['type'];

interface BaseSpecialBehavior<T> {
    type: string
    // Apply is called only after the object is first initialized and added to the area.
    apply?: (state: GameState, object: T) => void
    // On Refresh Logic is called any time the area logic refreshes after the object
    // has already been initialized and added to the area.
    onRefreshLogic?: (state: GameState, object: T, fresh?: boolean) => void
}


interface SpecialDoorBehavior extends BaseSpecialBehavior<Door> {
    type: 'door'
}
interface SpecialLootBehavior extends BaseSpecialBehavior<ObjectInstance> {
    type: 'loot'
}
interface SpecialEnemyBehavior extends BaseSpecialBehavior<Enemy> {
    type: 'enemy'
}

interface SpecialSignBehavior extends BaseSpecialBehavior<Sign> {
    type: 'sign'
    onRead?: (state: GameState, object: Sign) => void
}

interface SpecialElevatorBehavior extends BaseSpecialBehavior<Elevator> {
    type: 'elevator'
}

interface SpecialSwitchBehavior extends BaseSpecialBehavior<ObjectInstance> {
    // This could be extended for floor switches and other switches.
    type: 'crystalSwitch' | 'floorSwitch' | 'ballGoal' | 'heavyFloorSwitch'
    onActivate?: (state: GameState, object: ObjectInstance) => void
}

interface SpecialPushPullBehavior extends BaseSpecialBehavior<ObjectInstance> {
    type: 'pushPull',
}

interface SpecialTippableBehavior extends BaseSpecialBehavior<ObjectInstance> {
    type: 'tippable',
}

interface SpecialNarrationBehavior extends BaseSpecialBehavior<ObjectInstance> {
    type: 'narration'
    update?: (state: GameState, object: ObjectInstance) => void
}


interface SpecialNpcBehavior extends BaseSpecialBehavior<NPC> {
    type: 'npc'
    update?: (state: GameState, object: NPC) => void
}

interface SpecialAreaBehavior extends BaseSpecialBehavior<AreaInstance> {
    type: 'area'
    // applyToSection is called against any section instance created for a given area.
    applyToSection?: (state: GameState, section: AreaSection) => void
}

type SpecialBehavior
    = SpecialDoorBehavior
    | SpecialElevatorBehavior
    | SpecialLootBehavior
    | SpecialNarrationBehavior
    | SpecialNpcBehavior
    | SpecialPushPullBehavior
    | SpecialSwitchBehavior
    | SpecialSignBehavior
    | SpecialTippableBehavior
    | SpecialAreaBehavior;
