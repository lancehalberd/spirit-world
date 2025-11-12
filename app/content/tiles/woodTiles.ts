import {
    BITMAP_LEFT_6_TOP_5, BITMAP_RIGHT_6_TOP_5,
    BITMAP_LEFT_6_BOTTOM_9, BITMAP_RIGHT_6_BOTTOM_9,
    BITMAP_LEFT_6,
    BITMAP_RIGHT_6,
} from 'app/content/bitMasks';
import {
    bottomLeftCeiling,
    bottomLeftWall,
    bottomRightCeiling,
    bottomRightWall,
    bottomCeilingBehavior,
    ceilingBehavior,
    southernWallBehavior,
    topRightWall,
    topLeftWall,
    topLeftCeiling,
    topRightCeiling,
} from 'app/content/tiles/constants';
import { requireFrame } from 'app/utils/packedImages';

const woodCeiling: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/woodhousetilesarranged.png', {x: 0, y: 0, w: 48, h: 64}),
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
        // Breakable tiles: [2,5] + [2,6] should be door sprites.
    },
    tileCoordinates: [
        [0,0],            [3,0],
        [0,1],[1,1],[2,1],[3,1],[4,1],
        [0,2],[1,2],[2,2],[3,2],[4,2],
        [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],
        [0,4],[1,4],[2,4],      [4,4],[5,4],
        [0,5],[1,5],// [2,5],
        [0,6],[1,6],// [2,6],
        [0,7],[1,7]
    ],
};

const woodWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/woodhousetilesarranged.png', {x: 0, y: 0, w: 48, h: 80}),
    behaviors: {
        'all': southernWallBehavior,
        '11x4': topLeftWall, '12x4': topLeftWall,
        '9x4': topRightWall, '10x4': topRightWall,
        '9x0': bottomLeftWall, '10x0': bottomLeftWall,
        '11x0': bottomRightWall, '12x0': bottomRightWall,
    },
    tileCoordinates: [
        [7,0],[8,0],[9,0],[10,0],[11,0],[12,0],
        [7,1],[8,1],[9,1],[10,1],[11,1],[12,1],
        [7,2],[8,2],[9,2],[10,2],[11,2],[12,2],
        [7,3],      [9,3],[10,3],[11,3],[12,3],
        [7,4],      [9,4],[10,4],[11,4],[12,4],
        [7,5],
    ],
};
const woodStairs: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/woodhousetilesarranged.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'field' },
        '13x0': { defaultLayer: 'field', solid: BITMAP_LEFT_6_BOTTOM_9},
        '13x1': { defaultLayer: 'field', solid: BITMAP_LEFT_6},
        '13x2': { defaultLayer: 'field', solid: BITMAP_LEFT_6},
        '13x3': { defaultLayer: 'field', solid: BITMAP_LEFT_6},
        '13x4': { defaultLayer: 'field', solid: BITMAP_LEFT_6_TOP_5},
        '15x0': { defaultLayer: 'field', solid: BITMAP_RIGHT_6_BOTTOM_9},
        '15x1': { defaultLayer: 'field', solid: BITMAP_RIGHT_6},
        '15x2': { defaultLayer: 'field', solid: BITMAP_RIGHT_6},
        '15x3': { defaultLayer: 'field', solid: BITMAP_RIGHT_6},
        '15x4': { defaultLayer: 'field', solid: BITMAP_RIGHT_6_TOP_5},
    },
    tileCoordinates: [
        [13,0],[14,0],[15,0],
        [13,1],[14,1],[15,1],
        [13,2],[14,2],[15,2],
        [13,3],[14,3],[15,3],
        [13,4],[14,4],[15,4]
    ],
};

const woodLedges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/woodhousetilesarranged.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        '8x9': { defaultLayer: 'floor2', ledges: { up: true, left: true}},
        '9x9': { defaultLayer: 'floor2', ledges: { up: true }},
        '10x9': { defaultLayer: 'floor2', ledges: { up: true, right: true}},
        '8x10': { defaultLayer: 'floor2', ledges: { left: true}},
        '10x10': { defaultLayer: 'floor2', ledges: {right: true}},
        '8x11': { defaultLayer: 'floor2', ledges: { down: true, left: true}},
        '9x11': { defaultLayer: 'floor2', ledges: { down: true }},
        '10x11': { defaultLayer: 'floor2', ledges: { down: true, right: true}},
        '9x12': { defaultLayer: 'floor2', diagonalLedge: 'upleft'},
        '10x12': { defaultLayer: 'floor2', diagonalLedge: 'upright'},
        '8x14': { defaultLayer: 'floor2', diagonalLedge: 'downleft'},
        '11x14': { defaultLayer: 'floor2', diagonalLedge: 'downright'},
    },
    tileCoordinates: [
        // This is a quare
        [8,9], [9,9], [10,9],
        [8,10],       [10,10],
        [8,11],[9,11],[10,11],
        // Diamond
        [9,12],[10,12], // TL,TR
        [9,13],[10,13], // Inner TL, Inner TR
        [8,14],[9,14],[10,14],[11,14] //BL, Inner BL, Inner BR, BR

    ],
};
const woodFloorDecorations: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/woodhousetilesarranged.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [
        [14,9],[15,9],[16,9],[17,9],[18,9],[14,10],[16,10],[17,10],[18,10],
        [14,11],[15,11],[16,11],[15,12],[16,12],[14,13],[15,13],[16,13],[17,13],
        [14,14],[15,14],[16,14],[17,14],[15,15],[16,15]

    ],
};
const woodFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/woodhousetilesarranged.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor' },
    },
    tileCoordinates: [
        [13,6],[14,6],[15,6],[16,6],[13,7],[14,7],[15,7],[13,8],[14,8],[16,8]
    ],
};

export const allWoodTileSources: TileSource[] = [
    woodCeiling,
    woodWalls,
    woodFloor,
    woodFloorDecorations,
    woodLedges,
    woodStairs,
];

export const extraWoodWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/woodhousetilesarranged.png', {x: 0, y: 0, w: 48, h: 80}),
    behaviors: {
        'all': southernWallBehavior,
    },
    tileCoordinates: [
                    [9,6],[10,6],[11,6],[12,6],
    ],
};
