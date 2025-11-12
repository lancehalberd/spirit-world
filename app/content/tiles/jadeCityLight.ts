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
    BITMAP_TOP_LEFT,
    BITMAP_TOP_RIGHT,
    BITMAP_DIAGONAL_TOP_LEFT_LEDGE,
    BITMAP_DIAGONAL_TOP_RIGHT_LEDGE,
    BITMAP_BOTTOM_10,
    BITMAP_LEFT_6_CUT,
    BITMAP_RIGHT_6_CUT
} from 'app/content/bitMasks';

const topLeftWall: TileBehaviors = { defaultLayer: 'field', solid: BITMAP_TOP_LEFT, isSouthernWall: true, isGround: false, linkedOffset: 159};
const topRightWall: TileBehaviors = { defaultLayer: 'field', solid: BITMAP_TOP_RIGHT, isSouthernWall: true, isGround: false, linkedOffset: 159};

import { requireFrame } from 'app/utils/packedImages';
import { southernWallBehavior } from './constants';


const jadeCityFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 0, y: 0, w: 64, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor', linkedOffset: 159}
    },
     tileCoordinates: [
        [0,0], [1,0], 
        [0,1], [1,1], [2,1], [3,1]
        ]
}

const jadeCityLightRailings: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 144, y: 160, w: 112, h: 16}),
    behaviors: {
        'all': {...southernWallBehavior, linkedOffset: 159},
        '0x0':{ defaultLayer: 'field', solid: BITMAP_BOTTOM_13, linkedOffset: 159},
        '1x0':{ defaultLayer: 'field2', solid: BITMAP_VERT_MIDDLE_6, linkedOffset: 159},
        '2x0':{ defaultLayer: 'field', solid: BITMAP_VERT_MIDDLE_6, linkedOffset: 159}

    }
}



const jadeCityLightDecorations: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 0, y: 224, w: 160, h: 64}),
    behaviors: {
        'all': {defaultLayer: 'floor2', linkedOffset: 159},

        '0x0': {defaultLayer: 'floor', linkedOffset: 159},
        '0x1': {defaultLayer: 'floor', linkedOffset: 159},
        '0x2': {defaultLayer: 'floor', linkedOffset: 159}
    }, tileCoordinates:  [
        [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],         [7, 0], [8, 0], 
        [0, 1], [1, 1],         [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1],
        [0, 2], [1, 2], [2, 2], [3, 2],                 [6, 2], [7, 2], [8, 2], [9, 2],
                                                                [7, 3], [8, 3], 
    ]
}

const jadeCityLightWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 0, y: 160, w: 48, h: 48}), 
    //change width to 112 and uncomment tileCoordinates to get alternate tiles
    behaviors: {
        'all': {...southernWallBehavior, linkedOffset: 159},
    }, tileCoordinates: [
        [0, 0], [1, 0], [2, 0],         //[4, 0], [5, 0], [6, 0],
        [0, 1], [1, 1], [2, 1],         //[4, 1], [5, 1], [6, 1],
        [0, 2], [1, 2], [2, 2],         //[4, 2], [5, 2], [6, 2]  
    ]
}



const jadeCityLightSlopedWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 272, y: 112, w: 128, h: 112}),
    behaviors: {
        'all': {...southernWallBehavior, linkedOffset: 159},
        '0x0': { defaultLayer: 'field', solid: BITMAP_BOTTOM_LEFT_CORN_10, linkedOffset: 159 },
        '0x1': { defaultLayer: 'field', solid: BITMAP_TOP_RIGHT_MISS_CORN_6, linkedOffset: 159 },
        '0x4': topRightWall,
        '1x1': { defaultLayer: 'field', solid: BITMAP_BOTTOM_LEFT_CORN_10, linkedOffset: 159 },
        '1x2': { defaultLayer: 'field', solid: BITMAP_TOP_RIGHT_MISS_CORN_6, linkedOffset: 159 },
        '1x5': topRightWall,
        '2x2': { defaultLayer: 'field', solid: BITMAP_BOTTOM_LEFT_CORN_10, linkedOffset: 159 },
        '2x3': { defaultLayer: 'field', solid: BITMAP_TOP_RIGHT_MISS_CORN_6, linkedOffset: 159 },
        '2x6': topRightWall,
        '3x2': { defaultLayer: 'field', solid: BITMAP_BOTTOM_RIGHT_CORN_10, linkedOffset: 159 },
        '3x3': { defaultLayer: 'field', solid: BITMAP_TOP_LEFT_MISS_CORN_6, linkedOffset: 159 },
        '3x6': topLeftWall,
        '4x1': { defaultLayer: 'field', solid: BITMAP_BOTTOM_RIGHT_CORN_10, linkedOffset: 159 },
        '4x2': { defaultLayer: 'field', solid: BITMAP_TOP_LEFT_MISS_CORN_6, linkedOffset: 159 },
        '4x5': topLeftWall,
        '5x0': { defaultLayer: 'field', solid: BITMAP_BOTTOM_RIGHT_CORN_10, linkedOffset: 159 },
        '5x1': { defaultLayer: 'field', solid: BITMAP_TOP_LEFT_MISS_CORN_6, linkedOffset: 159 },
        '5x4': topLeftWall,
        '6x3': { defaultLayer: 'field', solid: BITMAP_TOP_RIGHT_MISS_CORN_6, linkedOffset: 159 },
        '6x6': topRightWall,
        '7x3': { defaultLayer: 'field', solid: BITMAP_TOP_LEFT_MISS_CORN_6, linkedOffset: 159 },
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

const jadeCityLightTowers: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 272, y: 0, w: 128, h: 112}),
    behaviors: {
        'all': {...southernWallBehavior, linkedOffset: 159},
        '0x1': { defaultLayer: 'field', solid: BITMAP_DIAGONAL_TOP_LEFT_LEDGE, linkedOffset: 159 },
        '0x2': { defaultLayer: 'field', solid: BITMAP_LEFT_6, linkedOffset: 159 },
        '0x3': { defaultLayer: 'field', solid: BITMAP_TOP_RIGHT_MISS_CORN_6, linkedOffset: 159 },
        '0x6': topRightWall,
        '1x1': { defaultLayer: 'field', solid: BITMAP_TOP_6, linkedOffset: 159 },
        '1x3': { defaultLayer: 'field', solid: BITMAP_BOTTOM_10, linkedOffset: 159 },
        '2x1': { defaultLayer: 'field', solid: BITMAP_DIAGONAL_TOP_RIGHT_LEDGE, linkedOffset: 159 },
        '2x2': { defaultLayer: 'field', solid: BITMAP_RIGHT_6, linkedOffset: 159 },
        '2x3': { defaultLayer: 'field', solid: BITMAP_TOP_LEFT_MISS_CORN_6, linkedOffset: 159 },
        '2x6': topLeftWall,
        '3x0': { defaultLayer: 'field', solid: false, isSouthernWall: false, linkedOffset: 159 },
        '3x1': { defaultLayer: 'field', solid: BITMAP_RIGHT_6, linkedOffset: 159 },
        '3x2': { defaultLayer: 'field', solid: BITMAP_RIGHT_6, linkedOffset: 159 },
        '3x3': { defaultLayer: 'field', solid: BITMAP_RIGHT_6, linkedOffset: 159 },
        '3x4': { defaultLayer: 'field', solid: BITMAP_RIGHT_6, linkedOffset: 159 },
        '3x5': { defaultLayer: 'field', solid: BITMAP_LEFT_6_CUT, linkedOffset: 159 },
        '4x0': { defaultLayer: 'field', solid: BITMAP_DIAGONAL_TOP_LEFT_LEDGE, linkedOffset: 159 },
        '4x1': { defaultLayer: 'field', solid: BITMAP_TOP_LEFT_6, linkedOffset: 159 },
        '4x2': { defaultLayer: 'field', solid: BITMAP_BOTTOM_LEFT_CORN_10, linkedOffset: 159 },
        '4x6': topRightWall,
        '5x0': { defaultLayer: 'field', solid: BITMAP_TOP_6, linkedOffset: 159 },
        '5x3': { defaultLayer: 'field', solid: BITMAP_BOTTOM_10, linkedOffset: 159 },
        '6x0': { defaultLayer: 'field', solid: BITMAP_DIAGONAL_TOP_RIGHT_LEDGE, linkedOffset: 159 },
        '6x1': { defaultLayer: 'field', solid: BITMAP_TOP_RIGHT_CORN_6, linkedOffset: 159 },
        '6x2': { defaultLayer: 'field', solid: BITMAP_BOTTOM_RIGHT_CORN_10, linkedOffset: 159 },
        '6x6': topLeftWall,
        '7x0': { defaultLayer: 'field', solid: false, isSouthernWall: false, linkedOffset: 159 },
        '7x1': { defaultLayer: 'field', solid: BITMAP_LEFT_6, linkedOffset: 159 },
        '7x2': { defaultLayer: 'field', solid: BITMAP_LEFT_6, linkedOffset: 159 },
        '7x3': { defaultLayer: 'field', solid: BITMAP_LEFT_6, linkedOffset: 159 },
        '7x4': { defaultLayer: 'field', solid: BITMAP_LEFT_6, linkedOffset: 159 },
        '7x5': { defaultLayer: 'field', solid: BITMAP_RIGHT_6_CUT, linkedOffset: 159 }
    }, tileCoordinates: [
                                [3, 0], [4, 0],         [6, 0], [7, 0],        // [5, 0], 
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
const jadeCityLightEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 0, y: 32, w: 80, h: 64}),
    behaviors: {
        'all': { defaultLayer, linkedOffset: 159 },
        '0x0': { defaultLayer, solid: BITMAP_LEFT_6, ledges: {left: true}, linkedOffset: 159},
        '1x0': { defaultLayer, solid: BITMAP_LEFT_6, ledges: {left: true}, linkedOffset: 159},
        '3x0': { defaultLayer, solid: BITMAP_RIGHT_6, ledges: {left: true}, linkedOffset: 159},
        '4x0': { defaultLayer, solid: BITMAP_RIGHT_6, ledges: {left: true}, linkedOffset: 159},
        '0x1': { defaultLayer, solid: orBitMasks(BITMAP_TOP_6, BITMAP_LEFT_6), ledges: { left: true, up: true }, linkedOffset: 159 },
        '1x1': { defaultLayer, solid: BITMAP_TOP_6, ledges: { up: true }, linkedOffset: 159 },
        '2x1': { defaultLayer, solid: BITMAP_TOP_6, ledges: { up: true }, linkedOffset: 159 },
        '3x1': { defaultLayer, solid: BITMAP_TOP_6, ledges: { up: true }, linkedOffset: 159 },
        '4x1': { defaultLayer, solid: orBitMasks(BITMAP_TOP_6, BITMAP_RIGHT_6), ledges: { right: true, up: true }, linkedOffset: 159 },
        '0x2': { defaultLayer, solid: BITMAP_LEFT_6, ledges: { left: true }, linkedOffset: 159 },
        '1x2': { defaultLayer, solid: BITMAP_TOP_6, ledges: { up: true }, linkedOffset: 159 },
        '3x2': { defaultLayer, solid: BITMAP_TOP_6, ledges: { up: true }, linkedOffset: 159 },
        '4x2': { defaultLayer, solid: BITMAP_RIGHT_6, ledges: { right: true }, linkedOffset: 159 },
        '0x3': { defaultLayer, solid: orBitMasks(BITMAP_BOTTOM_10, BITMAP_LEFT_6), ledges: { left: true, down: true }, linkedOffset: 159 },
        '1x3': { defaultLayer, solid: BITMAP_BOTTOM_10, ledges: { down: true }, linkedOffset: 159 }, //if not approaching from the bottom, consider versions that use foreground2
        '2x3': { defaultLayer, solid: BITMAP_BOTTOM_10, ledges: { down: true }, linkedOffset: 159 }, //so PC can be covered by them.
        '3x3': { defaultLayer, solid: BITMAP_BOTTOM_10, ledges: { down: true }, linkedOffset: 159 },
        '4x3': { defaultLayer, solid: orBitMasks(BITMAP_BOTTOM_10, BITMAP_RIGHT_6), ledges: { right: true, down: true }, linkedOffset: 159 },
    }, tileCoordinates: [
        [0, 0], [1, 0],         [3, 0], [4, 0], 
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], 
        [0, 2], [1, 2],         [3, 2], [4, 2], 
        [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], 
    ],
}

const jadeCityLightExtraEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 0, y: 144, w: 48, h: 16}),
    behaviors: {
        'all': {linkedOffset: 159},
        '0x0': { defaultLayer, solid: BITMAP_TOP_3, linkedOffset: 159 },
        '1x0': { defaultLayer, solid: BITMAP_BOTTOM_10, ledges: { down: true }, linkedOffset: 159 },
        '3x0': { defaultLayer, solid: BITMAP_BOTTOM_10, ledges: { down: true }, linkedOffset: 159 },
        '4x0': { defaultLayer, solid: BITMAP_TOP_3, linkedOffset: 159  },
    }, tileCoordinates: [[0,0], [1,0],     [3,0], [4,0]]
}

const jadeCityLightStairs: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 192, y: 64, w: 64, h: 96}),
    behaviors: {
        'all' : {defaultLayer, linkedOffset: 159},
        '0x0':{ defaultLayer, solid: BITMAP_RIGHT_6, linkedOffset: 159},
        '0x1':{ defaultLayer, solid: BITMAP_RIGHT_6, linkedOffset: 159},
        '0x3':{ defaultLayer, solid: BITMAP_RIGHT_6, linkedOffset: 159},
        '0x4':{ defaultLayer, solid: BITMAP_RIGHT_6, linkedOffset: 159},
        '3x0':{ defaultLayer, solid: BITMAP_LEFT_6, linkedOffset: 159},
        '3x1':{ defaultLayer, solid: BITMAP_LEFT_6, linkedOffset: 159},
        '3x3':{ defaultLayer, solid: BITMAP_LEFT_6, linkedOffset: 159},
        '3x4':{ defaultLayer, solid: BITMAP_LEFT_6, linkedOffset: 159},
    }, tileCoordinates: [
        [0, 0],                 [3, 0],
        [0, 1],                 [3, 1],
        [0, 2],                 [3, 2],
        [0, 3],                 [3, 3], 
        [0, 4], [1, 4], [2, 4], [3, 4], 
        [0, 5],                 [3, 5], 
    ],
}

const jadeCityLightColumnWall: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 0, y: 96, w: 80, h: 48}),
    behaviors: {
        'all': {solid: true, defaultLayer, isSouthernWall: true, linkedOffset: 159}
    }, tileCoordinates: [
        [0, 0], [1, 0],          [4, 0], 
        [0, 1], [1, 1],          [4, 1], 
        [0, 2], [1, 2],          [4, 2], 
    ]
}

export const allLightJadeCityTileSources: TileSource[] = [
    jadeCityFloor, 
    jadeCityLightRailings,
    jadeCityLightDecorations,
    jadeCityLightWalls,
    jadeCityLightEdges,
    jadeCityLightExtraEdges,
    jadeCityLightSlopedWalls,
    jadeCityLightTowers,
    jadeCityLightStairs,
    jadeCityLightColumnWall,
];
