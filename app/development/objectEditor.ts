import _ from 'lodash';

import { addObjectToArea, removeObjectFromArea } from 'app/content/areas';
import { enemyDefinitions } from 'app/content/enemy';
import { createObjectInstance } from 'app/content/objects';
import { lootFrames } from 'app/content/lootObject';
import { displayTileEditorPropertyPanel, EditingState } from 'app/development/tileEditor';
import { getState } from 'app/state';
import { ifdefor, isPointInShortRect } from 'app/utils/index';

import {
    FrameDimensions, Direction, EnemyType, GameState,
    LootType, MagicElement, ObjectDefinition, ObjectStatus, ObjectType, PanelRows,
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

export const combinedObjectTypes: ObjectType[] = ['loot', 'chest', 'door', 'enemy', 'crystalSwitch', 'floorSwitch', 'pushPull', 'rollingBall', 'tippable'];

function createObjectDefinition(
    state: GameState,
    editingState: EditingState,
    definition: Partial<ObjectDefinition>
): ObjectDefinition {
    const x = definition.x || 0;
    const y = definition.y || 0;
    switch (definition.type) {
        case 'crystalSwitch':
            return {
                type: definition.type,
                id: definition.id || uniqueId(state, 'crystalSwitch'),
                element: definition.element || editingState.element,
                status: definition.status || editingState.objectStatus,
                // Need to use ifdefor here since 0 is a valid value for timer.
                timer: ifdefor(definition.timer, editingState.timer),
                x,
                y,
            };
        case 'door':
            return {
                type: definition.type,
                id: definition.id || uniqueId(state, 'door'),
                status: definition.status || editingState.objectStatus,
                d: definition.d || editingState.direction,
                x,
                y,
            };
        case 'enemy':
            const enemyType = definition.enemyType || editingState.enemyType;
            return {
                type: definition.type,
                id: definition.id || uniqueId(state, enemyType),
                enemyType,
                status: 'normal',
                x,
                y,
            };
        case 'floorSwitch':
            return {
                type: definition.type,
                id: definition.id || uniqueId(state, 'floorSwitch'),
                status: definition.status || editingState.objectStatus,
                // Need to use ifdefor here since 0 is a valid value for timer.
                toggleOnRelease: ifdefor(definition.toggleOnRelease, editingState.toggleOnRelease),
                x,
                y,
            };
        case 'loot':
        case 'chest':
            const lootType = definition.lootType || editingState.lootType;
            return {
                type: definition.type,
                id: definition.id || uniqueId(state, lootType),
                lootType,
                status: definition.status || editingState.objectStatus,
                x,
                y,
            };
        case 'pushPull':
        case 'rollingBall':
        case 'tippable':
            return {
                type: definition.type,
                id: definition.id || uniqueId(state, definition.type),
                status: definition.status || editingState.objectStatus,
                x,
                y,
            };
        default:
            throw new Error('Unhandled object type, ' + definition['type']);
    }
    return null;
}

export function getObjectProperties(state: GameState, editingState: EditingState): PanelRows {
    return getObjectTypeProperties(state, editingState, {type: editingState.objectType} as ObjectDefinition);
}

export function getObjectTypeProperties(state: GameState, editingState: EditingState, object: ObjectDefinition): PanelRows {
    const rows: PanelRows = [];
    rows.push({
        name: 'type',
        value: object.type || editingState.objectType,
        values: combinedObjectTypes,
        onChange(objectType: ObjectType) {
            if (object.id) {
                // Replace instances of the loot type in the id with the new loot type.
                if (object.id.includes(object.type)) {
                    updateObjectId(state, object, object.id.replace(object.type, objectType));
                }
                object.type = objectType;
                updateObjectInstance(state, object);
            } else {
                editingState.objectType = objectType;
            }
            displayTileEditorPropertyPanel();
        },
    });
    switch (object.type) {
        case 'door':
            rows.push({
                name: 'direction',
                value: object.d || editingState.direction,
                values: ['up', 'down', 'left', 'right'],
                onChange(direction: Direction) {
                    if (object.id) {
                        object.d = direction;
                        updateObjectInstance(state, object);
                    } else {
                        editingState.direction = direction;
                    }
                },
            });
            rows.push({
                name: 'status',
                value: object.status || editingState.objectStatus,
                values: ['normal', 'closed', 'closedEnemy', 'closedSwitch'],
                onChange(status: ObjectStatus) {
                    if (object.id) {
                        object.status = status;
                        updateObjectInstance(state, object);
                    } else {
                        editingState.objectStatus = status;
                    }
                },
            });
            break;
        case 'loot':
        case 'chest':
            rows.push({
                name: 'lootType',
                value: object.lootType || editingState.lootType,
                values: getLootTypes(),
                onChange(lootType: LootType) {
                    if (object.id) {
                        // Replace instances of the loot type in the id with the new loot type.
                        if (object.id.includes(object.lootType)) {
                            updateObjectId(state, object, object.id.replace(object.lootType, lootType));
                        }
                        object.lootType = lootType;
                        updateObjectInstance(state, object);
                    } else {
                        editingState.lootType = lootType;
                    }
                },
            });
            rows.push({
                name: 'status',
                value: object.status || editingState.objectStatus,
                values: ['normal', 'hiddenEnemy', 'hiddenSwitch'],
                onChange(status: ObjectStatus) {
                    if (object.id) {
                        object.status = status;
                        updateObjectInstance(state, object);
                    } else {
                        editingState.objectStatus = status;
                    }
                },
            });
            break;
        case 'crystalSwitch':
            rows.push({
                name: 'element',
                value: object.element || editingState.element || 'none',
                values: ['none', 'fire', 'ice', 'lightning'],
                onChange(value: MagicElement | 'none') {
                    const element = value === 'none' ? null : value;
                    if (object.id) {
                        object.element = element;
                        updateObjectInstance(state, object);
                    } else {
                        editingState.element = element;
                    }
                },
            });
            rows.push({
                name: 'timer',
                value: object.timer || editingState.timer,
                onChange(timer: number) {
                    if (object.id) {
                        object.timer = timer;
                        updateObjectInstance(state, object);
                    } else {
                        editingState.timer = timer;
                    }
                },
            });
            break;
        case 'floorSwitch':
            rows.push({
                name: 'toggleOnRelease',
                value: object.toggleOnRelease || editingState.toggleOnRelease || false,
                values: ['none', 'fire', 'ice', 'lightning'],
                onChange(toggleOnRelease: boolean) {
                    if (object.id) {
                        object.toggleOnRelease = toggleOnRelease;
                        updateObjectInstance(state, object);
                    } else {
                        editingState.toggleOnRelease = toggleOnRelease;
                    }
                },
            });
            break;
        case 'enemy':
            rows.push({
                name: 'enemy',
                value: object.enemyType || editingState.enemyType,
                values: ['snake'],
                onChange(enemyType: EnemyType) {
                    if (object.id) {
                        object.enemyType = enemyType;
                        updateObjectInstance(state, object);
                    } else {
                        editingState.enemyType = enemyType;
                    }
                },
            });
            break;
    }
    return rows;
}

export function getSelectProperties(state: GameState, editingState: EditingState): PanelRows {
    let rows: PanelRows = [];
    if (editingState.selectedObject) {
        const selectedObject = editingState.selectedObject;
        rows.push({
            name: 'id',
            value: selectedObject.id,
            onChange(newId: string) {
                return updateObjectId(state, selectedObject, newId);
            },
        });
        rows = [...rows, ...getObjectTypeProperties(state, editingState, editingState.selectedObject)];
    }
    return rows;
}

export function onMouseDownObject(state: GameState, editingState: EditingState, x: number, y: number): void {
    const newObject: ObjectDefinition = createObjectDefinition(
        state,
        editingState,
        {
            type: editingState.objectType,
            x: Math.round(x + state.camera.x),
            y: Math.round(y + state.camera.y),
        }
    );

    const frame = getObjectFrame(newObject);
    newObject.x -= (frame.content?.w || frame.w) / 2;
    newObject.y -= (frame.content?.h || frame.h) / 2;
    fixObjectPosition(state, newObject);
    state.areaInstance.definition.objects.push(newObject);
    updateObjectInstance(state, newObject);
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
    // These objects snap to the grid.
    if (object.type === 'chest'
        || object.type === 'crystalSwitch'
        || object.type === 'door'
        || object.type === 'floorSwitch'
        || object.type === 'pushPull'
        || object.type === 'rollingBall'
        || object.type === 'tippable'
    ) {
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

const simpleGeometry: FrameDimensions = {w: 16, h: 16};
export function getObjectFrame(object: ObjectDefinition): FrameDimensions {
    if (object.type === 'door') {
        return { w: 32, h: 32 };
    }
    if (object.type === 'enemy') {
        return enemyDefinitions[object.enemyType].animations.idle.down.frames[0]
    }
    if (object.type === 'loot') {
        return lootFrames[object.lootType] || lootFrames.unknown;
    }
    if (object.type === 'chest') {
        return simpleGeometry;
    }
    if (object.type === 'crystalSwitch' || object.type === 'pushPull' || object.type === 'rollingBall') {
        return simpleGeometry;
    }
    if (object.type === 'tippable') {
        return simpleGeometry;
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
        addObjectToArea(state, state.areaInstance, newObject);
    } else {
        removeObjectFromArea(state, state.areaInstance, state.areaInstance.objects[index]);
        addObjectToArea(state, state.areaInstance, newObject);
    }
}

export function deleteObject(state: GameState, object: ObjectDefinition): void {
    let index = state.areaInstance.definition.objects.indexOf(object);
    if (index >= 0) {
        state.areaInstance.definition.objects.splice(index, 1);
    }
    // Remove the associated ObjectInstance if one exists.
    index = state.areaInstance.objects.findIndex(o => o.definition?.id === object.id);
    if (index >= 0) {
        removeObjectFromArea(state, state.areaInstance, state.areaInstance.objects[index]);
    }
}

export function renderObjectPreview(
    context: CanvasRenderingContext2D,
    state: GameState,
    editingState: EditingState,
    x: number,
    y: number
): void {
    const definition: ObjectDefinition = createObjectDefinition(state, editingState, {
        id: uniqueId(state, editingState.objectType),
        // This is set to 'normal' so we can see the preview during edit even if it would otherwise be hidden.
        status: 'normal',
        type: editingState.objectType,
        x: Math.round(x + state.camera.x),
        y: Math.round(y + state.camera.y),
    });
    const frame = getObjectFrame(definition);
    definition.x -= (frame.content?.w || frame.w) / 2;
    definition.y -= (frame.content?.h || frame.h) / 2;
    fixObjectPosition(state, definition);
    createObjectInstance(state, definition).render(context, state);
}
