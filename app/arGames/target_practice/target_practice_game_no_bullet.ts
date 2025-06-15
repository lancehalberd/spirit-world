import {CANVAS_HEIGHT, CANVAS_WIDTH, FRAME_LENGTH, GAME_KEY} from 'app/gameConstants';
import {ArCrosshairIcon} from 'app/render/heroAnimations';
import {drawFrame} from 'app/utils/animations';
import {boxesIntersect, pad} from 'app/utils/index';
import {drawARFont} from 'app/arGames/arFont';
import {playAreaSound} from 'app/musicController';
import {wasGameKeyPressed} from 'app/userInput';
import {saveGame} from 'app/utils/saveGame';
import {typedKeys} from 'app/utils/types';

type LevelKey = 'none' | 'l1' | 'l2' | 'l3' | 'l4' | 'l5' | 'l6' | 'l7' | 'l8' | 'l9' 
type UnlockKey = LevelKey | 'ammo' | 'speed' | 'reload' | 'accuracy' | 'points' | 'time' | 'multishot' | 'pierce' | 'reset';
type Scene = 'shop' | 'level' | 'results' | 'reset';

const baseAmmo = 10;

const levelConfigs: {[key in LevelKey]: LevelConfig} = {
    'none': { timeLimit: 0, goal: 0, spawnInterval: 0, targetValue: 0 },
    'l1': { timeLimit: 30000, goal: 100, spawnInterval: 2000, targetValue: 1000 },
    'l2': { timeLimit: 30000, goal: 150, spawnInterval: 1800, targetValue: 15, targetSpeed: 2 },
    'l3': { timeLimit: 25000, goal: 200, spawnInterval: 1500, targetValue: 20, targetSpeed: 3 },
    'l4': { timeLimit: 25000, goal: 250, spawnInterval: 1200, targetValue: 25, targetSpeed: 4 },
    'l5': { timeLimit: 20000, goal: 300, spawnInterval: 1000, targetValue: 30, targetSpeed: 5 },
    'l6': { timeLimit: 20000, goal: 400, spawnInterval: 800, targetValue: 35, targetSpeed: 6 },
    'l7': { timeLimit: 15000, goal: 500, spawnInterval: 600, targetValue: 40, targetSpeed: 7 },
    'l8': { timeLimit: 15000, goal: 600, spawnInterval: 500, targetValue: 45, targetSpeed: 8 },
    'l9': { timeLimit: 10000, goal: 800, spawnInterval: 400, targetValue: 50, targetSpeed: 9 },
};


interface TargetPracticeState {
    scene: Scene
    screen: Rect
    bullets: PracticeBullet[]
    targets: PracticeTarget[]
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
    missedShots: number
    nextSpawnTime: number 
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

interface PracticeTarget {
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
    hitTime?: number
    update(state: GameState, gameState: TargetPracticeState): void
    render(context: CanvasRenderingContext2D): void
    getHitbox(): Rect
}

interface LevelConfig {
    timeLimit: number;      
    goal: number;         
    spawnInterval: number; 
    targetValue: number;   
    targetSpeed?: number;  
    targetSize?: number;  
    maxTargets?: number;   
}

class CircleTarget implements PracticeTarget {
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

    constructor(x: number, y: number, radius: number, points: number, speed: number = 0, lifetime: number = 3000) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.w = radius * 2;
        this.h = radius * 2;
        this.points = points;
        this.speed = speed;
        this.vx = speed > 0 ? (Math.random() - 0.5) * speed : 0;
        this.vy = speed > 0 ? (Math.random() - 0.5) * speed : 0;
        this.color = points >= 50 ? '#F00' : points >= 30 ? '#FA0' : points >= 20 ? '#FF0' : '#0F0';
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

        // Bounce off walls
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
        if (this.hitTime !== undefined && this.hitTime > 0) {
            // Blink when hit
            context.fillStyle = Math.floor(this.hitTime / 50) % 2 ? '#FFF' : this.color;
        } else {
            const alpha = this.lifetime / this.maxLifetime;
            const r = parseInt(this.color.substring(1, 2), 16) * 17;
            const g = parseInt(this.color.substring(2, 3), 16) * 17;
            const b = parseInt(this.color.substring(3, 4), 16) * 17;
            context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.fill();


        drawARFont(context, this.points.toString(), this.x, this.y, {textAlign: 'center', textBaseline: 'middle'});
    }

    getHitbox(): Rect {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            w: this.radius * 2,
            h: this.radius * 2,
        };
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
        missedShots: 0,
        nextSpawnTime: 0, 
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
    {key: 'l1', levelKey: 'l1', x: 0, y: 0, unlocks: ['l2', 'reset'], label: 'Level 1', description: 'Warmup'},
    {key: 'l2', levelKey: 'l2', x: 0, y: 1, costs: [50], unlocks: ['l3', 'ammo'], label: 'Level 2', description: 'Practice'},
    {key: 'l3', levelKey: 'l3', x: 0, y: 2, costs: [100], unlocks: ['l4'], label: 'Level 3', description: 'Deputy'},
    {key: 'l4', levelKey: 'l4', x: 0, y: 3, costs: [200], unlocks: ['l5', 'time'], label: 'Level 4', description: 'Bandito'},
    {key: 'l5', levelKey: 'l5', x: 0, y: 4, costs: [400], unlocks: ['l6'], label: 'Level 5', description: 'Sheriff'},
    {key: 'l6', levelKey: 'l6', x: 0, y: 5, costs: [800], unlocks: ['l7', 'points'], label: 'Level 6', description: 'Marshall'},
    {key: 'l7', levelKey: 'l7', x: 0, y: 6, costs: [1600], unlocks: ['l8'], label: 'Level 7', description: 'Sharpshooter'},
    {key: 'l8', levelKey: 'l8', x: 0, y: 7, costs: [3200], unlocks: ['l9'], label: 'Level 8', description: 'Legend'},
    {key: 'l9', levelKey: 'l9', x: 0, y: 8, costs: [6400], unlocks: [], label: 'Level 9', description: 'Desperado'},
    {
        key: 'ammo', x: 1, y: 0, costs: [50, 100, 200, 400, 800],
        label: 'Ammo',
        description: 'More shots per round',
    },
    {
        key: 'points', x: 1, y: 4, costs: [200, 400, 800, 1600, 3200],
        label: 'Greed',
        description: 'Score multiplier',
    },
    {
        key: 'time', x: 1, y: 2, costs: [800, 1600, 3200],
        label: 'Time',
        description: 'More time per level',
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
    
    const cursorRect = {
        x: gameState.crosshair.x - 2,
        y: gameState.crosshair.y - 2,
        w: 4,
        h: 4
    };
    
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
        if (boxesIntersect(shopItemRect(gameState, item), cursorRect)) {
            gameState.activeShopItem = item;
        }
    }
}



function updateShop(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    gameState.maxAmmo = baseAmmo + (savedState.unlocks.ammo ?? 0) * 5;
    gameState.ammo = gameState.maxAmmo;
    
    const heroPos = getHeroPosition(state, gameState);
    gameState.crosshair.x = heroPos.x + heroPos.w / 2;
    gameState.crosshair.y = heroPos.y + heroPos.h / 2;
    
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




function spawnTargets(state: GameState, gameState: TargetPracticeState, levelKey: LevelKey) {
    const config = levelConfigs[levelKey];
    const difficulty = parseInt(levelKey.substring(1), 10);
    const radius = config.targetSize ?? Math.max(8, 20 - difficulty * 1.8);
    const points = config.targetValue;
    const speed = config.targetSpeed ?? (difficulty > 2 ? Math.max(3, difficulty - 1) : 0);
    const lifetime = Math.max(500, 4000 - difficulty * 300);
    
    let x = 0;
    let y = 0;
    let attempts = 0;
    
    do {
        x = gameState.screen.x + radius + Math.random() * (gameState.screen.w - 2 * radius);
        y = gameState.screen.y + radius + Math.random() * (gameState.screen.h - 2 * radius);
        attempts++;
    } while (attempts < 10 && gameState.targets.some(t => 
        Math.sqrt((t.x - x) ** 2 + (t.y - y) ** 2) < radius + 15
    ));

    gameState.targets.push(new CircleTarget(x, y, radius, points, speed, lifetime));
}




function startLevel(state: GameState, gameState: TargetPracticeState, levelKey: LevelKey) {
    gameState.scene = 'level';
    gameState.levelKey = levelKey;
    const config = levelConfigs[levelKey];
    const timeUpgrade = (state.savedState.savedArData.gameData.targetPractice.unlocks.time ?? 0) * 5000;
    gameState.maxTime = config.timeLimit + timeUpgrade;
    gameState.timeLeft = gameState.maxTime;
    gameState.goal = config.goal;
    gameState.bullets = [];
    gameState.targets = [];
    gameState.score = 0;
    gameState.reloadTime = 0;
    gameState.lastShotTime = 0;
    gameState.missedShots = 0;
    gameState.nextSpawnTime = 0;
    gameState.crosshair.x = gameState.screen.x + gameState.screen.w / 2;
    gameState.crosshair.y = gameState.screen.y + gameState.screen.h / 2;

    spawnTargets(state, gameState, levelKey);
}






function updateLevel(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    const difficulty = parseInt(gameState.levelKey.substring(1), 10);
    const config = levelConfigs[gameState.levelKey];
    
    const heroPos = getHeroPosition(state, gameState);
    gameState.crosshair.x = heroPos.x + heroPos.w / 2;
    gameState.crosshair.y = heroPos.y + heroPos.h / 2;
    
    // Check for shooting input and target hits
    if (wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
        if (gameState.ammo <= 0) {
            playAreaSound(state, state.areaInstance, 'error');
        } else {
            gameState.ammo--;
            
            let hitTarget = false;
            for (let j = 0; j < gameState.targets.length; j++) {
                const target = gameState.targets[j];
                if (target.hitTime !== undefined) continue;
                
                const dx = gameState.crosshair.x - target.x;
                const dy = gameState.crosshair.y - target.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist <= (target as CircleTarget).radius) {
                    const points = target.points * (1 + (savedState.unlocks.points ?? 0));
                    gameState.score += points;
                    target.hitTime = 300;
                    hitTarget = true;
                    
                    playAreaSound(state, state.areaInstance, 'secretChime');
                    
                    setTimeout(() => {
                        const index = gameState.targets.indexOf(target);
                        if (index >= 0) {
                            gameState.targets.splice(index, 1);
                        }
                    }, 300);
                    break;
                }
            }
        
            if (!hitTarget) {
                gameState.missedShots++;
                playAreaSound(state, state.areaInstance, 'action');
            }
        }
    }
    for (let i = 0; i < gameState.targets.length; i++) {
        const target = gameState.targets[i];
        target.update(state, gameState);

        if (target.lifetime <= 0 && target.hitTime === undefined) {
            gameState.targets.splice(i--, 1);
        }
    }
    
    if (gameState.nextSpawnTime > 0) {
        gameState.nextSpawnTime -= FRAME_LENGTH;
    }
    
    const maxTargets = config.maxTargets ?? Math.min(1 + Math.floor(difficulty / 2), 4);
    const activeTargets = gameState.targets.filter(t => t.hitTime === undefined).length;
    
    if (activeTargets < maxTargets && gameState.nextSpawnTime <= 0) {
        spawnTargets(state, gameState, gameState.levelKey);
        gameState.nextSpawnTime = config.spawnInterval;
    }
    
    gameState.timeLeft -= FRAME_LENGTH;

    if (gameState.timeLeft <= 0) {
        gameState.scene = 'results';
    } else if (gameState.goal > 0 && gameState.score >= gameState.goal) {
        gameState.scene = 'results';
    } else if (gameState.ammo <= 0 && gameState.goal > 0 && gameState.score < gameState.goal) {
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
    drawFrame(context, ArCrosshairIcon, {
        ...ArCrosshairIcon,
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

        let multiplier = 1;
        if (gameState.missedShots === 0) {
            multiplier = 3;
        } else if (gameState.missedShots <= 2) {
            multiplier = 2;
        }
        
        const earnedPoints = gameState.score * multiplier;
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
    
    let multiplier = 1;
    let multiplierText = '';
    if (gameState.missedShots === 0) {
        multiplier = 3;
        multiplierText = 'PERFECT! x3';
    } else if (gameState.missedShots <= 2) {
        multiplier = 2;
        multiplierText = 'GREAT! x2';
    } else {
        multiplierText = 'x1';
    }
    
    drawARFont(context, 'MISSED: ' + gameState.missedShots, centerX, y + 40, {textAlign: 'center', textBaseline: 'top'});
    drawARFont(context, multiplierText, centerX, y + 55, {textAlign: 'center', textBaseline: 'top'});
    
    if (gameState.goal > 0) {
        const goalMet = gameState.score >= gameState.goal;
        const outOfAmmo = gameState.ammo <= 0;
        
        let statusText = '';
        let statusColor = '';
        
        if (goalMet) {
            statusText = 'SUCCESS!';
            statusColor = '#0F0';
        } else if (outOfAmmo) {
            statusText = 'OUT OF AMMO!';
            statusColor = '#F00';
        } else {
            statusText = 'TIME IS UP!';
            statusColor = '#FA0';
        }
        
        context.fillStyle = statusColor;
        drawARFont(context, statusText, centerX, y + 70, {textAlign: 'center', textBaseline: 'top'});
        context.fillStyle = '#FFF';
    }
    
    const earnedPoints = gameState.score * multiplier;
    drawARFont(context, 'POINTS: +' + earnedPoints, centerX, y + 85, {textAlign: 'center', textBaseline: 'top'});

    const currentRecord = savedState.records[gameState.levelKey] ?? 0;
    if (gameState.score > currentRecord) {
        drawARFont(context, 'NEW RECORD!', centerX, y + 100, {textAlign: 'center', textBaseline: 'top'});
    } else if (currentRecord > 0) {
        drawARFont(context, 'RECORD: ' + currentRecord, centerX, y + 100, {textAlign: 'center', textBaseline: 'top'});
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
    }
}


export const targetPracticeGame: ARGame = {
    start: startTargetPractice,
    update: updateTargetPractice,
    render: renderTargetPractice,
    renderHUD: renderTargetPracticeHUD,
};