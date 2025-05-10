import { isRandomizer } from 'app/gameConstants';


export function andLogic(...logicChecks: LogicCheck[]): AndLogicCheck {
    return { operation: 'and', logicChecks};
}
window['andLogic'] = andLogic;

export function orLogic(...logicChecks: LogicCheck[]): OrLogicCheck {
    return { operation: 'or', logicChecks};
}
window['orLogic'] = orLogic;

export function isItemLogicTrue(state: GameState, itemFlag: string): boolean {
    let level = 1, levelString: string;
    if (itemFlag.includes(':')) {
        [itemFlag, levelString] = itemFlag.split(':');
        level = parseInt(levelString, 10);
        if (isNaN(level)) {
            // assume levelString is item string, itemFlag is zone key
            return !!state.savedState.dungeonInventories[itemFlag]?.[levelString as keyof DungeonInventory];
        }
    }
    if (itemFlag === 'AR') {
        return !!state.arState.active;
    }
    if (itemFlag === 'isSpirit') {
        return !!state.hero.astralProjection;
    }
    if (itemFlag === 'randomizer') {
        return isRandomizer;
    }
    if (itemFlag === 'weapon') {
        return (state.hero.savedData.weapon & level) > 0;
    }
    if (itemFlag === 'maxLife') {
        return state.hero.savedData.maxLife >= level;
    }
    if (itemFlag === 'totalSilverOre') {
        return state.hero.savedData.totalSilverOre >= level;
    }
    if (itemFlag === 'totalGoldOre') {
        return state.hero.savedData.totalGoldOre >= level;
    }
    if (itemFlag === 'silverOre') {
        return state.hero.savedData.silverOre >= level;
    }
    if (itemFlag === 'goldOre') {
        return state.hero.savedData.goldOre >= level;
    }
    return state.hero.savedData.activeTools[itemFlag as ActiveTool] >= level
        || state.hero.savedData.passiveTools[itemFlag as PassiveTool] >= level
        || state.hero.savedData.elements[itemFlag as MagicElement] >= level
        || state.hero.savedData.equipment[itemFlag as Equipment] >= level
        || state.hero.savedData.blueprints[itemFlag as Blueprints] >= level
        || state.hero.savedData.weaponUpgrades[itemFlag as WeaponUpgrades];
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

export function evaluateFlagString(state: GameState, flagString: string, invertLogic: boolean = false): boolean {
    const tokens: string[] = [];
    let charStack: string[] = [];
    function finishToken() {
        if (charStack.length) {
            tokens.push(charStack.join(''));
            charStack = [];
        }
    }
    for (let i = 0; i < flagString.length; i++) {
        const c = flagString[i];
        if (c === '(' || c === ')' || c === '!') {
            finishToken();
            tokens.push(c);
        } else if (c === '&') {
            finishToken();
            if (flagString[++i] === '&') {
                tokens.push('&&');
            } else {
                console.error('Failed to parse token & in ', flagString);
            }
        } else if (c === '|') {
            finishToken();
            if (flagString[++i] === '|') {
                tokens.push('||');
            } else {
                console.error('Failed to parse token | in ', flagString);
            }
        } else if (c !== ' ') {
            charStack.push(c);
        }
    }
    finishToken();
    const valueStack: boolean[] = [];
    let depth = 0;
    const operatorStack: ('||' | '&&' | '!')[][] = [];
    function addValue(value: boolean) {
        const operators = operatorStack[depth] ?? [];
        //console.log('addingValue', value, depth, valueStack[depth], [...operators]);
        while (operators[operators.length - 1] === '!') {
            value = !value;
            operators.pop();
            //console.log('Inverting value', value, [...operators]);
        }
        if (valueStack[depth] === undefined) {
            valueStack[depth] = value;
        } else {
            const poppedOperator = operators.pop();
            // Technically with short circuiting we can just assign to popped value in all cases...
            if (poppedOperator === '&&') {
                valueStack[depth] = valueStack[depth] && value;
            } else if (poppedOperator === '||') {
                valueStack[depth] = valueStack[depth] || value;
            } else {
                console.error('Expected operator && or || between values in ', flagString);
            }
        }
    }
    //console.log(tokens);
    for (const t of tokens) {
        if (t === '(') {
            depth++;
        } else if (t === ')') {
            depth--;
            addValue(valueStack.pop());
        } else if (t === '&&' || t === '||' || t === '!') {
            operatorStack[depth] = operatorStack[depth] || [];
            operatorStack[depth].push(t);
        } else {
            addValue(isLogicValid(state, {requiredFlags: [t]}));
        }
    }
    return valueStack.pop() || false;
}
window.evaluateFlagString = evaluateFlagString;

export function isObjectLogicValid(state: GameState, definition: ObjectDefinition): boolean {
    if (definition.hasCustomLogic && definition.customLogic) {
        const result = evaluateFlagString(state, definition.customLogic);
        if (definition.invertLogic) {
            return !result;
        }
        return result;
        //return isLogicValid(state, {requiredFlags: [definition.customLogic]}, definition.invertLogic);
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
export const hasFireBlessing: LogicCheck = {requiredFlags: ['$fireBlessing']};
export const hasWaterBlessing: LogicCheck = {requiredFlags: ['$waterBlessing']};
export const hasLightningBlessing: LogicCheck = {requiredFlags: ['$lightningBlessing']};
export const hasChakram: LogicCheck = {requiredFlags: ['$weapon:3']};
export const hasNimbusCloud: LogicCheck = {requiredFlags: ['$nimbusCloud']};
export const hasPhoenixCrown: LogicCheck = {requiredFlags: ['$phoenixCrown']};

export const hasBow: LogicCheck = {requiredFlags: ['$bow']};
export const hasUpgradedBow: LogicCheck = {requiredFlags: ['$bow:2']};
export const hasElementalWeapon: OrLogicCheck = orLogic(hasChakram, hasBow, hasSpiritBarrier);
export const hasFire: LogicCheck = andLogic(hasElementalWeapon, {requiredFlags: ['$fire']});
export const hasIce: LogicCheck = andLogic(hasElementalWeapon, {requiredFlags: ['$ice']});
export const hasLightning: LogicCheck = andLogic(hasElementalWeapon, {requiredFlags: ['$lightning']});
export const hasCharge: OrLogicCheck = orLogic(hasFire, hasIce, hasLightning);

export const hasRoll: LogicCheck = {requiredFlags: ['$roll']};
export const hasSomersault: LogicCheck = {requiredFlags: ['$roll:2']};
export const hasLongSomersault: LogicCheck = andLogic(
    hasSomersault,
    // All of these increase mana enough to teleport a third time, but cat eyes does not.
    orLogic(hasSpiritBarrier, hasPhoenixCrown, {requiredFlags: ['$fire']}, {requiredFlags: ['$ice']}, {requiredFlags: ['$lightning']},)
);
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
export const canDefeatBalloonMegapede = andLogic(hasBossWeapon, canAvoidBossAttacks);
export const canDefeatFlameElemental = orLogic(hasIce, hasLightning);
export const canDefeatFrostElemental = orLogic(hasFire, hasLightning);
export const canDefeatStormElemental = orLogic(hasIce, hasFire);

export const canRemoveLightStones = orLogic(hasGloves, hasStaff);
export const canRemoveHeavyStones = orLogic(hasMitts, canHasTowerStaff);
// Eventually we plan to allow bonking with tower staff to move these as well.
export const canMoveHeavyStairs = hasMitts;
export const canCrossLightningBarriers = orLogic(hasLightningBlessing, hasInvisibility, hasSomersault);
export const canPressHeavySwitches = orLogic(hasStaff, andLogic(hasClone, hasIronBoots));

export const canHasSpikeBoots = {requiredFlags: ['canReachCitySmith', '$spikeBoots', '$totalSilverOre:12']};
export const canHasFlyingBoots = {requiredFlags: ['canReachForgeSmith', '$cloudBoots', '$flyingBoots', '$totalGoldOre:4']};
export const canHasForgeBoots = {requiredFlags: ['canReachForgeSmith', '$ironBoots', '$forgeBoots', '$totalGoldOre:4']};


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

export const canCrossPrecise2Gaps: OrLogicCheck = orLogic(hasRoll, hasStaff, hasTeleportation);

export const canCrossDynamic2Gaps: OrLogicCheck = orLogic(hasCloudBoots, hasRoll, hasStaff, hasClone);
export const canCrossDynamic4Gaps: OrLogicCheck = orLogic(andLogic(hasRoll, hasCloudBoots), hasStaff, hasSomersault, hasClone);
export const canCrossDynamic6Gaps: OrLogicCheck = orLogic(hasSomersault, canHasTowerStaff, andLogic(orLogic(hasRoll, hasCloudBoots, hasTeleportation, hasClone), hasStaff));
export const canCrossDynamic8Gaps: OrLogicCheck = orLogic(hasSomersault, canHasTowerStaff, andLogic(hasRoll, hasCloudBoots, hasStaff));

export const canTravelFarUnderWater = andLogic(hasIronBoots, hasWaterBlessing);
export const canUseTeleporters = orLogic(hasSpiritSight, hasTrueSight);

export const canHitCrystalSwitches = orLogic(hasChakram, hasBow, hasSpiritBarrier);

export const hasReleasedBeasts: LogicCheck = {requiredFlags: ['elementalBeastsEscaped']};
export const beastsDefeated: LogicCheck = {requiredFlags: ['flameBeast', 'frostBeast', 'stormBeast']};

// These logic checks should only be used during generation and are not supported during game play.
// object+chest ids that require keys/big keys automatically apply key logic already.
export const hasSmallKey: LogicCheck = {requiredFlags: ['$smallKey']};
export const hasBigKey: LogicCheck = {requiredFlags: ['$bigKey']};

export const logicHash: {[key: string]: LogicCheck} = {
    hasWeapon,
    hasMediumRange,
    hasRangedPush,
    isRandomizer: {
        requiredFlags: ['$randomizer'],
    },
    tombRivalNpc: {
        excludedFlags: ['tombRivalEnraged', 'tombRivalRescued', 'tombEntered', 'tombRivalAvoided', 'helixRivalIntro'],
    },
    tombRivalBoss: {
        requiredFlags: ['tombRivalEnraged'],
        excludedFlags: [
            'tombEntered', 'tombRivalRescued', 'tombRivalAvoided',
            'helixRivalIntro',
        ],
    },
    cocoonBossStarted: {
        requiredFlags: ['cocoonBossStarted'],
    },
    cocoonBossDefeated: {
        requiredFlags: ['cocoonBoss'],
    },
    // Normally the sleeping beasts disappear when you beat the War Temple boss, but they must also
    // disappear if the beasts escape without defeating that boss.
    sleepingBeastsLogic: {
        excludedFlags: ['elementalBeastsEscaped', 'warTempleBoss'],
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
        return !(state.hero.savedData.activeTools.staff & 2) && state.savedState.staffTowerLocation === 'desert';
    },
    forestTower: (state: GameState) => {
        return !(state.hero.savedData.activeTools.staff & 2) && state.savedState.staffTowerLocation === 'forest';
    },
    mountainTower: (state: GameState) => {
        return !(state.hero.savedData.activeTools.staff & 2) && state.savedState.staffTowerLocation === 'mountain';
    },
    towerStaff: {
        requiredFlags: ['$staff:2'],
    },
    beastsDefeated,
    jadeChampionStaffTowerEntrance: (state: GameState) => {
        // Disable all cut scenes in randomizer.
        if (isRandomizer) {
            return false;
        }
        // Disable once the cut scene has played.
        if (state.savedState.objectFlags.jadeChampionStaffTowerEntrance) {
            return false;
        }
        // Disable if the other two beasts are already defeated.
        if (state.savedState.objectFlags.flameBeast && state.savedState.objectFlags.frostBeast) {
            return false;
        }
        return true;
    },
    jadeChampionStaffTowerTop: (state: GameState) => {
        // Disable all cut scenes in randomizer.
        if (isRandomizer) {
            return false;
        }
        // Disable once the cut scene has played.
        if (state.savedState.objectFlags.jadeChampionStaffTowerTop) {
            return false;
        }
        // Disable if the other two beasts are already defeated.
        if (state.savedState.objectFlags.flameBeast && state.savedState.objectFlags.frostBeast) {
            return false;
        }
        return true;
    },
    jadeChampionStormBeast: (state: GameState) => {
        // Disable once the beast is defeated.
        if (state.savedState.objectFlags.stormBeast) {
            return false;
        }
        // Disable if the other two beasts are already defeated.
        if (state.savedState.objectFlags.flameBeast && state.savedState.objectFlags.frostBeast) {
            return false;
        }
        return true;
    },
    jadeChampionStaffCraterEntrance: (state: GameState) => {
        // Disable all cut scenes in randomizer.
        if (isRandomizer) {
            return false;
        }
        // Disable once the cut scene has played.
        if (state.savedState.objectFlags.jadeChampionStaffCraterEntrance) {
            return false;
        }
        // Disable if the other two beasts are already defeated.
        if (state.savedState.objectFlags.stormBeast && state.savedState.objectFlags.frostBeast) {
            return false;
        }
        return true;
    },
    jadeChampionFlameBeast: (state: GameState) => {
        // Disable until the lava is drained enough to reveal the boss arena where she is placed.
        if (!state.savedState.objectFlags.craterLava3) {
            return false;
        }
        // Disable once the beast is defeated.
        if (state.savedState.objectFlags.flameBeast) {
            return false;
        }
        // Disable if the other two beasts are already defeated.
        if (state.savedState.objectFlags.stormBeast && state.savedState.objectFlags.frostBeast) {
            return false;
        }
        return true;
    },
    jadeChampionStaffLakeTempleEntrance: (state: GameState) => {
        // Disable all cut scenes in randomizer.
        if (isRandomizer) {
            return false;
        }
        // Disable once the cut scene has played.
        if (state.savedState.objectFlags.jadeChampionStaffLakeTempleEntrance) {
            return false;
        }
        // Disable if the other two beasts are already defeated.
        if (state.savedState.objectFlags.stormBeast && state.savedState.objectFlags.flameBeast) {
            return false;
        }
        return true;
    },
    jadeChampionFrostBeast: (state: GameState) => {
        // Disable once the beast is defeated.
        if (state.savedState.objectFlags.frostBeast) {
            return false;
        }
        // Disable if the other two beasts are already defeated.
        if (state.savedState.objectFlags.stormBeast && state.savedState.objectFlags.flameBeast) {
            return false;
        }
        return true;
    },
};


