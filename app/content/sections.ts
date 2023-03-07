import { zones } from 'app/content/zones/zoneHash';

import { AreaDefinition, AreaSection, GameState, Point } from 'app/types';

interface SectionData {
    section: AreaSection
    area: AreaDefinition
    zoneKey: string
    floor: number
    isSpiritWorld: boolean
    coords: Point
}

interface DungeonMap {
    floors: {[key: string]: DungeonFloorMap}
}
interface DungeonFloorMap {
    grid: number[][]
}

let nextFreeId = 0;
export const allSections: SectionData[] = [];
window['allSections'] = allSections;
export const dungeonMaps: {[key: string]: DungeonMap} = {};
window['dungeonMaps'] = dungeonMaps;

function goToNextFreeId() {
    while(allSections[nextFreeId]) {
        nextFreeId++;
    }
}

export function populateAllSections() {
    const newSections: SectionData[] = [];
    for (const zoneKey of Object.keys(zones)) {
        const zone = zones[zoneKey];
        // populate sections that already have an index to the allSections array.
        for (let floorIndex = 0; floorIndex < zone.floors.length; floorIndex++) {
            const floor = zone.floors[floorIndex];
            for (const grid of [floor.grid, floor.spiritGrid]) {
                const isSpiritWorld = grid === floor.spiritGrid;
                for (let y = 0; y < grid.length; y++) {
                    for (let x = 0; x < grid[y].length; x++) {
                        for (const section of (grid[y][x]?.sections || [])) {
                            if (section.index >= 0) {
                                // If this spot was assigned, move whatever is there to a new location.
                                if (allSections[section.index]) {
                                    goToNextFreeId();
                                    allSections[nextFreeId] = allSections[section.index]
                                }
                                allSections[section.index] = {
                                    section,
                                    area: grid[y][x],
                                    zoneKey,
                                    floor: floorIndex,
                                    coords: [x, y],
                                    isSpiritWorld,
                                };
                            } else {
                                newSections.push({
                                    section,
                                    area: grid[y][x],
                                    zoneKey,
                                    floor: floorIndex,
                                    coords: [x, y],
                                    isSpiritWorld,
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    // Assign indexes to any sections that didn't have one yet and add them to allSections array.
    for (const section of newSections) {
        goToNextFreeId();
        section.section.index = nextFreeId;
        allSections[nextFreeId] = section;
    }
    populateSectionMapData();
}
function populateSectionMapData(): void {
    for (const sectionData of allSections) {
        const section = sectionData?.section;
        if (!section) {
            continue;
        }
        if (!section.mapId) {
            section.mapId = sectionData.zoneKey;
            if (sectionData.isSpiritWorld) {
                section.mapId += 'Spirit';
            }
        }
        if (!section.entranceId) {
            if (!section.floorId) {
                section.floorId = `${sectionData.floor + 1}F`;
            }
            if (!(section.mapX >= 0 && section.mapY >= 0)) {
                section.mapX = sectionData.coords[0] * 2 + (section.x / 16) | 0;
                section.mapY = sectionData.coords[1] * 2 + (section.y / 16) | 0;
            }
        }
        // Sections that show overworld areas aren't added to any dungeon maps.
        if (['underwater', 'overworld', 'sky'].includes(section.mapId)) {
            continue;
        }
        const map = dungeonMaps[section.mapId] = dungeonMaps[section.mapId] || {floors: {}};
        const floor = map.floors[section.floorId] = map.floors[section.floorId] || {grid: []};
        floor.grid[section.mapY] = floor.grid[section.mapY] || [];
        floor.grid[section.mapY][section.mapX] = section.index;
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
