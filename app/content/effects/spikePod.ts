import { removeEffectFromArea } from 'app/content/areas';
import { getVectorToNearestTargetOrRandom } from 'app/content/enemies';
import { CrystalSpike } from 'app/content/effects/arrow';
import { FRAME_LENGTH } from 'app/gameConstants';

import {
    AreaInstance, EffectInstance,
    Frame, GameState,
    HitProperties, HitResult,
} from 'app/types';

interface Props {
    x?: number
    y?: number,
    damage?: number,
    delay?: number,
}

const growDuration = 1500;
const fadeDuration = 200;

export class SpikePod implements EffectInstance, Props {
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
    w: number = 16;
    h: number = 16;
    shockWaves: number;
    shockWaveTheta: number;
    animationTime = 0;
    hasBurst: boolean = false;
    isEnemyTarget: boolean = true;
    constructor({x = 0, y = 0, damage = 2}: Props) {
        this.x = x - this.w / 2;
        this.y = y - this.h / 2;
        this.damage = damage;
    }
    getHitbox(state: GameState) {
        return this;
    }
    burst(state: GameState, theta: number, reflected = false) {
        if (this.hasBurst) {
            return;
        }
        for (let i = 0; i < 5; i++) {
            const dx = Math.cos(theta + i * Math.PI / 4) * (reflected ? -1 : 1);
            const dy = Math.sin(theta + i * Math.PI / 4) * (reflected ? -1 : 1);
            CrystalSpike.spawn(state, this.area, {
                x: this.x + this.w / 2 + this.w / 2 * dx,
                y: this.y + this.h / 2 + this.h / 2 * dy,
                damage: this.damage,
                vx: 4 * dx,
                vy: 4 * dy,
                reflected
            });
        }
        // Reset animation time for the fade animation.
        this.hasBurst = true;
        this.animationTime = 0;
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        const {x, y} = getVectorToNearestTargetOrRandom(state, this, [hit.source]);
        const theta = Math.round((Math.atan2(y, x) - Math.PI / 2) / (Math.PI / 4)) * Math.PI / 4;
        this.burst(state, theta, true);
        return {};
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (!this.hasBurst) {
            if (this.animationTime >= growDuration) {
                const {x, y} = getVectorToNearestTargetOrRandom(state, this, this.area.allyTargets);
                const theta = Math.round((Math.atan2(y, x) - Math.PI / 2) / (Math.PI / 4)) * Math.PI / 4;
                this.burst(state, theta);
            }
            return;
        } else if (this.animationTime >= fadeDuration) {
            removeEffectFromArea(state, this);
        }
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        // Animate a warning indicator on the ground.
        context.save();
            context.globalAlpha *= 0.5;
            context.fillStyle = 'black';
            const r = !this.hasBurst
                ? 2 + 5 * Math.min(1, this.animationTime / growDuration)
                : 7;
            context.beginPath();
            context.translate(this.x + this.w / 2, this.y + this.h);
            context.scale(1, 0.5);
            context.arc(0, 0, r, 0, 2 * Math.PI);
            context.fill();
        context.restore();
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // context.fillStyle = 'red';
        // context.fillRect(this.x, this.y, this.w, this.h);
        if (!this.hasBurst) {
            const p = Math.min(1, this.animationTime / growDuration);
            const radius = 2 + 5 * p;
            context.beginPath();
            context.arc(this.x + this.w / 2, this.y + this.h - radius, radius, 0, 2 * Math.PI);
            context.fillStyle = 'white';
            context.fill();
        } else {
            const p = Math.min(1, this.animationTime / fadeDuration);
            const radius = 7;
            const theta = Math.PI / 6 + 5 * Math.PI / 6 * p;
            context.beginPath();
            context.arc(this.x + this.w / 2, this.y + this.h - radius, radius, -Math.PI / 2 + theta, 3 * Math.PI / 2 - theta);
            context.fillStyle = 'white';
            context.fill();
        }
    }
}
