
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
