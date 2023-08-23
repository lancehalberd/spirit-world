import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { isLogicValid } from 'app/content/logic';


export function getDialogue(dialogueKey: string): DialogueSet {
    return dialogueHash[dialogueKey];
}

export function selectDialogueOption(state: GameState, dialogueKey: string, object?: ObjectInstance): DialogueOption {
    const dialogueSet = getDialogue(dialogueKey);
    if (!dialogueSet) {
        return null;
    }
    for (const dialogueOption of dialogueSet.options) {
        if (dialogueOption.objectId && dialogueOption.objectId !== object?.definition?.id) {
            continue;
        }
        if (dialogueOption.logicCheck && !isLogicValid(state, dialogueOption.logicCheck)) {
            continue;
        }
        return dialogueOption;
    }
    return null;
}

export function isDialogueHeard(state: GameState, dialogueIndex: number): boolean {
    if (!(dialogueIndex >= 0)) {
        return false;
    }
    const numberIndex = (dialogueIndex / 32) | 0;
    const bitIndex = dialogueIndex % 32;
    return !!(state.savedState.heardDialogue[numberIndex] >> bitIndex & 1)
}

export function setDialogueHeard(state: GameState, dialogueIndex: number) {
    if (!(dialogueIndex >= 0)) {
        return;
    }
    const numberIndex = (dialogueIndex / 32) | 0;
    const bitIndex = dialogueIndex % 32;
    if (!(state.savedState.heardDialogue[numberIndex] >> bitIndex & 1)) {
        state.savedState.heardDialogue[numberIndex] = state.savedState.heardDialogue[numberIndex] || 0;
        state.savedState.heardDialogue[numberIndex] = state.savedState.heardDialogue[numberIndex] | (1 << bitIndex);
    }
}
