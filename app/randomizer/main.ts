
import { enemyTypes } from 'app/content/enemies';
import {
    SPAWN_LOCATION_DEMO,
    SPAWN_LOCATION_FULL,
    SPAWN_LOCATION_WATERFALL_VILLAGE,
} from 'app/content/spawnLocations';

import { mainOverworldNode } from 'app/randomizer/logic/overworldLogic';
import { forgeNodes } from 'app/randomizer/logic/forgeLogic';
import { findLootObjects, findReachableNodes } from 'app/randomizer/find';
import { applySavedState, getDefaultState } from 'app/state';
import { allNodes } from 'app/randomizer/allNodes';
import {
    applyLootAssignments, applyLootObjectToState, calculateKeyLogic, copyState, everyObject,
    reverseFill, setAllFlagsInLogic
} from 'app/randomizer/utils';
import { randomizeEntrances } from 'app/randomizer/entranceRandomizer';
import SRandom from 'app/utils/SRandom';

import { itemSeed, enemySeed, entranceSeed } from 'app/gameConstants';

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
    finalState = setAllFlagsInLogic(finalState, allNodes,  [mainOverworldNode]);
    const reachableNodes = findReachableNodes(forgeNodes, [forgeNodes.find(node => node.nodeId === 'forgeEntrance')], finalState);
    console.log(reachableNodes);
    console.log(finalState.savedState.dungeonInventories.staffTower);
    for (const node of forgeNodes) {
        if (!reachableNodes.includes(node)) {
            console.log('Could not reach node', node);
        }
    }
}
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

if (enemySeed) {
    const enemyRandom = SRandom.seed(enemySeed)
    everyObject((location, zone, area, object) => {
        if (object.type === 'enemy') {
            object.enemyType = enemyRandom.element([...enemyTypes]);
            enemyRandom.generateAndMutate();
        }
    });
}

if (entranceSeed) {
    randomizeEntrances(SRandom.seed(entranceSeed));
}

if (itemSeed) {
    try {
        const assignmentsState = reverseFill(SRandom.seed(itemSeed), allNodes, [mainOverworldNode]);
        applyLootAssignments(assignmentsState.assignments);
    } catch (e) {
        console.error('Failed to generate seed', e);
    }
    for (let key in SPAWN_LOCATION_WATERFALL_VILLAGE) {
        SPAWN_LOCATION_DEMO[key] = SPAWN_LOCATION_WATERFALL_VILLAGE[key];
        SPAWN_LOCATION_FULL[key] = SPAWN_LOCATION_WATERFALL_VILLAGE[key];
    }
}
