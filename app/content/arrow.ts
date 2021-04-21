import { destroyTile, getAreaSize, removeObjectFromArea } from 'app/content/areas';
import { Enemy } from 'app/content/enemy';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getTilesInRectangle } from 'app/getActorTargets';
import { damageActor } from 'app/updateActor';
import { createAnimation, drawFrameAt, getFrame } from 'app/utils/animations';
import { getDirection } from 'app/utils/field';
import { rectanglesOverlap } from 'app/utils/index';

import { Clone, Direction, Frame, FrameAnimation, GameState, ObjectInstance, ObjectStatus } from 'app/types';

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
    }
}

type ArrowStyle = keyof typeof arrowStyles;

interface Props {
    x?: number
    y?: number,
    vx?: number,
    vy?: number,
    damage?: number,
    style?: ArrowStyle,
}

export class Arrow implements ObjectInstance {
    definition = null;
    frame: Frame;
    damage: number;
    x: number;
    y: number;
    z: number = 0;
    vz: number = 0;
    w: number;
    h: number;
    vx: number;
    vy: number;
    animationTime = 0;
    hitTargets: Set<any>;
    direction: Direction;
    blocked = false;
    stuckFrames: number = 0;
    status: ObjectStatus = 'normal';
    style: ArrowStyle = 'normal';
    constructor({x = 0, y = 0, vx = 0, vy = 0, damage = 1, style = 'normal'}: Props) {
        this.x = x | 0;
        this.y = y | 0;
        this.vx = vx;
        this.vy = vy;
        this.direction = getDirection(this.vx, this.vy, true);
        this.damage = damage;
        this.w = 6;
        this.h = 6;
        this.x -= this.w / 2 ;
        this.y -= this.h / 2 ;
        this.hitTargets = new Set();
        this.style = style;
    }
    hitTarget(state: GameState, object: ObjectInstance): boolean {
        if (!(object instanceof Enemy) || this.hitTargets.has(object)) {
            return false;
        }
        if (rectanglesOverlap(object.getHitbox(state), this)) {
            this.hitTargets.add(object);
            damageActor(state, object, this.damage);
            if (object.life > 0) {
                this.stuckFrames = 1;
                this.animationTime = 0;
            }
            return true;
        }
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.stuckFrames > 0) {
            this.stuckFrames++;
            if (this.blocked) {
                /*if (this.vx) {
                    this.x -= 0.5 * this.vx / Math.abs(this.vx);
                }
                if (this.vy) {
                    this.y -= 0.5 * this.vy / Math.abs(this.vy);
                }*/
                if (this.vy > 0) {
                    this.y -= 0.5;
                }
                this.vz -= 0.2;
                this.z += this.vz;
                if (this.stuckFrames > 15) {
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
        for (const object of state.areaInstance.objects) {
            if (object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
                continue;
            }
            if (this.hitTarget(state, object)) {
                if (this.stuckFrames > 0) {
                    return;
                }
                continue;
            }
            if (object.getHitbox && object.behaviors?.solid) {
                const hitbox = object.getHitbox(state);
                if (!this.hitTargets.has(object) && rectanglesOverlap(hitbox, this)) {
                    this.hitTargets.add(object);
                    const direction = getDirection(hitbox.x - this.x + 8 * this.vx, hitbox.y - this.y + 8 * this.vy);
                    object.onHit?.(state, direction);
                    if (!object.behaviors?.low){
                        this.stuckFrames = 1;
                        this.blocked = true;
                        this.vz = 1;
                        this.animationTime = 0;
                        return;
                    }
                }
            }
        }
        for (const target of getTilesInRectangle(state, this)) {
            const area = state.areaInstance;
            const behavior = area.behaviorGrid?.[target.y]?.[target.x];
            const bowLevel = state.hero.activeTools.bow;
            if (behavior?.cuttable <= bowLevel && !behavior?.low) {
                // We need to find the specific cuttable layers that can be destroyed.
                for (const layer of state.areaInstance.layers) {
                    const palette = layer.palette;
                    const tile = layer.tiles[target.y][target.x];
                    const behavior = palette.behaviors[`${tile.x}x${tile.y}`];
                    if (behavior?.cuttable <= bowLevel) {
                        destroyTile(state, state.areaInstance, {...target, layerKey: layer.key});
                    }
                }
            } else if ((behavior?.cuttable > bowLevel || behavior?.solid) && !behavior?.low) {
                this.stuckFrames = 1;
                this.blocked = true;
                this.vz = 1;
                this.animationTime = 0;
            }
        }
    }
    render(context, state: GameState) {
        const animationSet = arrowStyles[this.style][this.direction];
        let animation = animationSet.normal;
        if (this.blocked) {
            animation = animationSet.blocked;
        } else if (this.stuckFrames > 0) {
            animation = animationSet.stuck;
        }
        const frame = getFrame(animation, this.animationTime);
        drawFrameAt(context, frame, { x: this.x, y: this.y - this.z });
    }
}

export class EnemyArrow extends Arrow {
    hitTarget(state: GameState, object: ObjectInstance): boolean {
        if (!(object instanceof Clone)) {
            return;
        }
        if (!this.hitTargets.has(object) && rectanglesOverlap(object, this)) {
            damageActor(state, object, this.damage);
            //this.hitTargets.add(object);
            //this.stuckFrames = 1;
            removeObjectFromArea(state, this);
            return true;
        }
    }
    update(state: GameState) {
        // Don't leave enemy arrows on the screen in case there are a lot of them.
        if (this.stuckFrames > 0 && !this.blocked) {
            removeObjectFromArea(state, this);
            return;
        }
        if (!this.hitTargets.has(state.hero) && rectanglesOverlap(state.hero, this)) {
            damageActor(state, state.hero, this.damage);
            //this.hitTargets.add(state.hero);
            //this.stuckFrames = 1;
            removeObjectFromArea(state, this);
        }
        super.update(state);
    }
}
