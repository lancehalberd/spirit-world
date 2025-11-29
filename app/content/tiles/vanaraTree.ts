import {
    BITMAP_BOTTOM_LEFT_8, BITMAP_BOTTOM_RIGHT_8,
} from 'app/content/bitMasks';
import {
    lowWallBehavior,
    southernWallBehavior,
    topRightWall,
    topLeftWall,
    bottomLeftWall,
    bottomRightWall,
    singleTileSource,
    unliftableStoneBehavior,
} from 'app/content/tiles/constants';


import { requireFrame } from 'app/utils/packedImages';

const vanaraHoleyTile: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vanara.png', {x: 16, y: 16, w: 240, h: 64}),
    behaviors: {
        // These tiles should transfer to the spirit realm as is.
        'all': { defaultLayer: 'floor', linkedOffset: 0},
    },
    tileCoordinates: [
       [0,0],        [8,0],[9,0],             [12,0],[13,0],[14,0],
                [7,1],           [10,1],      [12,1],[13,1],[14,1],
                [7,2],           [10,2],      [12,2],[13,2],[14,2],
                     [8,3],[9,3]
    ],
};


const vanaraCeilingTrim: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vanara.png', {x: 0, y: 48, w: 80, h: 80}),
    behaviors: {
        'all': {defaultLayer: 'foreground2', isGround: false},
        '1x3': {defaultLayer: 'foreground2', isGround: false, solid: BITMAP_BOTTOM_LEFT_8},
        '3x3': {defaultLayer: 'foreground2', isGround: false, solid: BITMAP_BOTTOM_RIGHT_8},
    },
    tileCoordinates: [
              [1,0],[2,0],[3,0],
        [0,1],[1,1],      [3,1],[4,1],
        [0,2],                  [4,2],
        [0,3],[1,3],      [3,3],[4,3],
              [1,4],[2,4],[3,4],
    ],
};

const vanaraWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vanara.png', {x: 16, y: 128, w: 112, h: 64}),
    behaviors: {
        'all': southernWallBehavior,
        '2x0': bottomRightWall,
        '3x0': bottomLeftWall,
        '5x0': bottomRightWall,
        '6x0': bottomLeftWall,
        '2x3': topLeftWall,
        '3x3': topRightWall,
    },
    tileCoordinates: [
        [0,0],      [2,0],[3,0],     [5,0],[6,0],
        [0,1],      [2,1],[3,1],
        [0,2],      [2,2],[3,2],
                    [2,3],[3,3]
    ],
};

const vanaraStairs: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vanara.png', {x: 16, y: 256, w: 48, h: 80}),
    behaviors: {
        'all': { defaultLayer: 'field' },
    },
};

export const allVanaraTileSources: TileSource[] = [
    vanaraHoleyTile,
    vanaraCeilingTrim,
    vanaraStairs,
    vanaraWalls,
];


export const vanaraHoleyTransitionTile: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vanara.png', {x: 272, y: 16, w: 48, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor', linkedOffset: 0},
    },
    tileCoordinates: [
        [0,0],[1,0],[2,0],
        [0,1]      ,[2,1],
        [0,2],[1,2],[2,2],
    ],
};

export const vanaraPlainFloorTile = singleTileSource('gfx/tiles/vanara.png', {defaultLayer: 'floor', linkedOffset: 0}, 400, 32);

const vanaraShortWallsCross: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vanara.png', {x: 16, y: 416, w: 80, h: 80}),
    behaviors: {'all': lowWallBehavior},
    tileCoordinates: [
        [0,0],      [2,0],[4,0],
                    [2,1],
        [0,2],[1,2],[2,2],[4,2],
        [0,4],      [2,4],[4,4],
    ],
};

const vanaraShortWallsSquare: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vanara.png', {x: 112, y: 448, w: 48, h: 48}),
    behaviors: {'all': lowWallBehavior},
};


const vanaraShortWallsSingle = singleTileSource('gfx/tiles/vanara.png', unliftableStoneBehavior, 176, 480)

export const vanaraShortWallSources: TileSource[] = [
    vanaraShortWallsCross,
    vanaraShortWallsSquare,
    vanaraShortWallsSingle,
];

// transition from vanara wall to floor
export const vanaraWallTrim: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vanara.png', {x: 160, y: 368, w: 48, h: 48}),
    behaviors: {
        'all': {defaultLayer: 'floor2', isGround: false},
        '0x0': topLeftWall,
        '2x0': topRightWall,
    },
    tileCoordinates: [
        [0,0],[1,0],[2,0],
        [0,1],      [2,1],
        [0,2],      [2,2],
    ],
};

// transition from vanara wall to empty space
const vanaraWallLeftEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vanara.png', {x: 256, y: 208, w: 16, h: 64}),
    behaviors: {'all': {defaultLayer: 'field', isGround: false}},
};
const vanaraWallRightEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vanara.png', {x: 288, y: 208, w: 16, h: 64}),
    behaviors: {'all': {defaultLayer: 'field', isGround: false}},
};
export const vanaraWallEdges: TileSource[] = [
    vanaraWallLeftEdges,
    vanaraWallRightEdges,
];
