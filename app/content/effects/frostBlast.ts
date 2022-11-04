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

const EXPANSION_TIME = 140;
const PERSIST_TIME = 60;
const minRadius = 4;

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
        this.radius = radius - minRadius;
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
            const r = minRadius + this.radius * Math.min(1, this.animationTime / EXPANSION_TIME);
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
            if (this.animationTime === 20 || this.animationTime === 40 || this.animationTime === 80 || this.animationTime === 120) {
                let theta = Math.random() * 2 * Math.PI;
                let count = 4 + (4 * Math.random()) | 0;
                for (let i = 0; i < count; i++) {
                    addSparkleAnimation(state, this.area, {
                        x: this.x + (r - 1) * Math.cos(theta + i * 2 * Math.PI / count) - 2,
                        y: this.y + (r - 1) * Math.sin(theta + i * 2 * Math.PI / count) - 2,
                        w: 4,
                        h: 4,
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
            const r = minRadius + this.radius * Math.min(1, this.animationTime / EXPANSION_TIME);
            context.arc(this.x, this.y - this.z, r, 0, 2 * Math.PI);
            context.fill();
        context.restore();
    }
}
