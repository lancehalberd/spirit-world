import { getAreaSize, removeObjectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrameAt, getFrame } from 'app/utils/animations';
import { getDirection, hitTargets } from 'app/utils/field';

import {
    AreaInstance, Direction, Frame, FrameAnimation,
    GameState, HitProperties, MagicElement, ObjectInstance, ObjectStatus
} from 'app/types';

const upContent = {x: 5, y: 2, w: 6, h: 6};
const downContent = {x: 5, y: 8, w: 6, h: 6};
const leftContent = {x: 2, y: 5, w: 6, h: 6};
const rightContent = {x: 8, y: 5, w: 6, h: 6};

const dlAnimation = createAnimation('gfx/effects/arrow.png', {w: 16, h: 16, content: {x: 2, y: 8, w: 6, h: 6}}, {cols: 2});
const drAnimation = createAnimation('gfx/effects/arrow.png', {w: 16, h: 16, content: {x: 8, y: 8, w: 6, h: 6}}, {x: 2, cols: 2});
const urAnimation = createAnimation('gfx/effects/arrow.png', {w: 16, h: 16, content: {x: 8, y: 2, w: 6, h: 6}}, {x: 4, cols: 2});
const ulAnimation = createAnimation('gfx/effects/arrow.png', {w: 16, h: 16, content: {x: 2, y: 2, w: 6, h: 6}}, {x: 6, cols: 2});
const downAnimation = createAnimation('gfx/effects/arrow.png', {w: 16, h: 16, content: downContent}, {x: 8, cols: 2});
const rightAnimation = createAnimation('gfx/effects/arrow.png', {w: 16, h: 16, content: rightContent}, {x: 10, cols: 2});
const upAnimation = createAnimation('gfx/effects/arrow.png', {w: 16, h: 16, content: upContent}, {x: 12, cols: 2});
const leftAnimation = createAnimation('gfx/effects/arrow.png', {w: 16, h: 16, content: leftContent}, {x: 14, cols: 2});

const spinAnimation = createAnimation('gfx/effects/arrow.png', {w: 16, h: 16, content: {x: 5, y: 5, w: 6, h: 6}}, {y: 1, cols: 4, duration: 3});
const stuckDownAnimation = createAnimation('gfx/effects/arrow.png', {w: 16, h: 16, content: downContent}, {y: 2, cols: 5, duration: 3}, {loop: false});
const stuckRightAnimation = createAnimation('gfx/effects/arrow.png', {w: 16, h: 16, content: rightContent}, {y: 2, x: 5, cols: 5, duration: 3}, {loop: false});
const stuckUpAnimation = createAnimation('gfx/effects/arrow.png', {w: 16, h: 16, content: upContent}, {y: 2, x: 10, cols: 5, duration: 3}, {loop: false});
const stuckLeftAnimation = createAnimation('gfx/effects/arrow.png', {w: 16, h: 16, content: leftContent}, {y: 2, x: 15, cols: 5, duration: 3}, {loop: false});

const sdlAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: {x: 2, y: 8, w: 6, h: 6}}, {cols: 2});
const sdrAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: {x: 8, y: 8, w: 6, h: 6}}, {x: 2, cols: 2});
const surAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: {x: 8, y: 2, w: 6, h: 6}}, {x: 4, cols: 2});
const sulAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: {x: 2, y: 2, w: 6, h: 6}}, {x: 6, cols: 2});
const sdownAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: downContent}, {x: 8, cols: 2});
const srightAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: rightContent}, {x: 10, cols: 2});
const supAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: upContent}, {x: 12, cols: 2});
const sleftAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: leftContent}, {x: 14, cols: 2});

const spoofDownAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: downContent}, {y: 1, cols: 3, duration: 3}, {loop: false});
const spoofRightAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: rightContent}, {y: 1, x: 3, cols: 3, duration: 3}, {loop: false});
const spoofUpAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: upContent}, {y: 1, x: 6, cols: 3, duration: 3}, {loop: false});
const spoofLeftAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: leftContent}, {y: 1, x: 9, cols: 3, duration: 3}, {loop: false});
const sstuckDownAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: downContent}, {y: 2, cols: 5, duration: 3}, {loop: false});
const sstuckRightAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: rightContent}, {y: 2, x: 5, cols: 5, duration: 3}, {loop: false});
const sstuckUpAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: upContent}, {y: 2, x: 10, cols: 5, duration: 3}, {loop: false});
const sstuckLeftAnimation = createAnimation('gfx/effects/spiritarrow.png', {w: 16, h: 16, content: leftContent}, {y: 2, x: 15, cols: 5, duration: 3}, {loop: false});



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
    y?: number,
    vx?: number,
    vy?: number,
    damage?: number,
    element?: MagicElement,
    style?: ArrowStyle,
}

export class Arrow implements ObjectInstance {
    area: AreaInstance;
    definition = null;
    frame: Frame;
    damage: number;
    element: MagicElement = null;
    x: number;
    y: number;
    z: number = 0;
    vz: number = 0;
    w: number;
    h: number;
    vx: number;
    vy: number;
    ignorePits = true;
    animationTime = 0;
    direction: Direction;
    blocked = false;
    stuckFrames: number = 0;
    status: ObjectStatus = 'normal';
    style: ArrowStyle = 'normal';
    constructor({x = 0, y = 0, vx = 0, vy = 0, damage = 1, element = null, style = 'normal'}: Props) {
        this.x = x | 0;
        this.y = y | 0;
        this.vx = vx;
        this.vy = vy;
        this.direction = getDirection(this.vx, this.vy, true);
        this.damage = damage;
        this.element = element;
        this.w = 6;
        this.h = 6;
        this.x -= this.w / 2 ;
        this.y -= this.h / 2 ;
        this.style = style;
    }
    getHitProperties(state: GameState): HitProperties {
        return {
            canPush: true,
            damage: this.damage,
            hitbox: this,
            vx: this.vx,
            vy: this.vy, element:
            this.element,
            hitEnemies: true,
            hitObjects: true,
            hitTiles: true,
        };
    }
    update(state: GameState) {
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
                        removeObjectFromArea(state, this);
                    }
                } else if (this.animationTime >= spoofDownAnimation.duration) {
                    removeObjectFromArea(state, this);
                }
            } else if (this.animationTime >= stuckDownAnimation.duration + 100) {
                removeObjectFromArea(state, this);
            }
            return;
        }
        this.x += this.vx;
        this.y += this.vy;
        const { section } = getAreaSize(state);
        if (this.x + this.w <= section.x || this.y + this.h <= section.y
            || this.x >= section.x + section.w || this.y  >= section.y + section.h
        ) {
            removeObjectFromArea(state, this);
            return;
        }
        const hitResult = hitTargets(state, this.area, this.getHitProperties(state));
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
        const frame = getFrame(animation, this.animationTime);
        drawFrameAt(context, frame, { x: this.x, y: this.y - this.z });
        if (this.element) {
            context.save();
                context.globalAlpha *= 0.8;
                context.beginPath();
                context.fillStyle = {fire: 'red', ice: '#08F', lightning: 'yellow'}[this.element];
                context.arc(
                    this.x + 3,
                    this.y - this.z + 3,
                    3,
                    0, 2 * Math.PI
                );
                context.fill();
            context.restore();
        }
    }
}

export class EnemyArrow extends Arrow {
    getHitProperties(state: GameState): HitProperties {
        return {
            canPush: false,
            damage: this.damage,
            hitbox: this,
            vx: this.vx,
            vy: this.vy, element:
            this.element,
            hitAllies: true,
            hitObjects: true,
            hitTiles: true,
        };
    }
    update(state: GameState) {
        // Don't leave enemy arrows on the screen in case there are a lot of them.
        if (this.stuckFrames > 0 && !this.blocked) {
            removeObjectFromArea(state, this);
            return;
        }
        super.update(state);
    }
}
