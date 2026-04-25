import {dialogueHash} from 'app/content/dialogue/dialogueHash';
import {evaluateLogicDefinition, isLogicValid} from 'app/content/logic';
import {getZone} from 'app/content/zones';
import {missingExitNodeSet, missingNodeSet, missingObjectSet, warnOnce} from 'app/randomizer/warnOnce';
import {getFullZoneLocation} from 'app/utils/getFullZoneLocation';


export function getMappedEntranceData(randomizerState: RandomizerState, zoneKey: string, entrance: EntranceDefinition): EntranceData {
    return randomizerState?.entrances?.entranceAssignments?.[`${zoneKey}:${entrance.id}`] ?? entrance;
}

export function findReachableNodes(randomizerState: RandomizerState, state: GameState, showWarnings = true): NodePath[] {
    const {allNodesById, startingNodes} = randomizerState;
    const nodesSeen: Set<LogicNode> = new Set();
    const nodePaths: NodePath[] = startingNodes.map(node => ({path: [], node}));
    for (let i = 0; i < nodePaths.length; i++) {
        const currentNodePath = nodePaths[i];
        const currentNode = currentNodePath.node;
        if (!currentNode) {
            console.error('Found undefined node');
            return [];
        }
        if (window['debugFindReachableNodes']) {
            //console.log(currentNode.zoneId, currentNode.nodeId);
        }
        // console.log('node: ', currentNode.nodeId);
        const zone = getZone(currentNode.zoneId);
        if (!zone) {
            continue
        }
        const originalStaffValue = state.hero.savedData.activeTools.staff;
        // If the tower staff is not available in this node, temporarily remove it while we process
        // the logic for paths+exits.
        if (currentNode.metadata?.excludesTowerStaff) {
            state.hero.savedData.activeTools.staff &= ~2;
        }
        for (const path of (currentNode.paths || [])) {
            if (path.logic && !isLogicValid(state, path.logic)) {
                continue;
            }
            if (path.doorId) {
                const { object, location } = findDoorById(zone, path.doorId, state);
                if (!canOpenDoor(randomizerState, location, state, object as EntranceDefinition)) {
                    continue;
                }
            }
            const nextNode = allNodesById[path.nodeId];
            if (!nextNode) {
                warnOnce(missingNodeSet, path.nodeId, 'Missing node: ');
                continue;
            }
            if (nextNode && !nodesSeen.has(nextNode)) {
                nodesSeen.add(nextNode);
                nodePaths.push({
                    path: [...currentNodePath.path, {node: currentNode, path}],
                    node: nextNode,
                });
            }
        }
        for (const exit of (currentNode.exits || [])) {
            if (exit.logic && !isLogicValid(state, exit.logic)) {
                //console.log('Invalid logic', exit);
                continue;
            }
            const { object, location } = findDoorById(zone, exit.objectId, state);
            const exitObject = object as EntranceDefinition;
            // console.log(exit.objectId);
            if (!canOpenDoor(randomizerState, location, state, exitObject)) {
                //console.log('cannot open', exitObject);
                continue;
            }
            //console.log('->', exitObject.targetZone + ':' + exitObject.targetObjectId);
            const {targetZone, targetObjectId} = getMappedEntranceData(randomizerState, currentNode.zoneId, exitObject);
            const nextNode = findNextNodeForExitTarget(randomizerState, currentNode, exit.objectId, targetZone, targetObjectId, state);
            if (!nextNode && showWarnings) {
                warnOnce(missingExitNodeSet,
                    zone.key + '::' + exitObject.id + ' => '
                    + targetZone + '::' + targetObjectId,
                    'Missing node for exit: ');
                continue;
            }
            if (nextNode && !nodesSeen.has(nextNode)) {
                nodesSeen.add(nextNode);
                nodePaths.push({
                    path: [...currentNodePath.path, {node: currentNode, exit}],
                    node: nextNode,
                });
            }
        }
        state.hero.savedData.activeTools.staff = originalStaffValue;
    }
    return nodePaths;
}
window['findReachableNodes'] = findReachableNodes;

export function findNextNodeForExitTarget(
    randomizerState: RandomizerState,
    currentNode: LogicNode,
    exitId: string,
    targetZone: string,
    targetObjectId: string,
    simulatedState?: GameState,
) {
    const {allNodesByZoneKey} = randomizerState;
    const {object} = findDoorOrMarkerById(getZone(targetZone), targetObjectId, simulatedState);
    if (!object) {
        return;
    }
    const exitObject = object as EntranceDefinition;
    const nextNode = allNodesByZoneKey[targetZone].find(node =>
        (node !== currentNode || targetObjectId !== exitId)
        // If isSpiritWorld is defined for both nodes, they must match.
        && (
            node.isSpiritWorld === undefined ||
            currentNode.isSpiritWorld === undefined ||
            node.isSpiritWorld === currentNode.isSpiritWorld ||
            // Teleporters can link material/spirit world together.
            exitObject.type === 'teleporter'
        )
        && node.entranceIds?.includes(targetObjectId)
    );
    // Don't warn if we are simulating, there are lots of reasons
    // a node won't appear when simulating.
    if (!nextNode && !simulatedState) {
        warnOnce(missingExitNodeSet,
            currentNode.zoneId + '::' + exitObject.id + ' => '
            + targetZone + '::' + targetObjectId,
            'Missing node for exit: ');
        return;
    }
    return nextNode;
}

export function findReachableChecksFromStart(randomizerState: RandomizerState, simulatedState: GameState) {
    return findReachableChecks(randomizerState, simulatedState);
}
window['findReachableChecksFromStart'] = findReachableChecksFromStart;

export function findReachableChecks(randomizerState: RandomizerState, simulatedState: GameState, showWarnings = true): LootWithLocation[] {
    const reachableNodes = findReachableNodes(randomizerState, simulatedState, showWarnings);
    return findLootObjects(reachableNodes, simulatedState);
}


export function findDoorOrMarkerById(zone: Zone, id: string, state: GameState = null)  {
    return findObjectById(zone, id, state, ['door', 'keyBlock', 'pitEntrance', 'staffTower', 'helixTop', 'teleporter', 'dreamPod', 'marker', 'spawnMarker']) as {object?: EntranceDefinition|MarkerDefinition, location?: FullZoneLocation};
}

export function findDoorById(zone: Zone, id: string, state: GameState = null)  {
    return findObjectById(zone, id, state, ['door', 'keyBlock', 'pitEntrance', 'staffTower', 'helixTop', 'teleporter', 'dreamPod']) as {object?: EntranceDefinition, location?: FullZoneLocation};
}
export function findLootById(zone: Zone, id: string, state: GameState = null): ObjectLocation  {
    return findObjectById(zone, id, state, ['bigChest', 'chest', 'loot', 'shopItem', 'boss', 'npc']);
}

interface ObjectLocation {
    object?: ObjectDefinition
    location?: FullZoneLocation
    needsCatEyes?: boolean
    needsTrueSight?: boolean
}
const findObjectByIdCache: {[key: string]: ObjectLocation[]} = {};
export function findObjectById(
    zone: Zone,
    id: string,
    state: GameState = null,
    typeFilter?: ObjectType[]
): ObjectLocation {
    const cacheKey = zone.key + ':' + id;
    const cachedResult = findObjectByIdCache[cacheKey];
    if (cachedResult) {
        return findMatchingObject(cachedResult, state, typeFilter);
    }
    const foundObjectLocations: ObjectLocation[] = [];
    for (let floor = 0; floor < zone.floors.length; floor++) {
        for( const areaGrid of [zone.floors[floor].spiritGrid, zone.floors[floor].grid]){
            const isSpiritWorld = areaGrid === zone.floors[floor].spiritGrid;
            for (let y = 0; y < areaGrid.length; y++) {
                for (let x = 0; x < areaGrid[y].length; x++) {
                    // All objects in 100% dark areas are considered out of logic unless you can see in the dark.
                    // TODO: this should have AreaSection granularity.
                    const needsCatEyes = zone.dark >= 100 || areaGrid[y][x]?.dark >= 100;
                    for (const object of (areaGrid[y][x]?.objects || [])) {
                        if (object.id === id) {
                            const location = getFullZoneLocation({
                                zoneKey: zone.key,
                                floor,
                                areaGridCoords: {x, y},
                                isSpiritWorld,
                                x: object.x,
                                y: object.y,
                                d: null,
                            });
                            foundObjectLocations.push({
                                object,
                                location,
                                needsCatEyes,
                                needsTrueSight: object.isInvisible,
                            });
                        }
                    }
                }
            }
        }
    }
    if (!foundObjectLocations.length) {
        warnOnce(missingObjectSet, zone.key + '::' + id, 'Missing object: ');
    }
    //debugger;
    findObjectByIdCache[cacheKey] = foundObjectLocations;
    return findMatchingObject(foundObjectLocations, state, typeFilter);
}
function findMatchingObject(
    objectLocations: ObjectLocation[],
    state: GameState = null,
    typeFilter?: ObjectType[]
): ObjectLocation {
    // If no state is provided all results are assumed to be in logic.
    if (!state && !typeFilter) {
        return objectLocations[0];
    }
    const canSeeInDark = state && (state.hero.savedData.passiveTools.catEyes || state.hero.savedData.passiveTools.trueSight);
    // If state is provided, return the first object that is valid for the given state.
    for (const objectLocation of objectLocations) {
        if (typeFilter && !typeFilter.includes(objectLocation.object.type)) {
            continue;
        }
        if (state && !state.hero.savedData.passiveTools.trueSight && objectLocation.needsTrueSight) {
            continue;
        }
        if (state && !canSeeInDark && objectLocation.needsCatEyes) {
            continue;
        }
        if (state && !canObjectBeInLogic(state, objectLocation.object)) {
            continue;
        }
        return objectLocation;
    }
    return {};
}

export function findAllTargetObjects(lootWithLocation: LootWithLocation): (LootObjectDefinition | BossObjectDefinition)[] {
    const results: (LootObjectDefinition | BossObjectDefinition)[] = [];
    const zone = getZone(lootWithLocation.location.zoneKey);
    const floor = lootWithLocation.location.floor;
    for( const areaGrid of [zone.floors[floor].spiritGrid, zone.floors[floor].grid]){
        const areaDefinition = areaGrid[lootWithLocation.location.areaGridCoords.y][lootWithLocation.location.areaGridCoords.x];
        for (const object of (areaDefinition?.objects || [])) {
            if (object.id === lootWithLocation.lootObject.id) {
                results.push(object as (LootObjectDefinition | BossObjectDefinition));
            }
        }
    }
    return results;
}


export function findLootObjects(nodePaths: NodePath[], state: GameState = null): LootWithLocation[] {
    const lootObjects: LootWithLocation[] = [];
    for (const nodePath of nodePaths) {
        const node = nodePath.node;
        const zone = getZone(node.zoneId);
        if (!zone) {
            continue;
        }
        const originalStaffValue = state?.hero.savedData.activeTools.staff;
        if (originalStaffValue) {
            // If the tower staff is not available in this node, temporarily remove it while we process
            // the logic for these flags.
            if (node.metadata?.excludesTowerStaff) {
                state.hero.savedData.activeTools.staff &= ~2;
            }
        }
        for (const check of (node.checks || [])) {
            // If state is passed in, only include this loot check if it is in logic.
            if (state && check.logic && !isLogicValid(state, check.logic)) {
                continue;
            }
            const {object, location} = findLootById(zone, check.objectId, state);
            if (!object) {
                continue;
            }
            if (object.type === 'bigChest') {
                if (state && !state.savedState.dungeonInventories[location.logicalZoneKey]?.bigKey) {
                    continue;
                }
            }
            lootObjects.push({
                lootObject: object as AnyLootDefinition,
                location,
                path: nodePath,
            });
        }
        for (const npc of (node.npcs || [])) {
            // If state is passed in, only include this loot check if it is in logic.
            if (state && npc.logic && !isLogicValid(state, npc.logic)) {
                continue;
            }
            const {object, location} = findObjectById(zone, npc.loot.id, state, ['npc']);
            if (!object) {
                continue;
            }
            lootObjects.push({
                lootObject: npc.loot,
                location,
                progressFlags: npc.progressFlags,
                path: nodePath,
            });
        }
        for (const npc of (node.complexNpcs || [])) {
            // If state is passed in, only include this loot check if it is in logic.
            if (state && npc.logic && !isLogicValid(state, npc.logic)) {
                continue;
            }
            const {dialogueKey, optionKey} = npc;
            const script = dialogueHash[dialogueKey].mappedOptions[optionKey];
            if (typeof script !== 'string') {
                console.error('Cannot place items in dialogue methods', {dialogueKey, optionKey});
                debugger;
                continue;
            }
            // If this string isn't present than no item was assigned to this dialogue option.
            if (script.indexOf('{item:') < 0 ) {
                continue;
            }
            const lootToken = script.split('{item:')[1].split('}')[0];
            const [lootType, amountOrLevel] = lootToken.split('=');
            lootObjects.push({
                lootObject: {
                    id: `${dialogueKey}:${optionKey}`,
                    type: 'dialogueLoot',
                    lootType: lootType as LootType,
                    lootAmount: parseInt(amountOrLevel, 10) || 0
                },
                dialogueKey,
                optionKey,
                path: nodePath,
            });
        }
        if (originalStaffValue) {
            state.hero.savedData.activeTools.staff = originalStaffValue;
        }
    }
    return lootObjects;
}

// Similar to evaluateLogicDefinition, but returns true if the object can be in logic from the current
// state, even if it is not currently in logic. For example, Staff Tower doors are out of logic while
// holding the Tower Staff, but the Tower Staff can be deposited to get access to them.
// This does have one issue which is that the logic is not smart enough to know that if an entrance is
// blocked by placing the Tower Staff, the Tower Staff will not be available to use in those areas.
// The staff tower logic isn't actually necessary because the randomizer never simulates actually picking
// up the tower staff, just whether it could pick it up.
export function canObjectBeInLogic(state: GameState, object: ObjectDefinition): boolean {
    // The default location for the Staff Tower is always in logic.
    /*if (object.logicKey === 'desertTower') {
        return true;
    }
    // Other staff tower locations are in logic once the player obtains the Tower Staff.
    if (object.logicKey === 'mountainTower' || object.logicKey === 'mountainTower') {
        return isLogicValid(state, canHasTowerStaff);
    }*/
    return evaluateLogicDefinition(state, object);
}

export function canOpenDoor(randomizerState: RandomizerState, location: FullZoneLocation, state: GameState, door: EntranceDefinition): boolean {
    // Return false if door does not exist or is currently out of logic.
    if (!door || !canObjectBeInLogic(state, door)) {
        return false;
    }
    if (door.type === 'teleporter') {
        return isTeleporterOpen(state, location, door);
    }
    const {status} = getMappedEntranceData(randomizerState, location.zoneKey, door);
    // Only pass through
    if (status === 'locked') {
        const dungeonInventory = state.savedState.dungeonInventories[location.logicalZoneKey];
        const requiredKeys = randomizerState.items.requiredKeysMap[door.id];
        if (!requiredKeys) {
            console.error('Object missing required keys', door, randomizerState.items.requiredKeysMap);
            throw new Error('Missing required keys for lock');
        }
        return dungeonInventory?.totalSmallKeys >= requiredKeys;
    }
    if (status === 'bigKeyLocked') {
        const dungeonInventory = state.savedState.dungeonInventories[location.logicalZoneKey];
        return dungeonInventory?.bigKey;
    }
    if (status === 'cracked') {
        return state.hero.savedData.activeTools.clone > 0;
    }
    return true;
}

// TODO: can this be combined with findObjectById
export function findObjectLocation(
    state: GameState,
    zoneKey: string,
    targetObjectIds: string | string[],
    checkSpiritWorldFirst = false,
    skipObject: ObjectDefinition = null,
    showErrorIfMissing = false
): ZoneLocation & {object: ObjectDefinition} | false {
    const zone = getZone(zoneKey);
    const objectIds = Array.isArray(targetObjectIds) ? targetObjectIds : [targetObjectIds];
    if (!zone) {
        debugger;
        console.error('Missing zone', zoneKey);
        return false;
    }
    for (let worldIndex = 0; worldIndex < 2; worldIndex++) {
        for (let floor = 0; floor < zone.floors.length; floor++) {
            // Search the corresponding spirit/material world before checking in the alternate world.
            const areaGrids = checkSpiritWorldFirst
                ? [zone.floors[floor].spiritGrid, zone.floors[floor].grid]
                : [zone.floors[floor].grid, zone.floors[floor].spiritGrid];
            const areaGrid = areaGrids[worldIndex];
            const inSpiritWorld = areaGrid === zone.floors[floor].spiritGrid;
            for (let y = 0; y < areaGrid.length; y++) {
                for (let x = 0; x < areaGrid[y].length; x++) {
                    for (const object of (areaGrid[y][x]?.objects || [])) {
                        if (objectIds.includes(object.id) && object !== skipObject) {
                            if (!evaluateLogicDefinition(state, object)) {
                                continue;
                            }
                            return {
                                zoneKey,
                                floor,
                                areaGridCoords: {x, y},
                                x: object.x,
                                y: object.y,
                                d: state.hero.d,
                                isSpiritWorld: inSpiritWorld,
                                object,
                            };
                        }
                    }
                }
            }
        }
    }
    if (showErrorIfMissing) {
        console.error('Could not find', targetObjectIds, 'in', zoneKey);
    }
    return false;
}

export function isTeleporterOpen(state: GameState, location: ZoneLocation, definition: EntranceDefinition) {
    const {targetZone, targetObjectId} = getMappedEntranceData(state.randomizerState, location.zoneKey, definition);
    if (targetZone && targetObjectId) {
        // Zone -> Zone teleportrs can only be used with the teleportation ability.
        if (!state.hero.savedData.passiveTools.teleportation) {
            return false;
        }
        const targetObject = findObjectLocation(state, targetZone, targetObjectId, location.isSpiritWorld, definition);
        if (!targetObject) {
            return false;
        }
        // If this portal targets a dream pod, it is only open if the pod is open.
        if (targetObject.object.type === 'dreamPod') {
            // Dream pods default closed.
            return evaluateLogicDefinition(state, targetObject.object.openLogic, false);
        }
    }
    // Teleporters default open.
    return evaluateLogicDefinition(state, definition.openLogic, true);
}
