import _ from 'lodash';

import { enemyDefinitions } from 'app/content/enemy';
import { createObjectInstance } from 'app/content/objects';
import { ChestObject, LootObject, chestClosedFrame, lootFrames } from 'app/content/lootObject';
import { displayTileEditorPropertyPanel, EditingState } from 'app/development/tileEditor';
import { getState } from 'app/state';
import { isPointInShortRect } from 'app/utils/index';

import {
    EnemyType, Frame, GameState, LootObjectDefinition,
    LootType, ObjectDefinition, PanelRows,
} from 'app/types';

let allLootTypes: LootType[];
export function getLootTypes(): LootType[] {
    if (!allLootTypes) {
        const state = getState();
        allLootTypes = [
            'peachOfImmortality',
            'peachOfImmortalityPiece',
            ...(Object.keys(state.hero.activeTools) as LootType[]),
            ...(Object.keys(state.hero.passiveTools) as LootType[]),
            ...(Object.keys(state.hero.equipment) as LootType[]),
            ...(Object.keys(state.hero.elements) as LootType[]),
        ];
    }
    return allLootTypes;
}

export function getLootProperties(state: GameState, editingState: EditingState): PanelRows {
    const rows: PanelRows = [];
    rows.push({
        name: 'loot',
        value: editingState.newLootType,
        values: getLootTypes(),
        onChange(lootType: LootType) {
            editingState.newLootType = lootType;
        },
    });
    return rows;
}


export function getSelectProperties(state: GameState, editingState: EditingState): PanelRows {
    const rows: PanelRows = [];
    if (editingState.selectedObject) {
        const selectedObject = editingState.selectedObject;
        rows.push({
            name: 'id',
            value: selectedObject.id,
            onChange(newId: string) {
                return updateObjectId(state, selectedObject, newId);
            },
        });
    }
    if (editingState.selectedObject?.type === 'loot' || editingState.selectedObject?.type === 'chest') {
        const lootObjectDefinition = editingState.selectedObject;
        rows.push({
            name: 'lootType',
            value: lootObjectDefinition.lootType,
            values: getLootTypes(),
            onChange(lootType: LootType) {

                // Replace instances of the loot type in the id with the new loot type.
                if (lootObjectDefinition.id.includes(lootObjectDefinition.lootType)) {
                    updateObjectId(state, lootObjectDefinition, lootObjectDefinition.id.replace(lootObjectDefinition.lootType, lootType));
                }
                lootObjectDefinition.lootType = lootType;
                updateObjectInstance(state, lootObjectDefinition);
            },
        });
    }
    if (editingState.selectedObject?.type === 'enemy') {
        const enemyObjectDefinition = editingState.selectedObject;
        rows.push({
            name: 'enemy',
            value: editingState.selectedObject.enemyType,
            values: ['snake'],
            onChange(enemyType: EnemyType) {
                enemyObjectDefinition.enemyType = enemyType;
                updateObjectInstance(state, enemyObjectDefinition);
            },
        });
    }
    return rows;
}

export function onMouseDownLoot(state: GameState, editingState: EditingState, x: number, y: number): void {
    const newObject: LootObjectDefinition = {
        id: uniqueId(state, editingState.newLootType),
        status: 'normal',
        type: editingState.tool === 'loot' ? 'loot' : 'chest',
        lootType: editingState.newLootType,
        x: Math.round(x + state.camera.x),
        y: Math.round(y + state.camera.y),
    };
    const frame = getObjectFrame(newObject);
    newObject.x -= (frame.content?.w || frame.w) / 2;
    newObject.y -= (frame.content?.h || frame.h) / 2;
    fixObjectPosition(state, newObject);
    state.areaInstance.definition.objects.push(newObject);
    state.areaInstance.objects.push(newObject.type === 'loot' ? new LootObject(newObject) : new ChestObject(newObject));
}

export function onMouseDownSelect(state: GameState, editingState: EditingState, x: number, y: number): void {
    let changedSelection = false;
    if (editingState.selectedObject) {
        if (!isPointInObject(x, y, editingState.selectedObject)) {
            editingState.selectedObject = null;
            changedSelection = true;
        }
    }
    if (!editingState.selectedObject) {
        for (const object of state.areaInstance.definition.objects) {
            if (isPointInObject(x, y, object)) {
                editingState.selectedObject = object;
                changedSelection = true;
                break;
            }
        }
    }
    if (changedSelection) {
        displayTileEditorPropertyPanel();
    }
    // If selectedObject is still set, then we are dragging it, so indicate the drag offset.
    if (editingState.selectedObject) {
        editingState.dragOffset = {
            x: editingState.selectedObject.x - x,
            y: editingState.selectedObject.y - y,
        };
    }
}

export function fixObjectPosition(state: GameState, object: ObjectDefinition): void {
    if (object.type === 'chest') {
        object.x = Math.round(object.x / state.areaInstance.palette.w) * state.areaInstance.palette.w;
        object.y = Math.round(object.y / state.areaInstance.palette.h) * state.areaInstance.palette.h;
    }
}

export function onMouseMoveSelect(state: GameState, editingState: EditingState, x: number, y: number): void {
    if (editingState.selectedObject) {
        editingState.selectedObject.x = Math.round(x + editingState.dragOffset.x);
        editingState.selectedObject.y = Math.round(y + editingState.dragOffset.y);
        fixObjectPosition(state, editingState.selectedObject);
        updateObjectInstance(getState(), editingState.selectedObject);
        return;
    }
}

export function uniqueId(state: GameState, prefix: string) {
    let i = 0;
    prefix = `${state.areaGridCoords.x}-${state.areaGridCoords.y}-${prefix}`;
    while (state.areaInstance.definition.objects.some(o => o.id === `${prefix}-${i}`)) {
        i++;
    }
    return `${prefix}-${i}`;
}

export function updateObjectId(state: GameState, object: ObjectDefinition, id: string): string {
    if (!state.areaInstance.definition.objects.some(o => o !== object && o.id === id)) {
        object.id = id;
        updateObjectInstance(state, object);
        return object.id;
    }
    return updateObjectId(state, object, `${id}-1`);
}


export function getObjectFrame(object: ObjectDefinition): Frame {
    if (object.type === 'enemy') {
        return enemyDefinitions[object.enemyType].animations.idle.down.frames[0]
    }
    if (object.type === 'loot') {
        return lootFrames[object.lootType] || lootFrames.unknown;
    }
    if (object.type === 'chest') {
        return chestClosedFrame;
    }
    return lootFrames.unknown;
}
export function isPointInObject(x: number, y: number, object: ObjectDefinition): boolean {
    const camera = getState().camera;
    let frame =  {...getObjectFrame(object), x: object.x, y: object.y};
    if (frame.content) {
        frame.x += frame.content.x;
        frame.y += frame.content.y;
        frame.w = frame.content.w;
        frame.h = frame.content.h;
    }
    return isPointInShortRect(x + camera.x, y + camera.y, frame);
}

export function updateObjectInstance(state: GameState, object: ObjectDefinition): void {
    const index = state.areaInstance.objects.findIndex(o => o.definition?.id === object.id);
    const newObject = createObjectInstance(state, object);
    if (index < 0) {
        state.areaInstance.objects.push(newObject);
    } else {
        state.areaInstance.objects[index] = newObject;
    }
}

export function deleteObject(state: GameState, object: ObjectDefinition): void {
    let index = state.areaInstance.definition.objects.indexOf(object);
    if (index >= 0) {
        state.areaInstance.definition.objects.splice(index, 1);
    }
    index = state.areaInstance.objects.findIndex(o => o.definition?.id === object.id);
    if (index >= 0) {
        state.areaInstance.objects.splice(index, 1);
    }
}

export function renderLootPreview(
    context: CanvasRenderingContext2D,
    state: GameState,
    editingState: EditingState,
    x: number,
    y: number
): void {
    const definition: ObjectDefinition = {
        id: uniqueId(state, editingState.newLootType),
        status: 'normal',
        type: editingState.tool === 'loot' ? 'loot' : 'chest',
        lootType: editingState.newLootType,
        x: Math.round(x + state.camera.x),
        y: Math.round(y + state.camera.y),
    };
    const frame = getObjectFrame(definition);
    definition.x -= (frame.content?.w || frame.w) / 2;
    definition.y -= (frame.content?.h || frame.h) / 2;
    fixObjectPosition(state, definition);
    if (definition.type === 'chest') {
        new ChestObject(definition).render(context, state);
    } else {
        new LootObject(definition).render(context, state);
    }
}
