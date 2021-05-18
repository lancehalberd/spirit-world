import { dialogueHash } from 'app/content/dialogue/dialogueHash';
import { isLogicValid } from 'app/content/logic';

import { DialogueOption, DialogueSet, GameState } from 'app/types';

// Every zone needs to be imported here in order to be added to the zones hash.
export * from 'app/content/dialogue/dialogueHash';
export * from 'app/content/dialogue/elder';
export * from 'app/content/dialogue/mom';
export * from 'app/content/dialogue/tombGuardian';
export * from 'app/content/dialogue/vanaraGuard';
export * from 'app/content/dialogue/vanaraCommander';
export * from 'app/content/dialogue/vanaraVillager';

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
