import { FRAME_LENGTH } from 'app/gameConstants';
import { renderLightningCircle, renderLightningRay } from 'app/render/renderLightning'
import { removeEffectFromArea } from 'app/utils/effects';

import { AreaInstance, Circle, EffectInstance, GameState, Ray } from 'app/types';

interface Props {
    ray?: Ray
    circle?: Circle
    duration?: number
}

export class LightningAnimationEffect implements EffectInstance, Props {
    area: AreaInstance;
    animationTime: number = 0;
    isEffect = <const>true;
    isEnemyAttack = true;
    x: number = 0;
    y: number = 0;
    ray?: Ray;
    circle?: Circle;
    duration?: number;
    constructor({circle, ray, duration}: Props) {
        this.animationTime = 0;
        this.circle = circle;
        this.ray = ray;
        this.duration = duration;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.animationTime >= this.duration) {
            removeEffectFromArea(state, this);
        }
    }
    render(context, state: GameState) {
        if (this.circle) {
            renderLightningCircle(context, this.circle, 4, Math.min(100, Math.max(40, this.circle.r | 0)));
        } else if (this.ray) {
            renderLightningRay(context, this.ray, 4);
        }
    }
}
