import { GameState, LogicCheck } from 'app/types';


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

export const logicHash: {[key: string]: LogicCheck} = {
    frozenLake: {
        // Frozen lake is only displayed after beasts escaped.
        requiredFlags: ['elementalBeastsEscaped'],
        // Frozen lake is replaced by thawed lake after the frost beast is defeated.
        excludedFlags: ['frostBeast'],
    },
    mountainLava: {
        // Mountain lava is only displayed after beasts escaped.
        requiredFlags: ['elementalBeastsEscaped'],
        // Mountain lava is replaced by cooled lava after the flame beast is defeated.
        excludedFlags: ['flameBeast'],
    },
};
