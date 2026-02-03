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
};

const allBossRushOptions: BossRushOption[] = [
    {
        label: 'Beetle',
        key: 'beetle',
        bosses: ['beetle'],
        location: ['beetleRefight']
    },
    {
        label: 'Golem',
        key: 'golem',
        bosses: ['golem'],
        location: ['golemRefight']
    },
    {
        label: 'War Idols',
        key: 'idols',
        bosses: ['idols'],
        location: ['warTempleRefight']
    },
    {
        label: 'Guardian',
        key: 'guardian',
        bosses: ['guardian'],
        location: ['guardianRefight']
    },
    {
        label: 'Forest Idols',
        key: 'forest',
        bosses: ['forest'],
        location: ['forestTempleRefight']
    },
    {
        label: 'Rival 2',
        key: 'rival2',
        bosses: ['rival2'],
        location: ['rival2Refight']
    },
    {
        label: 'Collector',
        key: 'collector',
        bosses: ['collector'],
        location: ['collectorRefight']
    },
    {
        label: 'Flame Beast',
        key: 'flameBeast',
        bosses: ['flameBeast'],
        location: ['flameBeastRefight']
    },
    {
        label: 'Frost Beast',
        key: 'frostBeast',
        bosses: ['frostBeast'],
        location: ['frostBeastRefight']
    },
    {
        label: 'Storm Beast',
        key: 'stormBeast',
        bosses: ['stormBeast'],
        location: ['stormBeastRefight']
    },
    {
        label: 'Odd Golem',
        key: 'altGolem',
        bosses: ['golem'],
        location: ['golemRefight'],
        playerState: altGolemState,
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
        location: ['beetleRefight', 'golemRefight', 'warTempleRefight', 'guardianRefight']
    },
    {
        label: 'Rush 2',
        key: 'rush2',
        bosses: ['forest', 'rival2', 'collector'],
        location: ['forestTempleRefight', 'rival2Refight', 'collectorRefight'],
        isVisible(state: GameState) {
            return true;
        }
    },
    {
        label: 'Rush 3',
        key: 'rush3',
        location: ['flameBeastRefight', 'frostBeastRefight', 'stormBeastRefight'],
        bosses: ['flameBeast', 'frostBeast', 'stormBeast'],
        isVisible(state: GameState) {
            return !!(state.savedState.objectFlags.flameBeast && 
                      state.savedState.objectFlags.frostBeast &&
                      state.savedState.objectFlags.stormBeast && 1);
        }
    },
];
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

function travelToLocation(state: GameState, zoneKey: string, markerId: string): string {
  if (state.travel) {
    state.travel(zoneKey, markerId, {instant: false});
    return '';
  }
  console.log("Can't find travel function!")
} //WIP: reduce travelToLocation redefinitions

export function startNextBoss(state: GameState): string {
    return travelToLocation(state, 'bossRefights', fightLocations[state.bossRushTrackers.currentBoss]
        [state.bossRushTrackers.rushPosition]);
}