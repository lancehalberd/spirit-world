import { addParticleAnimations } from 'app/content/animationEffect';
import { removeObjectFromArea } from 'app/content/areas';
import { drawFrame } from 'app/utils/animations';
import { hitTargets } from 'app/utils/field';

import { AreaInstance, Frame, GameState, ObjectInstance, ObjectStatus, TileBehaviors } from 'app/types';


interface Props {
    frame: Frame,
    particles?: Frame[],
    x?: number
    y?: number,
    z?: number,
    vx?: number,
    vy?: number,
    vz?: number,
    damage?: number,
}

export class ThrownObject implements ObjectInstance {
    area: AreaInstance;
    behaviors: TileBehaviors;
    definition = null;
    linkedObject: ThrownObject;
    type = 'thrownObject' as 'thrownObject';
    frame: Frame;
    particles: Frame[];
    ignorePits = true;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    damage;
    broken = false;
    status: ObjectStatus = 'normal';
    constructor({frame, particles = [], x = 0, y = 0, z = 17, vx = 0, vy = 0, vz = 0, damage = 1 }: Props) {
        this.frame = frame;
        this.particles = particles;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.damage = damage;
        this.behaviors = {};
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
        const hitResult = hitTargets(state, this.area, {
            canPush: true,
            damage: this.damage,
            hitbox: this.getHitbox(state),
            vx: this.vx,
            vy: this.vy,
            hitEnemies: true,
            hitObjects: true,
        });
        if (hitResult.hit || hitResult.blocked || this.z <= 0) {
            this.breakOnImpact(state);
        }
    }
    breakOnImpact(state) {
        if (!this.broken) {
            this.broken = true;
            addParticleAnimations(state, this.area, this.x, this.y, this.z, this.particles, this.behaviors);
            if (this.linkedObject && !this.linkedObject.broken) {
                this.linkedObject.breakOnImpact(state);
            }
            removeObjectFromArea(state, this);
        }
    }
    render(context, state: GameState) {
        drawFrame(context, this.frame, { ...this.frame, x: this.x, y: this.y - this.z });
    }
}
