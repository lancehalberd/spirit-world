import { getAreaSize, removeObjectFromArea } from 'app/content/areas';
import { CANVAS_HEIGHT, CANVAS_WIDTH, FRAME_LENGTH } from 'app/gameConstants';
import { directionMap, hitTargets } from 'app/utils/field';

import {
    AreaInstance, Direction,
    Frame, GameState, ObjectInstance, ObjectStatus,
} from 'app/types';


interface Props {
    direction: Direction,
    damage?: number,
    delay?: number,
    length?: number,
}

export class FlameWall implements ObjectInstance, Props {
    area: AreaInstance = null;
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
    ignorePits = true;
    length = 6;
    delay: number;
    animationTime = 0;
    direction: Direction;
    status: ObjectStatus = 'normal';
    speed = 0;
    constructor({damage = 2, delay = 800, direction = 'down', length = 6}: Props) {
        this.delay = delay;
        this.damage = damage;
        this.direction = direction;
        this.length = length;
    }
    update(state: GameState) {
        const { section } = getAreaSize(state);
        let left = section.x + 32;
        let top = section.y + 32;
        let right = section.x + section.w - 32;
        let bottom = section.y + section.h - 32;
        if (this.animationTime === 0) {
            left = Math.max(state.camera.x, left);
            right = Math.min(state.camera.x + CANVAS_WIDTH - 16, right);
            top = Math.max(state.camera.y, top);
            bottom = Math.min(state.camera.y + CANVAS_HEIGHT - 16, bottom);
            if (this.direction === 'up' || this.direction === 'down') {
                this.x = state.hero.x + state.hero.w / 2 + 32 - this.length * 16 + Math.floor(Math.random() * (this.length * 16 - 64));
                this.w = this.length * 16;
                this.x = Math.max(left, Math.min(right - this.w, this.x));
                this.h = 16;
            } else {
                this.y = state.hero.y + state.hero.y / 2 + 32 - this.length * 16 + Math.floor(Math.random() * (this.length * 16 - 64));
                this.h = this.length * 16;
                this.y = Math.max(top, Math.min(bottom - this.h, this.y));
                this.w = 16;
            }
            if (this.direction === 'down') {
                this.y = top;
            } else if (this.direction === 'up') {
                this.y = bottom - this.h;
            } else if (this.direction === 'right') {
                this.x = left
            } else if (this.direction === 'left') {
                this.x = right - this.w;
            }
        }
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime >= this.delay) {
            this.speed = Math.min(4, this.speed + 0.5);
            this.x += this.speed * directionMap[this.direction][0];
            this.y += this.speed * directionMap[this.direction][1];
            if (this.x < left || this.x + this.w > right || this.y < top || this.y + this.h > bottom) {
                removeObjectFromArea(state, this);
            } else {
                hitTargets(state, this.area, {
                    canPush: false,
                    damage: this.damage,
                    hitbox: this,
                    element: 'fire',
                    hitAllies: true,
                });
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Animate a transparent orb growing in the air
        context.save();
            context.globalAlpha = 0.5 + Math.min(0.5, 0.5 * this.animationTime / this.delay);
            context.fillStyle = 'red';
            context.fillRect(this.x, this.y, this.w, this.h);
        context.restore();
    }
}
