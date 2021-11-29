import { removeObjectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { hitTargets } from 'app/utils/field';

import {
    AreaInstance, DrawPriority, Direction,
    Frame, GameState, ObjectInstance, ObjectStatus,
} from 'app/types';

interface Props {
    x?: number
    y?: number,
    damage?: number,
    delay?: number,
}

const animationDuration = 100;
const fadeDuration = 200;

export class GroundSpike implements ObjectInstance, Props {
    drawPriority: DrawPriority = 'sprites';
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
    w: number = 16;
    h: number = 16;
    ignorePits = true;
    delay: number;
    shockWaves: number;
    shockWaveTheta: number;
    animationTime = 0;
    direction: Direction;
    status: ObjectStatus = 'normal';
    constructor({x = 0, y = 0, damage = 2, delay = 800}: Props) {
        this.x -= this.w / 2;
        this.y -= this.h / 2;
        this.x = ((x / 16) | 0) * 16;
        this.y = ((y / 16) | 0) * 16;
        this.delay = delay;
        this.damage = damage;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime >= this.delay && this.animationTime <= this.delay + animationDuration) {
            hitTargets(state, this.area, {
                damage: this.damage,
                hitbox: this,
                knockAwayFrom: {x: this.x + this.w / 2, y: this.y + this.h / 2},
                hitAllies: true,
            });
        }
        if (this.animationTime >= this.delay + animationDuration + fadeDuration) {
            removeObjectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const time = this.animationTime - this.delay;
        if (time <= 0) {
            return;
        }
        context.save();
            if (time > animationDuration) {
                context.globalAlpha *= Math.max(0, 1 - (time - animationDuration) / fadeDuration);
            }
            context.beginPath();
            const p = Math.min(1, time / animationDuration);
            const height = 40 * p * p;
            const cx = this.x + this.w / 2
            context.moveTo(cx - this.w / 2 * p * p, this.y + this.h / 2);
            context.lineTo(cx, this.y + this.h / 2 - height);
            context.lineTo(cx + this.w / 2 * p * p, this.y + this.h / 2);
            context.strokeStyle = '#FFF';
            context.stroke();
            context.fillStyle = '#DEF';
            context.fill();
        context.restore();
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        // Animate a warning indicator on the ground.
        context.save();
            context.globalAlpha *= (0.5 + Math.min(0.3, 0.3 * this.animationTime / this.delay));
            context.fillStyle = 'black';
            const r = 4 + 8 * Math.min(1, 1.25 * this.animationTime / this.delay);
            context.beginPath();
            context.arc(this.x + this.w / 2, this.y + this.h / 2, r, 0, 2 * Math.PI);
            context.fill();
        context.restore();
    }
}
