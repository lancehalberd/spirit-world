import {getZone} from 'app/content/zones';
import {findDoorById} from 'app/randomizer/find';
import {missingExitNodeSet, missingNodeSet, warnOnce} from 'app/randomizer/warnOnce';

export function calculateKeyLogic(allNodes: LogicNode[], startingNodes: LogicNode[]): RequiredKeysMap {
    const requiredKeysMap: RequiredKeysMap = {};
    for (const node of allNodes) {
        const zone = getZone(node.zoneId);
        if (!zone) {
            continue
        }
        function checkExit(objectId: string) {
            const { object, location } = findDoorById(zone, objectId);
            const exitObject = object as EntranceDefinition;
            if (!exitObject) {
                return;
            }
            if (requiredKeysMap[exitObject.id] !== undefined) {
                return;
            }

            if (exitObject.status === 'locked' && !exitObject.requiredKeysForLogic) {
                requiredKeysMap[exitObject.id] = countRequiredKeysForEntrance(allNodes, startingNodes, location.logicalZoneKey, exitObject);
            } else if (exitObject.requiredKeysForLogic) {
                console.log(exitObject.id, 'manually set to', exitObject.requiredKeysForLogic, 'keys');
                requiredKeysMap[exitObject.id] = exitObject.requiredKeysForLogic;
            } else {
                requiredKeysMap[exitObject.id] = 0;
            }
        }
        for (const path of (node.paths || [])) {
            if (path.doorId) {
                checkExit(path.doorId);
            }
        }
        for (const flag of (node.flags || [])) {
            if (flag.doorId) {
                checkExit(flag.doorId);
            }
        }
        for (const exit of (node.exits || [])) {
            checkExit(exit.objectId);
        }
    }
    return requiredKeysMap;
}

function countRequiredKeysForEntrance(
    allNodes: LogicNode[],
    startingNodes: LogicNode[],
    logicalZoneKey: LogicalZoneKey,
    exitToUpdate: EntranceDefinition
): number {
    const countedDoorIds = new Set<string>();
    let requiredKeysForLogic = 1;
    const reachableNodes = [...startingNodes];
    for (let i = 0; i < reachableNodes.length; i++) {
        const currentNode = reachableNodes[i];
        const zone = getZone(currentNode.zoneId);
        if (!zone) {
            continue
        }
        for (const path of (currentNode.paths || [])) {
            if (path.doorId) {
                const { object, location } = findDoorById(zone, path.doorId);
                const exitObject = object as EntranceDefinition;
                if (!exitObject || exitObject === exitToUpdate) {
                    continue;
                }
                if (location.logicalZoneKey === logicalZoneKey && exitObject.status === 'locked' && !countedDoorIds.has(exitObject.id)) {
                    countedDoorIds.add(exitObject.id);
                    requiredKeysForLogic++;
                }
            }
            const nextNode = allNodes.find(node => node.nodeId === path.nodeId);
            if (!nextNode) {
                warnOnce(missingNodeSet, path.nodeId, 'Missing node: ');
                continue;
            }
            if (!reachableNodes.includes(nextNode)) {
                reachableNodes.push(nextNode);
            }
        }
        for (const flag of (currentNode.flags || [])) {
            if (flag.doorId) {
                const { object, location } = findDoorById(zone, flag.doorId);
                const exitObject = object as EntranceDefinition;
                if (!exitObject || exitObject === exitToUpdate) {
                    continue;
                }
                if (location.logicalZoneKey === logicalZoneKey && exitObject.status === 'locked' && !countedDoorIds.has(exitObject.id)) {
                    countedDoorIds.add(exitObject.id);
                    requiredKeysForLogic++;
                }
            }
        }
        for (const exit of (currentNode.exits || [])) {
            const { object, location } = findDoorById(zone, exit.objectId);
            const exitObject = object as EntranceDefinition;
            if (!exitObject || exitObject === exitToUpdate) {
                continue;
            }
            if (location.logicalZoneKey === logicalZoneKey && exitObject.status === 'locked' && !countedDoorIds.has(exitObject.id)) {
                countedDoorIds.add(exitObject.id);
                requiredKeysForLogic++;
            }
            const nextNode = allNodes.find(node =>
                (node !== currentNode || exitObject.targetObjectId !== exit.objectId)
                && node.zoneId === exitObject.targetZone
                && node.entranceIds?.includes(exitObject.targetObjectId)
            );
            if (!nextNode) {
                warnOnce(missingExitNodeSet,
                    zone.key + '::' + exitObject.id + ' => '
                    + exitObject.targetZone + '::' + exitObject.targetObjectId,
                    'Missing node for exit: '
                );
                continue;
            }
            if (!reachableNodes.includes(nextNode)) {
                reachableNodes.push(nextNode);
            }
        }
    }
    //console.log(exitToUpdate.id, 'calculated as', requiredKeysForLogic, 'keys');
    return requiredKeysForLogic;
}
