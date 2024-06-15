import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrameAt, getFrame } from 'app/utils/animations';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { hitTargets } from 'app/utils/field';



const geometry = {w: 8, h: 16};
const shockWaveAnimation = createAnimation('gfx/effects/shockwave.png', geometry, {cols: 4, duration: 2});

interface Props {
    x: number
    y: number
    z?: number
    damage?: number
    maxSpeed?: number
    vx?: number
    vy?: number
    vz?: number
    ax?: number
    ay?: number
    az?: number
    ttl?: number
    delay?: number
}

export class ShockWave implements EffectInstance, Props {
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
    ax: number;
    ay: number;
    az: number;
    radius: number = 3;
    animationTime = 0;
    maxSpeed = 0;
    ttl: number;
    delay: number;
    constructor({x, y, z = 0, vx = 0, vy = 0, vz = 0, ax = 0, ay = 0, az = -0.3, damage = 1, maxSpeed = 0, ttl = 2000, delay = 0}: Props) {
        this.damage = damage;
        this.maxSpeed = maxSpeed;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.ax = ax;
        this.ay = ay;
        this.az = az;
        this.ttl = ttl;
        this.delay = delay;
    }
    update(state: GameState) {
        if (this.delay > 0) {
            this.delay -= FRAME_LENGTH;
            return;
        }
        this.x += this.vx;
        this.y += this.vy;
        this.z = Math.max(0, this.z + this.vz);
        this.vx = this.vx + this.ax;
        this.vy = this.vy + this.ay;
        const mag = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (this.maxSpeed && mag > this.maxSpeed) {
            this.vx = this.maxSpeed * this.vx / mag;
            this.vy = this.maxSpeed * this.vy / mag;
        }
        this.vz = Math.max(-8, this.vz + this.az);
        this.animationTime += FRAME_LENGTH;

        if (this.animationTime >= this.ttl) {
            removeEffectFromArea(state, this);
        } else {
            hitTargets(state, this.area, {
                damage: this.damage,
                hitCircle: {x: this.x, y: this.y, r: this.radius},
                element: 'lightning',
                hitAllies: true,
                knockAwayFrom: {x: this.x, y: this.y},
            });
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const frame = getFrame(shockWaveAnimation, this.animationTime);
        const theta = Math.atan2(this.vy, this.vx);
        context.fillStyle = 'yellow';
        context.save();
            context.translate(this.x, this.y);
            context.rotate(theta + Math.PI / 2);
            drawFrameAt(context, frame, {x: -4, y: -8});
        context.restore();
    }
}

export function addRadialShockWaves(this: void,
    state: GameState, area: AreaInstance,
    [x, y]: Coords, count: number, thetaOffset = 0, offset = 0,
    extraProps?: Partial<Props>
): void {
    for (let i = 0; i < count; i++) {
        const theta = thetaOffset + i * 2 * Math.PI / count;
        const dx = Math.cos(theta);
        const dy = Math.sin(theta);
        const shockWave = new ShockWave({
            x: x + offset * dx,
            y: y + offset * dy,
            vx: 4 * dx,
            vy: 4 * dy,
            ttl: 1000,
            ...extraProps,
        });
        addEffectToArea(state, area, shockWave);
    }
}

export function addArcOfShockWaves(this: void,
    state: GameState, area: AreaInstance,
    [x, y]: Coords, count: number, centerTheta = 0, thetaRadius = Math.PI / 4, offset: number,
    extraProps?: Partial<Props>
): void {
    for (let i = 0; i < count; i++) {
        const theta = count === 1
            ? centerTheta
            : centerTheta - thetaRadius + i * 2 * thetaRadius / (count - 1);
        const dx = Math.cos(theta);
        const dy = Math.sin(theta);
        const maxSpeed = extraProps.maxSpeed || 0;
        // Start slow and accelerate to maxSpeed if it is defined.
        const speed = maxSpeed ? 0.1 : 4;
        const shockWave = new ShockWave({
            x: x + offset * dx,
            y: y + offset * dy,
            vx: speed * dx,
            vy: speed * dy,
            ax: maxSpeed / 50 * dx,
            ay: maxSpeed / 50 * dy,
            ttl: 1000,
            ...extraProps,
        });
        addEffectToArea(state, area, shockWave);
    }
}
