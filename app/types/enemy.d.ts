
// An enemy ability as it is defined for a particular enemy.
interface EnemyAbility<T> {
    getTarget: (this: EnemyAbility<T>, state: GameState, enemy: Enemy) => T
    // Called when the ability becomes active at the start of its prep time.
    prepareAbility?: (this: EnemyAbility<T>, state: GameState, enemy: Enemy, target: T) => void
    // Called every frame during the ability prep time.
    updateAbility?: (this: EnemyAbility<T>, state: GameState, enemy: Enemy, target: T) => void
    // Called when the ability is used, at the end of its prep time.
    useAbility?: (this: EnemyAbility<T>, state: GameState, enemy: Enemy, target: T) => void
    // How long it takes for the enemy to generate a charge. Defaults to 0.
    cooldown?: number
    // How long it takes to generate a charge for this ability the very first time.
    initialCooldown?: number
    // Number of charges recovered per cooldown, Defaults to 1.
    chargesRecovered?: number
    // This can be set to parameterize the range for this ability. Defaults to enemy aggro range.
    range?: number
    // How many charges the enemy starts with. Defaults to 1.
    initialCharges?: number
    // The max number of charges the enemy can have, defaults to 1.
    charges?: number
    // Delay between the enemy choosing a target and activating the ability. Defaults to 0.
    prepTime?: number
    // Delay after the enemy uses the ability before it can use a new ability. Defaults to 0.
    recoverTime?: number
    // If true this ability can be used in the middle of other abilities, canceling them.
    cancelsOtherAbilities?: boolean
    // If true thisa bility cannot be canceled by other abilities.
    cannotBeCanceled?: boolean
}

// A particular instance of an enemy using an ability. This is stored
// on the enemies activeAbility.
interface EnemyAbilityInstance<T> {
    definition: EnemyAbility<T>
    // The target that was returned from `getTarget` when the ability was activated.
    target: T
    // Time that has passed since the enemy activated this ability.
    time: number
    // Set to true once `useAbility` is called.
    used?: boolean
}

interface EnemyDefinition<Params> {
    alwaysReset?: boolean
    abilities?: EnemyAbility<any>[]
    taunts?: {[key in string]: TextCueTaunt}
    animations: ActorAnimations
    aggroRadius?: number
    baseMovementProperties?: Partial<MovementProperties>
    drawPriority?: DrawPriority
    tileBehaviors?: TileBehaviors
    canBeKnockedBack?: boolean
    canBeKnockedDown?: boolean
    flipLeft?: boolean
    flipRight?: boolean
    flying?: boolean
    // If true, default z updates will be ignored.
    floating?: boolean
    // This is used instead of standard code for flying enemies
    updateFlyingZ?: (state: GameState, enemy: Enemy<Params>) => void
    hasShadow?: boolean
    ignorePits?: boolean
    life?: number
    lootTable?: LootTable
    // This enemy won't be destroyed when reaching 0 life.
    isImmortal?: boolean
    immunities?: MagicElement[]
    // Override number of iframes the enemy cannot damage the player when damaged.
    invulnerableFrames?: number
    elementalMultipliers?: {[key in MagicElement]?: number}
    initialAnimation?: string
    initialMode?: string
    params?: Params
    initialize?: (state: GameState, enemy: Enemy<Params>) => void
    speed?: number
    acceleration?: number
    scale?: number
    showHealthBar?: boolean
    healthBarColor?: string
    touchDamage?: number
    touchHit?: HitProperties
    update?: (state: GameState, enemy: Enemy<Params>) => void
    onDeath?: (state: GameState, enemy: Enemy<Params>) => void
    onHit?: (state: GameState, enemy: Enemy<Params>, hit: HitProperties) => HitResult
    // Optional render function called instead of the standard render logic.
    render?: (context: CanvasRenderingContext2D, state: GameState, enemy: Enemy<Params>) => void
    // Optional render function called instead of the standard renderShadow logic.
    renderShadow?: (context: CanvasRenderingContext2D, state: GameState, enemy: Enemy<Params>) => void
    // Optional render function called after the standard render.
    renderOver?: (context: CanvasRenderingContext2D, state: GameState, enemy: Enemy<Params>) => void
    renderPreview?: (context: CanvasRenderingContext2D, enemy: Enemy<Params>, target: Rect) => void
    getHealthPercent?: (state: GameState, enemy: Enemy<Params>) => number
    getShieldPercent?: (state: GameState, enemy: Enemy<Params>) => number
    getHitbox?: (enemy: Enemy<Params>) => Rect
    getYDepth?: (enemy: Enemy<Params>) => number
}
