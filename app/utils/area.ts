import { isPointInShortRect } from 'app/utils/index';
import { removeObjectFromArea } from 'app/utils/objects';

import { Direction, GameState } from 'app/types';

export function removeAllClones(state: GameState): void {
    for (const clone of state.hero.clones) {
        removeObjectFromArea(state, clone);
    }
    state.hero.clones = []
}

export function setAreaSection(state: GameState, d: Direction, newArea: boolean = false): void {
    //console.log('setAreaSection', state.hero.x, state.hero.y, d);
    const lastAreaSection = state.areaSection;
    state.areaSection = state.areaInstance.definition.sections[0];
    let x = Math.min(32, Math.max(0, (state.hero.x + 8) / 16));
    let y = Math.min(32, Math.max(0, (state.hero.y + 8) / 16));
    for (const section of state.areaInstance.definition.sections) {
        if (isPointInShortRect(x, y, section)) {
            state.areaSection = section;
            break;
        }
    }
    if (newArea || lastAreaSection !== state.areaSection) {
        cleanupHeroFromArea(state);
        state.hero.safeD = state.hero.d;
        state.hero.safeX = state.hero.x;
        state.hero.safeY = state.hero.y;
    }
}

export function cleanupHeroFromArea(state: GameState): void {
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.activeStaff?.remove(state);
    }
    removeAllClones(state);
}
