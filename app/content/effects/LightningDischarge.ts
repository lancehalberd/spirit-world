import { LightningAnimationEffect } from 'app/content/effects/lightningAnimationEffect';
import { FRAME_LENGTH } from 'app/gameConstants';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { hitTargets } from 'app/utils/field';

import { AreaInstance, EffectInstance, Enemy, GameState } from 'app/types';

interface Props {
    x: number
    y: number,
    damage?: number
    radius?: number
    source?: Enemy
    tellDuration?: number
}

export class LightningDischarge implements EffectInstance {
    area: AreaInstance;
    animationTime: number = 0;
    isEffect = <const>true;
    isEnemyAttack = true;
    x: number;
    y: number;
    damage: number;
    radius: number;
    source: Enemy;
    tellDuration: number;
    constructor({x = 0, y = 0, damage = 2, radius = 48, source, tellDuration = 1000}: Props) {
        this.animationTime = 0;
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.radius = radius;
        this.source = source;
        this.tellDuration = tellDuration;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        // If this effect has an enemy as a source, remove it if the source disappears during the tell duration.
        if (this.animationTime < this.tellDuration && this.source) {
            if (this.area !== this.source.area || this.source.status === 'gone' || !this.area.objects.includes(this.source)) {
                removeEffectFromArea(state, this);
                return;
            }
        }
        if (this.source) {
            const enemyHitbox = this.source.getHitbox(state);
            this.x = enemyHitbox.x + enemyHitbox.w / 2;
            this.y = enemyHitbox.y + enemyHitbox.h / 2;
        }
        if (this.animationTime >= this.tellDuration) {
            hitTargets(state, this.area, {
                damage: 4,
                element: 'lightning',
                hitCircle: {
                    x: this.x,
                    y: this.y,
                    r: this.radius,
                },
                hitAllies: true,
                hitObjects: true,
                hitTiles: true,
                hitEnemies: true,
                knockAwayFrom: {x: this.x, y: this.y},
            });
            addEffectToArea(state, this.area, new LightningAnimationEffect({
                circle: {x: this.x, y: this.y, r: this.radius},
                duration: 200,
            }));
            removeEffectFromArea(state, this);
        }
    }
    render(context, state: GameState) {
        if (this.animationTime < this.tellDuration) {
            const p = Math.max(0, Math.min(1, this.animationTime / this.tellDuration));
            context.save();
                // Darker yellow outline shows the full radius of the attack.
                context.globalAlpha *= 0.3;
                context.beginPath();
                context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
                context.strokeStyle = 'yellow';
                context.stroke();
                // Lighter fill grows to indicate when the attack will hit.
                context.globalAlpha *= 0.3;
                context.beginPath();
                context.arc(this.x, this.y, p * this.radius, 0, 2 * Math.PI);
                context.fillStyle = 'yellow';
                context.fill();
                //context.globalAlpha *= 0.66;
                //renderLightningCircle(context, {x: this.x, y: this.y, r: p * this.radius}, 5);
            context.restore();
        }
    }
}
