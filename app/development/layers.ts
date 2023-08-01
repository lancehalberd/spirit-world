import { initializeAreaLayerTiles } from 'app/content/areas';
import { layersInOrder } from 'app/gameConstants';


export function addNewLayer(state: GameState, layerKey: string, layerIndex: number) {
    const definition = state.areaInstance.definition;
    const alternateDefinition = state.alternateAreaInstance.definition;
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
    if (alternateDefinition.layers) {
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
}
export function addMissingLayer(state: GameState, layerKey: string) {
    const layerIndex = layersInOrder.indexOf(layerKey);
    const definition = state.areaInstance.definition;
    for (let i = 0; i < definition.layers.length; i++) {
        if (layersInOrder.indexOf(definition.layers[i].key) > layerIndex) {
            return addNewLayer(state, layerKey, i);
        }
    }
    return addNewLayer(state, layerKey, definition.layers.length);
}
