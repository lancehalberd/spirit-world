import { removeObjectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { hitTargets } from 'app/utils/field';

import {
    AreaInstance, DrawPriority,
    Frame, GameState, ObjectInstance, ObjectStatus,
} from 'app/types';

interface Props {
    x: number,
    y: number,
    z?: number,
    damage?: number,
    ignoreTargets: Set<ObjectInstance>;
    vx?: number,
    vy?: number,
    vz?: number,
    az?: number,
    ttl?: number,
}

export class Frost implements ObjectInstance, Props {
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
    ignorePits = true;
    ignoreTargets: Set<ObjectInstance>;
    radius: number;
    animationTime = 0;
    status: ObjectStatus = 'normal';
    speed = 0;
    ttl: number;
    constructor({x, y, z = 4, vx = 0, vy = 0, vz = 0, az = -0.1, damage = 1, ttl = 400, ignoreTargets}: Props) {
        this.damage = damage;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.az = az;
        this.ttl = ttl;
        this.ignoreTargets = ignoreTargets;
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
            hitTargets(state, this.area, {
                canPush: false,
                damage: this.damage,
                hitbox: this,
                element: 'ice',
                hitAllies: true,
                hitEnemies: true,
                hitObjects: true,
                hitTiles: true,
                ignoreTargets: this.ignoreTargets,
            });
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Sold red circle in a transparent rectangle
        context.fillStyle = 'white';
        context.save();
            context.beginPath();
            context.globalAlpha *= 0.6;
            context.arc(
                this.x + this.w / 2,
                this.y + this.h / 2 - this.z,
                this.w / 2, 0, 2 * Math.PI
            );
            context.fill();
        context.restore();
    }
}