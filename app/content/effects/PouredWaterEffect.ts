import { removeObjectFromArea,  } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { getTileBehaviorsAndObstacles } from 'app/utils/field';

import { AreaInstance, GameState, ObjectInstance, ObjectStatus, VineSprout } from 'app/types';

const waterDropFallAnimation = createAnimation('gfx/tiles/pod.png', {w: 16, h: 16}, {y: 3, cols: 4, duration: 8});
const waterDropHitAnimation = createAnimation('gfx/tiles/pod.png', {w: 16, h: 16}, {y: 4, cols: 3, duration: 8});

interface Props {
    x?: number
    y?: number,
}
export class PouredWaterEffect implements ObjectInstance {
    area: AreaInstance;
    definition = null;
    animationTime: number;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    hasHit = false;
    constructor({x = 0, y = 0 }: Props) {
        this.animationTime = 0;
        this.x = x;
        this.y = y;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (!this.hasHit) {
            this.y += 4;
            const { objects, tileBehavior } = getTileBehaviorsAndObstacles(
                state, this.area, {x: this.x, y: this.y},
                null, null, object => object.definition?.type === 'vineSprout'
            );
            const sprout = objects[0] as VineSprout;
            if (sprout) {
                sprout.grow(state);
                this.hasHit = true;
                this.animationTime = 0;
            } else if (!tileBehavior.solid) {
                this.hasHit = true;
                this.animationTime = 0;
            } else if (this.y > 32 * 16) {
                // Destroy the water if it drops of the bottom of the screen.
                removeObjectFromArea(state, this);
            }
        } else {
            if (this.animationTime >= waterDropHitAnimation.duration) {
                removeObjectFromArea(state, this);
            }
        }
    }
    render(context, state: GameState) {
        const frame = getFrame(this.hasHit ? waterDropHitAnimation : waterDropFallAnimation, this.animationTime);
        drawFrame(context, frame, {...frame, x: this.x, y: this.y});
    }
}
