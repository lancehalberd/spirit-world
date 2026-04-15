import {isLogicValid} from 'app/content/logic';
import {lootEffects} from 'app/content/lootEffects';
import {getZone, zones} from 'app/content/zones';
import {
    canOpenDoor,
    findDoorById,
    findReachableNodes,
} from 'app/randomizer/find';
import {missingExitNodeSet, missingNodeSet, missingObjectSet, warnOnce} from 'app/randomizer/warnOnce';
import {cloneDeep} from 'app/utils/index';
import {getFullZoneLocation} from 'app/utils/getFullZoneLocation';


interface LootDrops {
    loot: {
        location: FullZoneLocation
        object: LootObjectDefinition
    }[]
}

function getAllLootDrops(): LootDrops {
    const lootDrops: LootDrops = {
        loot: [],
    }
    for (let zoneKey in zones) {
        // Don't include the debug areas
        if (zoneKey === 'peachCave' || zoneKey.startsWith('demo')) {
            continue;
        }
        const zone = zones[zoneKey];
        for (let floorIndex = 0; floorIndex < zone.floors.length; floorIndex++) {
            const floor = zone.floors[floorIndex];
            for (let row = 0; row < floor.grid.length; row++) {
                for (let column = 0; column < floor.grid[row].length; column++) {
                    const area = floor.grid[row][column];
                    for (const object of (area?.objects || [])) {
                        if (object.type !== 'chest' && object.type !== 'loot') {
                            continue;
                        }
                        lootDrops.loot.push({
                            location: getFullZoneLocation({
                                zoneKey,
                                floor: floorIndex,
                                areaGridCoords: {x: column, y: row},
                                isSpiritWorld: false,
                                x: object.x,
                                y: object.y,
                                d: null,
                            }),
                            object,
                        });
                    }
                    const spiritArea = floor.spiritGrid[row][column];
                    for (const object of (spiritArea?.objects || [])) {
                        if (object.type !== 'chest' && object.type !== 'loot') {
                            continue;
                        }
                        lootDrops.loot.push({
                            location: getFullZoneLocation({
                                zoneKey,
                                floor: floorIndex,
                                areaGridCoords: {x: column, y: row},
                                isSpiritWorld: true,
                                x: object.x,
                                y: object.y,
                                d: null,
                            }),
                            object,
                        });
                    }
                }
            }
        }
    }
    return lootDrops;
}
window['getAllLootDrops'] = getAllLootDrops;

function exportLootData() {
    console.log(JSON.stringify(getAllLootDrops().loot.map(lootData => {
        return {
            zone: lootData.location.zoneKey,
            id: lootData.object.id,
            lootType: lootData.object.lootType,
            lootLevel: lootData.object.lootLevel,
            lootAmount: lootData.object.lootAmount,
        }
    }), null, ' '));
}
window['exportLootData'] = exportLootData;

// Make a deep copy of the state.
export function copyState(state: GameState): GameState {
    return {
        ...state,
        hero: state.hero.getCopy(),
        savedState: {
            ...state.savedState,
            dungeonInventories: cloneDeep(state.savedState.dungeonInventories),
            objectFlags: {...state.savedState.objectFlags},
        },
    };
}

export function getMappedLootData(randomizerState: RandomizerState, lootObject: AnyLootDefinition): LootData {
    return randomizerState?.items?.lootAssignments?.[lootObject.id] ?? lootObject;
}

export function applyLootObjectToState(randomizerState: RandomizerState, simulatedState: GameState, lootWithLocation: LootWithLocation): GameState {
    const lootData = getMappedLootData(randomizerState, lootWithLocation.lootObject);
    if (lootData.lootType === 'empty') {
        return simulatedState;
    }
    // We need to set the current location to the loot location so that dungeon items are applied to the correct state.
    const stateCopy = copyState(simulatedState);
    if (lootWithLocation.location) {
        stateCopy.location = lootWithLocation.location;
    }
    const onPickup = lootEffects[lootData.lootType] || lootEffects.unknown;
    // Loot is always progressive in the randomizer, so set lootLevel to 0.
    // onPickup(stateCopy, lootData);
    try {
        onPickup(stateCopy, {...lootData, lootLevel: 0}, true);
    } catch (e) {
        debugger;
    }
    if (!stateCopy.hero.savedData.passiveTools.catEyes && stateCopy.hero.savedData.maxLife > 4) {
        stateCopy.hero.savedData.passiveTools.catEyes = 1;
    }
    return stateCopy;
}

export function setAllFlagsInLogic(randomizerState: RandomizerState, simulatedState: GameState): GameState {
    let {startingNodes} = randomizerState;
    let changed, updatedState = simulatedState;
    do {
        changed = false;
        startingNodes = findReachableNodes(randomizerState, updatedState);
        for (const node of startingNodes) {
            for (const flag of (node.flags || [])) {
                if (updatedState.savedState.objectFlags[flag.flag]) {
                    continue;
                }
                if (flag.logic && !isLogicValid(updatedState, flag.logic)) {
                    //console.log('Invalid logic', flag);
                    continue;
                }
                if (flag.doorId) {
                    const zone = getZone(node.zoneId);
                    const { object, location } = findDoorById(zone, flag.doorId, updatedState);
                    if (!canOpenDoor(randomizerState, location, updatedState, object as EntranceDefinition)) {
                        continue;
                    }
                }
                if (updatedState === simulatedState) {
                    updatedState = copyState(simulatedState);
                }
                updatedState.savedState.objectFlags[flag.flag] = true;
                // console.log('    Setting flag', flag.flag, updatedState.savedState.objectFlags[flag.flag]);
                changed = true;
            }
        }
    } while (changed);
    return updatedState;
}


export function debugState(state: GameState) {
    console.log(state.hero.savedData.activeTools);
    console.log(state.hero.savedData.passiveTools);
    console.log({totalSilverOre: state.hero.savedData.collectibleTotals.silverOre, totalGoldOre: state.hero.savedData.collectibleTotals.goldOre });
    console.log(Object.keys(state.savedState.objectFlags));
}

export function debugLocations(loot: LootWithLocation[]) {
    return loot.map(debugLocation).join(',');
}

function debugLocation(loot: LootWithLocation) {
    if (loot.location) {
        return loot.location.zoneKey + '::' + loot.lootObject.id;
    } else {
        return loot.dialogueKey + '::' + loot.optionKey;
    }
}

function everyZone(callback: (location: Partial<ZoneLocation>, zone: Zone) => void ) {
    for (const zoneKey in zones) {
        callback({zoneKey}, zones[zoneKey]);
    }
}
function everyArea(callback: (location: FullZoneLocation, zone: Zone, area: AreaDefinition) => void ) {
    everyZone((location, zone) => {
        for (let floor = 0; floor < zone.floors.length; floor++) {
            for (const grid of [zone.floors[floor].grid, zone.floors[floor].spiritGrid]) {
                if (!grid) {
                    continue;
                }
                const isSpiritWorld = grid === zone.floors[floor].spiritGrid;
                for (let y = 0; y < grid.length; y++) {
                    for (let x = 0; x < grid[y].length; x++) {
                        if (!grid[y][x]) {
                            continue;
                        }
                        callback(getFullZoneLocation({
                            zoneKey: location.zoneKey,
                            floor,
                            isSpiritWorld,
                            areaGridCoords: {x, y},
                            x: 0, y: 0, d: 'up',
                        }), zone, grid[y][x]);
                    }
                }
            }
        }
    });
}
export function everyObject(callback: (location: FullZoneLocation, zone: Zone, area: AreaDefinition, objectDefinition: ObjectDefinition) => void) {
    everyArea((location, zone, area) => {
        for (let i = 0; i < area.objects.length; i++) {
            callback(location, zone, area, area.objects[i]);
        }
    });
}


export function getMappedEntranceData(randomizerState: RandomizerState, zoneKey: string, entrance: EntranceDefinition): EntranceData {
    return randomizerState?.entrances?.entranceAssignments?.[`${zoneKey}:${entrance.id}`] ?? entrance;
}

export function verifyNodeConnections(randomizerState: RandomizerState) {
    const {allNodes, allNodesById, allNodesByZoneKey} = randomizerState;
    for (const currentNode of allNodes) {
        // console.log('node: ', currentNode.nodeId);
        const zone = getZone(currentNode.zoneId);
        if (!zone) {
            debugger;
            continue;
        }
        for (const path of (currentNode.paths || [])) {
            const nextNode = allNodesById[path.nodeId];
            if (!nextNode) {
                warnOnce(missingNodeSet, path.nodeId, 'Missing node: ');
                continue;
            }
        }
        for (const exit of (currentNode.exits || [])) {
            const { object } = findDoorById(zone, exit.objectId);
            const exitObject = object as EntranceDefinition;
            if (!exitObject) {
                warnOnce(missingObjectSet,
                    zone.key + '::' + exit.objectId,
                    'Exit not found: ');
                continue;
            }
            //console.log('->', exitObject.targetZone + ':' + exitObject.targetObjectId);
            const {targetZone, targetObjectId} = getMappedEntranceData(randomizerState, zone.key, exitObject);
            const nextNode = allNodesByZoneKey[targetZone]?.find(node =>
                (node !== currentNode || targetObjectId !== exit.objectId)
                && node.entranceIds?.includes(targetObjectId)
            );
            if (!nextNode) {
                warnOnce(missingExitNodeSet,
                    zone.key + '::' + exitObject.id + ' => '
                    + targetZone + '::' + targetObjectId + `(original ${exitObject.targetZone}::${exitObject.targetObjectId}`,
                    'Missing node for exit: ');
                continue;
            }
        }
    }
}



/*
Debug code from the old randomizer:

function testConnectivity() {
    calculateKeyLogic(allNodes, [mainOverworldNode]);
    let initialState = getDefaultState();
        applySavedState(initialState, initialState.savedState);
    const allLootObjects = findLootObjects(allNodes);
    let finalState = copyState(initialState);
    for (const lootWithLocation of allLootObjects) {
        finalState = applyLootObjectToState(finalState, lootWithLocation);
        finalState.savedState.objectFlags[lootWithLocation.lootObject.id] = true;
        for (const flag of (lootWithLocation.progressFlags || [])) {
            finalState.savedState.objectFlags[flag] = true;
        }
    }
    const entrance1 = staffTowerNodes.find(node => node.nodeId === 'staffTowerF1Downstairs');
    const entrance2 = staffTowerNodes.find(node => node.nodeId === 'staffTowerF4Spirit');
    finalState.hero.savedData.elements.lightning = 0;
    finalState.hero.savedData.activeTools.staff = 0;
    finalState.hero.savedData.activeTools.clone = 1;
    finalState.hero.savedData.equipment.ironBoots = 1;
    finalState.savedState.dungeonInventories.staffTower.smallKeys = 0;
    finalState.savedState.dungeonInventories.staffTower.totalSmallKeys = 0;
    finalState = setAllFlagsInLogic(finalState, allNodes,  [mainOverworldNode]);
    //initialState.hero.savedData.activeTools.staff = 1;
    //initialState = setAllFlagsInLogic(initialState, craterNodes,  [entrance]);
    const reachableNodes = findReachableNodes(staffTowerNodes, [entrance1, entrance2], finalState);
    console.log(reachableNodes);
    for (const node of staffTowerNodes) {
        if (!reachableNodes.includes(node)) {
            console.log('Could not reach node', node);
        }
    }
}
window.forgeNodes = forgeNodes;
testConnectivity;//();
function checkForEntranceIdConflicts() {
    const idToNode: {[key in string]: LogicNode[]} = {};
    for (const node of allNodes) {
        for (const entranceId of node.entranceIds || []) {
            if (!idToNode[entranceId]) {
                idToNode[entranceId] = [node];
            } else if (idToNode[entranceId].length > 1) {
                // TODO: Handle the case when isSpiritWorld is set on nodes, then we allow
                // one pair in the material world, and one pair in the spirit world.
                // TODO: Handle the case for markers that should only have 1 entranceId per world.
                console.error('conflict', entranceId, idToNode[entranceId], node);
            } else {
                idToNode[entranceId].push(node);
            }
        }
    }
}
checkForEntranceIdConflicts//();
*/
