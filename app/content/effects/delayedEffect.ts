import { FRAME_LENGTH } from 'app/gameConstants';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';

interface Props {
    delay: number
    effect: EffectInstance
}

export class DelayedEffect implements EffectInstance, Props {
    drawPriority: DrawPriority = 'sprites';
    isEffect = <const>true;
    isEnemyAttack = true;
    area: AreaInstance = null;
    delay: number;
    effect: EffectInstance;

    constructor({delay, effect}: Props) {
        this.isEnemyAttack = effect.isEnemyAttack;
        this.delay = delay;
        this.effect = effect;
    }
    update(state: GameState) {
        this.delay -= FRAME_LENGTH;
        if (this.delay <= 0) {
            addEffectToArea(state, this.area, this.effect);
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {}
}
