// Make sure enemyHash is included before any boss files which depend on it.
export * from 'app/content/enemies/enemyHash';
export * from 'app/content/bosses/beetleBoss';
export * from 'app/content/bosses/rival';
export * from 'app/content/bosses/golem';
export * from 'app/content/bosses/idols';
export * from 'app/content/bosses/guardian';
export * from 'app/content/bosses/rival2';
export * from 'app/content/bosses/crystalCollector';
export * from 'app/content/bosses/balloonMegapede';
export * from 'app/content/bosses/flameBeast';
export * from 'app/content/bosses/flameHeart';
export * from 'app/content/bosses/frostBeast';
export * from 'app/content/bosses/stormBeast';
export * from 'app/content/bosses/stormHeart';
export * from 'app/content/bosses/voidTree';

export const bossTypes = <const>[
    'beetleBoss',
    'rival', 'rival2',
    'golem',
    'stormIdol', 'flameIdol', 'frostIdol',
    'guardian',
    'crystalCollector',
    'balloonMegapede',
    'largeOrb',
    'superSquirrel',
    'frostHeart', 'frostBeast',
    'flameHeart', 'flameBeast',
    'stormHeart', 'stormBeast',
    'voidTree',
];

const minionTypes = <const>[
    'beetleBossWingedMinionDefinition',
    'golemHand',
    'guardianProjection',
    'voidStone', 'voidFlame', 'voidFrost', 'voidStorm', 'voidHand',
];

declare global {
    export type BossType = typeof bossTypes[number];
    export type MinionType = typeof minionTypes[number];
}
