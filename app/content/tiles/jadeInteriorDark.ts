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


const JadeInteriorDarkSquareWall: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorDark.png', {x: 112, y: 0, w: 32, h: 64}),
    behaviors: {
        'all': southernWallBehavior,
    }
}


const JadeInteriorDarkSquareWallAlt: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorDark.png', {x: 352, y: 0, w: 32, h: 64}),
    behaviors: {
        'all': southernWallBehavior,
    }
}




const JadeInteriorDarkSquareFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorDark.png', {x: 208, y: 80, w: 32, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor'}
    }
}


const JadeInteriorDarkFloor: TileSource = { //Assuming this is floor, maybe ceiling?
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorDark.png', {x: 0, y: 0, w: 112, h: 128}),
    behaviors: {
        'all': {defaultLayer: 'floor2'}
    }
}


const JadeInteriorDarkColumn: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorDark.png', {x: 112, y: 64, w: 32, h: 96}),
    behaviors: {
        'all': southernWallBehavior,
    }
}




export const allJadeInteriorDarkTileSources: TileSource[] = [
    JadeInteriorDarkRightCorner,
    JadeInteriorDarkLeftCorner,
    JadeInteriorDarkSquareFloor,
    JadeInteriorDarkFloor,
    JadeInteriorDarkSquareWall,
    JadeInteriorDarkSquareWallAlt,
    JadeInteriorDarkColumn
];

