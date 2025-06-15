import {CANVAS_HEIGHT, CANVAS_WIDTH, FRAME_LENGTH, GAME_KEY} from 'app/gameConstants';
import {heroArIcon} from 'app/render/heroAnimations';
import {drawFrame} from 'app/utils/animations';
import {boxesIntersect, pad} from 'app/utils/index';
import {drawARFont} from 'app/arGames/arFont';
import {playAreaSound} from 'app/musicController';
import {wasGameKeyPressed} from 'app/userInput';
import {saveGame} from 'app/utils/saveGame';
import {typedKeys} from 'app/utils/types';

type LevelKey = 'none' | 'l1' | 'l2' | 'l3' | 'l4' | 'l5' | 'l6' | 'l7' | 'l8' | 'l9';
type UnlockKey = LevelKey | 'ammo' | 'speed' | 'reload' | 'points' | 'time' | 'multishot' | 'pierce' | 'reset';
type Scene = 'shop' | 'level' | 'results' | 'reset';

const baseAmmo = 10;
const baseShotSpeed = 6;

const levelConfigs: {[key in LevelKey]: LevelConfig} = {
    'none': { timeLimit: 0, goal: 0, spawnInterval: 2000, maxTargets: 1, targetPoints: 10, targetRadius: 15, targetSpeed: 0, targetLifetime: 10000 },
    'l1': { timeLimit: 30000, goal: 60, spawnInterval: 3000, maxTargets: 2, targetPoints: 1000, targetRadius: 18, targetSpeed: 1, targetLifetime: 10000 },
    'l2': { timeLimit: 30000, goal: 100, spawnInterval: 2000, maxTargets: 3, targetPoints: 15, targetRadius: 16, targetSpeed: 2, targetLifetime: 8000 },
    'l3': { timeLimit: 30000, goal: 200, spawnInterval: 2000, maxTargets: 3, targetPoints: 20, targetRadius: 14, targetSpeed: 3, targetLifetime: 6000 },
    'l4': { timeLimit: 30000, goal: 250, spawnInterval: 1800, maxTargets: 4, targetPoints: 25, targetRadius: 12, targetSpeed: 4, targetLifetime: 5000 },
    'l5': { timeLimit: 30000, goal: 300, spawnInterval: 1500, maxTargets: 4, targetPoints: 30, targetRadius: 10, targetSpeed: 5, targetLifetime: 4000 },
    'l6': { timeLimit: 30000, goal: 400, spawnInterval: 1200, maxTargets: 5, targetPoints: 35, targetRadius: 8, targetSpeed: 6, targetLifetime: 3000 },
    'l7': { timeLimit: 30000, goal: 500, spawnInterval: 1000, maxTargets: 5, targetPoints: 40, targetRadius: 6, targetSpeed: 7, targetLifetime: 2500 },
    'l8': { timeLimit: 30000, goal: 600, spawnInterval: 800, maxTargets: 6, targetPoints: 45, targetRadius: 5, targetSpeed: 8, targetLifetime: 2250 },
    'l9': { timeLimit: 30000, goal: 800, spawnInterval: 600, maxTargets: 6, targetPoints: 50, targetRadius: 4, targetSpeed: 9, targetLifetime: 2000 },
};

interface TargetPracticeState {
    scene: Scene
    screen: Rect
    bullets: PracticeBullet[]
    targets: Target[]
    crosshair: {x: number, y: number}
    reloadTime: number
    levelKey: LevelKey
    ammo: number
    maxAmmo: number
    score: number
    goal: number
    timeLeft: number
    maxTime: number
    shopItems: ShopItem[]
    activeShopItem?: ShopItem
    lastShotTime: number
    nextSpawnTime: number
    spawnInterval: number
    maxTargets: number
    shotsFired: number
    shotsHit: number
}

interface ShopItem {
    key: UnlockKey
    levelKey?: LevelKey
    x: number
    y: number
    costs?: number[]
    unlocks?: UnlockKey[]
    disabled?: (state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) => boolean
    label: string
    description: string
}

interface TargetPracticeSavedState {
    points: number
    records: {[key in LevelKey]?: number}
    unlocks: {[key in UnlockKey]?: number}
}

interface PracticeBullet {
    x: number
    y: number
    vx: number
    vy: number
    piercing: boolean
    done?: boolean
    update(state: GameState, gameState: TargetPracticeState): void
    render(context: CanvasRenderingContext2D): void
}

interface Target {
    x: number
    y: number
    w: number
    h: number
    points: number
    speed: number
    vx: number
    vy: number
    color: string
    hitTime?: number
    update(state: GameState, gameState: TargetPracticeState): void
    render(context: CanvasRenderingContext2D): void
    getHitbox(): Rect
}

interface LevelConfig {
    timeLimit: number;
    goal: number;
    spawnInterval: number;
    maxTargets: number;
    targetPoints: number;
    targetRadius: number;
    targetSpeed: number;
    targetLifetime: number;
}

class PlayerBullet implements PracticeBullet {
    x: number;
    y: number;
    vx: number;
    vy: number;
    piercing = false;
    done = false;

    update(state: GameState, gameState: TargetPracticeState) {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < gameState.screen.x - 10 || this.x > gameState.screen.x + gameState.screen.w + 10 ||
            this.y < gameState.screen.y - 10 || this.y > gameState.screen.y + gameState.screen.h + 10) {
            this.done = true;
        }
    }

    render(context: CanvasRenderingContext2D) {
        context.fillStyle = '#FF0';
        context.fillRect(this.x - 1, this.y - 1, 2, 2);
    }
}

class StandardTarget implements Target {
    x: number;
    y: number;
    w: number;
    h: number;
    points: number;
    speed: number;
    vx: number;
    vy: number;
    color: string;
    hitTime?: number;
    radius: number;
    lifetime: number; 
    maxLifetime: number; 

    constructor(x: number, y: number, radius: number, points: number, speed: number = 0, lifetime: number = 10000) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.w = radius * 2;
        this.h = radius * 2;
        this.points = points;
        this.speed = speed;
        this.vx = speed > 0 ? (Math.random() - 0.5) * speed : 0;
        this.vy = speed > 0 ? (Math.random() - 0.5) * speed : 0;
        this.color = points >= 50 ? '#F00' : points >= 30 ? '#FA0' : points >= 20 ? '#FF0' : '#0C0';
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
    }

    update(state: GameState, gameState: TargetPracticeState) {
        if (this.hitTime !== undefined) {
            this.hitTime -= FRAME_LENGTH;
            return;
        }

        this.lifetime -= FRAME_LENGTH;

        this.x += this.vx;
        this.y += this.vy;

        if (this.x - this.radius <= gameState.screen.x || this.x + this.radius >= gameState.screen.x + gameState.screen.w) {
            this.vx = -this.vx;
            this.x = Math.max(gameState.screen.x + this.radius, Math.min(gameState.screen.x + gameState.screen.w - this.radius, this.x));
        }
        if (this.y - this.radius <= gameState.screen.y || this.y + this.radius >= gameState.screen.y + gameState.screen.h) {
            this.vy = -this.vy;
            this.y = Math.max(gameState.screen.y + this.radius, Math.min(gameState.screen.y + gameState.screen.h - this.radius, this.y));
        }
    }

    render(context: CanvasRenderingContext2D) {
        let fillColor = this.color;
        let alpha = 1;

        if (this.hitTime !== undefined && this.hitTime > 0) {
            fillColor = Math.floor(this.hitTime / 50) % 2 ? '#FFF' : this.color;
        } else if (this.lifetime < 2000) {
            alpha = this.lifetime / 2000;
            alpha = Math.max(0.05, alpha); 
        }
        
        context.save();
        context.globalAlpha = alpha;
        context.fillStyle = fillColor;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.fill();
        
        context.fillStyle = '#000';
        drawARFont(context, this.points.toString(), this.x, this.y, {textAlign: 'center', textBaseline: 'middle'});
        context.restore();
    }

    getHitbox(): Rect {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            w: this.radius * 2,
            h: this.radius * 2,
        };
    }

    shouldRemove(): boolean {
        return this.lifetime <= 0;
    }
}

function getNewTargetPracticeState(state: GameState): TargetPracticeState {
    return {
        scene: 'shop',
        screen: {
            x: (((state.hero.x - 64) / 8) | 0) * 8,
            y: (((state.hero.y - 64) / 8) | 0) * 8,
            w: 128,
            h: 128,
        },
        bullets: [],
        targets: [],
        crosshair: {x: 0, y: 0},
        reloadTime: 0,
        shopItems: [],
        levelKey: 'none',
        ammo: baseAmmo,
        maxAmmo: baseAmmo,
        score: 0,
        goal: 100,
        timeLeft: 30000,
        maxTime: 30000,
        lastShotTime: 0,
        nextSpawnTime: 0, 
        spawnInterval: 2000, 
        maxTargets: 5, 
        shotsFired: 0,         
        shotsHit: 0, 
    };
}


function getNewTargetPracticeSavedState(): TargetPracticeSavedState {
    return {
        points: 0,
        records: {},
        unlocks: {'l1': 1},
    };
}

function startTargetPractice(state: GameState) {
    state.arState.game = getNewTargetPracticeState(state);
    const savedState = state.savedState.savedArData.gameData.targetPractice || {};
    state.savedState.savedArData.gameData.targetPractice = {...getNewTargetPracticeSavedState(), ...savedState};
}

const shopItems: ShopItem[] = [
    {key: 'l1', levelKey: 'l1', x: 0, y: 0, unlocks: ['l2', 'reset'], label: 'Level 1', description: 'Warm Up'},
    {key: 'l2', levelKey: 'l2', x: 0, y: 1, costs: [50], unlocks: ['l3', 'ammo'], label: 'Level 2', description: 'Practice'},
    {key: 'l3', levelKey: 'l3', x: 0, y: 2, costs: [100], unlocks: ['l4', 'speed'], label: 'Level 3', description: 'Deputy'},
    {key: 'l4', levelKey: 'l4', x: 0, y: 3, costs: [200], unlocks: ['l5', 'reload'], label: 'Level 4', description: 'Bandito'},
    {key: 'l5', levelKey: 'l5', x: 0, y: 4, costs: [400], unlocks: ['l6'], label: 'Level 5', description: 'Sheriff'},
    {key: 'l6', levelKey: 'l6', x: 0, y: 5, costs: [800], unlocks: ['l7', 'points'], label: 'Level 6', description: 'Marshall'},
    {key: 'l7', levelKey: 'l7', x: 0, y: 6, costs: [1600], unlocks: ['l8', 'time'], label: 'Level 7', description: 'Sharpshooter'},
    {key: 'l8', levelKey: 'l8', x: 0, y: 7, costs: [3200], unlocks: ['l9', 'multishot'], label: 'Level 8', description: 'Legend'},
    {key: 'l9', levelKey: 'l9', x: 0, y: 8, costs: [6400], unlocks: ['pierce'], label: 'Level 9', description: 'Desperado'},
    {
        key: 'ammo', x: 1, y: 0, costs: [50, 100, 200, 400, 800],
        label: 'Ammo',
        description: 'More shots per round',
    },
    {
        key: 'speed', x: 1, y: 1, costs: [100, 200, 400, 800],
        label: 'Speed',
        description: 'Faster bullet velocity',
    },
    {
        key: 'reload', x: 1, y: 2, costs: [200, 400, 800, 1600],
        label: 'Reload',
        description: 'Faster shooting rate',
    },
    {
        key: 'points', x: 1, y: 4, costs: [200, 400, 800, 1600, 3200],
        label: 'Greed',
        description: 'Score multiplier',
    },
    {
        key: 'time', x: 1, y: 5, costs: [800, 1600, 3200],
        label: 'Time',
        description: 'More time per level',
    },
    {
        //WIP: Implement higher tiers of Multishot
        key: 'multishot', x: 1, y: 6, costs: [1600, 3200, 6400],
        label: 'Multishot',
        description: 'Fire multiple bullets',
    },
    {
        key: 'pierce', x: 1, y: 7, costs: [3200, 6400],
        label: 'Pierce',
        description: 'Bullets go through targets',
    },
    {
        key: 'reset', x: 2, y: 7,
        label: 'Reset',
        description: 'Clear data',
    },
];

function shopItemRect(gameState: TargetPracticeState, item: ShopItem): Rect {
    return {
        x: gameState.screen.x + 4 + item.x * 42,
        y: gameState.screen.y + 3 + item.y * 13,
        w: 36,
        h: 12,
    };
}

function updateShopItems(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    const unlockedKeys: Set<UnlockKey> = new Set(['l1']);
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

function updateShop(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    gameState.maxAmmo = baseAmmo + (savedState.unlocks.ammo ?? 0) * 5;
    gameState.ammo = gameState.maxAmmo;
    updateShopItems(state, gameState, savedState);
    const activeItem = gameState.activeShopItem;
    if (activeItem && wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
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

function renderShop(context: CanvasRenderingContext2D, state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
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
        if (cost) {
            drawARFont(context, '' + cost, x + w / 2, y + 7, {textAlign: 'center', textBaseline: 'top'});
        } else if (!item.levelKey) {
            drawARFont(context, 'MAX', x + w / 2, y + 7, {textAlign: 'center', textBaseline: 'top'});
        }
    }
}

function spawnSingleTarget(state: GameState, gameState: TargetPracticeState, levelKey: LevelKey) {
    const config = levelConfigs[levelKey];
    const radius = config.targetRadius;
    const points = config.targetPoints;
    const speed = config.targetSpeed;
    const lifetime = config.targetLifetime;
    
    let x = 0;
    let y = 0;
    let attempts = 0;
    do {
        x = gameState.screen.x + radius + Math.random() * (gameState.screen.w - 2 * radius);
        y = gameState.screen.y + radius + Math.random() * (gameState.screen.h - 2 * radius);
        attempts++;
    } while (attempts < 20 && gameState.targets.some(t => 
        Math.sqrt((t.x - x) ** 2 + (t.y - y) ** 2) < radius + 15
    ));
    
    gameState.targets.push(new StandardTarget(x, y, radius, points, speed, lifetime));
}


function startLevel(state: GameState, gameState: TargetPracticeState, levelKey: LevelKey) {
    gameState.scene = 'level';
    gameState.levelKey = levelKey;
    
    const config = levelConfigs[levelKey];
    const savedState = state.savedState.savedArData.gameData.targetPractice;
    
    const timeBonus = (savedState.unlocks.time ?? 0) * 5000;
    gameState.maxTime = config.timeLimit + timeBonus;
    gameState.timeLeft = gameState.maxTime;
    gameState.goal = config.goal;
    gameState.spawnInterval = config.spawnInterval;
    gameState.maxTargets = config.maxTargets;
    
    gameState.targets = [];
    gameState.bullets = [];
    gameState.score = 0;
    gameState.reloadTime = 0;
    gameState.lastShotTime = 0;
    gameState.nextSpawnTime = 0;
    
    const heroPos = getHeroPosition(state, gameState);
    gameState.crosshair.x = heroPos.x + heroPos.w / 2;
    gameState.crosshair.y = heroPos.y + heroPos.h / 2;
}

function fireBullet(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    if (gameState.ammo <= 0 || gameState.reloadTime > 0) return;
    
    const heroPos = getHeroPosition(state, gameState);
    const heroX = heroPos.x + heroPos.w / 2;
    const heroY = heroPos.y + heroPos.h / 2;
    
    const speed = baseShotSpeed + (savedState.unlocks.speed ?? 0) * 2;
    const multishot = savedState.unlocks.multishot ?? 0;
    const bullets = Math.max(1, multishot);
    
    for (let i = 0; i < bullets; i++) {
        const bullet = new PlayerBullet();
        bullet.x = heroX;
        bullet.y = heroY;
        bullet.piercing = (savedState.unlocks.pierce ?? 0) > 0;
        
        let angle = -Math.PI / 2; 
        if (bullets > 1) {
            const spread = 0.3;
            angle += (i - (bullets - 1) / 2) * spread / bullets;
        }
        
        bullet.vx = speed * Math.cos(angle);
        bullet.vy = speed * Math.sin(angle);
        gameState.bullets.push(bullet);
    }
    
    gameState.ammo--;
    gameState.shotsFired++;
    gameState.reloadTime = Math.max(100, 300 - (savedState.unlocks.reload ?? 0) * 50);
    gameState.lastShotTime = 200;
    
    playAreaSound(state, state.areaInstance, 'action');
}



function updateLevel(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    const heroPos = getHeroPosition(state, gameState);
    gameState.crosshair.x = heroPos.x + heroPos.w / 2;
    gameState.crosshair.y = heroPos.y + heroPos.h / 2;
    
    if (wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
        fireBullet(state, gameState, savedState);
    }
    
    if (gameState.reloadTime > 0) {
        gameState.reloadTime -= FRAME_LENGTH;
    }
    
    if (gameState.lastShotTime > 0) {
        gameState.lastShotTime -= FRAME_LENGTH;
    }
    
    gameState.nextSpawnTime -= FRAME_LENGTH;
    if (gameState.nextSpawnTime <= 0 && gameState.targets.length < gameState.maxTargets) {
        spawnSingleTarget(state, gameState, gameState.levelKey);
        gameState.nextSpawnTime = gameState.spawnInterval;
    }
    
    for (let i = 0; i < gameState.bullets.length; i++) {
        const bullet = gameState.bullets[i];
        bullet.update(state, gameState);
        
        for (let j = 0; j < gameState.targets.length; j++) {
            const target = gameState.targets[j];
            if (target.hitTime !== undefined) continue;
            
            const dx = bullet.x - target.x;
            const dy = bullet.y - target.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= (target as StandardTarget).radius) {
                const points = target.points * (1 + (savedState.unlocks.points ?? 0));
                gameState.score += points;
                gameState.shotsHit++;
                target.hitTime = 300;
                
                if (!bullet.piercing) {
                    bullet.done = true;
                }
                
                playAreaSound(state, state.areaInstance, 'secretChime');
                break;
            }
        }
        
        if (bullet.done) {
            gameState.bullets.splice(i--, 1);
        }
    }
    
    for (let i = 0; i < gameState.targets.length; i++) {
        const target = gameState.targets[i] as StandardTarget;
        target.update(state, gameState);
        
        if (target.shouldRemove() || (target.hitTime !== undefined && target.hitTime <= 0)) {
            gameState.targets.splice(i--, 1);
        }
    }
    
    gameState.timeLeft -= FRAME_LENGTH;

    if (gameState.timeLeft <= 0 || (gameState.ammo <= 0 && gameState.bullets.length === 0)) {
        gameState.scene = 'results';
    } else if (gameState.goal > 0 && gameState.score >= gameState.goal) {
        gameState.scene = 'results';
    }
}

function updateTargetPractice(state: GameState) {
    const gameState = state.arState.game as TargetPracticeState;
    const savedState = state.savedState.savedArData.gameData.targetPractice;
    savedState.points = Math.floor(savedState.points);
    
    if (gameState.scene === 'shop') {
        return updateShop(state, gameState, savedState);
    }
    if (gameState.scene === 'level') {
        return updateLevel(state, gameState, savedState);
    }
    if (gameState.scene === 'results') {
        return updateResults(state, gameState, savedState);
    }
    if (gameState.scene === 'reset') {
        return updateReset(state, gameState, savedState);
    }
}

function getHeroPosition(state: GameState, gameState: TargetPracticeState): Rect {
    const hitbox = state.hero.getMovementHitbox();
    return {
        x: Math.max(gameState.screen.x, Math.min(gameState.screen.x + gameState.screen.w - 16, hitbox.x + hitbox.w / 2 - 8)),
        y: Math.max(gameState.screen.y, Math.min(gameState.screen.y + gameState.screen.h - 16, hitbox.y + hitbox.h / 2 - 8)),
        w: 16,
        h: 16,
    };
}

function renderHero(context: CanvasRenderingContext2D, state: GameState, gameState: TargetPracticeState) {
    const {x, y} = getHeroPosition(state, gameState);
    drawFrame(context, heroArIcon, {
        ...heroArIcon,
        x: (x) | 0,
        y: (y) | 0,
    });
}

function renderTargetPractice(context: CanvasRenderingContext2D, state: GameState) {
    const gameState = state.arState.game as TargetPracticeState;
    const savedState = state.savedState.savedArData.gameData.targetPractice;
    
    context.save();
    context.beginPath();
    context.rect(gameState.screen.x, gameState.screen.y, gameState.screen.w, gameState.screen.h);
    context.save();
    context.globalAlpha = 0.5;
    context.fillStyle = 'black';
    context.fill();
    context.restore();
    context.strokeStyle = 'blue';
    context.stroke();
    
    if (gameState.scene === 'level') {
        for (const target of gameState.targets) {
            target.render(context);
        }

        for (const bullet of gameState.bullets) {
            bullet.render(context);
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


function updateResults(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    if (wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
        let earnedPoints = gameState.score;
        const missedShots = gameState.shotsFired - gameState.shotsHit;
        
        if (missedShots === 0) {
            earnedPoints *= 3; 
        } else if (missedShots <= 2) {
            earnedPoints *= 2; 
        }
        
        savedState.points += earnedPoints;
        
        const currentRecord = savedState.records[gameState.levelKey] ?? 0;
        if (gameState.score > currentRecord) {
            savedState.records[gameState.levelKey] = gameState.score;
        }
        
        saveGame(state);
        gameState.scene = 'shop';
    }
}


function renderResults(context: CanvasRenderingContext2D, state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    const {x, y, w, h} = gameState.screen;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(x, y, w, h);
    
    const centerX = x + w / 2;
    
    drawARFont(context, 'RESULTS', centerX, y + 10, {textAlign: 'center', textBaseline: 'top'});
    
    drawARFont(context, 'SCORE: ' + gameState.score, centerX, y + 25, {textAlign: 'center', textBaseline: 'top'});
    
    const accuracy = gameState.shotsFired > 0 ? Math.round((gameState.shotsHit / gameState.shotsFired) * 100) : 100;
    const missedShots = gameState.shotsFired - gameState.shotsHit;
    drawARFont(context, `ACCURACY: ${accuracy}% (${gameState.shotsHit}/${gameState.shotsFired})`, centerX, y + 40, {textAlign: 'center', textBaseline: 'top'});
    
    if (gameState.goal > 0) {
        const success = gameState.score >= gameState.goal;
        const statusText = success ? 'SUCCESS!' : 'FAILED';
        const statusColor = success ? '#0F0' : '#F00';
        
        context.fillStyle = statusColor;
        drawARFont(context, statusText, centerX, y + 55, {textAlign: 'center', textBaseline: 'top'});
        context.fillStyle = '#FFF';
    }
    
    let earnedPoints = gameState.score;
    let bonusText = '';
    
    if (missedShots === 0) {
        earnedPoints *= 3;
        bonusText = ' (PERFECT x3!)';
    } else if (missedShots <= 2) {
        earnedPoints *= 2;
        bonusText = ' (GREAT x2!)';
    }
    
    drawARFont(context, 'POINTS: +' + earnedPoints + bonusText, centerX, y + 70, {textAlign: 'center', textBaseline: 'top'});
    
    const currentRecord = savedState.records[gameState.levelKey] ?? 0;
    if (gameState.score > currentRecord) {
        drawARFont(context, 'NEW RECORD!', centerX, y + 85, {textAlign: 'center', textBaseline: 'top'});
    } else if (currentRecord > 0) {
        drawARFont(context, 'RECORD: ' + currentRecord, centerX, y + 85, {textAlign: 'center', textBaseline: 'top'});
    }

    drawARFont(context, 'PRESS SPACE', centerX, y + h - 15, {textAlign: 'center', textBaseline: 'top'});
}

function getYesRect(gameState:TargetPracticeState) {
    return {
        x: gameState.screen.x + 4,
        y: gameState.screen.y + 108,
        w: 36,
        h: 14,
    }
}
function getNoRect(gameState:TargetPracticeState) {
    return {
        x: gameState.screen.x + gameState.screen.w - 4 - 36,
        y: gameState.screen.y + 108,
        w: 36,
        h: 14,
    }
}
function updateReset(state: GameState, gameState:TargetPracticeState, savedState: TargetPracticeSavedState) {
    if (wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
        const heroHitbox = pad(getHeroPosition(state, gameState), -4);
        if (boxesIntersect(heroHitbox, getNoRect(gameState))) {
            gameState.scene = 'shop';
        }
        if (boxesIntersect(heroHitbox, getYesRect(gameState))) {
            Object.assign(savedState, getNewTargetPracticeSavedState());
            saveGame(state);
            gameState.scene = 'shop';
            playAreaSound(state, state.areaInstance, 'secretChime');
        }
    }
}
function renderReset(context: CanvasRenderingContext2D, state: GameState, gameState:TargetPracticeState, savedState: TargetPracticeSavedState) {
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

function renderTargetPracticeHUD(context: CanvasRenderingContext2D, state: GameState) {
    const gameState = state.arState.game as TargetPracticeState;
    const savedState = state.savedState.savedArData.gameData.targetPractice;

    drawARFont(context, 'TARGET PRACTICE', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 16, {textAlign: 'center', textBaseline: 'top'});
    drawARFont(context, 'POINTS: ' + savedState.points, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 8, {textAlign: 'center', textBaseline: 'top'});

    if (gameState.scene === 'shop' && gameState.activeShopItem) {
        const item = gameState.activeShopItem;
        const level = savedState.unlocks[item.key] ?? 0;
        const cost = item.costs?.[level];
        const boxY = CANVAS_HEIGHT - 40;
        const boxHeight = 20;
        const boxWidth = 180;
        const boxX = CANVAS_WIDTH / 2 - boxWidth / 2;
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(boxX, boxY, boxWidth, boxHeight);
        context.strokeStyle = '#084';
        context.strokeRect(boxX, boxY, boxWidth, boxHeight);
        drawARFont(context, item.description, CANVAS_WIDTH / 2, boxY + 4, {textAlign: 'center', textBaseline: 'top'});
        
        if (cost) {
            const canAfford = savedState.points >= cost;
            const costText = 'COST: ' + cost + (canAfford ? '' : ' (NOT ENOUGH)');
            drawARFont(context, costText, CANVAS_WIDTH / 2, boxY + 12, {textAlign: 'center', textBaseline: 'top'});
        } else if (item.levelKey && level > 0) {
            const highScore = savedState.records[item.levelKey] ?? 0;
            const scoreText = highScore > 0 ? 'HIGH SCORE: ' + highScore : 'NO RECORD YET';
            drawARFont(context, scoreText, CANVAS_WIDTH / 2, boxY + 12, {textAlign: 'center', textBaseline: 'top'});
        } else if (!item.costs) {
            drawARFont(context, 'MAX LEVEL', CANVAS_WIDTH / 2, boxY + 12, {textAlign: 'center', textBaseline: 'top'});
        }
    }
    
    if (gameState.scene === 'level') {
        const scoreText = gameState.score + (gameState.goal ? '/' + gameState.goal : '');
        drawARFont(context, scoreText, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40, {textAlign: 'center', textBaseline: 'top'});
        
        const timeText = Math.ceil(gameState.timeLeft / 1000).toString();
        drawARFont(context, 'TIME: ' + timeText, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 32, {textAlign: 'center', textBaseline: 'top'});
        
        drawARFont(context, 'AMMO: ' + gameState.ammo, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 24, {textAlign: 'center', textBaseline: 'top'});
    }
}

export const targetPracticeGame: ARGame = {
    start: startTargetPractice,
    update: updateTargetPractice,
    render: renderTargetPractice,
    renderHUD: renderTargetPracticeHUD,
};