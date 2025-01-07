import {getAreaSize} from 'app/utils/getAreaSize';
import {rectanglesOverlap} from 'app/utils/index';

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
    // We will make the object count as in the current section if it is linked to an object in the current area
    // so that linked doors can still trigger the secret chime when they are triggered from the atlernate area.
    // We can add a more specific fix for this if this turns out to be a bad change.
    return (object.area === state.areaInstance || object.linkedObject?.area === state.areaInstance)
        && rectanglesOverlap(getAreaSize(state).section, object.getHitbox());
}
