// Make sure enemyHash is included before any boss files which depend on it.
export * from 'app/content/enemies/enemyHash';
export * from 'app/content/bosses/beetleBoss';
export * from 'app/content/bosses/rival';
export * from 'app/content/bosses/golem';
export * from 'app/content/bosses/idols';
export * from 'app/content/bosses/guardian';
export * from 'app/content/bosses/crystalCollector';
export * from 'app/content/bosses/balloonMegapede';
export * from 'app/content/bosses/flameBeast';
export * from 'app/content/bosses/frostBeast';
export * from 'app/content/bosses/stormBeast';
export * from 'app/content/bosses/voidTree';

export const bossTypes = <const>[
    'beetleBoss',
    'rival',
    'golem',
    'stormIdol', 'flameIdol', 'frostIdol',
    'guardian',
    'crystalCollector',
    'balloonMegapede',
    'superSquirrel',
    'frostHeart', 'frostBeast',
    'flameHeart', 'flameBeast',
    'stormHeart', 'stormBeast',
    'voidTree',
];
export type BossType = typeof bossTypes[number];

const minionTypes = <const>[
    'beetleBossWingedMinionDefinition',
    'golemHand',
    'guardianProjection',
    'voidStone', 'voidFlame', 'voidFrost', 'voidStorm', 'voidHand',
];

export type MinionType = typeof minionTypes[number];
