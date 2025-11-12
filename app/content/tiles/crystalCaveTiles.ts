import {
    BITMAP_MIDDLE_DOWN_RIGHT, BITMAP_MIDDLE_UP_RIGHT,
    BITMAP_BOTTOM_2,
    BITMAP_BOTTOM_LEFT, BITMAP_BOTTOM_RIGHT,
    BITMAP_LEFT_2,
    BITMAP_RIGHT_2,
    BITMAP_TOP_2,
} from 'app/content/bitMasks';
import {
    bottomLeftCeiling,
    bottomRightCeiling,
    crystalParticles,
    southernWallBehavior,
    topRightWall,
    topLeftWall,
} from 'app/content/tiles/constants';
import { requireFrame } from 'app/utils/packedImages';

const crystalCaveCeiling: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'foreground2' },
        '0x12': bottomLeftCeiling, '1x12': bottomLeftCeiling,
        '2x12': bottomRightCeiling, '3x12': bottomRightCeiling,
    },
    tileCoordinates: [
                        [ 2, 7],[ 3, 7],[ 4, 7],[ 5, 7],
                        [ 2, 8],[ 3, 8],[ 4, 8],[ 5, 8],
                        [ 2, 9],[ 3, 9],
        [ 0,10],[ 1,10],[ 2,10],[ 3,10],

        [ 0,12],[ 1,12],[ 2,12],[ 3,12],
    ],
};

const crystalCaveCeilingTopAngles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 0, y: 0, w: 48, h: 80}),
    behaviors: {
        '8x2': bottomLeftCeiling, '9x2': bottomLeftCeiling,
        '10x2': bottomRightCeiling, '11x2': bottomRightCeiling,
    },
    tileCoordinates: [
        [ 8, 2],[ 9, 2],[10, 2],[11, 2],
    ],
};

const crystalCaveWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 0, y: 0, w: 48, h: 80}),
    behaviors: {
        'all': southernWallBehavior,
        '12x3': topRightWall, '13x3': topRightWall,
        '14x3': topLeftWall, '15x3': topLeftWall,
    },
    tileCoordinates: [
    [ 7, 0],[ 8, 0],[ 9, 0],[10, 0],[11, 0],[12, 0],[13, 0],[14, 0],[15, 0],
    [ 7, 1],[ 8, 1],[ 9, 1],[10, 1],[11, 1],[12, 1],[13, 1],[14, 1],
                                            [12, 2],[13, 2],[14, 2],[15, 2],
                                            [12, 3],[13, 3],[14, 3],[15, 3],
    ],
};

const crystalCaveStairs: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'field' },
    },
    tileCoordinates: [
        [16, 0],[17, 0],[18, 0],
        [16, 1],[17, 1],[18, 1],
        [16, 2],[17, 2],[18, 2],
        [16, 3],[17, 3],[18, 3],
        [16, 4],[17, 4],[18, 4],
    ],
};

const crystalCaveLedges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },

        '8x8': { defaultLayer: 'floor2', ledges: {right: true}},
        '9x8': { defaultLayer: 'floor2', ledges: {right: true}},
        '8x9': { defaultLayer: 'floor2', ledges: {left: true}},
        '9x9': { defaultLayer: 'floor2', ledges: {left: true}},
        '10x9': { defaultLayer: 'floor2', ledges: {down: true}},
        '11x9': { defaultLayer: 'floor2', ledges: {down: true}},
        '12x9': { defaultLayer: 'floor2', ledges: {up: true}},
        '13x9': { defaultLayer: 'floor2', ledges: {up: true}},

        '8x10': { defaultLayer: 'floor2', ledges: {right: true}, solid: BITMAP_RIGHT_2, isGround: false, low: true },
        '9x10': { defaultLayer: 'floor2', ledges: {right: true}, solid: BITMAP_RIGHT_2, isGround: false, low: true },
        '8x11': { defaultLayer: 'floor2', ledges: {left: true}, solid: BITMAP_LEFT_2, isGround: false, low: true },
        '9x11': { defaultLayer: 'floor2', ledges: {left: true}, solid: BITMAP_LEFT_2, isGround: false, low: true },
        '10x11': { defaultLayer: 'floor2', ledges: {down: true}, solid: BITMAP_BOTTOM_2, isGround: false, low: true },
        '11x11': { defaultLayer: 'floor2', ledges: {down: true}, solid: BITMAP_BOTTOM_2, isGround: false, low: true },
        '12x11': { defaultLayer: 'floor2', ledges: {up: true}, solid: BITMAP_TOP_2, isGround: false, low: true },
        '13x11': { defaultLayer: 'floor2', ledges: {up: true}, solid: BITMAP_TOP_2, isGround: false, low: true },

        '8x12': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright' },
        '9x12': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft' },
        '10x12': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright' },
        '11x12': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft' },
        '12x12': { defaultLayer: 'floor2'},
        '13x12': { defaultLayer: 'floor2'},

        '8x13': { defaultLayer: 'floor2', diagonalLedge: 'upright' },
        '9x13': { defaultLayer: 'floor2', diagonalLedge: 'upleft' },
        '10x13': { defaultLayer: 'floor2', diagonalLedge: 'upright' },
        '11x13': { defaultLayer: 'floor2', diagonalLedge: 'upleft' },
        '12x13': { defaultLayer: 'floor2'},
        '13x13': { defaultLayer: 'floor2'},

        '8x14': { defaultLayer: 'floor2', ledges: { down: true, right: true }, solid: BITMAP_BOTTOM_RIGHT, isGround: false, low: true},
        '9x14': { defaultLayer: 'floor2', ledges: { down: true, left: true }, solid: BITMAP_BOTTOM_LEFT, isGround: false, low: true},
        '10x14': { defaultLayer: 'floor2', ledges: { down: true, right: true }, solid: BITMAP_BOTTOM_RIGHT, isGround: false, low: true},
        '11x14': { defaultLayer: 'floor2', ledges: { down: true, left: true }, solid: BITMAP_BOTTOM_LEFT, isGround: false, low: true},

        '8x15': { defaultLayer: 'floor2', solid: BITMAP_MIDDLE_DOWN_RIGHT, isGround: false, low: true, diagonalLedge: 'upright'},
        '9x15': { defaultLayer: 'floor2', solid: BITMAP_MIDDLE_UP_RIGHT, isGround: false, low: true, diagonalLedge: 'upleft'},
        '10x15': { defaultLayer: 'floor2', solid: BITMAP_MIDDLE_DOWN_RIGHT, isGround: false, low: true, diagonalLedge: 'upright'},
        '11x15': { defaultLayer: 'floor2', solid: BITMAP_MIDDLE_UP_RIGHT, isGround: false, low: true, diagonalLedge: 'upleft'},

    },
    tileCoordinates: [
        [ 8, 8],[ 9, 8],
        [ 8, 9],[ 9, 9],[10, 9],[11, 9],[12, 9],[13, 9],
        [ 8,10],[ 9,10],
        [ 8,11],[ 9,11],[10,11],[11,11],[12,11],[13,11],
        [ 8,12],[ 9,12],[10,12],[11,12],[12,12],[13,12],
        [ 8,13],[ 9,13],[10,13],[11,13],[12,13],[13,13],
        [ 8,14],[ 9,14],[10,14],[11,14],[12,14],[13,14],
        [ 8,15],[ 9,15],[10,15],[11,15],[12,15],[13,15],
    ],
};

const crystalCaveFloorDecorations: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [
                [16, 5],[17, 5],[18, 5],
                [16, 6],        [18, 6],
        [15, 7],[16, 7],[17, 7],[18, 7],
                        [17, 8],[18, 8],
                [16, 9],[17, 9],[18, 9],
                [16,10],        [18,10],
                [16,11],[17,11],[18,11],
                [16,12],[17,12],
        [15,13],[16,13],[17,13],[18,13],
        [15,14],[16,14],[17,14],[18,14],
                [16,15],[17,15],
    ],
};

const crystalCaveFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor' },
        '13x5': { defaultLayer: 'field', underTile: 317, isBrittleGround: true, particles: crystalParticles, breakSound: 'switch'},
    },
    tileCoordinates: [
        [12, 4], [13, 4], [14, 4],
        [12, 5], [13, 5], [14, 5],
    ],
};

export const crystalTransparentFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 208, y: 96, w: 16, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'field', underTile: 0, isBrittleGround: true, isGround: true, particles: crystalParticles, breakSound: 'switch'},
    },
};
const crystalCaveFloorEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [
        [ 8, 4],[ 9, 4],[10, 4],[11, 4],
        [ 8, 5],[ 9, 5],[10, 5],[11, 5],
    ],
};

const crystalGrates: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalgrateplain.png', {x: 0, y: 0, w: 48, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
};

export const allCrystalCaveTileSources: TileSource[] = [
    crystalCaveCeiling,
    crystalCaveWalls,
    crystalCaveFloor,
    crystalCaveFloorEdges,
    crystalCaveFloorDecorations,
    crystalCaveLedges,
    crystalCaveStairs,
    crystalCaveCeilingTopAngles,
    crystalGrates,
];
