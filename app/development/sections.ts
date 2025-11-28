import { getAreaFromLocation } from 'app/content/areas';
import { allSections, dungeonMaps, getNextFreeId } from 'app/content/sections';
import { editingState } from 'app/development/editingState';
import { overworldKeys } from 'app/gameConstants';


export function initializeSection(section: AreaSection, location: ZoneLocation) {
    if (!(section.index >= 0)) {
        section.index = getNextFreeId();
        allSections[section.index] = {
            section,
            area: getAreaFromLocation(location),
            location,
        };
    }
    if (!section.mapId) {
        section.mapId = location.zoneKey;
        if (location.isSpiritWorld) {
            section.mapId += 'Spirit';
        }
    }
    if (!section.entranceId) {
        if (!section.floorId) {
            section.floorId = `${location.floor + 1}F`;
        }
        if (!(section.mapX >= 0 && section.mapY >= 0)) {
            section.mapX = location.areaGridCoords.x * 2 + (section.x / 16) | 0;
            section.mapY = location.areaGridCoords.y * 2 + (section.y / 16) | 0;
        }
    }
    // Sections that show overworld areas aren't added to any dungeon maps.
    if (overworldKeys.includes(section.mapId)) {
        return;
    }
    const map = dungeonMaps[section.mapId] = dungeonMaps[section.mapId] || {floors: {}};
    const floor = map.floors[section.floorId] = map.floors[section.floorId] || {sections: []};
    floor.sections.push(section.index);
}

export function updateMapSections(state: GameState, sections: number[], data: Partial<AreaSection>): void {
    for (const sectionIndex of sections) {
        const section = allSections[sectionIndex].section;
        const index = dungeonMaps[section.mapId]?.floors[section.floorId]?.sections?.indexOf(sectionIndex);
        const oldMapId = section.mapId, oldFloorId = section.floorId;
        if (index >= 0) {
            dungeonMaps[section.mapId].floors[section.floorId].sections.splice(index, 1);
        }
        section.mapId = data.mapId;
        section.floorId = data.floorId;
        section.entranceId = data.entranceId;
        // Add the section to the new map, if it is a dungeon map (as opposed to an overworld map).
        if (!data.entranceId) {
            dungeonMaps[section.mapId] = dungeonMaps[section.mapId] || {floors: {}};
            dungeonMaps[section.mapId].floors[section.floorId] = dungeonMaps[section.mapId]?.floors[section.floorId] || {sections: []};
            dungeonMaps[section.mapId].floors[section.floorId].sections.push(sectionIndex);
            if (dungeonMaps[oldMapId]?.floors[oldFloorId]?.sections.length === 0) {
                delete dungeonMaps[oldMapId]?.floors[oldFloorId];
            }
        }
    }
    state.map.needsRefresh = true;
    editingState.selectedSections = [];
}

export function replaceMapSections(state: GameState, location: ZoneLocation, removedSections: AreaSection[], addedSections: AreaSection[] = []) {
    for (const section of removedSections) {
        if (!(section.index >= 0)) {
            continue;
        }
        allSections[section.index] = null;
        const index = dungeonMaps[section.mapId]?.floors[section.floorId]?.sections?.indexOf(section.index);
        if (index >= 0) {
            dungeonMaps[section.mapId].floors[section.floorId].sections.splice(index, 1);
            if (dungeonMaps[section.mapId]?.floors[section.floorId]?.sections.length === 0) {
                delete dungeonMaps[section.mapId]?.floors[section.floorId];
            }
        }
    }
    for (const section of addedSections) {
        initializeSection(section, location);
    }
    state.map.needsRefresh = true;
    editingState.selectedSections = [];
}
