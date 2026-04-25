import {getRandomizerZoneDescription} from 'app/content/hints';
import {getLootName} from 'app/content/loot';
import {findReachableChecks} from 'app/randomizer/find';
import {getPendingRandomizerGoals} from 'app/randomizer/goal';
import {applyLootObjectToState, getMappedLootData, setAllFlagsInLogic} from 'app/randomizer/utils';
import {applySavedState} from 'app/scenes/fileSelect/setSaveFileToState';
import {getDefaultState, getState} from 'app/state';

let finishedRandomizerSolution = false;
export function showRandomizerSolution(): void {
    const randomizerState = getState().randomizerState;
    let currentState = getDefaultState();
    applySavedState(currentState, currentState.savedState);
    let previousState = currentState;
    let counter = 0;
    finishedRandomizerSolution = false;
    do {
        if (counter++ > 200) {
            console.error('infinite loop');
            debugger;
            return null;
        }
        previousState = currentState;
        console.log(`Sphere ${counter}`);
        currentState = collectAllLootForSolution(randomizerState, previousState);
        currentState = setAllFlagsInLogic(randomizerState, currentState);
    } while (currentState !== previousState);
}
window.showRandomizerSolution = showRandomizerSolution;

const trashTypes: LootType[] = ['money', 'empty', 'map'];
function collectAllLootForSolution(randomizerState: RandomizerState, simulatedState: GameState): GameState {
    const reachableChecks: LootWithLocation[] = findReachableChecks(randomizerState, simulatedState);
    for (const check of reachableChecks) {
        // We can only open checks that have been assigned, contents of other checks are not yet determined.
        //if (!assignmentsState.assignedLocations.includes(check.lootObject.id)) {
        //    continue;
        //}
        // Don't open a check that has already been opened.
        if (simulatedState.savedState.objectFlags[check.lootObject.id]) {
            continue;
        }
        const {lootType} = getMappedLootData(randomizerState, check.lootObject);
        if (!trashTypes.includes(lootType)) {
            if (simulatedState.hero.savedData.maxLife < 7 || (
                lootType !== 'peachOfImmortality'
                && lootType !== 'peachOfImmortalityPiece'
            )) {
                // debugState(state);
                if (check.location) {
                    console.log(`Get ${getLootName(simulatedState, {lootType})} at ${getRandomizerZoneDescription(check.location.logicalZoneKey)}:${check.lootObject.id}`);
                } else {
                    console.log(`Get ${getLootName(simulatedState, {lootType})} from ${check.dialogueKey}:${check.optionKey}`);
                }
                if (randomizerState.entrances && check.path.path.length) {
                    console.log(' ' + check.path.path.map(segment => {
                        return segment.node.nodeId
                            + (segment.exit ? `[${segment.exit.objectId}]` : '');
                    }).join('>'));
                }
            }
        }
        simulatedState = applyLootObjectToState(randomizerState, simulatedState, check);
        // Indicate this check has already been opened.
        simulatedState.savedState.objectFlags[check.lootObject.id] = true;
        for (const flag of (check.progressFlags || [])) {
            simulatedState.savedState.objectFlags[flag] = true;
        }
        const requirementsLeft = getPendingRandomizerGoals(randomizerState, simulatedState);
        if (!finishedRandomizerSolution && requirementsLeft.length === 0) {
            console.log('');
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            console.log('Talk to mom to win.');
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            console.log('');
            finishedRandomizerSolution = true;
        }
    }
    return simulatedState;
}
