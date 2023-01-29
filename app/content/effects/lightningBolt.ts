import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { addRadialSparks } from 'app/content/effects/spark';
import { allTiles } from 'app/content/tiles';
import { FRAME_LENGTH } from 'app/gameConstants';
import { drawFrameAt } from 'app/utils/animations';
import { removeEffectFromArea } from 'app/utils/effects';
import { hitTargets } from 'app/utils/field';

import {
    AreaInstance, EffectInstance,
    Frame, GameState,
} from 'app/types';



interface Props {
    x?: number
    y?: number,
    damage?: number,
    delay?: number,
    shockWaves?: number,
    shockWaveTheta?: number,
}

// How long the lightning animation takes. Shockwaves are created at the end of this duration.
const LIGHTNING_ANIMATION_DURATION = FRAME_LENGTH * 6;
// How long the lightning animation persists after the animation plays.
const STRIKE_DURATION = FRAME_LENGTH * 6;
const BOLT_HEIGHT = 48;

const cloudFrames = [
    [406,407],
    [410,411],
];

export class LightningBolt implements EffectInstance, Props {
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
    radius: number = 6;
    delay: number;
    shockWaves: number;
    shockWaveTheta: number;
    animationTime = 0;
    constructor({x = 0, y = 0, damage = 2, delay = 800, shockWaves = 4, shockWaveTheta = 0}: Props) {
        this.x = x | 0;
        this.y = y | 0;
        this.delay = delay;
        this.shockWaves = shockWaves;
        this.shockWaveTheta = shockWaveTheta;
        this.damage = damage;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime === this.delay + LIGHTNING_ANIMATION_DURATION) {
            addRadialSparks(
                state, this.area, [this.x, this.y], this.shockWaves, this.shockWaveTheta
            );
        }
        if (this.animationTime < this.delay) {
            if (this.animationTime % 40 === 0) {
                addSparkleAnimation(state, this.area, {
                    x: this.x - 12,
                    y: this.y - 12 - BOLT_HEIGHT,
                    w: 24,
                    h: 24,
                }, { element: 'lightning' });
            }
        } else if (this.animationTime < this.delay + LIGHTNING_ANIMATION_DURATION) {
            const h = BOLT_HEIGHT * Math.min(1, (this.animationTime - this.delay) / LIGHTNING_ANIMATION_DURATION);
            addSparkleAnimation(state, this.area, {
                x: this.x - 2,
                y: this.y - BOLT_HEIGHT + h,
                w: 4,
                h: 4,
            }, { element: 'lightning' });
        } else if (this.animationTime >= this.delay + LIGHTNING_ANIMATION_DURATION) {
            addSparkleAnimation(state, this.area, {
                x: this.x - 2,
                y: this.y - 2,
                w: 4,
                h: 4,
            }, { element: 'lightning' });
            hitTargets(state, this.area, {
                damage: this.damage,
                hitCircle: {x: this.x, y: this.y, r: this.radius},
                knockAwayFrom: {x: this.x, y: this.y},
                element: 'lightning',
                hitAllies: true,
            });
        }
        if (this.animationTime >= this.delay + LIGHTNING_ANIMATION_DURATION + STRIKE_DURATION) {
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Animate a transparent orb growing in the air
        if (this.animationTime < this.delay + 100) {
            context.save();
                context.globalAlpha *= (0.4 + Math.min(0.4, 0.4 * this.animationTime / this.delay));
                /*context.fillStyle = 'yellow';
                const r = 10 * Math.min(1, this.animationTime / this.delay);
                context.beginPath();
                context.arc(this.x + this.w / 2, this.y + this.h / 2 - 48, r, 0, 2 * Math.PI);
                context.fill();*/
                for (let ty = 0; ty < 2; ty++) {
                    for (let tx = 0; tx < 2; tx++) {
                        const tile = allTiles[cloudFrames[ty][tx]];
                        if (tile) {
                            drawFrameAt(context, tile.frame, {
                                x: this.x - 16 + 16 * tx,
                                y: this.y - BOLT_HEIGHT - 16 + 16 * ty,
                            });
                        }
                    }
                }
            context.restore();
        }
        if (this.animationTime < this.delay) {
            return;
        }
        // Animate the bolt coming down
        /*const h = BOLT_HEIGHT * Math.min(1, (this.animationTime - this.delay) / LIGHTNING_ANIMATION_DURATION);
        context.fillStyle = 'yellow';
        context.fillRect(this.x - 1, this.y - BOLT_HEIGHT, 2, h);
        if (this.animationTime < this.delay + LIGHTNING_ANIMATION_DURATION) {
            return;
        }*/
        // Animate the strike point
        /*context.beginPath();
        context.fillStyle = 'yellow';
        context.arc(this.x, this.y, 6, 0, 2 * Math.PI);
        context.fill();*/
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        if (this.animationTime <= this.delay) {
            context.save();
                context.globalAlpha *= 0.5;
                context.fillStyle = 'yellow';
                context.beginPath();
                context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
                context.fill();
            context.restore();
        }
    }
}
