import { FRAME_LENGTH } from 'app/gameConstants';
import { getLedgeDelta } from 'app/movement/getLedgeDelta';
import { renderDamageWarning } from 'app/render/renderDamageWarning';
import { removeEffectFromArea } from 'app/utils/effects';
import { getTileBehaviors, hitTargets } from 'app/utils/field';


function truncateRay(state: GameState, area: AreaInstance, ray: Ray): Ray {
    const dx = ray.x2 - ray.x1, dy = ray.y2 - ray.y1;
    const mag = Math.sqrt(dx * dx + dy * dy);
    let ledgeDeltaSum = 0, lastPoint: Point;
    for (let i = 0; i < mag; i += 4) {
        const point = {
            x: ray.x1 + i * dx / mag,
            y: ray.y1 + i * dy / mag,
        };
        const { tileBehavior } = getTileBehaviors(state, area, point);
        if (!tileBehavior?.low && tileBehavior?.solid) {
            return {...ray, x2: point.x, y2: point.y};
        }
        if (lastPoint) {
            const ledgeDelta = getLedgeDelta(state, area, lastPoint, point);
            if (ledgeDelta < 0) {
                ledgeDeltaSum--;
            }
            if (ledgeDelta > 0) {
                ledgeDeltaSum++;
            }
            // Line of site is blocked when
            if (ledgeDeltaSum > 0) {
                return {...ray, x2: point.x, y2: point.y};
            }
        }
        lastPoint = point;
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
    tellDuration?: number
    ignoreWalls?: boolean
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
    ignoreWalls: boolean;
    totalTellDuration: number;
    tellDuration: number;
    shockWaves: number;
    shockWaveTheta: number;
    animationTime = 0;
    done = false;
    memoizedHitRay: Ray;
    constructor({sx, sy, tx, ty, damage = 2, delay = 0, duration = 200, ignoreWalls = false, tellDuration = 0, radius = 6}: Props) {
        this.sx = sx | 0;
        this.sy = sy | 0;
        this.tx = tx | 0;
        this.ty = ty | 0;
        this.delay = delay;
        this.radius = radius;
        this.duration = duration;
        this.totalTellDuration = tellDuration;
        this.tellDuration = tellDuration;
        this.ignoreWalls = ignoreWalls;
        this.damage = damage;
    }
    getHitRay(state: GameState): Ray {
        if (this.memoizedHitRay) {
            return this.memoizedHitRay;
        }
        const baseRay = {
            x1: this.sx, y1: this.sy,
            x2: this.tx, y2: this.ty,
            r: this.radius,
        };
        if (this.ignoreWalls) {
            return baseRay
        }
        this.memoizedHitRay = truncateRay(state, this.area, baseRay);
        return this.memoizedHitRay;
    }
    update(state: GameState) {
        // We only memoize the hit ray for a single frame before recalculating it.
        delete this.memoizedHitRay;
        if (this.delay > 0) {
            this.delay -= FRAME_LENGTH;
            return;
        }
        if (this.tellDuration > 0) {
            this.tellDuration -= FRAME_LENGTH;
            return;
        }
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime <= this.duration) {
            // TODO: prevent hitting targets that are below a ledge from the source of the beam unless ignoring walls.
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
        // never draw the laser if the duration is 0.
        if (this.delay > 0 || this.duration === 0) {
            return;
        }
        if (this.tellDuration > 0) {
            return;
        }
        const p = (this.animationTime - this.duration) / FADE_DURATION;
        const alpha = 1 - Math.max(0, Math.min(1, p));
        drawLaser(context, this.getHitRay(state), alpha);
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
       if (this.delay > 0) {
           return;
       }
       if (this.tellDuration > 0) {
           const ray = this.getHitRay(state);
           renderDamageWarning(context, {
                ray,
                duration: this.totalTellDuration,
                time: this.totalTellDuration - this.tellDuration,
            });

           /* const ray = this.getHitRay(state);
            context.save();
                context.translate(ray.x1, ray.y1);
                const dx = ray.x2 - ray.x1;
                const dy = ray.y2 - ray.y1;
                const mag = Math.sqrt(dx * dx + dy *dy);
                const theta = Math.atan2(dy, dx);
                context.rotate(theta);
                context.fillStyle = 'red';
                context.globalAlpha *= 0.5;
                context.fillRect(0, -ray.r, mag, 1);
                context.fillRect(0, ray.r - 1, mag, 1);
                const r = this.radius - this.tellDuration / 50;
                if (r > 0) {
                    context.fillRect(0, -r | 0, mag, 2 * r | 0);
                }
            context.restore();
            //drawLaser(context, this.getHitRay(state), 0.1);
            return;*/
       }
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
        // pink #f9c8c8 rgba(249,200,200,255)
        // red #ef3b3b rgba(239,59,59,255)
        // dark red #cf2340 rgba(207,35,64,255)
        gradient.addColorStop(0, "rgba(207,35,64,0)");
        gradient.addColorStop(0.1, "rgba(207,35,64,0.2)");
        gradient.addColorStop(0.2, "rgba(207,35,64,0.8)");
        gradient.addColorStop(0.3, "rgba(239,59,59,1)");
        gradient.addColorStop(0.4, "rgba(249,200,200,1)");
        gradient.addColorStop(0.6, "rgba(249,200,200,1)");
        gradient.addColorStop(0.7, "rgba(239,59,59,1)");
        gradient.addColorStop(0.8, "rgba(207,35,64,0.8)");
        gradient.addColorStop(0.9, "rgba(207,35,64,0.2)");
        gradient.addColorStop(1, "rgba(207,35,64,0)");

        // Set the fill style and draw a rectangle
        context.fillStyle = gradient;
        const mag = Math.sqrt(dx * dx + dy *dy);
        context.fillRect(0, -ray.r, mag, ray.r * 2);
    context.restore();
}
