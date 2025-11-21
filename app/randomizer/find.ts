import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { isLogicValid } from 'app/content/logic';
import { getZone } from 'app/content/zones';
import { allNodes } from 'app/randomizer/allNodes';
import { missingExitNodeSet, missingNodeSet, missingObjectSet, warnOnce } from 'app/randomizer/warnOnce';
import { getFullZoneLocation } from 'app/utils/getFullZoneLocation';


export function findReachableNodes(allNodes: LogicNode[], startingNodes: LogicNode[], state: GameState): LogicNode[] {
    const reachableNodes = [...startingNodes];
    for (let i = 0; i < reachableNodes.length; i++) {
        const currentNode = reachableNodes[i];
        if (!currentNode) {
            console.error('Found undefined node');
            return [];
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
            if (path.logic && !isLogicValid(state, path.logic)) {
                continue;
            }
            if (path.doorId) {
                const { object, location } = findDoorById(zone, path.doorId, state);
                if (!canOpenDoor(location, state, object as EntranceDefinition)) {
                    continue;
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
        for (const exit of (currentNode.exits || [])) {
            if (exit.logic && !isLogicValid(state, exit.logic)) {
                //console.log('Invalid logic', exit);
                continue;
            }
            const { object, location } = findDoorById(zone, exit.objectId, state);
            const exitObject = object as EntranceDefinition;
            // console.log(exit.objectId);
            if (!canOpenDoor(location, state, exitObject)) {
                //console.log('cannot open', exitObject);
                continue;
            }
            //console.log('->', exitObject.targetZone + ':' + exitObject.targetObjectId);
            const nextNode = allNodes.find(node =>
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
            if (!reachableNodes.includes(nextNode)) {
                reachableNodes.push(nextNode);
            }
        }
    }
    return reachableNodes;
}
window['allNodes'] = allNodes;
window['findReachableNodes'] = findReachableNodes;

export function findReachableChecksFromStart(state: GameState) {
    return findReachableChecks(allNodes, [allNodes[0]], state);
}
window['findReachableChecksFromStart'] = findReachableChecksFromStart;

export function findReachableChecks(allNodes: LogicNode[], startingNodes: LogicNode[], state: GameState): LootWithLocation[] {
    const reachableNodes: LogicNode[] = findReachableNodes(allNodes, startingNodes, state);
    return findLootObjects(reachableNodes, state);
}

export function findDoorById(zone: Zone, id: string, state: GameState = null): {object: ObjectDefinition, location: FullZoneLocation}  {
    return findObjectById(zone, id, state, ['door', 'keyBlock', 'pitEntrance', 'staffTower', 'helixTop', 'teleporter']);
}
export function findLootById(zone: Zone, id: string, state: GameState = null): {object: ObjectDefinition, location: FullZoneLocation}  {
    return findObjectById(zone, id, state, ['bigChest', 'chest', 'loot', 'shopItem', 'boss']);
}

const findObjectByIdCache: {[key: string]: {
    object: ObjectDefinition,
    location: FullZoneLocation,
    needsCatEyes: boolean,
    needsTrueSight: boolean,
}} = {};
export function findObjectById(
    zone: Zone,
    id: string,
    state: GameState = null,
    typeFilter?: ObjectType[]
): {object: ObjectDefinition, location: FullZoneLocation} {
    const cacheKey = zone.key + ':' + id;
    const cachedResult = findObjectByIdCache[cacheKey];
    if (cachedResult) {
        if (state && !state.hero.savedData.passiveTools.trueSight && cachedResult.needsTrueSight) {
            return {object: null, location: null};
        }
        if (state && !(state.hero.savedData.passiveTools.catEyes || state.hero.savedData.passiveTools.trueSight) && cachedResult.needsCatEyes) {
            return {object: null, location: null};
        }
        return {object: cachedResult.object, location: cachedResult.location};
    }
    for (let floor = 0; floor < zone.floors.length; floor++) {
        for( const areaGrid of [zone.floors[floor].spiritGrid, zone.floors[floor].grid]){
            for (let y = 0; y < areaGrid.length; y++) {
                for (let x = 0; x < areaGrid[y].length; x++) {
                    // All objects in 100% dark areas are considered out of logic unless you can see in the dark.
                    const needsCatEyes = zone.dark >= 100 || areaGrid[y][x]?.dark >= 100;
                    for (const object of (areaGrid[y][x]?.objects || [])) {
                        if (object.id === id) {
                            if (typeFilter && !typeFilter.includes(object.type)) {
                                continue;
                            }
                            const location = getFullZoneLocation({
                                zoneKey: zone.key,
                                floor,
                                areaGridCoords: {x, y},
                                isSpiritWorld: areaGrid === zone.floors[floor].spiritGrid,
                                x: object.x,
                                y: object.y,
                                d: null,
                            });
                            findObjectByIdCache[cacheKey] = {object, location, needsCatEyes, needsTrueSight: object.isInvisible};
                            if (state && !state.hero.savedData.passiveTools.trueSight && findObjectByIdCache[cacheKey].needsTrueSight) {
                                return {object: null, location: null};
                            }
                            if (state && !(state.hero.savedData.passiveTools.catEyes || state.hero.savedData.passiveTools.trueSight) && findObjectByIdCache[cacheKey].needsCatEyes) {
                                return {object: null, location: null};
                            }
                            return findObjectByIdCache[cacheKey];
                        }
                    }
                }
            }
        }
    }
    warnOnce(missingObjectSet, zone.key + '::' + id, 'Missing object: ');
    findObjectByIdCache[cacheKey] = {object: null, location: null, needsCatEyes: false, needsTrueSight: false};
    return findObjectByIdCache[cacheKey];
}

export function findLootObjects(nodes: LogicNode[], state: GameState = null): LootWithLocation[] {
    const lootObjects: LootWithLocation[] = [];
    for (const node of nodes) {
        const zone = getZone(node.zoneId);
        if (!zone) {
            continue;
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
                optionKey
            });
        }
    }
    return lootObjects;
}

export function canOpenDoor(location: FullZoneLocation, state: GameState, door: EntranceDefinition): boolean {
    if (!door) {
        return false;
    }
    if (door.type === 'teleporter') {
        return state.hero.savedData.passiveTools.spiritSight > 0 || state.hero.savedData.passiveTools.trueSight > 0;
    }
    // Only pass through
    if (door.status === 'locked') {
        const dungeonInventory = state.savedState.dungeonInventories[location.logicalZoneKey];
        return dungeonInventory?.totalSmallKeys >= door.requiredKeysForLogic;
    }
    if (door.status === 'bigKeyLocked') {
        const dungeonInventory = state.savedState.dungeonInventories[location.logicalZoneKey];
        return dungeonInventory?.bigKey;
    }
    if (door.status === 'cracked') {
        return state.hero.savedData.activeTools.clone > 0;
    }
    return true;
}
