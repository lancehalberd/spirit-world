import { readGetParameter, readGetParameterAsInt } from 'app/utils/index';

import { LootType, MagicElement } from 'app/types';

// Update duration in milliseconds.
export const FRAME_LENGTH = 20;

// Dimensions of the canvas in canvas pixels.
export const CANVAS_WIDTH = 256;
export const CANVAS_HEIGHT = 224;
// Scale of canvas pixels relative to document pixels.
export const CANVAS_SCALE = 3;

// Dimensions of the game in document pixels.
export const DOM_WIDTH = CANVAS_WIDTH * CANVAS_SCALE;
export const DOM_HEIGHT = CANVAS_HEIGHT * CANVAS_SCALE;

export const KEY_THRESHOLD = FRAME_LENGTH;

export const LEFT_TOOL_COLOR = 'blue';
export const RIGHT_TOOL_COLOR = 'yellow';

export const MAX_SPIRIT_RADIUS = 80;

export const EXPLOSION_RADIUS = 30;
export const EXPLOSION_TIME = 600;

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
export const MUTATE_DURATION = 1200;

export const MAX_FLOAT_HEIGHT = 3;
export const MAX_FLOOR_HEIGHT = 3;
// Anything higher than the max floor height plus the max floating height causes the player to be falling.
export const FALLING_HEIGHT = MAX_FLOAT_HEIGHT + MAX_FLOOR_HEIGHT + 1;

export const RIVAL_NAME = 'Saru';

export const entranceSeed = readGetParameterAsInt('entranceSeed');
// Entrance randomizer may not be completable with randomized items, so item randomizer
// defaults to the entrance seed if one is not set.
export const randomizerSeed = readGetParameterAsInt('seed') || entranceSeed;
export const isRandomizer = !!randomizerSeed;
// Limit randomizer total to 999 to avoid having the victory point display get too large.
export const randomizerTotal = Math.min(readGetParameterAsInt('total') || 20, 999);
const isBossGoal = readGetParameter('goal') === 'boss';
export const randomizerGoalType: 'victoryPoints' | 'finalBoss' = isBossGoal ? 'finalBoss' : 'victoryPoints';
export const randomizerGoal = Math.min(randomizerTotal, readGetParameterAsInt('goal') || 10);
export const enemySeed = readGetParameterAsInt('enemySeed');

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
    'ironBoots', 'cloudBoots',
    'fire', 'ice', 'lightning'
];

export const layersInOrder = ['floor', 'floor2', 'field', 'field2', 'foreground', 'foreground2'];

export const overworldKeys = ['overworld', 'sky', 'underwater'];

export function getElementColor(element: MagicElement) {
    switch(element){
        case 'fire': return 'red';
        case 'ice': return 'white';
        case 'lightning': return 'yellow';
    }
    return 'grey';
}
