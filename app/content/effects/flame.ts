import { addSparkleAnimation } from 'app/content/animationEffect';
import { removeObjectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrameAt } from 'app/utils/animations';
import { hitTargets } from 'app/utils/field';

import {
    AreaInstance, DrawPriority,
    Frame, GameState, ObjectInstance, ObjectStatus,
} from 'app/types';

export const [
    /* container */, fireElement, /* elementShine */
] = createAnimation('gfx/hud/elementhud.png',
    {w: 20, h: 20, content: {x: 2, y: 2, w: 16, h: 16}}, {cols: 6}
).frames;

interface Props {
    x: number,
    y: number,
    z?: number,
    damage?: number,
    vx?: number,
    vy?: number,
    vz?: number,
    az?: number,
    ttl?: number,
}

export class Flame implements ObjectInstance, Props {
    drawPriority: DrawPriority = 'sprites';
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
    az: number;
    w: number = 12;
    h: number = 12;
    ignorePits = true;
    radius: number;
    animationTime = 0;
    status: ObjectStatus = 'normal';
    speed = 0;
    ttl: number;
    constructor({x, y, z = 0, vx = 0, vy = 0, vz = 0, az = -0.3, damage = 1, ttl = 2000}: Props) {
        this.damage = damage;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.az = az;
        this.ttl = ttl;
    }
    update(state: GameState) {
        this.x += this.vx;
        this.y += this.vy;
        this.z = Math.max(0, this.z + this.vz);
        this.vz = Math.max(-8, this.vz + this.az);
        this.animationTime += FRAME_LENGTH;

        if (this.animationTime >= this.ttl) {
            removeObjectFromArea(state, this);
        } else {
            hitTargets(state, this.area, {
                canPush: false,
                damage: this.damage,
                hitbox: this,
                element: 'fire',
                hitAllies: true,
                hitTiles: true,
            });
            // Create sparks less often when the flame is still.
            const rate = (this.vx || this.vy) ? 100 : 400;
            if (this.animationTime % rate === 0) {
                addSparkleAnimation(state, this.area, this, 'fire');
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameAt(context, fireElement, {
            x: this.x - 2,
            y: this.y - 2 + 2 + 2 * Math.sin(this.animationTime / 150),
        });
    }
}
