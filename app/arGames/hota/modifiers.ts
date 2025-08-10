
export function addModifierEffectsToField(state: GameState, gameState: HotaState, savedState: HotaSavedState, source: BattleObject, effects: HotaStatModifierEffect[]) {
    for(const effect of effects) {
        gameState.modifierEffects.push(effect);
        for (const lane of gameState.lanes) {
            for (const object of lane.objects) {
                if (doesEffectApplyToUnit(object, effect)) {
                    addModifierEffectToUnit(object, effect);
                }
            }
        }
    }
}

export function removeModifierEffectsFromField(state: GameState, gameState: HotaState, savedState: HotaSavedState,source: BattleObject, effects: HotaStatModifierEffect[]) {
    for(const effect of effects) {
        const index = gameState.modifierEffects.indexOf(effect);
        if (index < 0) {
            continue;
        }
        gameState.modifierEffects.splice(index, 1);
        for (const lane of gameState.lanes) {
            for (const object of lane.objects) {
                // This will do nothing if the effect doesn't happen to be on the unit for some reason.
                removeModifierEffectFromUnit(object, effect);
            }
        }
    }
}

export function addModifierEffectToUnit(unit: BattleObject, effect: HotaStatModifierEffect) {
    unit.modifiers.push(effect);
    for (const modifier of effect.modifiers) {
        if (unit.stats[modifier.statKey]) {
            unit.stats[modifier.statKey].addModifier(modifier);
        }
    }
}

export function removeModifierEffectFromUnit(unit: BattleObject, effect: HotaStatModifierEffect) {
    const index = unit.modifiers.indexOf(effect);
    if (index < 0) {
        return;
    }
    unit.modifiers.splice(index, 1);
    for (const modifier of effect.modifiers) {
        if (unit.stats[modifier.statKey]) {
            unit.stats[modifier.statKey].removeModifier(modifier);
        }
    }
}

export function doesEffectApplyToUnit(unit: BattleObject, effect: HotaStatModifierEffect): boolean {
    if (effect.lane && effect.lane !== unit.lane) {
        return false;
    }
    if (!effect.effectsTowers && unit.unitType === 'tower') {
        return false;
    }
    if (!effect.effectsHeroes && unit.unitType === 'hero') {
        return false;
    }
    if (effect.effectsMinions === false && unit.unitType === 'minion') {
        return false;
    }
    if (effect.isEnemy === true && unit.isEnemy === false) {
        return false;
    }
    if (effect.isEnemy === false && unit.isEnemy === true) {
        return false;
    }
    return true;
}
