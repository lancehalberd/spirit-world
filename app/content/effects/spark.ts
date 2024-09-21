import { FRAME_LENGTH } from 'app/gameConstants';
import { renderLightningCircle, renderLightningRay } from 'app/render/renderLightning'
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { hitTargets } from 'app/utils/field';
import { getVectorToTarget, isTargetVisible } from 'app/utils/target';


interface Props {
    x: number
    y: number
    z?: number
    damage?: number
    vx?: number
    vy?: number
    vz?: number
    ax?: number
    ay?: number
    az?: number
    friction?: number
    ttl?: number
    hitCircle?: Circle
    hitRay?: Ray
    extraHitProps?: Partial<HitProperties>
    finalRadius?: number
    delay?: number
    target?: ObjectInstance | EffectInstance
    hybridWorlds?: boolean
    onHit?: (state: GameState, spark: Spark) => void
}

export class Spark implements EffectInstance, Props {
    drawPriority: DrawPriority = 'sprites';
    area: AreaInstance = null;
    getLightSources(state: GameState): LightSource[] {
        /*if (this.hitRay) {
            const dx = this.hitRay.x2 - this.hitRay.x1;
            const dy = this.hitRay.y2 - this.hitRay.y1;
            const mag = Math.sqrt(dx*dx + dy*dy);
            return [{
                x: this.x + this.hitRay.x1 + 6 * dx / mag,
                y: this.y + this.hitRay.y1 + 6 * dy / mag,
                brightness: 0.5,
                radius: 12,
                color: {r:255, g: 255, b: 0},
            },{
                x: this.x + this.hitRay.x2 - 6 * dx / mag,
                y: this.y + this.hitRay.y2 - 6 * dy / mag,
                brightness: 0.5,
                radius: 12,
                color: {r:255, g: 255, b: 0},
            }];
        }*/
        return [{
            x: this.x,
            y: this.y,
            brightness: 0.8,
            radius: this.hitCircle ? this.hitCircle.r : 16,
            color: {r:255, g: 255, b: 0},
            colorIntensity: 0.3,
        }];
    }
    isEffect = <const>true;
    isEnemyAttack = true;
    frame: Frame;
    damage: number = this.props.damage ?? 1;
    x: number = this.props.x;
    y: number = this.props.y;
    z: number = this.props.z ?? 0;
    vx: number = this.props.vx ?? 0;
    vy: number = this.props.vy ?? 0;
    vz: number = this.props.vz ?? 0;
    ax: number = this.props.ax ?? 0;
    ay: number = this.props.ay ?? 0;
    az: number = this.props.az ?? -0.3;
    friction = this.props.friction ?? 0;
    hitCircle: Circle;
    hitRay: Ray;
    animationTime = 0;
    ttl: number = this.props.ttl ?? 2000;
    delay = this.props.delay;
    constructor(readonly props: Props) {
        this.hitCircle = this.props.hitCircle;
        this.hitRay = this.props.hitRay;
        // If no hit type is provided, choose one automatically based on the velocity.
        if (!this.hitCircle && !this.hitRay) {
            if (!this.vx && !this.vy) {
                this.hitCircle = {x: 0, y: 0, r: 6};
            } else {
                this.hitRay = {x1: -4 * this.vx, y1 : -4 * this.vy, x2: 4 * this.vx, y2: 4 * this.vy, r: 2};
            }
        }
    }
    // This is just used for targeting, so all we need is for the center to be at (x, y).
    getHitbox() {
        return {x: this.x, y: this.y, w: 0, h: 0};
    }
    getHitProperties(): HitProperties {
        const hitProperties: HitProperties = {
            damage: this.damage,
            element: 'lightning',
            hitAllies: true,
            // This is needed to prevent the spark from traveling across ledges.
            hitTiles: true,
            knockAwayFrom: {x: this.x, y: this.y},
            vx: this.vx,
            vy: this.vy,
            cutsGround: true,
            ...this.props.extraHitProps,
        }
        if (this.hitRay) {
            hitProperties.hitRay = {
                ...this.hitRay,
                x1: this.x + this.hitRay.x1,
                y1: this.y + this.hitRay.y1,
                x2: this.x + this.hitRay.x2,
                y2: this.y + this.hitRay.y2,
            };
        } else {
            hitProperties.hitCircle = {
                ...this.hitCircle,
                x: this.x + this.hitCircle.x,
                y: this.y + this.hitCircle.y
            };
        }
        return hitProperties;
    }
    update(state: GameState) {
        if (this.hitCircle?.r < this.props.finalRadius) {
            this.hitCircle.r += 0.5;
        }
        if (this.delay > 0) {
            this.delay -= FRAME_LENGTH;
            return;
        }
        if (this.props.target && isTargetVisible(state, this, this.props.target)) {
            const {x, y} = getVectorToTarget(state, this, this.props.target);
            this.ax = x / 2;
            this.ay = y / 2;

        }
        this.x += this.vx;
        this.y += this.vy;
        this.z = Math.max(0, this.z + this.vz);
        this.vx = this.vx + this.ax;
        this.vy = this.vy + this.ay;
        this.vz = Math.max(-8, this.vz + this.az);
        if (this.friction > 0) {
            this.vx *= (1 - this.friction);
            this.vy *= (1 - this.friction);
            this.vz *= (1 - this.friction);
        }
        this.animationTime += FRAME_LENGTH;

        if (this.animationTime >= this.ttl) {
            removeEffectFromArea(state, this);
        } else {
            let hitResult = hitTargets(state, this.area, this.getHitProperties());
            let hit = hitResult.hit, stopped = hitResult.blocked || hitResult.stopped;
            if (this.props.hybridWorlds) {
                hitResult = hitTargets(state, this.area.alternateArea, this.getHitProperties());
                hit = hit || hitResult.hit;
                stopped = stopped || hitResult.blocked || hitResult.stopped;
            }
            if (hit) {
                this.props.onHit?.(state, this);
            }
            if (stopped) {
                removeEffectFromArea(state, this);
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.hitRay) {
            /*context.save();
                context.fillStyle = 'red';
                context.globalAlpha *= 0.5;
                const tiles = getTilesInRay(this.area, {
                    ...this.hitRay,
                    x1: this.x + this.hitRay.x1,
                    y1: this.y + this.hitRay.y1,
                    x2: this.x + this.hitRay.x2,
                    y2: this.y + this.hitRay.y2,
                });
                for (const tile of tiles) {
                    context.fillRect(tile.x * 16, tile.y * 16, 16, 16);
                }
                context.strokeStyle = 'blue';
                context.beginPath();
                context.moveTo(this.x + this.hitRay.x1, this.y + this.hitRay.y1);
                context.lineTo(this.x + this.hitRay.x2, this.y + this.hitRay.y2);
                context.stroke();
            context.restore();*/
            const theta = Math.atan2(this.hitRay.y2 - this.hitRay.y1, this.hitRay.x2 - this.hitRay.x1);
            const px = 2 * Math.cos(theta);
            const py = 2 * Math.sin(theta);
            renderLightningRay(context, {
                x1: this.x + this.hitRay.x1 - px,
                y1: this.y + this.hitRay.y1 - py,
                x2: this.x + this.hitRay.x2 + px,
                y2: this.y + this.hitRay.y2 + py,
                r: this.hitRay.r + 2
            },  {strength: 1, treeSize: 20});
        } else {
            //const strength = this.hitCircle.r < 8 ? 1 : 2;
            //const count = this.hitCircle.r < 8 ? 20 : 30;
            renderLightningCircle(context, {
                x: this.x + this.hitCircle.x,
                y: this.y + this.hitCircle.y,
                r: this.hitCircle.r + 2
            }, 2, 20);
        }
    }
    alternateRender(context: CanvasRenderingContext2D, state: GameState) {
        if (this.props.hybridWorlds) {
            this.render(context, state);
        }
    }
}

export function addRadialSparks(this: void,
    state: GameState, area: AreaInstance,
    [x, y]: Coords, count: number, thetaOffset = 0, speed = 4,
    extraProps?: Partial<Props>
): void {
    for (let i = 0; i < count; i++) {
        const theta = thetaOffset + i * 2 * Math.PI / count;
        const dx = Math.cos(theta);
        const dy = Math.sin(theta);
        const spark = new Spark({
            x: x + dx * 6,
            y: y + dy * 6,
            vx: speed * dx,
            vy: speed * dy,
            ttl: 1000,
            ...extraProps,
        });
        addEffectToArea(state, area, spark);
    }
}

export function addArcOfSparks(this: void,
    state: GameState, area: AreaInstance,
    [x, y]: Coords, count: number, centerTheta = 0, thetaRadius = Math.PI / 4,
    extraProps?: Partial<Props>
): void {
    for (let i = 0; i < count; i++) {
        const theta = count === 1
            ? centerTheta
            : centerTheta - thetaRadius + i * 2 * thetaRadius / (count - 1);
        const dx = Math.cos(theta);
        const dy = Math.sin(theta);
        const spark = new Spark({
            x,
            y,
            vx: 4 * dx,
            vy: 4 * dy,
            ttl: 1000,
            ...extraProps,
        });
        addEffectToArea(state, area, spark);
    }
}
