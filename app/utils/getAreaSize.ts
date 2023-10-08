
export function getAreaSize(state: GameState): {w: number, h: number, section: Rect} {
    const area = state.areaInstance;
    const areaSection = state.nextAreaSection || state.areaSection;
    return {
        w: 16 * area.w,
        h: 16 * area.h,
        section: {
            x: areaSection.x * 16,
            y: areaSection.y * 16,
            w: areaSection.w * 16,
            h: areaSection.h * 16,
        },
    }
}

export function getAreaDimensions(definition: AreaDefinition): {w: number, h: number} {
    // Newer areas will store their size directly on the definition.
    if (definition.w && definition.h) {
        return {w: definition.w, h: definition.h};
    }
    // Older areas can determine the size from any layers size, if any are defined.
    if (definition.layers?.[0]?.grid) {
        return definition.layers[0].grid;
    }
    // If this area has no populated layers, its parent should have at least one layer.
    if (definition.parentDefinition) {
        return getAreaDimensions(definition.parentDefinition);
    }
    // If all else fails, just assume default area size is 32x32
    console.warn('Assuming default area size is 32x32');
    return {w: 32, h: 32};
}
