import {
    BITMAP_MIDDLE_DOWN_RIGHT, BITMAP_MIDDLE_UP_RIGHT,
    BITMAP_BOTTOM_6,
    BITMAP_BOTTOM_LEFT, BITMAP_BOTTOM_RIGHT,
    BITMAP_LEFT_6,
    BITMAP_RIGHT_6,
} from 'app/content/bitMasks';
import { 
    bottomCeilingBehavior,
    bottomLeftCeiling,
    bottomRightCeiling,
    ceilingBehavior,
    southernWallBehavior,
    topRightCeiling,
    topRightWall,
    topLeftCeiling,
    topLeftWall,
} from 'app/content/tiles/constants';
import { requireImage } from 'app/utils/images';



const stoneCeiling: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/stonetileset.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': ceilingBehavior,
        '3x0': bottomCeilingBehavior,
        '1x1': bottomCeilingBehavior,
        '2x2': bottomCeilingBehavior, '3x2': bottomCeilingBehavior, '4x2': bottomCeilingBehavior,
        '0x3': bottomCeilingBehavior, '1x3': bottomCeilingBehavior, '3x3': bottomCeilingBehavior,
        '0x4': topLeftCeiling, '4x4': topLeftCeiling, '1x7': topLeftCeiling,
        '1x4': topRightCeiling, '5x4': topRightCeiling, '0x7': topRightCeiling,
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
    source: {image: requireImage('gfx/tiles/stonetileset.png'), x: 0, y: 0, w: 48, h: 80},
    behaviors: {
        '8x2': bottomLeftCeiling, '9x2': bottomLeftCeiling,
        '10x2': bottomRightCeiling, '11x2': bottomRightCeiling,
    },
    tileCoordinates: [
        [ 9, 2],[10, 2],
    ],
};

const stoneWalls: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/stonetileset.png'), x: 0, y: 0, w: 48, h: 80},
    behaviors: {
        'all': southernWallBehavior,
        '12x3': topRightWall, '13x3': topRightWall,
        '14x3': topLeftWall, '15x3': topLeftWall,
    },
    tileCoordinates: [
    [ 7, 0],[ 8, 0],[ 9, 0],[10, 0],[11, 0],
    [ 7, 1],[ 8, 1],[ 9, 1],[10, 1],[11, 1],
                                             [13, 2],[14, 2],
                                             [13, 3],[14, 3],
    ],
};

const stoneStairs: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/stonetileset.png'), x: 0, y: 0, w: 48, h: 64},
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

const stoneLedges: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/stonetileset.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        '8x8': { defaultLayer: 'floor2', ledges: { right: true } },
        '9x8': { defaultLayer: 'floor2', ledges: { right: true } },

        '8x9': { defaultLayer: 'floor2', ledges: { left: true } },
        '9x9': { defaultLayer: 'floor2', ledges: { left: true } },
        '10x9': { defaultLayer: 'floor2', ledges: { down: true } },
        '11x9': { defaultLayer: 'floor2', ledges: { down: true } },
        '12x9': { defaultLayer: 'floor2', ledges: {down: false}, solidMap: BITMAP_BOTTOM_6, low: true, },
        '13x9': { defaultLayer: 'floor2', ledges: {down: false}, solidMap: BITMAP_BOTTOM_6, low: true, },

        '8x10': { defaultLayer: 'floor2', solidMap: BITMAP_RIGHT_6 },
        '9x10': { defaultLayer: 'floor2', solidMap: BITMAP_RIGHT_6 },

        '8x11': { defaultLayer: 'floor2', solidMap: BITMAP_LEFT_6 },
        '9x11': { defaultLayer: 'floor2', solidMap: BITMAP_LEFT_6 },
        '10x11': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_6 },
        '11x11': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_6 },
        '12x11': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_6 },
        '13x11': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_6 },

        '8x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright' },
        '9x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft' },
        '10x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright' },
        '11x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft' },
        '12x12': { defaultLayer: 'floor2'},
        '13x12': { defaultLayer: 'floor2'},

        '8x13': { defaultLayer: 'floor2', diagonalLedge: 'upright' },
        '9x13': { defaultLayer: 'floor2', diagonalLedge: 'upleft' },
        '10x13': { defaultLayer: 'floor2', diagonalLedge: 'upright' },
        '11x13': { defaultLayer: 'floor2', diagonalLedge: 'upleft' },
        '12x13': { defaultLayer: 'floor2'},
        '13x13': { defaultLayer: 'floor2'},

        '10x14': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_RIGHT },
        '11x14': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_LEFT},

        '10x15': { defaultLayer: 'floor2', solidMap: BITMAP_MIDDLE_DOWN_RIGHT },
        '11x15': { defaultLayer: 'floor2', solidMap: BITMAP_MIDDLE_UP_RIGHT},

    },
    tileCoordinates: [
        [ 8, 8],[ 9, 8],
        [ 8, 9],[ 9, 9],[10, 9],[11, 9],[12, 9],[13, 9],
        [ 8,10],[ 9,10],
        [ 8,11],[ 9,11],[10,11],[11,11],[12,11],[13,11],
        [ 8,12],[ 9,12],[10,12],[11,12],[12,12],[13,12],
        [ 8,13],[ 9,13],[10,13],[11,13],[12,13],[13,13],
                        [10,14],[11,14],
                        [10,15],[11,15],
    ],
};

const stoneFloorDecorations: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/stonetileset.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [
        [15, 5],[16, 5],[17, 5],[18, 5],
        [15, 6],[16, 6],[17, 6],[18, 6],
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

const stoneFloor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/stonetileset.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor' },
        '13x5': { defaultLayer: 'field', underTile: 4, isBrittleGround: true},
    },
    tileCoordinates: [
        [12, 4],[13, 4],[14, 4],
        [12, 5],[13, 5],
    ],
};
const stoneFloorEdges: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/stonetileset.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [
        [ 8, 4],[ 9, 4],[10, 4],[11, 4],
        [ 8, 5],[ 9, 5],[10, 5],[11, 5],
    ],
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
