import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { zones } from 'app/content/zones/zoneHash';
import { isRandomizer } from 'app/gameConstants';


interface DialogueData {
    // Used for dialogue stored directly on an object
    objectData?: {
        definition: NPCDefinition
        zoneKey: string
        floor: number
        isSpiritWorld: boolean
        coords: Coords
    }
    // Used for dialogue stored on the dialogue hash as an indexed option.
    hashData?: {
        npcKey: string
        optionIndex: number
        textIndex: number
    }
    // Metadata indicating this dialogue data was moved to a new index.
    // After all indexes are assigned, this will be used to report which
    // dialogue was moved during the assignment process.
    wasMoved?: boolean
    oldIndex?: number
}

let nextFreeIndex = 0;
export const allDialogue: DialogueData[] = [];
window['allDialogue'] = allDialogue;


export function getNextFreeIndex() {
    while(allDialogue[nextFreeIndex]) {
        nextFreeIndex++;
    }
    return nextFreeIndex;
}

// Adds the dialogue data to the given index, displacing any existing data.
function setDialogueIndex(index: number, data: DialogueData) {
    // If this spot was assigned, move whatever is there to a new location.
    const existingData = allDialogue[index];
    allDialogue[index] = data;
    if (!existingData) {
        return;
    }
    const newIndex = getNextFreeIndex();
    assignIndexToDialogueData(existingData, newIndex);
    allDialogue[newIndex] = existingData;
}

// Sets the index to the NPCDefinition/Dialogue described by the dialoguedata and marks it as moved.
function assignIndexToDialogueData(data: DialogueData, index: number): void {
    if (data.objectData) {
        if (!data.oldIndex && data.objectData.definition.dialogueIndex) {
            data.oldIndex = data.objectData.definition.dialogueIndex;
        }
        data.objectData.definition.dialogueIndex = index;
    } else if (data.hashData) {
        const textOption = dialogueHash[data.hashData.npcKey]?.options?.[data.hashData.optionIndex]?.text?.[data.hashData.textIndex];
        if (!textOption) {
            console.error('Missing text option for ', data.hashData);
        }
        if (!data.oldIndex && textOption.dialogueIndex) {
            data.oldIndex = textOption.dialogueIndex;
        }
        textOption.dialogueIndex = index;
    }
    data.wasMoved = true;
}

export function populateAllDialogue() {
    const newDialogueData: DialogueData[] = [];
    for (const zoneKey of Object.keys(zones)) {
        const zone = zones[zoneKey];
        // populate sections that already have an index to the allSections array.
        for (let floorIndex = 0; floorIndex < zone.floors.length; floorIndex++) {
            const floor = zone.floors[floorIndex];
            for (const grid of [floor.grid, floor.spiritGrid]) {
                const isSpiritWorld = grid === floor.spiritGrid;
                for (let y = 0; y < grid.length; y++) {
                    for (let x = 0; x < grid[y].length; x++) {
                        for (const object of (grid[y][x]?.objects || [])) {
                            if (object.type !== 'npc'
                                // Objects with negative dialogue index are ignored.
                                || object.dialogueIndex < 0
                                // Objects with dialogue key are handled on the dialogue hash.
                                || object.dialogueKey
                                || !object.dialogue
                            ) {
                                if (object.type === 'npc' && object.dialogueIndex >= 0) {
                                    delete object.dialogueIndex;
                                    console.log('Index removed from', object.id, ' in ', zoneKey);
                                }
                                continue;
                            }
                            const data: DialogueData = {
                                objectData: {
                                    definition: object,
                                    zoneKey,
                                    floor: floorIndex,
                                    coords: [x, y],
                                    isSpiritWorld,
                                },
                            };
                            if (object.dialogueIndex >= 0) {
                                setDialogueIndex(object.dialogueIndex, data);
                            } else {
                                newDialogueData.push(data);
                            }
                        }
                    }
                }
            }
        }
    }
    for (const npcKey of Object.keys(dialogueHash)) {
        const dialogueOptions = dialogueHash[npcKey].options;
        for (let optionIndex = 0; optionIndex < dialogueOptions.length; optionIndex++) {
            const textOptions = dialogueOptions[optionIndex].text;
            for (let textIndex = 0; textIndex < textOptions.length; textIndex++) {
                if (textOptions[textIndex].dialogueIndex < 0) {
                    continue;
                }
                const data: DialogueData = {
                    hashData: {
                        npcKey,
                        optionIndex,
                        textIndex,
                    },
                };
                if (textOptions[textIndex].dialogueIndex >= 0) {
                    setDialogueIndex(textOptions[textIndex].dialogueIndex, data);
                } else {
                    newDialogueData.push(data);
                }
            }
        }
    }
    // Assign indexes to any sections that didn't have one yet and add them to allDialogue array.
    for (const dialogueData of newDialogueData) {
        const newIndex = getNextFreeIndex();
        allDialogue[newIndex] = dialogueData;
        assignIndexToDialogueData(dialogueData, newIndex);
    }
    for (let index = 0; index < allDialogue.length; index++) {
        const dialogue = allDialogue[index];
        if (!isRandomizer && dialogue?.wasMoved) {
            console.log(dialogue.hashData
                ? dialogue.hashData
                : `Zone dialogue from ${dialogue.objectData.zoneKey}:${dialogue.oldIndex}`,
                ' was moved to ', index
            );
        }
    }
}
