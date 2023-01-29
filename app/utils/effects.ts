import {
    AreaInstance, EffectInstance, GameState,
} from 'app/types';

export function addEffectToArea(state: GameState, area: AreaInstance, effect: EffectInstance): void {
    if (effect.area && effect.area !== area) {
        removeEffectFromArea(state, effect);
    }
    effect.area = area;
    if (effect.add) {
        effect.add(state, area);
    } else {
        area.effects.push(effect);
    }
}
export function removeEffectFromArea(state: GameState, effect: EffectInstance): void {
    if (!effect.area) {
        return;
    }
    if (effect.remove) {
        effect.remove(state);
        effect.area = null;
    } else {
        if (effect.cleanup) {
            effect.cleanup(state);
        }
        const index = effect.area.effects.indexOf(effect);
        if (index >= 0) {
            effect.area.effects.splice(index, 1);
        }
        effect.area = null;
    }
}
