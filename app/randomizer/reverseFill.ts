import {dialogueHash} from 'app/content/dialogue/dialogueHash';
import {getZone} from 'app/content/zones';
import {addCheck} from 'app/randomizer/checks';
import {
    findLootById,
    findLootObjects,
    findReachableChecks,
    findReachableNodes,
} from 'app/randomizer/find';
import {
    applyLootObjectToState,
    copyState,
    debugLocations,
    debugState,
    getMappedLootData,
    setAllFlagsInLogic,
} from 'app/randomizer/utils';
import {applySavedState} from 'app/scenes/fileSelect/setSaveFileToState';
import {getDefaultState} from 'app/state';

function assignLoot(randomizerState: RandomizerState, lootWithLocation: LootWithLocation, lootData: LootData) {
    // Note that we expect to overwrite assignments because we do assignments in two waves for victory points:
    // 1. Replace optional items with victory points
    // 2. Randomize location of all items.
    randomizerState.items.lootAssignments[lootWithLocation.lootObject.id] = lootData;
}

const victoryPoint: LootData = {lootType: 'victoryPoint', lootAmount: 1};

// Note that this uses stores the replacements on `state.randomizerState.lootAssignments` which is
// also used for the final randomization state, but these replacements are temporary and will
// be overwritten by the final item placement.
export function replaceTrash(randomizerState: RandomizerState) {
    const total = randomizerState.goal.victoryPoints?.total;
    if (!(total > 0)) {
        console.error('No victory points to hide:', randomizerState.goal);
        return;
    }
    const {allLootObjects} = randomizerState;
    const {lootAssignments, random} = randomizerState.items;
    // Try to replace as many unimportant checks with victory points as we can
    // until we either run out of checks or hit the victory point target.
    let victoryPointsHidden = 0, replaceGoodChecks = false;
    const shuffledLoot = random.shuffle(allLootObjects);
    while (victoryPointsHidden < randomizerState.goal.victoryPoints.total) {
        let remainingSilverNeeded = 12; // 5 for chakram, 5 for gold chakram, 2 for spike boots.
        let remainingGoldOreNeeded = 4; // 2 for gold chakram, 1 for forge boots, 1 for flying boots.
        let remainingPeachPiecesNeeded = 12;
        // This is required for the hack to add a full peach to sphere 0 below.
        let needsFullPeachPiece = true;
        for (const lootWithLocation of shuffledLoot) {
            const lootData = getMappedLootData(randomizerState, lootWithLocation.lootObject);
            switch (lootData.lootType) {
                case 'victoryPoint':
                    if (lootAssignments[lootWithLocation.lootObject.id]) {
                        lootAssignments[lootWithLocation.lootObject.id].lootAmount++;
                    } else {
                        // This is probably an error if this happens.
                        console.warn('Found a victory point in the base game', lootWithLocation);
                        assignLoot(randomizerState, lootWithLocation, {...victoryPoint});
                    }
                    victoryPointsHidden++;
                    break;
                case 'empty':
                case 'money':
                case 'peach':
                    assignLoot(randomizerState, lootWithLocation, {...victoryPoint});
                    victoryPointsHidden++;
                    break;
                case 'silverOre':
                    if (!replaceGoodChecks) {
                        break;
                    }
                    if (remainingSilverNeeded > 0) {
                        remainingSilverNeeded--;
                    } else {
                        console.log(lootWithLocation.lootObject.lootType, 'replacing with VP');
                        assignLoot(randomizerState, lootWithLocation, {...victoryPoint});
                        victoryPointsHidden++;
                    }
                    break;
                case 'goldOre':
                    if (!replaceGoodChecks) {
                        break;
                    }
                    if (remainingGoldOreNeeded > 0) {
                        remainingGoldOreNeeded--;
                    } else {
                        console.log(lootWithLocation.lootObject.lootType, 'replacing with VP');
                        assignLoot(randomizerState, lootWithLocation, {...victoryPoint});
                        victoryPointsHidden++;
                    }
                    break;
                case 'peachOfImmortality':
                    if (!replaceGoodChecks) {
                        break;
                    }
                    if (remainingPeachPiecesNeeded > 0 || needsFullPeachPiece) {
                        remainingPeachPiecesNeeded -= 4;
                        needsFullPeachPiece = false;
                    } else {
                        assignLoot(randomizerState, lootWithLocation, {...victoryPoint});
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
                        assignLoot(randomizerState, lootWithLocation, {...victoryPoint});
                        victoryPointsHidden++;
                    }
                    break;
            }
            if (victoryPointsHidden >= total) {
                break;
            }
        }
        replaceGoodChecks = true;
    }
}


function organizeLootObjects(randomizerState: RandomizerState, lootObjects: LootWithLocation[]) {
    const bigKeys: LootWithLocation[] = [];
    const smallKeys: LootWithLocation[] = [];
    const maps: LootWithLocation[] = [];
    const ore: LootWithLocation[] = [];
    const maxPriority: LootWithLocation[] = [];
    const highPriority: LootWithLocation[] = [];
    const mediumPriority: LootWithLocation[] = [];
    const lowPriority: LootWithLocation[] = [];
    const peachLoot: LootWithLocation[] = [];
    const trashLoot: LootWithLocation[] = [];
    for (const lootWithLocation of lootObjects) {
        const lootData = getMappedLootData(randomizerState, lootWithLocation.lootObject);
        // peach+peach pieces are considered progress since some areas may require certain life totals
        // and the first full peach grants the cat eyes ability.
        switch (lootData.lootType) {
            case 'money':
            case 'peach':
            case 'empty':
            case 'victoryPoint':
                trashLoot.push(lootWithLocation);
                break;
            case 'silverOre':
            case 'goldOre':
                ore.push(lootWithLocation);
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
            case 'nimbusCloud':
                maxPriority.push(lootWithLocation);
                break;
            // High priority checks are progress items that give a lot of checks when found in
            // Sphere 0. Placing these early will make generation failure less likely by
            // placing fewer lower progress items that could fill Sphere 0.
            // For example, the various elemental blessings do not add extra checks from Sphere 0,
            // so if too many items like these are placed early in Sphere 0 (along with Ores),
            // then it can be the case that there is no room left in Sphere 0 to place a progress
            // item required to reach more checks.
            case 'bow':
            case 'gloves':
            case 'ironBoots':
            case 'staff':
            case 'spiritSight':
            case 'astralProjection':
            case 'teleportation':
                highPriority.push(lootWithLocation);
                break;
            // Low priority checks are important items that give access to no or very few checks.
            case 'armor':
            case 'silverMailSchematics':
            case 'goldMailSchematics':
            case 'ironSkin':
                lowPriority.push(lootWithLocation);
                break;
            default:
                mediumPriority.push(lootWithLocation);
        }
    }

    return {
        bigKeys, smallKeys, maps,
        progressLoot: [ore, maxPriority, highPriority, mediumPriority, lowPriority],
        peachLoot, trashLoot
    };
}


function assignItemToLocation(randomizerState: RandomizerState, loot: LootWithLocation, assignedLocation: LootWithLocation): void {
    const {assignmentsState} = randomizerState.items;
    const lootData = getMappedLootData(randomizerState, loot.lootObject);
    //debugState(currentState);
    /*if (assignedLocation.location) {
        console.log('placing', loot.lootObject.lootType, ' at ', assignedLocation.location.zoneKey, assignedLocation.lootObject.id);
    } else {
        console.log('placing', loot.lootObject.lootType, ' to dialogue ', assignedLocation.dialogueKey, assignedLocation.optionKey);
    }*/
    assignmentsState.assignments[assignedLocation.lootObject.id] = {
        lootType: lootData.lootType,
        lootAmount: lootData.lootAmount,
        // Only progressive loot is placed in randomizer.
        lootLevel: 0,
        source: loot,
        target: assignedLocation,
    };
    assignmentsState.assignedContents.add(loot.lootObject.id);
    assignmentsState.assignedLocations.add(assignedLocation.lootObject.id);
}

function collectAllLoot(randomizerState: RandomizerState, simulatedState: GameState, ignoreUnassignedChecks = false): GameState {
    const {assignmentsState} = randomizerState.items;
    const reachableChecks: LootWithLocation[] = findReachableChecks(randomizerState, simulatedState, false);
    // console.log(debugLocations(reachableChecks));
    for (const check of reachableChecks) {
        // Ignore checks that have already been made.
        if (simulatedState.savedState.objectFlags[check.lootObject.id]) {
            continue;
        }
        const assignment = assignmentsState.assignments[check.lootObject.id];
        // Only gain the loot if it has already been assigned. Otherwise we pretend the check is still empty.
        if (assignment) {
            simulatedState = applyLootObjectToState(randomizerState, simulatedState, assignment.source);
            /*if (assignment.target.location) {
                console.log(`    Get ${getLootName(assignment.source.lootObject, state)} at ${assignment.target.location.zoneKey}:${assignment.target.lootObject.id}`);
            } else {
                console.log(`    Get ${getLootName(assignment.source.lootObject, state)} from ${assignment.target.dialogueKey}:${assignment.target.optionKey}`);
            }*/
        } else if (ignoreUnassignedChecks) {
            continue;
        }
        // Set progress flags related to the check even if it has not been assigned, for example,
        // Talking to the Vanara Commander should still release elemental beasts even if a check is
        // not assigned to him yet.
        simulatedState.savedState.objectFlags[check.lootObject.id] = true;
        for (const flag of (check.progressFlags || [])) {
            simulatedState.savedState.objectFlags[flag] = true;
        }
    }
    return simulatedState;
}

function placeItem(randomizerState: RandomizerState, originalState: GameState, loot: LootWithLocation): string {
    const {assignmentsState, random} = randomizerState.items;
    let currentState = copyState(originalState);
    let previousState = originalState;
    let counter = 0;
    do {
        if (counter++ > 100) {
            console.error('infinite loop');
            debugger;
            return null;
        }
        previousState = currentState;
        currentState = collectAllLoot(randomizerState, previousState);
        currentState = setAllFlagsInLogic(randomizerState, currentState);
    } while (currentState !== previousState);
    const allReachableChecks: LootWithLocation[] = findReachableChecks(randomizerState, currentState, false);
    const allAvailableChecks = allReachableChecks.filter(lootWithLocation => !assignmentsState.assignedLocations.has(lootWithLocation.lootObject.id));
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
    const assignedLocation = random.mutate().element(allAppropriateChecks);
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
    assignItemToLocation(randomizerState, loot, assignedLocation);
}

export function initializeReverseFill(randomizerState: RandomizerState) {
    const {allLootObjects, allNodes} = randomizerState;
    const {random} = randomizerState.items;

    //console.log({ allNodes, startingNodes });
    //console.log(allLootObjects.map(object => object.lootObject.lootType + ':' + object.location.zoneKey));
    randomizerState.items.initialState = getDefaultState();
    applySavedState(randomizerState.items.initialState, randomizerState.items.initialState.savedState);

    let finalState = copyState(randomizerState.items.initialState);
    for (const lootWithLocation of allLootObjects) {
        finalState = applyLootObjectToState(randomizerState, finalState, lootWithLocation);
        finalState.savedState.objectFlags[lootWithLocation.lootObject.id] = true;
        for (const flag of (lootWithLocation.progressFlags || [])) {
            finalState.savedState.objectFlags[flag] = true;
        }
    }
    finalState = setAllFlagsInLogic(randomizerState, finalState);
    //const initialCheckIds = findReachableChecks(allNodes, startingNodes, initialState).map(l => l.lootObject.id);
    //console.log(initialCheckIds);
    //debugState(finalState);
    const allReachableNodePaths = findReachableNodes(randomizerState, finalState);
    const allReachableNodes = new Set(allReachableNodePaths.map(nodePath => nodePath.node));
    for (const node of allNodes) {
        if (!allReachableNodes.has(node)) {
            debugState(finalState);
            console.warn(node.nodeId, ' will never be reachable');
            debugger;
        }
    }
    const allReachableCheckIds = findLootObjects(allReachableNodePaths, finalState).map(l => l.lootObject.id);
    for (const lootWithLocation of allLootObjects) {
        if (!allReachableCheckIds.includes(lootWithLocation.lootObject.id) && !finalState.savedState.objectFlags[lootWithLocation.lootObject.id]) {
            debugState(finalState);
            console.warn(lootWithLocation.lootObject.id, ' will never be reachable');
            debugger;
        }
    }
    // Populate metadata.excludesTowerStaff for all nodes based on the current final state+world.
    const originalStaffValue = finalState.hero.savedData.activeTools.staff;
    // Calculate the set of all nodes that can be reached with the staff in inventory.
    // The final state doesn't collect the staff, so we have to explicitly add it here (and then reset it below):
    finalState.hero.savedData.activeTools.staff |= 2;
    const allReachableNodesWithTowerStaff = new Set(findReachableNodes(randomizerState, finalState, false).map(path => path.node));
    for (const node of randomizerState.allNodes) {
        node.metadata = node.metadata ?? {assignableEntranceKeys: new Set(), nextNodes: new Set()};
        node.metadata.excludesTowerStaff = !allReachableNodesWithTowerStaff.has(node);
        //if (node.metadata.excludesTowerStaff) {
        //    console.log(node);
        //}
    }
    finalState.hero.savedData.activeTools.staff = originalStaffValue;

    //console.log({ allLootObjects, allReachableCheckIds });
    randomizerState.items.assignmentsState = {
        assignments: {},
        assignedLocations: new Set(),
        assignedContents: new Set(),
    }

    // TODO: Don't warn on missing entrances, like peachCaveTopEntrance, which is in a dark area and
    // is not expected to be in logic from the initial state.
    const initialReachableChecks = findReachableChecks(randomizerState, randomizerState.items.initialState, false);
    console.log('sphere 0 checks: ', initialReachableChecks.length);
    let placeFullPeachFirst = initialReachableChecks.length < 13;


    let { bigKeys, smallKeys, maps, peachLoot, progressLoot, trashLoot } = organizeLootObjects(randomizerState, allLootObjects);
    peachLoot = random.mutate().shuffle(peachLoot);
    randomizerState.items.trashLoot = random.mutate().shuffle(trashLoot);
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
        assignItemToLocation(randomizerState, fullPeach, location);
    }
    randomizerState.items.allItemSets = [bigKeys, smallKeys, maps, ...progressLoot, peachLoot];
    randomizerState.items.remainingLoot = [];
    for (let i = 0; i < randomizerState.items.allItemSets.length; i++) {
        randomizerState.items.allItemSets[i] = random.mutate().shuffle(randomizerState.items.allItemSets[i]);
        for (const item of randomizerState.items.allItemSets[i]) {
            randomizerState.items.remainingLoot.push(item);
        }
    }
}

export function reverseFill(randomizerState: RandomizerState, steps: number): boolean {
    // During reverse fill, frames take a while to process, so ignore frames that appear
    // throttled while it is running.
    window.throttleCount = 0;
    //const startTime = Date.now();
    const {allLootObjects} = randomizerState;
    const {
        random,
        assignmentsState,
        allItemSets,
        remainingLoot,
        initialState,
        trashLoot,
    } = randomizerState.items;

    for (let itemSet of allItemSets) {
        while (itemSet.length) {
            const itemToPlace = random.mutate().removeElement(itemSet);
            remainingLoot.splice(remainingLoot.indexOf(itemToPlace), 1);
            // Compute the current state without the chosen item or any of the previously placed items.
            //const startTime = Date.now();
            let simulatedState = copyState(initialState);
            //console.log('cloned ', (Date.now() - startTime) / 1000);
            for (const lootWithLocation of remainingLoot) {
                simulatedState = applyLootObjectToState(randomizerState, simulatedState, lootWithLocation);
            }
            //console.log('simulated state updated', Date.now() - startTime);
            //console.log('startState ', (Date.now() - startTime) / 1000);
            // console.log(state.hero);
            placeItem(randomizerState, simulatedState, itemToPlace);
            //console.log('place item', Date.now() - startTime);
            //console.log('placed ', (Date.now() - startTime) / 1000);

            // Update initialState + startingNodes after each item is placed.
            let counter = 0;
            let currentState = initialState, previousState = initialState;
            do {
                if (counter++ > 100) {
                    console.error('infinite loop');
                    debugger;
                    return null;
                }
                previousState = currentState;
                currentState = collectAllLoot(randomizerState, previousState, true);
                currentState = setAllFlagsInLogic(randomizerState, currentState);
            } while (currentState !== previousState);
            randomizerState.items.initialState = currentState;

            steps--;
            if (steps <= 0) {
                return false;
            }
        }
    }
    // Placing trash loot requires no simulation, so we can do this in a single frame.
    for (const location of allLootObjects) {
        if (!trashLoot.length) {
            break;
        }
        // console.log('Placing: ', loot.lootObject.id);
        if (assignmentsState.assignedLocations.has(location.lootObject.id)) {
            continue;
        }
        const loot = trashLoot.pop();
        assignItemToLocation(randomizerState, loot, location);
    }
    return true;
}

function getLootAmount(loot: LootAssignment): number {
    if (loot.lootType === 'money' || loot.lootType === 'victoryPoint') {
        return loot.lootAmount || 1;
    }
    return 0;
}

export function applyLootAssignments(randomizerState: RandomizerState): void {
    const {assignmentsState, dialogueReplacements} = randomizerState.items;
    const assignments = Object.values(assignmentsState.assignments);
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
            // it is not straightforward to calculate the correct zone based on
            // the dialogueKey+optionKey so we just manually set the correct zone
            // for each dialogue key check here.
            //console.log('Adding dialogue check', dialogueKey, flag);
            if (dialogueKey === 'streetVendor') {
                addCheck(randomizerState, flag, assignment, 'overworld');
            } else if (dialogueKey === 'storageVanara') {
                addCheck(randomizerState, flag, assignment, 'treeVillage');
            } else if (dialogueKey === 'citySmith') {
                addCheck(randomizerState, flag, assignment, 'holyCityInterior');
            } else if (dialogueKey === 'forgeSmith') {
                addCheck(randomizerState, flag, assignment, 'forge');
            } else if (dialogueKey === 'spiritTree') {
                addCheck(randomizerState, flag, assignment, 'dream');
            } else if (dialogueKey === 'ambrosia') {
                addCheck(randomizerState, flag, assignment, 'waterfallCave');
            } else if (dialogueKey === 'vanaraScientist') {
                addCheck(randomizerState, flag, assignment, 'forestTemple');
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
            dialogueReplacements[dialogueKey] = dialogueReplacements[dialogueKey] || {};
            dialogueReplacements[dialogueKey][optionKey] = newScript;
        } else {
            const zoneKey = assignment.target.location.zoneKey;
            //console.log(assignment.source.lootObject.id, ' => ', assignment.target.lootObject.id);
            if (assignment.target.lootObject.type === 'dialogueLoot') {
                const {object} = findLootById(getZone(zoneKey), assignment.target.lootObject.id);
                if (object?.type !== 'npc') {
                    console.error('Target of dialogueLoot was not an NPC', assignment.target.lootObject, object);
                    continue;
                }
                const npcKey = `${zoneKey}-${assignment.target.lootObject.id}`;
                addCheck(randomizerState, npcKey,  assignment, assignment.target.location.logicalZoneKey);
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
                dialogueReplacements[npcKey] = dialogueReplacements[npcKey] || {};
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
            } else {
                addCheck(randomizerState, assignment.target.lootObject.id, assignment, assignment.target.location.logicalZoneKey);
                assignLoot(randomizerState, assignment.target, {lootType: assignment.lootType, lootAmount: assignment.lootAmount, lootLevel: 0});
            }
        }
    }
}
