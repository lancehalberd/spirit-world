import { removeObjectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { hitTargets } from 'app/utils/field';

import {
    AreaInstance, Frame, GameState,
    ObjectInstance, ObjectStatus,
} from 'app/types';


interface Props {
    x: number,
    y: number,
    damage?: number,
    radius?: number,
}

const EXPANSION_TIME = 200;
const PERSIST_TIME = 800;

export class FrostBlast implements ObjectInstance, Props {
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
    radius: number;
    animationTime = 0;
    status: ObjectStatus = 'normal';
    speed = 0;
    hitTargets: Set<ObjectInstance>;
    constructor({x, y, damage = 2, radius = 32}: Props) {
        this.radius = radius
        this.damage = damage;
        this.x = x;
        this.y = y;
        this.hitTargets = new Set();
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime >= EXPANSION_TIME + PERSIST_TIME) {
            removeObjectFromArea(state, this);
        } else {
            const hitResult = hitTargets(state, this.area, {
                damage: this.damage,
                element: 'ice',
                hitCircle: {
                    x: this.x,
                    y: this.y,
                    r: this.radius * Math.min(1, this.animationTime / EXPANSION_TIME),
                },
                hitAllies: true,
                hitObjects: true,
                hitTiles: true,
                hitEnemies: true,
                ignoreTargets: this.hitTargets,
            });
            this.hitTargets = new Set([...this.hitTargets, ...hitResult.hitTargets])
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Animate a transparent orb growing in the air
        context.save();
            context.globalAlpha *= 0.6;
            context.beginPath();
            context.fillStyle = 'white'
            const r = this.radius * Math.min(1, this.animationTime / EXPANSION_TIME);
            context.arc(this.x + this.w / 2, this.y + this.h / 2 - this.z, r, 0, 2 * Math.PI);
            context.fill();
        context.restore();
    }
}
