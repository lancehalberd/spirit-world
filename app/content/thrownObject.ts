import { Enemy } from 'app/content/enemy';
import { damageActor } from 'app/updateActor';
import { drawFrame } from 'app/utils/animations';
import { getDirection } from 'app/utils/field';
import { rectanglesOverlap } from 'app/utils/index';

import {Frame, GameState, ObjectInstance, ObjectStatus } from 'app/types';


interface Props {
    frame: Frame,
    x?: number
    y?: number,
    z?: number,
    vx?: number,
    vy?: number,
    vz?: number,
    damage?: number,
}

export class ThrownObject implements ObjectInstance {
    definition = null;
    type = 'thrownObject' as 'thrownObject';
    frame: Frame;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    damage;
    broken = false;
    status: ObjectStatus = 'normal';
    constructor({frame, x = 0, y = 0, z = 17, vx = 0, vy = 0, vz = 0, damage = 1 }: Props) {
        this.frame = frame;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.damage = damage;
    }
    getHitbox(state: GameState) {
        // Technically it is unrealistic to use the z-component in the hitbox, but practically
        // it seems to work a bit better to include it.
        return { ...this.frame, x: this.x, y: this.y - this.z };
    }
    update(state: GameState) {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.vz -= 0.5;
        const hitbox = this.getHitbox(state);
        for (const object of state.areaInstance.objects) {
            if (object.status !== 'normal') {
                continue;
            }
            if (object instanceof Enemy) {
                if (rectanglesOverlap(object, hitbox)) {
                    damageActor(state, object, this.damage);
                    this.breakOnImpact(state);
                }
            }
            if (object.getHitbox && object.onHit) {
                const targetHitbox = object.getHitbox(state);
                if (rectanglesOverlap(targetHitbox, hitbox)) {
                    const direction = getDirection(targetHitbox.x - hitbox.x + 8 * this.vx, targetHitbox.y - hitbox.y + 8 * this.vy);
                    object.onHit(state, direction);
                    this.breakOnImpact(state);
                }
            }
        }
        if (this.z <= 0) {
            this.breakOnImpact(state);
        }
    }
    breakOnImpact(state) {
        if (!this.broken) {
            this.broken = true;
            state.areaInstance.objects.splice(state.areaInstance.objects.indexOf(this), 1);
        }
    }
    render(context, state: GameState) {
        drawFrame(context, this.frame, { ...this.frame, x: this.x, y: this.y - this.z });
    }
}
