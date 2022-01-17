import { cloneDeep } from 'lodash';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { enemyTypes } from 'app/content/enemies';
import { isLogicValid } from 'app/content/logic';
import { lootEffects } from 'app/content/objects/lootObject';
import { getZone, zones } from 'app/content/zones';
import {
    SPAWN_LOCATION_DEMO,
    SPAWN_LOCATION_FULL,
    SPAWN_LOCATION_PEACH_CAVE_EXIT,
} from 'app/content/spawnLocations';

import { peachCaveNodes } from 'app/randomizer/logic/peachCaveLogic';
import { cavesNodes, holyCityNodes, treeVillageNodes, waterfallCaveNodes } from 'app/randomizer/logic/otherLogic'
import { overworldNodes, underwaterNodes, skyNodes } from 'app/randomizer/logic/overworldLogic';
import { tombNodes } from 'app/randomizer/logic/tombLogic';
import { warTempleNodes } from 'app/randomizer/logic/warTempleLogic';
import { cocoonNodes } from 'app/randomizer/logic/cocoonLogic';
import { helixNodes } from 'app/randomizer/logic/helixLogic';
import { forestTempleNodes } from 'app/randomizer/logic/forestTempleLogic';
import { waterfallTowerNodes } from 'app/randomizer/logic/waterfallTower';
import { riverTempleNodes, riverTempleWaterNodes } from 'app/randomizer/logic/riverTempleLogic';
import { craterNodes } from 'app/randomizer/logic/craterLogic';
import { staffTowerNodes } from 'app/randomizer/logic/staffTower';
import { addCheck } from 'app/randomizer/checks';

import { readGetParameter } from 'app/utils/index';
import SRandom from 'app/utils/SRandom';

import { applySavedState, getDefaultState } from 'app/state';

import {
    AreaDefinition,
    BossObjectDefinition, DialogueLootDefinition, EntranceDefinition,
    GameState, LogicNode, LootObjectDefinition, LootType, NPCDefinition,
    ObjectDefinition,
    Zone, ZoneLocation,
} from 'app/types';

const allNodes = [
    ...overworldNodes,
    ...cavesNodes,
    ...underwaterNodes,
    ...skyNodes,
    ...waterfallCaveNodes,
    ...peachCaveNodes,
    ...treeVillageNodes,
    ...holyCityNodes,
    ...tombNodes,
    ...warTempleNodes,
    ...cocoonNodes,
    ...helixNodes,
    ...forestTempleNodes,
    ...waterfallTowerNodes,
    ...riverTempleNodes,
    ...riverTempleWaterNodes,
    ...craterNodes,
    ...staffTowerNodes,
];

interface LootData {
    loot: {
        location: ZoneLocation
        object: LootObjectDefinition
    }[]
}

function getAllLootDrops(): LootData {
    const lootDrops: LootData = {
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
                            location: {
                                zoneKey,
                                floor: floorIndex,
                                areaGridCoords: {x: column, y: row},
                                isSpiritWorld: false,
                                x: object.x,
                                y: object.y,
                                d: null,
                            },
                            object,
                        });
                    }
                    const spiritArea = floor.spiritGrid[row][column];
                    for (const object of (spiritArea?.objects || [])) {
                        if (object.type !== 'chest' && object.type !== 'loot') {
                            continue;
                        }
                        lootDrops.loot.push({
                            location: {
                                zoneKey,
                                floor: floorIndex,
                                areaGridCoords: {x: column, y: row},
                                isSpiritWorld: true,
                                x: object.x,
                                y: object.y,
                                d: null,
                            },
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

export type AnyLootDefinition = BossObjectDefinition | DialogueLootDefinition | LootObjectDefinition;

interface LootWithLocation {
    location: ZoneLocation
    lootObject: AnyLootDefinition
    progressFlags?: string[]
}

interface LootAssignment {
    source: LootWithLocation
    lootType: LootType
    lootLevel: number
    lootAmount: number
    target: LootWithLocation
}

interface AssignmentState {
    // The array of loot assignments that can be used to apply this assignment state to the game.
    assignments: LootAssignment[]
    // The ids of all the checks that have contents assigned to them already.
    assignedLocations: string[]
    // The ids of all the check contents that have been assigned to some location.
    assignedContents: string[]
}


const findObjectByIdCache: {[key: string]: {
    object: ObjectDefinition,
    location: ZoneLocation,
    needsEyes: boolean,
}} = {};
function findObjectById(
    zone: Zone,
    id: string,
    state: GameState = null,
    skipObject: ObjectDefinition = null
): {object: ObjectDefinition, location: ZoneLocation} {
    const cacheKey = zone.key + ':' + id;
    const cachedResult = findObjectByIdCache[cacheKey];
    if (cachedResult) {
        if (state && !state.hero.passiveTools.catEyes && cachedResult.needsEyes) {
            return {object: null, location: null};
        }
        return {object: cachedResult.object, location: cachedResult.location};
    }
    for (let floor = 0; floor < zone.floors.length; floor++) {
        for( const areaGrid of [zone.floors[floor].spiritGrid, zone.floors[floor].grid]){
            for (let y = 0; y < areaGrid.length; y++) {
                for (let x = 0; x < areaGrid[y].length; x++) {
                    // All objects in 100% dark areas are considered out of logic unless you can see in the dark.
                    const needsEyes = areaGrid[y][x]?.dark >= 100;
                    for (const object of (areaGrid[y][x]?.objects || [])) {
                        if (object.id === id && object !== skipObject) {
                            const location = {
                                zoneKey: zone.key,
                                floor,
                                areaGridCoords: {x, y},
                                isSpiritWorld: areaGrid === zone.floors[floor].spiritGrid,
                                x: object.x,
                                y: object.y,
                                d: null,
                            };
                            findObjectByIdCache[cacheKey] = {object, location, needsEyes};
                            if (state && !state.hero.passiveTools.catEyes && needsEyes) {
                                return {object: null, location: null};
                            }
                            return findObjectByIdCache[cacheKey];
                        }
                    }
                }
            }
        }
    }
    warnOnce(missingObjectSet, zone.key + id, 'Missing object: ');
    findObjectByIdCache[cacheKey] = {object: null, location: null, needsEyes: false};
    return findObjectByIdCache[cacheKey];
}

function getLootObjects(nodes: LogicNode[], state: GameState = null): LootWithLocation[] {
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
            const {object, location} = findObjectById(zone, check.objectId, state);
            if (!object) {
                continue;
            }
            if (object.type === 'bigChest') {
                if (state && !state.savedState.dungeonInventories[zone.key]?.bigKey) {
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
            const {object, location} = findObjectById(zone, npc.loot.id, state);
            if (!object) {
                continue;
            }
            lootObjects.push({
                lootObject: npc.loot,
                location,
                progressFlags: npc.progressFlags,
            });
        }
    }
    return lootObjects;
}

const missingNodeSet = new Set<string>();
const missingExitNodeSet = new Set<string>();
const missingObjectSet = new Set<string>();
function warnOnce(warningSet: Set<string>, objectId: string, message: string) {
    if (warningSet.has(objectId)) {
        return;
    }
    warningSet.add(objectId);
    console.warn(message, objectId);
}

function findReachableChecks(allNodes: LogicNode[], startingNodes: LogicNode[], state: GameState): LootWithLocation[] {
    const reachableNodes: LogicNode[] = findReachableNodes(allNodes, startingNodes, state);
    return getLootObjects(reachableNodes, state);
}

function canOpenDoor(zone: Zone, state: GameState, door: EntranceDefinition): boolean {
    if (!door) {
        return false;
    }
    // Only pass through
    if (door.status === 'locked') {
        const dungeonInventory = state.savedState.dungeonInventories[zone.key];
        return dungeonInventory?.smallKeys >= door.requiredKeysForLogic;
    }
    if (door.status === 'bigKeyLocked') {
        const dungeonInventory = state.savedState.dungeonInventories[zone.key];
        return dungeonInventory?.bigKey;
    }
    if (door.status === 'cracked') {
        // console.log(door.id, state.hero.activeTools.clone > 0 && state.hero.passiveTools.catEyes > 0);
        return state.hero.activeTools.clone > 0 && state.hero.passiveTools.catEyes > 0;
    }
    return true;
}

function findReachableNodes(allNodes: LogicNode[], startingNodes: LogicNode[], state: GameState): LogicNode[] {
    const reachableNodes = [...startingNodes];
    for (let i = 0; i < reachableNodes.length; i++) {
        const currentNode = reachableNodes[i];
        //console.log('node: ', currentNode.nodeId);
        const zone = getZone(currentNode.zoneId);
        if (!zone) {
            continue
        }
        for (const path of (currentNode.paths || [])) {
            if (path.logic && !isLogicValid(state, path.logic)) {
                continue;
            }
            if (path.doorId) {
                const { object } = findObjectById(zone, path.doorId);
                if (!canOpenDoor(zone, state, object as EntranceDefinition)) {
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
            const { object } = findObjectById(zone, exit.objectId, state);
            const exitObject = object as EntranceDefinition;
            // console.log(exit.objectId);
            if (!canOpenDoor(zone, state, exitObject)) {
                //console.log('cannot open', exitObject);
                continue;
            }
            //console.log('->', exitObject.targetZone + ':' + exitObject.targetObjectId);
            const nextNode = allNodes.find(node =>
                node !== currentNode
                && node.zoneId === exitObject.targetZone
                && node.entranceIds?.includes(exitObject.targetObjectId)
            );
            if (!nextNode) {
                warnOnce(missingExitNodeSet, exitObject.targetZone + exitObject.targetObjectId, 'Missing node for exit: ');
                continue;
            }
            if (!reachableNodes.includes(nextNode)) {
                reachableNodes.push(nextNode);
            }
        }
    }
    return reachableNodes;
}
function calculateKeyLogic(allNodes: LogicNode[], startingNodes: LogicNode[]) {
    const handledIds = new Set<string>();
    for (const node of allNodes) {
        const zone = getZone(node.zoneId);
        if (!zone) {
            continue
        }
        function checkExit(objectId: string) {
            const { object } = findObjectById(zone, objectId);
            const exitObject = object as EntranceDefinition;
            if (!exitObject) {
                return;
            }
            if (handledIds.has(exitObject.id)) {
                return;
            }
            if (exitObject.status === 'locked' && !exitObject.requiredKeysForLogic) {
                countRequiredKeysForEntrance(allNodes, startingNodes, zone.key, exitObject);
            } else if (exitObject.requiredKeysForLogic) {
                console.log(exitObject.id, 'manually set to', exitObject.requiredKeysForLogic, 'keys');
            }
            handledIds.add(exitObject.id);
        }
        for (const path of (node.paths || [])) {
            if (path.doorId) {
                checkExit(path.doorId);
            }
        }
        for (const exit of (node.exits || [])) {
            checkExit(exit.objectId);
        }
    }
}
function countRequiredKeysForEntrance(allNodes: LogicNode[], startingNodes: LogicNode[], zoneKey: string, exitToUpdate: EntranceDefinition) {
    const countedDoorIds = new Set<string>();
    exitToUpdate.requiredKeysForLogic = 1;
    const reachableNodes = [...startingNodes];
    for (let i = 0; i < reachableNodes.length; i++) {
        const currentNode = reachableNodes[i];
        const zone = getZone(currentNode.zoneId);
        if (!zone) {
            continue
        }
        for (const path of (currentNode.paths || [])) {
            if (path.doorId) {
                const { object } = findObjectById(zone, path.doorId);
                const exitObject = object as EntranceDefinition;
                if (!exitObject || exitObject === exitToUpdate) {
                    continue;
                }
                if (zone.key === zoneKey && exitObject.status === 'locked' && !countedDoorIds.has(exitObject.id)) {
                    countedDoorIds.add(exitObject.id);
                    exitToUpdate.requiredKeysForLogic++;
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
            const { object } = findObjectById(zone, exit.objectId);
            const exitObject = object as EntranceDefinition;
            if (!exitObject || exitObject === exitToUpdate) {
                continue;
            }
            if (zone.key === zoneKey && exitObject.status === 'locked' && !countedDoorIds.has(exitObject.id)) {
                countedDoorIds.add(exitObject.id);
                exitToUpdate.requiredKeysForLogic++;
            }
            const nextNode = allNodes.find(node =>
                node !== currentNode
                && node.zoneId === exitObject.targetZone
                && node.entranceIds?.includes(exitObject.targetObjectId)
            );
            if (!nextNode) {
                warnOnce(missingExitNodeSet, exitObject.targetZone + exitObject.targetObjectId, 'Missing node for exit: ');
                continue;
            }
            if (!reachableNodes.includes(nextNode)) {
                reachableNodes.push(nextNode);
            }
        }
    }
    // console.log(exitToUpdate.id, 'calculated as', exitToUpdate.requiredKeysForLogic, 'keys');
}

function organizeLootObjects(lootObjects: LootWithLocation[]) {
    const bigKeys: LootWithLocation[] = [];
    const smallKeys: LootWithLocation[] = [];
    const progressLoot: LootWithLocation[] = [];
    const peachLoot: LootWithLocation[] = [];
    const trashLoot: LootWithLocation[] = [];
    for (const lootWithLocation of lootObjects) {
        // peach+peach pieces are considered progress since some areas may require certain life totals
        // and the first full peach grants the cat eyes ability.
        switch (lootWithLocation.lootObject.lootType) {
            case 'money':
            case 'peach':
            case 'empty':
                trashLoot.push(lootWithLocation);
                break;
            case 'bigKey':
                bigKeys.push(lootWithLocation);
                break;
            case 'smallKey':
                smallKeys.push(lootWithLocation);
                break;
            case 'peachOfImmortality':
            case 'peachOfImmortalityPiece':
                peachLoot.push(lootWithLocation);
                break;
            default:
                progressLoot.push(lootWithLocation);
        }
    }

    return { bigKeys, smallKeys, progressLoot, peachLoot, trashLoot };
}

// Make a deep copy of the state.
function copyState(state: GameState): GameState {
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

function applyLootObjectToState(state: GameState, lootWithLocation: LootWithLocation): GameState {
    if (lootWithLocation.lootObject.lootType === 'empty') {
        return state;
    }
    // We need to set the current location to the loot location so that dungeon items are applied to the correct state.
    const stateCopy = copyState(state);
    stateCopy.location = lootWithLocation.location;
    const onPickup = lootEffects[lootWithLocation.lootObject.lootType] || lootEffects.unknown;
    // Loot is always progressive in the randomizer, so set lootLevel to 0.
    // onPickup(stateCopy, lootWithLocation.lootObject);
    onPickup(stateCopy, {...lootWithLocation.lootObject, lootLevel: 0}, true);
    if (!stateCopy.hero.passiveTools.catEyes && stateCopy.hero.maxLife > 4) {
        stateCopy.hero.passiveTools.catEyes = 1;
    }
    return stateCopy;
}


export function reverseFill(random: typeof SRandom, allNodes: LogicNode[], startingNodes: LogicNode[]): AssignmentState {
    calculateKeyLogic(allNodes, startingNodes);
    //console.log({ allNodes, startingNodes });
    const allLootObjects = getLootObjects(allNodes);
    //console.log(allLootObjects.map(object => object.lootObject.lootType + ':' + object.location.zoneKey));
    let initialState = getDefaultState();
    applySavedState(initialState, initialState.savedState);

    let finalState = copyState(initialState);
    for (const lootWithLocation of allLootObjects) {
        finalState = applyLootObjectToState(finalState, lootWithLocation);
    }
    //const initialCheckIds = findReachableChecks(allNodes, startingNodes, initialState).map(l => l.lootObject.id);
    //console.log(initialCheckIds);
    //debugState(finalState);
    const allReachableCheckIds = findReachableChecks(allNodes, startingNodes, finalState).map(l => l.lootObject.id);
    for (const lootWithLocation of allLootObjects) {
        if (!allReachableCheckIds.includes(lootWithLocation.lootObject.id)) {
            debugState(finalState);
            console.warn(lootWithLocation.lootObject.id, ' will never be reachable');
        }
    }
    //console.log({ allLootObjects, allReachableCheckIds });
    const assignmentsState: AssignmentState = {
        assignments: [],
        assignedLocations: [],
        assignedContents: [],
    }
    let { bigKeys, smallKeys, peachLoot, progressLoot, trashLoot } = organizeLootObjects(allLootObjects);
    progressLoot = random.shuffle(progressLoot);
    random.generateAndMutate();
    peachLoot = random.shuffle(peachLoot);
    random.generateAndMutate();
    trashLoot = random.shuffle(trashLoot);
    random.generateAndMutate();
    let remainingLoot = [...bigKeys, ...smallKeys, ...progressLoot, ...peachLoot];
    for (let itemSet of [bigKeys, smallKeys, progressLoot, peachLoot]) {
        while (itemSet.length) {
            const itemToPlace = random.removeElement(itemSet);
            random.generateAndMutate();
            remainingLoot.splice(remainingLoot.indexOf(itemToPlace), 1);
            // Compute the current state without the chosen item or any of the previously placed items.
            //const startTime = Date.now();
            let state = copyState(initialState);
            //console.log('cloned ', (Date.now() - startTime) / 1000);
            for (const lootWithLocation of remainingLoot) {
                state = applyLootObjectToState(state, lootWithLocation);
            }
            //console.log('startState ', (Date.now() - startTime) / 1000);
            // console.log(state.hero);
            placeItem(random, allNodes, startingNodes, state, assignmentsState, itemToPlace);
            //console.log('placed ', (Date.now() - startTime) / 1000);
        }
    }
    for (const location of allLootObjects) {
        if (!trashLoot.length) {
            break;
        }
        // console.log('Placing: ', loot.lootObject.id);
        if (assignmentsState.assignedLocations.includes(location.lootObject.id)) {
            continue;
        }
        const loot = trashLoot.pop();
        assignmentsState.assignments.push({
            lootType: loot.lootObject.lootType,
            lootAmount: loot.lootObject.lootAmount,
            lootLevel: loot.lootObject.lootLevel,
            source: loot,
            target: location,
        });
        assignmentsState.assignedContents.push(loot.lootObject.id);
        assignmentsState.assignedLocations.push(location.lootObject.id);
    }
    return assignmentsState;
}

function debugState(state: GameState) {
    console.log(state.hero.activeTools);
    console.log(state.hero.passiveTools);
    console.log(Object.keys(state.savedState.objectFlags));
}

function placeItem(random: typeof SRandom, allNodes: LogicNode[], startingNodes: LogicNode[], originalState: GameState, assignmentsState: AssignmentState, loot: LootWithLocation): string {
    let currentState = originalState;
    let previousState = originalState;
    let counter = 0;
    do {
        if (counter++ > 100) {
            console.error('infinite loop');
            debugger;
            return null;
        }
        previousState = currentState;
        currentState = collectAllLoot(allNodes, startingNodes, previousState, assignmentsState);
    } while (currentState !== previousState);
    const allReachableChecks: LootWithLocation[] = findReachableChecks(allNodes, startingNodes, currentState);
    const allAvailableChecks = allReachableChecks.filter(lootWithLocation => !assignmentsState.assignedLocations.includes(lootWithLocation.lootObject.id));
    let allAppropriateChecks = allAvailableChecks;
    if (loot.lootObject.lootType === 'bigKey' || loot.lootObject.lootType === 'smallKey') {
        allAppropriateChecks = allAppropriateChecks.filter(lootWithLocation => lootWithLocation.location.zoneKey === loot.location.zoneKey);
    }
    const assignedLocation = random.element(allAppropriateChecks);
    random.generateAndMutate();
    if (!assignedLocation) {
        console.error('Failed to place item', { assignmentsState, originalState, currentState, loot});
        console.error({ allReachableChecks, allAvailableChecks, allAppropriateChecks });
        debugger;
        throw new Error('Failed to place item')
    }
    //debugState(currentState);
    //console.log('placing', loot.lootObject.lootType, ' at ', assignedLocation.location.zoneKey, assignedLocation.lootObject.id);
    assignmentsState.assignments.push({
        lootType: loot.lootObject.lootType,
        lootAmount: loot.lootObject.lootAmount,
        // Only progressive loot is placed in randomizer.
        lootLevel: 0,
        //lootLevel: loot.lootObject.lootLevel,
        source: loot,
        target: assignedLocation,
    });
    assignmentsState.assignedContents.push(loot.lootObject.id);
    assignmentsState.assignedLocations.push(assignedLocation.lootObject.id);
}

window['showRandomizerSolution'] = function () {
    let currentState = getDefaultState();
    applySavedState(currentState, currentState.savedState);
    let previousState = currentState;
    let counter = 0;
    const startingNodes = [overworldNodes[0]];
    do {
        if (counter++ > 200) {
            console.error('infinite loop');
            debugger;
            return null;
        }
        previousState = currentState;
        console.log(`Sphere ${counter}`);
        currentState = collectAllLootForSolution(allNodes, startingNodes, previousState);
    } while (currentState !== previousState);
}

function collectAllLootForSolution(allNodes: LogicNode[], startingNodes: LogicNode[], state: GameState): GameState {
    const reachableChecks: LootWithLocation[] = findReachableChecks(allNodes, startingNodes, state);
    for (const check of reachableChecks) {
        // We can only open checks that have been assigned, contents of other checks are not yet determined.
        //if (!assignmentsState.assignedLocations.includes(check.lootObject.id)) {
        //    continue;
        //}
        // Don't open a check that has already been opened.
        if (state.savedState.objectFlags[check.lootObject.id]) {
            continue;
        }
        if (check.lootObject.lootType !== 'money' && check.lootObject.lootType !== 'empty') {
            if (!state.hero.passiveTools.catEyes || (
                check.lootObject.lootType !== 'peachOfImmortality'
                && check.lootObject.lootType !== 'peachOfImmortalityPiece'
            )) {
                // debugState(state);
                console.log(`Get ${check.lootObject.lootType} at ${check.location.zoneKey}:${check.lootObject.id}`);
            }
        }
        state = applyLootObjectToState(state, check);
        // Indicate this check has already been opened.
        state.savedState.objectFlags[check.lootObject.id] = true;
    }
    return state;
}

function collectAllLoot(allNodes: LogicNode[], startingNodes: LogicNode[], state: GameState, assignmentsState: AssignmentState): GameState {
    const reachableChecks: LootWithLocation[] = findReachableChecks(allNodes, startingNodes, state);
    for (const check of reachableChecks) {
        // We can only open checks that have been assigned, contents of other checks are not yet determined.
        //if (!assignmentsState.assignedLocations.includes(check.lootObject.id)) {
        //    continue;
        //}
        // Don't open a check that has already been opened.
        if (state.savedState.objectFlags[check.lootObject.id]) {
            continue;
        }
        const assignment = assignmentsState.assignments.find(assignment => assignment.target.lootObject.id === check.lootObject.id);
        if (!assignment) {
            continue;
        }
        state = applyLootObjectToState(state, assignment.source);
        // Indicate this check has already been opened.
        state.savedState.objectFlags[check.lootObject.id] = true;
    }
    return state;
}

export function applyLootAssignments(assignments: LootAssignment[]): void {
    // console.log('applying assignments:');
    // console.log(assignments);
    for (const assignment of assignments) {
        // Change spirit powers into progressive spirit powers.
        if (assignment.lootType === 'spiritSight'
            || assignment.lootType === 'astralProjection'
            || assignment.lootType === 'teleportation'
        ) {
            assignment.lootType = 'spiritPower';
        }
        const zoneKey = assignment.target.location.zoneKey;
        // console.log(assignment.source.lootObject.id, ' => ', assignment.target.lootObject.id);
        if (assignment.target.lootObject.type === 'dialogueLoot') {
            const {object} = findObjectById(zones[zoneKey], assignment.target.lootObject.id);
            const npc = object as NPCDefinition;
            const npcKey = `${zoneKey}-${assignment.target.lootObject.id}`;
            addCheck(npcKey, zoneKey);
            const number = assignment.lootAmount || 0;//assignment.lootLevel;
            let text: string;
            if (assignment.lootType === 'empty') {
                // Include the flag so that we can still count the check for the check counter.
                text = `I'm sorry you came all this way for nothing. {flag:${npcKey}}`;
            } else if (number) {
                text = `Here you go! {flag:${npcKey}}{item:${assignment.lootType}=${number}}`;
            } else {
                text = `Here you go! {flag:${npcKey}}{item:${assignment.lootType}}`;
            }
            npc.dialogueKey = npcKey;
            text += (assignment.target.progressFlags || []).map(flag => `{flag:${flag}}`).join(' ');
            dialogueHash[npcKey] = {
                key: npcKey,
                options: [
                    {
                        logicCheck: { excludedFlags: [`${npcKey}`] },
                        text: [text],
                    },
                    {
                        logicCheck: {},
                        text: ['You already got it!'],
                    },
                ],
            };
            assignment.target.lootObject.lootType = assignment.lootType;
            assignment.target.lootObject.lootAmount = assignment.lootAmount;
            assignment.target.lootObject.lootLevel = 0;
        } else {
            addCheck(assignment.target.lootObject.id, zoneKey);
            for (const target of findAllTargetObjects(assignment.target)) {
                target.lootType = assignment.lootType;
                target.lootAmount = assignment.lootAmount;
                target.lootLevel = 0;//assignment.lootLevel;
            }
        }
    }
}

function findAllTargetObjects(lootWithLocation: LootWithLocation): (LootObjectDefinition | BossObjectDefinition)[] {
    const results: (LootObjectDefinition | BossObjectDefinition)[] = [];
    const zone = zones[lootWithLocation.location.zoneKey];
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

const seed = readGetParameter('seed');
const enemySeed = readGetParameter('enemySeed');

if (seed) {
    const assignmentsState = reverseFill(SRandom.seed(Number(seed)), allNodes, [overworldNodes[0]]);
    applyLootAssignments(assignmentsState.assignments);
    for (let key in SPAWN_LOCATION_PEACH_CAVE_EXIT) {
        SPAWN_LOCATION_DEMO[key] = SPAWN_LOCATION_PEACH_CAVE_EXIT[key];
        SPAWN_LOCATION_FULL[key] = SPAWN_LOCATION_PEACH_CAVE_EXIT[key];
    }

}
if (enemySeed) {
    let enemyRandom = SRandom.seed(Number(seed))
    everyObject((location, zone, area, object) => {
        if (object.type === 'enemy') {
            object.enemyType = enemyRandom.element([...enemyTypes]);
            enemyRandom.generateAndMutate();
        }
    });
}


function everyZone(callback: (location: Partial<ZoneLocation>, zone: Zone) => void ) {
    for (const zoneKey in zones) {
        callback({zoneKey}, zones[zoneKey]);
    }
}
function everyArea(callback: (location: ZoneLocation, zone: Zone, area: AreaDefinition) => void ) {
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
                        callback({
                            zoneKey: location.zoneKey,
                            floor,
                            isSpiritWorld,
                            areaGridCoords: {x, y},
                            x: 0, y: 0, d: 'up',
                        }, zone, grid[y][x]);
                    }
                }
            }
        }
    });
}
function everyObject(callback: (location: ZoneLocation, zone: Zone, area: AreaDefinition, objectDefinition: ObjectDefinition) => void) {
    everyArea((location, zone, area) => {
        for (let i = 0; i < area.objects.length; i++) {
            callback(location, zone, area, area.objects[i]);
        }
    });
}
