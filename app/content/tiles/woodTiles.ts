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
    source: requireFrame('gfx/tiles/woodhousetilesarranged.png', {x: 0, y: 0, w: 96, h: 128}),
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
    source: requireFrame('gfx/tiles/woodhousetilesarranged.png', {x: 112, y: 0, w: 96, h: 96}),
    behaviors: {
        'all': southernWallBehavior,
        '4x4': topLeftWall, '5x4': topLeftWall,
        '2x4': topRightWall, '3x4': topRightWall,
        '2x0': bottomLeftWall, '3x0': bottomLeftWall,
        '4x0': bottomRightWall, '5x0': bottomRightWall,
    },
    tileCoordinates: [
        [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],
        [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],
        [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],
        [0,3],      [2,3],[3,3],[4,3],[5,3],
        [0,4],      [2,4],[3,4],[4,4],[5,4],
        [0,5],
    ],
};
const woodStairs: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/woodhousetilesarranged.png', {x: 208, y: 0, w: 48, h: 80}),
    behaviors: {
        'all': { defaultLayer: 'field' },
        '0x0': { defaultLayer: 'field', solid: BITMAP_LEFT_6_BOTTOM_9},
        '0x1': { defaultLayer: 'field', solid: BITMAP_LEFT_6},
        '0x2': { defaultLayer: 'field', solid: BITMAP_LEFT_6},
        '0x3': { defaultLayer: 'field', solid: BITMAP_LEFT_6},
        '0x4': { defaultLayer: 'field', solid: BITMAP_LEFT_6_TOP_5},
        '2x0': { defaultLayer: 'field', solid: BITMAP_RIGHT_6_BOTTOM_9},
        '2x1': { defaultLayer: 'field', solid: BITMAP_RIGHT_6},
        '2x2': { defaultLayer: 'field', solid: BITMAP_RIGHT_6},
        '2x3': { defaultLayer: 'field', solid: BITMAP_RIGHT_6},
        '2x4': { defaultLayer: 'field', solid: BITMAP_RIGHT_6_TOP_5},
    },
    tileCoordinates: [
        [0,0],[1,0],[2,0],
        [0,1],[1,1],[2,1],
        [0,2],[1,2],[2,2],
        [0,3],[1,3],[2,3],
        [0,4],[1,4],[2,4]
    ],
};

const woodLedges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/woodhousetilesarranged.png', {x: 128, y: 144, w: 64, h: 96}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        '0x0': { defaultLayer: 'floor2', ledges: { up: true, left: true}},
        '1x0': { defaultLayer: 'floor2', ledges: { up: true }},
        '2x0': { defaultLayer: 'floor2', ledges: { up: true, right: true}},
        '0x1': { defaultLayer: 'floor2', ledges: { left: true}},
        '2x1': { defaultLayer: 'floor2', ledges: {right: true}},
        '0x2': { defaultLayer: 'floor2', ledges: { down: true, left: true}},
        '1x2': { defaultLayer: 'floor2', ledges: { down: true }},
        '2x2': { defaultLayer: 'floor2', ledges: { down: true, right: true}},
        '1x3': { defaultLayer: 'floor2', diagonalLedge: 'upleft'},
        '2x3': { defaultLayer: 'floor2', diagonalLedge: 'upright'},
        '0x5': { defaultLayer: 'floor2', diagonalLedge: 'downleft'},
        '3x5': { defaultLayer: 'floor2', diagonalLedge: 'downright'},
    },
    tileCoordinates: [
        // This is a quare
        [0,0],[1,0],[2,0],
        [0,1],      [2,1],
        [0,2],[1,2],[2,2],
        // Diamond
              [1,3],[2,3], // TL,TR
              [1,4],[2,4], // Inner TL, Inner TR
        [0,5],[1,5],[2,5],[3,5] //BL, Inner BL, Inner BR, BR

    ],
};
const woodFloorDecorations: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/woodhousetilesarranged.png', {x: 224, y: 144, w: 80, h: 112}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [
        [0,0],[1,0],[2,0],[3,0],[4,0],
        [0,1],      [2,1],[3,1],[4,1],
        [0,2],[1,2],[2,2],
              [1,3],[2,3],
        [0,4],[1,4],[2,4],[3,4],
        [0,5],[1,5],[2,5],[3,5],
              [1,6],[2,6]

    ],
};
const woodFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/woodhousetilesarranged.png', {x: 208, y: 96, w: 64, h: 96}),
    behaviors: {
        'all': { defaultLayer: 'floor' },
    },
    tileCoordinates: [
        [0,0],[1,0],[2,0],[3,0],
        [0,1],[1,1],[2,1],
        [0,2],[1,2],      [3,2],
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
    source: requireFrame('gfx/tiles/woodhousetilesarranged.png', {x: 144, y: 96, w: 64, h: 16}),
    behaviors: {
        'all': southernWallBehavior,
    },
};
