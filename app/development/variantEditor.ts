import { variantHash } from 'app/content/variants/variantHash';
import { editingState } from 'app/development/editingState';
import { getState } from 'app/state';
import { isPointInShortRect } from 'app/utils/index';
import { enterLocation } from 'app/utils/enterLocation';

const variantTypes = Object.keys(variantHash) as VariantType[];

function refreshArea(state: GameState, doNotRefreshEditor = false) {
    enterLocation(state, state.location, true, undefined, true, false, doNotRefreshEditor);
}

export function getVariantTypeSelector(): PanelRows {
    const variantData = editingState.selectedVariantData;
    return [{
        name: 'type',
        value: variantData.type || variantTypes[0],
        values: variantTypes,
        onChange(type: VariantType) {
            variantData.type = type;
            refreshArea(getState());
        },
    }];
}

export function getVariantProperties(state: GameState): PanelRows {
    const rows: PanelRows = [];
    const variantData = editingState.selectedVariantData;
    const selectedVariantData = isVariantSelected(state, editingState) ? variantData : null;
    const definition = variantHash[variantData.type];
    if (selectedVariantData) {
        rows.push({
            name: 'id',
            value: selectedVariantData.id || '',
            onChange(newId: string) {
                selectedVariantData.id = newId;
            },
        });
        rows.push([{
            name: 'x',
            value: variantData.x || 0,
            onChange(x: number) {
                variantData.x = x;
                refreshArea(state);
            },
        },{
            name: 'y',
            value: variantData.y || 0,
            onChange(y: number) {
                variantData.y = y;
                refreshArea(state);
            },
        }]);
    }
    rows.push([{
        name: 'w',
        value: variantData.w || 1,
        onChange(w: number) {
            variantData.w = w;
            refreshArea(state);
        },
    },{
        name: 'h',
        value: variantData.h || 1,
        onChange(h: number) {
            variantData.h = h;
            refreshArea(state);
        },
    }]);
    rows.push({
        name: 'direction',
        value: variantData.d || 'up',
        values: ['up', 'down', 'left', 'right'],
        onChange(d: Direction) {
            variantData.d = d;
            refreshArea(state);
        },
    });
    rows.push({
        name: 'seed',
        value: variantData.seed || 0,
        onChange(seed: number) {
            variantData.seed = seed;
            refreshArea(state);
        },
    });

    rows.push('Weights:');
    let row: PropertyRow = [];
    for (const style of definition.styles) {
        row.push({
            name: style,
            value: variantData.styleWeights?.[style] || 0,
            onChange(weight: number) {
                variantData.styleWeights = variantData.styleWeights || {};
                variantData.styleWeights[style] = Math.max(0, weight);
                refreshArea(state);
            },
        });
        if (row.length >= 3) {
            rows.push(row);
            row = []
        }
    }
    if (row.length) {
        rows.push(row);
    }
    for (const field of (definition.fields || [])) {
        rows.push({
            name: field.key,
            value: variantData.fields?.[field.key] || field.defaultValue,
            values: field.getValues?.(state),
            onChange(value: any) {
                variantData.fields = variantData.fields || {};
                variantData.fields[field.key] = value;
                refreshArea(state);
            },
        });
    }

    return rows;
}

function uniqueVariantId(state: GameState, prefix: string, location: ZoneLocation = null) {
    if (!location) {
        location = state.location;
    }
    let i = 0;
    const { zoneKey, floor, areaGridCoords: {x, y}, isSpiritWorld} = location;
    prefix = `${zoneKey}:${isSpiritWorld ? 's' : ''}${floor}:${x}x${y}-${prefix}`;
    const area = (location.isSpiritWorld === state.location.isSpiritWorld)
        ? state.areaInstance : state.alternateAreaInstance;
    while (area.definition.variants?.some(o => o.id === `${prefix}-${i}`)) {
        i++;
    }
    return `${prefix}-${i}`;
}

export function createVariantData(state: GameState, editingState: EditingState, x: number, y: number): VariantData {
    const newVariantData = {
        ...editingState.selectedVariantData,
        styleWeights: {...editingState.selectedVariantData.styleWeights},
        x: x + state.camera.x,
        y: y + state.camera.y,
        type: editingState.selectedVariantData.type,
        id: editingState.selectedVariantData.id || uniqueVariantId(state, editingState.selectedVariantData.type),
    };
    fixVariantPosition(newVariantData);
    return newVariantData;

}

export function unselectVariant(editingState: EditingState) {
    editingState.selectedVariantData = {
        ...editingState.selectedVariantData,
        styleWeights: {
            ...editingState.selectedVariantData.styleWeights,
        },
    }
    delete editingState.selectedVariantData.id;
    editingState.needsRefresh = true;
}

function isPointInVariant(state: GameState, x: number, y: number, variantData: VariantData): boolean {
    return isPointInShortRect(x + state.camera.x, y + state.camera.y, variantData);
}

export function fixVariantPosition(variantData: VariantData): void {
    const definition = variantHash[variantData.type];
    const gridSize = definition.gridSize || 4;
    variantData.x =  Math.floor(variantData.x / gridSize) * gridSize;
    variantData.y =  Math.floor(variantData.y / gridSize) * gridSize;
}

export function isVariantSelected(state: GameState, editingState: EditingState): boolean {
    return !!state.areaInstance.definition.variants?.includes(editingState.selectedVariantData);
}

export function onMouseDownSelectVariant(state: GameState, editingState: EditingState, x: number, y: number): boolean {
    let changedSelection = false;
    if (isVariantSelected(state, editingState)) {
        if (!isPointInVariant(state, x, y, editingState.selectedVariantData)) {
            unselectVariant(editingState);
            changedSelection = true;
        }
    }
    if (!isVariantSelected(state, editingState)) {
        for (const variantData of (state.areaInstance.definition.variants || [])) {
            if (isPointInVariant(state, x, y, variantData)) {
                editingState.selectedVariantData = variantData;
                changedSelection = true;
                break;
            }
        }
    }
    if (changedSelection) {
        editingState.needsRefresh = true;
    }
    const variantIsSelected = isVariantSelected(state, editingState);
    // If a variant is still selected then we are dragging it until the mouse is released, so indicate the drag offset.
    if (variantIsSelected) {
        editingState.dragOffset = {
            x: editingState.selectedVariantData.x - x,
            y: editingState.selectedVariantData.y - y,
        };
    }
    return variantIsSelected;
}

export function onMouseDragVariant(state: GameState, editingState: EditingState, x: number, y: number): boolean {
    if (!isVariantSelected(state, editingState) || !editingState.dragOffset) {
        return false;
    }
    const oldX = editingState.selectedVariantData.x, oldY = editingState.selectedVariantData.y;
    editingState.selectedVariantData.x = Math.round(x + editingState.dragOffset.x);
    editingState.selectedVariantData.y = Math.round(y + editingState.dragOffset.y);
    const definition = variantHash[editingState.selectedVariantData.type];
    const gridSize = definition.gridSize || 4;
    // fixVariantPosition is good when placing a variant by the top left corner,
    // but rounding works better when dragging an existing variant.
    editingState.selectedVariantData.x =  Math.round(editingState.selectedVariantData.x / gridSize) * gridSize;
    editingState.selectedVariantData.y =  Math.round(editingState.selectedVariantData.y / gridSize) * gridSize;
    if (oldX !== editingState.selectedVariantData.x || oldY !== editingState.selectedVariantData.y) {
        editingState.needsRefresh = true;
        refreshArea(state);
    }
    return true;
}
