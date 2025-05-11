import {CANVAS_HEIGHT, CANVAS_WIDTH, FRAME_LENGTH, GAME_KEY} from 'app/gameConstants';
import {heroArIcon} from 'app/render/heroAnimations';
import {drawFrame} from 'app/utils/animations';
import {boxesIntersect, pad} from 'app/utils/index';
import {drawARFont} from 'app/arGames/arFont';
import {playAreaSound} from 'app/musicController';
import {wasGameKeyPressed} from 'app/userInput';
import {saveGame } from 'app/utils/saveGame';
import {typedKeys} from 'app/utils/types';

type LevelKey = 'none' | 'l1' | 'l2' | 'l3' | 'l4' | 'l5' | 'l6' | 'l7' | 'l8' | 'l9' | 's1' | 's2' | 's3' | 's4' | 's5' | 's6' | 's7' | 's8' | 's9';
type UnlockKey = LevelKey | 'life' | 'heal' | 'time' | 'size' | 'points' | 'slow' | 'shield' | 'turbo' | 'reset';
type Scene = 'shop' | 'level' | 'results' | 'reset';

const baseLife = 3;

interface DodgerState {
    scene: Scene
    screen: Rect
    bullets: DodgerBullet[]
    bulletCooldown: number
    specialBulletCooldown: number
    targets: TargetZone[]
    difficulty: number
    levelKey: LevelKey
    maxLife: number
    life: number
    invulnerableTime: number
    timesHit: number
    score: number
    goal: number
    shopItems: ShopItem[]
    activeShopItem?: ShopItem
}
interface ShopItem {
    key: UnlockKey
    levelKey?: LevelKey
    x: number
    y: number
    costs?: number[]
    unlocks?: UnlockKey[]
    disabled?: (state: GameState, gameState:DodgerState, savedState: DodgerSavedState) => boolean
    label: string
    description: string
}
interface DodgerSavedState {
    points: number
    records: {[key in LevelKey]?: number}
    unlocks: {[key in UnlockKey]?: number}
}
interface DodgerBullet {
    x: number
    y: number
    vx: number
    vy: number
    outerColor: string;
    innerColor: string;
    done?: boolean
    update(state: GameState, gameState: DodgerState, savedState: DodgerSavedState): void
    render(context: CanvasRenderingContext2D, state: GameState): void
}
function getTurboMultiplier(savedState: DodgerSavedState): number {
    return (savedState.unlocks.turbo > 0 ? 1.5 : 1);
}
function getBaseBulletSpeed(gameState: DodgerState, savedState: DodgerSavedState) {
    return (1.5 + (gameState.difficulty - 1) / 10) * getTurboMultiplier(savedState);
}
function renderBullet(context: CanvasRenderingContext2D, bullet: DodgerBullet, innerColor = bullet.innerColor, outerColor = bullet.outerColor) {
    context.beginPath();
    context.arc(bullet.x, bullet.y, 4, 0, 2 * Math.PI);
    context.fillStyle = outerColor;
    context.fill();
    context.beginPath();
    context.arc(bullet.x, bullet.y, 2, 0, 2 * Math.PI);
    context.fillStyle = innerColor;
    context.fill();
}
class SimpleBullet implements DodgerBullet {
    x: number;
    y: number;
    vx: number;
    vy: number;
    ttl: number;
    done = false;
    outerColor = '#F00';
    innerColor = '#800';
    update(state: GameState) {
        this.x += this.vx;
        this.y += this.vy;
        if (this.ttl > 0) {
            this.ttl -= FRAME_LENGTH;
            this.done = this.ttl <= 0;
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        renderBullet(context, this);
    }
}
class AimingBullet implements DodgerBullet {
    x: number;
    y: number;
    vx = 0;
    vy = 0;
    ttl = 0;
    cooldown = 500;
    done = false;
    outerColor = '#FF0';
    innerColor = '#880';
    update(state: GameState, gameState: DodgerState, savedState: DodgerSavedState) {
        this.x += this.vx;
        this.y += this.vy;
        if (this.ttl > 0) {
            this.ttl -= FRAME_LENGTH;
            this.done = this.ttl <= 0;
        }
        this.cooldown -= FRAME_LENGTH;
        if (this.cooldown <= 0) {
            this.shoot(state, gameState, savedState);
        }
    }
    shoot(state: GameState, gameState: DodgerState, savedState: DodgerSavedState) {
        const speed = getBaseBulletSpeed(gameState, savedState);
        const spacing = 40 + 2 * (savedState.unlocks.slow ?? 0);
        this.cooldown = FRAME_LENGTH * Math.ceil(spacing / speed);
        const bullet = new SimpleBullet();
        bullet.innerColor = this.innerColor;
        bullet.outerColor = this.outerColor;
        bullet.x = this.x;
        bullet.y = this.y
        const heroHitbox = getHeroPosition(state, gameState);
        const tx = heroHitbox.x + heroHitbox.w / 2;
        const ty = heroHitbox.y + heroHitbox.h / 2;
        const dx = tx - bullet.x, dy = ty - bullet.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        bullet.vx = speed * dx / mag;
        bullet.vy = speed * dy / mag;
        gameState.bullets.push(bullet);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        renderBullet(context, this, this.outerColor, this.outerColor);
    }
}
class StrafingBullet implements DodgerBullet {
    x: number;
    y: number;
    vx = 0;
    vy = 0;
    theta: number;
    cooldown = 500;
    outerColor = '#8F0';
    innerColor = '#480';
    update(state: GameState, gameState: DodgerState, savedState: DodgerSavedState) {
        this.x += this.vx;
        this.y += this.vy;
        this.cooldown -= FRAME_LENGTH;
        if (this.cooldown <= 0) {
            this.shoot(state, gameState, savedState);
        }
    }
    shoot(state: GameState, gameState: DodgerState, savedState: DodgerSavedState) {
        const speed = getBaseBulletSpeed(gameState, savedState);
        const spacing = 36 + 2 * (savedState.unlocks.slow ?? 0);
        // This controls the horizontal space between bullets.
        this.cooldown = FRAME_LENGTH * Math.ceil(spacing / (Math.sqrt(this.vx * this.vx + this.vy * this.vy)));
        const bullet = new SimpleBullet();
        bullet.innerColor = this.innerColor;
        bullet.outerColor = this.outerColor;
        bullet.x = this.x;
        bullet.y = this.y
        const dx = Math.cos(this.theta), dy = Math.sin(this.theta);
        const mag = Math.sqrt(dx * dx + dy * dy);
        bullet.vx = speed * dx / mag;
        bullet.vy = speed * dy / mag;
        gameState.bullets.push(bullet);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        renderBullet(context, this, this.outerColor, this.outerColor);
    }
}
class SpinningBullet implements DodgerBullet {
    x: number;
    y: number;
    vx = 0;
    vy = 0;
    ttl = 0;;
    cooldown = 500;
    done = false;
    bulletCount = 4;
    theta = 0;
    thetaV = 0;
    outerColor = '#F0F';
    innerColor = '#808';
    update(state: GameState, gameState: DodgerState, savedState: DodgerSavedState) {
        this.x += this.vx;
        this.y += this.vy;
        this.ttl -= FRAME_LENGTH;
        this.done = this.ttl <= 0;
        this.cooldown -= FRAME_LENGTH;
        if (this.cooldown <= 0) {
            this.shoot(state, gameState, savedState);
        }
    }
    shoot(state: GameState, gameState: DodgerState, savedState: DodgerSavedState) {
        const speed = getBaseBulletSpeed(gameState, savedState);
        const spacing = 36 + 2 * (savedState.unlocks.slow ?? 0);
        this.cooldown = FRAME_LENGTH * Math.ceil(spacing / Math.max(1, speed - Math.sqrt(this.vx * this.vx + this.vy * this.vy)));
        this.theta += this.thetaV;
        for (let i = 0; i < this.bulletCount; i++) {
            const theta = this.theta + i * 2 * Math.PI / this.bulletCount;
            const bullet = new SimpleBullet();
            bullet.innerColor = this.innerColor;
            bullet.outerColor = this.outerColor;
            bullet.x = this.x;
            bullet.y = this.y
            const dx = Math.cos(theta), dy = Math.sin(theta);
            bullet.vx = speed * dx;
            bullet.vy = speed * dy;
            gameState.bullets.push(bullet);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        renderBullet(context, this, this.outerColor, this.outerColor);
    }
}
class CirclingBullet implements DodgerBullet {
    x: number;
    y: number;
    speed = 2;
    vx = 0;
    vy = 0;
    ttl = 0;
    cooldown = 500;
    done = false;
    outerColor = '#80F';
    innerColor = '#408';
    update(state: GameState, gameState: DodgerState, savedState: DodgerSavedState) {
        const tx = gameState.screen.x + gameState.screen.w / 2;
        const ty = gameState.screen.y + gameState.screen.h / 2;
        const dx = this.x - tx, dy = this.y - ty;
        const mag = Math.sqrt(dx * dx + dy * dy);
        let theta = Math.atan2(dy, dx);
        theta += this.speed / mag;gameState
        this.x = tx + mag * Math.cos(theta);
        this.y = ty + mag * Math.sin(theta);
        this.ttl -= FRAME_LENGTH;
        this.done = this.ttl <= 0;
        this.cooldown -= FRAME_LENGTH;
        if (this.cooldown <= 0) {
            this.shoot(state, gameState, savedState);
        }
    }
    shoot(state: GameState, gameState: DodgerState, savedState: DodgerSavedState) {
        const speed = getBaseBulletSpeed(gameState, savedState);
        const spacing = 20 + 2 * (savedState.unlocks.slow ?? 0);
        this.cooldown = FRAME_LENGTH * Math.ceil(spacing / speed);
        const bullet = new SimpleBullet();
        bullet.innerColor = this.innerColor;
        bullet.outerColor = this.outerColor;
        bullet.x = this.x;
        bullet.y = this.y
        const tx = gameState.screen.x + gameState.screen.w / 2;
        const ty = gameState.screen.y + gameState.screen.h / 2;
        const dx = tx - bullet.x, dy = ty - bullet.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        bullet.vx = speed * dx / mag;
        bullet.vy = speed * dy / mag;
        bullet.ttl = mag * FRAME_LENGTH / speed;
        gameState.bullets.push(bullet);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        renderBullet(context, this, this.outerColor, this.outerColor);
    }
}
class TargetZone {
    x: number;
    y: number;
    targetTime = 4000;
    activeTime = 0;
    minSize = 10;
    maxSize = 60;
    update(state: GameState, gameState: DodgerState) {
        const hitbox = this.getHitbox();
        const heroHitbox = getHeroPosition(state, gameState);
        if (boxesIntersect(hitbox, heroHitbox)) {
            this.activeTime += FRAME_LENGTH;
        } else if (!boxesIntersect(hitbox, pad(heroHitbox, 2))) {
            this.activeTime = Math.max(this.activeTime - FRAME_LENGTH / 4, 0);
        }
    }
    getHitbox(): Rect {
        const r = Math.round((this.minSize + (this.maxSize - this.minSize) * (1 - this.activeTime / this.targetTime)) / 2);
        return {
            x: this.x - r,
            y: this.y - r,
            w: 2 * r,
            h: 2 * r,
        };
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const {x,y,w,h} = this.getHitbox();
        context.fillStyle = '#0F8';
        context.fillRect(x, y, w, h)
        context.fillStyle = '#084';
        context.fillRect(x + 1, y + 1, w - 2, h - 2);
    }
}

function getNewDodgerState(state: GameState): DodgerState {
    return {
        scene: 'shop',
        screen: {
            x: (((state.hero.x - 64) / 8) | 0) * 8,
            y: (((state.hero.y - 64) / 8) | 0) * 8,
            w: 128,
            h: 128,
        },
        bullets: [],
        bulletCooldown: 0,
        specialBulletCooldown: 0,
        targets: [],
        shopItems: [],
        difficulty: 1,
        score: 0,
        goal: 5,
        maxLife: baseLife,
        life: baseLife,
        timesHit: 0,
        invulnerableTime: 0,
        levelKey: 'none',
    };
}
function getNewDodgerSavedState(): DodgerSavedState {
    return {
        points: 0,
        records: {},
        unlocks: {'l1': 1},
    };
}

export function startDodger(state: GameState) {
    state.arState.game = getNewDodgerState(state);
    const savedState = state.savedState.savedArData.gameData.dodger || {};
    state.savedState.savedArData.gameData.dodger = {...getNewDodgerSavedState(), ...savedState};
}
const shopItems: ShopItem[] = [
    {key: 'l1', levelKey: 'l1', x: 0, y: 0, unlocks: ['l2'], label: 'Level 1', description: 'Tutorial'},
    {key: 'l2', levelKey: 'l2', x: 0, y: 1, costs: [10], unlocks: ['l3', 'life'], label: 'Level 2', description: 'Warmup'},
    {key: 'l3', levelKey: 'l3', x: 0, y: 2, costs: [20], unlocks: ['l4', 'time'], label: 'Level 3', description: 'Practice'},
    {key: 'l4', levelKey: 'l4', x: 0, y: 3, costs: [50], unlocks: ['l5', 'heal'], label: 'Level 4', description: 'Workout'},
    {key: 'l5', levelKey: 'l5', x: 0, y: 4, costs: [100], unlocks: ['l6', 'points'], label: 'Level 5', description: 'Challenge'},
    {key: 'l6', levelKey: 'l6', x: 0, y: 5, costs: [200], unlocks: ['l7', 'size'], label: 'Level 6', description: 'Struggle'},
    {key: 'l7', levelKey: 'l7', x: 0, y: 6, costs: [500], unlocks: ['l8', 'slow'], label: 'Level 7', description: 'Survive'},
    {key: 'l8', levelKey: 'l8', x: 0, y: 7, costs: [1000], unlocks: ['l9', 'shield'], label: 'Level 8', description: 'Despair'},
    {key: 's1', levelKey: 's1', x: 2, y: 0, costs: [10000], label: 'Endless', description: 'How far can you go?'},
    {key: 's2', levelKey: 's2', x: 2, y: 1, costs: [10000], label: 'Secret 2', description: '??'},
    {key: 's3', levelKey: 's3', x: 2, y: 2, costs: [10000], label: 'Secret 3', description: '???'},
    {key: 's4', levelKey: 's4', x: 2, y: 3, costs: [10000], label: 'Secret 4', description: '????'},
    {key: 's5', levelKey: 's5', x: 2, y: 4, costs: [10000], label: 'Secret 5', description: '?!'},
    {key: 's6', levelKey: 's6', x: 2, y: 5, costs: [10000], label: 'Secret 6', description: '?!?!'},
    {key: 's7', levelKey: 's7', x: 2, y: 6, costs: [10000], label: 'Secret 7', description: '?!?!?!'},
    {
        key: 'turbo', x: 1, y: 0,
        label: 'Turbo',
        description: 'Toggle turbo speed',
    },
    {
        key: 'life', x: 1, y: 1, costs: [
            10, 20, 50,
            100, 200, 500,
            1000, 2000, 5000,
            10000, 20000, 50000,
        ],
        unlocks: ['reset'],
        label: 'Life',
        description: 'More life',
        disabled(state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
            return state.hero.savedData.maxLife <= baseLife + savedState.unlocks.life;
        }
    },
    {
        key: 'time', x: 1, y: 2, costs: [
            50, 200, 1000, 5000,
        ],
        label: 'Haste',
        description: 'Clear targets faster',
    },
    {
        key: 'heal', x: 1, y: 3, costs: [
            100, 500, 2000, 5000,
        ],
        label: 'Heal',
        description: 'Targets restore life',
    },
    {
        key: 'points', x: 1, y: 4, costs: [
            100, 200, 500, 1000, 2000, 5000, 10000
        ],
        label: 'Greed',
        description: 'Score multiplier',
    },
    {
        key: 'size', x: 1, y: 5, costs: [
            200, 1000, 2000, 5000
        ],
        label: 'Expand',
        description: 'Larger targets',
    },
    {
        key: 'slow', x: 1, y: 6, costs: [
            1000, 2000, 5000, 10000
        ],
        label: 'Slow',
        description: 'Delay attacks',
    },
    {
        key: 'shield', x: 1, y: 7, costs: [
            500, 1000, 2000, 5000, 10000
        ],
        label: 'Shield',
        description: 'More invulnerability',
    },
    // Increase number of targets?
    {
        key: 'reset', x: 2, y: 7,
        label: 'Reset',
        description: 'Clear data',
    },
]
function shopItemRect(gameState: DodgerState, item: ShopItem): Rect {
    return {
        x: gameState.screen.x + 4 + item.x * 42,
        y: gameState.screen.y + 3 + item.y * 15,
        w: 36,
        h: 14,
    };
}
function updateShopItems(state: GameState, gameState: DodgerState, savedState: DodgerSavedState) {
    const unlockedKeys: Set<UnlockKey> = new Set(['turbo', 'l1']);
    for (const key of typedKeys(savedState.unlocks)) {
        if (savedState.unlocks[key]) {
            unlockedKeys.add(key);
        }
    }
    gameState.shopItems = [];
    delete gameState.activeShopItem;
    const heroHitbox = pad(getHeroPosition(state, gameState), -4);
    for (const item of shopItems) {
        if (!unlockedKeys.has(item.key)) {
            continue;
        }
        if (savedState.unlocks[item.key] > 0 || item.key === 'l1') {
            for (const key of (item.unlocks ?? [])) {
                unlockedKeys.add(key);
            }
        }
        if (item.disabled?.(state, gameState, savedState) === true) {
            continue;
        }
        gameState.shopItems.push(item);
        if (boxesIntersect(shopItemRect(gameState, item), heroHitbox)) {
            gameState.activeShopItem = item;
        }
    }
}
function updateShop(state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    gameState.maxLife = gameState.life = baseLife + (savedState.unlocks.life ?? 0);
    updateShopItems(state, gameState, savedState);
    const activeItem = gameState.activeShopItem;
    if (activeItem && wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
        if (activeItem.key === 'turbo') {
            if (savedState.unlocks.turbo) {
                savedState.unlocks.turbo = 0;
            } else {
                savedState.unlocks.turbo = 1;
            }
            return;
        }
        if (activeItem.key === 'reset') {
            gameState.scene = 'reset';
            return;
        }
        const level = savedState.unlocks[activeItem.key] ?? 0;
        const cost = activeItem.costs?.[level];
        if (cost) {
            if (savedState.points >= cost) {
                savedState.points -= cost;
                savedState.unlocks[activeItem.key] = level + 1;
                saveGame(state);
                playAreaSound(state, state.areaInstance, 'secretChime');
            } else {
                playAreaSound(state, state.areaInstance, 'error');
            }
        } else if (level > 0 && activeItem.levelKey) {
            startLevel(state, gameState, activeItem.levelKey);
        }
    }
}
function renderShop(context: CanvasRenderingContext2D, state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    for (const item of gameState.shopItems) {
        const {x, y, w, h} = shopItemRect(gameState, item);
        context.fillStyle = '#084';
        context.fillRect(x, y, w, h);
        if (item.key === 'reset') {
            drawARFont(context, item.label, x + w / 2, y + h / 2, {textAlign: 'center', textBaseline: 'middle'});
            continue;
        }
        drawARFont(context, item.label, x + w / 2, y + 1, {textAlign: 'center', textBaseline: 'top'});
        const level = savedState.unlocks[item.key] ?? 0;
        const cost = item.costs?.[level];
        if (item.key === 'turbo') {
            drawARFont(context, savedState.unlocks.turbo ? 'ON' : 'OFF', x + w / 2, y + 8, {textAlign: 'center', textBaseline: 'top'});
        } else if (cost) {
            drawARFont(context, '' + cost, x + w / 2, y + 8, {textAlign: 'center', textBaseline: 'top'});
        } else if (!item.levelKey) {
            drawARFont(context, 'MAX', x + w / 2, y + 8, {textAlign: 'center', textBaseline: 'top'});
        }
    }
}

function spawnSimpleBullet(state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    const bullet = new SimpleBullet();
    const theta = 2 * Math.PI * Math.random();
    bullet.x = gameState.screen.x + gameState.screen.w / 2 + 130 * Math.cos(theta);
    bullet.y = gameState.screen.y + gameState.screen.h / 2 + 130 * Math.sin(theta);
    const tx = gameState.screen.x + Math.random() * gameState.screen.w;
    const ty = gameState.screen.y + Math.random() * gameState.screen.h;
    const dx = tx - bullet.x, dy = ty - bullet.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    const speed = getBaseBulletSpeed(gameState, savedState);
    bullet.vx = speed * dx / mag;
    bullet.vy = speed * dy / mag;
    gameState.bullets.push(bullet);
}

function spawnStationaryAimingBullet(state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    const bullet = new AimingBullet();
    bullet.ttl = 1500 + 100 * gameState.difficulty;
    const theta = 2 * Math.PI * Math.random();
    bullet.x = gameState.screen.x + gameState.screen.w / 2 + 100 * Math.cos(theta);
    bullet.y = gameState.screen.y + gameState.screen.h / 2 + 100 * Math.sin(theta);
    gameState.bullets.push(bullet);
}

function spawnMovingAimingBullet(state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    const bullet = new AimingBullet();
    bullet.ttl = 1500 + 100 * gameState.difficulty;
    const theta = 2 * Math.PI * Math.random();
    bullet.x = gameState.screen.x + gameState.screen.w / 2 + 100 * Math.cos(theta);
    bullet.y = gameState.screen.y + gameState.screen.h / 2 + 100 * Math.sin(theta);
    const tx = gameState.screen.x + Math.random() * gameState.screen.w;
    const ty = gameState.screen.y + Math.random() * gameState.screen.h;
    const dx = tx - bullet.x, dy = ty - bullet.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    const speed = 1;
    bullet.vx = speed * dx / mag;
    bullet.vy = speed * dy / mag;
    gameState.bullets.push(bullet);
}

function spawnStationarySpinningBullet(state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    const bullet = new SpinningBullet();
    let possibleAngles = gameState.difficulty >= 6 ? 16 : (gameState.difficulty >=4 ? 8 : 4);
    bullet.theta = 2 * Math.PI * Math.floor(Math.random() * possibleAngles) / possibleAngles;
    bullet.ttl = 1500 + 100 * gameState.difficulty;
    bullet.bulletCount = gameState.difficulty < 5 ? 4 : 6;
    bullet.thetaV = 2 * Math.PI / bullet.bulletCount / 4;
    const theta = 2 * Math.PI * Math.random();
    bullet.x = gameState.screen.x + gameState.screen.w / 2 + 80 * Math.cos(theta);
    bullet.y = gameState.screen.y + gameState.screen.h / 2 + 80 * Math.sin(theta);
    gameState.bullets.push(bullet);
}
function spawnMovingSpinningBullet(state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    const bullet = new SpinningBullet();
    let possibleAngles = gameState.difficulty >= 6 ? 16 : (gameState.difficulty >=4 ? 8 : 4);
    bullet.theta = 2 * Math.PI * Math.floor(Math.random() * possibleAngles) / possibleAngles;
    bullet.ttl = 1500 + 100 * gameState.difficulty;
    bullet.bulletCount = gameState.difficulty < 7 ? 4 : 6;
    const theta = 2 * Math.PI * Math.random();
    bullet.x = gameState.screen.x + gameState.screen.w / 2 + 100 * Math.cos(theta);
    bullet.y = gameState.screen.y + gameState.screen.h / 2 + 100 * Math.sin(theta);
    const tx = gameState.screen.x + Math.random() * gameState.screen.w;
    const ty = gameState.screen.y + Math.random() * gameState.screen.h;
    const dx = tx - bullet.x, dy = ty - bullet.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    const speed = 1;
    bullet.vx = speed * dx / mag;
    bullet.vy = speed * dy / mag;
    gameState.bullets.push(bullet);
}

function spawnStrafingBullet(state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    const bullet = new StrafingBullet();
    let possibleAngles = gameState.difficulty >= 6 ? 16 : (gameState.difficulty >=4 ? 8 : 4);
    const theta = 2 * Math.PI * Math.floor(Math.random() * possibleAngles) / possibleAngles;
    bullet.theta = theta + Math.PI;
    bullet.x = gameState.screen.x + gameState.screen.w / 2 + 80 * Math.cos(theta);
    bullet.y = gameState.screen.y + gameState.screen.h / 2 + 80 * Math.sin(theta);
    const dx = Math.cos(theta + Math.PI / 2), dy = Math.sin(theta + Math.PI / 2);
    const speed = getBaseBulletSpeed(gameState, savedState);
    const distance = (48 + Math.floor(Math.random() * 16) + speed * bullet.cooldown / FRAME_LENGTH)
    bullet.x -= distance * dx;
    bullet.y -= distance * dy;
    bullet.vx = speed * dx;
    bullet.vy = speed * dy;
    gameState.bullets.push(bullet);
}

function spawnCirclingBullets(state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    const bulletCount = Math.max(2, gameState.difficulty - 4);
    let possibleAngles = gameState.difficulty >= 6 ? 16 : (gameState.difficulty >=4 ? 8 : 4);
    const baseTheta = 2 * Math.PI * Math.floor(Math.random() * possibleAngles) / possibleAngles;
    for (let i = 0; i < bulletCount; i++) {
        const theta = baseTheta + i * 2 * Math.PI / bulletCount;
        const bullet = new CirclingBullet();
        bullet.cooldown += 40 * i;
        bullet.ttl = 1500 + 100 * gameState.difficulty;
        bullet.x = gameState.screen.x + gameState.screen.w / 2 + 80 * Math.cos(theta);
        bullet.y = gameState.screen.y + gameState.screen.h / 2 + 80 * Math.sin(theta);
        bullet.speed = 2 - gameState.difficulty / 8;
        gameState.bullets.push(bullet);
    }
}

function startLevel(state: GameState, gameState:DodgerState, levelKey: LevelKey) {
    gameState.scene = 'level';
    if (levelKey === 's1') {
        gameState.difficulty = 10;
        gameState.goal = 0;
    } else {
        gameState.difficulty = parseInt(levelKey.substring(1), 10);
        // Target ranges from 3 - 10.
        gameState.goal = 2 + gameState.difficulty;
    }
    gameState.bullets = [];
    gameState.targets = [];
    gameState.score = 0;
    gameState.timesHit = 0;
    gameState.bulletCooldown = 500;
    gameState.specialBulletCooldown = 1000;
    gameState.levelKey = levelKey;
}
function updateLevel(state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    if (gameState.specialBulletCooldown > 0) {
        gameState.specialBulletCooldown -= FRAME_LENGTH;
    } else {
        gameState.specialBulletCooldown = 3500 - (gameState.difficulty - 1) * 250 + (savedState.unlocks.slow ?? 0) * 200;
        if (gameState.difficulty > 6 && Math.random() < 1 / 6 && !gameState.bullets.find(b => b instanceof CirclingBullet)) {
            spawnCirclingBullets(state, gameState, savedState);
        } else if (gameState.difficulty > 5 && Math.random() < 1 / 5) {
            spawnMovingAimingBullet(state, gameState, savedState);
        } else if (gameState.difficulty > 4 && Math.random() < 1 / 4) {
            spawnMovingSpinningBullet(state, gameState, savedState);
        } else if (gameState.difficulty > 3 && Math.random() < 1 / 3) {
            spawnStationarySpinningBullet(state, gameState, savedState);
        } else if (gameState.difficulty > 2 && Math.random() < 0.5) {
            spawnStationaryAimingBullet(state, gameState, savedState);
        } else if (gameState.difficulty > 1) {
            spawnStrafingBullet(state, gameState, savedState);
        }
    }
    if (gameState.bulletCooldown > 0) {
        gameState.bulletCooldown -= FRAME_LENGTH;
    } else {
        gameState.bulletCooldown = 500 /*- (gameState.difficulty - 1) * 20*/ + (savedState.unlocks.slow ?? 0) * 100;
        spawnSimpleBullet(state, gameState, savedState);
    }
    if (!gameState.targets.length) {
        const target = new TargetZone();
        const p = Math.ceil(target.maxSize / 2);
        const sizeIncrease = (1 + (savedState.unlocks.size ?? 0) * target.minSize / 2);
        target.minSize += sizeIncrease;
        target.maxSize += sizeIncrease;
        target.targetTime -= (savedState.unlocks.time ?? 0) * 500
        target.targetTime /= getTurboMultiplier(savedState);
        target.x = Math.round(gameState.screen.x + p + Math.random() * (gameState.screen.w - 2 * p));
        target.y = Math.round(gameState.screen.y + p + Math.random() * (gameState.screen.h - 2 * p));
        gameState.targets.push(target);
    }
    const heroHitbox = pad(getHeroPosition(state, gameState), -3);
    for (let i = 0; i < gameState.targets.length; i++) {
        const target = gameState.targets[i];
        target.update(state, gameState);
        if (target.activeTime >= target.targetTime) {
            playAreaSound(state, state.areaInstance, 'secretChime');
            gameState.score++;
            gameState.targets.splice(i--, 1);
            gameState.life = Math.min(gameState.maxLife, gameState.life + (savedState.unlocks.heal ?? 0) * 0.5);
            if (gameState.goal && gameState.score >= gameState.goal) {
                gameState.scene = 'results';
            }
        }
    }
    if (gameState.invulnerableTime > 0) {
        gameState.invulnerableTime -= FRAME_LENGTH;
    }
    for (let i = 0; i < gameState.bullets.length; i++) {
        const bullet = gameState.bullets[i];
        bullet.update(state, gameState, savedState);
        if (boxesIntersect(heroHitbox, {x: bullet.x - 2, y: bullet.y - 2, w: 4, h: 4})) {
            if (gameState.invulnerableTime <= 0) {
                gameState.life--;
                gameState.invulnerableTime = 100 + (savedState.unlocks.shield ?? 0) * 80;
                gameState.timesHit++;
                playAreaSound(state, state.areaInstance, 'ouch');
                if (gameState.life <= 0) {
                    gameState.life = 0;
                    gameState.scene = 'results';
                    saveGame(state);
                }
            } else {
                playAreaSound(state, state.areaInstance, 'reflect');
            }
            gameState.bullets.splice(i--, 1);
            continue;
        }
        // Remove bullets that have finished traversing the screen.
        const p = 40;
        if (bullet.done
            || (bullet.x < gameState.screen.x - p && bullet.vx < 0)
            || (bullet.x > gameState.screen.x + gameState.screen.w + p && bullet.vx > 0)
            || (bullet.y < gameState.screen.y - p && bullet.vy < 0)
            || (bullet.y > gameState.screen.y + gameState.screen.h + p && bullet.vy > 0)
        ) {
            gameState.bullets.splice(i--, 1);
        }
    }
}



export function updateDodger(state: GameState) {
    const gameState = state.arState.game as DodgerState;
    const savedState = state.savedState.savedArData.gameData.dodger;
    savedState.points = Math.floor(savedState.points);
    if (gameState.scene === 'shop') {
        return updateShop(state, gameState, savedState);
    }
    if (gameState.scene === 'level'){
        return updateLevel(state, gameState, savedState);
    }
    if (gameState.scene === 'results') {
        return updateResults(state, gameState, savedState);
    }
    if (gameState.scene === 'reset') {
        return updateReset(state, gameState, savedState);
    }

}

function getHeroPosition(state: GameState, gameState: DodgerState): Rect {
    const hitbox = state.hero.getMovementHitbox();
    return {
        x: Math.max(gameState.screen.x, Math.min(gameState.screen.x + gameState.screen.w - 16, hitbox.x + hitbox.w / 2 - 8)),
        y: Math.max(gameState.screen.y, Math.min(gameState.screen.y + gameState.screen.h - 16, hitbox.y + hitbox.h / 2 - 8)),
        w: 16,
        h: 16,
    };
}

function renderHero(context: CanvasRenderingContext2D, state: GameState, gameState: DodgerState) {
    const {x, y} = getHeroPosition(state, gameState);
    drawFrame(context, heroArIcon, {
        ...heroArIcon,
        x: (x) | 0,
        y: (y) | 0,
    });
}

export function renderDodger(context: CanvasRenderingContext2D, state: GameState) {
    const gameState = state.arState.game as DodgerState;
    const savedState = state.savedState.savedArData.gameData.dodger;
    context.save();
        context.beginPath();
        context.rect(gameState.screen.x, gameState.screen.y, gameState.screen.w, gameState.screen.h);
        context.strokeStyle = 'red';// 'rgba(255, 0, 0, 1)'
        context.stroke();
        if (gameState.scene === 'level') {
            for (let i = 0; i < gameState.targets.length; i++) {
                gameState.targets[i].render(context, state);
            }
            for (let i = 0; i < gameState.bullets.length; i++) {
                gameState.bullets[i].render(context, state);
            }
        }
        if (gameState.scene === 'shop') {
            renderShop(context, state, gameState, savedState);
        } else if (gameState.scene === 'results') {
            renderResults(context, state, gameState, savedState);
        } else if (gameState.scene === 'reset') {
            renderReset(context, state, gameState, savedState);
        }
        renderHero(context, state, gameState);
    context.restore();
}
export function renderDodgerHUD(context: CanvasRenderingContext2D, state: GameState) {
    const gameState = state.arState.game as DodgerState;
    const savedState = state.savedState.savedArData.gameData.dodger;
    drawARFont(context, 'DODGER', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 16, {textAlign: 'center', textBaseline: 'top'});
    drawARFont(context, 'POINTS: ' + savedState.points, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 8, {textAlign: 'center', textBaseline: 'top'});
    if (gameState.scene === 'level') {
        const text = gameState.score + (gameState.goal ? '/' + gameState.goal : '');
        drawARFont(context, text, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 32, {textAlign: 'center', textBaseline: 'top'});
    }
    if (gameState.scene === 'shop' && gameState.activeShopItem) {
        const item = gameState.activeShopItem;
        const level = savedState.unlocks[item.key] ?? 0;
        const cost = item.costs?.[level];
        const w = 96, h = 17;
        context.fillStyle = '#084';
        context.fillRect(CANVAS_WIDTH / 2 - w / 2, CANVAS_HEIGHT - 50, w, h);
        if (item.levelKey) {
            const score = savedState.records[item.levelKey] ?? 0;
            if (cost) {
                drawARFont(context,'UNLOCK NEW LEVEL', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 42, {textAlign: 'center', textBaseline: 'middle'});
            } else {
                drawARFont(context, item.description, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 48, {textAlign: 'center', textBaseline: 'top'});
                drawARFont(context, 'High Score ' + score, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40, {textAlign: 'center', textBaseline: 'top'});
            }
        } else {
            drawARFont(context, item.description, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 42, {textAlign: 'center', textBaseline: 'middle'});
        }
    }
    // Draw bright green square life indicators over player life, should be kept in sync with code from renderHUD
    let x = 26;
    let y = 5;
    for (let i = 0; i < gameState.maxLife; i++) {
        if (i === 10) {
            y += 11;
            x = 26;
        }
        if (i <= gameState.life - 1) {
            context.fillStyle = '#0F8';
            context.fillRect(x, y, 10, 10);
            context.fillStyle = '#084';
            context.fillRect(x + 1, y + 1, 8, 8);
        } else if (i < gameState.life) {
            context.fillStyle = '#0F8';
            context.fillRect(x + 2, y + 2, 6, 6);
            context.fillStyle = '#084';
            context.fillRect(x + 3, y + 3, 4, 4);
        } else {
            context.fillStyle = '#084';
            context.fillRect(x + 4, y + 4, 2, 2);
        }
        x += 11;
    }
}

// RESULTS

function getResultsBreakdown(state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    const pointsMultiplier = 1 + (savedState.unlocks.points ?? 0);
    const difficultyMultiplier = 1 + 2 * (gameState.difficulty - 1);
    let victoryMultiplier = 1;
    let rating = '';
    if (gameState.timesHit <= 0) {
        victoryMultiplier = 4;
        rating = 'flawless'
    } else if (gameState.timesHit <= 1) {
        victoryMultiplier = 3;
        rating = 'excellent'
    } else if (gameState.life > 0) {
        victoryMultiplier = 2;
        rating = 'victory'
    }
    const targetScore = gameState.score;
    const lifeScore = gameState.life;
    const total = Math.ceil((targetScore + lifeScore) * difficultyMultiplier * victoryMultiplier * pointsMultiplier);

    return {
        difficultyMultiplier,
        victoryMultiplier,
        pointsMultiplier,
        targetScore,
        lifeScore,
        rating,
        total,
    };
}
function updateResults(state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    if (wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
        const total = getResultsBreakdown(state, gameState, savedState).total;
        savedState.points += total
        savedState.records[gameState.levelKey] = Math.max(savedState.records[gameState.levelKey] ?? 0, total);
        showShop(state, gameState, savedState);
        if (gameState.life > 0 && gameState.levelKey === 'l8') {
            savedState.unlocks.s1 = 1;
        }
        saveGame(state);
    }
}
function showShop(state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    gameState.scene = 'shop';
    gameState.shopItems = [];
    delete gameState.activeShopItem;
}

function renderResults(context: CanvasRenderingContext2D, state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    let y = gameState.screen.y + 4;
    const {
        difficultyMultiplier,
        victoryMultiplier,
        pointsMultiplier,
        targetScore,
        lifeScore,
        rating,
        total,
    } = getResultsBreakdown(state, gameState, savedState);
    drawARFont(context, gameState.life > 0 ? 'VICTORY!' : 'DEFEAT!', gameState.screen.x + gameState.screen.w / 2, y += 10, {textAlign: 'center', textBaseline: 'top'});

    // Score calculation
    y += 10;
    drawARFont(context, targetScore + ' targets + ' + lifeScore + ' life', gameState.screen.x + gameState.screen.w / 2, y += 10, {textAlign: 'center', textBaseline: 'top'});
    drawARFont(context, '*' + difficultyMultiplier + ' difficulty', gameState.screen.x + gameState.screen.w / 2, y += 10, {textAlign: 'center', textBaseline: 'top'});
    if (victoryMultiplier > 1) {
        drawARFont(context, '*' + victoryMultiplier  + ' ' + rating, gameState.screen.x + gameState.screen.w / 2, y += 10, {textAlign: 'center', textBaseline: 'top'});
    }
    if (pointsMultiplier > 1) {
        drawARFont(context, '*' + pointsMultiplier + ' GREED', gameState.screen.x + gameState.screen.w / 2, y += 10, {textAlign: 'center', textBaseline: 'top'});
    }

    // Total score and high score.
    y += 10;
    drawARFont(context, 'Total score ' + total, gameState.screen.x + gameState.screen.w / 2, y += 10, {textAlign: 'center', textBaseline: 'top'});
    drawARFont(context, 'High score ' + Math.max(savedState.records[gameState.levelKey] ?? 0, total), gameState.screen.x + gameState.screen.w / 2, y += 10, {textAlign: 'center', textBaseline: 'top'});
}

// RESET
function getYesRect(gameState:DodgerState) {
    return {
        x: gameState.screen.x + 4,
        y: gameState.screen.y + 108,
        w: 36,
        h: 14,
    }
}
function getNoRect(gameState:DodgerState) {
    return {
        x: gameState.screen.x + gameState.screen.w - 4 - 36,
        y: gameState.screen.y + 108,
        w: 36,
        h: 14,
    }
}
function updateReset(state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    if (wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
        const heroHitbox = pad(getHeroPosition(state, gameState), -4);
        if (boxesIntersect(heroHitbox, getNoRect(gameState))) {
            showShop(state, gameState, savedState);
            return;
        }
        if (boxesIntersect(heroHitbox, getYesRect(gameState))) {
            showShop(state, gameState, savedState);
            state.savedState.savedArData.gameData.dodger = getNewDodgerSavedState();
            return;
        }
    }
}
function renderReset(context: CanvasRenderingContext2D, state: GameState, gameState:DodgerState, savedState: DodgerSavedState) {
    drawARFont(context, 'ERASE ALL PROGRESS?', gameState.screen.x + gameState.screen.w / 2, gameState.screen.y + gameState.screen.h / 2, {textAlign: 'center', textBaseline: 'middle'});
    let r = getYesRect(gameState);
    context.fillStyle = '#084';
    context.fillRect(r.x, r.y, r.w, r.h);
    drawARFont(context, 'YES', r.x + r.w / 2, r.y + r.h / 2, {textAlign: 'center', textBaseline: 'middle'});
    r = getNoRect(gameState);
    context.fillStyle = '#084';
    context.fillRect(r.x, r.y, r.w, r.h);
    drawARFont(context, 'NO', r.x + r.w / 2, r.y + r.h / 2, {textAlign: 'center', textBaseline: 'middle'});
}
