import { removeObjectFromArea } from 'app/content/areas';
import { EXPLOSION_RADIUS, FRAME_LENGTH } from 'app/gameConstants';
//import { drawFrame, getFrame } from 'app/utils/animations';
import { getDirection } from 'app/utils/field';

import { AreaInstance, GameState, ObjectInstance, ObjectStatus } from 'app/types';


interface Props {
    x?: number
    y?: number,
}

const duration = 500;

export class CloneExplosionEffect implements ObjectInstance {
    area: AreaInstance;
    definition = null;
    animationTime: number;
    destroyedObjects: boolean = false;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    constructor({x = 0, y = 0 }: Props) {
        this.animationTime = 0;
        this.x = x;
        this.y = y;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        const r = EXPLOSION_RADIUS * Math.max(0.25, Math.min(1, 2 * this.animationTime / duration));
        if (!this.destroyedObjects && r >= EXPLOSION_RADIUS) {
            this.destroyedObjects = true;
            // Destroy destructible tiles like bushes/thorns (calc min/max row, min/max col then test each tile)
            const hitObjects: ObjectInstance[] = [];
            for (const object of this.area.objects) {
                if (!object.getHitbox) {
                    continue;
                }
                const hitbox = object.getHitbox(state);
                const r = (hitbox.w + hitbox.h) / 4;
                const dx = this.x - hitbox.x - hitbox.w / 2;
                const dy = this.y - hitbox.y - hitbox.h / 2;
                const distance = Math.sqrt(dx*dx+dy*dy);
                if (distance - r < EXPLOSION_RADIUS) {
                    hitObjects.push(object);
                }
            }
            for (const object of hitObjects) {
                const hitbox = object.getHitbox(state);
                const dx = this.x - hitbox.x - hitbox.w / 2;
                const dy = this.y - hitbox.y - hitbox.h / 2;
                if (object.onDestroy) {
                    object.onDestroy(state, -dx, -dy);
                } else if (object.behaviors?.destructible) {
                    removeObjectFromArea(state, object);
                } else if (object.onHit) {
                    object.onHit(state, { damage: 4, direction: getDirection(-dx, -dy) });
                }
            }
        }
        if (this.animationTime > duration) {
            removeObjectFromArea(state, this);
        }
    }
    render(context, state: GameState) {
        const r = EXPLOSION_RADIUS * Math.max(0.25, Math.min(1, 2 * this.animationTime / duration));
        context.beginPath();
        context.arc(this.x, this.y, r, 0, 2 * Math.PI);
        context.fillStyle = 'red';
        context.fill();
        //const frame = getFrame(this.animation, this.animationTime);
        //drawFrame(context, frame, { ...frame, x: this.x, y: this.y - this.z });
    }
}

