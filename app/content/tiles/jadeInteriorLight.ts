import {
    southernWallBehavior,
    topRightWall,
    topLeftWall,
    bottomLeftWall,
    bottomRightWall,
    ceilingBehavior,
    bottomCeilingBehavior,
    topLeftCeiling,
    topRightCeiling,
    bottomLeftCeiling,
    bottomRightCeiling,
} from 'app/content/tiles/constants';


import { requireFrame } from 'app/utils/packedImages';

const linkedSouthernWallBehavior: TileBehaviors = {...southernWallBehavior, linkedOffset: 57,}
const linkedCeilingBehavior: TileBehaviors = { ...ceilingBehavior, linkedOffset: 57};
const linkedBottomCeilingBehavior: TileBehaviors = { ...bottomCeilingBehavior, linkedOffset: 57 };
const linkedBottomLeftCeiling: TileBehaviors = { ...bottomLeftCeiling, linkedOffset: 57 };
const linkedBottomRightCeiling: TileBehaviors = { ...bottomRightCeiling, linkedOffset: 57 };
const linkedTopLeftCeiling: TileBehaviors = { ...topLeftCeiling, linkedOffset: 57 };
const linkedTopRightCeiling: TileBehaviors = { ...topRightCeiling, linkedOffset: 57 };

const linkedTopLeftWall: TileBehaviors = { ...topLeftWall, linkedOffset: 57 };
const linkedTopRightWall: TileBehaviors = { ...topRightWall, linkedOffset: 57 };
const linkedBottomLeftWall: TileBehaviors = { ...bottomLeftWall, linkedOffset: 57 };
const linkedBottomRightWall: TileBehaviors = { ...bottomRightWall, linkedOffset: 57 };



const JadeInteriorLightLeftCorner: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorLight.png', {x: 160, y: 0, w: 32, h: 80}), //160}), revert to 160 to include alternate tiles
    behaviors: {
        'all': linkedSouthernWallBehavior,
        '0x4': linkedTopRightWall, '1x4': linkedTopLeftWall,
        '0x9': linkedTopRightWall, '1x9': linkedTopLeftWall,
        '0x0': linkedBottomLeftWall, '1x0': linkedBottomRightWall,
        '0x5': linkedBottomLeftWall, '1x5': linkedBottomRightWall,



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
        'all': linkedSouthernWallBehavior,
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
        'all': linkedCeilingBehavior,
        '3x0': linkedBottomCeilingBehavior,
        '1x1': linkedBottomCeilingBehavior,
        '2x2': linkedBottomCeilingBehavior, '3x2': linkedBottomCeilingBehavior, '4x2': linkedBottomCeilingBehavior,
        '0x3': linkedBottomCeilingBehavior, '1x3': linkedBottomCeilingBehavior, '3x3': linkedBottomCeilingBehavior,
        '0x4': linkedTopLeftCeiling, '4x4': linkedTopLeftCeiling, '1x7': linkedTopLeftCeiling,
        '1x4': linkedTopRightCeiling, '5x4': linkedTopRightCeiling, '0x7': linkedTopRightCeiling,
        '5x3': linkedBottomLeftCeiling, '0x5': linkedBottomLeftCeiling, '1x6': linkedBottomLeftCeiling,
        '4x3': linkedBottomRightCeiling, '1x5': linkedBottomRightCeiling, '0x6': linkedBottomRightCeiling,
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
        'all': linkedSouthernWallBehavior,
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

