import { AndLogicCheck, GameState, LogicCheck, OrLogicCheck } from 'app/types';

export function andLogic(...logicChecks: LogicCheck[]): AndLogicCheck {
    return { operation: 'and', logicChecks};
}
window['andLogic'] = andLogic;

export function orLogic(...logicChecks: LogicCheck[]): OrLogicCheck {
    return { operation: 'or', logicChecks};
}
window['orLogic'] = orLogic;

export function isItemLogicTrue(state: GameState, itemFlag: string): boolean {
    let level = 1, levelString;
    if (itemFlag.includes(':')) {
        [itemFlag, levelString] = itemFlag.split(':');
        level = parseInt(levelString, 10);
    }
    if (itemFlag === 'weapon') {
        return state.hero.weapon >= level;
    }
    return state.hero.activeTools[itemFlag] >= level || state.hero.passiveTools[itemFlag] >= level
        || state.hero.elements[itemFlag] >= level || state.hero.equipment[itemFlag] >= level;
}

export function isLogicValid(state: GameState, logic: LogicCheck, invertLogic = false): boolean {
    const trueResult = !invertLogic, falseResult = !!invertLogic;
    if (logic.operation === 'and') {
        return logic.logicChecks.some(logicCheck => !isLogicValid(state, logicCheck)) ? falseResult : trueResult;
    }
    if (logic.operation === 'or') {
        return logic.logicChecks.some(logicCheck => isLogicValid(state, logicCheck)) ? trueResult : falseResult;
    }
    for (const requiredFlag of (logic?.requiredFlags || [])) {
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
    for (const excludedFlag of (logic?.excludedFlags || [])) {
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
window['isLogicValid'] = isLogicValid;

export const hasClone: LogicCheck = { requiredFlags: ['$clone', '$catEyes'] };
export const hasIronBoots: LogicCheck = { requiredFlags: ['$ironBoots'] };
export const hasAstralProjection: LogicCheck = { requiredFlags: ['$astralProjection', '$spiritSight', '$catEyes'] };
export const hasTeleportation: LogicCheck = { requiredFlags: ['$astralProjection', '$spiritSight', '$teleportation', '$catEyes'] };
export const hasGloves: LogicCheck = { requiredFlags: ['$gloves'] };
export const hasMitts: LogicCheck = { requiredFlags: ['$gloves:2'] };
export const hasSpiritSight: LogicCheck = { requiredFlags: ['$spiritSight', '$catEyes'] };
export const hasSmallKey: LogicCheck = { requiredFlags: ['$smallKey'] };
export const hasBigKey: LogicCheck = { requiredFlags: ['$bigKey'] };

// This check will be added automatically to any tiles that have 100% darkness effect.
//const hasEyes: LogicCheck = { requiredFlags: ['$catEyes:1'] };
export const hasBow: LogicCheck = {requiredFlags: ['$bow', '$catEyes']};
export const hasRoll: LogicCheck = {requiredFlags: ['$roll', '$catEyes']};
export const hasStaff: LogicCheck = {requiredFlags: ['$staff', '$catEyes']};
export const hasWeapon: OrLogicCheck = orLogic({requiredFlags: ['$weapon']}, hasBow);
export const hasMediumRange: OrLogicCheck = orLogic({requiredFlags: ['$weapon', '$charge', '$catEyes']}, hasBow);

// Can cross gaps 2 units wide in logic.
export const canCrossSmallGaps: OrLogicCheck = orLogic(hasRoll, hasStaff);
// Used when teleportation is an option for getting over gaps.
export const canCrossSmallGapsOrTeleport: OrLogicCheck = orLogic(canCrossSmallGaps, hasTeleportation);

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


