import {rectanglesOverlap, isPixelInShortRect} from 'app/utils/index';

export function isSectionExplored(state: GameState, sectionIndex: number): boolean {
    const numberIndex = (sectionIndex / 32) | 0;
    const bitIndex = sectionIndex % 32;
    return !!(state.savedState.exploredSections[numberIndex] >> bitIndex & 1)
}

export function exploreSection(state: GameState, sectionIndex: number) {
    const numberIndex = (sectionIndex / 32) | 0;
    const bitIndex = sectionIndex % 32;
    if (!(state.savedState.exploredSections[numberIndex] >> bitIndex & 1)) {
        state.savedState.exploredSections[numberIndex] = state.savedState.exploredSections[numberIndex] || 0;
        state.savedState.exploredSections[numberIndex] = state.savedState.exploredSections[numberIndex] | (1 << bitIndex);
        state.map.needsRefresh = true;
    }
}


export function isObjectInCurrentSection(state: GameState, object: ObjectInstance | EffectInstance): boolean {
    const areaSection = state.nextAreaSet?.areaSection || state.areaSet?.areaSection;
    // We will make the object count as in the current section if it is linked to an object in the current area
    // so that linked doors can still trigger the secret chime when they are triggered from the atlernate area.
    // We can add a more specific fix for this if this turns out to be a bad change.
    return (object.area === state.areaSet?.current || object.linkedObject?.area === state.areaSet?.current)
        && rectanglesOverlap(getSectionRect(areaSection), object.getHitbox());
}

export function getSectionRect(section: Rect): Rect {
    return {
        x: section.x * 16,
        y: section.y * 16,
        w: section.w * 16,
        h: section.h * 16,
    };
}

export function isDefinitionFromSection(object: SelectableDefinition, section: AreaSection): boolean {
    // We will make the object count as in the current section if it is linked to an object in the current area
    // so that linked doors can still trigger the secret chime when they are triggered from the atlernate area.
    // We can add a more specific fix for this if this turns out to be a bad change.
    return isPixelInShortRect(object.x, object.y, getSectionRect(section));
}

export function getAreaSectionForDefinition(state: GameState, object: SelectableDefinition): AreaSection {
    for (const section of state.areaSet?.current.definition.sections) {
        if (isPixelInShortRect(object.x, object.y, getSectionRect(section))) {
            return section;
        }
    }
    console.warn("Object was outside of all defined sections", object, state.areaSet?.current.definition.sections);
    return state.areaSet?.current.definition.sections[0];
}
