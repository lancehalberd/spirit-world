import {evaluateLogicDefinition} from 'app/content/logic';
import {specialBehaviorsHash} from 'app/content/specialBehaviors/specialBehaviorsHash';
import {zones} from 'app/content/zones/zoneHash';
import {getAreaFromLocation} from 'app/utils/area';
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
    const areaSection = state.nextAreaSet?.currentSection || state.areaSet?.currentSection;
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

// Used to be `setAreaSection`, but now `areaSet.currentSection` should only be updated when creating
// the full area set so that it is updated with all sections in the current area set.
export function applyCurrentAreaSection(state: GameState): void {
    if (state.areaSet.currentSection.isAstral) {
        state.hero.isAstralProjection = true;
    } else {
        if (state.hero.isAstralProjection) {
            state.hero.isAstralProjection = false;
            state.hero.z = state.hero.groundHeight;
        }
    }
}

function isPointInAreaSection(tx: number, ty: number, zone: Zone, section: AreaSection): boolean {
    const {w, h} = zone.areaSize;
    const isXValid = (tx < 0 && section.x <= 0)
        || (tx >= section.x && tx < section.x + section.w)
        || (tx >= w && section.x + section.w >= w);
    if (!isXValid) {
        return false;
    }
    const isYValid = (ty < 0 && section.y <= 0)
        || (ty >= section.y && ty < section.y + section.h)
        || (ty >= h && section.y + section.h >= h);
    return isYValid;
}

export function getAreaSectionInstanceForPoint(state: GameState, zone: Zone, area: AreaDefinition, tx: number, ty: number): AreaSectionInstance {
    for (const section of area.sections) {
        if (isPointInAreaSection(tx, ty, zone, section)) {
            return getAreaSectionInstance(state, zone, area, section);
        }
    }
    return getAreaSectionInstance(state, state.zone, area, area.sections[0]);
}

export function getAreaSectionInstanceForLocation(state: GameState, location: ZoneLocation) {
    return getAreaSectionInstanceForPoint(state, zones[location.zoneKey], getAreaFromLocation(location), location.x / 16, location.y / 16);
}

export function getAreaSectionInstance(
    state: GameState,
    zone: Zone,
    area: AreaDefinition,
    definition: AreaSection = {x: 0, y: 0, w: area.w, h: area.h}
): AreaSectionInstance {
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

export function refreshCurrentAreaSectionInstances(
    state: GameState,
) {
    refreshCurrentAreaSectionInstance(state, state.areaSet.currentSection, state.areaSet.current);
    refreshCurrentAreaSectionInstance(state, state.areaSet.alternateSection, state.areaSet.alternate);
    refreshCurrentAreaSectionInstance(state, state.areaSet.underwaterSection, state.areaSet.underwater);
    refreshCurrentAreaSectionInstance(state, state.areaSet.alternateUnderwaterSection, state.areaSet.alternateUnderwater);
    refreshCurrentAreaSectionInstance(state, state.areaSet.surfaceSection, state.areaSet.surface);
    refreshCurrentAreaSectionInstance(state, state.areaSet.alternateSurfaceSection, state.areaSet.alternateSurface);
}

export function refreshCurrentAreaSectionInstance(
    state: GameState,
    sectionInstance: AreaSectionInstance|null,
    areaInstance: AreaInstance|null,
) {
    if (!sectionInstance) {
        return;
    }
    const sectionDefinition = sectionInstance.definition;
    const areaDefinition = areaInstance.definition;
    sectionInstance.isFoggy = evaluateLogicDefinition(state, sectionDefinition.fogLogic ?? areaDefinition.fogLogic ?? state.zone.fogLogic, false);
    sectionInstance.isHot = evaluateLogicDefinition(state, sectionDefinition.hotLogic ?? areaDefinition.hotLogic ?? state.zone.hotLogic, false);
    sectionInstance.isAstral = evaluateLogicDefinition(state, sectionDefinition.astralLogic ?? areaDefinition.astralLogic ?? state.zone.astralLogic, false);
    sectionInstance.isCorrosive = evaluateLogicDefinition(state, sectionDefinition.corrosiveLogic ?? areaDefinition.corrosiveLogic ?? state.zone.corrosiveLogic, false);
}
