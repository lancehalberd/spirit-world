import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { FRAME_LENGTH } from 'app/gameConstants';
import { playAreaSound } from 'app/musicController';
import { createAnimation, drawFrameAt, getFrame } from 'app/utils/animations';
import { getDirection, hitTargets } from 'app/utils/field';
import { getAreaSize } from 'app/utils/getAreaSize';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';

import {
    AreaInstance, Direction, DrawPriority, EffectInstance, Frame, FrameAnimation,
    GameState, HitProperties, MagicElement, ObjectInstance,
} from 'app/types';

const upGeometry = {w: 16, h: 16, content: {x: 4, y: 0, w: 7, h: 5}};
const downGeometry = {w: 16, h: 16, content: {x: 4, y: 11, w: 7, h: 5}};
const leftGeometry = {w: 16, h: 16, content: {x: 0, y: 4, w: 5, h: 7}};
const rightGeometry = {w: 16, h: 16, content: {x: 11, y: 4, w: 5, h: 7}};
const dlGeometry = {w: 16, h: 16, content: {x: 0, y: 10, w: 6, h: 6}};
const drGeometry = {w: 16, h: 16, content: {x: 10, y: 10, w: 6, h: 6}};
const ulGeometry = {w: 16, h: 16, content: {x: 0, y: 0, w: 6, h: 6}};
const urGeometry = {w: 16, h: 16, content: {x: 10, y: 0, w: 6, h: 6}};

const dlAnimation = createAnimation('gfx/effects/arrow.png', dlGeometry, {cols: 2});
const drAnimation = createAnimation('gfx/effects/arrow.png', drGeometry, {x: 2, cols: 2});
const urAnimation = createAnimation('gfx/effects/arrow.png', urGeometry, {x: 4, cols: 2});
const ulAnimation = createAnimation('gfx/effects/arrow.png', ulGeometry, {x: 6, cols: 2});
const downAnimation = createAnimation('gfx/effects/arrow.png', downGeometry, {x: 8, cols: 2});
const rightAnimation = createAnimation('gfx/effects/arrow.png', rightGeometry, {x: 10, cols: 2});
const upAnimation = createAnimation('gfx/effects/arrow.png', upGeometry, {x: 12, cols: 2});
const leftAnimation = createAnimation('gfx/effects/arrow.png', leftGeometry, {x: 14, cols: 2});

const spinAnimation = createAnimation('gfx/effects/arrow.png', {w: 16, h: 16, content: {x: 5, y: 5, w: 6, h: 6}}, {y: 1, cols: 4, duration: 3});
const stuckDownAnimation = createAnimation('gfx/effects/arrow.png', downGeometry, {y: 2, cols: 5, duration: 3}, {loop: false});
const stuckRightAnimation = createAnimation('gfx/effects/arrow.png', rightGeometry, {y: 2, x: 5, cols: 5, duration: 3}, {loop: false});
const stuckUpAnimation = createAnimation('gfx/effects/arrow.png', upGeometry, {y: 2, x: 10, cols: 5, duration: 3}, {loop: false});
const stuckLeftAnimation = createAnimation('gfx/effects/arrow.png', leftGeometry, {y: 2, x: 15, cols: 5, duration: 3}, {loop: false});

const sdlAnimation = createAnimation('gfx/effects/spiritarrow.png', dlGeometry, {cols: 2});
const sdrAnimation = createAnimation('gfx/effects/spiritarrow.png', drGeometry, {x: 2, cols: 2});
const surAnimation = createAnimation('gfx/effects/spiritarrow.png', urGeometry, {x: 4, cols: 2});
const sulAnimation = createAnimation('gfx/effects/spiritarrow.png', ulGeometry, {x: 6, cols: 2});
const sdownAnimation = createAnimation('gfx/effects/spiritarrow.png', downGeometry, {x: 8, cols: 2});
const srightAnimation = createAnimation('gfx/effects/spiritarrow.png', rightGeometry, {x: 10, cols: 2});
const supAnimation = createAnimation('gfx/effects/spiritarrow.png', upGeometry, {x: 12, cols: 2});
const sleftAnimation = createAnimation('gfx/effects/spiritarrow.png', leftGeometry, {x: 14, cols: 2});

const spoofDownAnimation = createAnimation('gfx/effects/spiritarrow.png', downGeometry, {y: 1, cols: 3, duration: 3}, {loop: false});
const spoofRightAnimation = createAnimation('gfx/effects/spiritarrow.png', rightGeometry, {y: 1, x: 3, cols: 3, duration: 3}, {loop: false});
const spoofUpAnimation = createAnimation('gfx/effects/spiritarrow.png', upGeometry, {y: 1, x: 6, cols: 3, duration: 3}, {loop: false});
const spoofLeftAnimation = createAnimation('gfx/effects/spiritarrow.png', leftGeometry, {y: 1, x: 9, cols: 3, duration: 3}, {loop: false});
const sstuckDownAnimation = createAnimation('gfx/effects/spiritarrow.png', downGeometry, {y: 2, cols: 5, duration: 3}, {loop: false});
const sstuckRightAnimation = createAnimation('gfx/effects/spiritarrow.png', rightGeometry, {y: 2, x: 5, cols: 5, duration: 3}, {loop: false});
const sstuckUpAnimation = createAnimation('gfx/effects/spiritarrow.png', upGeometry, {y: 2, x: 10, cols: 5, duration: 3}, {loop: false});
const sstuckLeftAnimation = createAnimation('gfx/effects/spiritarrow.png', leftGeometry, {y: 2, x: 15, cols: 5, duration: 3}, {loop: false});

const chargeGeometry = {w: 12, h: 10, content: {x: 3, y: 3, w: 6, h: 6}};
const lightningArrowAnimation = createAnimation('gfx/effects/wukongbowcharging.png', chargeGeometry, {x: 0, cols: 4, duration: 5});
const iceArrowAnimation = createAnimation('gfx/effects/wukongbowcharging.png', chargeGeometry, {x: 4, cols: 4, duration: 5});
const fireArrowAnimation = createAnimation('gfx/effects/wukongbowcharging.png', chargeGeometry, {x: 10, cols: 4, duration: 5});
const chargedArrowAnimation = createAnimation('gfx/effects/wukongbowcharging.png', chargeGeometry, {x: 14, cols: 4, duration: 5});


export const spiritArrowIcon = sdrAnimation.frames[0];


interface ArrowAnimations {
    normal: FrameAnimation,
    stuck: FrameAnimation,
    blocked: FrameAnimation,
}

const arrowStyles: {[key: string]: {[key in Direction]: ArrowAnimations}} = {
    normal: {
        upleft: {
            normal: ulAnimation,
            stuck: stuckUpAnimation,
            blocked: spinAnimation,
        },
        up: {
            normal: upAnimation,
            stuck: stuckUpAnimation,
            blocked: spinAnimation,
        },
        upright: {
            normal: urAnimation,
            stuck: stuckUpAnimation,
            blocked: spinAnimation,
        },
        left: {
            normal: leftAnimation,
            stuck: stuckLeftAnimation,
            blocked: spinAnimation,
        },
        right: {
            normal: rightAnimation,
            stuck: stuckRightAnimation,
            blocked: spinAnimation,
        },
        downleft: {
            normal: dlAnimation,
            stuck: stuckDownAnimation,
            blocked: spinAnimation,
        },
        down: {
            normal: downAnimation,
            stuck: stuckDownAnimation,
            blocked: spinAnimation,
        },
        downright: {
            normal: drAnimation,
            stuck: stuckDownAnimation,
            blocked: spinAnimation,
        },
    },
    spirit: {
        upleft: {
            normal: sulAnimation,
            stuck: sstuckUpAnimation,
            blocked: spoofUpAnimation,
        },
        up: {
            normal: supAnimation,
            stuck: sstuckUpAnimation,
            blocked: spoofUpAnimation,
        },
        upright: {
            normal: surAnimation,
            stuck: sstuckUpAnimation,
            blocked: spoofUpAnimation,
        },
        left: {
            normal: sleftAnimation,
            stuck: sstuckLeftAnimation,
            blocked: spoofLeftAnimation,
        },
        right: {
            normal: srightAnimation,
            stuck: sstuckRightAnimation,
            blocked: spoofRightAnimation,
        },
        downleft: {
            normal: sdlAnimation,
            stuck: sstuckDownAnimation,
            blocked: spoofDownAnimation,
        },
        down: {
            normal: sdownAnimation,
            stuck: sstuckDownAnimation,
            blocked: spoofDownAnimation,
        },
        downright: {
            normal: sdrAnimation,
            stuck: sstuckDownAnimation,
            blocked: spoofDownAnimation,
        },
    }
}

type ArrowStyle = keyof typeof arrowStyles;

interface Props {
    x?: number
    y?: number
    vx?: number
    vy?: number
    chargeLevel?: number;
    damage?: number
    spiritCloakDamage?: number
    // Don't update for this many milliseconds.
    delay?: number
    // Don't collide with walls for this many milliseconds.
    ignoreWallsDuration?: number
    element?: MagicElement
    reflected?: boolean
    style?: ArrowStyle
}

export class Arrow implements EffectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'sprites';
    frame: Frame;
    damage: number;
    spiritCloakDamage: number;
    delay: number;
    ignoreWallsDuration: number;
    isEffect = <const>true;
    chargeLevel: number = 0;
    element: MagicElement = null;
    x: number;
    y: number;
    z: number = 0;
    vz: number = 0;
    w: number;
    h: number;
    vx: number;
    vy: number;
    animationTime = 0;
    direction: Direction;
    blocked = false;
    reflected: boolean = false;
    stuckFrames: number = 0;
    stuckTo: {
        dx: number
        dy: number
        object: ObjectInstance | EffectInstance
    } = null;
    style: ArrowStyle = 'normal';
    isPlayerAttack = true;
    constructor({
        x = 0, y = 0, vx = 0, vy = 0, chargeLevel = 0, damage = 1, 
        spiritCloakDamage = 5, delay = 0, element = null, reflected = false, style = 'normal',
        ignoreWallsDuration = 0,
    }: Props) {
        this.x = x | 0;
        this.y = y | 0;
        this.vx = vx;
        this.vy = vy;
        this.direction = getDirection(this.vx, this.vy, true);
        this.damage = damage;
        this.spiritCloakDamage = spiritCloakDamage;
        this.delay = delay;
        this.ignoreWallsDuration = ignoreWallsDuration;
        this.chargeLevel = chargeLevel;
        this.element = element;
        this.w = 6;
        this.h = 6;
        this.x -= this.w / 2 ;
        this.y -= this.h / 2 ;
        this.style = style;
        this.reflected = reflected;
    }
    getHitbox() {
        return this;
    }
    getHitProperties(state: GameState): HitProperties {
        return {
            canPush: true,
            direction: this.direction,
            damage: this.damage,
            spiritCloakDamage: this.spiritCloakDamage,
            hitbox: this,
            knockback: { vx: this.vx, vy: this.vy, vz: 0},
            tileHitbox: {
                w: this.w,
                h: this.h,
                x: this.x,
                // Hit box is lowered for northern walls to match the perspective.
                y: this.y + (this.vy < 0 ? 8 : 0),
            },
            vx: this.vx,
            vy: this.vy, element:
            this.element,
            hitAllies: this.reflected,
            hitEnemies: !this.reflected,
            hitObjects: true,
            hitTiles: this.animationTime >= this.ignoreWallsDuration,
            isArrow: true,
        };
    }
    update(state: GameState) {
        if (this.delay > 0) {
            this.delay -= FRAME_LENGTH;
            return;
        }
        if (this.stuckTo) {
            this.x = this.stuckTo.object.x + this.stuckTo.dx;
            this.y = this.stuckTo.object.y + this.stuckTo.dy;
        }
        this.animationTime += FRAME_LENGTH;
        if (this.stuckFrames > 0) {
            this.stuckFrames++;
            if (this.blocked) {
                if (this.style !== 'spirit') {
                    if (this.vy > 0) {
                        this.y -= 0.5;
                    }
                    this.vz -= 0.2;
                    this.z += this.vz;
                    if (this.stuckFrames > 15) {
                        removeEffectFromArea(state, this);
                    }
                } else if (this.animationTime >= spoofDownAnimation.duration) {
                    removeEffectFromArea(state, this);
                }
            } else if (this.animationTime >= stuckDownAnimation.duration + 100) {
                removeEffectFromArea(state, this);
            }
            return;
        }
        this.x += this.vx;
        this.y += this.vy;
        const { section } = getAreaSize(state);
        if (this.x + this.w <= section.x || this.y + this.h <= section.y
            || this.x >= section.x + section.w || this.y  >= section.y + section.h
        ) {
            removeEffectFromArea(state, this);
            return;
        }
        if (!this.stuckFrames && this.damage > 2 && this.animationTime % 60 === 0) {
            addSparkleAnimation(state, this.area, this, { element: this.element });
        }
        const hitResult = hitTargets(state, this.area, this.getHitProperties(state));
        if (hitResult.reflected) {
            this.vx = -this.vx;
            this.vy = -this.vy;
            this.reflected = !this.reflected;
            playAreaSound(state, this.area, 'blockAttack');
            this.direction = getDirection(this.vx, this.vy, true);
            return;
        }
        if (hitResult.blocked) {
            this.stuckFrames = 1;
            this.blocked = true;
            this.vz = 1;
            this.animationTime = 0;
            return;
        }
        if (hitResult.hit && !hitResult.pierced) {
            this.stuckFrames = 1;
            this.animationTime = 0;
            if (hitResult.hitTargets.size) {
                const object = [...hitResult.hitTargets.values()][0];
                this.stuckTo = {
                    object,
                    dx: this.x - object.x,
                    dy: this.y - object.y,
                };
            }
            return;
        }
        // This is used to make torches light arrows on fire.
        if (hitResult.setElement) {
            this.element = hitResult.setElement;
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const animationSet = arrowStyles[this.style][this.direction];
        let animation = animationSet.normal;
        if (this.blocked) {
            animation = animationSet.blocked;
        } else if (this.stuckFrames > 0) {
            animation = animationSet.stuck;
        }
        let frame = getFrame(animation, this.animationTime);

        drawFrameAt(context, frame, { x: this.x, y: this.y - this.z });
        const chargeAnimation = getChargedArrowAnimation(this.chargeLevel, this.element);
        if (chargeAnimation) {
            frame = getFrame(chargeAnimation, this.animationTime);
            drawFrameAt(context, frame, { x: this.x, y: this.y - this.z });
        }
    }
}

// This is for drawing a normal arrow of any of the arrow styles.
export function drawArrow(this: void, context: CanvasRenderingContext2D, arrowStyle: ArrowStyle, animationTime: number, x: number, y: number, dx: number, dy: number) {
    const direction = getDirection(dx, dy, true);
    const animation = arrowStyles[arrowStyle][direction].normal;
    let frame = getFrame(animation, animationTime);
    context.save();
        context.translate(x, y);
        drawFrameAt(context, frame, { x: 4 * dx - 3, y: 4 * dy - 3});
    context.restore();
}


export function getChargedArrowAnimation(this: void, chargeLevel: number, element: MagicElement): FrameAnimation {
    if (element === 'lightning') {
        return lightningArrowAnimation;
    }
    if (element === 'ice') {
        return iceArrowAnimation;
    }
    if (element === 'fire') {
        return fireArrowAnimation;
    }
    if (chargeLevel) {
        return chargedArrowAnimation;
    }
}

export class EnemyArrow extends Arrow {
    isPlayerAttack = false;
    isEnemyAttack = true;
    static spawn(state: GameState, area: AreaInstance, arrowProps: Props) {
        const enemyArrow = new EnemyArrow(arrowProps);
        addEffectToArea(state, area, enemyArrow);
    }
    getHitProperties(state: GameState): HitProperties {
        return {
            canPush: false,
            damage: this.damage,
            spiritCloakDamage: this.spiritCloakDamage,
            direction: this.direction,
            hitbox: this,
            knockback: { vx: this.vx, vy: this.vy, vz: 0},
            tileHitbox: {
                w: this.w,
                h: this.h,
                x: this.x - this.vx,
                y: this.y - this.vy,
            },
            vx: this.vx,
            vy: this.vy, element:
            this.element,
            hitAllies: !this.reflected,
            hitEnemies: this.reflected,
            hitObjects: true,
            hitTiles: this.animationTime >= this.ignoreWallsDuration,
            isArrow: true,
        };
    }
    update(state: GameState) {
        // Don't leave enemy arrows on the screen in case there are a lot of them.
        if (this.stuckFrames > 0 && !this.blocked) {
            removeEffectFromArea(state, this);
            return;
        }
        super.update(state);
    }
}

const crystalDownAnimation = createAnimation('gfx/effects/shard1.png', {w: 9, h: 12});
const crystalDownLeftAnimation = createAnimation('gfx/effects/shard2.png', {w: 9, h: 12});

export class CrystalSpike extends Arrow {
    isPlayerAttack = false;
    isEnemyAttack = true;
    static spawn(state: GameState, area: AreaInstance, arrowProps: Props) {
        const spike = new CrystalSpike(arrowProps);
        addEffectToArea(state, area, spike);
    }
    getHitProperties(state: GameState): HitProperties {
        return {
            canPush: false,
            damage: this.damage,
            spiritCloakDamage: this.spiritCloakDamage,
            canDamageCrystalShields: true,
            direction: this.direction,
            hitbox: this,
            knockback: { vx: this.vx, vy: this.vy, vz: 0},
            tileHitbox: {
                w: this.w,
                h: this.h,
                x: this.x - this.vx,
                y: this.y - this.vy,
            },
            vx: this.vx,
            vy: this.vy,
            element: null,
            hitAllies: !this.reflected,
            hitEnemies: this.reflected,
            hitObjects: true,
            hitTiles: this.animationTime >= this.ignoreWallsDuration,
        };
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawCrystal(context, this.animationTime,
            this.x + this.w / 2, this.y - this.z + this.h / 2,
            this.vx, this.vy
        );
    }
    update(state: GameState) {
        // Don't leave enemy arrows on the screen in case there are a lot of them.
        if (this.stuckFrames > 0 && !this.blocked) {
            removeEffectFromArea(state, this);
            return;
        }
        super.update(state);
    }
}

export function drawCrystal(this: void, context: CanvasRenderingContext2D, animationTime: number, x: number, y: number, dx: number, dy: number) {
    context.save();
        context.translate(x, y);
        let frame: Frame;
        switch(getDirection(dx, dy, true)) {
            case 'down':
                frame = getFrame(crystalDownAnimation, animationTime);
                break;
            case 'right':
                frame = getFrame(crystalDownAnimation, animationTime);
                context.rotate(-Math.PI / 2);
                break;
            case 'left':
                frame = getFrame(crystalDownAnimation, animationTime);
                context.rotate(Math.PI / 2);
                break;
            case 'up':
                frame = getFrame(crystalDownAnimation, animationTime);
                context.rotate(Math.PI);
                break;
            case 'downleft':
                frame = getFrame(crystalDownLeftAnimation, animationTime);
                break;
            case 'downright':
                frame = getFrame(crystalDownLeftAnimation, animationTime);
                context.rotate(-Math.PI / 2);
                break;
            case 'upleft':
                frame = getFrame(crystalDownLeftAnimation, animationTime);
                context.rotate(Math.PI / 2);
                break;
            case 'upright':
                frame = getFrame(crystalDownLeftAnimation, animationTime);
                context.rotate(Math.PI);
                break;
        }
        drawFrameAt(context, frame, { x: -frame.w / 2, y: -frame.h / 2});
    context.restore();
}
