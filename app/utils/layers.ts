import { allTiles } from 'app/content/tiles';
import { layersInOrder } from 'app/gameConstants';
import { getAreaDimensions } from 'app/utils/getAreaSize';
import { mapTileIndex } from 'app/utils/mapTile';

export function addNewLayer(
    layerKey: string,
    layerIndex: number,
    definition: AreaDefinition,
    alternateDefinition: AreaDefinition,
): AreaLayerDefinition {
    const areaSize = getAreaDimensions(definition, null);
    const layerDefinition: AreaLayerDefinition = {
        drawPriority: layerKey.startsWith('foreground') ? 'foreground' : 'background',
        key: layerKey,
        grid: {
            w: areaSize.w,
            h: areaSize.h,
            tiles: [],
        },
    };
    initializeAreaLayerTiles(layerDefinition);
    definition.layers.splice(layerIndex, 0, layerDefinition);
    if (alternateDefinition?.layers) {
        const alternateLayerDefinition: AreaLayerDefinition = {
            drawPriority: layerKey.startsWith('foreground') ? 'foreground' : 'background',
            key: layerKey,
            grid: {
                w: areaSize.w,
                h: areaSize.h,
                tiles: [],
            },
        };
        initializeAreaLayerTiles(alternateLayerDefinition);
        alternateDefinition.layers.splice(layerIndex, 0, alternateLayerDefinition);
    }
    return layerDefinition;
}
export function addMissingLayer(
    layerKey: string,
    definition: AreaDefinition,
    alternateDefinition: AreaDefinition,
): AreaLayerDefinition {
    const layerIndex = layersInOrder.indexOf(layerKey);
    for (let i = 0; i < definition.layers.length; i++) {
        if (layersInOrder.indexOf(definition.layers[i].key) > layerIndex) {
            return addNewLayer(layerKey, i, definition, alternateDefinition);
        }
    }
    return addNewLayer(layerKey, definition.layers.length, definition, alternateDefinition);
}

export function getOrAddLayer(
    layerKey: string,
    definition: AreaDefinition,
    alternateDefinition: AreaDefinition,
) {
    for (const layer of definition.layers) {
        if (layer.key === layerKey) {
            return layer;
        }
    }
    return addMissingLayer(layerKey, definition, alternateDefinition);
}

export function inheritAllLayerTilesFromParent(area: AreaDefinition, r?: Rect) {
    const parentLayers = area.parentDefinition?.layers;
    for (const layer of (parentLayers || [])) {
        inheritLayerTilesFromParent(layer.key, area, r);
    }
}

export function inheritLayerTilesFromParent(layerKey: string, area: AreaDefinition, r?: Rect) {
    const parentLayer = area.parentDefinition?.layers?.find(l => l.key === layerKey);
    if (!parentLayer) {
        return;
    }
    const childLayer = getOrAddLayer(layerKey, area, area.parentDefinition);
    const childTiles = childLayer.grid.tiles;
    r = r || {x: 0, y: 0, w: childLayer.grid.w, h: childLayer.grid.h};
    for (let y = r.y; y < r.y + r.h; y++) {
        childTiles[y] = childTiles[y] || [];
        // We need to do this so that each row has the correct number of elements, as in some places
        // we use row.length for iterating through tiles or checking the bounds of the grid.
        for (let x = r.x; x < r.x + r.w; x++) {
            childTiles[y][x] = mapTileIndex(parentLayer.grid.tiles[y]?.[x]) || 0;
        }
    }
}

export function initializeAreaLayerTiles(layer: AreaLayerDefinition): AreaLayerDefinition {
    const tiles = layer.grid.tiles;
    for (let y = 0; y < layer.grid.h; y++) {
        tiles[y] = tiles[y] || [];
        // We need to do this so that each row has the correct number of elements, as in some places
        // we use row.length for iterating through tiles or checking the bounds of the grid.
        for (let x = 0; x < layer.grid.w; x++) {
            tiles[y][x] = tiles[y][x] || null;
        }
    }
    return layer;
}

export function initializeAreaTiles(area: AreaDefinition): AreaDefinition {
    area.layers.map(initializeAreaLayerTiles);
    return area;
}

export function getDrawPriority(layer: AreaLayerDefinition): DrawPriority {
    if (layer.key === 'behaviors' || layer.key.startsWith('foreground')) {
        return 'foreground';
    }
    return layer.drawPriority ?? 'background';
}


// Functions for manipulating instance layers are intended for variation changes
// that are applied as the area is created by Variant objects.
// These changes are not saved permanently and should not be made to the area definitions.
export function getOrAddInstanceLayer(
    layerKey: string,
    area: AreaInstance,
    alternateArea?: AreaInstance,
) {
    for (const layer of area.layers) {
        if (layer.key === layerKey) {
            return layer;
        }
    }
    return addMissingInstanceLayer(layerKey, area, alternateArea);
}
export function addMissingInstanceLayer(
    layerKey: string,
    area: AreaInstance,
    alternateArea?: AreaInstance,
): AreaLayer {
    const layerIndex = layersInOrder.indexOf(layerKey);
    for (let i = 0; i < area.layers.length; i++) {
        if (layersInOrder.indexOf(area.layers[i].key) > layerIndex) {
            return addNewInstanceLayer(layerKey, i, area, alternateArea);
        }
    }
    return addNewInstanceLayer(layerKey, area.layers.length, area, alternateArea);
}
export function addNewInstanceLayer(
    layerKey: string,
    layerIndex: number,
    area: AreaInstance,
    alternateArea?: AreaInstance,
): AreaLayer {
    const layer: AreaLayer = {
        w: area.w,
        h: area.h,
        definition: {
            key: layerKey,
            drawPriority: layerKey.startsWith('foreground') ? 'foreground' : 'background',
        },
        key: layerKey,
        tiles: [],
        originalTiles: [],
    };
    initializeAreaInstanceLayerTiles(layer);
    area.layers.splice(layerIndex, 0, layer);
    if (alternateArea?.layers) {
        const alternateLayer: AreaLayer = {
            w: alternateArea.w,
            h: alternateArea.h,
            definition: {
                key: layerKey,
                drawPriority: layerKey.startsWith('foreground') ? 'foreground' : 'background',
            },
            key: layerKey,
            tiles: [],
            originalTiles: [],
        };
        initializeAreaInstanceLayerTiles(alternateLayer);
        alternateArea.layers.splice(layerIndex, 0, alternateLayer);
    }
    return layer;
}
export function initializeAreaInstanceLayerTiles(layer: AreaLayer): void {
    const tiles = layer.tiles, originalTiles = layer.originalTiles;
    for (let y = 0; y < layer.h; y++) {
        tiles[y] = tiles[y] || [];
        originalTiles[y] = originalTiles[y] || [];
        for (let x = 0; x < layer.w; x++) {
            originalTiles[y][x] = tiles[y][x] = tiles[y][x] || allTiles[0];
        }
    }
}
