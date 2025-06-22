
import { enemyTypes } from 'app/content/enemies';
import {
    SPAWN_LOCATION_DEMO,
    SPAWN_LOCATION_FULL,
    SPAWN_LOCATION_WATERFALL_VILLAGE,
} from 'app/content/spawnLocations';

import { mainOverworldNode } from 'app/randomizer/logic/overworldLogic';
import { forgeNodes } from 'app/randomizer/logic/forgeLogic';
//import { craterNodes } from 'app/randomizer/logic/craterLogic';
import { staffTowerNodes } from 'app/randomizer/logic/staffTower';
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
    const entrance1 = staffTowerNodes.find(node => node.nodeId === 'staffTowerF1Downstairs');
    const entrance2 = staffTowerNodes.find(node => node.nodeId === 'staffTowerF4Spirit');
    finalState.hero.savedData.elements.lightning = 0;
    finalState.hero.savedData.activeTools.staff = 0;
    finalState.hero.savedData.activeTools.clone = 1;
    finalState.hero.savedData.equipment.ironBoots = 1;
    finalState.savedState.dungeonInventories.staffTower.smallKeys = 0;
    finalState.savedState.dungeonInventories.staffTower.totalSmallKeys = 0;
    finalState = setAllFlagsInLogic(finalState, allNodes,  [mainOverworldNode]);
    //initialState.hero.savedData.activeTools.staff = 1;
    //initialState = setAllFlagsInLogic(initialState, craterNodes,  [entrance]);
    const reachableNodes = findReachableNodes(staffTowerNodes, [entrance1, entrance2], finalState);
    console.log(reachableNodes);
    for (const node of staffTowerNodes) {
        if (!reachableNodes.includes(node)) {
            console.log('Could not reach node', node);
        }
    }
}
window.forgeNodes = forgeNodes;
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
    Object.assign(SPAWN_LOCATION_DEMO, SPAWN_LOCATION_WATERFALL_VILLAGE);
    Object.assign(SPAWN_LOCATION_FULL, SPAWN_LOCATION_WATERFALL_VILLAGE);
}
