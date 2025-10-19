import { FRAME_LENGTH } from 'app/gameConstants';
import { drawARFont } from 'app/arGames/arFont';
import { playAreaSound } from 'app/musicController';
import { TargetPracticeState, TargetPracticeSavedState, FpsTarget, BullseyeEffect } from './fps_types';



class StandardTarget implements FpsTarget {
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
        this.vx = speed > 0 ? (Math.random() - 0.5) * 0.5 * speed + (0.5 * speed) : 0;
        this.vy = speed > 0 ? (Math.random() - 0.5) * 0.5 * speed + (0.5 * speed): 0;
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

        
        const maxY = gameState.screen.y + gameState.screen.h;


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

        const bullseyeColor = lightenColor(this.color, 0.55);
        context.fillStyle = bullseyeColor;
        context.beginPath();
        context.arc(this.x, this.y, this.radius / 3, 0, 2 * Math.PI);
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

    onHit(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState, bullseye?: boolean): void {
        if (this.hitTime !== undefined) return;

        this.currentHits++;
        gameState.shotsHit++;

        if (this.currentHits >= this.maxHits) {
            if (bullseye) {
                gameState.score += this.points * 2;
                // Create bullseye visual effect
                createBullseyeEffect(this.x, this.y, gameState);
                playAreaSound(state, state.areaInstance, 'hitBullseye');
            } else {
                gameState.score += this.points;
                playAreaSound(state, state.areaInstance, 'hitShot');
            }
            gameState.score = Math.max(gameState.score, 0);
            this.hitTime = 300;
        } else {
            playAreaSound(state, state.areaInstance, 'rockShatter');
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
        this.angularSpeed = (speed * 0.01) * (Math.random() > 0.5 ? 1 : -1) * (30 / this.orbitRadius); 
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

    constructor(x: number, y: number, radius: number, points: number, alternatePoints: number, speed: number, lifetime: number, switchInterval: number = 2000, customColor: string = '#55b5e4ff', altColor: string = '#880814ff') {
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
            fillColor = Math.floor(this.hitTime / 50) % 2 ? '#CCC' : this.color;
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


    onHit(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState, bullseye?: boolean): void {
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

    onHit(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState, bullseye?: boolean): void {
        if (this.hitTime !== undefined) return;
        if (this.bonusType == 'ammo') {
            gameState.ammo = Math.min(gameState.maxAmmo, gameState.ammo + this.bonusAmount);
        } else if (this.bonusType == 'time') {
            gameState.timeLeft = Math.min(this.bonusAmount + gameState.timeLeft, gameState.maxTime);
        }
        gameState.shotsHit++;
        this.hitTime = 300;
        
        playAreaSound(state, state.areaInstance, 'hitShot');
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
            fillColor = Math.floor(this.hitTime / 50) % 2 ? '#A04' : this.color;
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

    onHit(state: GameState, gameState: TargetPracticeState, savedState: TargetPracticeSavedState, bullseye?: boolean): void {
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

function lightenColor(hex: string, percent: number): string {
    hex = hex.replace(/^#/, "");

    hex = hex.split("").map(c => c + c).join("");

    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.min(255, Math.floor(r + (255 - r) * percent));
    g = Math.min(255, Math.floor(g + (255 - g) * percent));
    b = Math.min(255, Math.floor(b + (255 - b) * percent));

    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
}

function createBullseyeEffect(x: number, y: number, gameState: TargetPracticeState): void {
    const effect: BullseyeEffect = {
        x: x,
        y: y,
        lifetime: 1000, // 1 second duration
        maxLifetime: 1000,
        scale: 0.1
    };
    
    // Initialize the array if it doesn't exist
    if (!gameState.bullseyeEffects) {
        gameState.bullseyeEffects = [];
    }
    
    gameState.bullseyeEffects.push(effect);
}

export { StandardTarget, CirclingTarget, AlternatingTarget, BonusTarget, ExplosiveTarget, handleExplosion };