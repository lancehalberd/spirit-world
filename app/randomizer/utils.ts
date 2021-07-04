import _ from 'lodash';
import { isLogicValid } from 'app/content/logic';
import { lootEffects } from 'app/content/lootObject';
import { getZone, zones } from 'app/content/zones';

import { peachCaveNodes } from 'app/randomizer/logic/peachCaveLogic';
import { overworldNodes } from 'app/randomizer/logic/overworldLogic';

import { applySavedState, getDefaultState } from 'app/state';

import {
    BossObjectDefinition, EntranceDefinition,
    GameState, LogicNode, LootObjectDefinition, LootType, ObjectDefinition,
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
                        })
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
                        })
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

export type AnyLootDefinition = BossObjectDefinition | LootObjectDefinition;

interface LootAssignment {
    lootType: LootType
    lootLevel: number
    lootAmount: number
    target: AnyLootDefinition
    previousState: GameState
}

function findObjectById(zone: Zone, id: string, state: GameState = null, skipObject: ObjectDefinition = null) {
    let foundObjectOutOfLogic = null;
    for (let floor = 0; floor < zone.floors.length; floor++) {
        for( const areaGrid of [zone.floors[floor].spiritGrid, zone.floors[floor].grid]){
            for (let y = 0; y < areaGrid.length; y++) {
                for (let x = 0; x < areaGrid[y].length; x++) {
                    // All objects in 100% dark areas are considered out of logic unless you can see in the dark.
                    const isOutOfLogic = state && areaGrid[y][x]?.dark >= 100 && !state.hero.passiveTools.catEyes;
                    for (const object of (areaGrid[y][x]?.objects || [])) {
                        if (object.id === id && object !== skipObject) {
                            if (isOutOfLogic) {
                                foundObjectOutOfLogic = object;
                                break;
                            }
                            return object;
                        }
                    }
                }
            }
        }
    }
    if (!foundObjectOutOfLogic) {
        console.error('Missing object: ', id);
    }
}


function getLootObjects(nodes: LogicNode[], state: GameState = null): AnyLootDefinition[] {
    const lootObjects: AnyLootDefinition[] = [];
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
            const object = findObjectById(zone, check.objectId, state) as AnyLootDefinition;
            if (!object) {
                continue;
            }
            lootObjects.push(object);
        }
    }
    return lootObjects;
}

function findReachableChecks(allNodes: LogicNode[], startingNodes: LogicNode[], assignedChecks: string[], state: GameState): string[] {
    const reachableNodes: LogicNode[] = findReachableNodes(allNodes, startingNodes, state);
    return getLootObjects(reachableNodes, state).map(object => object.id).filter(id => !assignedChecks.includes(id));
}

function findReachableNodes(allNodes: LogicNode[], startingNodes: LogicNode[], state: GameState): LogicNode[] {
    const reachableNodes = [...startingNodes];
    for (let i = 0; i < reachableNodes.length; i++) {
        const currentNode = reachableNodes[i];
        const zone = getZone(currentNode.zoneId);
        if (!zone) {
            continue
        }
        for (const path of (currentNode.paths || [])) {
            if (path.logic && !isLogicValid(state, path.logic)) {
                continue;
            }
            const nextNode = allNodes.find(node => node.nodeId === path.nodeId);
            if (!nextNode) {
                console.error('Missing node: ', path.nodeId);
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
            const exitObject = findObjectById(zone, exit.objectId, state) as EntranceDefinition;
            if (!exitObject) {
                continue;
            }
            const nextNode = allNodes.find(node =>
                node.zoneId === exitObject.targetZone
                && node.entranceIds?.includes(exitObject.targetObjectId)
            );
            if (!nextNode) {
                console.warn('Missing node for exit: ', exitObject.targetZone, exitObject.targetObjectId);
                continue;
            }
            if (!reachableNodes.includes(nextNode)) {
                reachableNodes.push(nextNode);
            }
        }
    }
    return reachableNodes;
}

function organizeLootObjects(lootObjects: AnyLootDefinition[], state: GameState) {
    const progressLoot: AnyLootDefinition[] = [];
    const trashLoot: AnyLootDefinition[] = [];
    for (const lootObject of lootObjects) {
        switch (lootObject.lootType) {
            case 'peachOfImmortality':
            case 'peachOfImmortalityPiece':
                if (state.hero.passiveTools.catEyes) {
                    trashLoot.push(lootObject);
                    continue;
                }
                break;
            case 'money':
            case 'peach':
            case 'empty':
                trashLoot.push(lootObject);
                continue;
        }

        progressLoot.push(lootObject);
    }

    return { progressLoot, trashLoot };
}

function applyLootObjectToState(state: GameState, lootObject: AnyLootDefinition): GameState {
    const onPickup = lootEffects[lootObject.lootType] || lootEffects.unknown;
    const stateCopy = _.cloneDeep(state);
    onPickup(stateCopy, lootObject);
    return stateCopy;
}

export function generateAssignments(allNodes: LogicNode[], startingNodes: LogicNode[]): LootAssignment[] {
    console.log({ allNodes, startingNodes });
    const allLootObjects = getLootObjects(allNodes);
    let finalState = getDefaultState();
    applySavedState(finalState, finalState.savedState);
    for (const lootObject of allLootObjects) {
        finalState = applyLootObjectToState(finalState, lootObject);
    }
    const allReachableChecks = findReachableChecks(allNodes, startingNodes, [], finalState);
    for (const lootObject of allLootObjects) {
        if (!allReachableChecks.includes(lootObject.id)) {
            console.warn(lootObject.id, ' will never be reachable');
        }
    }
    console.log({ allLootObjects, allReachableChecks });
    const assignments: LootAssignment[] = [];
    const assignedCheckLocations: string[] = [];
    const assignedCheckContents: string[] = [];
    let state = getDefaultState();
    applySavedState(state, state.savedState);
    let counter = 1;
    while (true) {
        if (counter++ % 100 === 0) {
            console.error('Infinite Loop?');
            debugger;
            return [];
        }
        if (assignments.length >= allReachableChecks.length) {
            break;
        }
        console.log('-------');
        //console.log({ assignedCheckContents, assignedCheckLocations, assignments, state });
        const assignableChecks: string[] = findReachableChecks(allNodes, startingNodes, assignedCheckLocations, state);
        //console.log({ assignableChecks });
        if (assignableChecks.length === 0) {
            if (assignments.length === 0) {
                console.error('Failed to generate game');
                debugger;
                return [];
            }
            const lastAssignment = assignments.pop();
            assignedCheckLocations.pop();
            assignedCheckContents.pop();
            state = lastAssignment.previousState;
            continue;
        }
        const remainingLootObjects = allLootObjects.filter(object => !assignedCheckContents.includes(object.id));
        const { progressLoot, trashLoot } = organizeLootObjects(remainingLootObjects, state);
        //console.log({ remainingLootObjects, progressLoot, trashLoot });
        const lootObject = (Math.random() < 1 / assignableChecks.length) ? _.sample(progressLoot) : _.sample(trashLoot);
        const check = _.sample(assignableChecks);
        //console.log({ lootObject, check });
        assignments.push({
            lootType: lootObject.lootType,
            lootAmount: lootObject.lootAmount,
            lootLevel: lootObject.lootLevel,
            target: allLootObjects.find(object => object.id === check),
            previousState: state,
        });
        assignedCheckContents.push(lootObject.id);
        assignedCheckLocations.push(check);
        state = applyLootObjectToState(state, lootObject);
    }
    return assignments;
}

export function applyLootAssignments(assignments: LootAssignment[]): void {
    console.log('applying assignments:');
    console.log(assignments);
    for (const assignment of assignments) {
        assignment.target.lootType = assignment.lootType;
        assignment.target.lootAmount = assignment.lootAmount;
        assignment.target.lootLevel = assignment.lootLevel;
    }
}

const allNodes = [
    ...peachCaveNodes,
    ...overworldNodes,
];

applyLootAssignments(generateAssignments(allNodes, [peachCaveNodes[0]]));

