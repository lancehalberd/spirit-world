
export const bossFlags: {[key in BossKey]: string} = {
    // The first boss is always unlocked so that the boss rush menu can never be empty.
    beetle: 'peachCaveBoss',
    golem: 'tombBoss',
    idols: 'warTempleBoss',
    guardian: 'cocoonBoss',
    rival2: 'helixRivalBoss',
    forestTempleBoss: 'forestTempleBoss',
    collector: 'waterfallTowerBoss',
    stormBeast: 'stormBeast',
    flameBeast: 'flameBeast',
    frostBeast: 'frostBeast',
    voidTree: 'voidTree',
};

export const bossNames: {[key in BossKey]: string} = {
    beetle: 'Giant Fly',
    golem: 'Golem',
    idols: 'War Idols',
    guardian: 'Guardian',
    rival2: 'Saru',
    forestTempleBoss: 'Prototypes',
    collector: 'Collector',
    stormBeast: 'Storm Beast',
    flameBeast: 'Flame Beast',
    frostBeast: 'Frost Beast',
    voidTree: 'Void Tree',
}

export function isBossDefeated(state: GameState, bossKey: BossKey): boolean {
    return !!state.savedState.objectFlags[bossFlags[bossKey]];
}
