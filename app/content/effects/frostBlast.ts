import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { removeEffectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { hitTargets } from 'app/utils/field';

import {
    AreaInstance, EffectInstance, Frame, GameState,
    ObjectInstance,
} from 'app/types';


interface Props {
    x: number,
    y: number,
    damage?: number,
    radius?: number,
}

const EXPANSION_TIME = 200;
const PERSIST_TIME = 400;

export class FrostBlast implements EffectInstance, Props {
    area: AreaInstance = null;
    isEffect = <const>true;
    isEnemyAttack = true;
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
    radius: number;
    animationTime = 0;
    speed = 0;
    hitTargets: Set<EffectInstance | ObjectInstance>;
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
            removeEffectFromArea(state, this);
        } else {
            const r = this.radius * Math.min(1, this.animationTime / EXPANSION_TIME);
            const hitResult = hitTargets(state, this.area, {
                damage: this.damage,
                element: 'ice',
                hitCircle: {
                    x: this.x,
                    y: this.y,
                    r,
                },
                hitAllies: true,
                hitObjects: true,
                hitTiles: true,
                hitEnemies: true,
                ignoreTargets: this.hitTargets,
            });
            this.hitTargets = new Set([...this.hitTargets, ...hitResult.hitTargets]);
            if (this.animationTime === 40 || this.animationTime === 80 || this.animationTime === 140 || this.animationTime === 200) {
                let theta = Math.random() * 2 * Math.PI;
                let count = 2 + (3 * Math.random()) | 0;
                for (let i = 0; i < count; i++) {
                    addSparkleAnimation(state, this.area, {
                        x: this.x + (r - 3) * Math.cos(theta + i * 2 * Math.PI / count),
                        y: this.y + (r - 3) * Math.sin(theta + i * 2 * Math.PI / count),
                        w: 6,
                        h: 6,
                    }, { element: 'ice' });
                }
            }
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
