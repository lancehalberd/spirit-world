import { GameState, Hero } from 'app/types';

export function isUnderwater(state: GameState, hero: Hero): boolean {
    return state.zone.surfaceKey && !hero.area.definition.isSpiritWorld;
}

export function isHeroSinking(state: GameState, hero: Hero): boolean {
    return isUnderwater(state, hero) && !hero.isAstralProjection && hero.equipedBoots === 'ironBoots' && hero.z > 0;
}

export function isHeroFloating(state: GameState, hero: Hero): boolean {
    return isUnderwater(state, hero) && !hero.isAstralProjection && hero.equipedBoots !== 'ironBoots';
}
