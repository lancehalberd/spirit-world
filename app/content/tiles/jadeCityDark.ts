import {
    orBitMasks,
    BITMAP_TOP_6,
    BITMAP_LEFT_6,
    BITMAP_RIGHT_6,
    BITMAP_BOTTOM_13,
    BITMAP_VERT_MIDDLE_6,
    BITMAP_TOP_RIGHT_MISS_CORN_6,
    BITMAP_TOP_LEFT_MISS_CORN_6,
    BITMAP_TOP_RIGHT_CORN_6,
    BITMAP_TOP_LEFT_6,
    BITMAP_BOTTOM_LEFT_CORN_10,
    BITMAP_BOTTOM_RIGHT_CORN_10,
    BITMAP_TOP_3,
    BITMAP_DIAGONAL_TOP_LEFT_LEDGE,
    BITMAP_DIAGONAL_TOP_RIGHT_LEDGE,
    BITMAP_BOTTOM_10,
    BITMAP_LEFT_6_CUT,
    BITMAP_RIGHT_6_CUT
} from 'app/content/bitMasks';


import {
    southernWallBehavior,
    topRightWall,
    topLeftWall,
} from 'app/content/tiles/constants';


import { requireFrame } from 'app/utils/packedImages';




const jadeCityFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 0, y: 0, w: 64, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor'}
    },
     tileCoordinates: [
        [0,0], [1,0],
        [0,1], [1,1], [2,1], [3,1]
        ]
}


const jadeCityDarkRailings: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 144, y: 160, w: 112, h: 16}),
    behaviors: {
        'all': southernWallBehavior,
        '0x0':{ defaultLayer: 'field', solidMap: BITMAP_BOTTOM_13},
        '1x0':{ defaultLayer: 'field2', solidMap: BITMAP_VERT_MIDDLE_6},
        '2x0':{ defaultLayer: 'field', solidMap: BITMAP_VERT_MIDDLE_6}


    }
}






const jadeCityDarkDecorations: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 0, y: 224, w: 160, h: 64}),
    behaviors: {
        'all': {defaultLayer: 'floor2'},
        '0x0': {defaultLayer: 'floor'},
        '0x1': {defaultLayer: 'floor'},
        '0x2': {defaultLayer: 'floor'}
    }, tileCoordinates:  [
        [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],         [7, 0], [8, 0],
        [0, 1], [1, 1],         [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1],
        [0, 2], [1, 2], [2, 2], [3, 2],                 [6, 2], [7, 2], [8, 2], [9, 2],
                                                                [7, 3], [8, 3],
    ]
}


const jadeCityDarkWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 0, y: 160, w: 48, h: 48}),
    //change width to 112 and uncomment tileCoordinates to get alternate tiles
    behaviors: {
        'all': southernWallBehavior
    }, tileCoordinates: [
        [0, 0], [1, 0], [2, 0],         //[4, 0], [5, 0], [6, 0],
        [0, 1], [1, 1], [2, 1],         //[4, 1], [5, 1], [6, 1],
        [0, 2], [1, 2], [2, 2],         //[4, 2], [5, 2], [6, 2]  
    ]
}




const jadeCityDarkSlopedWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 272, y: 112, w: 128, h: 112}),
    behaviors: {
        'all': southernWallBehavior,
        '0x0': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_LEFT_CORN_10 },
        '0x1': { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT_MISS_CORN_6 },
        '0x4': topRightWall,
        '1x1': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_LEFT_CORN_10 },
        '1x2': { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT_MISS_CORN_6 },
        '1x5': topRightWall,
        '2x2': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_LEFT_CORN_10 },
        '2x3': { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT_MISS_CORN_6 },
        '2x6': topRightWall,
        '3x2': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_RIGHT_CORN_10 },
        '3x3': { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT_MISS_CORN_6 },
        '3x6': topLeftWall,
        '4x1': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_RIGHT_CORN_10 },
        '4x2': { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT_MISS_CORN_6 },
        '4x5': topLeftWall,
        '5x0': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_RIGHT_CORN_10 },
        '5x1': { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT_MISS_CORN_6 },
        '5x4': topLeftWall,
        '6x3': { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT_MISS_CORN_6 },
        '6x6': topRightWall,
        '7x3': { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT_MISS_CORN_6 },
        '7x6': topLeftWall
    }, tileCoordinates: [
        //[0, 0],                                 [5, 0],
        //[0, 1], [1, 1],                 [4, 1], [5, 1],
        [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], //[6, 2], [7, 2],
        [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3],
        [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4],
                [1, 5], [2, 5], [3, 5], [4, 5],         [6, 5], [7, 5],
                        [2, 6], [3, 6],                 //[6, 6], [7, 6],
    ],
}


const jadeCityDarkTowers: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 272, y: 0, w: 128, h: 112}),
    behaviors: {
        'all': southernWallBehavior,
        '0x1': { defaultLayer: 'field', solidMap: BITMAP_DIAGONAL_TOP_LEFT_LEDGE },
        '0x2': { defaultLayer: 'field', solidMap: BITMAP_LEFT_6 },
        '0x3': { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT_MISS_CORN_6 },
        '0x6': topRightWall,
        '1x1': { defaultLayer: 'field', solidMap: BITMAP_TOP_6 },
        '1x3': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_10 },
        '2x1': { defaultLayer: 'field', solidMap: BITMAP_DIAGONAL_TOP_RIGHT_LEDGE },
        '2x2': { defaultLayer: 'field', solidMap: BITMAP_RIGHT_6 },
        '2x3': { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT_MISS_CORN_6 },
        '2x6': topLeftWall,
        '3x0': { defaultLayer: 'field', solid: false, isSouthernWall: false },
        '3x1': { defaultLayer: 'field', solidMap: BITMAP_RIGHT_6 },
        '3x2': { defaultLayer: 'field', solidMap: BITMAP_RIGHT_6 },
        '3x3': { defaultLayer: 'field', solidMap: BITMAP_RIGHT_6 },
        '3x4': { defaultLayer: 'field', solidMap: BITMAP_RIGHT_6 },
        '3x5': { defaultLayer: 'field', solidMap: BITMAP_LEFT_6_CUT },
        '4x0': { defaultLayer: 'field', solidMap: BITMAP_DIAGONAL_TOP_LEFT_LEDGE },
        '4x1': { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT_6 },
        '4x2': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_LEFT_CORN_10 },
        '4x6': topRightWall,
        '5x0': { defaultLayer: 'field', solidMap: BITMAP_TOP_6 },
        '5x3': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_10 },
        '6x0': { defaultLayer: 'field', solidMap: BITMAP_DIAGONAL_TOP_RIGHT_LEDGE },
        '6x1': { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT_CORN_6 },
        '6x2': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_RIGHT_CORN_10 },
        '6x6': topLeftWall,
        '7x0': { defaultLayer: 'field', solid: false, isSouthernWall: false },
        '7x1': { defaultLayer: 'field', solidMap: BITMAP_LEFT_6 },
        '7x2': { defaultLayer: 'field', solidMap: BITMAP_LEFT_6 },
        '7x3': { defaultLayer: 'field', solidMap: BITMAP_LEFT_6 },
        '7x4': { defaultLayer: 'field', solidMap: BITMAP_LEFT_6 },
        '7x5': { defaultLayer: 'field', solidMap: BITMAP_RIGHT_6_CUT }
    }, tileCoordinates: [
                                [3, 0], [4, 0],         [6, 0], [7, 0], // [5, 0],
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],         [6, 1], [7, 1],
        [0, 2],         [2, 2], [3, 2], [4, 2],         [6, 2], [7, 2], //
        [0, 3], [1, 3], [2, 3], [3, 3],                         [7, 3], // [4, 3], [5, 3], [6, 3],
        [0, 4], [1, 4], [2, 4], [3, 4],                         [7, 4], // [4, 4], [5, 4], [6, 4],
        [0, 5], [1, 5], [2, 5], [3, 5],                         [7, 5], // [4, 5], [5, 5], [6, 5],
        [0, 6], [1, 6], [2, 6],                                         // [4, 6], [5, 6], [6, 6],
    ],
}




//Bottom Edges go under player
let defaultLayer: DefaultLayer = 'field';
const jadeCityDarkEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 0, y: 32, w: 80, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'field' },
        '0x0': { defaultLayer, solidMap: BITMAP_LEFT_6, ledges: {left: true}},
        '1x0': { defaultLayer, solidMap: BITMAP_LEFT_6, ledges: {left: true}},
        '3x0': { defaultLayer, solidMap: BITMAP_RIGHT_6, ledges: {left: true}},
        '4x0': { defaultLayer, solidMap: BITMAP_RIGHT_6, ledges: {left: true}},
        '0x1': { defaultLayer, solidMap: orBitMasks(BITMAP_TOP_6, BITMAP_LEFT_6), ledges: { left: true, up: true } },
        '1x1': { defaultLayer, solidMap: BITMAP_TOP_6, ledges: { up: true } },
        '2x1': { defaultLayer, solidMap: BITMAP_TOP_6, ledges: { up: true } },
        '3x1': { defaultLayer, solidMap: BITMAP_TOP_6, ledges: { up: true } },
        '4x1': { defaultLayer, solidMap: orBitMasks(BITMAP_TOP_6, BITMAP_RIGHT_6), ledges: { right: true, up: true } },
        '0x2': { defaultLayer, solidMap: BITMAP_LEFT_6, ledges: { left: true } },
        '1x2': { defaultLayer, solidMap: BITMAP_TOP_6, ledges: { up: true } },
        '3x2': { defaultLayer, solidMap: BITMAP_TOP_6, ledges: { up: true } },
        '4x2': { defaultLayer, solidMap: BITMAP_RIGHT_6, ledges: { right: true } },
        '0x3': { defaultLayer, solidMap: orBitMasks(BITMAP_BOTTOM_10, BITMAP_LEFT_6), ledges: { left: true, down: true } },
        '1x3': { defaultLayer, solidMap: BITMAP_BOTTOM_10, ledges: { down: true } }, //if not approaching from the bottom, consider versions that use foreground2
        '2x3': { defaultLayer, solidMap: BITMAP_BOTTOM_10, ledges: { down: true } }, //so PC can be covered by them.
        '3x3': { defaultLayer, solidMap: BITMAP_BOTTOM_10, ledges: { down: true } },
        '4x3': { defaultLayer, solidMap: orBitMasks(BITMAP_BOTTOM_10, BITMAP_RIGHT_6), ledges: { right: true, down: true } },
    }, tileCoordinates: [
        [0, 0], [1, 0],         [3, 0], [4, 0],
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
        [0, 2], [1, 2],         [3, 2], [4, 2],
        [0, 3], [1, 3], [2, 3], [3, 3], [4, 3],
    ],
}


const jadeCityDarkExtraEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 0, y: 144, w: 48, h: 16}),
    behaviors: {
        '0x0': { defaultLayer: 'field', solidMap: BITMAP_TOP_3  },
        '1x0': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_10, ledges: { down: true } },
        '3x0': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_10, ledges: { down: true } },
        '4x0': { defaultLayer: 'field', solidMap: BITMAP_TOP_3  },
    }, tileCoordinates: [[0,0], [1,0],     [3,0], [4,0]]
}


const jadeCityDarkStairs: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 192, y: 64, w: 64, h: 96}),
    behaviors: {
        'all' : {defaultLayer: 'field'},
        '0x0':{ defaultLayer: 'field', solidMap: BITMAP_RIGHT_6},
        '0x1':{ defaultLayer: 'field', solidMap: BITMAP_RIGHT_6},
        '0x3':{ defaultLayer: 'field', solidMap: BITMAP_RIGHT_6},
        '0x4':{ defaultLayer: 'field', solidMap: BITMAP_RIGHT_6},
        '3x0':{ defaultLayer: 'field', solidMap: BITMAP_LEFT_6},
        '3x1':{ defaultLayer: 'field', solidMap: BITMAP_LEFT_6},
        '3x3':{ defaultLayer: 'field', solidMap: BITMAP_LEFT_6},
        '3x4':{ defaultLayer: 'field', solidMap: BITMAP_LEFT_6},
    }, tileCoordinates: [
        [0, 0],                 [3, 0],
        [0, 1],                 [3, 1],
        [0, 2],                 [3, 2],
        [0, 3],                 [3, 3],
        [0, 4], [1, 4], [2, 4], [3, 4],
        [0, 5],                 [3, 5],
    ],
}


const jadeCityDarkColumnWall: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 0, y: 96, w: 80, h: 48}),
    behaviors: {
        'all': southernWallBehavior,
    }, tileCoordinates: [
        [0, 0], [1, 0],          [4, 0],
        [0, 1], [1, 1],          [4, 1],
        [0, 2], [1, 2],          [4, 2],
    ]
}


export const allDarkJadeCityTileSources: TileSource[] = [
    jadeCityFloor,
    jadeCityDarkRailings,
    jadeCityDarkDecorations,
    jadeCityDarkWalls,
    jadeCityDarkEdges,
    jadeCityDarkExtraEdges,
    jadeCityDarkSlopedWalls,
    jadeCityDarkTowers,
    jadeCityDarkStairs,
    jadeCityDarkColumnWall,
];
