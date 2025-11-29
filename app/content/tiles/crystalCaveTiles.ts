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
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 0, y: 112, w: 96, h: 96}),
    behaviors: {
        'all': { defaultLayer: 'foreground2' },
        '0x5': bottomLeftCeiling, '1x5': bottomLeftCeiling,
        '2x5': bottomRightCeiling, '3x5': bottomRightCeiling,
    },
    tileCoordinates: [
                    [2,0],[3,0],[4,0],[5,0],
                    [2,1],[3,1],[4,1],[5,1],
                    [2,2],[3,2],
        [0,3],[1,3],[2,3],[3,3],

        [0,5],[1,5],[2,5],[3,5],
    ],
};

const crystalCaveCeilingTopAngles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 128, y: 32, w: 64, h: 16}),
    behaviors: {
        '0x0': bottomLeftCeiling, '1x0': bottomLeftCeiling,
        '2x0': bottomRightCeiling, '3x0': bottomRightCeiling,
    },
};

const crystalCaveWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 112, y: 0, w: 144, h: 64}),
    behaviors: {
        'all': southernWallBehavior,
        '5x3': topRightWall, '6x3': topRightWall,
        '7x3': topLeftWall, '8x3': topLeftWall,
    },
    tileCoordinates: [
        [0, 0],[1, 0],[2, 0],[3, 0],[4, 0],[5, 0],[6, 0],[7, 0],[8, 0],
        [0, 1],[1, 1],[2, 1],[3, 1],[4, 1],[5, 1],[6, 1],[7, 1],
                                           [5, 2],[6, 2],[7, 2],[8, 2],
                                           [5, 3],[6, 3],[7, 3],[8, 3],
    ],
};

const crystalCaveStairs: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 256, y: 0, w: 48, h: 80}),
    behaviors: {
        'all': { defaultLayer: 'field' },
    },
};

const crystalCaveLedges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 128, y: 128, w: 96, h: 128}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },

        '0x0': { defaultLayer: 'floor2', ledges: {right: true}},
        '1x0': { defaultLayer: 'floor2', ledges: {right: true}},
        '0x1': { defaultLayer: 'floor2', ledges: {left: true}},
        '1x1': { defaultLayer: 'floor2', ledges: {left: true}},
        '2x1': { defaultLayer: 'floor2', ledges: {down: true}},
        '3x1': { defaultLayer: 'floor2', ledges: {down: true}},
        '4x1': { defaultLayer: 'floor2', ledges: {up: true}},
        '5x1': { defaultLayer: 'floor2', ledges: {up: true}},

        '0x2': { defaultLayer: 'floor2', ledges: {right: true}, solid: BITMAP_RIGHT_2, isGround: false, low: true },
        '1x2': { defaultLayer: 'floor2', ledges: {right: true}, solid: BITMAP_RIGHT_2, isGround: false, low: true },
        '0x3': { defaultLayer: 'floor2', ledges: {left: true}, solid: BITMAP_LEFT_2, isGround: false, low: true },
        '1x3': { defaultLayer: 'floor2', ledges: {left: true}, solid: BITMAP_LEFT_2, isGround: false, low: true },
        '2x3': { defaultLayer: 'floor2', ledges: {down: true}, solid: BITMAP_BOTTOM_2, isGround: false, low: true },
        '3x3': { defaultLayer: 'floor2', ledges: {down: true}, solid: BITMAP_BOTTOM_2, isGround: false, low: true },
        '4x3': { defaultLayer: 'floor2', ledges: {up: true}, solid: BITMAP_TOP_2, isGround: false, low: true },
        '5x3': { defaultLayer: 'floor2', ledges: {up: true}, solid: BITMAP_TOP_2, isGround: false, low: true },

        '0x4': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright' },
        '1x4': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft' },
        '2x4': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright' },
        '3x4': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft' },
        '4x4': { defaultLayer: 'floor2'},
        '5x4': { defaultLayer: 'floor2'},

        '0x5': { defaultLayer: 'floor2', diagonalLedge: 'upright' },
        '1x5': { defaultLayer: 'floor2', diagonalLedge: 'upleft' },
        '2x5': { defaultLayer: 'floor2', diagonalLedge: 'upright' },
        '3x5': { defaultLayer: 'floor2', diagonalLedge: 'upleft' },
        '4x5': { defaultLayer: 'floor2'},
        '5x5': { defaultLayer: 'floor2'},

        '0x6': { defaultLayer: 'floor2', ledges: { down: true, right: true }, solid: BITMAP_BOTTOM_RIGHT, isGround: false, low: true},
        '1x6': { defaultLayer: 'floor2', ledges: { down: true, left: true }, solid: BITMAP_BOTTOM_LEFT, isGround: false, low: true},
        '2x6': { defaultLayer: 'floor2', ledges: { down: true, right: true }, solid: BITMAP_BOTTOM_RIGHT, isGround: false, low: true},
        '3x6': { defaultLayer: 'floor2', ledges: { down: true, left: true }, solid: BITMAP_BOTTOM_LEFT, isGround: false, low: true},

        '0x7': { defaultLayer: 'floor2', solid: BITMAP_MIDDLE_DOWN_RIGHT, isGround: false, low: true, diagonalLedge: 'upright'},
        '1x7': { defaultLayer: 'floor2', solid: BITMAP_MIDDLE_UP_RIGHT, isGround: false, low: true, diagonalLedge: 'upleft'},
        '2x7': { defaultLayer: 'floor2', solid: BITMAP_MIDDLE_DOWN_RIGHT, isGround: false, low: true, diagonalLedge: 'upright'},
        '3x7': { defaultLayer: 'floor2', solid: BITMAP_MIDDLE_UP_RIGHT, isGround: false, low: true, diagonalLedge: 'upleft'},

    },
    tileCoordinates: [
        [0,0],[1,0],
        [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],
        [0,2],[1,2],
        [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],
        [0,4],[1,4],[2,4],[3,4],[4,4],[5,4],
        [0,5],[1,5],[2,5],[3,5],[4,5],[5,5],
        [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],
        [0,7],[1,7],[2,7],[3,7],[4,7],[5,7],
    ],
};

const crystalCaveFloorDecorations: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 240, y: 80, w: 64, h: 176}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [
              [1,0],[2,0],[3,0],
              [1,1],      [3,1],
        [0,2],[1,2],[2,2],[3,2],
                    [2,3],[3,3],
              [1,4],[2,4],[3,4],
              [1,5],      [3,5],
              [1,6],[2,6],[3,6],
              [1,7],[2,7],
        [0,8],[1,8],[2,8],[3,8],
        [0,9],[1,9],[2,9],[3,9],
              [1,10],[2,10],
    ],
};

const crystalCaveFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 192, y: 64, w: 48, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'floor' },
        '1x1': { defaultLayer: 'field', underTile: 317, isBrittleGround: true, particles: crystalParticles, breakSound: 'switch'},
    },
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
    source: requireFrame('gfx/tiles/crystalcavesheet.png', {x: 128, y: 64, w: 64, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
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
