import { zones } from 'app/content/zones/zoneHash';

import { AreaSection, GameState } from 'app/types';
let nextFreeId = 0;
export const allSections: AreaSection[] = [];

function goToNextFreeId() {
    while(allSections[nextFreeId]) {
        nextFreeId++;
    }
}

export function populateAllSections() {
    for (const zoneKey of Object.keys(zones)) {
        const zone = zones[zoneKey];
        const newSections: AreaSection[] = [];
        // populate sections that already have an index to the allSections array.
        for (const floor of zone.floors) {
            for (const grid of [floor.grid, floor.spiritGrid]) {
                for (let y = 0; y < grid.length; y++) {
                    for (let x = 0; x < grid[y].length; x++) {
                        for (const section of (grid[y][x]?.sections || [])) {
                            if (section.index >= 0) {
                                // If this spot was assigned, move whatever is there to a new location.
                                if (allSections[section.index]) {
                                    goToNextFreeId();
                                    allSections[nextFreeId] = allSections[section.index]
                                }
                                allSections[section.index] = section;
                            } else {
                                newSections.push(section);
                            }
                        }
                    }
                }
            }
        }
        // Assign indexes to any sections that didn't have one yet and add them to allSections array.
        for (const section of newSections) {
            goToNextFreeId();
            section.index = nextFreeId;
            allSections[section.index] = section;
        }
    }
}

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
