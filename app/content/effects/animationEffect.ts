import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, frameAnimation, getFrame } from 'app/utils/animations';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import Random from 'app/utils/Random';

import {
    AreaInstance, DrawPriority, EffectInstance, Frame, FrameAnimation, FrameDimensions,
    GameState, MagicElement, ObjectInstance, Rect, TileBehaviors,
} from 'app/types';


interface AnimationProps {
    animation: FrameAnimation
    drawPriority?: DrawPriority
    alpha?: number
    friction?: number
    x?: number
    y?: number
    z?: number
    vx?: number
    vy?: number
    vz?: number
    vstep?: number
    ax?: number
    ay?: number
    az?: number
    rotation?: number
    scale?: number
    ttl?: number
    delay?: number
    target?: ObjectInstance | EffectInstance
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
    friction = 0;
    isEffect = <const>true;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    vstep: number;
    ax: number;
    ay: number;
    az: number;
    rotation: number;
    scale: number;
    target?: ObjectInstance | EffectInstance;
    ttl: number;
    constructor({
        animation, drawPriority = 'background',
        x = 0, y = 0, z = 0, vx = 0, vy = 0, vz = 0, vstep = 0,
        ax = 0, ay = 0, az = 0,
        rotation = 0, scale = 1, alpha = 1,
        friction = 0,
        target, ttl, delay = 0
     }: AnimationProps) {
        this.animation = animation;
        this.animationTime = 0;
        this.drawPriority = drawPriority;
        this.friction = friction;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.vstep = vstep;
        this.ax = ax;
        this.ay = ay;
        this.az = az;
        this.rotation = rotation;
        this.scale = scale;
        this.alpha = alpha;
        this.ttl = ttl;
        this.delay = delay;
        this.behaviors = {};
        this.target = target;
    }
    getHitbox(state: GameState) {
        const frame = getFrame(this.animation, this.animationTime);
        const originX = this.target?.x || 0, originY = (this.target?.y || 0) - (this.target?.z || 0);
        return {x: originX + this.x, y: originY + this.y - this.z, w: frame.w, h: frame.h};
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
        this.vx += this.ax;
        this.vy += this.ay;
        this.vz += this.az;
        if (this.friction) {
            this.vx *= (1 - this.friction);
            this.vy *= (1 - this.friction);
            this.vz *= (1 - this.friction);
        }
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
        const originX = this.target?.x || 0, originY = (this.target?.y || 0) - (this.target?.z || 0);
        if (this.rotation) {
            const w = frame.content?.w || frame.w;
            const h = frame.content?.h || frame.h;
            context.translate(
                originX + this.x + w / 2 * this.scale,
                originY + this.y - this.z + h / 2 * this.scale
            );
            context.rotate(this.rotation);
            drawFrame(context, frame, { ...frame,
                x: -(frame.w / 2 + (frame.content?.x || 0)) * this.scale,
                y: -(frame.h / 2 + (frame.content?.y || 0)) * this.scale,
                w: frame.w * this.scale,
                h: frame.h * this.scale,
            });
        } else {
            drawFrame(context, frame, { ...frame,
                x: originX + this.x - (frame.content?.x || 0),
                y: originY + this.y - (frame.content?.y || 0) - this.z,
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
    state: GameState, area: AreaInstance, x: number, y: number, z: number, particles: Frame[],
    behaviors?: TileBehaviors, radius = 1
): void {
    if (!particles) {
        return;
    }
    const numParticles = behaviors?.numberParticles ?? 3;
    let theta = Math.random() * 2 * Math.PI;
    for (let i = 0; i < numParticles; i++) {
        const frame = Random.element(particles);
        const vx = Math.cos(theta);
        const vy = Math.sin(theta);
        const particle = new AnimationEffect({
            animation: frameAnimation(frame),
            drawPriority: 'foreground',
            x: x + radius * vx - frame.w / 2, y: y + radius * vy - frame.h / 2, z,
            vx, vy, vz: 1.5, az: -0.2,
        });
        if (behaviors?.brightness) {
            particle.behaviors.brightness = behaviors.brightness;
            particle.behaviors.lightRadius = (behaviors.lightRadius || 32) / 2;
        }
        addEffectToArea(state, area, particle);
        theta += Math.PI * 2 / numParticles;
    }
}


const sparkleAnimation = createAnimation('gfx/effects/goldparticles.png', {w: 5, h: 5}, {cols: 3, duration: 4, frameMap: [2,1,0,0,1,2]}, {loop: false});
//const whiteSparkleAnimation = createAnimation('gfx/effects/aura_particles.png', {w: 10, h: 10}, {cols: 2, x: 0, duration: 6, frameMap: [0,1,0]}, {loop: false});
export const iceSparkleAnimation = createAnimation('gfx/effects/aura_particles.png', {w: 10, h: 10}, {cols: 2, x: 2, duration: 6}, {loop: false});
const fireSparkleAnimation = createAnimation('gfx/effects/aura_particles.png', {w: 10, h: 10}, {cols: 2, x: 4, duration: 6,  frameMap: [0,1,0,0]}, {loop: false});
const lightningSparkleAnimation = createAnimation('gfx/effects/aura_particles.png', {w: 10, h: 10}, {cols: 2, x: 6, duration: 6, frameMap: [0, 1, 0]}, {loop: false});

interface SparkleProps {
    delay?: number
    element?: MagicElement
    target?: ObjectInstance | EffectInstance
    velocity?: {x: number, y: number, z?: number}
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
        target,
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
        target,
        x: hitbox.x + Math.random() * hitbox.w - animation.frames[0].w / 2,
        y: hitbox.y + Math.random() * hitbox.h - animation.frames[0].h / 2,
        z: (hitbox.z || 0) + Math.random() * (hitbox.zd || 0)
    }
    if (velocity?.z) {
        animationProps.vz = velocity.z;
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

export const dustParticleAnimation = createAnimation('gfx/effects/dust_particles.png', {w: 6, h: 6}, {cols: 3, duration: 6}, {loop: false});
export const reviveParticleAnimation = createAnimation('gfx/effects/revive_particles.png', {w: 6, h: 6}, {cols: 7, duration: 6});

export function addDustBurst(
    state: GameState, area: AreaInstance, x: number, y: number, z: number
): void {
    for (let i = 0; i < 4; i++) {
        const theta = i * Math.PI / 3;
        const vx = Math.cos(theta) / 2;
        const vy = Math.sin(theta);
        const particle = new AnimationEffect({
            animation: dustParticleAnimation,
            drawPriority: 'background-special',
            x: x + vx * 8 - 3, y: y + vy * 2, z,
            vx, vy: 0, vz: 0, az: 0,
        });
        addEffectToArea(state, area, particle);
    }
}

export function addReviveBurst(
    state: GameState, area: AreaInstance, x: number, y: number, z: number
): void {
    let theta = Math.random() * 2 * Math.PI;
    for (let i = 0; i < 8; i++) {
        const vx = Math.cos(theta) / 2;
        const vy = Math.sin(theta) / 2;
        const particle = new AnimationEffect({
            animation: reviveParticleAnimation,
            drawPriority: 'foreground-special',
            x: x + vx - 3, y: y + vy - 3, z,
            vx, vy, vz: 0, az: 0.005,
            ttl: 400,
            delay: Math.random() * 400,
        });
        particle.behaviors.brightness = 1
        particle.behaviors.lightRadius = 8;
        addEffectToArea(state, area, particle);
        theta += Math.PI * 2 / 8;
    }
}


export function addParticleSpray(
    state: GameState, area: AreaInstance, frameOrAnimation: FrameAnimation | Frame, x: number, y: number, z: number
): void {
    const theta = Math.random() * 2 * Math.PI;
    const vx = Math.cos(theta);
    const vy = Math.sin(theta) / 2;
    let animation: FrameAnimation;
    if (!(frameOrAnimation as FrameAnimation).duration) {
        animation = frameAnimation(frameOrAnimation as Frame);
    } else {
        animation = frameOrAnimation as FrameAnimation;
    }
    const particle = new AnimationEffect({
        animation: animation as FrameAnimation,
        drawPriority: 'sprites',
        x: x + vx, y: y + vy, z,
        vx, vy, vz: 2, az: -0.8,
        ttl: 600,
    });
    // center the particle.
    particle.x -= (animation.frames[0].content?.w || animation.frames[0].w) / 2;
    particle.y -= (animation.frames[0].content?.h || animation.frames[0].h) / 2;
    addEffectToArea(state, area, particle);
}

const fallGeometry: FrameDimensions = {w: 24, h: 24, content: {x: 4, w: 16, y: 4, h: 16}};
export const objectFallAnimation: FrameAnimation = createAnimation('gfx/effects/enemyfall.png', fallGeometry, { cols: 10, duration: 4}, { loop: false });
const splashGeometry: FrameDimensions = {w: 22, h: 20, content: {x: 3, w: 16, y: 2, h: 16}};
export const splashAnimation: FrameAnimation = createAnimation('gfx/effects/watersplash.png', splashGeometry, { cols: 8, duration: 5}, { loop: false });
const enemyFallGeometry: FrameDimensions = {w: 20, h: 22, content: {x: 2, w: 16, y: 3, h: 16}};
export const enemyFallAnimation: FrameAnimation = createAnimation('gfx/effects/enemyfall2.png', enemyFallGeometry, { cols: 13, duration: 5}, { loop: false });
