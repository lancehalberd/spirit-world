import { addObjectToArea, removeObjectFromArea } from 'app/content/areas';
import { Spark } from 'app/content/effects/spark';
import { FRAME_LENGTH } from 'app/gameConstants';
import { hitTargets } from 'app/utils/field';

import {
    AreaInstance, Direction,
    Frame, GameState, ObjectInstance, ObjectStatus,
} from 'app/types';



interface Props {
    x?: number
    y?: number,
    damage?: number,
    delay?: number,
    shockWaves?: number,
    shockWaveTheta?: number,
}

// How long the lightning animation takes. Shockwaves are created at the end of this duration.
const LIGHTNING_ANIMATION_DURATION = FRAME_LENGTH * 6;
// How long the lightning animation persists after the animation plays.
const STRIKE_DURATION = FRAME_LENGTH * 12;
const BOLT_HEIGHT = 48;

export class LightningBolt implements ObjectInstance, Props {
    area: AreaInstance = null;
    definition = null;
    frame: Frame;
    damage: number;
    x: number;
    y: number;
    z: number = 0;
    vz: number = 0;
    vx: number;
    vy: number;
    w: number = 12;
    h: number = 12;
    ignorePits = true;
    delay: number;
    shockWaves: number;
    shockWaveTheta: number;
    animationTime = 0;
    direction: Direction;
    status: ObjectStatus = 'normal';
    constructor({x = 0, y = 0, damage = 2, delay = 800, shockWaves = 4, shockWaveTheta = 0}: Props) {
        this.x = x | 0;
        this.y = y | 0;
        this.x -= this.w / 2;
        this.y -= this.h / 2;
        this.delay = delay;
        this.shockWaves = shockWaves;
        this.shockWaveTheta = shockWaveTheta;
        this.damage = damage;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime === this.delay + LIGHTNING_ANIMATION_DURATION) {
            // Create shockwave here.
            for (let i = 0; i < this.shockWaves; i++) {
                const theta = this.shockWaveTheta + i * 2 * Math.PI / this.shockWaves;
                const dx = Math.cos(theta);
                const dy = Math.sin(theta);
                const spark = new Spark({
                    x: this.x + this.w / 2,
                    y: this.y + this.h / 2,
                    vx: 4 * dx,
                    vy: 4 * dy,
                    ttl: 1000,
                });
                spark.x -= spark.w / 2;
                spark.y -= spark.h / 2;
                addObjectToArea(state, state.areaInstance, spark);
            }
        }
        if (this.animationTime >= this.delay + LIGHTNING_ANIMATION_DURATION) {
            hitTargets(state, this.area, {
                damage: this.damage,
                hitbox: this,
                knockAwayFrom: {x: this.x + this.w / 2, y: this.y + this.h / 2},
                element: 'lightning',
                hitAllies: true,
            });
        }
        if (this.animationTime >= this.delay + LIGHTNING_ANIMATION_DURATION + STRIKE_DURATION) {
            removeObjectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Animate a transparent orb growing in the air
        context.save();
            context.globalAlpha *= (0.5 + Math.min(0.5, 0.5 * this.animationTime / this.delay));
            context.fillStyle = 'yellow';
            const r = 10 * Math.min(1, this.animationTime / this.delay);
            context.beginPath();
            context.arc(this.x + this.w / 2, this.y + this.h / 2 - 48, r, 0, 2 * Math.PI);
            context.fill();
        context.restore();
        if (this.animationTime < this.delay) {
            return;
        }
        // Animate the bolt coming down
        const h = BOLT_HEIGHT * Math.min(1, (this.animationTime - this.delay) / LIGHTNING_ANIMATION_DURATION);
        context.fillStyle = 'yellow';
        context.fillRect(this.x + this.w / 2 - 2, this.y + this.h / 2 - 48, 4, h);
        if (this.animationTime < this.delay + LIGHTNING_ANIMATION_DURATION) {
            return;
        }
        // Animate the strike point
        context.beginPath();
        context.arc(this.x + this.w / 2, this.y + this.h / 2, 6, 0, 2 * Math.PI);
        context.fill();
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        context.save();
            context.globalAlpha *= 0.5;
            context.fillStyle = 'yellow';
            context.beginPath();
            context.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, 0, 2 * Math.PI);
            context.fill();
        context.restore();
    }
}
