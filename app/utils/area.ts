import {zones} from 'app/content/zones/zoneHash';
//import {exploreSection} from 'app/utils/sections';
import {editingState} from 'app/development/editingState';
//import {clamp, isPointInShortRect} from 'app/utils/index';
import {initializeAreaTiles} from 'app/utils/layers';
import {getAreaDimensions} from 'app/utils/getAreaSize';

function getDefaultArea(w: number, h: number): AreaDefinition {
    if (!w || !h) {
        debugger;
    }
    return {
        default: true,
        layers: getDefaultLayers(w, h),
        objects: [],
        sections: [{ x: 0, y: 0, w, h}],
    };
}

function getDefaultSpiritArea(location: ZoneLocation): AreaDefinition {
    const parentDefinition = getAreaFromLocation({...location, isSpiritWorld: false});
    const definition: AreaDefinition = {
        default: true,
        parentDefinition,
        isSpiritWorld: true,
        layers: parentDefinition.layers.map(copyLayerTemplate),
        objects: [],
        // Spirit world sections should match their parent definition, otherwise the
        // camera will not be aligned correctly when switching back and forth.
        sections: parentDefinition.sections.map(section => ({
            ...section,
            index: undefined,
            // Default is based on the parent section mapId, if present.
            mapId: section.mapId ? section.mapId + 'Spirit' : undefined
        })),
    };
    return definition;
}

function copyLayerTemplate(layer: AreaLayerDefinition): AreaLayerDefinition {
    if (!layer.grid.w || !layer.grid.h) {
        debugger;
    }
    return {
        ...layer,
        drawPriority: layer.key.startsWith('foreground') ? 'foreground' : 'background',
        grid: {
            ...layer.grid,
            // The matrix of tiles
            tiles: [],
            mask: [],
        },
    };
}

function getDefaultLayers(w: number, h: number): AreaLayerDefinition[] {
    if (!w || !h) {
        debugger;
    }
    return [
        {
            key: 'floor',
            grid: {
                // The dimensions of the grid.
                w,
                h,
                // The matrix of tiles
                tiles: [],
            },
        },
        {
            key: 'field',
            grid: {
                // The dimensions of the grid.
                w,
                h,
                // The matrix of tiles
                tiles: [],
            },
        },
    ];
}

export function getAreaFromLocation(location: ZoneLocation): AreaDefinition {
    const zone = zones[location.zoneKey];
    const floor = zone.floors[location.floor];
    const grid = location.isSpiritWorld ? floor.spiritGrid : floor.grid;
    const alternateGrid = location.isSpiritWorld ? floor.grid : floor.spiritGrid;
    const {w, h} = zone.areaSize;


    const {x, y} = location.areaGridCoords;
    if (!grid[y]) {
        grid[y] = [];
    }
    if (!grid[y][x]) {
        grid[y][x] =
            initializeAreaTiles(location.isSpiritWorld ? getDefaultSpiritArea(location) : getDefaultArea(w, h));
        return addMissingSection(zone, grid[y][x], alternateGrid[y]?.[x]);
    } else if (!grid[y][x].layers) {
        populateLayersFromAlternateArea(zone, grid[y][x], alternateGrid[y]?.[x]);
        return addMissingSection(zone, grid[y][x], alternateGrid[y]?.[x]);
    }
    return grid[y][x];
}

export function populateLayersFromAlternateArea(zone: Zone|null, area: AreaDefinition, alternateArea: AreaDefinition) {
    if (area.layers) {
        return;
    }
    if (alternateArea?.layers) {
        area.layers = alternateArea.layers.map(copyLayerTemplate);
    } else {
        const {w, h} = getAreaDimensions(area, zone);
        area.layers = getDefaultLayers(w, h);
    }
    initializeAreaTiles(area);
}

export function addMissingSection(zone: Zone, area: AreaDefinition, alternateArea?: AreaDefinition): AreaDefinition {
    if (!area.w || !area.h) {
        const {w, h} = getAreaDimensions(area, zone);
        area.w = w;
        area.h = h;
    }
    if (!area.sections?.length) {
        if (alternateArea?.sections?.length) {
            area.sections = alternateArea.sections.map(({x, y, w, h}) => ({x, y, w, h}));
        } else {
            area.sections = [{
                x: 0,
                y: 0,
                w: area.w,
                h: area.h
            }];
        }
    }
    return area;
}

export const BG_FRAME_DURATION = 160, BG_FRAME_COUNT = 6;
export function getBackgroundFrame(state: GameState, areaInstance: AreaInstance): AreaFrame {
    const frame = editingState.isEditing ? 0 : (Math.floor(state.fieldTime / BG_FRAME_DURATION) % BG_FRAME_COUNT);
    return areaInstance.backgroundFrames[frame];
}
export function getBackgroundFrameIndex(state: GameState, areaInstance: AreaInstance): number {
    return editingState.isEditing ? 0 : (Math.floor(state.fieldTime / BG_FRAME_DURATION) % BG_FRAME_COUNT);
}
