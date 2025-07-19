import {evaluateLogicDefinition} from 'app/content/logic';
import {specialBehaviorsHash} from 'app/content/specialBehaviors/specialBehaviorsHash';
import {exploreSection} from 'app/utils/sections';
import {editingState} from 'app/development/editingState';
import {isPointInShortRect} from 'app/utils/index';
import {removeObjectFromArea} from 'app/utils/objects';


export function removeAllClones(state: GameState): void {
    for (const clone of state.hero.clones) {
        removeObjectFromArea(state, clone);
    }
    state.hero.clones = []
}

export function setAreaSection(state: GameState, newArea: boolean): void {
    //console.log('setAreaSection', state.hero.x, state.hero.y);
    //const lastAreaSection = state.areaSection;
    delete state.areaSection;
    const {w, h} = state.zone.areaSize ?? {w: 32, h: 32};
    // Make sure these are restricted to 1 tile inside the max dimensions as `isPointInShortRect`
    // returns false for points on the edge of the rectangle.
    const x = Math.min(w - 1, Math.max(1, (state.hero.x + 8) / 16));
    const y = Math.min(h - 1, Math.max(1, (state.hero.y + 8) / 16));
    for (const section of state.areaInstance.definition.sections) {
        if (isPointInShortRect(x, y, section)) {
            state.areaSection = getAreaSectionInstance(state, state.zone, state.areaInstance.definition, section);
            exploreSection(state, section.index);
            break;
        }
    }
    // This can sometimes happen when editing, but shouldn't normally happen. Just assign the current section to the first if the hero is not
    // currently in any of the defined sections for this area.
    if (!state.areaSection) {
        state.areaSection = getAreaSectionInstance(state, state.zone, state.areaInstance.definition, state.areaInstance.definition.sections[0]);
    }
    editingState.needsRefresh = true;
    // if (newArea || lastAreaSection !== state.areaSection) {
    if (newArea) {
        cleanupHeroFromArea(state);
        state.hero.safeD = state.hero.d;
        state.hero.safeX = state.hero.x;
        state.hero.safeY = state.hero.y;
    }
    if (state.areaSection.isAstral) {
        state.hero.isAstralProjection = true;
    } else {
        state.hero.isAstralProjection = false;
    }
}

export function setNextAreaSection(state: GameState, d: Direction): void {
    //console.log('setNextAreaSection', d);
    removeAllClones(state);
    delete state.nextAreaSection;
    const hero = state.hero;
    let x = hero.x / 16;
    let y = hero.y / 16;
    if (d === 'right') {
        x += hero.w / 16;
    }
    if (d === 'down') {
        y += hero.h / 16;
    }
    const {w, h} = state.zone.areaSize ?? {w: 32, h: 32};
    x = Math.min(w - 1, Math.max(1, x));
    y = Math.min(h - 1, Math.max(1, y));
    for (const section of state.areaInstance.definition.sections) {
        if (isPointInShortRect(x, y, section)) {
            state.nextAreaSection = getAreaSectionInstance(state, state.zone, state.areaInstance.definition, section);
            exploreSection(state, section.index);
            break;
        }
    }
    // This can sometimes happen when editing, but shouldn't normally happen. Just assign the current section to the first if the hero is not
    // currently in any of the defined sections for this area.
    if (!state.nextAreaSection) {
        state.nextAreaSection = getAreaSectionInstance(state, state.zone, state.areaInstance.definition, state.areaInstance.definition.sections[0]);
    }
}

export function getAreaSectionInstance(state: GameState, zone: Zone, area: AreaDefinition, definition: AreaSection): AreaSectionInstance {
    const section = {
        ...definition,
        definition,
        dark: definition.dark ?? area.dark ?? zone.dark ?? 0,
        isFoggy: evaluateLogicDefinition(state, definition.fogLogic ?? area.fogLogic ?? zone.fogLogic, false),
        isHot: evaluateLogicDefinition(state, definition.hotLogic ?? area.hotLogic ?? zone.hotLogic, false),
        isAstral: evaluateLogicDefinition(state, definition.astralLogic ?? area.astralLogic ?? zone.astralLogic, false),
        isCorrosive: evaluateLogicDefinition(state, definition.corrosiveLogic ?? area.corrosiveLogic ?? zone.corrosiveLogic, false),
    };
    if (area.specialBehaviorKey) {
        const specialBehavior = specialBehaviorsHash[area.specialBehaviorKey] as SpecialAreaBehavior;
        specialBehavior?.applyToSection(state, section);
    }
    return section;
}

export function cleanupHeroFromArea(state: GameState): void {
    for (const hero of [state.hero, ...state.hero.clones]) {
        hero.activeStaff?.remove(state);
    }
    removeAllClones(state);
}

export const BG_FRAME_DURATION = 160, BG_FRAME_COUNT = 6;
export function getBackgroundFrame(state: GameState, areaInstance: AreaInstance): AreaFrame {
    const frame = editingState.isEditing ? 0 : (Math.floor(state.fieldTime / BG_FRAME_DURATION) % BG_FRAME_COUNT);
    return areaInstance.backgroundFrames[frame];
}
export function getBackgroundFrameIndex(state: GameState, areaInstance: AreaInstance): number {
    return editingState.isEditing ? 0 : (Math.floor(state.fieldTime / BG_FRAME_DURATION) % BG_FRAME_COUNT);
}
