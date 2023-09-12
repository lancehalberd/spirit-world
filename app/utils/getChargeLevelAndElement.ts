import { isUnderwater } from 'app/utils/actor';


export function getChargeLevelAndElement(state: GameState, hero: Hero, tool: ActiveTool = null) {
    if (state.hero.magic <= 0) {
        return { chargeLevel: 0, element: null };
    }
    const maxChargeLevel = hero.getMaxChargeLevel(state);
    let chargeLevel = 0;
    let element: MagicElement = null;
    // The Phoenix Crown reduces charge time by 25%.
    let durationMultiplier = hero.savedData.passiveTools.phoenixCrown ? 0.75 : 1;
    // Lightning charges faster than other elements.
    if (state.hero.savedData.element === 'lightning') {
        durationMultiplier *= 2 / 3;
    }
    if (maxChargeLevel >= 2) {
        if (hero.chargeTime >= durationMultiplier * 2000) {
            chargeLevel = 2;
        } else if (hero.chargeTime >= durationMultiplier * 600) {
            chargeLevel = 1;
        }
    } else if (maxChargeLevel >= 1 && hero.chargeTime >= durationMultiplier * 800) {
        chargeLevel = 1;
    }
    // Elemental magic does not work under water.
    if (chargeLevel >= 1 && !isUnderwater(state, hero)) {
        element = state.hero.savedData.element;
    }
    return { chargeLevel, element};
}

// Returns the effective element for the hero, taking into account
// that only the default element can be used underwater.
export function getElement(state: GameState, hero: Hero): MagicElement {
    return isUnderwater(state, hero) ? null : state.hero.savedData.element;
}
