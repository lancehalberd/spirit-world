
export function isUnderwater(state: GameState, actor: ObjectInstance): boolean {
    return state.zone.surfaceKey && !actor.area.definition.isSpiritWorld;
}

export function isHeroSinking(state: GameState, hero: Hero): boolean {
    return isUnderwater(state, hero) && !hero.isAstralProjection && hero.savedData.equippedBoots === 'ironBoots' && hero.z > 0;
}

export function isHeroFloating(state: GameState, hero: Hero): boolean {
    return isUnderwater(state, hero) && !hero.isAstralProjection && hero.savedData.equippedBoots !== 'ironBoots';
}
