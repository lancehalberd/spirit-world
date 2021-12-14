import { cloneDeep } from 'lodash';
import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { isLogicValid } from 'app/content/logic';
import { lootEffects } from 'app/content/lootObject';
import { getZone, zones } from 'app/content/zones';
import {
    SPAWN_LOCATION_DEMO,
    SPAWN_LOCATION_FULL,
    SPAWN_LOCATION_PEACH_CAVE_EXIT,
} from 'app/content/spawnLocations';

import { peachCaveNodes } from 'app/randomizer/logic/peachCaveLogic';
import { treeVillageNodes, waterfallCaveNodes } from 'app/randomizer/logic/otherLogic'
import { overworldNodes } from 'app/randomizer/logic/overworldLogic';
import { tombNodes } from 'app/randomizer/logic/tombLogic';
import { warTempleNodes } from 'app/randomizer/logic/warTempleLogic';
import { cocoonNodes } from 'app/randomizer/logic/cocoonLogic';
import { waterfallTowerNodes } from 'app/randomizer/logic/waterfallTower';

import { readGetParameter } from 'app/utils/index';
import SRandom from 'app/utils/SRandom';

import { applySavedState, getDefaultState } from 'app/state';

import {
    BossObjectDefinition, DialogueLootDefinition, EntranceDefinition,
    GameState, LogicNode, LootObjectDefinition, LootType, NPCDefinition,
    ObjectDefinition,
    Zone, ZoneLocation,
} from 'app/types';

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
            if (exitObject.status === 'locked' && !exitObject.requiredKeysForLogic) {
                countRequiredKeysForEntrance(allNodes, startingNodes, zone.key, exitObject);
            }
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
    console.log(exitToUpdate.id, exitToUpdate.requiredKeysForLogic);
}

function organizeLootObjects(lootObjects: LootWithLocation[]) {
    const bigKeys: LootWithLocation[] = [];
    const smallKeys: LootWithLocation[] = [];
    const progressLoot: LootWithLocation[] = [];
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
            default:
                progressLoot.push(lootWithLocation);
        }
    }

    return { bigKeys, smallKeys, progressLoot, trashLoot };
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
    onPickup(stateCopy, {...lootWithLocation.lootObject, lootLevel: 0});
    if (!stateCopy.hero.passiveTools.catEyes && stateCopy.hero.maxLife > 4) {
        stateCopy.hero.passiveTools.catEyes = 1;
    }
    return stateCopy;
}


export function reverseFill(random: typeof SRandom, allNodes: LogicNode[], startingNodes: LogicNode[]): LootAssignment[] {
    calculateKeyLogic(allNodes, startingNodes);
    // console.log({ allNodes, startingNodes });
    const allLootObjects = getLootObjects(allNodes);
    let initialState = getDefaultState();
    applySavedState(initialState, initialState.savedState);

    let finalState = copyState(initialState);
    for (const lootWithLocation of allLootObjects) {
        finalState = applyLootObjectToState(finalState, lootWithLocation);
    }
    // console.log({ finalState });
    const allReachableCheckIds = findReachableChecks(allNodes, startingNodes, finalState).map(l => l.lootObject.id);
    for (const lootWithLocation of allLootObjects) {
        if (!allReachableCheckIds.includes(lootWithLocation.lootObject.id)) {
            console.warn(lootWithLocation.lootObject.id, ' will never be reachable');
        }
    }
    // console.log({ allLootObjects, allReachableCheckIds });
    const assignmentsState: AssignmentState = {
        assignments: [],
        assignedLocations: [],
        assignedContents: [],
    }
    let { bigKeys, smallKeys, progressLoot, trashLoot } = organizeLootObjects(allLootObjects);
    progressLoot = random.shuffle(progressLoot);
    random.generateAndMutate();
    trashLoot = random.shuffle(trashLoot);
    random.generateAndMutate();
    let remainingLoot = [...bigKeys, ...smallKeys, ...progressLoot];
    for (let itemSet of [bigKeys, smallKeys, progressLoot]) {
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
    return assignmentsState.assignments;
}

function placeItem(random: typeof SRandom, allNodes: LogicNode[], startingNodes: LogicNode[], originalState: GameState, assignmentsState: AssignmentState, loot: LootWithLocation): string {
    // console.log('Placing: ', loot.lootObject.id);
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
    let assignableChecks: LootWithLocation[] = findReachableChecks(allNodes, startingNodes, currentState);
    assignableChecks = assignableChecks.filter(lootWithLocation => !assignmentsState.assignedLocations.includes(lootWithLocation.lootObject.id));
    if (loot.lootObject.lootType === 'bigKey' || loot.lootObject.lootType === 'smallKey') {
        assignableChecks = assignableChecks.filter(lootWithLocation => lootWithLocation.location.zoneKey === loot.location.zoneKey);
    }
    //console.log(currentState);
    //console.log(assignableChecks);
    const assignedLocation = random.element(assignableChecks);
    random.generateAndMutate();
    if (!assignedLocation) {
        console.error('Failed to place item', { assignmentsState, originalState, currentState, loot});
        debugger;
        throw new Error('Failed to place item')
    }
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
    console.log('applying assignments:');
    // console.log(assignments);
    for (const assignment of assignments) {
        console.log(assignment.source.lootObject.id, ' => ', assignment.target.lootObject.id);
        if (assignment.target.lootObject.type === 'dialogueLoot') {
            const {object} = findObjectById(zones[assignment.target.location.zoneKey], assignment.target.lootObject.id);
            const npc = object as NPCDefinition;
            const npcKey = `${assignment.target.location.zoneKey}-${assignment.target.lootObject.id}`;
            const number = assignment.lootAmount || assignment.lootLevel;
            let text: string;
            if (assignment.lootType === 'empty') {
                text = `I'm sorry you came all this way for nothing.`;
            } else if (number) {
                text = `Here you go! {flag:${npcKey}}{item:${assignment.lootType}:${number}}`;
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
        } else {
            for (const target of findAllTargetObjects(assignment.target)) {
                target.lootType = assignment.lootType;
                target.lootAmount = assignment.lootAmount;
                target.lootLevel = assignment.lootLevel;
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

const allNodes = [
    ...overworldNodes,
    ...waterfallCaveNodes,
    ...peachCaveNodes,
    ...treeVillageNodes,
    ...tombNodes,
    ...warTempleNodes,
    ...cocoonNodes,
    ...waterfallTowerNodes,
];

const seed = readGetParameter('seed');

if (seed) {
    applyLootAssignments(reverseFill(SRandom.seed(Number(seed)), allNodes, [overworldNodes[0]]));
    for (let key in SPAWN_LOCATION_PEACH_CAVE_EXIT) {
        SPAWN_LOCATION_DEMO[key] = SPAWN_LOCATION_PEACH_CAVE_EXIT[key];
        SPAWN_LOCATION_FULL[key] = SPAWN_LOCATION_PEACH_CAVE_EXIT[key];
    }

}

