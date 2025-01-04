import {getCardinalDirection} from 'app/utils/direction';
import {getVectorToTarget} from 'app/utils/target';

export function isUnderwater(state: GameState, actor: ObjectInstance): boolean {
    return state.zone.surfaceKey && !actor.area.definition.isSpiritWorld;
}

export function isHeroSinking(state: GameState, hero: Hero): boolean {
    return isUnderwater(state, hero) && !hero.isAstralProjection && hero.savedData.equippedBoots === 'ironBoots' && hero.z > hero.groundHeight;
}

export function isHeroFloating(state: GameState, hero: Hero): boolean {
    return isUnderwater(state, hero) && !hero.isAstralProjection && hero.savedData.equippedBoots !== 'ironBoots';
}

export function faceTarget(state: GameState, actor: Actor, target: ObjectInstance | EffectInstance) {
    const vector = getVectorToTarget(state, actor, target);
    actor.d = getCardinalDirection(vector.x, vector.y, actor.d);
}
