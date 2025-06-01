

interface HotaState {
    scene: HotaSceneKey
    // objects: BattleObject[]
    sceneTime: number
    lanes: HotaLane[]
    modifierEffects: HotaStatModifierEffect[]
    battleField: Rect
}

interface HotaSavedState {

}

interface HotaScene {
    start: (state: GameState, gameState: HotaState, savedState: HotaSavedState) => void
    update: (state: GameState, gameState: HotaState, savedState: HotaSavedState) => void
    render: (context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState) => void
    renderHUD: (context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState) => void
}


type HotaSceneKey = 'battle';
interface HotaHitProperties {
    damage: number
}
interface BaseBattleEffect extends Point {
    lane: HotaLane
    done?: boolean
    update(state: GameState, gameState: HotaState, savedState: HotaSavedState): void
    render(context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState): void
}
type HotaStats = {[key in HotaStatKey]: ModifiableStat};
interface BaseBattleUnit extends Point {
    unitType: 'hero'|'minion'|'tower'
    stats: HotaStats
    modifiers: HotaStatModifierEffect[]
    isEnemy: boolean
    getLife(): number
    getMaxLife(gameState: HotaState): number
    dx: number
    radius: number
    getRange(): number
    onHit(state: GameState, gameState: HotaState, savedState: HotaSavedState, hit: HotaHitProperties): void
    lane: HotaLane
    onEnter?: (state: GameState, gameState: HotaState, savedState: HotaSavedState) => void
    onLeave?: (state: GameState, gameState: HotaState, savedState: HotaSavedState) => void
    update(state: GameState, gameState: HotaState, savedState: HotaSavedState): void
    render(context: CanvasRenderingContext2D, state: GameState, gameState: HotaState, savedState: HotaSavedState): void
    target?: BattleObject
    done?: boolean
    // How high above the base coords should attacks hit this target.
    hitHeight?: number
}
type BattleObject = BaseBattleUnit; // HotaHero | Tower | Minion;
type BattleEffect = BaseBattleEffect // MinionBullet;
interface HotaLane {
    // x position of the left tower in area coordinates.
    left: number
    // x position of the right tower in area coordinates.
    right: number
    objects: BattleObject[]
    effects: BattleEffect[]
    winner?: 'player'|'enemy'
    winTime?: number
}


type HotaStatKey = 'maxLife'|'damage'|'attacksPerSecond'|'movementSpeed'|'range'

interface HotaStatModifier extends StatModifier {
    statKey: HotaStatKey
}

interface HotaStatModifierEffectDefinition {
    modifiers: HotaStatModifier[]
    scope?: 'global'|'lane'
    // If undefined will target both enemies and allies.
    isEnemy?: boolean
    effectsTowers?: boolean
    effectsHeroes?: boolean
    effectsMinions?: boolean
}
interface HotaStatModifierEffect {
    modifiers: HotaStatModifier[]
    lane?: HotaLane
    // If undefined will target both enemies and allies.
    isEnemy?: boolean
    effectsTowers?: boolean
    effectsHeroes?: boolean
    effectsMinions?: boolean
}

type HotaHeroKey = 'avatar';
interface HotaHeroDefinition {
    heroKey: HotaHeroKey
    animations: ActorAnimations
    auras?: HotaStatModifierEffectDefinition[]
    damage: number
    attacksPerSecond: number
    range: number
    movementSpeed: number
}
type HotaHeroMode = 'guard'|'support'|'attack';
