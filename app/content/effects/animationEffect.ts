import { addEffectToArea, removeEffectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, frameAnimation, getFrame } from 'app/utils/animations';

import {
    AreaInstance, DrawPriority, EffectInstance, Frame, FrameAnimation,
    GameState, MagicElement, Rect, TileBehaviors,
} from 'app/types';


interface AnimationProps {
    animation: FrameAnimation
    drawPriority?: DrawPriority
    alpha?: number
    x?: number
    y?: number
    z?: number
    vx?: number
    vy?: number
    vz?: number
    vstep?: number
    az?: number
    rotation?: number
    scale?: number
    ttl?: number
    delay?: number
}

export class AnimationEffect implements EffectInstance {
    alpha = 1
    area: AreaInstance;
    delay: number = 0;
    done = false;
    drawPriority: DrawPriority;
    animation: FrameAnimation;
    animationTime: number;
    behaviors: TileBehaviors;
    isEffect = <const>true;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    vstep: number;
    az: number;
    rotation: number;
    scale: number;
    ttl: number;
    constructor({
        animation, drawPriority = 'background',
        x = 0, y = 0, z = 0, vx = 0, vy = 0, vz = 0, vstep = 0, az = 0,
        rotation = 0, scale = 1, alpha = 1,
        ttl, delay = 0
     }: AnimationProps) {
        this.animation = animation;
        this.animationTime = 0;
        this.drawPriority = drawPriority;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.vstep = vstep;
        this.az = az;
        this.rotation = rotation;
        this.scale = scale;
        this.alpha = alpha;
        this.ttl = ttl;
        this.delay = delay;
        this.behaviors = {};
    }
    getHitbox(state: GameState) {
        const frame = getFrame(this.animation, this.animationTime);
        return {x: this.x, y: this.y - this.z, w: frame.w, h: frame.h};
    }
    update(state: GameState) {
        if (this.delay > 0) {
            this.delay -= FRAME_LENGTH;
            return;
        }
        this.animationTime += FRAME_LENGTH;
        if (!this.vstep || this.animationTime % this.vstep === 0) {
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;
        }
        this.vz += this.az;
        if (this.behaviors.brightness > 0) {
            this.behaviors.brightness *= 0.9;
        }
        if (this.animationTime > this.ttl || this.z < 0 || (this.animation.loop === false && this.animationTime >= this.animation.duration)) {
            this.done = true;
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.delay > 0) {
            return;
        }
        const frame = getFrame(this.animation, this.animationTime);
        if (this.rotation || this.alpha < 1) {
            context.save();
        }
        if (this.alpha < 1) {
            context.globalAlpha *= this.alpha;
        }
        if (this.rotation) {
            context.translate(this.x + frame.w / 2, this.y - this.z + frame.h / 2);
            context.rotate(this.rotation);
            drawFrame(context, frame, { ...frame,
                x: -frame.w / 2, y: -frame.h / 2,
                w: frame.w * this.scale,
                h: frame.h * this.scale,
            });
        } else {
            drawFrame(context, frame, { ...frame,
                x: this.x, y: this.y - this.z,
                w: frame.w * this.scale,
                h: frame.h * this.scale,
            });
        }
        if (this.rotation || this.alpha < 1) {
            context.restore();
        }
    }
}

export function addParticleAnimations(
    state: GameState, area: AreaInstance, x: number, y: number, z: number, particles: Frame[], behaviors?: TileBehaviors
): void {
    if (!particles) {
        return;
    }
    let theta = Math.random() * 2 * Math.PI;
    for (const frame of particles) {
        const vx = Math.cos(theta);
        const vy = Math.sin(theta);
        const particle = new AnimationEffect({
            animation: frameAnimation(frame),
            drawPriority: 'foreground',
            x: x + vx, y: y + vy, z,
            vx, vy, vz: 1.5, az: -0.2,
        });
        if (behaviors?.brightness) {
            particle.behaviors.brightness = behaviors.brightness;
            particle.behaviors.lightRadius = (behaviors.lightRadius || 32) / 2;
        }
        addEffectToArea(state, area, particle);
        theta += Math.PI * 2 / (particles.length);
    }
}


const sparkleAnimation = createAnimation('gfx/effects/goldparticles.png', {w: 5, h: 5}, {cols: 3, duration: 4, frameMap: [2,1,0,0,1,2]}, {loop: false});
//const whiteSparkleAnimation = createAnimation('gfx/effects/aura_particles.png', {w: 10, h: 10}, {cols: 2, x: 0, duration: 6, frameMap: [0,1,0]}, {loop: false});
const iceSparkleAnimation = createAnimation('gfx/effects/aura_particles.png', {w: 10, h: 10}, {cols: 2, x: 2, duration: 6}, {loop: false});
const fireSparkleAnimation = createAnimation('gfx/effects/aura_particles.png', {w: 10, h: 10}, {cols: 2, x: 4, duration: 6,  frameMap: [0,1,0,0]}, {loop: false});
const lightningSparkleAnimation = createAnimation('gfx/effects/aura_particles.png', {w: 10, h: 10}, {cols: 2, x: 6, duration: 6, frameMap: [0, 1, 0]}, {loop: false});

interface SparkleProps {
    delay?: number
    element?: MagicElement
    velocity?: {x: number, y: number}
    z?: number
}

export function addSparkleAnimation(
    state: GameState, area: AreaInstance, hitbox: Rect, sparkleProps: SparkleProps
): void {
    addEffectToArea(state, area, makeSparkleAnimation(state, hitbox, sparkleProps));
}
export function makeSparkleAnimation(
    state: GameState,
    hitbox: Rect,
    {
        delay,
        element,
        velocity,
        z,
    }: SparkleProps
): AnimationEffect {
    const animation = element
        ? {
            fire: fireSparkleAnimation,
            ice: iceSparkleAnimation,
            lightning: lightningSparkleAnimation,
        }[element] : sparkleAnimation;
    const animationProps: AnimationProps = {
        animation: animation,
        delay,
        drawPriority: 'foreground',
        x: hitbox.x + Math.random() * hitbox.w - animation.frames[0].w / 2,
        y: hitbox.y + Math.random() * hitbox.h - animation.frames[0].h / 2,
        z: (hitbox.z || 0) + Math.random() * (hitbox.zd || 0)
    }
    if (element === 'fire') {
        animationProps.vz = 0.3 + Math.random() / 2;
        animationProps.vx = 0.8 * Math.random() - 0.4;
    }
    if (element === 'lightning') {
        animationProps.rotation = ((Math.random() * 4) | 0) / 4 * 2 * Math.PI;
        animationProps.vx = (Math.random() - 0.5) * 8;
        animationProps.vy = (Math.random() - 0.5) * 8;
        animationProps.vstep = FRAME_LENGTH * animation.frameDuration;
        if (velocity?.x > 0) {
            animationProps.vx = 6;
        } else if (velocity?.x < 0) {
            animationProps.vx = -6;
        }
        if (velocity?.y > 0) {
            animationProps.vy = 6;
        } else if (velocity?.y < 0) {
            animationProps.vy = -6;
        }
    }
    const effect = new AnimationEffect(animationProps);
    if (element === 'fire') {
        effect.behaviors.brightness = 0.5;
        effect.behaviors.lightRadius = 40;
    } else if (element === 'lightning') {
        effect.behaviors.brightness = 1;
        effect.behaviors.lightRadius = 16;
    }
    return effect;
}
