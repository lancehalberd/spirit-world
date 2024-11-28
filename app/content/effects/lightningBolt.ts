import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { addRadialSparks } from 'app/content/effects/spark';
import { FRAME_LENGTH } from 'app/gameConstants';
import { renderLightningRay } from 'app/render/renderLightning';
import { drawFrameAt } from 'app/utils/animations';
import { removeEffectFromArea } from 'app/utils/effects';
import { hitTargets } from 'app/utils/field';
import { requireFrame } from 'app/utils/packedImages';

interface LightningBoltProps {
    x?: number
    y?: number
    vx?: number
    vy?: number
    damage?: number
    delay?: number
    strikes?: number
    shockWaveDamage?: number
    shockWaves?: number
    shockWaveTheta?: number
    // Increment shockwaveTheta by this amount each strike.
    shockWaveDelta?: number
    source: Actor
}

// How long the lightning animation takes. Shockwaves are created at the end of this duration.
const LIGHTNING_ANIMATION_DURATION = FRAME_LENGTH * 6;
// How long the lightning animation persists after the animation plays.
const STRIKE_DURATION = FRAME_LENGTH * 4;
const BOLT_HEIGHT = 48;

const smallCloudFrame = requireFrame('gfx/tiles/cloudgrey.png', {x: 48, y: 32, w: 16, h: 16});
const cloudFrame = requireFrame('gfx/tiles/cloudgrey.png', {x: 0, y: 48, w: 32, h: 32});

export class LightningBolt implements EffectInstance, LightningBoltProps {
    area: AreaInstance = null;
    isEffect = <const>true;
    isEnemyAttack = true;
    frame: Frame;
    damage = this.props.damage || 2;
    x = this.props.x | 0;
    y = this.props.y | 0;
    z: number = 0;
    vz: number = 0;
    vx: number = this.props.vx || 0;
    vy: number = this.props.vy || 0;
    radius = 6;
    delay  = Math.max(2 * (LIGHTNING_ANIMATION_DURATION + STRIKE_DURATION), this.props.delay || 800);
    shockWaves = this.props.shockWaves || 4;
    shockWaveTheta = this.props.shockWaveTheta|| 0;
    shockWaveDelta = this.props.shockWaveDelta || 0;
    strikes = this.props.strikes || 1;
    warningTime = Math.min(400, this.delay / 2);
    animationTime = 0;
    lastBolt: Point;
    totalDuration = this.strikes * this.delay + LIGHTNING_ANIMATION_DURATION + STRIKE_DURATION;
    source = this.props.source;
    constructor(public props: LightningBoltProps) {}
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        this.x += this.vx;
        this.y += this.vy;
        const strikeTime = this.animationTime % this.delay;

        // Sparks build up before the strike.
        if (strikeTime > this.delay - this.warningTime && strikeTime < this.delay - 100) {
            if (this.animationTime % 40 === 0) {
                addSparkleAnimation(state, this.area, {
                    x: -12,
                    y: -12 - BOLT_HEIGHT,
                    w: 24,
                    h: 24,
                }, { element: 'lightning', target: this });
            }
        } else if (strikeTime === 0) {
            // A lightning bolt is added at strike time.
            this.lastBolt = {x: this.x, y: this.y};
        } else if (this.lastBolt && strikeTime === LIGHTNING_ANIMATION_DURATION && this.shockWaves) {
            // The lightning bolt releases sparks when they hit.
            addRadialSparks(
                state, this.area, [this.lastBolt.x, this.lastBolt.y], this.shockWaves, this.shockWaveTheta, 4, {delay: 800, source: this.source}
            );
            this.shockWaveTheta += this.shockWaveDelta;
        }
        if (this.lastBolt && strikeTime >= LIGHTNING_ANIMATION_DURATION) {
            addSparkleAnimation(state, this.area, {
                x: this.lastBolt.x - 2,
                y: this.lastBolt.y - 2,
                w: 4,
                h: 4,
            }, { element: 'lightning' });
            hitTargets(state, this.area, {
                damage: this.damage,
                hitCircle: {x: this.x, y: this.y, r: this.radius},
                knockAwayFrom: {x: this.x, y: this.y},
                element: 'lightning',
                hitAllies: true,
                source: this.source,
            });
        }
        if (strikeTime > LIGHTNING_ANIMATION_DURATION + STRIKE_DURATION) {
            delete this.lastBolt;
        }
        if (this.animationTime > this.totalDuration) {
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.lastBolt) {
            renderLightningRay(context, {
                x1: this.lastBolt.x, y1: this.lastBolt.y - BOLT_HEIGHT,
                x2: this.lastBolt.x, y2: this.lastBolt.y, r: 4
            });
        }
        // A cloud fades in.
        if (this.animationTime < this.totalDuration) {
            context.save();
                const fadeTime = LIGHTNING_ANIMATION_DURATION + STRIKE_DURATION;
                const fadeOutPercent = Math.max(0, (this.animationTime - this.totalDuration + fadeTime) / fadeTime);
                const fadeInValue = 0.4 + 0.4 * this.animationTime / this.delay;
                const fadeOutValue = 0.8 - 0.8 * fadeOutPercent;
                const fadeValue = Math.min(fadeInValue, fadeOutValue);
                context.globalAlpha *= fadeValue;
                // Cloud is smaller when fading in/out.
                const frame = fadeValue > 0.5 ? cloudFrame : smallCloudFrame;
                drawFrameAt(context, frame, {x: this.x - frame.w / 2, y: this.y - BOLT_HEIGHT - frame.h / 2});
            context.restore();
        }
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        const strikeTime = this.animationTime % this.delay;
        if (strikeTime > LIGHTNING_ANIMATION_DURATION + STRIKE_DURATION && strikeTime <= this.delay) {
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
