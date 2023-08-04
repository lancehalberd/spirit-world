import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { getRandomizerZoneDescription } from 'app/content/hints';
import { isLogicValid } from 'app/content/logic';
import { lootEffects } from 'app/content/lootEffects';
import { getZone, zones } from 'app/content/zones';

import { randomizerGoal, randomizerGoalType, randomizerTotal } from 'app/gameConstants';

import { allNodes } from 'app/randomizer/allNodes';
import { addCheck } from 'app/randomizer/checks';
import {
    findDoorById,
    findLootById,
    findLootObjects,
    findReachableChecks,
    findReachableNodes,
} from 'app/randomizer/find';
import { missingExitNodeSet, missingNodeSet, warnOnce } from 'app/randomizer/warnOnce';

import { cloneDeep } from 'app/utils/index';
import { applySavedState, getDefaultState } from 'app/state';
import { getFullZoneLocation } from 'app/utils/getFullZoneLocation';
import SRandom from 'app/utils/SRandom';




interface LootData {
    loot: {
        location: FullZoneLocation
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


function calculateKeyLogic(allNodes: LogicNode[], startingNodes: LogicNode[]) {
    const handledIds = new Set<string>();
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
            if (handledIds.has(exitObject.id)) {
                return;
            }
            if (exitObject.status === 'locked' && !exitObject.requiredKeysForLogic) {
                countRequiredKeysForEntrance(allNodes, startingNodes, location.logicalZoneKey, exitObject);
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
function countRequiredKeysForEntrance(allNodes: LogicNode[], startingNodes: LogicNode[], logicalZoneKey: LogicalZoneKey, exitToUpdate: EntranceDefinition) {
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
                const { object, location } = findDoorById(zone, path.doorId);
                const exitObject = object as EntranceDefinition;
                if (!exitObject || exitObject === exitToUpdate) {
                    continue;
                }
                if (location.logicalZoneKey === logicalZoneKey && exitObject.status === 'locked' && !countedDoorIds.has(exitObject.id)) {
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
            const { object, location } = findDoorById(zone, exit.objectId);
            const exitObject = object as EntranceDefinition;
            if (!exitObject || exitObject === exitToUpdate) {
                continue;
            }
            if (location.logicalZoneKey === logicalZoneKey && exitObject.status === 'locked' && !countedDoorIds.has(exitObject.id)) {
                countedDoorIds.add(exitObject.id);
                exitToUpdate.requiredKeysForLogic++;
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
    // console.log(exitToUpdate.id, 'calculated as', exitToUpdate.requiredKeysForLogic, 'keys');
}

function organizeLootObjects(lootObjects: LootWithLocation[]) {
    const bigKeys: LootWithLocation[] = [];
    const smallKeys: LootWithLocation[] = [];
    const maps: LootWithLocation[] = [];
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
            case 'victoryPoint':
            case 'silverOre':
            case 'goldOre':
                trashLoot.push(lootWithLocation);
                break;
            case 'bigKey':
                bigKeys.push(lootWithLocation);
                break;
            case 'smallKey':
                smallKeys.push(lootWithLocation);
                break;
            case 'map':
                maps.push(lootWithLocation);
                break;
            case 'peachOfImmortality':
            case 'peachOfImmortalityPiece':
                peachLoot.push(lootWithLocation);
                break;
            default:
                progressLoot.push(lootWithLocation);
        }
    }

    return { bigKeys, smallKeys, maps, progressLoot, peachLoot, trashLoot };
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
    if (lootWithLocation.location) {
        stateCopy.location = lootWithLocation.location;
    }
    const onPickup = lootEffects[lootWithLocation.lootObject.lootType] || lootEffects.unknown;
    // Loot is always progressive in the randomizer, so set lootLevel to 0.
    // onPickup(stateCopy, lootWithLocation.lootObject);
    try {
        onPickup(stateCopy, {...lootWithLocation.lootObject, lootLevel: 0}, true);
    } catch (e) {
        debugger;
    }
    if (!stateCopy.hero.passiveTools.catEyes && stateCopy.hero.maxLife > 4) {
        stateCopy.hero.passiveTools.catEyes = 1;
    }
    return stateCopy;
}

function setAllFlagsInLogic(state: GameState, allNodes: LogicNode[], startingNodes: LogicNode[]): GameState {
    let changed, updatedState = state;
    do {
        changed = false;
        startingNodes = findReachableNodes(allNodes, startingNodes, updatedState);
        for (const node of startingNodes) {
            for (const flag of (node.flags || [])) {
                if (flag.logic && !isLogicValid(updatedState, flag.logic)) {
                    //console.log('Invalid logic', flag);
                    continue;
                }
                if (!updatedState.savedState.objectFlags[flag.flag]) {
                    if (updatedState === state) {
                        updatedState = copyState(state);
                    }
                    updatedState.savedState.objectFlags[flag.flag] = true;
                    //console.log('    Setting flag', flag.flag);
                    changed = true;
                }
            }
        }
    } while (changed);
    return updatedState;
}


export function reverseFill(random: typeof SRandom, allNodes: LogicNode[], startingNodes: LogicNode[]): AssignmentState {
    calculateKeyLogic(allNodes, startingNodes);
    //console.log({ allNodes, startingNodes });
    const allLootObjects = findLootObjects(allNodes);
    const lootMap: {[key: string]: LootType } = {};
    for (const lootWithLocation of allLootObjects) {
        if (lootMap[lootWithLocation.lootObject.id] &&
            lootMap[lootWithLocation.lootObject.id] !== lootWithLocation.lootObject.lootType) {
            console.warn('Duplicate loot id with mismatched type',
                lootWithLocation.lootObject.id,
                lootMap[lootWithLocation.lootObject.id], '!=', lootWithLocation.lootObject.lootType
            );
        }
        lootMap[lootWithLocation.lootObject.id] = lootWithLocation.lootObject.lootType;
    }
    // Try to replace as many unimportant checks with victory points as we can
    // until we either run out of checks or hit the victory point target.
    let victoryPointsHidden = 0, replaceGoodChecks = false;
    const shuffledLoot = random.shuffle(allLootObjects);
    while (randomizerGoalType === 'victoryPoints' && victoryPointsHidden < randomizerTotal) {
        let remainingPeachPiecesNeeded = 12;
        for (const lootWithLocation of shuffledLoot) {
            switch (lootWithLocation.lootObject.lootType) {
                case 'victoryPoint':
                    lootWithLocation.lootObject.lootAmount++;
                    victoryPointsHidden++;
                    break;
                case 'silverOre':
                case 'goldOre':
                    if (!replaceGoodChecks) {
                        break;
                    }
                case 'empty':
                case 'money':
                case 'peach':
                    lootWithLocation.lootObject.lootType = 'victoryPoint';
                    lootWithLocation.lootObject.lootAmount = 1;
                    victoryPointsHidden++;
                    break;
                case 'peachOfImmortality':
                    if (!replaceGoodChecks) {
                        break;
                    }
                    if (remainingPeachPiecesNeeded > 0) {
                        remainingPeachPiecesNeeded -= 4;
                    } else {
                        lootWithLocation.lootObject.lootType = 'victoryPoint';
                        lootWithLocation.lootObject.lootAmount = 1;
                        victoryPointsHidden++;
                    }
                    break;
                case 'peachOfImmortalityPiece':
                    if (!replaceGoodChecks) {
                        break;
                    }
                    if (remainingPeachPiecesNeeded > 0) {
                        remainingPeachPiecesNeeded--;
                    } else {
                        lootWithLocation.lootObject.lootType = 'victoryPoint';
                        lootWithLocation.lootObject.lootAmount = 1;
                        victoryPointsHidden++;
                    }
                    break;
            }
            if (victoryPointsHidden >= randomizerTotal) {
                break;
            }
        }
        replaceGoodChecks = true;
    }


    //console.log(allLootObjects.map(object => object.lootObject.lootType + ':' + object.location.zoneKey));
    let initialState = getDefaultState();
    applySavedState(initialState, initialState.savedState);

    let finalState = copyState(initialState);
    for (const lootWithLocation of allLootObjects) {
        finalState = applyLootObjectToState(finalState, lootWithLocation);
        finalState.savedState.objectFlags[lootWithLocation.lootObject.id] = true;
        for (const flag of (lootWithLocation.progressFlags || [])) {
            finalState.savedState.objectFlags[flag] = true;
        }
    }
    finalState = setAllFlagsInLogic(finalState, allNodes, startingNodes);
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

    const initialReachableChecks = findReachableChecks(allNodes, startingNodes, initialState);
    console.log('sphere 0 checks: ', initialReachableChecks.length);
    let placeFullPeachFirst = initialReachableChecks.length < 13;


    let { bigKeys, smallKeys, maps, peachLoot, progressLoot, trashLoot } = organizeLootObjects(allLootObjects);
    progressLoot = random.shuffle(progressLoot);
    random.generateAndMutate();
    peachLoot = random.shuffle(peachLoot);
    random.generateAndMutate();
    trashLoot = random.shuffle(trashLoot);
    random.generateAndMutate();
    // This is a bit of a hack to prevent generation from failing when there are too few
    // checks in sphere 0. Typically the error occurs if we generate to the point that cat eyes
    // are required for all remaining checks outside of sphere 0, and there are fewer than 4 unused
    // checks in sphere 0 when we go to place peaches. Then on the 2nd-4th peach piece all checks
    // can be used up without opening up additional checks.
    // Forcing a full peach among the sphere 0 checks solves this particular issue, although a
    // similar thing could in theory happen with any progress item when all sphere 0 checks are
    // used, it is just more likely with peaches since it can require 4 checks to unlock cat eyes.
    if (placeFullPeachFirst) {
        console.log(`Sphere 0 only contains ${initialReachableChecks.length}, prioritizing a full peach`);
        const fullPeach = peachLoot.find(l => l.lootObject.lootType === 'peachOfImmortality');
        peachLoot.splice(peachLoot.indexOf(fullPeach), 1);
        const location = random.element(initialReachableChecks);
        console.log('Placing', fullPeach, 'at', location)
        assignItemToLocation(assignmentsState, fullPeach, location);
    }
    let remainingLoot = [...bigKeys, ...smallKeys, ...progressLoot, ...peachLoot];
    for (let itemSet of [bigKeys, smallKeys, maps, progressLoot, peachLoot]) {
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
        currentState = setAllFlagsInLogic(currentState, allNodes, startingNodes);
    } while (currentState !== previousState);
    const allReachableChecks: LootWithLocation[] = findReachableChecks(allNodes, startingNodes, currentState);
    const allAvailableChecks = allReachableChecks.filter(lootWithLocation => !assignmentsState.assignedLocations.includes(lootWithLocation.lootObject.id));
    let allAppropriateChecks = allAvailableChecks;
    /*if (loot.lootObject.lootType === 'spiritSight') {
        console.log('hasTeleportation', isLogicValid(currentState, hasTeleportation));
        debugger;
    }*/
    if (loot.lootObject.lootType === 'bigKey'
        || loot.lootObject.lootType === 'smallKey'
        || loot.lootObject.lootType === 'map'
    ) {
        allAppropriateChecks = allAppropriateChecks.filter(lootWithLocation => {
            return lootWithLocation.location?.logicalZoneKey === loot.location?.logicalZoneKey
        });
    }
    const assignedLocation = random.element(allAppropriateChecks);
    random.generateAndMutate();
    if (!assignedLocation) {
        console.error('Failed to place item', { assignmentsState, originalState, currentState, loot});
        console.error({ allReachableChecks, allAvailableChecks, allAppropriateChecks });
        console.error(debugLocations(allReachableChecks));
        //const withLootState = applyLootObjectToState(currentState, loot);
        //console.error('reachable with item:')
        //console.error(findReachableChecks(allNodes, startingNodes, withLootState).map(debugLocation))
        debugger;
        throw new Error('Failed to place item')
    }
    assignItemToLocation(assignmentsState, loot, assignedLocation);
}


function debugLocations(loot: LootWithLocation[]) {
    return loot.map(debugLocation).join(',');
}

function debugLocation(loot: LootWithLocation) {
    if (loot.location) {
        return loot.location.zoneKey + '::' + loot.lootObject.id;
    } else {
        return loot.dialogueKey + '::' + loot.optionKey;
    }
}

function assignItemToLocation(assignmentsState: AssignmentState, loot: LootWithLocation, assignedLocation: LootWithLocation): void {
    //debugState(currentState);
    /*if (assignedLocation.location) {
        console.log('placing', loot.lootObject.lootType, ' at ', assignedLocation.location.zoneKey, assignedLocation.lootObject.id);
    } else {
        console.log('placing', loot.lootObject.lootType, ' to dialogue ', assignedLocation.dialogueKey, assignedLocation.optionKey);
    }*/
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

let finishedRandomizerSolution = false;
window['showRandomizerSolution'] = function () {
    let currentState = getDefaultState();
    applySavedState(currentState, currentState.savedState);
    let previousState = currentState;
    let counter = 0;
    const startingNodes = [allNodes[0]];
    finishedRandomizerSolution = false;
    do {
        if (counter++ > 200) {
            console.error('infinite loop');
            debugger;
            return null;
        }
        previousState = currentState;
        console.log(`Sphere ${counter}`);
        currentState = collectAllLootForSolution(allNodes, startingNodes, previousState);
        currentState = setAllFlagsInLogic(currentState, allNodes, startingNodes);

        if (!finishedRandomizerSolution && randomizerGoalType === 'finalBoss' && currentState.savedState.objectFlags.voidTree) {
            console.log('');
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            console.log('Defeat final boss and talk to mom to win.');
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            console.log('');
            finishedRandomizerSolution = true;
        }
    } while (currentState !== previousState);
}


function getLootName({lootType, lootAmount}: AnyLootDefinition, state: GameState) {
    if (lootType === 'spiritPower') {
        if (state.hero.passiveTools.astralProjection) {
            return 'Teleportation';
        }
        if (state.hero.passiveTools.spiritSight) {
            return 'Astral Projection';
        }
        return 'Spirit Sight';
    }
    if (lootType === 'weapon') {
        if (state.hero.weapon) {
            return 'Spirit Chakram';
        }
        return 'Chakram';
    }
    if (lootType === 'cloak') {
        return state.hero.activeTools.cloak ? 'Invisibility Cloak' : 'Spirit Cloak';
    }
    if (lootType === 'staff') {
        return state.hero.activeTools.staff ? 'Tower Staff' : 'Tree Staff';
    }
    if (lootType === 'gloves') {
        return state.hero.passiveTools.gloves ? 'Magical Bracers' : 'Spirit Bracers';
    }
    if (lootType === 'roll') {
        return state.hero.passiveTools.roll ? 'Cloud Somersault': 'Mist Roll';
    }
    if (lootType === 'peachOfImmortality') {
        return 'Golden Peach';
    }
    if (lootType === 'peachOfImmortalityPiece') {
        return 'Peach Piece';
    }
    if (lootType === 'victoryPoint') {
        return `${lootAmount}x VP(${state.hero.victoryPoints + lootAmount})`;
    }

    return lootType;
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
            if (state.hero.maxLife < 7 || (
                check.lootObject.lootType !== 'peachOfImmortality'
                && check.lootObject.lootType !== 'peachOfImmortalityPiece'
            )) {
                // debugState(state);
                if (check.location) {
                    console.log(`Get ${getLootName(check.lootObject, state)} at ${getRandomizerZoneDescription(check.location.logicalZoneKey)}:${check.lootObject.id}`);
                } else {
                    console.log(`Get ${getLootName(check.lootObject, state)} from ${check.dialogueKey}:${check.optionKey}`);
                }
            }
        }
        state = applyLootObjectToState(state, check);
        // Indicate this check has already been opened.
        state.savedState.objectFlags[check.lootObject.id] = true;
        for (const flag of (check.progressFlags || [])) {
            state.savedState.objectFlags[flag] = true;
        }
        if (!finishedRandomizerSolution && randomizerGoalType === 'victoryPoints' && state.hero.victoryPoints >= randomizerGoal) {
            console.log('');
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            console.log('Talk to mom to win.');
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            console.log('');
            finishedRandomizerSolution = true;
        }
    }
    return state;
}

function collectAllLoot(allNodes: LogicNode[], startingNodes: LogicNode[], state: GameState, assignmentsState: AssignmentState): GameState {
    const reachableChecks: LootWithLocation[] = findReachableChecks(allNodes, startingNodes, state);
    // console.log(debugLocations(reachableChecks));
    for (const check of reachableChecks) {
        // Ignore checks that have already been made.
        if (state.savedState.objectFlags[check.lootObject.id]) {
            continue;
        }
        const assignment = assignmentsState.assignments.find(assignment => assignment.target.lootObject.id === check.lootObject.id);
        // Only gain the loot if it has already been assigned. Otherwise we pretend the check is still empty.
        if (assignment) {
            state = applyLootObjectToState(state, assignment.source);
            /*if (assignment.target.location) {
                console.log(`    Get ${getLootName(assignment.source.lootObject, state)} at ${assignment.target.location.zoneKey}:${assignment.target.lootObject.id}`);
            } else {
                console.log(`    Get ${getLootName(assignment.source.lootObject, state)} from ${assignment.target.dialogueKey}:${assignment.target.optionKey}`);
            }*/
        }
        // Set progress flags related to the check even if it has not been assigned, for example,
        // Talking to the Vanara Commander should still release elemental beasts even if a check is
        // not assigned to him yet.
        state.savedState.objectFlags[check.lootObject.id] = true;
        for (const flag of (check.progressFlags || [])) {
            state.savedState.objectFlags[flag] = true;
        }
    }
    return state;
}

function getLootAmount(loot: LootAssignment): number {
    if (loot.lootType === 'money' || loot.lootType === 'victoryPoint') {
        return loot.lootAmount || 1;
    }
    return 0;
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
        if (assignment.target.dialogueKey) {
            const {dialogueKey, optionKey} = assignment.target;
            const script = dialogueHash[dialogueKey].mappedOptions[optionKey];
            //console.log('Changing ', script, 'to');
            if (typeof script !== 'string') {
                console.error('Cannot replace method script options', {dialogueKey, optionKey});
                continue;
            }
            const [beginning, middle] = script.split('{item:');
            const end = middle.substring(middle.indexOf('}') + 1);
            const lootAmount = getLootAmount(assignment);
            const flag = `${dialogueKey}-${optionKey}`;
            const flagScript = `{flag:${flag}}`;
            if (dialogueKey === 'streetVendor') {
                addCheck(flag, 'overworld');
            } else if (dialogueKey === 'storageVanara') {
                addCheck(flag, 'treeVillage');
            } else {
                console.error('Unhandled dialogue key', dialogueKey);
            }
            let newScript;
            if (assignment.lootType === 'empty') {
                // Include the flag so that we can still count the check for the check counter.
                if (dialogueKey === 'streetVendor') {
                    newScript = `${beginning}{|}${flagScript}Haha, scammed you!{|}${end}`;
                } else {
                    newScript = `${beginning}{|}${flagScript}Huh, that's weird, I thought I had something for you!{|}${end}`;
                }
            } else if (lootAmount) {
                newScript = `${beginning}${flagScript}{item:${assignment.lootType}=${lootAmount}}${end}`;
            } else {
                newScript = `${beginning}${flagScript}{item:${assignment.lootType}}${end}`;
            }
            //console.log(newScript);
            dialogueHash[dialogueKey].mappedOptions[optionKey] = newScript;
        } else {
            const zoneKey = assignment.target.location.zoneKey;
            //console.log(assignment.source.lootObject.id, ' => ', assignment.target.lootObject.id);
            if (assignment.target.lootObject.type === 'dialogueLoot') {
                const {object} = findLootById(zones[zoneKey], assignment.target.lootObject.id);
                const npc = object as NPCDefinition;
                const npcKey = `${zoneKey}-${assignment.target.lootObject.id}`;
                addCheck(npcKey,  assignment.target.location.logicalZoneKey);
                const lootAmount = getLootAmount(assignment);
                let text: string;
                if (assignment.lootType === 'empty') {
                    // Include the flag so that we can still count the check for the check counter.
                    text = `I'm sorry you came all this way for nothing. {flag:${npcKey}}`;
                } else if (lootAmount) {
                    text = `Here you go! {flag:${npcKey}}{item:${assignment.lootType}=${lootAmount}}`;
                } else {
                    text = `Here you go! {flag:${npcKey}}{item:${assignment.lootType}}`;
                }
                npc.dialogueKey = npcKey;
                text += (assignment.target.progressFlags || []).map(flag => `{flag:${flag}}`).join(' ');
                // console.log(text);
                dialogueHash[npcKey] = {
                    key: npcKey,
                    options: [
                        {
                            logicCheck: { excludedFlags: [`${npcKey}`] },
                            text: [{dialogueType: 'quest', text}],
                        },
                        {
                            logicCheck: {},
                            text: [{text: 'You already got it!'}],
                        },
                    ],
                };
                assignment.target.lootObject.lootType = assignment.lootType;
                assignment.target.lootObject.lootAmount = assignment.lootAmount;
                assignment.target.lootObject.lootLevel = 0;
            } else {
                addCheck(assignment.target.lootObject.id,  assignment.target.location.logicalZoneKey);
                for (const target of findAllTargetObjects(assignment.target)) {
                    target.lootType = assignment.lootType;
                    target.lootAmount = assignment.lootAmount;
                    target.lootLevel = 0;
                }
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

export function verifyNodeConnections() {
    for (const currentNode of allNodes) {
        // console.log('node: ', currentNode.nodeId);
        const zone = getZone(currentNode.zoneId);
        if (!zone) {
            debugger;
            continue;
        }
        for (const path of (currentNode.paths || [])) {
            const nextNode = allNodes.find(node => node.nodeId === path.nodeId);
            if (!nextNode) {
                warnOnce(missingNodeSet, path.nodeId, 'Missing node: ');
                continue;
            }
        }
        for (const exit of (currentNode.exits || [])) {
            const { object } = findDoorById(zone, exit.objectId);
            const exitObject = object as EntranceDefinition;
            //console.log('->', exitObject.targetZone + ':' + exitObject.targetObjectId);
            const nextNode = allNodes.find(node =>
                (node !== currentNode || exitObject.targetObjectId !== exit.objectId)
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
        }
    }
}
