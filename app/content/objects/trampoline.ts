import { objectHash } from 'app/content/objects/objectHash';
import { PushPullObject } from 'app/content/objects/pushPullObject';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrameAt } from 'app/utils/animations';

const trampolineAnimation = createAnimation('gfx/objects/bouncyObject.png', {w: 16, h: 32, content: {x: 0, y: 16, w: 16, h: 16}}, {cols: 2, duration: 20});

export class Trampoline extends PushPullObject implements ObjectInstance {
    behaviors = {
        solid: true,
        midHeight: true,
    };
    animationTime = 0;
    lastBounceTime = 0;
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        // Move for `pushAmount` pixels after getting hit by a projectile.
        if (this.pushAmount > 0) {
            this.pushAmount--;
            if (!this.move(state, this.pushDirection)) {
                this.pushAmount = 0;
            }
        }
    }
    // The bouncy part of the trampoline is 16px above the base that you push around.
    getBounceHitbox(): Rect {
        return {x: this.x, y: this.y - 16, w: 16, h: 12};
    }
    getFrameHitbox(): Rect {
        return {x: this.x, y: this.y - 16, w: 16, h: 32};
    }
    render(context, state: GameState) {
        const frame = (state.fieldTime - this.lastBounceTime) < 200 ? trampolineAnimation.frames[0] : trampolineAnimation.frames[1];
        drawFrameAt(context, frame, { x: this.x, y: this.y - this.z});
    }
}
objectHash.trampoline = Trampoline;

class _Trampoline extends Trampoline {}
declare global {
    export interface Trampoline extends _Trampoline {}
}
