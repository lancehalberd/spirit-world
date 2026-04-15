import {evaluateLogicDefinition, isLogicValid} from 'app/content/logic';
import {getLootName} from 'app/content/loot';
import {lootEffects} from 'app/content/lootEffects';
import {getZone} from 'app/content/zones';
import {
    findDoorById,
    findLootObjects,
} from 'app/randomizer/find';
import {getAllNodes} from 'app/randomizer/allNodes';
import {missingExitNodeSet, missingNodeSet, warnOnce} from 'app/randomizer/warnOnce';
import {applySavedState} from 'app/scenes/fileSelect/setSaveFileToState';
import {getDefaultState} from 'app/state';

// Calculates all reachable nodes from the starting set, ignoring key requirements.
// This is used to calculate which nodes should be used before the randomizer, and is primarily
// intended to limit the nodes down to those that can be reached when the isDemoMode flag is set
// for the demo version of the randomizer, which stops the game when you meet Saru at the entrance
// to the Helix.
export function getAllReachableContent(state: GameState, startingNodes: LogicNode[]): {
    allNodes: LogicNode[]
    allLootObjects: LootWithLocation[]
    allEntrances: DoorLocation[]
} {
    const allNodes = getAllNodes(state);
    const allNodesByZoneKey: NodesByZoneKey = {};
    const allNodesById: NodesById = {};
    for (const node of allNodes) {
        allNodesByZoneKey[node.zoneId] = allNodesByZoneKey[node.zoneId] ?? [];
        allNodesByZoneKey[node.zoneId].push(node);
        allNodesById[node.nodeId] = node;
    }
    const allLootObjects: LootWithLocation[] = [];
    const allEntrances: DoorLocation[] = [];
    let simulatedState = getDefaultState();
    applySavedState(simulatedState, simulatedState.savedState);
    const nodes = [...startingNodes];
    let  counter = 0, changed = false;
    do {
        changed = false;
        //console.log('previousCount', nodes.length);
        if (counter++ > 100) {
            console.error('infinite loop');
            debugger;
            return null;
        }
        changed = expandNodes(simulatedState, nodes, allNodesById, allNodesByZoneKey, allEntrances) || changed;
        changed = collectAllLootFromNodesInLogic(simulatedState, [...nodes], allLootObjects) || changed;
        changed = setAllFlagsInNodes(simulatedState, nodes) || changed;
    } while (changed);
    //console.log("No new nodes, stopping");
    if (!state.isDemoMode) {
        // Outside demo mode, we expect every node and check to be reachable.
        for (const node of allNodes) {
            if (!nodes.includes(node)) {
                console.log('Missing node', node);
            }
            // These checks are too noisy in general, but they can be useful when missing entrances/exits
            // are breaking the entrance randomizer.
            /*for (const entranceId of node.entranceIds ?? []) {
                if (!node.exits?.find(exit => exit.objectId === entranceId)) {
                    console.warn('Possible missing exit', entranceId, node);
                }
            }
            for (const exit of node.exits ?? []) {
                if (!node.entranceIds?.find(entranceId => exit.objectId === entranceId)) {
                    console.warn('Possible missing entranceId', exit, node);
                }
            }*/
        }
        for (const loot of findLootObjects(allNodes)) {
            if (!simulatedState.savedState.objectFlags[loot.lootObject.id]) {
                console.log('Missing loot', loot);
            }
        }
    }
    //console.log(Object.keys(simulatedState.savedState.objectFlags));
    return {allNodes: nodes, allLootObjects, allEntrances};
}


export function expandNodes(
    simulatedState: GameState,
    nodes: LogicNode[],
    allNodesById: NodesById,
    allNodesByZoneKey: NodesByZoneKey,
    allEntrances: DoorLocation[],
): boolean {
    let changed = false;
    for (let i = 0; i < nodes.length; i++) {
        const currentNode = nodes[i];
        if (!currentNode) {
            console.error('Found undefined node');
            break;
        }
        if (window['debugFindReachableNodes']) {
            console.log(currentNode.zoneId, currentNode.nodeId);
        }
        // console.log('node: ', currentNode.nodeId);
        const zone = getZone(currentNode.zoneId);
        if (!zone) {
            continue
        }
        for (const path of (currentNode.paths || [])) {
            if (path.logic && !isLogicValid(simulatedState, path.logic)) {
                continue;
            }
            if (path.doorId) {
                const { object, location } = findDoorById(zone, path.doorId, simulatedState);
                if (!canUseDoor(simulatedState, location, object as EntranceDefinition)) {
                    continue;
                }
            }
            const nextNode = allNodesById[path.nodeId];
            if (!nextNode) {
                warnOnce(missingNodeSet, path.nodeId, 'Missing node: ');
                continue;
            }
            if (!nodes.includes(nextNode)) {
                nodes.push(nextNode);
                changed = true;
                //console.log("Adding path node", path, nextNode);
            }
        }
        for (const exit of (currentNode.exits || [])) {
            if (exit.logic && !isLogicValid(simulatedState, exit.logic)) {
                //console.log('Invalid logic', exit);
                continue;
            }
            const { object, location } = findDoorById(zone, exit.objectId, simulatedState);
            const exitObject = object as EntranceDefinition;
            // console.log(exit.objectId);
            if (!canUseDoor(simulatedState, location, exitObject)) {
                //console.log('cannot open', exitObject);
                continue;
            }
            //console.log('->', exitObject.targetZone + ':' + exitObject.targetObjectId);
            const nextNode = allNodesByZoneKey[exitObject.targetZone].find(node =>
                (node !== currentNode || exitObject.targetObjectId !== exit.objectId)
                // If isSpiritWorld is defined for both nodes, they must match.
                && (
                    node.isSpiritWorld === undefined ||
                    currentNode.isSpiritWorld === undefined ||
                    node.isSpiritWorld === currentNode.isSpiritWorld ||
                    // Teleporters can link material/spirit world together.
                    exitObject.type === 'teleporter'
                )
                && node.zoneId === exitObject.targetZone
                && node.entranceIds?.includes(exitObject.targetObjectId)
            );
            if (!nextNode) {
                warnOnce(missingExitNodeSet,
                    zone.key + '::' + exitObject.id + ' => '
                    + exitObject.targetZone + '::' + exitObject.targetObjectId,
                    'Missing node for exit: ');
                continue;
            }
            addEntranceIfNew(allEntrances, {location, definition: exitObject});
            if (!nodes.includes(nextNode)) {
                nodes.push(nextNode);
                changed = true;
                // console.log("Adding door node", exit, nextNode);
            }
        }
    }
    return changed;
}

function addEntranceIfNew(allEntrances: DoorLocation[], newDoorLocation: DoorLocation) {
    const existingDoor = allEntrances.find(doorLocation =>
        doorLocation.definition.id === newDoorLocation.definition.id && newDoorLocation.location.zoneKey === doorLocation.location.zoneKey
    );
    if (!existingDoor) {
        allEntrances.push(newDoorLocation);
    }
}

function collectAllLootFromNodesInLogic(simulatedState: GameState, nodes: LogicNode[], lootObjects: LootWithLocation[]): boolean {
    let foundNewLoot = false;
    const reachableChecks: LootWithLocation[] = findLootObjects(nodes, simulatedState);
    // console.log(debugLocations(reachableChecks));
    for (const check of reachableChecks) {
        // Ignore checks that have already been made.
        if (simulatedState.savedState.objectFlags[check.lootObject.id]) {
            continue;
        }
        foundNewLoot = true;
        lootObjects.push(check);
        if (check.lootObject.lootType !== 'empty') {
            if (window.debugGetAllReachableContent) {
                console.log("Obtained loot", getLootName(simulatedState, check.lootObject), check);
            }
            // We need to set the current location to the loot location so that dungeon items are applied to the correct state.
            if (check.location) {
                simulatedState.location = check.location;
            }
            const onPickup = lootEffects[check.lootObject.lootType] || lootEffects.unknown;
            // Loot is always progressive in the randomizer, so set lootLevel to 0.
            // onPickup(stateCopy, lootData);
            try {
                onPickup(simulatedState, {...check.lootObject, lootLevel: 0}, true);
            } catch (e) {
                debugger;
            }
            if (!simulatedState.hero.savedData.passiveTools.catEyes && simulatedState.hero.savedData.maxLife > 4) {
                simulatedState.hero.savedData.passiveTools.catEyes = 1;
            }
        }
        // Set progress flags related to the check even if it has not been assigned, for example,
        // Talking to the Vanara Commander should still release elemental beasts even if a check is
        // not assigned to him yet.
        simulatedState.savedState.objectFlags[check.lootObject.id] = true;
        for (const flag of (check.progressFlags || [])) {
            simulatedState.savedState.objectFlags[flag] = true;
        }
    }
    return foundNewLoot;
}

export function setAllFlagsInNodes(simulatedState: GameState, nodes: LogicNode[]) {
    let changed, setFlag = false;
    do {
        changed = false;
        for (const node of nodes) {
            for (const flag of (node.flags || [])) {
                if (simulatedState.savedState.objectFlags[flag.flag]) {
                    continue;
                }
                if (flag.logic && !isLogicValid(simulatedState, flag.logic)) {
                    //console.log('Invalid logic', flag);
                    continue;
                }
                if (flag.doorId) {
                    const zone = getZone(node.zoneId);
                    const { object, location } = findDoorById(zone, flag.doorId, simulatedState);
                    if (!canUseDoor(simulatedState, location, object as EntranceDefinition)) {
                        continue;
                    }
                }
                //console.log('    Setting flag', flag.flag);
                simulatedState.savedState.objectFlags[flag.flag] = true;
                changed = true;
                setFlag = true;
            }
        }
    } while (changed);
    return setFlag;
}

function canUseDoor(simulatedState: GameState, location: FullZoneLocation, door: EntranceDefinition): boolean {
    // Return false if door does not exist or is currently out of logic.
    if (!door || !evaluateLogicDefinition(simulatedState, door)) {
        return false;
    }
    if (door.type === 'teleporter') {
        return simulatedState.hero.savedData.passiveTools.spiritSight > 0 || simulatedState.hero.savedData.passiveTools.trueSight > 0;
    }
    // For this method, we assume that if a player can reach a locked door, the key for the locked door will
    // eventually be in logic.
    if (door.status === 'locked' || door.status === 'bigKeyLocked') {
        return true;
    }
    if (door.status === 'cracked') {
        return simulatedState.hero.savedData.activeTools.clone > 0;
    }
    return true;
}
window.canUseDoor = canUseDoor;
