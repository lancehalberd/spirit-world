import { evaluateLogicDefinition } from 'app/content/logic';
import { exploreSection } from 'app/utils/sections';
import { editingState } from 'app/development/editingState';
import { isPointInShortRect } from 'app/utils/index';
import { removeObjectFromArea } from 'app/utils/objects';


export function removeAllClones(state: GameState): void {
    for (const clone of state.hero.clones) {
        removeObjectFromArea(state, clone);
    }
    state.hero.clones = []
}

export function setAreaSection(state: GameState, newArea: boolean = false): void {
    //console.log('setAreaSection', state.hero.x, state.hero.y);
    const lastAreaSection = state.areaSection;
    state.areaSection = getAreaSectionInstance(state, state.areaInstance.definition.sections[0]);
    const x = Math.min(31, Math.max(0, (state.hero.x + 8) / 16));
    const y = Math.min(31, Math.max(0, (state.hero.y + 8) / 16));
    for (const section of state.areaInstance.definition.sections) {
        if (isPointInShortRect(x, y, section)) {
            state.areaSection = getAreaSectionInstance(state, section);
            exploreSection(state, section.index);
            break;
        }
    }
    editingState.needsRefresh = true;
    if (newArea || lastAreaSection !== state.areaSection) {
        cleanupHeroFromArea(state);
        state.hero.safeD = state.hero.d;
        state.hero.safeX = state.hero.x;
        state.hero.safeY = state.hero.y;
    }
}

export function getAreaSectionInstance(state: GameState, definition: AreaSection): AreaSectionInstance {
    return {
        ...definition,
        definition,
        isHot: evaluateLogicDefinition(state, definition.hotLogic, false)
    }
}

export function cleanupHeroFromArea(state: GameState): void {
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.activeStaff?.remove(state);
    }
    removeAllClones(state);
}
