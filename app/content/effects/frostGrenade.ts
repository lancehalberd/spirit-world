import { addObjectToArea, removeObjectFromArea } from 'app/content/areas';
import { FrostBlast } from 'app/content/effects/frostBlast';
import { FRAME_LENGTH } from 'app/gameConstants';

import { AreaInstance, Frame, GameState, ObjectInstance, ObjectStatus } from 'app/types';

interface Props {
    x: number,
    y: number,
    z?: number,
    damage?: number,
    radius?: number,
    vx: number,
    vy: number,
    vz?: number,
    az?: number,
}

export class FrostGrenade implements ObjectInstance, Props {
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
    constructor({x, y, z = 0, vx, vy, vz = 4, az = -0.3, damage = 1, radius = 32}: Props) {
        this.radius = radius
        this.damage = damage;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.az = az;
    }
    update(state: GameState) {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.vz += this.az;
        this.animationTime += FRAME_LENGTH;
        if (this.z <= 0) {
            const frostBlast = new FrostBlast({
                x: this.x,
                y: this.y,
                radius: this.radius,
                damage: this.damage,
            });
            addObjectToArea(state, this.area, frostBlast);
            removeObjectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Animate a transparent orb growing in the air
        context.fillStyle = 'white';
        context.save();
            context.globalAlpha *= 0.3;
            context.beginPath();
            const r = 3 * this.w / 4 + Math.cos(this.animationTime / 500) * this.w / 4;
            context.arc(this.x, this.y - this.z, r, 0, 2 * Math.PI);
            context.fill();
        context.restore();
        context.beginPath();
        context.arc(this.x, this.y - this.z, this.w / 2, 0, 2 * Math.PI);
        context.fill();
    }
}
