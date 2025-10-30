export type LevelKey = 'none' | 'l1' | 'l2' | 'l3' | 'l4' | 'l5' | 'l6' | 'l7' | 'l8' | 'l9' | 'l10';
export type UnlockKey = LevelKey | 'ammo' | 'speed' | 'reload' | 'accuracy' | 'points' | 'time' | 'multishot' | 'pierce' | 'reset';
export type Scene = 'shop' | 'level' | 'results' | 'reset';

export interface TargetPracticeState {
    scene: Scene
    screen: Rect
    bullets: PracticeBullet[]
    targets: FpsTarget[]
    crosshair: {x: number, y: number}
    reloadTime: number
    levelKey: LevelKey
    ammo: number
    maxAmmo: number
    score: number
    goal: number
    timeLeft: number
    completionTime?: number 
    maxTime: number
    shopItems: ShopItem[]
    activeShopItem?: ShopItem
    lastShotTime: number
    missedShots: number
    shotsFired: number
    shotsHit: number
    nextSpawnTime: number 
    levelTime: number 
    playerStart: {x: number, y: number}
    bullseyeEffects: BullseyeEffect[]
}

export interface ShopItem {
    key: UnlockKey
    levelKey?: LevelKey
    x: number
    y: number
    unlocks?: UnlockKey[]
    disabled?: (state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) => boolean
    label: string
    description: string
}

export interface TargetPracticeSavedState {
    points: number
    records: {[key in LevelKey]?: number}
    unlocks: {[key in UnlockKey]?: number}
}

export interface PracticeBullet {
    x: number
    y: number
    vx: number
    vy: number
    piercing: boolean
    done?: boolean
    update(state: GameState, gameState: TargetPracticeState): void
    render(context: CanvasRenderingContext2D): void
}

export interface FpsTarget {
    x: number
    y: number
    w: number
    h: number
    points: number
    speed: number
    vx: number
    vy: number
    color: string
    lifetime: number;
    radius: number;
    hitTime?: number
    update(state: GameState, gameState: TargetPracticeState): void
    render(context: CanvasRenderingContext2D): void
    getHitbox(): Rect
    onHit?(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState, bullseye?: boolean): void
}

export interface TargetDefinition {
    radius: number;
    points: number;
    weight: number;  
    speed: number;
    lifetime: number;
    color?: string;
    type: 'standard' | 'circling' | 'armored' | 'alternating' | 'explosive' | 'ammo' | 'time';
    maxHits?: number;
    alternatePoints?: number;
    altColor?: string;
    switchInterval?: number;
    explosionRadius?: number;
    bonusAmount?: number;
}


export interface LevelConfig {
    timeLimit: number;
    goal: number;
    spawnInterval: number;
    maxTargets?: number;
    targetTypes?: TargetDefinition[];
    escalation?: boolean;
}

export interface BullseyeEffect {
    x: number;
    y: number;
    lifetime: number;
    maxLifetime: number;
    scale: number;
}