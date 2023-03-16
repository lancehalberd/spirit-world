import { FRAME_LENGTH } from 'app/gameConstants';
import { renderLightningCircle, renderLightningRay } from 'app/render/renderLightning'
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { hitTargets } from 'app/utils/field';

import {
    AreaInstance, Circle, DrawPriority, EffectInstance,
    Frame, GameState, HitProperties, Point, Ray,
} from 'app/types';

interface Props {
    x: number
    y: number
    z?: number
    damage?: number
    vx?: number
    vy?: number
    vz?: number
    az?: number
    friction?: number
    ttl?: number
    hitCircle?: Circle
    hitRay?: Ray
}

export class Spark implements EffectInstance, Props {
    drawPriority: DrawPriority = 'sprites';
    area: AreaInstance = null;
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
    az: number = this.props.az ?? -0.3;
    friction = this.props.friction ?? 0;
    hitCircle: Circle;
    hitRay: Ray;
    animationTime = 0;
    ttl: number = this.props.ttl ?? 2000;
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
    getHitProperties(): HitProperties {
        const hitProperties: HitProperties = {
            damage: this.damage,
            element: 'lightning',
            hitAllies: true,
            knockAwayFrom: {x: this.x, y: this.y},
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
        this.x += this.vx;
        this.y += this.vy;
        this.z = Math.max(0, this.z + this.vz);
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
            hitTargets(state, this.area, this.getHitProperties());
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.hitRay) {
            const theta = Math.atan2(this.hitRay.y2 - this.hitRay.y1, this.hitRay.x2 - this.hitRay.x1);
            const px = 2 * Math.cos(theta);
            const py = 2 * Math.sin(theta);
            renderLightningRay(context, {
                x1: this.x + this.hitRay.x1 - px,
                y1: this.y + this.hitRay.y1 - py,
                x2: this.x + this.hitRay.x2 + px,
                y2: this.y + this.hitRay.y2 + py,
                r: this.hitRay.r + 2
            }, 1, 20);
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
}

export function addRadialSparks(this: void,
    state: GameState, area: AreaInstance,
    [x, y]: Point, count: number, thetaOffset = 0, speed = 4, damage = 1
): void {
    for (let i = 0; i < count; i++) {
        const theta = thetaOffset + i * 2 * Math.PI / count;
        const dx = Math.cos(theta);
        const dy = Math.sin(theta);
        const spark = new Spark({
            x,
            y,
            vx: speed * dx,
            vy: speed * dy,
            damage,
            ttl: 1000,
        });
        addEffectToArea(state, area, spark);
    }
}

export function addArcOfSparks(this: void,
    state: GameState, area: AreaInstance,
    [x, y]: Point, count: number, centerTheta = 0, thetaRadius = Math.PI / 4
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
        });
        addEffectToArea(state, area, spark);
    }
}
