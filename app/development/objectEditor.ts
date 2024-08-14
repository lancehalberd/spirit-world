import {
    findZoneTargets,
    linkObject,
} from 'app/content/areas';
import { bossTypes } from 'app/content/bosses';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { logicHash, isObjectLogicValid } from 'app/content/logic';
import { bellStyles } from 'app/content/objects/bell';
import { decorationTypes } from 'app/content/objects/decoration';
import { escalatorStyles } from 'app/content/objects/escalator';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { doorStyles } from 'app/content/objects/doorStyles';
import { stairsStyles } from 'app/content/objects/stairs';
import { torchStyles } from 'app/content/objects/torch';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { enemyTypes } from 'app/content/enemies';
import { npcBehaviors, npcStyles } from 'app/content/objects/npc';
import { pushPullObjectStyles } from 'app/content/objects/pushPullObject'
import { signStyles } from 'app/content/objects/sign';
import { getLootFrame } from 'app/content/loot';
import { lightningBarrierStyles } from 'app/content/objects/lightningBarrier';
import { pitStyles } from 'app/content/objects/pitEntrance';
import { turretStyles } from 'app/content/objects/wallTurret';
import { zones } from 'app/content/zones';
import { ObjectPalette, ObjectPaletteItem } from 'app/development/objectPalette';
import { editingState } from 'app/development/editingState';
import { getLogicProperties } from 'app/development/zoneEditor';
import { allLootTypes } from 'app/gameConstants';
import { getState } from 'app/state';
import { createObjectInstance } from 'app/utils/createObjectInstance';
import { isPointInShortRect } from 'app/utils/index';
import { addObjectToArea, removeObjectFromArea } from 'app/utils/objects';
import { getSwitchTargetIds } from 'app/utils/switches';


type PartialObjectDefinitionWithType = Partial<ObjectDefinition> & {type: ObjectType};

function createObjectPaletteItem<T extends string>(type: T, instance: ObjectInstance): ObjectPaletteItem<T> {
    return {
        key: type,
        render(context: CanvasRenderingContext2D, target: Rect) {
            if (instance.renderPreview) {
                instance.renderPreview(context, target);
                return;
            }
            const state = getState();
            context.save();
                const hitbox = instance.getHitbox(state);
                const scale = Math.min(1, Math.min(target.w / hitbox.w, target.h / hitbox.h));
                context.translate(
                    target.x + (target.w - hitbox.w * scale) / 2,
                    target.y + (target.h - hitbox.h * scale) / 2,
                );
                if (scale < 1) {
                    context.scale(scale, scale);
                }
                instance.area = state.areaInstance;
                instance.status = 'normal';
                instance.render(context, state);
            context.restore();
        },
    };
}

function getBossInstance(bossType: BossType): ObjectInstance {
    const state = getState();
    const definition: ObjectDefinition = createObjectDefinition(state, {
        type: 'boss',
        enemyType: bossType,
        x: 0,
        y: 0,
    });
    return createObjectInstance(state, definition);
}
function getEnemyInstance(enemyType: EnemyType): ObjectInstance {
    const state = getState();
    const definition: ObjectDefinition = createObjectDefinition(state, {
        type: 'enemy',
        enemyType,
        x: 0,
        y: 0,
    });
    return createObjectInstance(state, definition);
}
function getObjectInstance(objectType: ObjectType): ObjectInstance {
    const state = getState();
    const partialDefinition = {type: objectType} as PartialObjectDefinitionWithType;
    const definition = createObjectDefinition(state, partialDefinition);
    return createObjectInstance(state, definition);
}

let objectPalette: ObjectPalette<ObjectType>;
let enemyPalette: ObjectPalette<EnemyType>;
let bossPalette: ObjectPalette<BossType>;

function getObjectPalette() {
    if (!objectPalette) {
        objectPalette = new ObjectPalette<ObjectType>(combinedObjectTypes[0],
            combinedObjectTypes.map(
                type => createObjectPaletteItem(type, getObjectInstance(type))
            ),
            (objectType: ObjectType) => {
                const state = getState();
                const object: ObjectDefinition = editingState.selectedObject;
                object.type = objectType as any;
                editingState.selectedObject = createObjectDefinition(state, object);
                updateObjectInstance(state, editingState.selectedObject, object);
                editingState.needsRefresh = true;
            }
        );
    }
    return objectPalette;
}

function getEnemyPalette() {
    if (!enemyPalette) {
        enemyPalette = new ObjectPalette<EnemyType>(enemyTypes[0],
            enemyTypes.map(
                type => createObjectPaletteItem(type, getEnemyInstance(type))
            ),
            (enemyType: EnemyType) => {
                const object = editingState.selectedObject as EnemyObjectDefinition;
                object.enemyType = enemyType;
                updateObjectInstance(getState(), object);
                editingState.needsRefresh = true;
            }
        );
    }
    return enemyPalette;
}

function getBossPalette() {
    if (!bossPalette) {
        bossPalette = new ObjectPalette<BossType>(bossTypes[0],
            bossTypes.map(
                type => createObjectPaletteItem(type, getBossInstance(type))
            ),
            (enemyType: BossType) => {
                const object = editingState.selectedObject as BossObjectDefinition;
                object.enemyType = enemyType;
                updateObjectInstance(getState(), object);
                editingState.needsRefresh = true;
            }
        );
    }
    return bossPalette;
}

export function getObjectTypeProperties(): PanelRows {
    const object: ObjectDefinition = editingState.selectedObject;
    if (object.type === 'enemy') {
        const palette = getEnemyPalette();
        palette.selectedKey = object.enemyType as EnemyType;
        palette.render();
        return [palette.canvas];
    }
    if (object.type === 'boss') {
        const palette = getBossPalette();
        palette.selectedKey = object.enemyType;
        palette.render();
        return [palette.canvas];
    }
    const palette = getObjectPalette();
    palette.selectedKey = object.type;
    palette.render();
    return [palette.canvas];
}

export const combinedObjectTypes: ObjectType[] = [
    'airStream', 'anode', 'cathode', 'airBubbles', 'ballGoal', 'beadCascade', 'beadGrate', 'bell', 'bigChest', 'chest', 'crystalSwitch', 'decoration',
    'door', 'elevator', 'escalator', 'flameTurret', 'floorSwitch', 'indicator', 'keyBlock', 'loot','marker', 'movingPlatform', 'narration', 'npc', 'pitEntrance',
    'pushPull', 'pushStairs', 'rollingBall', 'saveStatue', 'shieldingUnit', 'shopItem', 'sign', 'spawnMarker', 'spikeBall', 'staffTower',
    'stairs', 'teleporter', 'tippable', 'torch', 'trampoline', 'turret',
    'vineSprout', 'waterfall', 'waterPot',
];

export function createObjectDefinition(
    state: GameState,
    definition: PartialObjectDefinitionWithType
): ObjectDefinition {
    const x = definition.x || 0;
    const y = definition.y || 0;

    const specialBehaviorKeys = Object.keys(specialBehaviorsHash).filter(
        key => specialBehaviorsHash[key].type === definition.type
    );
    const possibleStatuses = getPossibleStatuses(definition.type);
    const commonProps = {
        // Assign defaults for any props the definitions might require.
        status: possibleStatuses.includes(definition.status) ? definition.status : possibleStatuses[0],
        id: definition.id || '',
        linked: definition.linked,
        logicKey: definition.logicKey,
        spirit: definition.spirit,
        specialBehaviorKey: definition.specialBehaviorKey,
        x,
        y,
    };
    // Clear the special behavior if it doesn't apply to the new type selected.
    if (!specialBehaviorKeys.includes(commonProps.specialBehaviorKey)) {
        delete commonProps.specialBehaviorKey;
    }
    // Omit spirit/linked if they are false.
    if (!commonProps.linked) {
        delete commonProps.linked;
    }
    if (!commonProps.spirit) {
        delete commonProps.spirit;
    }
    switch (definition.type) {
        case 'airStream':
            return {
                ...commonProps,
                saveStatus: definition.saveStatus,
                type: definition.type,
                d: definition.d || 'down',
                length: definition.length || 192,
                offInterval: definition.offInterval,
                onInterval: definition.onInterval,
            };
        case 'anode':
            return {
                ...commonProps,
                saveStatus: definition.saveStatus,
                type: definition.type,
                style: definition.style || Object.keys(lightningBarrierStyles)[0],
                offInterval: definition.offInterval,
                onInterval: definition.onInterval,
            };
        case 'cathode':
            return {
                ...commonProps,
                type: definition.type,
                style: definition.style || Object.keys(lightningBarrierStyles)[0],
            };
        case 'ballGoal':
            return {
                ...commonProps,
                type: definition.type,
                requireAll: definition.requireAll ?? true,
                targetObjectId: definition.targetObjectId,
            };
        case 'beadCascade':
            return {
                ...commonProps,
                saveStatus: definition.saveStatus,
                type: definition.type,
                height: definition.height ?? 40,
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
                requireAll: definition.requireAll ?? true,
                targetObjectId: definition.targetObjectId,
            };
        case 'door':
        case 'staffTower':
            return {
                ...commonProps,
                type: definition.type,
                style: definition.style || 'cave', //Object.keys(doorStyles)[0],
                frozenLogic: definition.frozenLogic,
                openLogic: definition.openLogic,
                targetZone: definition.targetZone,
                targetObjectId: definition.targetObjectId,
                d: definition.d || 'up',
                locationCue: definition.locationCue,
                saveStatus: definition.saveStatus,
            };
        case 'marker':
        case 'spawnMarker':
            return {
                ...commonProps,
                locationCue: definition.locationCue,
                saveStatus: definition.saveStatus,
                type: definition.type,
            };
        case 'boss': {
            const bossType = definition.enemyType;
            const lootType = definition.lootType || allLootTypes[0];
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
                z: definition.z,
                w: definition.w || 16,
                h: definition.h || 16,
                decorationType: definition.decorationType || Object.keys(decorationTypes)[0] as DecorationType,
            };
        case 'waterfall':
            return {
                ...commonProps,
                type: definition.type,
                w: definition.w || 16,
                h: definition.h || 16,
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
                z: definition.z,
                id: definition.id || uniqueId(state, enemyType),
                enemyType,
                d: definition.d || 'down',
                saveStatus: definition.saveStatus,
                params,
            };
        }
        case 'elevator': {
            return {
                ...commonProps,
                type: definition.type,
                floor: definition.floor || 0,
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
        case 'stairs': {
            return {
                ...commonProps,
                w: definition.w || 32,
                h: definition.h || 64,
                style: definition.style || Object.keys(escalatorStyles)[0],
                type: definition.type,
            };
        }
        case 'floorSwitch':
            return {
                ...commonProps,
                requireAll: definition.requireAll ?? true,
                targetObjectId: definition.targetObjectId,
                toggleOnRelease: definition.toggleOnRelease,
                type: definition.type,
            };
        case 'indicator':
            return {
                ...commonProps,
                targetObjectId: definition.targetObjectId,
                type: definition.type,
            };
        case 'keyBlock':
            return {
                ...commonProps,
                type: definition.type,
                freezePlayer: definition.freezePlayer ?? false,
                requireAll: definition.requireAll ?? true,
                targetObjectId: definition.targetObjectId,
            };
        case 'pitEntrance':
            return {
                ...commonProps,
                style: definition.style || Object.keys(pitStyles)[0],
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
        case 'shopItem':
        case 'loot': {
            const lootType = definition.lootType || allLootTypes[0];
            const lootDefinition: LootObjectDefinition = {
                ...commonProps,
                type: definition.type,
                id: definition.id || uniqueId(state, lootType),
                lootType,
            };
            if (definition.type === 'shopItem') {
                lootDefinition.price = definition.price || 100;
            }
            if (lootType === 'money') {
                lootDefinition.lootAmount = definition.lootAmount || 1;
            } else {
                lootDefinition.lootLevel = definition.lootLevel || 1;
                delete lootDefinition.lootAmount;
            }
            return lootDefinition;
        }
        case 'movingPlatform':
            return {
                ...commonProps,
                type: definition.type,
                d: definition.d || 'up',
                w: definition.w || 32,
                h: definition.h || 32,
                speed: definition.speed || 1,
                turn: definition.turn || 'bounce',
            };
        case 'airBubbles':
        case 'beadGrate':
        case 'cathode':
        case 'flameTurret':
        case 'rollingBall':
        case 'saveStatue':
        case 'shieldingUnit':
        case 'trampoline':
        case 'vineSprout':
        case 'waterPot':
            return {
                ...commonProps,
                saveStatus: definition.saveStatus,
                type: definition.type,
            };
        case 'pushPull':
            return {
                ...commonProps,
                saveStatus: definition.saveStatus,
                style: definition.style || Object.keys(pushPullObjectStyles)[0],
                type: definition.type,
            };

        case 'tippable':
            return {
                ...commonProps,
                shattered: definition.shattered,
                saveStatus: definition.saveStatus,
                type: definition.type,
            };

        case 'torch':
            return {
                ...commonProps,
                saveStatus: definition.saveStatus,
                style: definition.style || Object.keys(torchStyles)[0],
                type: definition.type,
            };
        case 'pushStairs':
            return {
                ...commonProps,
                saveStatus: definition.saveStatus,
                type: definition.type,
                w: definition.w || 48,
                offset: definition.offset || 0,
            };
        case 'spikeBall':
            return {
                ...commonProps,
                type: definition.type,
                d: definition.d || 'up',
                speed: definition.speed || 1,
                turn: definition.turn || 'bounce',
            };
        case 'narration':
            return {
                ...commonProps,
                type: definition.type,
                message: definition.message || '',
                trigger: definition.trigger || 'touch',
                delay: definition.delay || 0,
                w: definition.w || 32,
                h: definition.h || 32,
            };
        case 'bell':
            return {
                ...commonProps,
                style: definition.style || Object.keys(bellStyles)[0],
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
                style: definition.style || Object.keys(npcStyles)[0],
                type: definition.type,
                dialogueKey: definition.dialogueKey,
                dialogue: definition.dialogue,
            };
        case 'turret':
            return {
                ...commonProps,
                type: definition.type,
                style: definition.style || turretStyles[0],
                d: definition.d || 'down',
                fireInterval: definition.fireInterval || 1000,
                fireOffset: definition.fireOffset || 0,
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
    return combinedObjectIds.flat().filter(id => id);
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
    const objectIds = getSwitchTargetIds(state.areaInstance);

    if (object.id && objectIds.indexOf(object.targetObjectId) < 0) {
        delete object.targetObjectId;
    }
    rows.push({
        name: 'require all',
        value: object.requireAll ?? true,
        onChange(requireAll: boolean) {
            object.requireAll = requireAll;
            updateObjectInstance(state, object);
        },
    });
    rows.push({
        name: 'target object',
        value: object.targetObjectId ?? 'none',
        values: objectIds,
        onChange(targetObjectId: string) {
            if (targetObjectId === 'none' || targetObjectId === 'all') {
                delete object.targetObjectId;
            } else {
                object.targetObjectId = targetObjectId;
            }
            updateObjectInstance(state, object);
        },
    });
    return rows;
}

function getUniqueObjectIdsForBothAreas(state: GameState, editingState: EditingState): string[] {
    const ids = [];
    for (const object of [...state.areaInstance.definition.objects, ...state.alternateAreaInstance.definition.objects]) {
        if (object.id) {
            ids.push(object.id);
        }
    }
    return [...new Set(ids)];
}

function getPossibleStatuses(type: ObjectType): ObjectStatus[] {
    switch (type) {
        case 'airBubbles':
        case 'beadCascade':
        case 'beadGrate':
        case 'cathode':
        case 'pitEntrance':
        case 'rollingBall':
            return ['normal', 'hidden', 'hiddenEnemy', 'hiddenSwitch'];
        case 'torch':
            return ['normal', 'active', 'hidden', 'hiddenEnemy', 'hiddenSwitch'];
        case 'teleporter':
            return ['normal', 'hidden', 'hiddenEnemy', 'hiddenSwitch'];
        case 'keyBlock':
            return ['closed', 'locked', 'bigKeyLocked'];
        case 'door':
            return ['normal', 'closed', 'closedEnemy', 'closedSwitch',
                'locked', 'bigKeyLocked', 'cracked', 'blownOpen',
            ];
        case 'chest':
            return ['normal', 'hiddenEnemy', 'hiddenSwitch'];
        case 'boss':
        case 'enemy':
            return ['normal', 'hidden', 'off'];
        case 'anode':
        case 'escalator':
            return ['normal', 'off', 'frozen'];
        case 'airStream':
        case 'shieldingUnit':
        case 'staffTower':
            return ['normal', 'closed'];
        case 'sign':
            return ['normal', 'hidden'];
        case 'turret':
            return ['normal', 'off'];
        default:
            return ['normal'];
    }

}

export function isObjectSelected(state: GameState, editingState: EditingState): boolean {
    return !!state.areaInstance.definition.objects.includes(editingState.selectedObject);
}

export function getObjectProperties(state: GameState, editingState: EditingState): PanelRows {
    let rows: PanelRows = [];

    const object: ObjectDefinition = editingState.selectedObject;

    const selectedObject = isObjectSelected(state, editingState) ? editingState.selectedObject : null;
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
                    editingState.needsRefresh = true;
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
    rows.push({
        name: 'invisible',
        value: !!object.isInvisible,
        onChange(isInvisible: boolean) {
            object.isInvisible = isInvisible;
            updateObjectInstance(state, object);
        },
    });
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

    rows = [...rows, ...getStyleFields(state, editingState, object)];
    switch (object.type) {
        case 'decoration':
            rows.push({
                name: 'decoration type',
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
                name: 'z',
                value: object.z || 0,
                onChange(z: number) {
                    object.z = z;
                    updateObjectInstance(state, object);
                },
            });
        case 'waterfall':
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
        case 'tippable':
            rows.push({
                name: 'shattered',
                value: object.shattered || false,
                onChange(shattered: boolean) {
                    object.shattered = shattered;
                    updateObjectInstance(state, object);
                },
            });
            break;
        case 'elevator':
            rows.push({
                name: 'floor',
                value: object.floor || 0,
                onChange(floor: number) {
                    object.floor = floor;
                    updateObjectInstance(state, object);
                },
            });
            break;
        case 'pushStairs':
            rows.push({
                name: 'w',
                value: object.w,
                onChange(w: number) {
                    if (!(w >= 48)) {
                        return 48;
                    }
                    object.w = w;
                    // Reset the stairs to their starting point when editing them.
                    if (object.id) {
                        delete state.savedState.objectFlags[object.id];
                    }
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'offset',
                value: object.offset || 0,
                onChange(offset: number) {
                    if (!(offset >= 0)) {
                        return 0;
                    }
                    if (!(offset <= object.w - 32)) {
                        return object.w - 32;
                    }
                    object.offset = offset;
                    // Reset the stairs to their starting point when editing them.
                    if (object.id) {
                        delete state.savedState.objectFlags[object.id];
                    }
                    updateObjectInstance(state, object);
                },
            });
            break;
        case 'movingPlatform':
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
            // This should fall through to use the same movement properties as the spike ball.
        case 'spikeBall':
            rows.push(getDirectionFields(state, object));
            rows.push({
                name: 'speed',
                value: object.speed,
                onChange(speed: number) {
                    if (speed < 0) {
                        return 0;
                    }
                    object.speed = speed;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'turn',
                value: object.turn || 'bounce',
                values: ['bounce', 'left', 'right'],
                onChange(turn: 'bounce' | 'left' | 'right') {
                    object.turn = turn;
                    updateObjectInstance(state, object);
                },
            });
            break;
        case 'door':
            rows.push(getDirectionFields(state, object));
            rows.push({
                name: 'price',
                value: object.price ?? 0,
                onChange(price: number) {
                    object.price = price;
                    updateObjectInstance(state, object);
                },
            });
            rows = [
                ...rows,
                ...getLogicProperties(state, 'Is Frozen?', object.frozenLogic, updatedLogic => {
                    object.frozenLogic = updatedLogic;
                    updateObjectInstance(state, object);
                }),
            ];
            rows = [
                ...rows,
                ...getLogicProperties(state, 'Force Open?', object.openLogic, updatedLogic => {
                    object.openLogic = updatedLogic;
                    updateObjectInstance(state, object);
                    editingState.needsRefresh = true;
                }),
            ];
            // This intentionally continue on to the marker properties.
        case 'pitEntrance':
        case 'staffTower':
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
                        object.targetObjectId = null;
                    }
                    object.targetZone = targetZone;
                    updateObjectInstance(state, object);
                    editingState.needsRefresh = true;
                },
            });
            const zone = zones[zoneKey];
            // Pit entrances target markers, but other entrances target the same kind of entrnace,
            // for example teleporter => teleporter, doors => doors.
            let targetType: ObjectType = object.type;
            if (object.type === 'pitEntrance') {
                targetType = 'marker';
            } else if (object.type === 'staffTower') {
                targetType = 'door';
            }
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
                if (object.id && object.targetObjectId && object.type !== 'pitEntrance') {
                    rows.push({
                        name: 'Link Back',
                        onClick() {
                            const objectTargets = findZoneTargets(
                                state,
                                object.targetZone,
                                object.targetObjectId,
                                object,
                                false
                            );
                            for (const objectTarget of objectTargets) {
                                const targetObject = objectTarget.object as EntranceDefinition;
                                targetObject.targetZone = state.location.zoneKey;
                                targetObject.targetObjectId = object.id;
                            }
                        },
                    });
                }
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
        case 'loot':
        case 'shopItem': {
            rows = [...rows, ...getLootFields(state, editingState, object)];
            if (object.type === 'shopItem') {
                rows.push({
                    name: 'price',
                    value: object.price ?? 100,
                    onChange(price: number) {
                        object.price = price;
                        updateObjectInstance(state, object);
                    },
                });
            }
            break;
        }
        case 'ballGoal':
            rows = [...rows, ...getSwitchTargetProperties(state, editingState, object)];
            break;
        case 'airStream':
            rows.push(getDirectionFields(state, object));
            rows.push({
                name: 'length',
                value: object.length || 192,
                onChange(length: number) {
                    length = Math.min(length, 192);
                    object.length = length;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'onInterval',
                value: object.onInterval || 0,
                inputClass: 'large',
                onChange(onInterval: number) {
                    object.onInterval = onInterval;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'offInterval',
                value: object.offInterval || 0,
                inputClass: 'large',
                onChange(offInterval: number) {
                    object.offInterval = offInterval;
                    updateObjectInstance(state, object);
                },
            });
            break;
        case 'beadCascade':
            rows.push({
                name: 'height',
                value: object.height ?? 40,
                onChange(height: number) {
                    object.height = height;
                    updateObjectInstance(state, object);
                },
            });
        case 'anode':
            rows.push({
                name: 'onInterval',
                value: object.onInterval || 0,
                inputClass: 'large',
                onChange(onInterval: number) {
                    object.onInterval = onInterval;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'offInterval',
                value: object.offInterval || 0,
                inputClass: 'large',
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
                inputClass: 'large',
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
        case 'indicator':object
            const ids = getUniqueObjectIdsForBothAreas(state, editingState);
            rows.push({
                name: 'target',
                value: object.targetObjectId ?? 'none',
                values: ['none', ...ids],
                onChange(targetObjectId: string) {
                    if (targetObjectId === 'none') {
                        delete object.targetObjectId;
                    } else {
                        object.targetObjectId = targetObjectId;
                    }
                    updateObjectInstance(state, object);
                },
            });
            break;
        case 'keyBlock':
            rows = [...rows, ...getSwitchTargetProperties(state, editingState, object)];
            rows.push({
                name: 'freeze player',
                value: object.freezePlayer ?? false,
                onChange(freezePlayer: boolean) {
                    object.freezePlayer = freezePlayer;
                    updateObjectInstance(state, object);
                },
            });
            break;
        case 'enemy':
            rows = [...rows, ...getEnemyFields(state, editingState, object)];
            break;
        case 'boss':
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
                name: 'trigger',
                multiline: true,
                value: object.trigger || 'touch',
                values: ['touch', 'activate', 'enterArea'] as NarrationDefinition['trigger'][],
                onChange(trigger: NarrationDefinition['trigger']) {
                    object.trigger = trigger;
                    updateObjectInstance(state, object);
                },
            });
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
                inputClass: 'large',
                onChange(delay: number) {
                    object.delay = delay;
                    updateObjectInstance(state, object);
                },
            });
            break;
        case 'escalator':
            rows.push(getDirectionFields(state, object));
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
            break;
        case 'stairs':
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
                value: object.h || 64,
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
                    editingState.needsRefresh = true;
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
            rows.push(getDirectionFields(state, object));
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
        case 'turret':
            rows.push(getDirectionFields(state, object));
            rows.push({
                name: 'fireInterval',
                value: object.fireInterval ?? 1000,
                inputClass: 'large',
                onChange(fireInterval: number) {
                    object.fireInterval = fireInterval;
                    updateObjectInstance(state, object);
                },
            });
            rows.push({
                name: 'fireOffset',
                value: object.fireOffset ?? 0,
                inputClass: 'large',
                onChange(fireOffset: number) {
                    object.fireOffset = fireOffset;
                    updateObjectInstance(state, object);
                },
            });
            break;
    }
    return rows;
}

function getDirectionFields(state: GameState, object: ObjectDefinition, defaultDirection = 'down'): EditorProperty<any> {
    return {
        name: 'direction',
        value: object.d || defaultDirection,
        values: ['up', 'down', 'left', 'right'],
        onChange(direction: Direction) {
            object.d = direction;
            updateObjectInstance(state, object);
        },
    };
}

function getEnemyFields(state: GameState, editingState: EditingState, object: ObjectDefinition) {
    let rows = [];
    if (object.type !== 'enemy' && object.type !== 'boss') {
        return;
    }
    rows.push(getDirectionFields(state, object, 'up'));
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
    rows.push({
        name: 'z',
        value: object.z || 0,
        onChange(z: number) {
            object.z = z;
            updateObjectInstance(state, object);
        },
    });
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
    } else if (object.type === 'turret') {
        styles = turretStyles;
    } else if (object.type === 'pitEntrance') {
        styles = pitStyles;
    } else if (object.type === 'pushPull') {
        styles = pushPullObjectStyles;
    } else if (object.type === 'bell') {
        styles = bellStyles;
    } else if (object.type === 'torch') {
        styles = torchStyles;
    } else if (object.type === 'cathode' || object.type === 'anode') {
        styles = lightningBarrierStyles;
    } else if (object.type === 'staffTower') {
        styles = {'ground': 0, 'sky': 1};
    } else if (object.type === 'stairs') {
        styles = stairsStyles
    }
    if (!styles) {
        return [];
    }

    if (!styles[object.style]) {
        // Keep this default until we remove all the old cave doors.
        if (object.type === 'door') {
            object.style = 'cave';
        } else {
            object.style = Object.keys(styles)[0];
        }
    }
    rows.push({
        id: 'objectStyle',
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
    if (object.type !== 'bigChest' && object.type !== 'loot'
        && object.type !== 'chest' && object.type !== 'boss'
        && object.type !== 'shopItem'
    ) {
        return [];
    }
    const lootType = object.lootType || 'peachOfImmortalityPiece';
    let rows = [];
    rows.push({
        name: 'lootType',
        value: lootType,
        values: allLootTypes,
        onChange(lootType: LootType) {
            object.lootType = lootType;
            updateObjectInstance(state, object);
            editingState.needsRefresh = true;
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

export function unselectObject(editingState: EditingState) {
    editingState.selectedObject = {...editingState.selectedObject};
    delete editingState.selectedObject.id;
    editingState.needsRefresh = true;
}

export function onMouseDownSelectObject(state: GameState, editingState: EditingState, x: number, y: number): boolean {
    let changedSelection = false;
    if (state.areaInstance.definition.objects.includes(editingState.selectedObject)) {
        if (!isPointInObject(x, y, editingState.selectedObject)) {
            unselectObject(editingState);
            changedSelection = true;
        }
    }
    if (state.areaInstance.definition.variants?.includes(editingState.selectedVariantData)) {
        if (!isPointInShortRect(x + state.camera.x, y + state.camera.y, editingState.selectedVariantData)) {
            unselectObject(editingState);
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
        editingState.needsRefresh = true;
    }
    // If selectedObject is still set, then we are dragging it, so indicate the drag offset.
    const objectIsSelected = !!state.areaInstance.definition.objects.includes(editingState.selectedObject);
    if (objectIsSelected) {
        editingState.dragOffset = {
            x: editingState.selectedObject.x - x,
            y: editingState.selectedObject.y - y,
        };
    }
    return objectIsSelected;
}

export function fixObjectPosition(state: GameState, object: ObjectDefinition): void {
    if (object.type === 'escalator' || object.type === 'stairs'
        || object.type === 'decoration' || object.type === 'waterfall'
        || object.type === 'pushPull'
    ) {
        //object.x = Math.round(object.x / 8) * 8;
        //object.y = Math.round(object.y / 8) * 8;
        return;
    }
    if (object.type === 'staffTower') {
        object.x = Math.round(object.x / 2) * 2;
        object.y = Math.round(object.y / 2) * 2;
        return;
    }
    const instance = createObjectInstance(state, object);
    // Objects that apply their behaviors to the grid must be tile aligned.
    if (instance.applyBehaviorsToGrid) {
        object.x = Math.round(object.x / 16) * 16;
        object.y = Math.round(object.y / 16) * 16;
        return
    }
    if (object.type === 'enemy' || object.type === 'boss') {
        object.x = Math.round(object.x / 2) * 2;
        object.y = Math.round(object.y / 2) * 2;
        return;
    }
    // Default behavior is to snap to quarter grid.
    if (object.type !== 'loot') {
        object.x = Math.round(object.x / 4) * 4;
        object.y = Math.round(object.y / 4) * 4;
    }

}

export function onMouseDragObject(state: GameState, editingState: EditingState, x: number, y: number): boolean {
    if (!state.areaInstance.definition.objects.includes(editingState.selectedObject) || !editingState.dragOffset) {
        return false;
    }
    const linkedDefinition = editingState.selectedObject.linked && getLinkedDefinition(state.alternateAreaInstance.definition, editingState.selectedObject);
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
    return true;
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

function getObjectHitBox(object: ObjectDefinition): Rect {
    const state = getState();
    const instance = createObjectInstance(state, object);
    if (instance.getEditorHitbox) {
        return instance.getEditorHitbox(state);
    }
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
    // If the current area has special behaviors, apply it in case it effects the updated object.
    if (area.definition.specialBehaviorKey) {
        const specialBehavior = specialBehaviorsHash[area.definition.specialBehaviorKey] as SpecialAreaBehavior;
        specialBehavior?.apply(state, area);
    }
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
    const definition: ObjectDefinition = createObjectDefinition(state, {
        id: uniqueId(state, editingState.selectedObject.type),
        ...editingState.selectedObject,
        x: Math.round(x + state.camera.x),
        y: Math.round(y + state.camera.y),
    });
    const frame = getObjectFrame(definition);
    definition.x -= (frame.content?.w || frame.w) / 2;
    definition.y -= (frame.content?.h || frame.h) / 2;
    fixObjectPosition(state, definition);
    const hitbox = getObjectHitBox(definition);
    context.save();
        context.globalAlpha *= 0.3;
        context.fillStyle = 'white';
        context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
    context.restore();
    const object = createObjectInstance(state, definition);
    if (object.renderPreview) {
        object.renderPreview(context, object.getHitbox(state));
    } else {
        object.area = state.areaInstance;
        // This is set to 'normal' so we can see the preview during edit even if it would otherwise be hidden.
        if (object.status === 'hidden' || object.status === 'gone' || object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
            object.status = 'normal';
        }
        object.render(context, state);
    }
}
