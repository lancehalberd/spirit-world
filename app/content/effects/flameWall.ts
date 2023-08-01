import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { flameAnimation } from 'app/content/effects/flame';
import { CANVAS_HEIGHT, CANVAS_WIDTH, FRAME_LENGTH } from 'app/gameConstants';
import { drawFrame, getFrame } from 'app/utils/animations';
import { directionMap, rotateDirection } from 'app/utils/direction';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { hitTargets } from 'app/utils/field';
import { getAreaSize } from 'app/utils/getAreaSize';


interface Props {
    direction: Direction
    damage?: number
    delay?: number
    fromPoint?: {x: number, y: number}
    length?: number
}

export class FlameWall implements EffectInstance, Props {
    area: AreaInstance = null;
    isEffect = <const>true;
    isEnemyAttack = true;
    definition = null;
    frame: Frame;
    damage: number;
    x: number;
    y: number;
    z: number = 0;
    vz: number = 0;
    vx: number;
    vy: number;
    w: number = 12;
    h: number = 12;
    fromPoint: Props['fromPoint']
    ignorePits = true;
    length = 6;
    delay: number;
    animationTime = 0;
    time = 0;
    direction: Direction;
    status: ObjectStatus = 'normal';
    speed = 0;
    distance = 0;
    constructor({damage = 1, delay = 800, direction = 'down', length = 6, fromPoint}: Props) {
        this.delay = delay;
        this.damage = damage;
        this.direction = direction;
        this.length = length;
        this.fromPoint = fromPoint;
        this.animationTime = Math.floor(Math.random() * 10) * FRAME_LENGTH;
    }
    getHitbox(state: GameState) {
        return {
            x: this.x - this.w / 2,
            y: this.y - this.h / 2,
            w: this.w,
            h: this.h,
        }
    }
    update(state: GameState) {
        const { section } = getAreaSize(state);
        let left = section.x + 32;
        let top = section.y + 32;
        let right = section.x + section.w - 32;
        let bottom = section.y + section.h - 32;
        if (this.time === 0) {
            left = Math.max(state.camera.x, left);
            right = Math.min(state.camera.x + CANVAS_WIDTH - 16, right);
            top = Math.max(state.camera.y, top);
            bottom = Math.min(state.camera.y + CANVAS_HEIGHT - 16, bottom);
            if (this.fromPoint) {
                this.x = this.fromPoint.x;
                this.y = this.fromPoint.y;
                // This will always start 1 tile wide, but grow each tile it moves until it reaches max length
                this.w = this.h = 16;
            } else {
                if (this.direction === 'up' || this.direction === 'down') {
                    this.w = this.length * 16;
                    // Appear 2 tiles left or right of centered on the player.
                    this.x = state.hero.x + state.hero.w / 2 + 32 - Math.floor(Math.random() * 64);
                    this.x = Math.max(left, Math.min(right - this.w, this.x));
                    this.h = 16;
                } else {
                    this.h = this.length * 16;
                    this.y = state.hero.y + state.hero.y / 2 + 32 - Math.floor(Math.random() * 64);
                    this.y = Math.max(top, Math.min(bottom - this.h, this.y));
                    this.w = 16;
                }
                if (this.direction === 'down') {
                    this.y = top + 8;
                } else if (this.direction === 'up') {
                    this.y = bottom - this.h - 8;
                } else if (this.direction === 'right') {
                    this.x = left + 8;
                } else if (this.direction === 'left') {
                    this.x = right - this.w - 8;
                }
            }
        }
        this.time += FRAME_LENGTH;
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime >= this.delay) {
            this.speed = Math.min(4, this.speed + 0.5);
            this.x += this.speed * directionMap[this.direction][0];
            this.y += this.speed * directionMap[this.direction][1];
            // Grow wider as the flame advances from its starting point.
            if (this.fromPoint) {
                this.distance += this.speed;
                const length = Math.min(16 + this.distance, this.length * 16);
                if (this.direction === 'up' || this.direction === 'down') {
                    this.w = length;
                } else {
                    this.h = length;
                }
            }
            if ((this.direction === 'left' && this.x < left)
                || (this.direction === 'right' && this.x > right)
                || (this.direction === 'up' && this.y < top)
                || (this.direction === 'down' && this.y > bottom)
            ) {
                removeEffectFromArea(state, this);
            } else {
                const hitbox = this.getHitbox(state);
                hitTargets(state, this.area, {
                    canPush: false,
                    damage: this.damage,
                    hitbox,
                    element: 'fire',
                    hitAllies: true,
                    hitTiles: true,
                    knockback: {vx: 4 * directionMap[this.direction][0], vy: 4 * directionMap[this.direction][1], vz: 2},
                });
                if (this.animationTime % 100 === 0) {
                    addSparkleAnimation(state, this.area, hitbox, { element: 'fire' });
                }
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const frame = getFrame(flameAnimation, this.animationTime);
        const hitbox = this.getHitbox(state);
        const h = frame.h * Math.min(1, this.animationTime / this.delay);
        //context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
        for (let i = 0; i < this.length; i++) {
            drawFrame(context,
                {...frame, y: frame.y + frame.h - h, h},
                {
                    x: hitbox.x + i * (hitbox.w - 16) / ((this.length - 1) || 1) - frame.content.x,
                    y: hitbox.y + i * (hitbox.h - 16) / ((this.length - 1) || 1) - frame.content.y
                        // This anchors the flame to the bottom of the frame so it draws from bottom to top.
                        + frame.h - h
                        // Make the frame bob a little bit.
                        + 2 * Math.sin(this.animationTime / 100 + i),
                    h,
                    w: frame.w
                }
            );
        }
    }

    static createRadialFlameWall(state: GameState, area: AreaInstance, fromPoint: Props['fromPoint'], length = 4) {
        for (let i = 0; i < 4; i++) {
            const flameWall = new FlameWall({
                direction: rotateDirection('down', i),
                fromPoint,
                length,
            });
            addEffectToArea(state, area, flameWall);
        }
    }
}
