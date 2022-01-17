import { removeEffectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { hitTargets } from 'app/utils/field';

import {
    AreaInstance, DrawPriority, EffectInstance,
    Frame, GameState,
} from 'app/types';

interface Props {
    x?: number
    y?: number
    damage?: number
    delay?: number
    tellDuration?: number
}

const animationDuration = 100;
const fadeDuration = 200;

export class GroundSpike implements EffectInstance, Props {
    drawPriority: DrawPriority = 'sprites';
    area: AreaInstance = null;
    isEffect = <const>true;
    isEnemyAttack = true;
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
    delay: number;
    tellDuration: number;
    animationTime = 0;
    constructor({x = 0, y = 0, damage = 2, delay = 0, tellDuration = 1000}: Props) {
        this.x -= this.w / 2;
        this.y -= this.h / 2;
        this.x = ((x / 16) | 0) * 16;
        this.y = ((y / 16) | 0) * 16;
        this.delay = delay;
        this.tellDuration = tellDuration;
        this.damage = damage;
    }
    update(state: GameState) {
        if (this.delay >= 0) {
            this.delay -= FRAME_LENGTH;
            return;
        }
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime >= this.tellDuration + 60 && this.animationTime <= this.tellDuration + animationDuration) {
            hitTargets(state, this.area, {
                damage: this.damage,
                hitbox: this.getHitbox(state),
                knockAwayFrom: {x: this.x + this.w / 2, y: this.y + this.h / 2},
                hitAllies: true,
                hitTiles: true,
                cutsGround: true,
            });
        }
        if (this.animationTime >= this.tellDuration + animationDuration + fadeDuration) {
            removeEffectFromArea(state, this);
        }
    }
    getHitbox(state: GameState) {
        const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
        const r = this.getRadius() * this.w / 2;
        return {x: cx - r, y: cy - r, w: 2 * r, h: 2 * r};
    }
    getRadius() {
        const time = this.animationTime - this.tellDuration;
        const p = Math.min(1, time / animationDuration);
        return p * p;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const time = this.animationTime - this.tellDuration;
        if (time <= 0) {
            return;
        }
        context.save();
            if (time > animationDuration) {
                context.globalAlpha *= Math.max(0, 1 - (time - animationDuration) / fadeDuration);
            }
            context.beginPath();
            const p = this.getRadius();
            const height = 40 * p;
            const cx = this.x + this.w / 2
            context.moveTo(cx - this.w / 2 * p, this.y + this.h / 2);
            context.lineTo(cx, this.y + this.h / 2 - height);
            context.lineTo(cx + this.w / 2 * p, this.y + this.h / 2);
            context.strokeStyle = '#FFF';
            context.stroke();
            context.fillStyle = '#DEF';
            context.fill();
        context.restore();
        /*if (this.animationTime >= this.tellDuration + 60 && this.animationTime <= this.tellDuration + animationDuration) {
            context.fillStyle = 'red';
            const hitbox = this.getHitbox(state);
            context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
        }*/
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        // Since this has a tell, render nothing until the delay is over.
        if (this.delay >= 0) {
            return;
        }
        // Animate a warning indicator on the ground.
        context.save();
            context.globalAlpha *= (0.5 + Math.min(0.3, 0.3 * this.animationTime / this.tellDuration));
            context.fillStyle = 'black';
            const r = 4 + 8 * Math.min(1, 1.25 * this.animationTime / this.tellDuration);
            context.beginPath();
            context.arc(this.x + this.w / 2, this.y + this.h / 2, r, 0, 2 * Math.PI);
            context.fill();
        context.restore();
    }
}
