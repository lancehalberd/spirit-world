import {getZoneEntranceMap} from 'app/content/dialogue/nimbusCloud';
import {findNextNodeForExitTarget} from 'app/randomizer/find';
import SRandom from 'app/utils/SRandom'
import {typedKeys} from 'app/utils/types';

const ignoredZones = new Set([
    // These zones are part of the 'Holy Sanctum' and should not be randomized.
    'fireSanctum', 'iceSanctum', 'lightningSanctum', 'holySanctumBack',
    // The void is part of the 'Tree' zone and should not be randomized.
    'void',
]);

// This solves the same problem as ignoredZones except for
// zones that are connected to outside zones.
const disabledDoors = new Set([
    // Currently we do not randomize entrances between "outside" areas.
    'overworld:forestNorthEntrance',
    'forest:forestNorthEntrance',
    'overworld:forestTowerEntrance',
    'forest:forestTowerEntrance',
    'overworld:forestEastEntrance',
    'forest:forestEastEntrance',
    'overworld:forestTowerEntranceSpirit',
    'forest:forestTowerEntranceSpirit',
    // treeVillage and forestTemple are considered a single zone for randomizer purposes.
    'treeVillage:elderDownstairs',
    'forestTemple:elderUpstairs',
    'treeVillage:vanaraStorageStairs',
    'forestTemple:vanaraStorageStairs',
]);

// These doors are not reliably useable and are not suitable as parts of critical paths for
// guaranteeing connectivity for required nodes.
const unreliableDoors = new Set([
    // These entrances are unlocked by interior switches
    'overworld:staffTowerSpiritEntrance',
    'sky:staffTowerSkyEntrance',
    'overworld:warTempleKeyDoor',
    'overworld:tombBackDoor',
]);

export function randomizeEntrances(randomizerState: RandomizerState) {
    const {allEntrances, allNodesById} = randomizerState;
    randomizerState.entrances = {
        entranceAssignments: {},
        random: SRandom.seed(randomizerState.entranceSeed),
        fixedNimbusCloudZones: new Set<string>(),
        targetIdMap: {},
    };
    const {entranceAssignments, random, targetIdMap} = randomizerState.entrances;
    // This will be the set of all entrance ids that are targeted by entrances available in the seed.
    // If an entrance ID appears on a LogicNode but is not in this set, it means that the entrance is not reachable
    // for the current game settings. For example, the entrance that leads to the Grand Temple is on the holy city
    // overworld node, but it is not reachable in the demo because the player can never reach the entrance inside
    // the Grand Temple that connects to it, so this entrance should be ignored by the entrance randomizer.
    const allAssignableEntranceIds = new Set<string>();
    const entrancesById: {[key in string]: DoorLocation} = {};
    // Assign all entrances that are considered to be connecting areas within the same zone so that they will not be
    // randomized. We can remove this step if we want to support door randomizers that can scramble the internal
    // contents of dungeons, although we would want to handle the implications for key logic and setting LogicalZone
    // that would be caused by this
    const entranceIds = new Set<string>();
    const exitIds = new Set<string>();
    for (const doorLocation of allEntrances) {
        entrancesById[doorLocation.key] = doorLocation;
        const definition = doorLocation.definition;
        if (!isEntranceDefinition(definition)) {
            continue;
        }
        targetIdMap[doorLocation.originalTargetKey] = targetIdMap[doorLocation.originalTargetKey] ?? [];
        targetIdMap[doorLocation.originalTargetKey].push(doorLocation);
        if (disabledDoors.has(doorLocation.key)
            || ignoredZones.has(doorLocation.location.zoneKey)
            || ignoredZones.has(definition.targetZone)
            || doorLocation.location.zoneKey === definition.targetZone
        ) {
            entranceAssignments[doorLocation.key] = {
                targetZone: definition.targetZone,
                targetObjectId: definition.targetObjectId,
            };
            // Go ahead and link the target back so that target pit markers by invalid entrances
            // are also marked as preassigned as they otherwise won't get processed here.
            entranceAssignments[doorLocation.originalTargetKey] = {
                targetZone: doorLocation.location.zoneKey,
                targetObjectId: doorLocation.definition.id,
            };
        } else {
            // If the door is not ignored, then its target is considered assignable. For example a pit within a zone will be
            // ignored and assign in the previous block, but a pit from the overworld into a zone will be assignable and
            // add the target id here.
            allAssignableEntranceIds.add(doorLocation.originalTargetKey);
            // Pause if we notice any assumptions are wrong.
            if (doorLocation.isInterior) {
                entranceIds.add(doorLocation.originalTargetKey);
                exitIds.add(doorLocation.key);
                if (entranceIds.has(doorLocation.key) || exitIds.has(doorLocation.originalTargetKey)) {
                    debugger;
                }
            } else {
                entranceIds.add(doorLocation.key);
                exitIds.add(doorLocation.originalTargetKey);
                if (entranceIds.has(doorLocation.originalTargetKey) || exitIds.has(doorLocation.key)) {
                    debugger;
                }
            }
        }
    }
    if (entranceIds.size !== exitIds.size) {
        console.error('Entrances + Exits are not balanced', [...entranceIds], [...exitIds]);
        debugger;
    }
    // We expand the set of connected nodes until it contains all nodes required by the randomizer settings.
    for (const currentNode of randomizerState.allNodes) {
        currentNode.metadata = {
            // Set of entrance ids that this node can be reached from
            assignableEntranceKeys: new Set(),
            nextNodes: new Set(),
        };
        // Initialize assignableEntranceKeys to be all entranceIds that are included in the list of all entrances (which means they can be used under the current settings).
        for (const entranceId of (currentNode.entranceIds ?? [])) {
            const entranceKey = `${currentNode.zoneId}:${entranceId}`;
            if (allAssignableEntranceIds.has(entranceKey) && !entranceAssignments[entranceKey] && !unreliableDoors.has(entranceKey)) {
                currentNode.metadata.assignableEntranceKeys.add(entranceKey);
            }
        }
        for (const path of (currentNode.paths || [])) {
            // A path may be unavailable if the item necessary to traverse it
            // isn't present in the current game mode. For example underwater
            // paths are typically not available without iron boots.
            if (!path.isAvailable) {
                continue;
            }
            const nextNode = allNodesById[path.nodeId];
            if (nextNode) {
                currentNode.metadata.nextNodes.add(nextNode);
            }
        }
        for (const exit of (currentNode.exits || [])) {
            // Similar to paths above, some exits may never be available in the current game mode.
            if (!exit.isAvailable) {
                continue;
            }
            const exitKey = currentNode.zoneId + ':' + exit.objectId;
            if (!entranceAssignments[exitKey]) {
                continue;
            }
            const {targetZone, targetObjectId} = entranceAssignments[exitKey];
            const nextNode = findNextNodeForExitTarget(randomizerState, currentNode, exit.objectId, targetZone, targetObjectId);
            if (nextNode) {
                currentNode.metadata.nextNodes.add(nextNode);
            }
        }
    }
    const connectedNodes = initializeConnectedNodes(randomizerState);
    /*console.log("Before propagation");
    for (const node of randomizerState.allNodes) {
        console.log(node.nodeId, [...node.metadata.assignableEntranceKeys]);
    }*/
    propagateAssignableEntranceKeys(randomizerState, randomizerState.allNodes);
    //console.log("After propagation");
    for (const node of randomizerState.allNodes) {
        if (!node.metadata.assignableEntranceKeys.size && !connectedNodes.has(node)) {
            console.error('Required node started with no assignable entrance keys', node);
            debugger;
            throw new Error('Required node started with no assignable entrance keys');
        }
        //console.log(node.nodeId, [...node.metadata.assignableEntranceKeys]);
    }
    // This could eventually be configured to be a smaller set of nodes, such as only the set of nodes
    // containing checks, or only the set of nodes required by the race goal, such as nods for certain bosses.
    const allRequiredNodes = [...randomizerState.allNodes];
    // Repeat this process until all required nodes are connected.
    let requiredNodesLeft = allRequiredNodes.filter(node => !connectedNodes.has(node));
    while (requiredNodesLeft.length) {
        // Prioritize any required nodes with limited entrances remaining
        let candidates = requiredNodesLeft.filter(node => node.metadata.assignableEntranceKeys.size < 2);
        if (!candidates.length) {
            candidates = requiredNodesLeft;
        }
        const nodeToAssign = random.mutate().element(candidates);
        // console.log('Connecting node ' + nodeToAssign.nodeId);
        if (!nodeToAssign.metadata.assignableEntranceKeys.size) {
            console.error('Required node has no assignable entrance keys left', nodeToAssign);
            debugger;
            throw new Error('Required node has no assignable entrance keys left');
        }
        const entranceKey = random.mutate().element(nodeToAssign.metadata.assignableEntranceKeys);
        const entrance = entrancesById[entranceKey];
        // Remove this key from all sets of assignableEntranceKeys before proceeding.
        for (const node of randomizerState.allNodes) {
            node.metadata.assignableEntranceKeys.delete(entrance.key);
        }
        const matchingEntrances = getUnassignedMatchingEntrances(randomizerState, entrance);
        const target = random.mutate().element(matchingEntrances.filter(match => {
            // Unreliable doors may not be assigned for required connections.
            if (unreliableDoors.has(match.key)) {
                return false;
            }
            // A matching entrance is only valid if it leads to a node with another assignable entrance or
            // a node that is already connected to the start.
            return connectedNodes.has(match.node)
                // Any node with multiple assignable entrances is valid, since it will have at least one left after the assignment.
                || match.node.metadata.assignableEntranceKeys.size > 1
                // A node with exactly one entrance left is only valid if that entrance is not the one we are planning to assign.
                || (match.node.metadata.assignableEntranceKeys.size === 1 && !match.node.metadata.assignableEntranceKeys.has(match.key));
        }));
        if (!target) {
            // TODO: debug why we end up here.
            console.error('Found no matching target for entrance', nodeToAssign, entrance);
            debugger;
            throw new Error('Found no matching target for entrance');
        }
        // Remove the target key from all sets of assignableEntranceKeys since it is about to be assigned.
        for (const node of randomizerState.allNodes) {
            node.metadata.assignableEntranceKeys.delete(target.key);
        }
        assignEntranceExitPair(randomizerState, entrance, target);
        // The entrances that can reach the target node can now be propagated to all nodes that are reachable
        // from the entrance node.
        target.node.metadata.nextNodes.add(entrance.node);
        propagateAssignableEntranceKeys(randomizerState, [target.node]);
        if (connectedNodes.has(target.node)) {
            propagateConnectedNodes(connectedNodes, [target.node]);
        }
        // Debug code, catch early if we leave a disconnected node with no entrance.
        for (const node of randomizerState.allNodes) {
            if (!node.metadata.assignableEntranceKeys.size && !connectedNodes.has(node)) {
                console.error('Removed last assignable entrance key from unconnected node');
                debugger;
            }
        }
        // Repeat until there are no disconnected required nodes.
        requiredNodesLeft = allRequiredNodes.filter(node => !connectedNodes.has(node));
    }
    // Once all requirede nodes are connected, iterate over all remaining entrances and assign them a random matching entrance.
    const shuffledEntrances = random.mutate().shuffle(randomizerState.allEntrances);
    for (const entrance of shuffledEntrances) {
        if (entranceAssignments[entrance.key]) {
            continue;
        }
        if (!isEntranceDefinition(entrance.definition)) {
            // This is expected as long as there are still pit entrances remaining in the list to assign to this.
            // console.error('unassigned marker', entrance);
            continue;
        }
        const target = random.mutate().element(getUnassignedMatchingEntrances(randomizerState, entrance));
        if (!target) {
            console.error('No matching target found for entrance', entrance);
            debugger;
            throw new Error('No matching target found for entrance');
        }
        assignEntranceExitPair(randomizerState, entrance, target);
    }
    for (const entrance of shuffledEntrances) {
        if (!entranceAssignments[entrance.key]) {
            console.warn(entrance.key + ' was never assigned.');
        }
    }
}
export function getUnassignedMatchingEntrances(randomizerState: RandomizerState, source: DoorLocation): DoorLocation[] {
    const matchingEntrances: DoorLocation[] = [];
    const sourceIsTeleporter = source.definition.type === 'teleporter' || source.definition.type === 'dreamPod';
    for (const target of randomizerState.allEntrances) {
        if (randomizerState.entrances.entranceAssignments[target.key]) {
            continue;
        }
        if ((source.definition.type === 'pitEntrance' && target.definition.type !== 'marker' && target.definition.type !== 'spawnMarker')
            || ((source.definition.type === 'marker' || source.definition.type === 'spawnMarker')  && target.definition.type !== 'pitEntrance')
            || (target.definition.type === 'pitEntrance' && source.definition.type !== 'marker' && source.definition.type !== 'spawnMarker')
            || ((target.definition.type === 'marker' || target.definition.type === 'spawnMarker') && source.definition.type !== 'pitEntrance')
        ) {
            continue;
        }
        if (source.definition.type !== 'pitEntrance' && target.definition.type !== 'pitEntrance' && source.isUnderWater !== target.isUnderWater) {
            continue;
        }
        if (source.isInterior === target.isInterior) {
            continue;
        }
        // Teleporters and dream pods should be mapped together.
        const targetIsTelporter = target.definition.type === 'teleporter' || target.definition.type === 'dreamPod';
        if (sourceIsTeleporter !== targetIsTelporter) {
            continue;
        }
        // Only teleporters are allowed to link between worlds. This is necessary to allow if we want to include the entrance
        // to waterfall tower in the pool, since we could have an odd number of teleporters in each world with it included.
        if (!sourceIsTeleporter && source.location.isSpiritWorld !== target.location.isSpiritWorld) {
            continue;
        }
        // Optionally we could connect cracked entrances+exits together.
        matchingEntrances.push(target);
    }
    if (!matchingEntrances.length) {
        // These sets should mirror the logic in the for loop above to help determine at which point different options were filtered out.
        const assignableEntrances = randomizerState.allEntrances.filter(target => !randomizerState.entrances.entranceAssignments[target.key]);
        const matchingWater = assignableEntrances.filter(
            target => source.definition.type === 'pitEntrance' || target.definition.type === 'pitEntrance' || source.isUnderWater === target.isUnderWater
        );
        const matchingPitMarker = assignableEntrances.filter(target =>
            (source.definition.type !== 'pitEntrance' || target.definition.type === 'marker' || target.definition.type === 'spawnMarker')
            && ((source.definition.type !== 'marker' && source.definition.type !== 'spawnMarker') || target.definition.type === 'pitEntrance')
            && (target.definition.type !== 'pitEntrance' || source.definition.type === 'marker' || source.definition.type === 'spawnMarker')
            && ((target.definition.type !== 'marker' && target.definition.type !== 'spawnMarker') || source.definition.type === 'pitEntrance'));
        const matchingEntranceExit = assignableEntrances.filter(target => source.isInterior !== target.isInterior);
        const matchesTeleporter = assignableEntrances.filter(target => sourceIsTeleporter === (target.definition.type === 'teleporter' || target.definition.type === 'dreamPod'));
        const matchesWorld = assignableEntrances.filter(target => sourceIsTeleporter || source.location.isSpiritWorld === target.location.isSpiritWorld);
        // TODO: debug why we end up here.
        console.error('Found no matching target for entrance', source, matchingWater, matchingPitMarker, matchingEntranceExit, matchesTeleporter, matchesWorld);
        debugger;
        throw new Error('Found no matching target for entrance');
    }
    return matchingEntrances;
}

// Initialize and return a set of nodes connected to the start based on the starting nodes defined on the randomizer state
// and the metadata on each node indicating which nodes are currently reachable.
export function initializeConnectedNodes(randomizerState: RandomizerState): Set<LogicNode> {
    const connectedNodes = new Set(randomizerState.startingNodes);
    propagateConnectedNodes(connectedNodes, [...connectedNodes]);
    return connectedNodes;
}
export function propagateConnectedNodes(connectedNodes: Set<LogicNode>, nodes: LogicNode[]) {
    const queue = [...nodes];
    while (queue.length) {
        const currentNode = queue.shift();
        if (!connectedNodes.has(currentNode)) {
            console.error('Tried to propagate non-connected node', currentNode, connectedNodes);
            throw new Error('Tried to propagate non-connected node');
        }
        for (const nextNode of [...currentNode.metadata.nextNodes]) {
            if (!connectedNodes.has(nextNode)) {
                connectedNodes.add(nextNode);
                queue.push(nextNode);
            }
        }
    }
}
export function propagateAssignableEntranceKeys(randomizerState: RandomizerState, nodes: LogicNode[]) {
    const queue = [...nodes];
    while (queue.length) {
        const currentNode = queue.shift();
        const assignableEntranceKeys = [...currentNode.metadata.assignableEntranceKeys];
        for (const nextNode of [...currentNode.metadata.nextNodes]) {
            const combinedSet = new Set([...nextNode.metadata.assignableEntranceKeys, ...assignableEntranceKeys]);
            if (combinedSet.size > nextNode.metadata.assignableEntranceKeys.size) {
                nextNode.metadata.assignableEntranceKeys = combinedSet;
                queue.push(nextNode);
            }
        }
    }
}

function isEntranceDefinition(definition: EntranceDefinition | MarkerDefinition): definition is EntranceDefinition {
    return definition.type !== 'marker' && definition.type !== 'spawnMarker'
}

function assignEntranceExitPair(randomizerState: RandomizerState, entranceA: DoorLocation, entranceB: DoorLocation) {
    const {
        entranceAssignments,
        fixedNimbusCloudZones,
        targetIdMap,
    } = randomizerState.entrances;
    const interiorEntrance = entranceA.isInterior ? entranceA : entranceB;
    const exteriorEntrance = interiorEntrance !== entranceA ? entranceA : entranceB;
    // console.log('assignEntranceExitPair', exteriorEntrance.key, interiorEntrance.key);

    // If we reassign the exit that targets the entrance to a dungeon that can be escaped using the Nimbus Cloud
    // we need to remap the Nimbus Cloud exit for that zone to the new entrance that was assigned to that exit.
    // This way when a player enters a randomized entrance that takes them to the main entrance of a dungeon,
    // using the Nimbus Cloud will return them back to that entrance, instead of the vanilla dungeon entrance.
    const exitDefinition = interiorEntrance.definition;
    if (isEntranceDefinition(exitDefinition)) {
        const zoneEntranceMap = getZoneEntranceMap();
        for (const zone of typedKeys(zoneEntranceMap)) {
            if (fixedNimbusCloudZones.has(zone)) {
                continue;
            }
            if (zoneEntranceMap[zone] === `${exitDefinition.targetZone}:${exitDefinition.targetObjectId}`) {
                zoneEntranceMap[zone] = exteriorEntrance.key;
                // console.log(zone + ' => ' + zoneEntranceMap[zone]);
                fixedNimbusCloudZones.add(zone);
            }
        }
    }

    // This line is redundant with the loop, except in the case of pit markers.
    // Pit marker assignments are not functional, but are useful for debugging which
    // pit entrance is assigned to a marker.
    entranceAssignments[exteriorEntrance.key] = {
        targetZone: interiorEntrance.location.zoneKey,
        targetObjectId: interiorEntrance.definition.id,
    };
    // This will not be set for 'pitMarker' "entrances" which do not need to be assigned.
    for (const entranceToAssign of targetIdMap[exteriorEntrance.originalTargetKey] ?? []) {
        /*console.log(
            entranceToAssign.key, '=>', interiorEntrance.key
        );*/
        entranceAssignments[entranceToAssign.key] = {
            targetZone: interiorEntrance.location.zoneKey,
            targetObjectId: interiorEntrance.definition.id,
        };
    }
    // This line is redundant with the loop, except in the case of pit markers.
    // Pit marker assignments are not functional, but are useful for debugging which
    // pit entrance is assigned to a marker.
    entranceAssignments[interiorEntrance.key] = {
        targetZone: exteriorEntrance.location.zoneKey,
        targetObjectId: exteriorEntrance.definition.id,
    };
    // This will not be set for 'pitMarker' "entrances" which do not need to be assigned.
    for (const entranceToAssign of targetIdMap[interiorEntrance.originalTargetKey] ?? []) {
        /*console.log(
            entranceToAssign.key, '=>', exteriorEntrance.key
        );*/
        entranceAssignments[entranceToAssign.key] = {
            targetZone: exteriorEntrance.location.zoneKey,
            targetObjectId: exteriorEntrance.definition.id,
        };
        // Remove cracked status from the interiorEntrance when assigned to an entrance that isn't cracked.
        if (entranceToAssign.definition.status === 'cracked' && exteriorEntrance.definition.status !== 'cracked') {
            entranceAssignments[entranceToAssign.key].status = 'blownOpen';
        }
    }
}
