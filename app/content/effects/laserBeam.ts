import { FRAME_LENGTH } from 'app/gameConstants';
import { getLedgeDelta } from 'app/movement/getLedgeDelta';
import { renderDamageWarning } from 'app/render/renderDamageWarning';
import { removeEffectFromArea } from 'app/utils/effects';
import {isEnemyDefeated} from 'app/utils/enemies';
import { hitTargets } from 'app/utils/field';
import { getTileBehaviors} from 'app/utils/getBehaviors';
import Random from 'app/utils/Random';


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
	monocolor?: boolean
    damage?: number
    delay?: number
    source: Enemy
    // How much to pad the laser's tell+appearance by which can make it easier to dodge.
    visualPadding?: number
    beforeUpdate?: (state: GameState, laserBeam: LaserBeam) => void
    drawLaser?: (context: CanvasRenderingContext2D, ray: Ray, alpha: number) => void
}

const FADE_DURATION = 100;

function padRay(ray: Ray, padding: number) {
    return {...ray, r: ray.r + padding};
}

export class LaserBeam implements EffectInstance, Props {
    area: AreaInstance = null;
    isEffect = <const>true;
    isEnemyAttack = true;
    frame: Frame;
    damage = this.props.damage ?? 2;
    sx = this.props.sx | 0;
    sy = this.props.sy | 0;
    tx = this.props.tx | 0;
    ty = this.props.ty | 0;
    radius = this.props.radius ?? 6;
    delay = this.props.delay;
    duration = this.props.duration ?? 200;
    ignoreWalls = this.props.ignoreWalls;
    totalTellDuration = this.props.tellDuration ?? 0;
    tellDuration = this.props.tellDuration ?? 0;
    source = this.props.source;
    beforeUpdate = this.props.beforeUpdate;
    visualPadding = this.props.visualPadding ?? 4;
    drawLaser = this.props.drawLaser ?? drawLaser;
    z: number = 0;
    animationTime = 0;
    done = false;
    memoizedHitRay: Ray;
    constructor(public props: Props) {}
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
        if (this.beforeUpdate) {
            this.beforeUpdate(state, this);
        }
        if (this.source && isEnemyDefeated(this.source)) {
            this.done = true;
            removeEffectFromArea(state, this);
            return;
        }
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
                source: this.source,
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
        this.drawLaser(context, padRay(this.getHitRay(state), this.visualPadding), alpha);
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
       if (this.delay > 0) {
           return;
       }
       if (this.tellDuration > 0) {
           const ray = padRay(this.getHitRay(state), this.visualPadding);
            renderDamageWarning(context, {
                ray,
                duration: this.totalTellDuration,
                time: this.totalTellDuration - this.tellDuration,
            });
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
        gradient.addColorStop(0.02, "rgba(207,35,64,0.2)");
        gradient.addColorStop(0.2, "rgba(207,35,64,0.8)");
        gradient.addColorStop(0.3, "rgba(239,59,59,1)");
        gradient.addColorStop(0.4, "rgba(249,200,200,1)");
        gradient.addColorStop(0.6, "rgba(249,200,200,1)");
        gradient.addColorStop(0.7, "rgba(239,59,59,1)");
        gradient.addColorStop(0.8, "rgba(207,35,64,0.8)");
        gradient.addColorStop(0.98, "rgba(207,35,64,0.2)");
        gradient.addColorStop(1, "rgba(207,35,64,0)");
        // Set the fill style and draw a rectangle
        const mag = Math.sqrt(dx * dx + dy *dy);
        context.fillStyle = gradient;
		context.beginPath();
        // Draw a circle at the start of the beam.
        context.arc(ray.r, 0, ray.r, 0, 2 * Math.PI);
        // Draw a rectangle starting at the mid point of the circle.
        context.rect(ray.r, -ray.r, mag - ray.r, ray.r * 2);
        context.fill();
    context.restore();
}

const colorArray = ["rgba(207,35,64,0)", "rgba(207,35,64,0.2)", "rgba(207,35,64,0.8)", "rgba(239,59,59,1)", "rgba(249,200,200,1)", "rgba(249,200,200,1)", "rgba(239,59,59,1)", "rgba(207,35,64,0.8)", "rgba(207,35,64,0.2)", "rgba(207,35,64,0)"];
const laserJitter = [0.03490, -0.03490 , 0.01745, -0.01745, 0, 0, 0];

export function drawJitteryLaser(context: CanvasRenderingContext2D, ray: Ray, alpha: number) {
    context.save();
        context.globalAlpha = alpha;
        context.translate(ray.x1, ray.y1);
        const dx = ray.x2 - ray.x1;
        const dy = ray.y2 - ray.y1;
        const theta = Math.atan2(dy, dx);
		//Add some laser jitter
        context.rotate(theta + Random.element(laserJitter));
        const mag = Math.sqrt(dx * dx + dy *dy);
        context.fillStyle = Random.element(colorArray);
		context.beginPath();
        // Draw a circle at the start of the beam.
        context.arc(0, 0, ray.r*2, 0, 2 * Math.PI);
        // Draw a rectangle starting at the mid point of the circle.
        context.rect(ray.r, -ray.r, mag - ray.r, ray.r * 2);
        context.fill();
    context.restore();
}


export function setLaserBeamBySourceAndAngle(laserBeam: LaserBeam, source: ObjectInstance, theta: number, length = 1000) {
    const hitbox = source.getHitbox();
    const cx = hitbox.x + hitbox.w / 2;
    const cy = hitbox.y + hitbox.h / 2;
    const dx = Math.cos(theta), dy = Math.sin(theta);
    laserBeam.sx = cx + dx * hitbox.w / 2;
    laserBeam.sy = cy + dy * hitbox.h / 2;
    laserBeam.tx = laserBeam.sx + length * dx;
    laserBeam.ty = laserBeam.sy + length * dy;
}

export function stickLaserBeamToTarget(laserBeam: LaserBeam, target: ObjectInstance, theta: number) {
    setLaserBeamBySourceAndAngle(laserBeam, target, theta);
    laserBeam.beforeUpdate = (state: GameState, laserBeam: LaserBeam) => {
        setLaserBeamBySourceAndAngle(laserBeam, target, theta);
    };
}
export function rotateLaserBeamAroundTarget(laserBeam: LaserBeam, target: ObjectInstance, theta: number, thetaV: number) {
    setLaserBeamBySourceAndAngle(laserBeam, target, theta);
    laserBeam.beforeUpdate = (state: GameState, laserBeam: LaserBeam) => {
        theta += thetaV * FRAME_LENGTH / 1000;
        setLaserBeamBySourceAndAngle(laserBeam, target, theta);
    };
}
