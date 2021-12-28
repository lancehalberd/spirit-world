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
        if (!state.savedState.objectFlags[requiredFlag] && !state.savedState.zoneFlags[requiredFlag]) {
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
        if (state.savedState.objectFlags[excludedFlag] || state.savedState.zoneFlags[excludedFlag]) {
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

export const hasCatEyes: LogicCheck = { requiredFlags: ['$catEyes'] };
export const hasClone: LogicCheck = { requiredFlags: ['$clone', '$catEyes'] };
export const hasIronBoots: LogicCheck = { requiredFlags: ['$ironBoots'] };
export const hasCloudBoots: LogicCheck = { requiredFlags: ['$cloudBoots'] };
export const hasAstralProjection: LogicCheck = { requiredFlags: ['$astralProjection', '$spiritSight', '$catEyes'] };
export const hasSpiritBarrier: LogicCheck = { requiredFlags: ['$cloak', '$catEyes'] };
export const hasTeleportation: LogicCheck = { requiredFlags: ['$astralProjection', '$spiritSight', '$teleportation', '$catEyes'] };
export const hasGloves: LogicCheck = { requiredFlags: ['$gloves'] };
export const hasMitts: LogicCheck = { requiredFlags: ['$gloves:2'] };
export const hasSpiritSight: LogicCheck = { requiredFlags: ['$spiritSight', '$catEyes'] };
export const hasSmallKey: LogicCheck = { requiredFlags: ['$smallKey'] };
export const hasBigKey: LogicCheck = { requiredFlags: ['$bigKey'] };
export const hasFireBlessing: LogicCheck = {requiredFlags: ['$fireBlessing']};
export const hasWaterBlessing: LogicCheck = {requiredFlags: ['$waterBlessing']};
export const hasChakram: LogicCheck = {requiredFlags: ['$weapon']};

// This check will be added automatically to any tiles that have 100% darkness effect.
//const hasEyes: LogicCheck = { requiredFlags: ['$catEyes:1'] };
export const hasBow: LogicCheck = {requiredFlags: ['$bow', '$catEyes']};
export const hasRoll: LogicCheck = {requiredFlags: ['$roll', '$catEyes']};
export const hasStaff: LogicCheck = {requiredFlags: ['$staff', '$catEyes']};
// This check is for having a weapon that can be used to defeat most bosses.
// Primarily we don't want having the Spirit Cloak to put any bosses in logic since
// it is excessively tedious to defeat bosses with.
export const hasBossWeapon: OrLogicCheck = orLogic({requiredFlags: ['$weapon']}, hasBow);
// This check is for being able to push objects at the range of the chakram like pots.
export const hasRangedPush: OrLogicCheck = orLogic({requiredFlags: ['$weapon']}, hasBow);
// This check is used for being able to defeat enemies at all.
export const hasWeapon: OrLogicCheck = orLogic({requiredFlags: ['$weapon']}, hasBow, hasSpiritBarrier);
// This check is used for weapons that have the range of the charged chakram or greater.
export const hasMediumRange: OrLogicCheck = orLogic({requiredFlags: ['$weapon', '$charge', '$catEyes']}, hasBow);

export const hasFire: LogicCheck = andLogic(orLogic(hasBow, hasWeapon), {requiredFlags: ['$fire', '$charge', '$catEyes']});
export const hasIce: LogicCheck = andLogic(orLogic(hasBow, hasWeapon), {requiredFlags: ['$ice', '$charge', '$catEyes']});
export const hasLightning: LogicCheck = andLogic(orLogic(hasBow, hasWeapon), {requiredFlags: ['$lightning', '$charge', '$catEyes']});


// Note that in some areas teleportation may not be possible contextually, for example if the player cannot
// stand still at the edge of the gap.
// Rough rule of thumb:
// roll = 2 (technically allows 3)
// cloud boots = 2 (requires a running start, but not necessarily in a straight line)
// teleportation = 3
// staff = 4
// teleportation can only be combined with the staff.
export const canCross2Gaps: OrLogicCheck = orLogic(hasCloudBoots, hasRoll, hasStaff, hasTeleportation);
export const canCross4Gaps: OrLogicCheck = orLogic(andLogic(hasRoll, hasCloudBoots), hasStaff);
export const canCross6Gaps: AndLogicCheck = andLogic(orLogic(hasRoll, hasCloudBoots, hasTeleportation), hasStaff);
export const canCross8Gaps: AndLogicCheck = andLogic(hasRoll, hasCloudBoots, hasStaff);

export const canTravelFarUnderWater = andLogic(hasIronBoots, orLogic(hasWaterBlessing, hasCatEyes));

export const canReleaseBeasts = andLogic(canCross6Gaps, hasTeleportation, hasBossWeapon);

export const logicHash: {[key: string]: LogicCheck} = {
    hasWeapon,
    hasMediumRange,
    cocoonBossStarted: {
        requiredFlags: ['cocoonBossStarted'],
    },
    cocoonBossDefeated: {
        requiredFlags: ['cocoonBoss'],
    },
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


