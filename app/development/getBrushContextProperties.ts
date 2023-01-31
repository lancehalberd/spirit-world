import { logicHash } from 'app/content/logic';
import { editingState } from 'app/development/editingState';
import { addNewLayer } from 'app/development/layers';
import { layersInOrder } from 'app/gameConstants';
import { enterLocation } from 'app/utils/enterLocation';


import {
    AreaLayer, DrawPriority, GameState,
    PanelRows, PropertyRow,
} from 'app/types';


function refreshArea(state: GameState, doNotRefreshEditor = false) {
    enterLocation(state, state.location, true, undefined, true, false, doNotRefreshEditor);
}

export function getBrushContextProperties(state: GameState): PanelRows {
    let rows: PanelRows = [];
    for (let i = 0; i < state.areaInstance.definition.layers.length; i++) {
        const definition = state.areaInstance.definition.layers[i];
        const alternateDefinition = state.areaInstance.alternateArea.definition.layers[i];
        const layer: AreaLayer | null = state.areaInstance.layers.find(layer => layer.definition === definition);
        const alternateLayer: AreaLayer | null = state.areaInstance.alternateArea.layers.find(layer => layer.definition === alternateDefinition);
        let row: PropertyRow = [
        {
            name: '',
            id: `layer-${i}-key`,
            value: definition.key,
            onChange(key: string) {
                definition.key = key;
                if (alternateDefinition) {
                    alternateDefinition.key = key;
                }
                if (layer) {
                    layer.key = key;
                }
                if (alternateLayer) {
                    alternateLayer.key = key;
                }
                editingState.needsRefresh = true;
            },
        }];
        if (editingState.selectedLayerKey !== definition.key) {
            row.unshift({
                name: '>',
                id: `layer-${i}-select`,
                onClick() {
                    editingState.selectedLayerKey = definition.key;
                    refreshArea(state);
                }
            })
        } else {
            row.unshift({
                name: '**',
                id: `layer-${i}-unselect`,
                onClick() {
                    // Cannot unselect layers while using the replace tool.
                    if (editingState.tool === 'replace') {
                        return;
                    }
                    delete editingState.selectedLayerKey;
                    refreshArea(state);
                }
            });
        }
        row.push({
            name: '',
            id: `layer-${i}-visibility`,
            value: definition.visibilityOverride || 'auto',
            values: ['auto', 'show', 'fade', 'hide'],
            onChange(visibilityOverride: 'auto' | 'show' | 'fade' | 'hide') {
                if (visibilityOverride === 'auto') {
                    delete definition.visibilityOverride;
                    if (alternateDefinition) {
                        delete alternateDefinition.visibilityOverride;
                    }
                } else {
                    definition.visibilityOverride = visibilityOverride;
                    if (alternateDefinition) {
                        alternateDefinition.visibilityOverride = visibilityOverride;
                    }
                }
                // Calling this will instantiate the area again and place the player back in their current location.
                refreshArea(state);
            },
        });
        // Deleting all layers can causes errors, so don't allow it.
        if (state.areaInstance.definition.layers.length > 1) {
            row.push({
                name: 'X',
                id: `layer-${i}-delete`,
                onClick() {
                    state.areaInstance.definition.layers.splice(i, 1);
                    if (state.areaInstance.alternateArea.definition.layers) {
                        state.areaInstance.alternateArea.definition.layers.splice(i, 1);
                    }
                    refreshArea(state);
                },
            });
        }
        rows.push(row);
        if (editingState.selectedLayerKey === definition.key) {
            row = [{
                name: 'Priority',
                id: `layer-${i}-priority`,
                value: definition.drawPriority || (
                    definition.key === 'foreground' ? 'foreground' : 'background'
                ),
                values: ['background', 'foreground'] as DrawPriority[],
                onChange(drawPriority: DrawPriority) {
                    definition.drawPriority = drawPriority;
                    if (alternateDefinition) {
                        alternateDefinition.drawPriority = drawPriority;
                    }
                    refreshArea(state);
                },
            }];
            row.push({
                name: '^',
                id: `layer-${i}-up`,
                onClick() {
                    if (i <= 0) {
                        return;
                    }
                    state.areaInstance.definition.layers[i] = state.areaInstance.definition.layers[i - 1];
                    state.areaInstance.definition.layers[i - 1] = definition;
                    if (state.areaInstance.alternateArea.definition.layers) {
                        state.areaInstance.alternateArea.definition.layers[i]
                            = state.areaInstance.alternateArea.definition.layers[i - 1];
                        state.areaInstance.alternateArea.definition.layers[i - 1] = alternateDefinition;
                    }
                    refreshArea(state);
                },
            });
            row.push({
                name: 'v',
                id: `layer-${i}-down`,
                onClick() {
                    if (i >= state.areaInstance.definition.layers.length - 1) {
                        return;
                    }
                    state.areaInstance.definition.layers[i] = state.areaInstance.definition.layers[i + 1];
                    state.areaInstance.definition.layers[i + 1] = definition;
                    if (state.areaInstance.alternateArea.definition.layers) {
                        state.areaInstance.alternateArea.definition.layers[i] = state.areaInstance.alternateArea.definition.layers[i + 1];
                        state.areaInstance.alternateArea.definition.layers[i + 1] = alternateDefinition;
                    }
                    refreshArea(state);
                },
            });
            rows.push(row);
            rows.push({
                name: 'Logic',
                id: `layer-${i}-logic`,
                value: definition.hasCustomLogic ? 'custom' : (definition.logicKey || 'none'),
                values: ['none', 'custom', ...Object.keys(logicHash)],
                onChange(logicKey: string) {
                    if (logicKey === 'none') {
                        delete definition.logicKey;
                        delete definition.hasCustomLogic;
                        if (alternateDefinition) {
                            delete alternateDefinition.logicKey;
                            delete alternateDefinition.hasCustomLogic;
                        }
                    } else if (logicKey === 'custom') {
                        definition.hasCustomLogic = true;
                        delete definition.logicKey;
                        if (alternateDefinition) {
                            alternateDefinition.hasCustomLogic = true;
                            delete alternateDefinition.logicKey;
                        }
                    } else {
                        definition.logicKey = logicKey;
                        delete definition.hasCustomLogic;
                        if (alternateDefinition) {
                            alternateDefinition.logicKey = logicKey;
                            delete alternateDefinition.hasCustomLogic;
                        }
                    }
                    refreshArea(state);
                },
            });
            if (definition.hasCustomLogic ) {
                rows.push({
                    name: 'Custom Logic',
                    value: definition.customLogic || '',
                    onChange(customLogic: string) {
                        definition.customLogic = customLogic;
                        if (alternateDefinition) {
                            alternateDefinition.customLogic = customLogic;
                        }
                        refreshArea(state);
                    },
                });
            }
            rows.push({
                name: 'Invert Logic',
                value: definition.invertLogic || false,
                onChange(invertLogic: boolean) {
                    if (invertLogic) {
                        definition.invertLogic = invertLogic;
                        if (alternateDefinition) {
                            alternateDefinition.invertLogic = invertLogic;
                        }
                    } else {
                        delete definition.invertLogic;
                        if (alternateDefinition) {
                            delete alternateDefinition.invertLogic;
                        }
                    }
                    refreshArea(state);
                },
            });
        }
    }
    rows.push({
        name: 'Add Layer',
        onClick() {
            const definition = state.areaInstance.definition;
            const lastLayer = definition.layers[definition.layers.length - 1];
            const previousLayerKey = editingState.selectedLayerKey || lastLayer.key;
            const previousLayerIndex = definition.layers.findIndex(layer => layer.key === previousLayerKey);
            const lastLayerIndex = layersInOrder.indexOf(previousLayerKey);
            let key = 'layer-' + definition.layers.length;
            if (lastLayerIndex + 1 < layersInOrder.length) {
                // Use the next default layer key.
                key = layersInOrder[lastLayerIndex + 1];
                // If the key is in use, go back to the default key.
                if (definition.layers.find(layer => layer.key === key)) {
                    key = 'layer-' + definition.layers.length;
                }
            }
            addNewLayer(state, key, previousLayerIndex + 1);
            // Calling this will instantiate the area again and place the player back in their current location.
            if (editingState.selectedLayerKey) {
                editingState.selectedLayerKey = key;
            }
            refreshArea(state);
        }
    });
    return rows;
}
