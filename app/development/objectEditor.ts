import _ from 'lodash';

import { addObjectToArea, linkObject, removeObjectFromArea } from 'app/content/areas';
import { createObjectInstance } from 'app/content/objects';
import { doorStyles } from 'app/content/door';
import { bossTypes, enemyTypes, enemyDefinitions } from 'app/content/enemy';
import { npcBehaviors, npcStyles } from 'app/content/objects/npc';
import { signStyles } from 'app/content/objects/sign';
import { getLootFrame } from 'app/content/lootObject';
import { zones } from 'app/content/zones';
import { displayTileEditorPropertyPanel, EditingState } from 'app/development/tileEditor';
import { getState } from 'app/state';
import { isPointInShortRect } from 'app/utils/index';

import {
    AreaDefinition, AreaInstance, BallGoalDefinition, BossType, CrystalSwitchDefinition, FloorSwitchDefinition,
    FrameDimensions, Direction, EnemyType, GameState,
    LootType, MagicElement, NPCBehavior, NPCStyle, ObjectDefinition, ObjectStatus, ObjectType, PanelRows,
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
            'bigKey',
            'smallKey',
            'map',
            ...(Object.keys(state.hero.activeTools) as LootType[]),
            ...(Object.keys(state.hero.passiveTools) as LootType[]),
            ...(Object.keys(state.hero.equipment) as LootType[]),
            ...(Object.keys(state.hero.elements) as LootType[]),
        ];
    }
    return allLootTypes;
}

export const combinedObjectTypes: ObjectType[] = [
    'ballGoal', 'bigChest', 'chest', 'crystalSwitch',
    'door', 'floorSwitch', 'loot','marker', 'npc', 'pitEntrance',
    'pushPull', 'rollingBall',  'sign', 'tippable', 'waterPot',
];

export function createObjectDefinition(
    state: GameState,
    editingState: EditingState,
    definition: Partial<ObjectDefinition> & {type: ObjectType}
): ObjectDefinition {
    const x = definition.x || 0;
    const y = definition.y || 0;
    const commonProps = {
        // Assign defaults for any props the definitions might require.
        status: 'normal' as ObjectStatus,
        id: definition.id || uniqueId(state, definition.type),
        linked: definition.linked,
        spirit: definition.spirit,
        x,
        y,
    };
    // Omit spirit/linked if they are false.
    if (!commonProps.linked) {
        delete commonProps.linked;
    }
    if (!commonProps.spirit) {
        delete commonProps.spirit;
    }
    switch (definition.type) {
        case 'ballGoal':
            return {
                ...commonProps,
                type: definition.type,
                targetObjectId: definition.targetObjectId,
            };
        case 'crystalSwitch':
            return {
                ...commonProps,
                type: definition.type,
                element: definition.element,
                timer: definition.timer || 0,
                targetObjectId: definition.targetObjectId,
            };
        case 'door':
        case 'stairs':
            return {
                ...commonProps,
                type: definition.type,
                style: definition.style || Object.keys(doorStyles)[0],
                targetZone: definition.targetZone,
                targetObjectId: definition.targetObjectId,
                d: definition.d || 'up',
                status: definition.status || commonProps.status,
            };
        case 'boss': {
            const bossType = definition.enemyType;
            const lootType = definition.lootType || getLootTypes()[0];
            const enemyDefinition = enemyDefinitions[bossType];
            const params = {};
            for (let key in enemyDefinition?.params || {}) {
                if (definition.params?.[key] && definition.params?.[key] !== enemyDefinition.params) {
                    params[key] = definition.params[key];
                }
            }
            return {
                ...commonProps,
                type: definition.type,
                id: definition.id || uniqueId(state, bossType),
                enemyType: bossType,
                lootType,
                lootAmount: definition.lootAmount || 1,
                lootLevel: definition.lootLevel || 1,
                d: definition.d || 'down',
                params,
            };
        }
        case 'enemy': {
            const enemyType = definition.enemyType;
            const enemyDefinition = enemyDefinitions[enemyType];
            const params = {};
            for (let key in enemyDefinition?.params || {}) {
                if (definition.params?.[key] && definition.params?.[key] !== enemyDefinition.params) {
                    params[key] = definition.params[key];
                }
            }
            return {
                ...commonProps,
                type: definition.type,
                id: definition.id || uniqueId(state, enemyType),
                enemyType,
                d: definition.d || 'down',
                params,
            };
        }
        case 'floorSwitch':
            return {
                ...commonProps,
                targetObjectId: definition.targetObjectId,
                toggleOnRelease: definition.toggleOnRelease,
                type: definition.type,
            };
        case 'pitEntrance':
            return {
                ...commonProps,
                targetZone: definition.targetZone,
                targetObjectId: definition.targetObjectId,
                type: definition.type,
            };
        case 'chest':
        case 'bigChest':
        case 'loot': {
            const lootType = definition.lootType || getLootTypes()[0];
            return {
                ...commonProps,
                type: definition.type,
                id: definition.id || uniqueId(state, lootType),
                lootType,
                lootAmount: definition.lootAmount || 1,
                lootLevel: definition.lootLevel || 1,
                status: definition.status || commonProps.status,
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
                style: definition.style || Object.keys(signStyles)[0],
                type: definition.type,
                message: definition.message || '',
            };
        case 'npc':
            return {
                ...commonProps,
                d: definition.d || 'down',
                behavior: definition.behavior || Object.keys(npcBehaviors)[0] as NPCBehavior,
                style: definition.style || Object.keys(npcStyles)[0] as NPCStyle,
                type: definition.type,
                dialogue: definition.dialogue,
            };
        default:
            throw new Error('Unhandled object type, ' + definition['type']);
    }
    return null;
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

    if (object.id && objectIds.indexOf(object.targetObjectId) < 0) {
        delete object.targetObjectId;
    }
    rows.push({
        name: 'target object',
        value: object.targetObjectId ?? 'all',
        values: objectIds,
        onChange(targetObjectId: string) {
            object.targetObjectId = targetObjectId;
            updateObjectInstance(state, object);
        },
    });
    return rows;
}

export function getObjectProperties(state: GameState, editingState: EditingState): PanelRows {
    let rows: PanelRows = [];

    const object: ObjectDefinition = editingState.selectedObject;

    if (editingState.selectedObject?.id) {
        const selectedObject = editingState.selectedObject;
        rows.push({
            name: 'id',
            value: selectedObject.id,
            onChange(newId: string) {
                return updateObjectId(state, selectedObject, newId, false);
            },
        });
    }
    if (editingState.tool === 'select' && !editingState.selectedObject?.id) {
        return rows;
    }
    if (object.type !== 'enemy' && object.type !== 'boss') {
        rows.push({
            name: 'type',
            value: object.type,
            values: combinedObjectTypes,
            onChange(objectType: ObjectType) {
                if (object.id) {
                    // Replace instances of the loot type in the id with the new loot type.
                    if (object.id.includes(object.type)) {
                        updateObjectId(state, object, object.id.replace(object.type, objectType));
                    }
                    object.type = objectType as any;
                    updateObjectInstance(state, createObjectDefinition(state, editingState, object), object);
                } else {
                    object.type = objectType as any;
                    editingState.selectedObject = createObjectDefinition(state, editingState, object);
                }
                displayTileEditorPropertyPanel();
            },
        });
    }
    rows.push([{
        name: 'spirit',
        value: object.spirit || false,
        onChange(spirit: boolean) {
            object.spirit = spirit;
            updateObjectInstance(state, object);
        },
    }, {
        name: 'linked',
        value: object.linked || false,
        onChange(linked: boolean) {
            object.linked = linked;
            updateObjectInstance(state, object);
        },
    }]);
    switch (object.type) {
        case 'door':
            rows.push({
                name: 'direction',
                value: object.d,
                values: ['up', 'down', 'left', 'right'],
                onChange(direction: Direction) {
                    object.d = direction;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'status',
                value: object.status,
                values: ['normal', 'closed', 'closedEnemy', 'closedSwitch', 'locked', 'bigKeyLocked', 'cracked', 'blownOpen'],
                onChange(status: ObjectStatus) {
                    object.status = status;
                    updateObjectInstance(state, object);
                },
            });
        case 'pitEntrance':
            const zoneKeys = Object.keys(zones);
            const zoneKey = object.targetZone || 'none';
            rows.push({
                name: 'target zone',
                value: zoneKey,
                values: ['none', ...zoneKeys],
                onChange(targetZone: string) {
                    if (targetZone === 'none') {
                        targetZone = null;
                    }
                    object.targetZone = targetZone;
                    updateObjectInstance(state, object);
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
                if (objectIds.indexOf(object.targetObjectId) < 0) {
                    object.targetObjectId = objectIds[0];
                }
                rows.push({
                    name: 'target marker',
                    value: object.targetObjectId,
                    values: objectIds,
                    onChange(targetObjectId: string) {
                        object.targetObjectId = targetObjectId;
                        updateObjectInstance(state, object);
                    },
                });
            } else {
                rows.push(`No objects of type ${targetType}`);
            }
            break;
        case 'bigChest':
        case 'chest':
        case 'loot': {
            rows = [...rows, ...getLootFields(state, editingState, object)];
            if (object.type !== 'bigChest') {
                rows.push({
                    name: 'status',
                    value: object.status,
                    values: ['normal', 'hiddenEnemy', 'hiddenSwitch'],
                    onChange(status: ObjectStatus) {
                        object.status = status;
                        updateObjectInstance(state, object);
                    },
                });
            }
            break;
        }
        case 'ballGoal':
            rows = [...rows, ...getSwitchTargetProperties(state, editingState, object)];
            break;
        case 'crystalSwitch':
            rows.push({
                name: 'element',
                value: object.element || 'none',
                values: ['none', 'fire', 'ice', 'lightning'],
                onChange(value: MagicElement | 'none') {
                    const element = value === 'none' ? null : value;
                    object.element = element;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'timer',
                value: object.timer,
                onChange(timer: number) {
                    object.timer = timer;
                    updateObjectInstance(state, object);
                },
            });
            rows = [...rows, ...getSwitchTargetProperties(state, editingState, object)];
            break;
        case 'floorSwitch':
            rows.push({
                name: 'toggleOnRelease',
                value: object.toggleOnRelease ?? false,
                values: ['none', 'fire', 'ice', 'lightning'],
                onChange(toggleOnRelease: boolean) {
                    object.toggleOnRelease = toggleOnRelease;
                    updateObjectInstance(state, object);
                },
            });
            rows = [...rows, ...getSwitchTargetProperties(state, editingState, object)];
            break;
        case 'enemy':
            rows.push({
                name: 'type',
                value: object.enemyType,
                values: enemyTypes,
                onChange(enemyType: EnemyType) {
                    object.enemyType = enemyType;
                    updateObjectInstance(state, object);
                    // We need to refresh the panel to get enemy specific properties.
                    displayTileEditorPropertyPanel();
                },
            });
            rows = [...rows, ...getEnemyFields(state, editingState, object)];
            break;
        case 'boss':
            rows.push({
                name: 'type',
                value: object.enemyType as BossType,
                values: bossTypes,
                onChange(bossType: BossType) {
                    object.enemyType = bossType;
                    updateObjectInstance(state, object);
                    // We need to refresh the panel to get boss specific properties.
                    displayTileEditorPropertyPanel();
                },
            });
            rows = [...rows, ...getEnemyFields(state, editingState, object)];
            rows = [...rows, ...getLootFields(state, editingState, object)];
            break;
        case 'sign':
            rows.push({
                name: 'message',
                multiline: true,
                value: object.message || '',
                onChange(message: string) {
                    object.message = message;
                    updateObjectInstance(state, object);
                },
            });
            break;
        case 'npc':
            rows.push({
                name: 'dialogue',
                multiline: true,
                value: object.dialogue || '',
                onChange(dialogue: string) {
                    object.dialogue = dialogue;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'direction',
                value: object.d || 'up',
                values: ['up', 'down', 'left', 'right'],
                onChange(direction: Direction) {
                    object.d = direction;
                    updateObjectInstance(state, object);
                },
            });
            if (!npcBehaviors[object.behavior]) {
                object.behavior = Object.keys(npcBehaviors)[0] as NPCBehavior;
            }
            rows.push({
                name: 'behavior',
                value: object.behavior,
                values: Object.keys(npcBehaviors) as NPCBehavior[],
                onChange(behavior: NPCBehavior) {
                    object.behavior = behavior;
                    updateObjectInstance(state, object);
                },
            });
            break;
    }
    rows = [...rows, ...getStyleFields(state, editingState, object)];
    return rows;
}

function getEnemyFields(state: GameState, editingState: EditingState, object: ObjectDefinition) {
    let rows = [];
    if (object.type !== 'enemy' && object.type !== 'boss') {
        return;
    }
    rows.push({
        name: 'direction',
        value: object.d || 'up',
        values: ['up', 'down', 'left', 'right'],
        onChange(direction: Direction) {
            object.d = direction;
            updateObjectInstance(state, object);
        },
    });
    const enemyDefinition = enemyDefinitions[object.enemyType];
    for (let key in enemyDefinition?.params || {}) {
        rows.push({
            name: key,
            value: object.params?.[key] || enemyDefinition.params[key],
            // Possibly allow setting default selectable values on the enemy definition.
            onChange(value: any) {
                object.params = object.params || {};
                if (value !== enemyDefinition.params[key]) {
                    object.params[key] = value;
                } else {
                    delete object.params[key];
                }
                updateObjectInstance(state, object);
            },
        });
    }
    return rows;
}

function getStyleFields(state: GameState, editingState: EditingState, object: ObjectDefinition) {
    let rows = [];
    let styles = null;
    if (object.type === 'sign') {
        styles = signStyles;
    } else if (object.type === 'door') {
        styles = doorStyles;
    } else if (object.type === 'npc') {
        styles = npcStyles;
    }
    if (!styles) {
        return [];
    }

    if (!styles[object.style]) {
        object.style = Object.keys(styles)[0];
    }
    rows.push({
        name: 'style',
        value: object.style || Object.keys(styles)[0],
        values: Object.keys(styles),
        onChange(style: string) {
            object.style = style;
            updateObjectInstance(state, object);
        },
    });
    return rows;
}

function getLootFields(state: GameState, editingState: EditingState, object: ObjectDefinition) {
    if (object.type !== 'bigChest' && object.type !== 'loot' && object.type !== 'chest' && object.type !== 'boss') {
        return [];
    }
    const lootType = object.lootType || 'peachOfImmortalityPiece';
    let rows = [];
    rows.push({
        name: 'lootType',
        value: lootType,
        values: getLootTypes(),
        onChange(lootType: LootType) {
            // Replace instances of the loot type in the id with the new loot type.
            if (object.id?.includes(object.lootType)) {
                updateObjectId(state, object, object.id.replace(object.lootType, lootType));
            }
            object.lootType = lootType;
            updateObjectInstance(state, object);
            displayTileEditorPropertyPanel();
        },
    });
    if (lootType === 'money') {
        rows.push({
            name: 'amount',
            value: '' + (object.lootAmount ?? 1),
            values: ['1', '5', '10', '20', '50', '100', '300'],
            onChange(amountString: string) {
                const amount = parseInt(amountString, 10);
                object.lootAmount = amount;
                updateObjectInstance(state, object);
            },
        });
    } else if (lootType === 'peachOfImmortality' || lootType === 'peachOfImmortalityPiece') {
    } else if (lootType === 'fire' || lootType === 'ice' || lootType === 'lightning') {
    } else {
        const level = object.lootLevel ?? 0;
        rows.push({
            name: 'level',
            value: level ? `${level}` : 'progressive',
            values: ['progressive', '1', '2'],
            onChange(levelString: string) {
                const level = levelString === 'progressive' ? 0 : parseInt(levelString, 10);
                object.lootLevel = level;
                updateObjectInstance(state, object);
            },
        });
    }
    return rows;
}

export function onMouseDownObject(state: GameState, editingState: EditingState, x: number, y: number): void {
    const newObject: ObjectDefinition = createObjectDefinition(
        state,
        editingState,
        {
            ...editingState.selectedObject,
            x: Math.round(x + state.camera.x),
            y: Math.round(y + state.camera.y),
        }
    );
    // type: editingState.tool === 'object' ? editingState.objectType : editingState.tool as 'enemy' | 'boss',

    const frame = getObjectFrame(newObject);
    newObject.x -= (frame.content?.w || frame.w) / 2;
    newObject.y -= (frame.content?.h || frame.h) / 2;
    fixObjectPosition(state, newObject);
    updateObjectInstance(state, newObject);
}

export function unselectObject(editingState: EditingState, refresh: boolean = true) {
    editingState.selectedObject = {...editingState.selectedObject};
    delete editingState.selectedObject.id;
    displayTileEditorPropertyPanel();
}

export function onMouseDownSelect(state: GameState, editingState: EditingState, x: number, y: number): void {
    let changedSelection = false;
    if (editingState.selectedObject?.id) {
        if (!isPointInObject(x, y, editingState.selectedObject)) {
            unselectObject(editingState, false);
            changedSelection = true;
        }
    }
    if (!editingState.selectedObject?.id) {
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
    if (editingState.selectedObject?.id) {
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
    if (!editingState.selectedObject?.id) {
        return;
    }
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
            updateObjectInstance(state, linkedDefinition, linkedDefinition, state.alternateAreaInstance);
        }
        updateObjectInstance(state, editingState.selectedObject);
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

export function updateObjectId(state: GameState, object: ObjectDefinition, id: string, makeUnique: boolean = true): string {
    if (!makeUnique || !state.areaInstance.definition.objects.some(o => o !== object && o.id === id)) {
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
        updateObjectInstance(state, {...linkedInstance.definition, linked: definition.linked}, linkedInstance.definition, state.alternateAreaInstance);
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
    updateObjectInstance(state, alternateObject, null, state.alternateAreaInstance);
    // Make sure to update the object links when we replace object instances.
    const instance = state.areaInstance.objects.find(o => o.definition === definition);
    linkObject(instance);
}

export function updateObjectInstance(state: GameState, object: ObjectDefinition, oldDefinition?: ObjectDefinition, area: AreaInstance = null): void {
    if (!object.id) {
        return;
    }
    if (!area) {
        area = state.areaInstance;
    }
    const definitionIndex = area.definition.objects.findIndex(d => d === (oldDefinition || object));
    if (definitionIndex >= 0) {
        area.definition.objects[definitionIndex] = object;
    } else {
        area.definition.objects.push(object);
    }
    const index = area.objects.findIndex(o => o.definition === (oldDefinition || object));
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
    index = state.areaInstance.objects.findIndex(o => o.definition === object);
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
        id: uniqueId(state, editingState.selectedObject.type),
        ...editingState.selectedObject,
        // This is set to 'normal' so we can see the preview during edit even if it would otherwise be hidden.
        status: 'normal',
        x: Math.round(x + state.camera.x),
        y: Math.round(y + state.camera.y),
    });
    const frame = getObjectFrame(definition);
    definition.x -= (frame.content?.w || frame.w) / 2;
    definition.y -= (frame.content?.h || frame.h) / 2;
    fixObjectPosition(state, definition);
    createObjectInstance(state, definition).render(context, state);
}
