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

export function setAreaSection(state: GameState, newArea: boolean): void {
    //console.log('setAreaSection', state.hero.x, state.hero.y);
    //const lastAreaSection = state.areaSection;
    state.areaSection = getAreaSectionInstance(state, state.areaInstance.definition.sections[0]);
    const {w, h} = state.zone.areaSize ?? {w: 32, h: 32};
    // Make sure these are restricted to 1 tile inside the max dimensions as `isPointInShortRect`
    // returns false for points on the edge of the rectangle.
    const x = Math.min(w - 1, Math.max(1, (state.hero.x + 8) / 16));
    const y = Math.min(h - 1, Math.max(1, (state.hero.y + 8) / 16));
    for (const section of state.areaInstance.definition.sections) {
        if (isPointInShortRect(x, y, section)) {
            state.areaSection = getAreaSectionInstance(state, section);
            exploreSection(state, section.index);
            break;
        }
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
    state.nextAreaSection = getAreaSectionInstance(state, state.areaInstance.definition.sections[0]);
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
            state.nextAreaSection = getAreaSectionInstance(state, section);
            exploreSection(state, section.index);
            break;
        }
    }
}

export function getAreaSectionInstance(state: GameState, definition: AreaSection): AreaSectionInstance {
    return {
        ...definition,
        definition,
        isFoggy: evaluateLogicDefinition(state, definition.fogLogic, false),
        isHot: evaluateLogicDefinition(state, definition.hotLogic, false),
        isAstral: evaluateLogicDefinition(state, definition.astralLogic, false),
    }
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
