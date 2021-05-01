import { removeObjectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { damageActor } from 'app/updateActor';
import { directionMap } from 'app/utils/field';
import { rectanglesOverlap } from 'app/utils/index';

import { AreaInstance, Clone, DrawPriority, Frame, GameState, ObjectInstance, ObjectStatus } from 'app/types';

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

export class Flame implements ObjectInstance, Props {
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
    az: number;
    w: number = 12;
    h: number = 12;
    radius: number;
    animationTime = 0;
    status: ObjectStatus = 'normal';
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
    checkForHits(state: GameState) {
        for (const object of this.area.objects) {
            if (!(object instanceof Clone)) {
                continue;
            }
            if (rectanglesOverlap(object, this)) {
                damageActor(state, object, this.damage);
            }
        }
        if (rectanglesOverlap(state.hero, this)) {
            damageActor(state, state.hero, this.damage, {
                vx: - 4 * directionMap[state.hero.d][0],
                vy: - 4 * directionMap[state.hero.d][1],
                vz: 2,
            });
        }
    }
    update(state: GameState) {
        this.x += this.vx;
        this.y += this.vy;
        this.z = Math.max(0, this.z + this.vz);
        this.vz = Math.max(-8, this.vz + this.az);
        this.animationTime += FRAME_LENGTH;

        if (this.animationTime >= this.ttl) {
            removeObjectFromArea(state, this);
        } else {
            this.checkForHits(state);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Sold red circle in a transparent rectangle
        context.fillStyle = 'red';
        context.save();
            context.globalAlpha = 0.6;
            context.fillRect(this.x, this.y - this.z, this.w, this.h);
        context.restore();
        context.beginPath();
        context.arc(
            this.x + this.w / 2,
            this.y + this.h / 2 - this.z - 5 + 1 * Math.cos(this.animationTime / 120),
            this.w / 3, 0, 2 * Math.PI
        );
        context.fill();
    }
}
