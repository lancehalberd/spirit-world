import { dialogueHash } from 'app/content/dialogue/dialogueHash';

import { DialogueOption, DialogueSet, GameState, LogicCheck } from 'app/types';

// Every zone needs to be imported here in order to be added to the zones hash.
export * from 'app/content/dialogue/dialogueHash';
export * from 'app/content/dialogue/elder';
export * from 'app/content/dialogue/mom';
export * from 'app/content/dialogue/vanaraGuard';
export * from 'app/content/dialogue/vanaraVillager';

export function getDialogue(dialogueKey: string): DialogueSet {
    return dialogueHash[dialogueKey];
}

export function isItemLogicTrue(state: GameState, itemFlag: string): boolean {
    return state.hero.activeTools[itemFlag] || state.hero.passiveTools[itemFlag]
        || state.hero.elements[itemFlag]  || state.hero.equipment[itemFlag];
}

export function isLogicValid(state: GameState, logic: LogicCheck): boolean {
    for (const requiredFlag of logic.requiredFlags) {
        if (requiredFlag[0] === '$') {
            if (!isItemLogicTrue(state, requiredFlag.substring(1))) {
                return false;
            }
            continue;
        }
        if (!state.savedState.objectFlags[requiredFlag]) {
            return false;
        }
    }
    for (const excludedFlag of logic.excludedFlags) {
        if (excludedFlag[0] === '$') {
            if (isItemLogicTrue(state, excludedFlag.substring(1))) {
                return false;
            }
            continue;
        }
        if (state.savedState.objectFlags[excludedFlag]) {
            return false;
        }
    }
    if (logic.zones?.length) {
        return logic.zones.includes(state.location.zoneKey);
    }
    return true;
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
