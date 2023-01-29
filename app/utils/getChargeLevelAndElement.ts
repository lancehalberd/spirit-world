import { isUnderwater } from 'app/utils/actor';

import { ActiveTool, GameState, Hero, MagicElement } from 'app/types';

export function getChargeLevelAndElement(state: GameState, hero: Hero, tool: ActiveTool = null) {
    if (state.hero.magic <= 0) {
        return { chargeLevel: 0, element: null };
    }
    const maxChargeLevel = hero.getMaxChargeLevel(state);
    let chargeLevel = 0;
    let element: MagicElement = null;
    // The Phoenix Crown reduces charge time by 25%.
    const durationMultiplier = hero.passiveTools.phoenixCrown ? 0.75 : 1;
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
        element = state.hero.element;
    }
    return { chargeLevel, element};
}
