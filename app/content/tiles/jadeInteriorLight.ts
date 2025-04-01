import {
    baseCeilingBehavior,
} from 'app/content/tiles/constants';

import {
    BITMAP_BOTTOM,
    BITMAP_BOTTOM_LEFT,
    BITMAP_TOP_LEFT,
    BITMAP_TOP_RIGHT,
    BITMAP_BOTTOM_RIGHT,
    BITMAP_BOTTOM_LEFT_8,
    BITMAP_BOTTOM_RIGHT_8,
    BITMAP_TOP_LEFT_8_STRIP,
    BITMAP_TOP_RIGHT_8_STRIP,
} from 'app/content/bitMasks';


import { requireFrame } from 'app/utils/packedImages';

const southernWallBehavior: TileBehaviors = {
    solid: true,
    // Wall appear behind the player except over doorways.
    defaultLayer: 'field',
    isSouthernWall: true,
    linkedOffset: 57,
}
const ceilingBehavior: TileBehaviors = { ...baseCeilingBehavior, solid: true, linkedOffset: 57};
const bottomCeilingBehavior: TileBehaviors = { ...baseCeilingBehavior, solidMap: BITMAP_BOTTOM, linkedOffset: 57 };
const bottomLeftCeiling: TileBehaviors = { ...baseCeilingBehavior, solidMap: BITMAP_BOTTOM_LEFT_8, linkedOffset: 57 };
const bottomRightCeiling: TileBehaviors = { ...baseCeilingBehavior, solidMap: BITMAP_BOTTOM_RIGHT_8, linkedOffset: 57 };
const topLeftCeiling: TileBehaviors = { ...baseCeilingBehavior, solidMap: BITMAP_TOP_LEFT_8_STRIP, linkedOffset: 57 };
const topRightCeiling: TileBehaviors = { ...baseCeilingBehavior, solidMap: BITMAP_TOP_RIGHT_8_STRIP, linkedOffset: 57 };

const topLeftWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT, isSouthernWall: true, isGround: false, linkedOffset: 57 };
const topRightWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT, isSouthernWall: true, isGround: false, linkedOffset: 57 };
const bottomLeftWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_LEFT, isSouthernWall: true, isGround: false, linkedOffset: 57 };
const bottomRightWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_RIGHT, isSouthernWall: true, isGround: false, linkedOffset: 57 };



const JadeInteriorLightLeftCorner: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorLight.png', {x: 160, y: 0, w: 32, h: 80}), //160}), revert to 160 to include alternate tiles
    behaviors: {
        'all': southernWallBehavior,
        '0x4': topRightWall, '1x4': topLeftWall,
        '0x9': topRightWall, '1x9': topLeftWall,
        '0x0': bottomLeftWall, '1x0': bottomRightWall,
        '0x5': bottomLeftWall, '1x5': bottomRightWall,



    }
}

/*
const JadeInteriorLightRightCorner: TileSource = { 
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorLight.png', {x: 400, y: 0, w: 32, h: 160}),
    behaviors: {
        'all': southernWallBehavior,
        '0x4': topRightWall, '1x4': topLeftWall,
        '0x9': topRightWall, '1x9': topLeftWall,
        '0x0': bottomLeftWall, '1x0': bottomRightWall,
        '0x5': bottomLeftWall, '1x5': bottomRightWall,
    }
}
*/

const JadeInteriorLightSquareWall: TileSource = { 
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorLight.png', {x: 112, y: 0, w: 32, h: 64}),
    behaviors: {
        'all': southernWallBehavior,
    }
}
/*
const JadeInteriorLightSquareWallAlt: TileSource = { 
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorLight.png', {x: 352, y: 0, w: 32, h: 64}),
    behaviors: {
        'all': southernWallBehavior,
    }
}
*/

const JadeInteriorLightSquareFloor: TileSource = { 
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorLight.png', {x: 208, y: 80, w: 32, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor', linkedOffset: 57}
    }
}

const JadeInteriorLightCeiling: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorLight.png', {x: 0, y: 0, w: 112, h: 128}),
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
    }, tileCoordinates: [
        [0, 0],                 [3, 0], 
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],
        [0, 2],         [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],
        [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], 
        [0, 4], [1, 4], [2, 4],         [4, 4], [5, 4], //[3, 4], [6, 4],
        [0, 5], [1, 5],       //[3, 5], [4, 5], [5, 5], [6, 5],
        [0, 6], [1, 6],               //[4, 6], [5, 6], 
        [0, 7], [1, 7],
    ]
}

const JadeInteriorLightColumn: TileSource = { 
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorLight.png', {x: 112, y: 64, w: 32, h: 96}),
    behaviors: {
        'all': southernWallBehavior,
    }, tileCoordinates: [
        //[0,0], //[1,0],
        //[0,1], //[1,1],
        //[0,2], //[1,2],
        [0,3],
        [0,4],
        [0,5]
    ]
}




export const allJadeInteriorLightTileSources: TileSource[] = [
    //JadeInteriorLightRightCorner,
    JadeInteriorLightLeftCorner,
    JadeInteriorLightSquareFloor,
    JadeInteriorLightCeiling,
    JadeInteriorLightSquareWall,
    //JadeInteriorLightSquareWallAlt,
    JadeInteriorLightColumn
];

