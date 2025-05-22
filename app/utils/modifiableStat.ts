
function computedIsFunction<T, U>(computed: Computable<T>): computed is () => T {
    return (typeof computed === 'function');
}

export function computeValue<T>(computable: Computable<T>): T {
    if (computedIsFunction(computable)) {
        return computable();
    }
    return computable;
}

export function modifiableStat(baseValue: Computable<number>, minValue?: number, maxValue?: number): ModifiableStat {
    const modifiableStat: ModifiableStat = () => getModifiableStatValue(modifiableStat);
    modifiableStat.addModifier = (modifier: StatModifier) => addModifierToModifiableStat(modifiableStat, modifier);
    modifiableStat.removeModifier = (modifier: StatModifier) => removeModifierFromModifiableState(modifiableStat, modifier);
    modifiableStat.baseValue = baseValue;
    modifiableStat.flatBonus = 0;
    modifiableStat.percentBonus = 0;
    modifiableStat.multipliers = [];
    modifiableStat.finalValue = 0;
    modifiableStat.isDirty = true;
    modifiableStat.minValue = minValue;
    modifiableStat.maxValue = maxValue;
    return modifiableStat;
}
window.modifiableStat = modifiableStat;
function getModifiableStatValue(stat: ModifiableStat): number {
    if (!stat.isDirty) {
        return stat.finalValue;
    }
    let value = (computeValue(stat.baseValue) + stat.flatBonus) * (1 + stat.percentBonus / 100);
    for (const multiplier of stat.multipliers) {
        value *= multiplier;
    }
    if (typeof stat.minValue === 'number') {
        value = Math.max(value, stat.minValue);
    }
    if (typeof stat.maxValue === 'number') {
        value = Math.min(value, stat.maxValue);
    }
    stat.finalValue = value;
    stat.isDirty = false;
    return stat.finalValue;
}
function addModifierToModifiableStat(stat: ModifiableStat, modifier: StatModifier) {
    stat.flatBonus += modifier.flatBonus;
    stat.percentBonus += modifier.percentBonus;
    stat.multipliers.push(modifier.multiplier);
    stat.isDirty = true;
}
function removeModifierFromModifiableState(stat: ModifiableStat, modifier: StatModifier) {
    stat.flatBonus -= modifier.flatBonus;
    stat.percentBonus -= modifier.percentBonus;
    const index = stat.multipliers.indexOf(modifier.multiplier);
    if (index >= 0) {
        stat.multipliers.splice(index, 1);
    }
    stat.isDirty = true;
}
