import { CrystalSpike } from 'app/content/effects/arrow';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { removeEffectFromArea } from 'app/utils/effects';
import { rectanglesOverlap } from 'app/utils/index';
import { getVectorToNearestTargetOrRandom } from 'app/utils/target';


interface Props {
    x?: number
    y?: number,
    damage?: number,
    delay?: number,
}

const growingAnimations = [
    createAnimation('gfx/effects/crystalpod.png', {w: 48, h: 48}, {x: 0, cols: 2, duration: 10}),
    createAnimation('gfx/effects/crystalpod.png', {w: 48, h: 48}, {x: 2, cols: 2, duration: 10}),
    createAnimation('gfx/effects/crystalpod.png', {w: 48, h: 48}, {x: 4, cols: 2, duration: 10}),
    createAnimation('gfx/effects/crystalpod.png', {w: 48, h: 48}, {x: 5, cols: 2, duration: 10}),
    createAnimation('gfx/effects/crystalpod.png', {w: 48, h: 48}, {x: 8, cols: 2, duration: 10}),
    createAnimation('gfx/effects/crystalpod.png', {w: 48, h: 48}, {x: 8, cols: 2, duration: 5, frameMap: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1]}),
];
const burstAnimation = createAnimation('gfx/effects/crystalpod.png', {w: 48, h: 48},
    {x: 12, cols: 5, duration: 5, frameMap: [0, 1, 2, 3, 4, 4, 5, 6]}, {loop: false});

const growDuration = growingAnimations.reduce((sum, animation) => sum + animation.duration, 0);
const fadeDuration = burstAnimation.duration;

export class SpikePod implements EffectInstance, Props {
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
    w: number = 16;
    h: number = 16;
    shockWaves: number;
    shockWaveTheta: number;
    animationTime = 0;
    hasBurst: boolean = false;
    isEnemyTarget: boolean = true;
    constructor({x = 0, y = 0, damage = 2}: Props) {
        this.x = x - this.w / 2;
        this.y = y - this.h / 2;
        this.damage = damage;
    }
    getHitbox(state: GameState) {
        return this;
    }
    burst(state: GameState, theta: number, reflected = false) {
        if (this.hasBurst) {
            return;
        }
        let r = Math.PI / 5;
        if (reflected) {
            theta += Math.PI;
            r = Math.PI / 6;
        }
        for (let i = 0; i < 5; i++) {
            const dx = Math.cos(theta + i * r - 2 * r);
            const dy = Math.sin(theta + i * r - 2 * r);
            CrystalSpike.spawn(state, this.area, {
                delay: 100,
                x: this.x + this.w / 2 + this.w / 4 * dx,
                y: this.y + this.h / 2 + this.h / 4 * dy,
                damage: this.damage,
                vx: 4 * dx,
                vy: 4 * dy,
                reflected
            });
        }
        // Reset animation time for the fade animation.
        this.hasBurst = true;
        this.animationTime = 0;
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        const {x, y} = getVectorToNearestTargetOrRandom(state, this, [state.hero]);
        this.burst(state, Math.atan2(y, x), true);
        return {};
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (!this.hasBurst) {
            for (const effect of this.area.effects) {
                if (effect !== this && effect instanceof SpikePod && !effect.hasBurst) {
                    if (rectanglesOverlap(effect, this)) {
                        if (this.x < effect.x) this.x--;
                        else this.x++;
                        if (this.y < effect.y) this.y--;
                        else this.y++;
                    }
                }
            }
            if (this.animationTime >= growDuration) {
                const {x, y} = getVectorToNearestTargetOrRandom(state, this, this.area.allyTargets);
                this.burst(state, Math.atan2(y, x));
            }
            return;
        } else if (this.animationTime >= fadeDuration) {
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // context.fillStyle = 'red';
        // context.fillRect(this.x, this.y, this.w, this.h);
        let frame: Frame;
        if (!this.hasBurst) {
            let animationTime = this.animationTime;
            for (const animation of growingAnimations) {
                if (animationTime < animation.duration) {
                    frame = getFrame(animation, animationTime);
                    break;
                }
                animationTime -= animation.duration;
            }
        } else {
            frame = getFrame(burstAnimation, this.animationTime);
        }
        if (!frame) {
            return;
        }
        drawFrame(context, frame, {...frame, x: this.x + this.w / 2 - frame.w / 2, y: this.y + this.h / 2 - frame.h / 2});
    }
}
