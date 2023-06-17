import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { isLogicValid } from 'app/content/logic';


export function getDialogue(dialogueKey: string): DialogueSet {
    return dialogueHash[dialogueKey];
}

export function selectDialogueOption(state: GameState, dialogueKey: string): DialogueOption {
    const dialogueSet = getDialogue(dialogueKey);
    if (!dialogueSet) {
        return null;
    }
    for (const dialogueOption of dialogueSet.options) {
        if (!isLogicValid(state, dialogueOption.logicCheck)) continue;
        return dialogueOption;
    }
    return null;
}
