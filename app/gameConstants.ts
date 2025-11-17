import { readGetParameter, readGetParameterAsInt } from 'app/utils/index';

// Update duration in milliseconds.
export const FRAME_LENGTH = 20;

// Dimensions of the canvas in canvas pixels.
export const CANVAS_WIDTH = 256;
export const CANVAS_HEIGHT = 224;

export const KEY_THRESHOLD = FRAME_LENGTH;

export const LEFT_TOOL_COLOR = 'blue';
export const RIGHT_TOOL_COLOR = 'yellow';

export const MAX_SPIRIT_RADIUS = 80;

export const EXPLOSION_RADIUS = 32;
// This should be a multiple of the number of frames in the MC detonate animation, which is currently 8 frames * 20ms long.
export const EXPLOSION_TIME = 640;

export const GAME_KEY = {
    MENU: 0,
    LEFT_TOOL: 1,
    RIGHT_TOOL: 2,
    PASSIVE_TOOL: 3,
    WEAPON: 4,
    PREVIOUS_ELEMENT: 5,
    NEXT_ELEMENT: 6,
    UP: 7,
    DOWN: 8,
    LEFT: 9,
    RIGHT: 10,
    ROLL: 11,
    MEDITATE: 12,
    MAP: 13,
};

export const FADE_IN_DURATION = 600;
export const FADE_OUT_DURATION = 600;
export const CIRCLE_WIPE_IN_DURATION = 1000;
export const CIRCLE_WIPE_OUT_DURATION = 1000;
export const WATER_TRANSITION_DURATION = 200;
export const MUTATE_DURATION = 1200;

export const MAX_FLOAT_HEIGHT = 3;
export const MAX_FLOOR_HEIGHT = 3;
// Anything higher than the max floor height plus the max floating height causes the player to be falling.
export const FALLING_HEIGHT = MAX_FLOAT_HEIGHT + MAX_FLOOR_HEIGHT + 1;

export const RIVAL_NAME = 'Saru';

export const CHAKRAM_2_NAME = 'Golden Chakram';

export const entranceSeed = readGetParameterAsInt('entranceSeed');
// Entrance randomizer may not be completable with randomized items, so item randomizer
// defaults to the entrance seed if one is not set.
export const randomizerSeed = readGetParameterAsInt('seed') || entranceSeed;
export const itemSeed = readGetParameterAsInt('itemSeed') || randomizerSeed;

// For future use, seed that will control variations that modify the overall structure and flow of the game.
// This could change the overworld layout, which dungeons are present, etc.
export const worldSeed = readGetParameterAsInt('worldSeed');

// This seed is used for randomizing minor variations in the game, such as the solution to some puzzles
// and certain random elements and areas.
export const variantSeed = readGetParameterAsInt('variantSeed') || randomizerSeed;
// Limit randomizer total to 999 to avoid having the victory point display get too large.
export const randomizerTotal = Math.min(readGetParameterAsInt('total') || 30, 999);
const isBossGoal = readGetParameter('goal') === 'boss';
export const randomizerGoalType: 'victoryPoints' | 'finalBoss' = isBossGoal ? 'finalBoss' : 'victoryPoints';
const defaultGoalCount = (randomizerTotal * 2 / 3) | 0;
export const randomizerGoal = Math.min(randomizerTotal, readGetParameterAsInt('goal') || defaultGoalCount);
export const enemySeed = readGetParameterAsInt('enemySeed');

// Setting any of these seeds will put the game in randomizer mode.
// In randomizer mode, story elements are removed and HUD elements are added showing remaining checks/victory points.
export const isRandomizer = !!entranceSeed || !!itemSeed || !!enemySeed;

export const allLootTypes: LootType[] = [
    'empty',
    'peachOfImmortality',
    'peachOfImmortalityPiece',
    'money',
    'silverOre',
    'goldOre',
    'weapon',
    'bigKey',
    'smallKey',
    'map',
    'secondChance',
    // This is used for the basic goal in randomizer.
    'victoryPoint',
    // This is the special progressive spirit power loot used by the randomizer.
    'spiritPower',
    'bow', 'clone', 'staff', 'cloak',
    'gloves',
    'roll',
    'nimbusCloud',
    'catEyes', 'spiritSight', 'trueSight',
    'astralProjection', 'teleportation',
    'ironSkin', 'goldMail', 'phoenixCrown',
    'waterBlessing', 'fireBlessing', 'lightningBlessing',
    'leatherBoots', 'ironBoots', 'cloudBoots',
    'fire', 'ice', 'lightning',
    // Blueprints
    'spikeBoots', 'flyingBoots', 'forgeBoots',
];

// 'foreground3' is rarely required for certain combinations of trees.
export const layersInOrder = ['water', 'floor', 'floor2', 'field', 'field2', 'foreground', 'foreground2', 'foreground3', 'behaviors'];

export const overworldKeys = ['overworld', 'sky', 'underwater'];

export function getElementColor(element: MagicElement) {
    switch(element){
        case 'fire': return 'red';
        case 'ice': return 'white';
        case 'lightning': return 'yellow';
    }
    return 'grey';
}
export function getElementLightColor(element: MagicElement): LightColor {
    switch(element){
        case 'fire': return {r: 255, g: 0, b: 0}
        case 'ice': return {r: 255, g: 255, b: 255};
        case 'lightning': return {r: 255, g: 255, b: 0};
    }
    return {r: 150, g: 150, b: 150};
}

// Gameplay modifiers
export const gameModifiers = {
    globalDamageTaken: 1,
    globalDamageDealt: 1,
    // Increases the composite difficulty by this multiplier.
    // Support is being added gradually for this and it does not effect all enemies or game modes.
    globalEnemyDifficulty: 1,
    // Effects how long the cooldown is before spirity energy starts regenerating.
    spiritEnergyCooldown: 1,
    // Effects how fast spirit energy regenerates.
    spiritEnergyRegeneration: 1,
    // Effects how much bonus spirit regeneration certain items grant
    // like fire/ice/lightning elements and the phoenix crown.
    bonusSpiritRegeneration: 1,
    // Effects how much damage the bow tool deals.
    bowDamage: 1,
    // If this if truthy, the golden mail will only reduce physical damage.
    nerfGoldenMail: 0,
    // If this is truthy, the phoenix crown will not improve spirit regeneration as much.
    nerfPhoenixCrown: 0,
    // Increasing this makes traps like arrow traps and lightning barriers speed up.
    trapSpeed: 1,

};
window.gameModifiers = gameModifiers;

type GameModifier = keyof typeof gameModifiers;

export const challenge = readGetParameter('challenge');
if (challenge === 'easy') {
    gameModifiers.globalDamageTaken = 0.5;
    gameModifiers.globalDamageDealt = 2;
    gameModifiers.spiritEnergyCooldown = 0.75;
    gameModifiers.spiritEnergyRegeneration = 1.5;
} else if (challenge === 'hard') {
    gameModifiers.globalDamageTaken = 1.5;
    gameModifiers.globalDamageDealt = 0.75;
    gameModifiers.spiritEnergyCooldown = 1.5;
    gameModifiers.spiritEnergyRegeneration = 0.75;
    gameModifiers.bonusSpiritRegeneration = 0.75;
    gameModifiers.bowDamage = 0.75;
    gameModifiers.nerfGoldenMail = 1;
    gameModifiers.nerfPhoenixCrown = 1;
    gameModifiers.globalEnemyDifficulty = 2;
    gameModifiers.trapSpeed = 1.8;
}

for (const key of Object.keys(gameModifiers) as GameModifier[]) {
    gameModifiers[key] = readGetParameterAsInt(key, gameModifiers[key]);
}
