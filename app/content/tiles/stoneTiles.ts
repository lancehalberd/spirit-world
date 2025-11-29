import {
    BITMAP_BOTTOM_6,
    BITMAP_BOTTOM_LEFT, BITMAP_BOTTOM_RIGHT,
    BITMAP_LEFT_6,
    BITMAP_RIGHT_6,
} from 'app/content/bitMasks';
import { 
    bottomCeilingBehavior,
    bottomLeftCeiling,
    bottomLeftShallowCeiling,
    bottomRightCeiling,
    bottomRightShallowCeiling,
    ceilingBehavior,
    lightStoneParticles,
    southernWallBehavior,
    topRightWall,
    topLeftWall,
} from 'app/content/tiles/constants';
import { requireFrame } from 'app/utils/packedImages';

const stoneCeiling: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/stonetileset.png', {x: 0, y: 0, w: 96, h: 208}),
    behaviors: {
        'all': ceilingBehavior,
        '3x0': bottomCeilingBehavior,
        '1x1': bottomCeilingBehavior,
        '2x2': bottomCeilingBehavior, '3x2': bottomCeilingBehavior, '4x2': bottomCeilingBehavior,
        '0x3': bottomCeilingBehavior, '1x3': bottomCeilingBehavior, '3x3': bottomCeilingBehavior,
        '0x4': bottomRightShallowCeiling, '4x4': bottomRightShallowCeiling, '1x7': bottomRightShallowCeiling,
        '1x4': bottomLeftShallowCeiling, '5x4': bottomLeftShallowCeiling, '0x7': bottomLeftShallowCeiling,
        '5x3': bottomLeftCeiling, '0x5': bottomLeftCeiling, '1x6': bottomLeftCeiling,
        '4x3': bottomRightCeiling, '1x5': bottomRightCeiling, '0x6': bottomRightCeiling,
        '0x12': bottomLeftCeiling, '1x12': bottomLeftCeiling,
        '2x12': bottomRightCeiling, '3x12': bottomRightCeiling,
    },
    tileCoordinates: [
        [0,0],            [3,0],
        [0,1],[1,1],[2,1],[3,1],[4,1],
        [0,2],      [2,2],[3,2],[4,2],
        [0,3],[1,3],[2,3],[3,3],
        [0,4],[1,4],[2,4],
        [0,5],[1,5],

                        [ 2, 7],[ 3, 7],[ 4, 7],[ 5, 7],
                        [ 2, 8],[ 3, 8],[ 4, 8],[ 5, 8],
                        [ 2, 9],[ 3, 9],
        [ 0,10],[ 1,10],[ 2,10],[ 3,10],

        [ 0,12],[ 1,12],[ 2,12],[ 3,12],
    ],
};

const stoneCeilingTopAngles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/stonetileset.png', {x: 144, y: 32, w: 32, h: 16}),
    behaviors: {
        '0x0': {defaultLayer: 'foreground2', solid: BITMAP_BOTTOM_LEFT},
        '1x0': {defaultLayer: 'foreground2', solid: BITMAP_BOTTOM_RIGHT},
    },
};

const stoneWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/stonetileset.png', {x: 112, y: 0, w: 128, h: 64}),
    behaviors: {
        'all': southernWallBehavior,
        '6x3': topRightWall,
        '7x3': topLeftWall,
    },
    tileCoordinates: [
        [0, 0],[1, 0],[2, 0],[3, 0],[4, 0],
        [0, 1],[1, 1],[2, 1],[3, 1],[4, 1],
                                               [6, 2],[7, 2],
                                               [6, 3],[7, 3],
    ],
};

const stoneStairs: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/stonetileset.png', {x: 256, y: 0, w: 48, h: 80}),
    behaviors: {
        'all': { defaultLayer: 'field' },
    },
};

const stoneLedges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/stonetileset.png', {x: 128, y: 96, w: 96, h: 128}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        '0x2': { defaultLayer: 'floor2', ledges: { right: true } },
        '1x2': { defaultLayer: 'floor2', ledges: { right: true } },

        '0x3': { defaultLayer: 'floor2', ledges: { left: true } },
        '1x3': { defaultLayer: 'floor2', ledges: { left: true } },
        '2x3': { defaultLayer: 'floor2', ledges: { down: true } },
        '3s3': { defaultLayer: 'floor2', ledges: { down: true } },
        '4x3': { defaultLayer: 'floor2', ledges: {down: false}, solid: BITMAP_BOTTOM_6, low: true, },
        '5x3': { defaultLayer: 'floor2', ledges: {down: false}, solid: BITMAP_BOTTOM_6, low: true, },

        '0x4': { defaultLayer: 'floor2', solid: BITMAP_RIGHT_6 },
        '1x4': { defaultLayer: 'floor2', solid: BITMAP_RIGHT_6 },

        '0x5': { defaultLayer: 'floor2', solid: BITMAP_LEFT_6 },
        '1x5': { defaultLayer: 'floor2', solid: BITMAP_LEFT_6 },
        '2x5': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_6 },
        '3s5': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_6 },
        '4x5': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_6 },
        '5x5': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_6 },

        '0x6': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright' },
        '1x6': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft' },
        '2x6': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright' },
        '3s6': { defaultLayer: 'floor2', solid: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft' },

        '0x7': { defaultLayer: 'floor2', diagonalLedge: 'upright' },
        '1x7': { defaultLayer: 'floor2', diagonalLedge: 'upleft' },
        '2x7': { defaultLayer: 'floor2', diagonalLedge: 'upright' },
        '3s7': { defaultLayer: 'floor2', diagonalLedge: 'upleft' },
    },
    tileCoordinates: [
        [0,0],[1,0],
        [0,1],[1,1],
        [0,2],[1,2],
        [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],
        [0,4],[1,4],
        [0,5],[1,5],[2,5],[3,5],[4,5],[5,5],
        [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],
        [0,7],[1,7],[2,7],[3,7],[4,7],[5,7],
    ],
};

const stoneFloorDecorations: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/stonetileset.png', {x: 240, y: 80, w: 64, h: 176}),
    behaviors: {
        'all': {defaultLayer: 'floor2'},
        '2x2': {defaultLayer: 'floor'},
        '3x2': {defaultLayer: 'floor'},
        '2x3': {defaultLayer: 'floor'},
        '3x3': {defaultLayer: 'floor'},
    },
    tileCoordinates: [
        [0,0],[1,0],[2,0],[3,0],
        [0,1],[1,1],[2,1],[3,1],
        [0,2],[1,2],[2,2],[3,2],
                    [2,3],[3,3],
              [1,4],[2,4],[3,4],
              [1,5],       [3,5],
              [1,6],[2,6],[3,6],
              [1,7],[2,7],
        [0,8],[1,8],[2,8],[3,8],
        [0,9],[1,9],[2,9],[3,9],
              [1,10],[2,10],
    ],
};

const stoneFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/stonetileset.png', {x: 192, y: 64, w: 48, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'floor' },
        '1x1': { defaultLayer: 'field', underTile: 4, isBrittleGround: true, particles: lightStoneParticles, breakSound: 'rockShatter'},
    },
    tileCoordinates: [
        [0,0],[1,0],[2,0],
        [0,1],[1,1],
    ],
};
const stoneFloorEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/stonetileset.png', {x: 128, y: 64, w: 64, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
};

export const allStoneTileSources: TileSource[] = [
    stoneCeiling,
    stoneWalls,
    stoneFloor,
    stoneFloorEdges,
    stoneFloorDecorations,
    stoneLedges,
    stoneStairs,
    stoneCeilingTopAngles,
];
