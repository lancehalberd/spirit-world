import { altGolemState, altElementalIdols, altGuardian, altRival2 } from "app/content/heroSavedStates"

export interface BossRushOption {
    // Name of the boss rush displayed to the player
    label: string
    // Key for the boss rush used to track best score
    key: BossName
    // List of bosses the player will defeat in order
    bosses: BossName[]
    // Player state to use for special scenarios
    playerState?: SavedHeroData
    // Teleporter name in boss rush map
    location: string[]
    // Special logic for unlocking this boss rush
    isVisible?: (state: GameState) => boolean
    karma?: {[key in BossCondition]: number}
    //WIP: Give differing amounts of karma for beating time threshold.
    targetTime: number
}


const bossFlags: {[key in BossName]: string} = {
    none: 'WARNING',
    beetle: 'peachCaveBoss',
    golem: 'tombBoss',
    idols: 'warTempleBoss',
    guardian: 'cocoonBoss',
    forest: 'forestTempleBoss', 
    rival2: 'helixRivalBoss',
    collector: 'waterfallTowerBoss',
    stormBeast: 'stormBeast',
    flameBeast: 'flameBeast',
    frostBeast: 'frostBeast',
    rush: 'cocoonBoss',
    rush2: 'cocoonBoss', //WIP: give real flag
    rush3: 'WARNING',
    altGolem: 'WARNING',
    altGuardian: 'WARNING',
    altIdols: 'WARNING',
    altRival2: 'WARNING'
};


const fightLocations: {[key in BossName]: string[]} = {
    none: [],
    beetle: ['beetleRefight'],
    golem: ['golemRefight'],
    idols: ['warTempleRefight'],
    guardian: ['guardianRefight'],
    forest: ['forestTempleRefight'],
    rival2: ['rival2Refight'],
    collector: ['collectorRefight'],
    stormBeast: ['stormBeastRefight'],
    flameBeast: ['flameBeastRefight'],
    frostBeast: ['frostBeastRefight'],
    rush: ['beetleRefight', 'golemRefight', 'warTempleRefight', 'guardianRefight'],
    rush2: ['forestTempleRefight', 'rival2Refight', 'collectorRefight'],
    rush3: ['flameBeastRefight', 'frostBeastRefight', 'stormBeastRefight'],
    altGolem: ['golemRefight'],
    altGuardian: ['guardianRefight'],
    altIdols: ['warTempleRefight'],
    altRival2: ['rival2Refight'],
}

export const allBossRushOptions: BossRushOption[] = [
    {
        label: 'Beetle',
        key: 'beetle',
        bosses: ['beetle'],
        location: ['beetleRefight'],
        karma: {
            none: 0,
            daredevil: 1,
            weak: 1,
        },
        targetTime: 30000,
    },
    {
        label: 'Golem',
        key: 'golem',
        bosses: ['golem'],
        location: ['golemRefight'],
        karma: {
            none: 0,
            daredevil: 1,
            weak: 1,
        },
        targetTime: 60000,
    },
    {
        label: 'War Idols',
        key: 'idols',
        bosses: ['idols'],
        location: ['warTempleRefight'],
        karma: {
            none: 0,
            daredevil: 1,
            weak: 1,
        },
        targetTime: 50000,
    },
    {
        label: 'Guardian',
        key: 'guardian',
        bosses: ['guardian'],
        location: ['guardianRefight'],
        karma: {
            none: 0,
            daredevil: 1,
            weak: 1,
        },
        targetTime: 90000,
    },
    {
        label: 'Forest Idols',
        key: 'forest',
        bosses: ['forest'],
        location: ['forestTempleRefight'],
        karma: {
            none: 0,
            daredevil: 1,
            weak: 1,
        },
        targetTime: 50000,
    },
    {
        label: 'Rival 2',
        key: 'rival2',
        bosses: ['rival2'],
        location: ['rival2Refight'],
        karma: {
            none: 0,
            daredevil: 1,
            weak: 1,
        },
        targetTime: 75000,
    },
    {
        label: 'Collector',
        key: 'collector',
        bosses: ['collector'],
        location: ['collectorRefight'],
        karma: {
            none: 0,
            daredevil: 2,
            weak: 2,
        },
        targetTime: 60000,
    },
    {
        label: 'Flame Beast',
        key: 'flameBeast',
        bosses: ['flameBeast'],
        location: ['flameBeastRefight'],
        karma: {
            none: 0,
            daredevil: 2,
            weak: 2,
        },
        targetTime: 120000,
    },
    {
        label: 'Frost Beast',
        key: 'frostBeast',
        bosses: ['frostBeast'],
        location: ['frostBeastRefight'],
        karma: {
            none: 0,
            daredevil: 3,
            weak: 3,
        },
        targetTime: 90000,
    },
    {
        label: 'Storm Beast',
        key: 'stormBeast',
        bosses: ['stormBeast'],
        location: ['stormBeastRefight'],
        karma: {
            none: 0,
            daredevil: 3,
            weak: 3,
        },
        targetTime: 90000,
    },
    {
        label: 'Rush 1',
        key: 'rush',
        bosses: ['beetle', 'golem', 'idols', 'guardian'],
        location: ['beetleRefight', 'golemRefight', 'warTempleRefight', 'guardianRefight'],
        karma: {
            none: 2,
            daredevil: 5,
            weak: 4,
        },
        targetTime: 180000,
    },
    {
        label: 'Rush 2',
        key: 'rush2',
        bosses: ['forest', 'rival2', 'collector'],
        location: ['forestTempleRefight', 'rival2Refight', 'collectorRefight'],
        karma: {
            none: 2,
            daredevil: 7,
            weak: 4,
        },
        targetTime: 150000,
        isVisible(state: GameState) {
            return !!(state.savedState.objectFlags.elementalBeastsEscaped);
        }
    },
    {
        label: 'Rush 3',
        key: 'rush3',
        location: ['flameBeastRefight', 'frostBeastRefight', 'stormBeastRefight'],
        bosses: ['flameBeast', 'frostBeast', 'stormBeast'],
        karma: {
            none: 2,
            daredevil: 10,
            weak: 7,
        },
        targetTime: 400000,
        isVisible(state: GameState) {
            return !!(state.savedState.objectFlags.flameBeast && 
                      state.savedState.objectFlags.frostBeast &&
                      state.savedState.objectFlags.stormBeast && 1);
        }
    },
    {
        label: 'Odd Golem',
        key: 'altGolem',
        bosses: ['golem'],
        location: ['golemRefight'],
        playerState: altGolemState,
        karma: {
            none: 0,
            daredevil: 1,
            weak: 1,
        },
        targetTime: 120000,
        // Also requires gloves to unlock.
        isVisible(state: GameState) {
            return !!(state.savedState.objectFlags.tombBoss
                && state.hero.savedData.passiveTools.gloves && (state.hero.savedData.karma >= 3));
        }
    },
    {
        label: 'Odd Guardian',
        key: 'altGuardian',
        bosses: ['guardian'],
        location: ['guardianRefight'],
        playerState: altGuardian,
        karma: {
            none: 1,
            daredevil: 2,
            weak: 0,
        },
        targetTime: 180000,
        isVisible(state: GameState) {
            return !!(state.savedState.objectFlags.cocoonBoss && (state.hero.savedData.karma >= 1));
        }
    },
    {
        label: 'Odd Idols',
        key: 'altIdols',
        bosses: ['idols'],
        location: ['warTempleRefight'],
        playerState: altElementalIdols,
        karma: {
            none: 1,
            daredevil: 1,
            weak: 1,
        },
        targetTime: 90000,
        isVisible(state: GameState) {
            return !!(state.savedState.objectFlags.warTempleBoss && (state.hero.savedData.karma >= 4));
        }
    },
    {
        label: 'Odd Rival 2',
        key: 'altRival2',
        bosses: ['rival2'],
        location: ['rival2Refight'],
        playerState: altRival2,
        karma: {
            none: 1,
            daredevil: 1,
            weak: 1,
        },
        targetTime: 90000,
        isVisible(state: GameState) {
            return !!(state.savedState.objectFlags.helixRivalBoss && (state.hero.savedData.karma >= 4));
        }
    },
];

const karmaByKey: Record<BossName,  {[key in BossCondition]: number}> =
    allBossRushOptions.reduce((acc, option) => {
        acc[option.key] = option.karma;
        return acc;
    }, {} as Record<BossName,  {[key in BossCondition]: number}>);

const karmaTimeByKey: Record<BossName, number> =
    allBossRushOptions.reduce((acc, option) => {
        acc[option.key] = option.targetTime;
        return acc;
    }, {} as Record<BossName, number>);

export function getKarmaTimeByKey(key: BossName): number {
    return karmaTimeByKey[key] ?? 0;
}

export function getKarmaForKey(key: BossName, condition: BossCondition): number {
    return karmaByKey[key][condition] ?? 0;
}

export function isBossRushOptionVisible(state: GameState, bossRushOption: BossRushOption): boolean {
    if (bossRushOption.isVisible) {
        return bossRushOption.isVisible(state);
    }
    for (const bossKey of bossRushOption.bosses) {
        if (!state.savedState.objectFlags[bossFlags[bossKey]]) {
            return false;
        }
    } return true;
}
export function getBossRushOptions(state: GameState): BossRushOption[] {
    return allBossRushOptions.filter(bossRushOption => isBossRushOptionVisible(state, bossRushOption));
}

export function endBossRush(state: GameState): boolean {
    if (state.bossRushTrackers.rushPosition + 1 >= fightLocations[state.bossRushTrackers.currentBoss].length) {
        return true;
    } return false;
}

export function travelToLocation(state: GameState, zoneKey: string, markerId: string): string {
  if (state.travel) {
    state.travel(zoneKey, markerId, {instant: false});
    return '';
  }
  console.log("Can't find travel function!")
}

export function startNextBoss(state: GameState): string {
    return travelToLocation(state, 'bossRefights', fightLocations[state.bossRushTrackers.currentBoss]
        [state.bossRushTrackers.rushPosition]);
}