import {
    southernWallBehavior,
    topRightWall,
    topLeftWall,
    bottomLeftWall,
    bottomRightWall,
} from 'app/content/tiles/constants';




import { requireFrame } from 'app/utils/packedImages';




const JadeInteriorDarkLeftCorner: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorDark.png', {x: 160, y: 0, w: 32, h: 160}),
    behaviors: {
        'all': southernWallBehavior,
        '0x4': topRightWall, '1x4': topLeftWall,
        '0x9': topRightWall, '1x9': topLeftWall,
        '0x0': bottomLeftWall, '1x0': bottomRightWall,
        '0x5': bottomLeftWall, '1x5': bottomRightWall,






    }
}

/*
const JadeInteriorDarkRightCorner: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorDark.png', {x: 400, y: 0, w: 32, h: 160}),
    behaviors: {
        'all': southernWallBehavior,
        '0x4': topRightWall, '1x4': topLeftWall,
        '0x9': topRightWall, '1x9': topLeftWall,
        '0x0': bottomLeftWall, '1x0': bottomRightWall,
        '0x5': bottomLeftWall, '1x5': bottomRightWall,
    }
}
*/

const JadeInteriorDarkSquareWall: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorDark.png', {x: 112, y: 0, w: 32, h: 64}),
    behaviors: {
        'all': southernWallBehavior,
    }
}

/*
const JadeInteriorDarkSquareWallAlt: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorDark.png', {x: 352, y: 0, w: 32, h: 64}),
    behaviors: {
        'all': southernWallBehavior,
    }
}
*/



const JadeInteriorDarkSquareFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorDark.png', {x: 208, y: 80, w: 32, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor'}
    }
}


const JadeInteriorDarkFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorDark.png', {x: 0, y: 0, w: 112, h: 128}),
    behaviors: {
        'all': {defaultLayer: 'floor2'}
    }, tileCoordinates: [
        [0, 0],                 [3, 0],
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],
        [0, 2],         [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],
        [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
        [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4],
        [0, 5], [1, 5],         [3, 5], [4, 5], [5, 5], [6, 5],
        [0, 6], [1, 6],                 [4, 6], [5, 6],
        [0, 7], [1, 7],
    ]
}


const JadeInteriorDarkColumn: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorDark.png', {x: 112, y: 64, w: 32, h: 96}),
    behaviors: {
        'all': southernWallBehavior,
    }, tileCoordinates: [
        [0,0], [1,0],
        [0,1], [1,1],
        [0,2], [1,2],
        [0,3],
        [0,4],
        [0,5]
    ]
}








export const allJadeInteriorDarkTileSources: TileSource[] = [
    //JadeInteriorDarkRightCorner,
    JadeInteriorDarkLeftCorner,
    JadeInteriorDarkSquareFloor,
    JadeInteriorDarkFloor,
    JadeInteriorDarkSquareWall,
    //JadeInteriorDarkSquareWallAlt,
    JadeInteriorDarkColumn
];







