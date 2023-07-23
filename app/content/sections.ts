import { getAreaFromLocation } from 'app/content/areas';
import { zones } from 'app/content/zones/zoneHash';
import { overworldKeys } from 'app/gameConstants';


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
    sections: number[]
}

let nextFreeId = 0;
export const allSections: SectionData[] = [];
window['allSections'] = allSections;
export const dungeonMaps: {[key: string]: DungeonMap} = {};
window['dungeonMaps'] = dungeonMaps;

export function getNextFreeId() {
    while(allSections[nextFreeId]) {
        nextFreeId++;
    }
    return nextFreeId;
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
                            const location: ZoneLocation = {
                                zoneKey,
                                floor: floorIndex,
                                isSpiritWorld,
                                areaGridCoords: {x, y},
                                x: 0, y: 0,
                                d: 'down'
                            }
                            if (section.index >= 0) {
                                // If this spot was assigned, move whatever is there to a new location.
                                if (allSections[section.index]) {
                                    const newIndex = getNextFreeId();
                                    allSections[newIndex] = allSections[section.index];
                                    allSections[newIndex].section.index = newIndex;
                                }
                                allSections[section.index] = {
                                    section,
                                    area: getAreaFromLocation(location),
                                    zoneKey,
                                    floor: floorIndex,
                                    coords: [x, y],
                                    isSpiritWorld,
                                };
                            } else {
                                newSections.push({
                                    section,
                                    area: getAreaFromLocation(location),
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
        section.section.index = getNextFreeId();
        allSections[section.section.index] = section;
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
        if (overworldKeys.includes(section.mapId)) {
            continue;
        }
        const map = dungeonMaps[section.mapId] = dungeonMaps[section.mapId] || {floors: {}};
        const floor = map.floors[section.floorId] = map.floors[section.floorId] || {sections: []};
        floor.sections.push(section.index);
    }
    // Fix the maps so the floors appear in the order B(N), B(N - 1)..., B1, 1F, ... (N-1)F, (N)F.
    for (const map of Object.values(dungeonMaps)) {
        const orderedFloors = {};
        const orderedKeys = Object.keys(map.floors).sort((a, b) => {
            if (a[0] === 'B') {
                if (b[0] === 'B') {
                    return Number(a.substring(1)) - Number(b.substring(1));
                }
                return -1;
            } else {
                if (b[0] === 'B') {
                    return 1;
                }
                return Number(a.substring(0, a.length - 1)) - Number(b.substring(0, b.length - 1));
            }
            return 0;
        })
        for (const key of orderedKeys) {
            orderedFloors[key] = map.floors[key];
        }
        map.floors = orderedFloors;
    }
}
