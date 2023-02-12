import { isRandomizer } from 'app/gameConstants';

import { AndLogicCheck, GameState, LogicCheck, LogicDefinition, ObjectDefinition, OrLogicCheck } from 'app/types';

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
        if (isNaN(level)) {
            // assume levelString is item string, itemFlag is zone key
            return !!state.savedState.dungeonInventories[itemFlag]?.[levelString];
        }
    }
    if (itemFlag === 'randomizer') {
        return isRandomizer;
    }
    if (itemFlag === 'weapon') {
        return state.hero.weapon >= level;
    }
    if (itemFlag === 'maxLife') {
        return state.hero.maxLife >= level;
    }
    if (itemFlag === 'silverOre') {
        return state.hero.silverOre >= level;
    }
    if (itemFlag === 'goldOre') {
        return state.hero.goldOre >= level;
    }
    return state.hero.activeTools[itemFlag] >= level || state.hero.passiveTools[itemFlag] >= level
        || state.hero.elements[itemFlag] >= level || state.hero.equipment[itemFlag] >= level
        || state.hero.weaponUpgrades[itemFlag];
}

export function isLogicValid(state: GameState, logic: LogicCheck, invertLogic = false): boolean {
    const trueResult = !invertLogic, falseResult = !!invertLogic;
    if  (logic === false) {
        return falseResult;
    }
    if  (logic === true) {
        return trueResult;
    }
    if (typeof logic === 'function') {
        if (logic(state)) {
            return trueResult;
        }
        return falseResult;
    }
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
    return trueResult;
}

export function isObjectLogicValid(state: GameState, definition: ObjectDefinition): boolean {
    if (definition.hasCustomLogic && definition.customLogic) {
        return isLogicValid(state, {requiredFlags: [definition.customLogic]}, definition.invertLogic);
    }
    if (!definition.logicKey) {
        return true;
    }
    const logic = logicHash[definition.logicKey];
    // Logic should never be missing, so surface an error and hide the layer.
    if (!logic) {
        console.error('Missing logic!', definition.logicKey);
        debugger;
        return false;
    }
    return isLogicValid(state, logic, definition.invertLogic);
}

export function evaluateLogicDefinition(state: GameState, logicDefinition?: LogicDefinition, defaultValue: boolean = true): boolean {
    if (!logicDefinition) {
        return defaultValue;
    }
    if (logicDefinition.isTrue) {
        return !logicDefinition.isInverted;
    }
    if (logicDefinition.hasCustomLogic) {
        return isLogicValid(state, { requiredFlags: [logicDefinition.customLogic] }, logicDefinition.isInverted);
    }
    if (logicDefinition.logicKey) {
        return isLogicValid(state, logicHash[logicDefinition.logicKey], logicDefinition.isInverted);
    }
    return defaultValue;
}
window['isLogicValid'] = isLogicValid;

export const hasCatEyes: LogicCheck = { requiredFlags: ['$catEyes'] };
export const hasTrueSight: LogicCheck = { requiredFlags: ['$trueSight'] };
export const hasClone: LogicCheck = { requiredFlags: ['$clone'] };
export const hasDoubleClone: LogicCheck = { requiredFlags: ['$clone:2'] };
export const hasIronBoots: LogicCheck = { requiredFlags: ['$ironBoots'] };
export const hasCloudBoots: LogicCheck = { requiredFlags: ['$cloudBoots'] };
export const hasSpiritSight: LogicCheck = { requiredFlags: ['$spiritSight'] };
export const hasAstralProjection: LogicCheck = { requiredFlags: ['$astralProjection', '$spiritSight'] };
export const hasTeleportation: LogicCheck = { requiredFlags: ['$astralProjection', '$spiritSight', '$teleportation'] };
export const hasSpiritBarrier: LogicCheck = { requiredFlags: ['$cloak'] };
export const hasInvisibility: LogicCheck = { requiredFlags: ['$cloak:2'] };
export const hasGloves: LogicCheck = { requiredFlags: ['$gloves'] };
export const hasMitts: LogicCheck = { requiredFlags: ['$gloves:2'] };
export const hasSmallKey: LogicCheck = { requiredFlags: ['$smallKey'] };
export const hasBigKey: LogicCheck = { requiredFlags: ['$bigKey'] };
export const hasFireBlessing: LogicCheck = {requiredFlags: ['$fireBlessing']};
export const hasWaterBlessing: LogicCheck = {requiredFlags: ['$waterBlessing']};
export const hasChakram: LogicCheck = {requiredFlags: ['$weapon']};
export const hasNimbusCloud: LogicCheck = {requiredFlags: ['$nimbusCloud']};

export const hasBow: LogicCheck = {requiredFlags: ['$bow']};
export const hasUpgradedBow: LogicCheck = {requiredFlags: ['$bow:2']};
export const hasElementalWeapon: OrLogicCheck = orLogic(hasChakram, hasBow, hasSpiritBarrier);
export const hasFire: LogicCheck = andLogic(hasElementalWeapon, {requiredFlags: ['$fire']});
export const hasIce: LogicCheck = andLogic(hasElementalWeapon, {requiredFlags: ['$ice']});
export const hasLightning: LogicCheck = andLogic(hasElementalWeapon, {requiredFlags: ['$lightning']});
export const hasCharge: OrLogicCheck = orLogic(hasFire, hasIce, hasLightning);

export const hasRoll: LogicCheck = {requiredFlags: ['$roll']};
export const hasSomersault: LogicCheck = {requiredFlags: ['$roll:2']};
export const hasStaff: LogicCheck = {requiredFlags: ['$staff']};
export const hasTowerStaff: LogicCheck = {requiredFlags: ['$staff:2']};
export const canHasTowerStaff: LogicCheck = {requiredFlags: ['stormBeast']};
// This check is for having a weapon that can be used to defeat most bosses.
// Primarily we don't want having the Spirit Cloak to put any bosses in logic since
// it is excessively tedious to defeat bosses with.
export const hasBossWeapon: OrLogicCheck = orLogic(hasChakram, hasBow, hasStaff);
// This check is for being able to push objects at the range of the chakram like pots.
export const hasRangedPush: OrLogicCheck = orLogic(hasChakram, hasBow);
// This check is used for being able to defeat enemies at all.
export const hasWeapon: OrLogicCheck = orLogic(hasChakram, hasBow, hasSpiritBarrier, hasStaff, hasSomersault);
// This check is used for weapons that have the range of the charged chakram or greater.
export const hasMediumRange: OrLogicCheck = orLogic(andLogic(hasChakram, hasCharge), hasBow);

export const hasTripleShot: AndLogicCheck = andLogic(hasUpgradedBow, hasCharge);

// Attacks that you are expected to roll to avoid can also reasonably be dealt with by ab$sorbing the hit
// with spirit barrier or even invisibility.
export const canAvoidBossAttacks: OrLogicCheck = orLogic(hasRoll, hasSpiritBarrier);

// Although these are the same now, they might be made different in the future.
export const canBeatGolem = andLogic(hasBossWeapon, canAvoidBossAttacks);
export const canBeatIdols = andLogic(hasBossWeapon, canAvoidBossAttacks);


// Note that in some areas teleportation may not be possible contextually, for example if the player cannot
// stand still at the edge of the gap.
// Rough rule of thumb:
// roll = 2 (technically allows 3)
// cloud boots = 2 (requires a running start, but not necessarily in a straight line)
// teleportation = 3
// staff = 4
// teleportation can only be combined with the staff.
export const canCross2Gaps: OrLogicCheck = orLogic(hasCloudBoots, hasRoll, hasStaff, hasTeleportation, hasClone);
export const canCross4Gaps: OrLogicCheck = orLogic(andLogic(hasRoll, hasCloudBoots), hasStaff, hasSomersault, hasClone);
export const canCross6Gaps: OrLogicCheck = orLogic(hasSomersault, canHasTowerStaff, andLogic(orLogic(hasRoll, hasCloudBoots, hasTeleportation, hasClone), hasStaff));
export const canCross8Gaps: OrLogicCheck = orLogic(hasSomersault, canHasTowerStaff, andLogic(hasRoll, hasCloudBoots, hasStaff));

export const canCrossDynamic2Gaps: OrLogicCheck = orLogic(hasCloudBoots, hasRoll, hasStaff, hasClone);
export const canCrossDynamic4Gaps: OrLogicCheck = orLogic(andLogic(hasRoll, hasCloudBoots), hasStaff, hasSomersault, hasClone);
export const canCrossDynamic6Gaps: OrLogicCheck = orLogic(hasSomersault, canHasTowerStaff, andLogic(orLogic(hasRoll, hasCloudBoots, hasTeleportation, hasClone), hasStaff));
export const canCrossDynamic8Gaps: OrLogicCheck = orLogic(hasSomersault, canHasTowerStaff, andLogic(hasRoll, hasCloudBoots, hasStaff));

export const canTravelFarUnderWater = andLogic(hasIronBoots);

export const canHitCrystalSwitches = orLogic(hasChakram, hasBow, hasSpiritBarrier);

export const hasReleasedBeasts: LogicCheck = {requiredFlags: ['elementalBeastsEscaped']};

export const logicHash: {[key: string]: LogicCheck} = {
    hasWeapon,
    hasMediumRange,
    hasRangedPush,
    isRandomizer: {
        requiredFlags: ['$randomizer'],
    },
    tombRivalNpc: {
        excludedFlags: ['tombRivalEnraged', 'tombRivalRescued', 'tombEntered', 'tombRivalAvoided'],
    },
    tombRivalBoss: {
        requiredFlags: ['tombRivalEnraged'],
        excludedFlags: ['tombEntered', 'tombRivalRescued', 'tombRivalAvoided'],
    },
    cocoonBossStarted: {
        requiredFlags: ['cocoonBossStarted'],
    },
    cocoonBossDefeated: {
        requiredFlags: ['cocoonBoss'],
    },
    hasReleasedBeasts,
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
    desertTower: (state: GameState) => {
        return state.hero.activeTools.staff < 2 && state.savedState.staffTowerLocation === 'desert';
    },
    forestTower: (state: GameState) => {
        return state.hero.activeTools.staff < 2 && state.savedState.staffTowerLocation === 'forest';
    },
    mountainTower: (state: GameState) => {
        return state.hero.activeTools.staff < 2 && state.savedState.staffTowerLocation === 'mountain';
    },
    towerStaff: {
        requiredFlags: ['$staff:2'],
    },
    beastsDefeated: {
        requiredFlags: ['flameBeast', 'frostBeast', 'stormBeast'],
    },
};


