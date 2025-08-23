import {CANVAS_HEIGHT, CANVAS_WIDTH, FRAME_LENGTH, GAME_KEY} from 'app/gameConstants';
import {heroArIcon} from 'app/render/heroAnimations';
import {drawFrame} from 'app/utils/animations';
import {boxesIntersect, pad} from 'app/utils/index';
import {drawARFont} from 'app/arGames/arFont';
import {playAreaSound} from 'app/musicController';
import {wasGameKeyPressed, getMovementDeltas} from 'app/userInput';
import {saveGame} from 'app/utils/saveGame';
import {typedKeys} from 'app/utils/types';

type LevelKey = 'none' | 'l1' | 'l2' | 'l3' | 'l4' | 'l5' | 'l6' | 'l7' | 'l8' | 'l9' | 'endless';
type UnlockKey = LevelKey | 'ammo' | 'speed' | 'reload' | 'points' | 'time' | 'multishot' | 'pierce' | 'reset';
type Scene = 'shop' | 'level' | 'results' | 'reset';

const baseAmmo = 10;
const baseShotSpeed = 6;

interface TargetType {
    points: number;
    radius: number;
    speed: number;
    lifetime: number;
    color?: string;
    weight: number; 
    type: 'standard' | 'circling' | 'armored' | 'alternating' | 'explosive' | 'ammo' | 'time';
    maxHits?: number;
    alternatePoints?: number;
    altColor?: string;
    switchInterval?: number;
    explosionRadius?: number;
    bonusAmount?: number;
}

interface LevelConfig {
    timeLimit: number;
    goal: number;
    spawnInterval: number;
    maxTargets: number;
    targetTypes: TargetType[];
    escalation?: boolean;
}

const levelConfigs: {[key in LevelKey]: LevelConfig} = {
    'none': { timeLimit: 0, goal: 0, spawnInterval: 0, maxTargets: 1, targetTypes: [] },
    'l1': { 
        timeLimit: 30000, 
        goal: 210, 
        spawnInterval: 1000,
        maxTargets: 2,
        targetTypes: [
            { points: 30, radius: 11, speed: 4, lifetime: 6000, color: '#0C0', weight: 3, type: 'standard' },
        ]
    },
    'l2': { 
        timeLimit: 30000, 
        goal: 150, 
        spawnInterval: 800, 
        maxTargets: 2,
        targetTypes: [
            { points: 30, alternatePoints: -10, radius: 15, speed: 4.5, lifetime: 8000, weight: 5, type: 'alternating', switchInterval: 1000},
        ]
    },
    'l3': { 
        timeLimit: 25000, 
        goal: 200, 
        spawnInterval: 1000, 
        maxTargets: 2,
        targetTypes: [
            { points: 25, radius: 10, speed: 5, lifetime: 8000, color: '#0C0', weight: 4, type: 'circling' },
            { points: 40, radius: 15, speed: 6.5, lifetime: 12000, color: '#888', weight: 6, type: 'armored', maxHits: 2 },
        ]
    },
    'l4': { 
        timeLimit: 12000, 
        goal: 150, 
        spawnInterval: 500, 
        maxTargets: 3,
        targetTypes: [
            { points: 10, radius: 14, speed: 6, lifetime: 6000, color: '#0C0', weight: 4, type: 'standard' },
            { points: 0, radius: 12, speed: 5, lifetime: 6000, color: '#00F', weight: 2, type: 'ammo', bonusAmount: 4 },
            { points: 0, radius: 12, speed: 5, lifetime: 6000, color: '#F0F', weight: 1, type: 'time', bonusAmount: 4000 }
        ]
    },
    'l5': { 
        timeLimit: 28000, 
        goal: 210, 
        spawnInterval: 1000, 
        maxTargets: 4,
        targetTypes: [
            { points: 40, alternatePoints: -40, radius: 8, speed: 6.5, lifetime: 8000, weight: 5, type: 'alternating', switchInterval: 800},
            { points: 25, radius: 12, speed: 7, lifetime: 6000, color: '#0C0', weight: 3, type: 'standard' },
            { points: 90, radius: 10, speed: 9, lifetime: 12000, color: '#888', weight: 6, type: 'armored', maxHits: 3 },
        ]
    },
    'l6': { 
        timeLimit: 20000, 
        goal: 500, 
        spawnInterval: 800, 
        maxTargets: 4,
        targetTypes: [
           { points: 50, alternatePoints: -50, radius: 9, speed: 8, lifetime: 8000, weight: 5, type: 'alternating', switchInterval: 800},
           { points: 0, radius: 11, speed: 7, lifetime: 6000, color: '#00F', weight: 3, type: 'ammo', bonusAmount: 4 },
           { points: 0, radius: 11, speed: 7, lifetime: 6000, color: '#F0F', weight: 3, type: 'time', bonusAmount: 4000 }
        ]
    },
    'l7': { 
        timeLimit: 35000, 
        goal: 300, 
        spawnInterval: 500, 
        maxTargets: 4,
        targetTypes: [
           { points: 25, radius: 8, speed: 11, lifetime: 6000, color: '#0C0', weight: 6, type: 'standard' },
           { points: 0, radius: 8, speed: 7, lifetime: 10000, color: '#F80', weight: 3, type: 'explosive', explosionRadius: 80 },
        ]
    },
    'l8': { 
        timeLimit: 50000, 
        goal: 350, 
        spawnInterval: 500, 
        maxTargets: 4,
        targetTypes: [
            { points: 25, radius: 6, speed: 8, lifetime: 6000, color: '#0C0', weight: 3, type: 'standard' },
            { points: 25, radius: 12, speed: 10, lifetime: 6000, color: '#0C0', weight: 3, type: 'standard' },
            { points: 50, alternatePoints: -50, radius: 10, speed: 8, lifetime: 7000, weight: 2, type: 'alternating', switchInterval: 800}
        ]
    },
    'l9': { 
        timeLimit: 30000, 
        goal: 700, 
        spawnInterval: 600, 
        maxTargets: 4,
        targetTypes: [
           { points: 25, radius: 10, speed: 8, lifetime: 6000, color: '#0C0', weight: 4, type: 'standard' },
           { points: 0, radius: 9, speed: 8, lifetime: 6000, color: '#00F', weight: 2, type: 'ammo', bonusAmount: 4 },
           { points: 0, radius: 9, speed: 8, lifetime: 6000, color: '#F0F', weight: 2, type: 'time', bonusAmount: 5000 }
        ]
    },
    'endless': { 
        timeLimit: 25000, 
        goal: 250, 
        spawnInterval: 500, 
        maxTargets: 4,
        targetTypes: [
            { points: 25, radius: 20, speed: 4, lifetime: 6000, color: '#0C0', weight: 3, type: 'standard' },
            { points: 50, alternatePoints: -50, radius: 20, speed: 4.5, lifetime: 7000, weight: 3, type: 'alternating', switchInterval: 800},
            { points: 20, radius: 20, speed: 5, lifetime: 8000, color: '#0C0', weight: 4, type: 'circling' },
            { points: 0, radius: 20, speed: 4, lifetime: 6000, color: '#00F', weight: 2, type: 'ammo', bonusAmount: 4 },
            { points: 0, radius: 20, speed: 4, lifetime: 6000, color: '#F0F', weight: 2, type: 'time', bonusAmount: 5000 }
        ], escalation: true,
    }, 
};



interface TargetPracticeState {
    scene: Scene
    screen: Rect
    bullets: PlayerBullet[]
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
    completionTime?: number
    lastShotTime: number
    nextSpawnTime: number
    spawnInterval: number
    maxTargets: number
    shotsFired: number
    shotsHit: number
    levelTime: number 
    playerStart: {x: number, y: number}
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
    radius?: number
    update(state: GameState, gameState: TargetPracticeState): void
    render(context: CanvasRenderingContext2D): void
    getHitbox(): Rect
    onHit?(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState): void
}

interface TargetType {
    points: number;
    radius: number;
    speed: number;
    lifetime: number;
    color?: string;
    weight: number;
}

interface LevelConfig {
    timeLimit: number;
    goal: number;
    spawnInterval: number;
    maxTargets: number;
    targetTypes: TargetType[];
}

function lineCircleIntersection(
    x1: number, y1: number,  
    x2: number, y2: number, 
    cx: number, cy: number, 
    radius: number
): boolean {
    const dx = cx - x1;
    const dy = cy - y1;

    const lx = x2 - x1;
    const ly = y2 - y1;
    
    const lengthSq = lx * lx + ly * ly;
    
    if (lengthSq === 0) {
        return Math.sqrt(dx * dx + dy * dy) <= radius;
    }
    
    const t = Math.max(0, Math.min(1, (dx * lx + dy * ly) / lengthSq));
    
    const closestX = x1 + t * lx;
    const closestY = y1 + t * ly;
    
    const distSq = (cx - closestX) * (cx - closestX) + (cy - closestY) * (cy - closestY);
    
    return distSq <= radius * radius;
}

class PlayerBullet implements PracticeBullet {
    x: number;
    y: number;
    vx: number;
    vy: number;
    piercing = false;
    done = false;
    prevX: number; 
    prevY: number;

    constructor() {
        this.prevX = 0;
        this.prevY = 0;
    }

    update(state: GameState, gameState: TargetPracticeState) {
        this.prevX = this.x;
        this.prevY = this.y;
        
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
    maxHits: number; 
    currentHits: number; 
    altColor: string;

    constructor(x: number, y: number, radius: number, points: number, speed: number = 0, lifetime: number = 10000, customColor?: string, maxHits: number = 1) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.w = radius * 2;
        this.h = radius * 2;
        this.points = points;
        this.speed = speed;
        this.vx = speed > 0 ? (Math.random() - 0.5) * speed : 0;
        this.vy = speed > 0 ? (Math.random() - 0.5) * speed : 0;
        this.color = customColor || (points >= 50 ? '#F00' : points >= 30 ? '#FA0' : points >= 20 ? '#FF0' : '#0C0');
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.maxHits = maxHits; 
        this.currentHits = 0; 
    }

    update(state: GameState, gameState: TargetPracticeState) {
        if (this.hitTime !== undefined) {
            this.hitTime -= FRAME_LENGTH;
            return;
        }

        this.lifetime -= FRAME_LENGTH;

        this.x += this.vx;
        this.y += this.vy;

        
        const maxY = gameState.screen.y + gameState.screen.h * 0.8;


        if (this.x - this.radius <= gameState.screen.x || this.x + this.radius >= gameState.screen.x + gameState.screen.w) {
            this.vx = -this.vx;
            this.x = Math.max(gameState.screen.x + this.radius, Math.min(gameState.screen.x + gameState.screen.w - this.radius, this.x));
        }
        if (this.y - this.radius <= gameState.screen.y || this.y + this.radius >= maxY) {
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

        if (this.maxHits > 1) {
            const remainingHits = this.maxHits - this.currentHits - 1;
            context.strokeStyle = '#FFF';
            context.lineWidth = 1;
            for (let i = 1; i <= remainingHits; i++) {
                context.beginPath();
                context.arc(this.x, this.y, this.radius - (i * 2), 0, 2 * Math.PI);
                context.stroke();
            }
        }
        
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

    onHit(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState): void {
        if (this.hitTime !== undefined) return;
        this.currentHits++;
        gameState.shotsHit++;

        if (this.currentHits >= this.maxHits) {
            gameState.score = Math.max(gameState.score + this.points, 0);
            this.hitTime = 300;
            playAreaSound(state, state.areaInstance, 'secretChime');
        }
        
        else {
            playAreaSound(state, state.areaInstance, 'rockShatter')
        }
    }
}

class CirclingTarget extends StandardTarget {
    centerX: number;
    centerY: number;
    orbitRadius: number;
    angle: number;
    angularSpeed: number;

    constructor(x: number, y: number, radius: number, points: number, speed: number, lifetime: number) {
        super(x, y, radius, points, 0, lifetime);
        this.centerX = x;
        this.centerY = y;
        this.orbitRadius = 20 + Math.random() * 30; 
        this.angle = Math.random() * Math.PI * 2; 
        this.angularSpeed = (speed * 0.02) * (Math.random() > 0.5 ? 1 : -1); 
        this.color = '#0FF'; 
    }

    update(state: GameState, gameState: TargetPracticeState) {
        if (this.hitTime !== undefined) {
            this.hitTime -= FRAME_LENGTH;
            return;
        }

        this.lifetime -= FRAME_LENGTH;
        
        this.angle += this.angularSpeed;
        
        this.x = this.centerX + Math.cos(this.angle) * this.orbitRadius;
        this.y = this.centerY + Math.sin(this.angle) * this.orbitRadius;
        
        if (this.centerX - this.orbitRadius <= gameState.screen.x || 
            this.centerX + this.orbitRadius >= gameState.screen.x + gameState.screen.w) {
            this.centerX = Math.max(gameState.screen.x + this.orbitRadius, 
                                  Math.min(gameState.screen.x + gameState.screen.w - this.orbitRadius, this.centerX));
        }
        if (this.centerY - this.orbitRadius <= gameState.screen.y || 
            this.centerY + this.orbitRadius >= gameState.screen.y + gameState.screen.h) {
            this.centerY = Math.max(gameState.screen.y + this.orbitRadius, 
                                  Math.min(gameState.screen.y + gameState.screen.h - this.orbitRadius, this.centerY));
        }
    }
}


class AlternatingTarget extends StandardTarget {
    alternatePoints: number;
    switchInterval: number;
    currentPoints: number;
    switchTimer: number;
    isAlternate: boolean;

    constructor(x: number, y: number, radius: number, points: number, alternatePoints: number, speed: number, lifetime: number, switchInterval: number = 2000, customColor: string = '#FF69B4', altColor: string = '#000000') {
        super(x, y, radius, points, speed, lifetime);
        this.alternatePoints = alternatePoints;
        this.switchInterval = switchInterval;
        this.currentPoints = points;
        this.switchTimer = switchInterval;
        this.isAlternate = false;
        this.color = customColor;
        this.altColor = altColor;
    }

    update(state: GameState, gameState: TargetPracticeState) {
        super.update(state, gameState);
        
        if (this.hitTime !== undefined) return;

        this.switchTimer -= FRAME_LENGTH;
        if (this.switchTimer <= 0) {
            this.isAlternate = !this.isAlternate;
            this.currentPoints = this.isAlternate ? this.alternatePoints : this.points;
            this.switchTimer = this.switchInterval;
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
        
        // Pulse effect when alternating
        if (this.switchTimer < 200) {
            alpha *= 0.5 + 0.5 * Math.sin(this.switchTimer * Math.PI / 100);
        }
        
        context.save();
        context.globalAlpha = alpha;
        
        if (this.isAlternate) {
            context.fillStyle = this.altColor;
        } else {
            context.fillStyle = fillColor;
        }
        
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.fill();
        
        context.fillStyle = '#000';
        const pointsText = this.currentPoints >= 0 ? this.currentPoints.toString() : `-${Math.abs(this.currentPoints)}`;
        drawARFont(context, pointsText, this.x, this.y, {textAlign: 'center', textBaseline: 'middle'});
        context.restore();
    }


    onHit(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState): void {
        if (this.hitTime !== undefined) return;
        gameState.score = Math.max(gameState.score + this.currentPoints, 0);
        gameState.shotsHit++;
        this.hitTime = 300;
        
       if (this.currentPoints > 0) {
            playAreaSound(state, state.areaInstance, 'hitShot');
        }
        else {
            playAreaSound(state, state.areaInstance, 'error')
        }
    }
}

class BonusTarget extends StandardTarget {
    bonusType: 'ammo' | 'time';
    bonusAmount: number;

    constructor(x: number, y: number, radius: number, speed: number, lifetime: number, bonusType: 'ammo' | 'time', bonusAmount: number) {
        super(x, y, radius, 0, speed, lifetime); 
        this.bonusType = bonusType;
        this.bonusAmount = bonusAmount;
        this.color = bonusType === 'ammo' ? '#00F' : '#F0F'; 
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
        
        context.fillStyle = '#FFF';
        const symbol = this.bonusType === 'ammo' ? 'A' : 'T';
        drawARFont(context, symbol, this.x, this.y, {textAlign: 'center', textBaseline: 'middle'});
        context.restore();
    }

    onHit(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState): void {
        if (this.hitTime !== undefined) return;
        if (this.bonusType == 'ammo') {
            gameState.ammo = Math.min(gameState.maxAmmo, gameState.ammo + this.bonusAmount);
        } else if (this.bonusType == 'time') {
            gameState.timeLeft = Math.min(this.bonusAmount + gameState.timeLeft, gameState.maxTime);
        }
        gameState.shotsHit++;
        this.hitTime = 300;
        
        playAreaSound(state, state.areaInstance, 'secretChime');
    }
} 

class ExplosiveTarget extends StandardTarget {
    explosionRadius: number;

    constructor(x: number, y: number, radius: number, points: number, speed: number, lifetime: number, explosionRadius: number = 30) {
        super(x, y, radius, points, speed, lifetime);
        this.explosionRadius = explosionRadius;
        this.color = '#F80';
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
        drawARFont(context, 'X', this.x, this.y, {textAlign: 'center', textBaseline: 'middle'});
        context.restore();
    }

    onHit(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState): void {
        if (this.hitTime !== undefined) return;
        const explosionPoints = handleExplosion(gameState, savedState, this);
        gameState.score += explosionPoints;
        playAreaSound(state, state.areaInstance, 'bossDeath');
        gameState.shotsHit++;
        this.hitTime = 300;
    }
}


function handleExplosion(gameState: TargetPracticeState, savedState: TargetPracticeSavedState, explosiveTarget: ExplosiveTarget): number {
    let bonusPoints = 0;
    const targetsToRemove: number[] = [];
    
    for (let i = 0; i < gameState.targets.length; i++) {
        const target = gameState.targets[i];
        if (target === explosiveTarget || target.hitTime !== undefined) continue;
        
        const dx = target.x - explosiveTarget.x;
        const dy = target.y - explosiveTarget.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= explosiveTarget.explosionRadius) {
            const points = target.points * (1 + (savedState.unlocks.points ?? 0));
            bonusPoints += points;
            target.hitTime = 300; 
            targetsToRemove.push(i);
        }
    }
    
    return bonusPoints;
}

function getEscalationMultiplier(gameState: TargetPracticeState): { speedMultiplier: number, sizeMultiplier: number } {
    const config = levelConfigs[gameState.levelKey];
    if (!config.escalation) {
        return { speedMultiplier: 1, sizeMultiplier: 1 };
    }
    
    let progressRatio = gameState.levelTime / 40000;
    const speedMultiplier = Math.min(1 + progressRatio * 1.0, 5);
    const sizeMultiplier = Math.max(1 - progressRatio * 0.4, 0.2);
    
    return { speedMultiplier, sizeMultiplier };
}


function getNewTargetPracticeState(state: GameState): TargetPracticeState {
    const heroHitbox = state.hero.getMovementHitbox();
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
        crosshair: {x: state.hero.x, y: state.hero.y},
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
        levelTime: 0,
        playerStart: { 
            x: heroHitbox.x + heroHitbox.w / 2 - 8,
            y: heroHitbox.y + heroHitbox.h / 2 - 8
        }
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
    {key: 'l9', levelKey: 'l9', x: 0, y: 8, costs: [6400], unlocks: ['pierce', 'endless'], label: 'Level 9', description: 'Desperado'},
    {key: 'endless', levelKey: 'endless', x: 2, y: 0, costs: [12800], label: 'Endless', description: 'Survive as long as possible!'},
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
        key: 'multishot', x: 1, y: 6, costs: [1600, 3200, 6400, 11],
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
    gameState.maxAmmo = baseAmmo + (savedState.unlocks.ammo ?? 0) * 2;
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

//WIP: Allow specific target to be summoned without needing randomization using optional input
function spawnSingleTarget(state: GameState, gameState: TargetPracticeState, levelKey: LevelKey, /*targetType?: string*/) {
    const config = levelConfigs[levelKey];
    const { speedMultiplier, sizeMultiplier } = getEscalationMultiplier(gameState);
    
    const totalWeight = config.targetTypes.reduce((sum, type) => sum + type.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedType = config.targetTypes[0];
    
    
    for (const targetType of config.targetTypes) {
        random -= targetType.weight;
        if (random <= 0) {
            selectedType = targetType;
            break;
        }
    }
    
    const adjustedRadius = Math.max(1, selectedType.radius * sizeMultiplier);
    const adjustedSpeed = selectedType.speed * speedMultiplier;
    
    let x = 0;
    let y = 0;
    const spawnHeight = gameState.screen.h * 0.8;
    
    let attempts = 0;
    do {
        x = gameState.screen.x + selectedType.radius + Math.random() * (gameState.screen.w - 2 * selectedType.radius);
        y = gameState.screen.y + selectedType.radius + Math.random() * (spawnHeight - 2 * selectedType.radius);
        attempts++;
    } while (attempts < 20 && gameState.targets.some(t => 
        Math.sqrt((t.x - x) ** 2 + (t.y - y) ** 2) < selectedType.radius + t.radius + 5
    ));
    
    let newTarget: Target;
    switch (selectedType.type) {
        case 'circling':
            newTarget = new CirclingTarget(x, y, adjustedRadius, selectedType.points, adjustedSpeed, selectedType.lifetime);
            break;
        case 'explosive':
            newTarget = new ExplosiveTarget(x, y, adjustedRadius, selectedType.points, adjustedSpeed, selectedType.lifetime, selectedType.explosionRadius || 30);
            break;
        case 'alternating':
            newTarget = new AlternatingTarget(
                x, y, adjustedRadius, selectedType.points, selectedType.alternatePoints || selectedType.points * 2, adjustedSpeed, selectedType.lifetime,selectedType.switchInterval || 2000 
            );
            break;
        case 'armored':
            newTarget = new StandardTarget(x, y, adjustedRadius, selectedType.points, adjustedSpeed, selectedType.lifetime, selectedType.color, selectedType.maxHits || 3);
            break;
        case 'ammo':
            newTarget = new BonusTarget(x, y, adjustedRadius, adjustedSpeed, selectedType.lifetime, 'ammo', selectedType.bonusAmount || 3);
            break;
        case 'time':
            newTarget = new BonusTarget(x, y, adjustedRadius, adjustedSpeed, selectedType.lifetime, 'time', selectedType.bonusAmount || 5000);
            break;
        case 'standard':
        default:
            newTarget = new StandardTarget(x, y, adjustedRadius, selectedType.points, adjustedSpeed, selectedType.lifetime);
            break;
    }
    
    gameState.targets.push(newTarget);
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
    gameState.shotsFired = 0;
    gameState.shotsHit = 0;
    gameState.levelTime = 0;
    
    const heroPos = getHeroPosition(state, gameState, true);
    gameState.crosshair.x = heroPos.x;
    gameState.crosshair.y = heroPos.y;
}

function fireBullet(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    if (gameState.ammo <= 0 || gameState.reloadTime > 0) return;
    
    const heroPos = getHeroPosition(state, gameState, true);
    const heroX = heroPos.x + heroPos.w / 2;
    const heroY = heroPos.y + heroPos.h / 2;
    
    const speed = baseShotSpeed + (savedState.unlocks.speed ?? 0) * 2;
    const multishot = savedState.unlocks.multishot ?? 0;
    const bullets = Math.max(1, multishot + 1);
    
    const baseAngle = -Math.PI / 2;
    const maxSpread = 0.4; 

    const centerIndex = Math.floor(bullets / 2);
    for (let i = 0; i < bullets; i++) {
        const bullet = new PlayerBullet();
        bullet.x = heroX;
        bullet.y = heroY;
        bullet.prevX = heroX;
        bullet.prevY = heroY;
        bullet.piercing = (savedState.unlocks.pierce ?? 0) > 0;

        let angle: number;
        if (i === centerIndex) {
            // Always one bullet straight up
            angle = baseAngle;
        } else {
            const spreadStep = maxSpread / (bullets - 1);
            angle = baseAngle + (i - centerIndex) * spreadStep;
        }

        bullet.vx = speed * Math.cos(angle);
        bullet.vy = speed * Math.sin(angle);
        gameState.bullets.push(bullet);
    }

    
    gameState.ammo--;
    gameState.shotsFired++;
    gameState.reloadTime = Math.max(100, 300 - (savedState.unlocks.reload ?? 0) * 50);
    gameState.lastShotTime = 200;
    
    playAreaSound(state, state.areaInstance, 'error');
}

function handleTargetCollisions(gameState: TargetPracticeState) {
    for (let i = 0; i < gameState.targets.length; i++) {
        const target1 = gameState.targets[i];
        if (target1.hitTime !== undefined) continue;
       
        for (let j = i + 1; j < gameState.targets.length; j++) {
            const target2 = gameState.targets[j];
            if (target2.hitTime !== undefined) continue;
           
            const dx = target2.x - target1.x;
            const dy = target2.y - target1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = target1.radius + target2.radius;
           
            if (distance < minDistance && distance > 0 ) {
                if (target1 instanceof StandardTarget && !(target1 instanceof CirclingTarget) &&
                    target2 instanceof StandardTarget && !(target2 instanceof CirclingTarget)) {
                    const nx = dx / distance;
                    const ny = dy / distance;
                   
                    const overlap = minDistance - distance;
                    const separationX = (overlap * nx) / 2;
                    const separationY = (overlap * ny) / 2;
                   
                    target1.x -= separationX;
                    target1.y -= separationY;
                    target2.x += separationX;
                    target2.y += separationY;
                   
                    const speed1 = Math.sqrt(target1.vx * target1.vx + target1.vy * target1.vy);
                    const speed2 = Math.sqrt(target2.vx * target2.vx + target2.vy * target2.vy);
                   
                    const relativeVx = target2.vx - target1.vx;
                    const relativeVy = target2.vy - target1.vy;
                    const velocityAlongNormal = relativeVx * nx + relativeVy * ny;
                   
                    if (velocityAlongNormal <= 0) {
                        const impulse = velocityAlongNormal;
                        target1.vx += impulse * nx;
                        target1.vy += impulse * ny;
                        target2.vx -= impulse * nx;
                        target2.vy -= impulse * ny;
                        
                        const newSpeed1 = Math.sqrt(target1.vx * target1.vx + target1.vy * target1.vy);
                        const newSpeed2 = Math.sqrt(target2.vx * target2.vx + target2.vy * target2.vy);
                        
                        if (newSpeed1 > 0) {
                            target1.vx = (target1.vx / newSpeed1) * speed1;
                            target1.vy = (target1.vy / newSpeed1) * speed1;
                        }
                        
                        if (newSpeed2 > 0) {
                            target2.vx = (target2.vx / newSpeed2) * speed2;
                            target2.vy = (target2.vy / newSpeed2) * speed2;
                        }
                    }
                }
            }
        }
    }
}

function updateLevel(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState) {
    gameState.levelTime += FRAME_LENGTH;

    getHeroPosition(state, gameState, true);
    
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
            
            const targetRadius = target.radius;
            const hit = lineCircleIntersection(
                bullet.prevX, bullet.prevY, 
                bullet.x, bullet.y,         
                target.x, target.y,         
                targetRadius                
            );
            
            if (hit) {
                target.onHit(state, gameState, savedState);
                
                if (!bullet.piercing) {
                    bullet.done = true;
                }
                break;
            }
        }
        
        if (bullet.done) {
            gameState.bullets.splice(i--, 1);
        }
    }
    
    for (let i = 0; i < gameState.targets.length; i++) {
        const target = gameState.targets[i];
        target.update(state, gameState);
    }
    
    handleTargetCollisions(gameState);

    for (let i = 0; i < gameState.targets.length; i++) {
        const target = gameState.targets[i] as StandardTarget;
        if (target.shouldRemove() || (target.hitTime !== undefined && target.hitTime <= 0)) {
            gameState.targets.splice(i--, 1);
        }
    }
    
    gameState.timeLeft -= FRAME_LENGTH;

    if (gameState.timeLeft <= 0 || (gameState.ammo <= 0 && gameState.bullets.length === 0)) {
        gameState.scene = 'results';
    } else if (gameState.goal > 0 && gameState.score >= gameState.goal) {
        gameState.completionTime = gameState.maxTime - gameState.timeLeft;
        gameState.scene = 'results';
    }
}

function updateTargetPractice(state: GameState) {
    const gameState = state.arState.game;
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

function getHeroPosition(state: GameState, gameState: TargetPracticeState, restrictMovement: boolean = false): Rect {
    const cursorSpeed = 1.5;
    const [dx, dy] = getMovementDeltas(state, true);
    const cursorSize = 16;

    let minY = gameState.screen.y;
    let maxY = gameState.screen.y + gameState.screen.h - cursorSize;

    if (restrictMovement) {
        const restrictedAreaTop = gameState.screen.y + (gameState.screen.h * 0.75);
        const restrictedAreaHeight = gameState.screen.h * 0.25;
        minY = restrictedAreaTop;
        maxY = restrictedAreaTop + restrictedAreaHeight - cursorSize;
    }

    let diagMultiplier = (dx !== 0 && dy !== 0) ? 0.7 : 1;

    gameState.crosshair.x = Math.max(
        gameState.screen.x + cursorSize / 2,
        Math.min(
            gameState.screen.x + gameState.screen.w - cursorSize / 2,
            gameState.crosshair.x + cursorSpeed * dx * diagMultiplier
        )
    );

    gameState.crosshair.y = Math.max(
        minY + cursorSize / 2,
        Math.min(
            maxY + cursorSize / 2,
            gameState.crosshair.y + cursorSpeed * dy * diagMultiplier
        )
    );

    return {
        x: gameState.crosshair.x - cursorSize / 2,
        y: gameState.crosshair.y - cursorSize / 2,
        w: cursorSize,
        h: cursorSize,
    };
}




function renderHero(context: CanvasRenderingContext2D, state: GameState, gameState: TargetPracticeState) {
    const isInLevel = gameState.scene === 'level';
    const {x, y} = getHeroPosition(state, gameState, isInLevel);
    drawFrame(context, heroArIcon, {
        ...heroArIcon,
        x: (x) | 0,
        y: (y) | 0,
    });
}


function renderTargetPractice(context: CanvasRenderingContext2D, state: GameState) {
    const gameState = state.arState.game;
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
        context.save();
        context.beginPath();
        context.rect(gameState.screen.x, gameState.screen.y, gameState.screen.w, gameState.screen.h);
        context.clip();
        
        for (const target of gameState.targets) {
            target.render(context);
        }

        for (const bullet of gameState.bullets) {
            bullet.render(context);
        }
        
        context.restore(); 
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
    getHeroPosition(state, gameState);

    if (wasGameKeyPressed(state, GAME_KEY.PASSIVE_TOOL)) {
        let earnedPoints = 0;
        
        if (gameState.levelKey === 'endless') {
            const survivalTime = gameState.completionTime ?? 0;
            earnedPoints = Math.floor(survivalTime / 10);
        
            const accuracy = Math.min(gameState.shotsFired > 0 ? gameState.shotsHit / gameState.shotsFired : 1, 1);
            if (accuracy >= 0.9) earnedPoints *= 2;
            else if (accuracy >= 0.75) earnedPoints *= 1.5;
        } else {
            earnedPoints = gameState.score;
            const missedShots = gameState.shotsFired - gameState.shotsHit;
            
            if (missedShots === 0) {
                earnedPoints *= 3;
            } else if (missedShots <= 2) {
                earnedPoints *= 2;
            }
        }
        
        savedState.points += earnedPoints * (1 + (savedState.unlocks.points ?? 0));;
        
        // WIP: Want to save fastest time for normal levels, high score for endless
        if (gameState.completionTime !== undefined) {
            const currentRecord = savedState.records[gameState.levelKey] ?? (gameState.levelKey === 'endless' ? 0 : Infinity);
            
            if (gameState.levelKey === 'endless') {
                if (gameState.completionTime > currentRecord) {
                    savedState.records[gameState.levelKey] = gameState.completionTime;
                }
            } else {
                if (gameState.completionTime < currentRecord) {
                    savedState.records[gameState.levelKey] = gameState.completionTime;
                }
            }
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
    
    if (gameState.levelKey === 'endless') {
        const survivalTime = gameState.completionTime ?? 0;
        drawARFont(context, 'SURVIVED: ' + (survivalTime / 1000).toFixed(1) + 's', centerX, y + 25, {textAlign: 'center', textBaseline: 'top'});
        drawARFont(context, 'TARGETS HIT: ' + gameState.score, centerX, y + 40, {textAlign: 'center', textBaseline: 'top'});
    } else {
        drawARFont(context, 'SCORE: ' + gameState.score, centerX, y + 25, {textAlign: 'center', textBaseline: 'top'});
    }
    
    const accuracy = gameState.shotsFired > 0 ? Math.round((gameState.shotsHit / gameState.shotsFired) * 100) : 100;
    const missedShots = gameState.shotsFired - gameState.shotsHit;
    drawARFont(context, `ACCURACY: ${accuracy}% (${gameState.shotsHit}/${gameState.shotsFired})`, centerX, y + 55, {textAlign: 'center', textBaseline: 'top'});
    
    if (gameState.goal > 0 && gameState.levelKey !== 'endless') {
        const success = gameState.score >= gameState.goal;
        const statusText = success ? 'SUCCESS!' : 'FAILED';
        const statusColor = success ? '#0F0' : '#F00';
        
        context.fillStyle = statusColor;
        drawARFont(context, statusText, centerX, y + 70, {textAlign: 'center', textBaseline: 'top'});
        context.fillStyle = '#FFF';
        
        if (success && gameState.completionTime !== undefined) {
            const timeText = (gameState.completionTime / 1000).toFixed(1) + 's';
            drawARFont(context, 'TIME: ' + timeText, centerX, y + 85, {textAlign: 'center', textBaseline: 'top'});
        }
    }
    
    let earnedPoints = 0;
    let bonusText = '';
    
    if (gameState.levelKey === 'endless') {
        const survivalTime = gameState.completionTime ?? 0;
        earnedPoints = Math.floor(survivalTime / 100);
        
        if (accuracy >= 90) {
            earnedPoints *= 2;
            bonusText = ' (PRECISE x2!)';
        } else if (accuracy >= 75) {
            earnedPoints *= 1.5;
            bonusText = ' (ACCURATE x1.5!)';
        }
    } else {
        earnedPoints = gameState.score;
        
        if (missedShots === 0) {
            earnedPoints *= 3;
            bonusText = ' (PERFECT x3!)';
        } else if (missedShots <= 2) {
            earnedPoints *= 2;
            bonusText = ' (GREAT x2!)';
        }
    }
    
    drawARFont(context, 'POINTS: +' + earnedPoints + bonusText, centerX, y + 100, {textAlign: 'center', textBaseline: 'top'});
    
    if (gameState.completionTime !== undefined) {
        const currentRecord = savedState.records[gameState.levelKey] ?? (gameState.levelKey === 'endless' ? 0 : Infinity);
        
        if (gameState.levelKey === 'endless') {
            if (gameState.completionTime > currentRecord) {
                drawARFont(context, 'NEW SURVIVAL RECORD!', centerX, y + 92, {textAlign: 'center', textBaseline: 'top'});
            } else if (currentRecord > 0) {
                const recordText = 'BEST: ' + (currentRecord / 1000).toFixed(1) + 's';
                drawARFont(context, recordText, centerX, y + 92, {textAlign: 'center', textBaseline: 'top'});
            }
        } else {
            if (gameState.completionTime < currentRecord && gameState.score >= gameState.goal) {
                drawARFont(context, 'NEW FASTEST TIME!', centerX, y + 92, {textAlign: 'center', textBaseline: 'top'});
            } else if (currentRecord !== Infinity) {
                const recordText = 'BEST: ' + (currentRecord / 1000).toFixed(1) + 's';
                drawARFont(context, recordText, centerX, y + 92, {textAlign: 'center', textBaseline: 'top'});
            }
        }
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
    const gameState = state.arState.game;
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
            const record = savedState.records[item.levelKey];
            let timeText = 'NO RECORD YET';
            
            if (record !== undefined) {
                if (item.levelKey === 'endless') {
                    timeText = record > 0 ? 'BEST: ' + (record / 1000).toFixed(1) + 's' : 'NO RECORD YET';
                } else {
                    timeText = record !== Infinity ? 'BEST: ' + (record / 1000).toFixed(1) + 's' : 'NO RECORD YET';
                }
            }
            
            drawARFont(context, timeText, CANVAS_WIDTH / 2, boxY + 12, {textAlign: 'center', textBaseline: 'top'});
        } else if (!item.costs) {
            drawARFont(context, 'MAX LEVEL', CANVAS_WIDTH / 2, boxY + 12, {textAlign: 'center', textBaseline: 'top'});
        }
    }
    
    if (gameState.scene === 'level') {
        if (gameState.levelKey === 'endless') {
            drawARFont(context, 'HITS: ' + gameState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40, {textAlign: 'center', textBaseline: 'top'});
        } else {
            const scoreText = gameState.score + (gameState.goal ? '/' + gameState.goal : '');
            drawARFont(context, scoreText, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40, {textAlign: 'center', textBaseline: 'top'});
        }

        const timeBarWidth = 100;
        const timeBarHeight = 6;
        const timeBarX = CANVAS_WIDTH / 2 - timeBarWidth / 2;
        const timeBarY = CANVAS_HEIGHT - 32;
        
        const timeProgress = gameState.timeLeft / gameState.maxTime;
        
        context.fillStyle = '#333';
        context.fillRect(timeBarX, timeBarY, timeBarWidth, timeBarHeight);
        
        context.fillStyle = timeProgress > 0.25 ? '#0F0' : '#F00';
        context.fillRect(timeBarX, timeBarY, timeBarWidth * timeProgress, timeBarHeight);
        
        context.strokeStyle = '#FFF';
        context.strokeRect(timeBarX, timeBarY, timeBarWidth, timeBarHeight);
        
        const ammoBarWidth = 100;
        const ammoBarHeight = 6;
        const ammoBarX = CANVAS_WIDTH / 2 - ammoBarWidth / 2;
        const ammoBarY = CANVAS_HEIGHT - 20;
        
        context.fillStyle = '#333';
        context.fillRect(ammoBarX, ammoBarY, ammoBarWidth, ammoBarHeight);
        
        const ammoProgress = gameState.ammo / gameState.maxAmmo;
        context.fillStyle = '#FF0';
        context.fillRect(ammoBarX, ammoBarY, ammoBarWidth * ammoProgress, ammoBarHeight);
        
        context.strokeStyle = '#FFF';
        context.strokeRect(ammoBarX, ammoBarY, ammoBarWidth, ammoBarHeight);
    }
}

export const targetPracticeGame: ARGame = {
    start: startTargetPractice,
    update: updateTargetPractice,
    render: renderTargetPractice,
    renderHUD: renderTargetPracticeHUD,
    disablesPlayerMovement: true,
};