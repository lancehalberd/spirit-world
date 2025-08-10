import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, frameAnimation, getFrame } from 'app/utils/animations';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { getCompositeBehaviors } from 'app/utils/getBehaviors'
import { rectanglesOverlap } from 'app/utils/index';
import Random from 'app/utils/Random';



interface AnimationProps {
    animation: FrameAnimation
    drawPriority?: DrawPriority
    drawPriorityIndex?: number;
    alpha?: number
    // If defined, animations will be removed if they are outside of this box.
    boundingBox?: Rect
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
    // If set to true it will adjust the coords to center the first frame of the animation.
    centerOnPoint?: boolean
    update?: (state: GameState, effect: FieldAnimationEffect) => void
}

export class FieldAnimationEffect implements EffectInstance {
    alpha = 1
    area: AreaInstance;
    boundingBox: Rect;
    delay: number = 0;
    done = false;
    drawPriority: DrawPriority;
    drawPriorityIndex?: number;
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
    checkToCull?: (state: GameState) => boolean;
    onUpdate: (state: GameState, effect: FieldAnimationEffect) => void
    constructor({
        animation, boundingBox, drawPriority = 'background', drawPriorityIndex,
        x = 0, y = 0, z = 0, vx = 0, vy = 0, vz = 0, vstep = 0,
        ax = 0, ay = 0, az = 0,
        rotation = 0, scale = 1, alpha = 1,
        friction = 0,
        target, ttl, delay = 0, centerOnPoint = false, update
     }: AnimationProps) {
        this.animation = animation;
        this.animationTime = 0;
        this.boundingBox = boundingBox;
        this.drawPriority = drawPriority;
        this.drawPriorityIndex = drawPriorityIndex;
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
        this.onUpdate = update;
        if (centerOnPoint) {
            const hitbox = this.getHitbox();
            this.x -= hitbox.w / 2;
            this.y -= hitbox.h / 2;
        }
    }
    getHitbox() {
        const frame = getFrame(this.animation, this.animationTime);
        const originX = this.target?.x || 0, originY = (this.target?.y || 0) - (this.target?.z || 0);
        return {x: originX + this.x, y: originY + this.y - this.z, w: frame.content?.w ?? frame.w, h: frame.content?.h ?? frame.h};
    }
    // Returns the hitbox relative to the ground (does not subtract z from the y value).
    getGroundHitbox() {
        const frame = getFrame(this.animation, this.animationTime);
        const originX = this.target?.x || 0, originY = (this.target?.y || 0) - (this.target?.z || 0);
        return {x: originX + this.x, y: originY + this.y, w: frame.content?.w ?? frame.w, h: frame.content?.h ?? frame.h};
    }
    getYDepth() {
        const frame = getFrame(this.animation, this.animationTime);
        const originY = (this.target?.y || 0);
        return originY + this.y + frame.h;
    }
    update(state: GameState) {
        if (this.onUpdate) {
            this.onUpdate(state, this);
        }
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
        if (this.boundingBox && !rectanglesOverlap(this.boundingBox, this.getGroundHitbox())) {
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
        drawFrame(context, frame, { ...frame,
            x: originX + this.x - (frame.content?.x || 0),
            y: originY + this.y - (frame.content?.y || 0) - this.z,
            w: frame.w * this.scale,
            h: frame.h * this.scale,
        });
        // Rotation is currently disabled as it causes pixels from adjacent frames to be drawn.
        // If we really want to support it, we would need to add at least 1px padding between frames
        // or make sure to load rotated sprites from isolated sources.
        /*if (this.rotation) {
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
        }*/
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
    let remainingParticles = [...particles];
    for (let i = 0; i < numParticles; i++) {
        if (!remainingParticles.length) {
            remainingParticles = [...particles];
        }
        const frame = Random.removeElement(remainingParticles);
        const vx = Math.cos(theta);
        const vy = Math.sin(theta);
        const particle = new FieldAnimationEffect({
            animation: frameAnimation(frame),
            drawPriority: 'foreground',
            x: x + radius * vx - (frame.content?.w ?? frame.w) / 2, y: y + radius * vy - (frame.content?.h ?? frame.h) / 2, z,
            vx, vy, vz: 1.5, az: -0.2,
        });
        if (behaviors?.brightness) {
            particle.behaviors.brightness = behaviors.brightness;
            particle.behaviors.lightRadius = (behaviors.lightRadius || 32) / 2;
            particle.behaviors.lightColor = behaviors.lightColor;
        }
        addEffectToArea(state, area, particle);
        theta += Math.PI * 2 / numParticles;
    }
}


const sparkleAnimation = createAnimation('gfx/effects/goldparticles.png', {w: 5, h: 5}, {cols: 3, duration: 4, frameMap: [2,1,0,0,1,2]}, {loop: false});
//const whiteSparkleAnimation = createAnimation('gfx/effects/aura_particles.png', {w: 10, h: 10}, {cols: 2, x: 0, duration: 6, frameMap: [0,1,0]}, {loop: false});
export const iceSparkleAnimation = createAnimation('gfx/effects/aura_particles.png', {w: 10, h: 10}, {cols: 2, x: 2, duration: 6, frameMap: [0, 1, 0]}, {loop: false});
const fireSparkleAnimation = createAnimation('gfx/effects/aura_particles.png', {w: 10, h: 10}, {cols: 2, x: 4, duration: 6,  frameMap: [0,1,0,0]}, {loop: false});
const lightningSparkleAnimation = createAnimation('gfx/effects/aura_particles.png', {w: 10, h: 10}, {cols: 2, x: 6, duration: 6, frameMap: [0, 1, 0]}, {loop: false});
// window['debugCanvas'](fireSparkleAnimation.frames[0], 5);


export const burstAnimation = createAnimation('gfx/effects/45radiusburst.png', {w: 90, h: 90}, {cols: 9, duration: 2}, {loop: false});

interface SparkleProps {
    delay?: number
    element?: MagicElement
    target?: ObjectInstance | EffectInstance
    velocity?: {x: number, y: number, z?: number}
    friction?: number
    z?: number
}

export function addSparkleAnimation(
    state: GameState, area: AreaInstance, hitbox: Rect, sparkleProps: SparkleProps, overrideProps: Partial<AnimationProps> = null,
): FieldAnimationEffect {
    const sparkle = makeSparkleAnimation(state, hitbox, sparkleProps, overrideProps);
    addEffectToArea(state, area, sparkle);
    return sparkle;
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
    }: SparkleProps,
    overrideProps: Partial<AnimationProps> = null,
): FieldAnimationEffect {
    const animation = element
        ? {
            fire: fireSparkleAnimation,
            ice: iceSparkleAnimation,
            lightning: lightningSparkleAnimation,
        }[element] : sparkleAnimation;
    let animationProps: AnimationProps = {
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
        animationProps.az = 0.08;
        animationProps.vz = 0.2 + Math.random() / 4;
        animationProps.vx = 0.8 * Math.random() - 0.4;
        animationProps.friction = 0.05;
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
    if (overrideProps) {
        animationProps = {
            ...animationProps,
            ...overrideProps,
        };
    }
    const effect = new FieldAnimationEffect(animationProps);
    if (element === 'fire') {
        effect.behaviors.brightness = 0.4;
        effect.behaviors.lightRadius = 24;
        effect.behaviors.lightColor = {r: 255, g: 0, b: 0};
    } else if (element === 'lightning') {
        effect.behaviors.brightness = 0.6;
        effect.behaviors.lightRadius = 16;
        effect.behaviors.lightColor = {r: 255, g: 255, b: 0};
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
        const particle = new FieldAnimationEffect({
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
        const particle = new FieldAnimationEffect({
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
    const particle = new FieldAnimationEffect({
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


const regenerationParticles
    = createAnimation('gfx/tiles/spiritparticlesregeneration.png', {w: 4, h: 4}, {cols: 4, duration: 6}).frames;

export function addBurstParticle(
    state: GameState, area: AreaInstance,
    x: number, y: number, z: number, element: MagicElement, delay = 0
): void {
    const theta = 2 * Math.PI * Math.random();
    const vx = 1.5 * Math.cos(theta);
    const vy = 1.5 * Math.sin(theta);
    if (element === null ){
        const frame = Random.element(regenerationParticles);
        const particle = new FieldAnimationEffect({
            animation: frameAnimation(frame),
            delay,
            drawPriority: 'foreground',
            x: x - (frame.content?.w ?? frame.w) / 2 + vx,
            y: y - (frame.content?.h ?? frame.h) / 2 + vy, z,
            vx, vy, vz: 1,
            //ax: vx / 10, ay: vy / 10,
            ttl: 160,
        });
        addEffectToArea(state, area, particle);
    } else {
        addSparkleAnimation(state, area, {x, y, w: 0, h: 0},
            {
                velocity: { x: vx, y:vy, z: 1},
                element,
                z,
            }
        );
    }
}

export function addFieldAnimation(state: GameState, area: AreaInstance, animation: FrameAnimation, {x, y}: Point, props: Partial<AnimationProps> = {}): FieldAnimationEffect {
    const animationEffect = new FieldAnimationEffect({
        animation,
        drawPriority: 'background',
        drawPriorityIndex: 1,
        x, y,
        ...props,
    });
    addEffectToArea(state, area, animationEffect);
    return animationEffect;
}

export function addSplashAnimation(state: GameState, area: AreaInstance, {x, y}: Point) {
    return addFieldAnimation(state, area, splashAnimation, {x: x - 8, y: y - 8});
}
export function addObjectFallAnimation(state: GameState, area: AreaInstance, {x, y}: Point) {
    return addFieldAnimation(state, area, objectFallAnimation, {x: x - 8, y: y - 8}, {update: updateFallEffect});
}
export function addEnemyFallAnimation(state: GameState, area: AreaInstance, {x, y}: Point) {
    return addFieldAnimation(state, area, enemyFallAnimation, {x: x - 8, y: y - 8}, {update: updateFallEffect});
}
// This logic matches similar logic in updateHeroSpecialAction, but this version uses a smaller hitbox.
function updateFallEffect(state: GameState, effect: FieldAnimationEffect) {
    if (!effect.area) {
        return;
    }
    const hitbox = effect.getHitbox();
    const p = 2;
    const checkPoints = [
        {x: hitbox.x + p, y: hitbox.y + p, dx: 1, dy: 1},
        {x: hitbox.x + hitbox.w - 1 - p, y: hitbox.y + p, dx: - 1, dy: 1},
        {x: hitbox.x + p, y: hitbox.y + hitbox.h - 1 - p, dx: 1, dy: -1},
        {x: hitbox.x + hitbox.w - 1 - p, y: hitbox.y + hitbox.h - 1 - p, dx: -1, dy: -1},
    ];
    // While the hero is falling, push them around until all their check points are over actual pit tiles.
    let onPitWall = false, isOnSingleTilePit = false;
    let dx = 0, dy = 0;
    for (const p of checkPoints) {
        const behaviors = getCompositeBehaviors(state, effect.area, p, state.nextAreaInstance);
        if (behaviors.pitWall) {
            onPitWall = true;
        }
        if (behaviors.isSingleTilePit) {
            isOnSingleTilePit = true;
        }
        if (!(behaviors.pit || behaviors.cloudGround || behaviors.pitWall || behaviors.canFallUnder)) {
            dx += p.dx;
            dy += p.dy;
        }
    }
    // Pit wall tiles always push the hero south to match the perspective.
    if (onPitWall || dy > 0) {
        effect.y++;
    } else if (dy < 0) {
        effect.y--;
    } else if (isOnSingleTilePit) {
        effect.y = effect.y | 0;
        if (effect.y % 16 == 0) {
            // do nothing.
        } else if (effect.y % 16 < 8) {
            effect.y--;
        } else {
            effect.y++;
        }
    }
    if (dx > 0) {
        effect.x++;
    } else if (dx < 0) {
        effect.x--;
    } else if (isOnSingleTilePit) {
        effect.x = effect.x | 0;
        if (effect.x % 16 == 0) {
            // do nothing.
        } else if (effect.x % 16 < 8) {
            effect.x--;
        } else {
            effect.x++;
        }
    }
}

export function addBurstEffect(this: void, state: GameState, actor: Actor, area: AreaInstance = actor.area): void {
    const hitbox = actor.getHitbox();
    const animation = new FieldAnimationEffect({
        animation: burstAnimation,
        drawPriority: 'foreground',
        drawPriorityIndex: 1,
        x: hitbox.x + hitbox.w / 2 - burstAnimation.frames[0].w / 2,
        y: hitbox.y + hitbox.h / 2 - burstAnimation.frames[0].h / 2,
    });
    addEffectToArea(state, area, animation);
}

class _FieldAnimationEffect extends FieldAnimationEffect {}
declare global {
    export interface FieldAnimationEffect extends _FieldAnimationEffect {}
}
