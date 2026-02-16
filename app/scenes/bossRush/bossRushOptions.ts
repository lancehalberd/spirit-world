import { altGolemState } from "app/content/heroSavedStates"

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
    daredevilKarma?: number
    normalKarma?: number
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
    rush2: 'cocoonBoss',
    rush3: 'WARNING',
    altGolem: 'WARNING',
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
    altGolem: ['golem'],
}

export const allBossRushOptions: BossRushOption[] = [
    {
        label: 'Beetle',
        key: 'beetle',
        bosses: ['beetle'],
        location: ['beetleRefight'],
        daredevilKarma: 2,
        normalKarma: 0,
        targetTime: 30000,
    },
    {
        label: 'Golem',
        key: 'golem',
        bosses: ['golem'],
        location: ['golemRefight'],
        daredevilKarma: 1,
        normalKarma: 0,
        targetTime: 60000,
    },
    {
        label: 'War Idols',
        key: 'idols',
        bosses: ['idols'],
        location: ['warTempleRefight'],
        daredevilKarma: 1,
        normalKarma: 0,
        targetTime: 50000,
    },
    {
        label: 'Guardian',
        key: 'guardian',
        bosses: ['guardian'],
        location: ['guardianRefight'],
        daredevilKarma: 1,
        normalKarma: 0,
        targetTime: 90000,
    },
    {
        label: 'Forest Idols',
        key: 'forest',
        bosses: ['forest'],
        location: ['forestTempleRefight'],
        daredevilKarma: 1,
        normalKarma: 0,
        targetTime: 50000,
    },
    {
        label: 'Rival 2',
        key: 'rival2',
        bosses: ['rival2'],
        location: ['rival2Refight'],
        daredevilKarma: 1,
        normalKarma: 0,
        targetTime: 75000,
    },
    {
        label: 'Collector',
        key: 'collector',
        bosses: ['collector'],
        location: ['collectorRefight'],
        daredevilKarma: 2,
        normalKarma: 0,
        targetTime: 60000,
    },
    {
        label: 'Flame Beast',
        key: 'flameBeast',
        bosses: ['flameBeast'],
        location: ['flameBeastRefight'],
        daredevilKarma: 2,
        normalKarma: 0,
        targetTime: 120000,
    },
    {
        label: 'Frost Beast',
        key: 'frostBeast',
        bosses: ['frostBeast'],
        location: ['frostBeastRefight'],
        daredevilKarma: 2,
        normalKarma: 0,
        targetTime: 90000,
    },
    {
        label: 'Storm Beast',
        key: 'stormBeast',
        bosses: ['stormBeast'],
        location: ['stormBeastRefight'],
        daredevilKarma: 2,
        normalKarma: 0,
        targetTime: 90000,
    },
    {
        label: 'Odd Golem',
        key: 'altGolem',
        bosses: ['golem'],
        location: ['golemRefight'],
        playerState: altGolemState,
        daredevilKarma: 1,
        normalKarma: 1,
        targetTime: 120000,
        // Also requires gloves to unlock.
        isVisible(state: GameState) {
            return !!(state.savedState.objectFlags.tombBoss
                && state.hero.savedData.passiveTools.gloves && 1);
        }
    },
    {
        label: 'Rush 1',
        key: 'rush',
        bosses: ['beetle', 'golem', 'idols', 'guardian'],
        location: ['beetleRefight', 'golemRefight', 'warTempleRefight', 'guardianRefight'],
        daredevilKarma: 5,
        normalKarma: 2,
        targetTime: 180000,
    },
    {
        label: 'Rush 2',
        key: 'rush2',
        bosses: ['forest', 'rival2', 'collector'],
        location: ['forestTempleRefight', 'rival2Refight', 'collectorRefight'],
        daredevilKarma: 7,
        normalKarma: 2,
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
        daredevilKarma: 10,
        normalKarma: 2,
        targetTime: 400000,
        isVisible(state: GameState) {
            return !!(state.savedState.objectFlags.flameBeast && 
                      state.savedState.objectFlags.frostBeast &&
                      state.savedState.objectFlags.stormBeast && 1);
        }
    },
];

const normalKarmaByKey: Record<BossName, number> =
    allBossRushOptions.reduce((acc, option) => {
        acc[option.key] = option.normalKarma;
        return acc;
    }, {} as Record<BossName, number>);

const daredevilKarmaByKey: Record<BossName, number> =
    allBossRushOptions.reduce((acc, option) => {
        acc[option.key] = option.daredevilKarma;
        return acc;
    }, {} as Record<BossName, number>);

const karmaTimeByKey: Record<BossName, number> =
    allBossRushOptions.reduce((acc, option) => {
        acc[option.key] = option.targetTime;
        return acc;
    }, {} as Record<BossName, number>);

export function getKarmaTimeByKey(key: BossName): number {
    return karmaTimeByKey[key] ?? 0;
}

export function getNormalKarmaForKey(key: BossName): number {
    return normalKarmaByKey[key] ?? 0;
}

export function getDaredevilKarmaForKey(key: BossName): number {
    return daredevilKarmaByKey[key] ?? 0;
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