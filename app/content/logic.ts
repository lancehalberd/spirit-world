import { GameState, LogicCheck } from 'app/types';


export function isItemLogicTrue(state: GameState, itemFlag: string): boolean {
    let level = 1, levelString;
    if (itemFlag.includes(':')) {
        [itemFlag, levelString] = itemFlag.split(':');
        level = parseInt(levelString, 10);
    }
    return state.hero.activeTools[itemFlag] >= level || state.hero.passiveTools[itemFlag] >= level
        || state.hero.elements[itemFlag] >= level || state.hero.equipment[itemFlag] >= level;
}

export function isLogicValid(state: GameState, logic: LogicCheck, invertLogic = false): boolean {
    const trueResult = !invertLogic, falseResult = !!invertLogic;
    for (const requiredFlag of logic.requiredFlags) {
        if (requiredFlag[0] === '$') {
            if (!isItemLogicTrue(state, requiredFlag.substring(1))) {
                return falseResult;
            }
            continue;
        }
        if (!state.savedState.objectFlags[requiredFlag]) {
            return falseResult;
        }
    }
    for (const excludedFlag of logic.excludedFlags) {
        if (excludedFlag[0] === '$') {
            if (isItemLogicTrue(state, excludedFlag.substring(1))) {
                return falseResult;
            }
            continue;
        }
        if (state.savedState.objectFlags[excludedFlag]) {
            return falseResult;
        }
    }
    if (logic.zones?.length && !logic.zones.includes(state.location.zoneKey)) {
        return falseResult;
    }
    if (logic.staffTowerLocation) {
        if (state.hero.activeTools.staff >= 2 || logic.staffTowerLocation !== state.savedState.staffTowerLocation) {
            return falseResult;
        }
    }
    return trueResult;
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
    towerStorm: {
        // Storm around the tower is only shown after the beasts escape
        requiredFlags: ['elementalBeastsEscaped'],
        // Storm is gone after the storm beast is gone.
        excludedFlags: ['stormBeast'],
    },
    desertTower: {
        requiredFlags: [],
        excludedFlags: [],
        staffTowerLocation: 'desert',
    },
    forestTower: {
        requiredFlags: [],
        excludedFlags: [],
        staffTowerLocation: 'forest',
    },
    mountainTower: {
        requiredFlags: [],
        excludedFlags: [],
        staffTowerLocation: 'mountain',
    },
    towerStaff: {
        requiredFlags: ['$staff:2'],
        excludedFlags: [],
    },
};
