import { layersInOrder } from 'app/gameConstants';

export function addNewLayer(
    layerKey: string,
    layerIndex: number,
    definition: AreaDefinition,
    alternateDefinition?: AreaDefinition,
): AreaLayerDefinition {
    const topLayerDefinition = definition.layers[definition.layers.length - 1];
    const alternateTopLayerDefinition = alternateDefinition.layers[alternateDefinition.layers.length - 1];
    const layerDefinition: AreaLayerDefinition = {
        ...topLayerDefinition,
        drawPriority: layerKey.startsWith('foreground') ? 'foreground' : 'background',
        key: layerKey,
        grid: {
            ...topLayerDefinition.grid,
            tiles: [],
        },
    };
    initializeAreaLayerTiles(layerDefinition);
    definition.layers.splice(layerIndex, 0, layerDefinition);
    if (alternateDefinition?.layers) {
        const alternateLayerDefinition: AreaLayerDefinition = {
            ...alternateTopLayerDefinition,
            drawPriority: layerKey.startsWith('foreground') ? 'foreground' : 'background',
            key: layerKey,
            grid: {
                ...alternateTopLayerDefinition.grid,
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
    alternateDefinition?: AreaDefinition,
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
    alternateDefinition?: AreaDefinition,
) {
    for (const layer of definition.layers) {
        if (layer.key === layerKey) {
            return layer;
        }
    }
    return addMissingLayer(layerKey, definition, alternateDefinition);
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
