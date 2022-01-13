import { flatten } from 'lodash';

import { addObjectToArea, isObjectLogicValid, linkObject, removeObjectFromArea } from 'app/content/areas';
import { bossTypes } from 'app/content/bosses';
import { dialogueHash } from 'app/content/dialogue';
import { logicHash } from 'app/content/logic';
import { createObjectInstance } from 'app/content/objects';
import { decorationTypes } from 'app/content/objects/decoration';
import { escalatorStyles } from 'app/content/objects/escalator';
import { specialBehaviorsHash } from 'app/content/specialBehaviors';
import { doorStyles } from 'app/content/door';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { enemyTypes } from 'app/content/enemies';
import { npcBehaviors, npcStyles } from 'app/content/objects/npc';
import { signStyles } from 'app/content/objects/sign';
import { getLootFrame } from 'app/content/lootObject';
import { zones } from 'app/content/zones';
import { displayTileEditorPropertyPanel, editingState, EditingState } from 'app/development/tileEditor';
import { getState } from 'app/state';
import { isPointInShortRect } from 'app/utils/index';

import {
    AreaDefinition, AreaInstance, BallGoalDefinition,
    BossType, CrystalSwitchDefinition, FloorSwitchDefinition, KeyBlockDefinition,
    FrameDimensions, DecorationType, Direction, DrawPriority, EnemyType, GameState, LootObjectDefinition,
    LootType, MagicElement, NPCBehavior, NPCStyle, ObjectDefinition, ObjectStatus, ObjectType, PanelRows,
    Rect, StaffTowerLocation,
    Zone, ZoneLocation,
} from 'app/types';

let allLootTypes: LootType[];
export function getLootTypes(): LootType[] {
    if (!allLootTypes) {
        const state = getState();
        allLootTypes = [
            'empty',
            'peachOfImmortality',
            'peachOfImmortalityPiece',
            'money',
            'weapon',
            'bigKey',
            'smallKey',
            'map',
            // This is the special progressive spirit power loot used by the randomizer.
            'spiritPower',
            ...(Object.keys(state.hero.activeTools) as LootType[]),
            ...(Object.keys(state.hero.passiveTools) as LootType[]),
            ...(Object.keys(state.hero.equipment) as LootType[]),
            ...(Object.keys(state.hero.elements) as LootType[]),
        ];
    }
    return allLootTypes;
}

export const combinedObjectTypes: ObjectType[] = [
    'airBubbles', 'ballGoal', 'beadCascade', 'beadGrate', 'bigChest', 'chest', 'crystalSwitch', 'decoration',
    'door', 'escalator', 'floorSwitch', 'keyBlock', 'loot','marker', 'narration', 'npc', 'pitEntrance',
    'pushPull', 'rollingBall', 'sign', 'staffTowerPoint', 'teleporter', 'tippable', 'torch',
    'vineSprout', 'waterPot', 'spawnMarker',
];

export function createObjectDefinition(
    state: GameState,
    editingState: EditingState,
    definition: Partial<ObjectDefinition> & { type: ObjectType }
): ObjectDefinition {
    const x = definition.x || 0;
    const y = definition.y || 0;
    const commonProps = {
        // Assign defaults for any props the definitions might require.
        status: getPossibleStatuses(definition.type)[0],
        id: definition.id || '',
        linked: definition.linked,
        logicKey: definition.logicKey,
        specialBehaviorKey: definition.specialBehaviorKey,
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
        case 'beadCascade':
            return {
                ...commonProps,
                saveStatus: definition.saveStatus,
                type: definition.type,
                offInterval: definition.offInterval,
                onInterval: definition.onInterval,
            };
        case 'crystalSwitch':
            return {
                ...commonProps,
                type: definition.type,
                element: definition.element,
                saveStatus: definition.saveStatus,
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
                locationCue: definition.locationCue,
                saveStatus: definition.saveStatus,
                status: definition.status || commonProps.status,
            };
        case 'marker':
        case 'spawnMarker':
            return {
                ...commonProps,
                locationCue: definition.locationCue,
                saveStatus: definition.saveStatus,
                status: definition.status || commonProps.status,
                type: definition.type,
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
                saveStatus: definition.saveStatus,
                params,
            };
        }
        case 'decoration':
            return {
                ...commonProps,
                type: definition.type,
                w: definition.w || 16,
                h: definition.h || 16,
                decorationType: definition.decorationType || Object.keys(decorationTypes)[0] as DecorationType,
            };
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
                saveStatus: definition.saveStatus,
                params,
            };
        }
        case 'escalator': {
            return {
                ...commonProps,
                speed: definition.speed || 'slow',
                d: definition.d || 'down',
                w: definition.w || 16,
                h: definition.h || 16,
                style: definition.style || Object.keys(escalatorStyles)[0],
                type: definition.type,
            };
        }
        case 'floorSwitch':
            return {
                ...commonProps,
                targetObjectId: definition.targetObjectId,
                toggleOnRelease: definition.toggleOnRelease,
                type: definition.type,
            };
        case 'keyBlock':
            return {
                ...commonProps,
                type: definition.type,
                status: definition.status || commonProps.status,
                targetObjectId: definition.targetObjectId,
            };
        case 'pitEntrance':
            return {
                ...commonProps,
                targetZone: definition.targetZone,
                targetObjectId: definition.targetObjectId,
                type: definition.type,
            };
        case 'teleporter':
            return {
                ...commonProps,
                targetZone: definition.targetZone,
                targetObjectId: definition.targetObjectId,
                type: definition.type,
                saveStatus: definition.saveStatus,
                status: definition.status || commonProps.status,
            };
        case 'chest':
        case 'bigChest':
        case 'loot': {
            const lootType = definition.lootType || getLootTypes()[0];
            const lootDefinition: LootObjectDefinition = {
                ...commonProps,
                type: definition.type,
                id: definition.id || uniqueId(state, lootType),
                lootType,
                status: definition.status || commonProps.status,
            };
            if (lootType === 'money') {
                lootDefinition.lootAmount = definition.lootAmount || 1;
            } else {
                lootDefinition.lootLevel = definition.lootLevel || 1;
            }
            return lootDefinition;
        }
        case 'airBubbles':
        case 'beadGrate':
        case 'pushPull':
        case 'rollingBall':
        case 'tippable':
        case 'torch':
        case 'vineSprout':
        case 'waterPot':
            return {
                ...commonProps,
                saveStatus: definition.saveStatus,
                status: definition.status || commonProps.status,
                type: definition.type,
            };
        case 'narration':
            return {
                ...commonProps,
                type: definition.type,
                message: definition.message || '',
                delay: definition.delay || 0,
                w: definition.w || 32,
                h: definition.h || 32,
            };
        case 'sign':
            return {
                ...commonProps,
                style: definition.style || Object.keys(signStyles)[0],
                type: definition.type,
                message: definition.message || '',
            };
        case 'staffTowerPoint':
            return {
                ...commonProps,
                type: definition.type,
                location: definition.location,
            };
        case 'npc':
            return {
                ...commonProps,
                d: definition.d || 'down',
                behavior: definition.behavior || Object.keys(npcBehaviors)[0] as NPCBehavior,
                style: definition.style || Object.keys(npcStyles)[0] as NPCStyle,
                type: definition.type,
                dialogueKey: definition.dialogueKey,
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
    return flatten(combinedObjectIds).filter(id => id);
}

function getTargetObjectIdsByTypesAndArea(area: AreaDefinition, types: ObjectType[]): string[] {
    if (!area) {
        return [];
    }
    return area.objects.filter(object => types.includes(object.type)).map(object => object.id).filter(id => id);
}

export function getSwitchTargetProperties(
    state: GameState,
    editingState: EditingState,
    object: BallGoalDefinition | CrystalSwitchDefinition | FloorSwitchDefinition | KeyBlockDefinition
): PanelRows {
    const rows: PanelRows = [];
    const objectIds = ['all', ...getTargetObjectIdsByTypesAndArea(state.areaInstance.definition, ['door', 'chest', 'loot', 'airBubbles', 'beadGrate', 'beadCascade', 'torch'])];

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

function getPossibleStatuses(type: ObjectType): ObjectStatus[] {
    switch (type) {
        case 'airBubbles':
        case 'beadCascade':
        case 'beadGrate':
        case 'pitEntrance':
            return ['normal', 'hidden', 'hiddenEnemy', 'hiddenSwitch'];
        case 'torch':
            return ['normal', 'active', 'hidden', 'hiddenEnemy', 'hiddenSwitch'];
        case 'teleporter':
            return ['normal', 'hidden', 'hiddenEnemy', 'hiddenSwitch'];
        case 'keyBlock':
            return ['locked', 'bigKeyLocked'];
        case 'door':
        case 'stairs':
            return ['normal', 'closed', 'closedEnemy', 'closedSwitch',
                'locked', 'bigKeyLocked', 'cracked', 'blownOpen',
                'frozen',
            ];
        case 'chest':
            return ['normal', 'hiddenEnemy', 'hiddenSwitch'];
        case 'boss':
        case 'enemy':
            return ['normal', 'hidden', 'off'];
        case 'escalator':
            return ['normal', 'off', 'frozen'];
        default:
            return ['normal'];
    }

}

export function getObjectProperties(state: GameState, editingState: EditingState): PanelRows {
    let rows: PanelRows = [];

    const object: ObjectDefinition = editingState.selectedObject;

    const selectedObject = state.areaInstance.definition.objects.includes(editingState.selectedObject)
        ? editingState.selectedObject : null;
    if (selectedObject) {
        rows.push({
            name: 'id',
            value: selectedObject.id,
            onChange(newId: string) {
                selectedObject.id = newId;
                updateObjectInstance(state, selectedObject);
            },
        });
    }
    if (editingState.tool === 'select' && !selectedObject) {
        return rows;
    }
    if (object.type !== 'enemy' && object.type !== 'boss') {
        rows.push({
            name: 'type',
            value: object.type,
            values: combinedObjectTypes,
            onChange(objectType: ObjectType) {
                object.type = objectType as any;
                editingState.selectedObject = createObjectDefinition(state, editingState, object);
                updateObjectInstance(state, editingState.selectedObject, object);
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
    rows.push({
        name: 'saveStatus',
        value: object.saveStatus || 'default',
        values: ['default', 'forever', 'zone', 'never'],
        onChange(saveStatus: 'default' | 'forever' | 'zone' | 'never') {
            if (saveStatus === 'default'){
                delete object.saveStatus;
            } else {
                object.saveStatus = saveStatus;
            }
            updateObjectInstance(state, object);
        },
    });
    rows.push({
        name: 'Logic',
        value: object.hasCustomLogic ? 'custom' : (object.logicKey || 'none'),
        values: ['none', 'custom', ...Object.keys(logicHash)],
        onChange(logicKey: string) {
            if (logicKey === 'none') {
                delete object.logicKey;
                delete object.hasCustomLogic;
            } else if (logicKey === 'custom') {
                delete object.logicKey;
                object.hasCustomLogic = true;
            } else{
                object.logicKey = logicKey;
                delete object.hasCustomLogic;
            }
            updateObjectInstance(state, object);
            displayTileEditorPropertyPanel();
        },
    });
    if (object.hasCustomLogic) {
        rows.push({
            name: 'Custom Logic',
            value: object.customLogic || '',
            onChange(customLogic: string) {
                object.customLogic = customLogic;
                updateObjectInstance(state, object);
            },
        });
    }
    rows.push({
        name: 'Invert Logic',
        value: object.invertLogic || false,
        onChange(invertLogic: boolean) {
            if (invertLogic) {
                object.invertLogic = invertLogic;
            } else {
                delete object.invertLogic;
            }
            updateObjectInstance(state, object);
        },
    });
    const possibleStatuses = getPossibleStatuses(object.type);
    if (!possibleStatuses.includes(object.status)) {
        object.status = possibleStatuses[0];
    }
    if (possibleStatuses.length > 1) {
        rows.push({
            name: 'status',
            value: object.status,
            values: possibleStatuses,
            onChange(status: ObjectStatus) {
                object.status = status;
                updateObjectInstance(state, object);
            },
        });
    }
    const specialBehaviorKeys = Object.keys(specialBehaviorsHash).filter(
        key => specialBehaviorsHash[key].type === object.type
    );

    if (specialBehaviorKeys.length) {
        rows.push({
            name: 'Special Behavior',
            value: object.specialBehaviorKey || 'none',
            values: ['none', ...specialBehaviorKeys],
            onChange(specialBehaviorKey: string) {
                if (specialBehaviorKey === 'none') {
                    delete object.specialBehaviorKey;
                } else {
                    object.specialBehaviorKey = specialBehaviorKey;
                }
                updateObjectInstance(state, object);
            },
        });
    }

    switch (object.type) {
        case 'decoration':
            rows.push({
                name: 'style',
                value: object.decorationType,
                values: Object.keys(decorationTypes),
                onChange(decorationType: DecorationType) {
                    object.decorationType = decorationType;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'layer',
                value: object.drawPriority || 'foreground',
                values: ['background', 'sprites', 'foreground'],
                onChange(drawPriority: DrawPriority) {
                    object.drawPriority = drawPriority;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'w',
                value: object.w,
                onChange(w: number) {
                    object.w = w;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'h',
                value: object.h,
                onChange(h: number) {
                    object.h = h;
                    updateObjectInstance(state, object);
                },
            });
            break;
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
            // This intentionally continue on to the marker properties.
        case 'pitEntrance':
        case 'teleporter':
            const zoneKeys = Object.keys(zones);
            const zoneKey = object.targetZone || 'none';
            rows.push({
                name: 'target zone',
                value: zoneKey,
                values: ['none', state.location.zoneKey, ...zoneKeys],
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
            const targetType: ObjectType =
                object.type === 'pitEntrance' ? 'marker' : object.type;
            const objectIds = zone ? getTargetObjectIdsByTypes(zone, [targetType]) : [];
            if (objectIds.length) {
                if (objectIds.indexOf(object.targetObjectId) < 0) {
                    object.targetObjectId = objectIds[0];
                }
                rows.push({
                    name: 'target',
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
            // This intentionally continue on to the marker properties.
        case 'marker':
        case 'spawnMarker':
            rows.push({
                name: 'Cue',
                value: object.locationCue || '',
                onChange(locationCue: string) {
                    object.locationCue = locationCue;
                    updateObjectInstance(state, object);
                },
            });
            break;
        case 'bigChest':
        case 'chest':
        case 'loot': {
            rows = [...rows, ...getLootFields(state, editingState, object)];
            break;
        }
        case 'ballGoal':
            rows = [...rows, ...getSwitchTargetProperties(state, editingState, object)];
            break;
        case 'beadCascade':
            rows.push({
                name: 'onInterval',
                value: object.onInterval || 0,
                onChange(onInterval: number) {
                    object.onInterval = onInterval;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'offInterval',
                value: object.offInterval || 0,
                onChange(offInterval: number) {
                    object.offInterval = offInterval;
                    updateObjectInstance(state, object);
                },
            });
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
        case 'keyBlock':
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
        case 'narration':
            rows.push({
                name: 'message',
                multiline: true,
                value: object.message || '',
                onChange(message: string) {
                    object.message = message;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'w',
                value: object.w || 32,
                onChange(w: number) {
                    object.w = w;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'h',
                value: object.h || 32,
                onChange(h: number) {
                    object.h = h;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'delay',
                value: object.delay || 0,
                onChange(delay: number) {
                    object.delay = delay;
                    updateObjectInstance(state, object);
                },
            });
            break;
        case 'escalator':
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
                name: 'speed',
                value: object.speed || 'slow',
                values: ['slow', 'fast'],
                onChange(speed: 'fast' | 'slow') {
                    object.speed = speed;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'w',
                value: object.w || 16,
                onChange(w: number) {
                    object.w = w;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'h',
                value: object.h || 16,
                onChange(h: number) {
                    object.h = h;
                    updateObjectInstance(state, object);
                },
            });
            break;
        case 'npc':
            rows.push({
                name: 'dialogueKey',
                multiline: true,
                value: object.dialogueKey || 'custom',
                values: ['custom', ...Object.keys(dialogueHash)],
                onChange(dialogueKey: string) {
                    if (dialogueKey === 'custom') {
                        dialogueKey = null;
                    }
                    object.dialogueKey = dialogueKey;
                    updateObjectInstance(state, object);
                    displayTileEditorPropertyPanel();
                },
            });
            if (!object.dialogueKey) {
                rows.push({
                    name: 'Custom Dialogue',
                    multiline: true,
                    value: object.dialogue || '',
                    onChange(dialogue: string) {
                        object.dialogue = dialogue;
                        updateObjectInstance(state, object);
                    },
                });
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
        case 'staffTowerPoint':
            const locations: StaffTowerLocation[] = ['desert', 'forest', 'mountain'];
            if (!locations.includes(object.location)) {
                object.location = locations[0];
            }
            rows.push({
                name: 'location',
                value: object.location,
                values: locations,
                onChange(location: StaffTowerLocation) {
                    object.location = location;
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
    } else if (object.type === 'escalator') {
        styles = escalatorStyles;
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
    updateObjectInstance(state, newObject, null, state.areaInstance, true);
}

export function unselectObject(editingState: EditingState, refresh: boolean = true) {
    editingState.selectedObject = {...editingState.selectedObject};
    delete editingState.selectedObject.id;
    displayTileEditorPropertyPanel();
}

export function onMouseDownSelect(state: GameState, editingState: EditingState, x: number, y: number): void {
    let changedSelection = false;
    if (state.areaInstance.definition.objects.includes(editingState.selectedObject)) {
        if (!isPointInObject(x, y, editingState.selectedObject)) {
            unselectObject(editingState, false);
            changedSelection = true;
        }
    }
    if (!state.areaInstance.definition.objects.includes(editingState.selectedObject)) {
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
    if (state.areaInstance.definition.objects.includes(editingState.selectedObject)) {
        editingState.dragOffset = {
            x: editingState.selectedObject.x - x,
            y: editingState.selectedObject.y - y,
        };
    }
}

export function fixObjectPosition(state: GameState, object: ObjectDefinition): void {
    if (object.type === 'escalator' || object.type === 'decoration') {
        //object.x = Math.round(object.x / 8) * 8;
        //object.y = Math.round(object.y / 8) * 8;
        return;
    }
    // Default behavior is to snap to grid.
    if (object.type !== 'loot') {
        object.x = Math.round(object.x / 16) * 16;
        object.y = Math.round(object.y / 16) * 16;
    }

}

export function onMouseMoveSelect(state: GameState, editingState: EditingState, x: number, y: number): void {
    if (!state.areaInstance.definition.objects.includes(editingState.selectedObject) || !editingState.dragOffset) {
        return;
    }
    const linkedDefinition = getLinkedDefinition(state.alternateAreaInstance.definition, editingState.selectedObject);
    const oldX = editingState.selectedObject.x, oldY = editingState.selectedObject.y;
    editingState.selectedObject.x = Math.round(x + editingState.dragOffset.x);
    editingState.selectedObject.y = Math.round(y + editingState.dragOffset.y);
    fixObjectPosition(state, editingState.selectedObject);
    if (oldX !== editingState.selectedObject.x || oldY !== editingState.selectedObject.y) {
        if (linkedDefinition) {
            //console.log("Updating linked definition");
            linkedDefinition.x = editingState.selectedObject.x;
            linkedDefinition.y = editingState.selectedObject.y;
            //console.log(linkedDefinition);
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

export function getObjectFrame(object: ObjectDefinition): FrameDimensions {
    const state = getState();
    if (object.type === 'loot') {
        return getLootFrame(state, object);
    }
    const instance = createObjectInstance(state, object);
    if (instance.getHitbox) {
        return instance.getHitbox(state);
    }
    return getLootFrame(state, {lootType: 'unknown'});
}

export function getObjectHitBox(object: ObjectDefinition): Rect {
    const state = getState();
    const instance = createObjectInstance(state, object);
    if (instance.getHitbox) {
        return instance.getHitbox(state);
    }
    let frame =  getObjectFrame(object);
    const rectangle = {...frame, x: object.x, y: object.y};
    if (frame.content) {
        rectangle.x += frame.content.x;
        rectangle.y += frame.content.y;
        rectangle.w = frame.content.w;
        rectangle.h = frame.content.h;
    }
    return rectangle;
}

export function isPointInObject(x: number, y: number, object: ObjectDefinition): boolean {
    const camera = getState().camera;
    return isPointInShortRect(x + camera.x, y + camera.y, getObjectHitBox(object));
}

function checkToAddLinkedObject(state: GameState, definition: ObjectDefinition): void {
    const linkedInstance = state.alternateAreaInstance.objects.find(other =>
        definition.x === other.definition?.x && definition.y === other.definition?.y
    );
    if (linkedInstance) {
        updateObjectInstance(state, {...linkedInstance.definition, linked: definition.linked}, linkedInstance.definition, state.alternateAreaInstance);
        return;
    }
    if (!definition.linked) {
        return;
    }
    const alternateObject = {
        ...definition,
        linked: true, spirit: !definition.spirit
    };
    updateObjectInstance(state, alternateObject, null, state.alternateAreaInstance, true);
    // Make sure to update the object links when we replace object instances.
    const instance = state.areaInstance.objects.find(o => o.definition === definition);
    linkObject(instance);
}

export function updateObjectInstance(state: GameState, object: ObjectDefinition, oldDefinition?: ObjectDefinition, area: AreaInstance = null, create: boolean = false): void {
    editingState.hasChanges = true;
    if (!area) {
        area = state.areaInstance;
    }
    const definitionIndex = area.definition.objects.findIndex(d => d === (oldDefinition || object));
    if (definitionIndex >= 0) {
        area.definition.objects[definitionIndex] = object;
    } else {
        if (!create) {
            return;
        }
        area.definition.objects.push(object);
    }
    if (!isObjectLogicValid(state, object)) {
        return;
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
