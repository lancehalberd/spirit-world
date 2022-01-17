import { removeEffectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { hitTargets } from 'app/utils/field';

import {
    AreaInstance, DrawPriority, EffectInstance,
    Frame, GameState,
} from 'app/types';

interface Props {
    x: number,
    y: number,
    z?: number,
    damage?: number,
    vx?: number,
    vy?: number,
    vz?: number,
    az?: number,
    ttl?: number,
}

export class Spark implements EffectInstance, Props {
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
    az: number;
    radius: number = 3;
    animationTime = 0;
    speed = 0;
    ttl: number;
    constructor({x, y, z = 0, vx = 0, vy = 0, vz = 0, az = -0.3, damage = 1, ttl = 2000}: Props) {
        this.damage = damage;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.az = az;
        this.ttl = ttl;
    }
    update(state: GameState) {
        this.x += this.vx;
        this.y += this.vy;
        this.z = Math.max(0, this.z + this.vz);
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
        context.fillStyle = 'yellow';
        context.save();
            context.globalAlpha *= 0.6;
            context.fillRect(this.x - this.radius, this.y - this.radius - this.z, 2 * this.radius, 2 * this.radius);
        context.restore();
        context.beginPath();
        context.strokeStyle = 'yellow';
        context.lineWidth = 2;
        context.moveTo(this.x - 2 * this.vx, this.y - 2 * this.vy);
        context.lineTo(this.x + 2 * this.vx, this.y + 2 * this.vy);
        context.stroke();
    }
}
