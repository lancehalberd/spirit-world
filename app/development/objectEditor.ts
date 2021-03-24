import _ from 'lodash';

import { addObjectToArea, linkObject, removeObjectFromArea } from 'app/content/areas';
import { createObjectInstance } from 'app/content/objects';
import { doorStyles } from 'app/content/door';
import { signStyles } from 'app/content/objects/sign';
import { getLootFrame } from 'app/content/lootObject';
import { zones } from 'app/content/zones';
import { displayTileEditorPropertyPanel, EditingState } from 'app/development/tileEditor';
import { getState } from 'app/state';
import { ifdefor, isPointInShortRect } from 'app/utils/index';

import {
    AreaDefinition, AreaInstance, BallGoalDefinition, BossType, CrystalSwitchDefinition, FloorSwitchDefinition,
    FrameDimensions, Direction, EnemyType, GameState,
    LootType, MagicElement, ObjectDefinition, ObjectStatus, ObjectType, PanelRows,
    Zone, ZoneLocation,
} from 'app/types';

let allLootTypes: LootType[];
export function getLootTypes(): LootType[] {
    if (!allLootTypes) {
        const state = getState();
        allLootTypes = [
            'peachOfImmortality',
            'peachOfImmortalityPiece',
            'money',
            'weapon',
            ...(Object.keys(state.hero.activeTools) as LootType[]),
            ...(Object.keys(state.hero.passiveTools) as LootType[]),
            ...(Object.keys(state.hero.equipment) as LootType[]),
            ...(Object.keys(state.hero.elements) as LootType[]),
        ];
    }
    return allLootTypes;
}

export const combinedObjectTypes: ObjectType[] = [
    'loot', 'chest', 'sign',
    'door', 'pitEntrance', 'marker',
    'ballGoal', 'crystalSwitch', 'floorSwitch',
    'pushPull', 'rollingBall', 'tippable', 'waterPot',
];

function createObjectDefinition(
    state: GameState,
    editingState: EditingState,
    definition: Partial<ObjectDefinition>
): ObjectDefinition {
    const x = definition.x || 0;
    const y = definition.y || 0;
    const commonProps = {
        id: definition.id || uniqueId(state, definition.type),
        linked: ifdefor(definition.linked, editingState.linked),
        spirit: ifdefor(definition.spirit, editingState.spirit),
        status: 'normal' as ObjectStatus,
        x,
        y,
    };
    switch (definition.type) {
        case 'ballGoal':
            return {
                ...commonProps,
                type: definition.type,
                targetObjectId: definition.targetObjectId || editingState.switchTargetObjectId,
            };
        case 'crystalSwitch':
            return {
                ...commonProps,
                type: definition.type,
                element: definition.element || editingState.element,
                targetObjectId: definition.targetObjectId || editingState.switchTargetObjectId,
                // Need to use ifdefor here since 0 is a valid value for timer.
                timer: ifdefor(definition.timer, editingState.timer),
            };
        case 'door':
        case 'stairs':
            return {
                ...commonProps,
                type: definition.type,
                status: definition.status || editingState.objectStatus,
                style: definition.style || editingState.style || Object.keys(doorStyles)[0],
                targetZone: definition.targetZone || editingState.entranceTargetZone,
                targetObjectId: definition.targetObjectId || editingState.entranceTargetObjectId,
                d: definition.d || editingState.direction,
            };
        case 'boss': {
            const bossType = definition.enemyType || editingState.bossType;
            const lootType = definition.lootType || editingState.lootType;
            return {
                ...commonProps,
                type: definition.type,
                id: definition.id || uniqueId(state, bossType),
                enemyType: bossType,
                lootType,
            };
        }
        case 'enemy': {
            const enemyType = definition.enemyType || editingState.enemyType;
            return {
                ...commonProps,
                type: definition.type,
                id: definition.id || uniqueId(state, enemyType),
                enemyType,
            };
        }
        case 'floorSwitch':
            return {
                ...commonProps,
                type: definition.type,
                // Need to use ifdefor here since false is a valid value for toggleOnRelease.
                targetObjectId: definition.targetObjectId || editingState.switchTargetObjectId,
                toggleOnRelease: ifdefor(definition.toggleOnRelease, editingState.toggleOnRelease),
            };
        case 'pitEntrance':
            return {
                ...commonProps,
                type: definition.type,
                targetZone: ifdefor(definition.targetZone, editingState.entranceTargetZone) || 'none',
                targetObjectId: definition.targetObjectId || editingState.entranceTargetObjectId,

            };
        case 'loot':
        case 'chest': {
            const lootType = definition.lootType || editingState.lootType;
            return {
                ...commonProps,
                type: definition.type,
                id: definition.id || uniqueId(state, lootType),
                lootType,
                status: definition.status || editingState.objectStatus,
                lootLevel: definition.lootLevel || editingState.level,
                lootAmount: definition.lootAmount || editingState.amount,
            };
        }
        case 'marker':
        case 'pushPull':
        case 'rollingBall':
        case 'tippable':
        case 'waterPot':
            return {
                ...commonProps,
                type: definition.type,
            };
        case 'sign':
            return {
                ...commonProps,
                style: definition.style || editingState.style || Object.keys(signStyles)[0],
                type: definition.type,
                message: definition.message || editingState.message,
            };
        default:
            throw new Error('Unhandled object type, ' + definition['type']);
    }
    return null;
}

export function getObjectProperties(state: GameState, editingState: EditingState): PanelRows {
    return getObjectTypeProperties(state, editingState, {type: editingState.objectType} as ObjectDefinition);
}

function getTargetObjectIdsByTypes(zone: Zone, types: ObjectType[]): string[] {
    const combinedObjectIds: string[][] = [];
    for (const floor of zone.floors) {
        for (const row of floor.grid) {
            for (const area of row) {
                combinedObjectIds.push(getTargetObjectIdsByTypesAndArea(area, types));
            }
        }
        for (const row of floor.spiritGrid) {
            for (const area of row) {
                combinedObjectIds.push(getTargetObjectIdsByTypesAndArea(area, types));
            }
        }
    }
    return _.flatten(combinedObjectIds);
}

function getTargetObjectIdsByTypesAndArea(area: AreaDefinition, types: ObjectType[]): string[] {
    if (!area) {
        return [];
    }
    return area.objects.filter(object => types.includes(object.type)).map(object => object.id);
}

export function getSwitchTargetProperties(state: GameState, editingState: EditingState, object: BallGoalDefinition | CrystalSwitchDefinition | FloorSwitchDefinition ): PanelRows {
    const rows: PanelRows = [];
    const objectIds = ['all', ...getTargetObjectIdsByTypesAndArea(state.areaInstance.definition, ['door', 'chest', 'loot'])];
    if (!editingState.entranceTargetObjectId || objectIds.indexOf(editingState.entranceTargetObjectId) < 0) {
        editingState.switchTargetObjectId = null;
    }
    if (object.id && objectIds.indexOf(object.targetObjectId) < 0) {
        object.targetObjectId = null;
    }
    rows.push({
        name: 'target object',
        value: object.targetObjectId || editingState.entranceTargetObjectId || 'all',
        values: objectIds,
        onChange(targetObjectId: string) {
            if (object.id) {
                object.targetObjectId = targetObjectId;
                updateObjectInstance(state, object);
            } else {
                editingState.switchTargetObjectId = targetObjectId;
            }
        },
    });
    return rows;
}

export function getObjectTypeProperties(state: GameState, editingState: EditingState, object: ObjectDefinition): PanelRows {
    let rows: PanelRows = [];
    if (object.type !== 'enemy' && object.type !== 'boss') {
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
                    object.type = objectType as any;
                    updateObjectInstance(state, createObjectDefinition(state, editingState, object));
                } else {
                    editingState.objectType = objectType;
                }
                displayTileEditorPropertyPanel();
            },
        });
    }
    rows.push([{
        name: 'spirit',
        value: ifdefor(object.spirit, editingState.spirit),
        onChange(spirit: boolean) {
            if (object.id) {
                object.spirit = spirit;
                updateObjectInstance(state, object);
            } else {
                editingState.spirit = spirit;
            }
        },
    }, {
        name: 'linked',
        value: ifdefor(object.linked, editingState.linked),
        onChange(linked: boolean) {
            if (object.id) {
                object.linked = linked;
                updateObjectInstance(state, object);
            } else {
                editingState.linked = linked;
            }
        },
    }]);
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
        case 'pitEntrance':
            const zoneKeys = Object.keys(zones);
            const zoneKey = ifdefor(object.targetZone, editingState.entranceTargetZone) || 'none';
            rows.push({
                name: 'target zone',
                value: zoneKey,
                values: ['none', ...zoneKeys],
                onChange(targetZone: string) {
                    if (targetZone === 'none') {
                        targetZone = null;
                    }
                    if (object.id) {
                        object.targetZone = targetZone;
                        updateObjectInstance(state, object);
                    } else {
                        editingState.entranceTargetZone = targetZone;
                    }
                    // We need to refresh the panel to get the new marker ids for the selected zone.
                    displayTileEditorPropertyPanel();
                },
            });
            const zone = zones[zoneKey];
            // Pit entrances target markers, but other entrances target the same kind of entrnace,
            // for example stairs => stairs, doors => doors.
            const targetType: ObjectType = object.type === 'pitEntrance' ? 'marker' : object.type;
            const objectIds = zone ? getTargetObjectIdsByTypes(zone, [targetType]) : [];
            if (objectIds.length) {
                if (!editingState.entranceTargetObjectId || objectIds.indexOf(editingState.entranceTargetObjectId) < 0) {
                    editingState.entranceTargetObjectId = objectIds[0];
                }
                if (object.id && objectIds.indexOf(object.targetObjectId) < 0) {
                    object.targetObjectId = objectIds[0];
                }
                rows.push({
                    name: 'target marker',
                    value: object.targetObjectId || editingState.entranceTargetObjectId,
                    values: objectIds,
                    onChange(targetObjectId: string) {
                        if (object.id) {
                            object.targetObjectId = targetObjectId;
                            updateObjectInstance(state, object);
                        } else {
                            editingState.entranceTargetObjectId = targetObjectId;
                        }
                    },
                });
            } else {
                rows.push(`No objects of type ${targetType}`);
            }
            break;
        case 'loot':
        case 'chest': {
            rows = [...rows, ...getLootFields(state, editingState, object)];
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
        }
        case 'ballGoal':
            rows = [...rows, ...getSwitchTargetProperties(state, editingState, object)];
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
            rows = [...rows, ...getSwitchTargetProperties(state, editingState, object)];
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
            rows = [...rows, ...getSwitchTargetProperties(state, editingState, object)];
            break;
        case 'enemy':
            rows.push({
                name: 'type',
                value: object.enemyType || editingState.enemyType,
                values: ['beetle', 'beetleHorned', 'beetleMini', 'beetleWinged', 'snake'],
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
        case 'boss':
            rows.push({
                name: 'type',
                value: object.enemyType || editingState.enemyType,
                values: ['beetleBoss'],
                onChange(bossType: BossType) {
                    if (object.id) {
                        object.enemyType = bossType;
                        updateObjectInstance(state, object);
                    } else {
                        editingState.bossType = bossType;
                    }
                },
            });
            rows = [...rows, ...getLootFields(state, editingState, object)];
            break;
        case 'sign':
            rows.push({
                name: 'message',
                multiline: true,
                value: object.id ? object.message : editingState.message,
                onChange(message: string) {
                    if (object.id) {
                        object.message = message;
                        updateObjectInstance(state, object);
                    } else {
                        editingState.message = message;
                    }
                },
            });
            break;
    }
    rows = [...rows, ...getStyleFields(state, editingState, object)];
    return rows;
}

function getStyleFields(state: GameState, editingState: EditingState, object: ObjectDefinition) {
    let rows = [];
    let styles = null;
    if (object.type === 'sign') {
        styles = signStyles;
    } else if (object.type === 'door') {
        styles = doorStyles;
    }
    if (!styles) {
        return [];
    }

    if (!styles[editingState.style]) {
        editingState.style = Object.keys(styles)[0];
    }
    if (!styles[object.style]) {
        object.style = Object.keys(styles)[0];
    }
    rows.push({
        name: 'style',
        value: object.style || editingState.style || Object.keys(styles)[0],
        values: Object.keys(styles),
        onChange(style: string) {
            if (object.id) {
                object.style = style;
                updateObjectInstance(state, object);
            } else {
                editingState.style = style;
            }
        },
    });
    return rows;
}

function getLootFields(state: GameState, editingState: EditingState, object: ObjectDefinition) {
    if (object.type !== 'loot' && object.type !== 'chest' && object.type !== 'boss') {
        return [];
    }
    let rows = [];
    const lootType = object.lootType || editingState.lootType;
    rows.push({
        name: 'lootType',
        value: lootType,
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
            displayTileEditorPropertyPanel();
        },
    });
    if (lootType === 'money') {
        rows.push({
            name: 'amount',
            value: '' + object.lootAmount || editingState.amount,
            values: ['1', '20', '50', '100', '300'],
            onChange(amountString: string) {
                const amount = parseInt(amountString, 10);
                if (object.id) {
                    object.lootAmount = amount;
                    updateObjectInstance(state, object);
                } else {
                    editingState.amount = amount;
                }
            },
        });
    } else if (lootType === 'peachOfImmortality' || lootType === 'peachOfImmortalityPiece') {
    } else if (lootType === 'fire' || lootType === 'ice' || lootType === 'lightning') {
    } else {
        const level = object.lootLevel || editingState.level;
        rows.push({
            name: 'level',
            value: level ? `${level}` : 'progressive',
            values: ['progressive', '1', '2'],
            onChange(levelString: string) {
                const level = levelString === 'progressive' ? 0 : parseInt(levelString, 10);
                if (object.id) {
                    object.lootLevel = level;
                    updateObjectInstance(state, object);
                } else {
                    editingState.level = level;
                }
            },
        });
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
            type: editingState.tool === 'object' ? editingState.objectType : editingState.tool as 'enemy' | 'boss',
            x: Math.round(x + state.camera.x),
            y: Math.round(y + state.camera.y),
        }
    );

    const frame = getObjectFrame(newObject);
    newObject.x -= (frame.content?.w || frame.w) / 2;
    newObject.y -= (frame.content?.h || frame.h) / 2;
    fixObjectPosition(state, newObject);
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
    // Currently all objects snap to the grid except loot outside of chests.
    /*if (object.type === 'door' && object.style === 'rectangle') {
        object.x = Math.round(object.x / 8) * 8;
        object.y = Math.round(object.y / 8) * 8;
    } else */if (object.type !== 'loot') {
        object.x = Math.round(object.x / state.areaInstance.palette.w) * state.areaInstance.palette.w;
        object.y = Math.round(object.y / state.areaInstance.palette.h) * state.areaInstance.palette.h;
    }
}

export function onMouseMoveSelect(state: GameState, editingState: EditingState, x: number, y: number): void {
    if (editingState.selectedObject) {
        const linkedDefinition = getLinkedDefinition(state.alternateAreaInstance.definition, editingState.selectedObject);
        const oldX = editingState.selectedObject.x, oldY = editingState.selectedObject.y;
        editingState.selectedObject.x = Math.round(x + editingState.dragOffset.x);
        editingState.selectedObject.y = Math.round(y + editingState.dragOffset.y);
        fixObjectPosition(state, editingState.selectedObject);
        if (oldX !== editingState.selectedObject.x || oldY !== editingState.selectedObject.y) {
            if (linkedDefinition) {
                console.log("Updating linked definition");
                linkedDefinition.x = editingState.selectedObject.x;
                linkedDefinition.y = editingState.selectedObject.y;
                console.log(linkedDefinition);
                updateObjectInstance(state, linkedDefinition, state.alternateAreaInstance);
            }
            updateObjectInstance(state, editingState.selectedObject);
        }
        return;
    }
}

function getLinkedDefinition(alternateArea: AreaDefinition, object: ObjectDefinition): ObjectDefinition {
    return alternateArea.objects.find(o => o.x === object.x && o.y === object.y && o.type === object.type);
}

export function uniqueId(state: GameState, prefix: string, location: ZoneLocation = null) {
    if (!location) {
        location = state.location;
    }
    let i = 0;
    const { zoneKey, floor, areaGridCoords: {x, y}, isSpiritWorld} = location;
    prefix = `${zoneKey}:${isSpiritWorld ? 's' : ''}${floor}:${x}x${y}-${prefix}`;
    const area = (location.isSpiritWorld === state.location.isSpiritWorld)
        ? state.areaInstance : state.alternateAreaInstance;
    while (area.definition.objects.some(o => o.id === `${prefix}-${i}`)) {
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

export function getObjectFrame(object: ObjectDefinition): FrameDimensions {
    if (object.type === 'loot') {
        return getLootFrame(object);
    }
    const state = getState();
    const instance = createObjectInstance(state, object);
    if (instance.getHitbox) {
        return instance.getHitbox(state);
    }
    return getLootFrame({lootType: 'unknown'});
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

function checkToAddLinkedObject(state: GameState, definition: ObjectDefinition): void {
    const linkedInstance = state.alternateAreaInstance.objects.find(other =>
        definition.x === other.definition.x && definition.y === other.definition.y
    );
    if (linkedInstance) {
        updateObjectInstance(state, {...linkedInstance.definition, linked: definition.linked}, state.alternateAreaInstance);
        return;
    }
    if (!definition.linked) {
        return;
    }
    const alternateLocation = {...state.location, isSpiritWorld: !state.location.isSpiritWorld};
    const alternateObject = {
        ...definition,
        id: uniqueId(state, definition.type, alternateLocation),
        linked: true, spirit: !definition.spirit
    };
    updateObjectInstance(state, alternateObject, state.alternateAreaInstance);
    // Make sure to update the object links when we replace object instances.
    const instance = state.areaInstance.objects.find(o => o.definition.id === definition.id);
    linkObject(instance);
}

export function updateObjectInstance(state: GameState, object: ObjectDefinition, area: AreaInstance = null): void {
    if (!area) {
        area = state.areaInstance;
    }
    const definitionIndex = area.definition.objects.findIndex(d => d.id === object.id);
    if (definitionIndex >= 0) {
        area.definition.objects[definitionIndex] = object;
    } else {
        area.definition.objects.push(object);
    }
    const index = area.objects.findIndex(o => o.definition?.id === object.id);
    const newObject = createObjectInstance(state, object);
    if (index < 0) {
        addObjectToArea(state, area, newObject);
    } else {
        removeObjectFromArea(state, area.objects[index]);
        addObjectToArea(state, area, newObject);
    }
    if (area === state.areaInstance && state.alternateAreaInstance) {
        checkToAddLinkedObject(state, object);
    }
    linkObject(newObject);
}

export function deleteObject(state: GameState, object: ObjectDefinition): void {
    let index = state.areaInstance.definition.objects.indexOf(object);
    if (index >= 0) {
        state.areaInstance.definition.objects.splice(index, 1);
    }
    // Remove the associated ObjectInstance if one exists.
    index = state.areaInstance.objects.findIndex(o => o.definition?.id === object.id);
    if (index >= 0) {
        removeObjectFromArea(state, state.areaInstance.objects[index]);
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
        type: editingState.tool === 'object' ? editingState.objectType : editingState.tool as 'boss' | 'enemy',
        x: Math.round(x + state.camera.x),
        y: Math.round(y + state.camera.y),
    });
    const frame = getObjectFrame(definition);
    definition.x -= (frame.content?.w || frame.w) / 2;
    definition.y -= (frame.content?.h || frame.h) / 2;
    fixObjectPosition(state, definition);
    createObjectInstance(state, definition).render(context, state);
}
