import { removeEffectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getTileBehaviors, hitTargets } from 'app/utils/field';

import {
    AreaInstance, EffectInstance,
    Frame, GameState, Ray,
} from 'app/types';

function truncateRay(state: GameState, area: AreaInstance, ray: Ray): Ray {
    const dx = ray.x2 - ray.x1, dy = ray.y2 - ray.y1;
    const mag = Math.sqrt(dx * dx + dy * dy);
    for (let i = 20; i < mag; i += 4) {
        const x = ray.x1 + i * dx / mag, y = ray.y1 + i * dy / mag;
        const { tileBehavior } = getTileBehaviors(state, area, {x, y});
        if (!tileBehavior?.low && tileBehavior?.solid) {
            return {...ray, x2: x, y2: y};
        }
    }
    return ray;
}

interface Props {
    sx: number
    sy: number
    tx: number
    ty: number
    radius?: number
    duration?: number
    damage?: number
    delay?: number
}

const FADE_DURATION = 100;

export class LaserBeam implements EffectInstance, Props {
    area: AreaInstance = null;
    isEffect = <const>true;
    isEnemyAttack = true;
    frame: Frame;
    damage: number;
    sx: number;
    sy: number;
    tx: number;
    ty: number;
    z: number = 0;
    vz: number = 0;
    vx: number;
    vy: number;
    radius: number;
    delay: number;
    duration: number;
    shockWaves: number;
    shockWaveTheta: number;
    animationTime = 0;
    done = false;
    constructor({sx, sy, tx, ty, damage = 2, delay = 0, duration = 200, radius = 6}: Props) {
        this.sx = sx | 0;
        this.sy = sy | 0;
        this.tx = tx | 0;
        this.ty = ty | 0;
        this.delay = delay;
        this.radius = radius;
        this.duration = duration;
        this.damage = damage;
    }
    getHitRay(state: GameState): Ray {
        return truncateRay(state, this.area, {
            x1: this.sx, y1: this.sy,
            x2: this.tx, y2: this.ty,
            r: this.radius,
        });
    }
    update(state: GameState) {
        if (this.delay > 0) {
            this.delay -= FRAME_LENGTH;
            return;
        }
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime <= this.duration) {
            hitTargets(state, this.area, {
                damage: this.damage,
                hitRay: this.getHitRay(state),
                hitAllies: true,
                knockAwayFromHit: true,
            });
        }
        if (this.animationTime >= this.duration + FADE_DURATION) {
            this.done = true;
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
       if (this.delay > 0) {
           return;
       }
       const p = (this.animationTime - this.duration) / FADE_DURATION;
       const alpha = 1 - Math.max(0, Math.min(1, p));
       drawLaser(context, this.getHitRay(state), alpha);
    }
}

export function drawLaser(context: CanvasRenderingContext2D, ray: Ray, alpha: number) {
    context.save();
        context.globalAlpha = alpha;
        context.translate(ray.x1, ray.y1);
        const dx = ray.x2 - ray.x1;
        const dy = ray.y2 - ray.y1;
        const theta = Math.atan2(dy, dx);
        context.rotate(theta);
        // Create a linear gradient
        const gradient = context.createLinearGradient(
            0,
            -ray.r,
            0,
            ray.r,
        );

        // Add color stops
        gradient.addColorStop(0, "rgba(252,70,107,0)");
        gradient.addColorStop(0.1, "rgba(252,70,107,0.2)");
        gradient.addColorStop(0.2, "rgba(252,70,107,0.8)");
        gradient.addColorStop(0.3, "rgba(251,63,215,1)");
        gradient.addColorStop(0.4, "rgba(250,250,250,1)");
        gradient.addColorStop(0.6, "rgba(250,250,250,1)");
        gradient.addColorStop(0.7, "rgba(251,63,215,1)");
        gradient.addColorStop(0.8, "rgba(252,70,107,0.8)");
        gradient.addColorStop(0.9, "rgba(252,70,107,0.2)");
        gradient.addColorStop(1, "rgba(252,70,107,0)");

        // Set the fill style and draw a rectangle
        context.fillStyle = gradient;
        const mag = Math.sqrt(dx * dx + dy *dy);
        context.fillRect(0, -ray.r, mag, ray.r * 2);
    context.restore();
}
