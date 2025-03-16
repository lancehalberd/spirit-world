import {
    southernWallBehavior,
    topRightWall,
    topLeftWall,
    bottomLeftWall,
    bottomRightWall,
} from 'app/content/tiles/constants';


import { requireFrame } from 'app/utils/packedImages';


const JadeInteriorLightLeftCorner: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorLight.png', {x: 160, y: 0, w: 32, h: 160}),
    behaviors: {
        'all': southernWallBehavior,
        '0x4': topRightWall, '1x4': topLeftWall,
        '0x9': topRightWall, '1x9': topLeftWall,
        '0x0': bottomLeftWall, '1x0': bottomRightWall,
        '0x5': bottomLeftWall, '1x5': bottomRightWall,



    }
}

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

const JadeInteriorLightSquareWall: TileSource = { 
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorLight.png', {x: 112, y: 0, w: 32, h: 64}),
    behaviors: {
        'all': southernWallBehavior,
    }
}

const JadeInteriorLightSquareWallAlt: TileSource = { 
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorLight.png', {x: 352, y: 0, w: 32, h: 64}),
    behaviors: {
        'all': southernWallBehavior,
    }
}


const JadeInteriorLightSquareFloor: TileSource = { 
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorLight.png', {x: 208, y: 80, w: 32, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor'}
    }
}

const JadeInteriorLightFloor: TileSource = { //Assuming this is floor, maybe ceiling?
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorLight.png', {x: 0, y: 0, w: 112, h: 128}),
    behaviors: {
        'all': {defaultLayer: 'floor2'}
    }
}

const JadeInteriorLightColumn: TileSource = { 
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeInteriorLight.png', {x: 112, y: 64, w: 32, h: 96}),
    behaviors: {
        'all': southernWallBehavior,
    }
}




export const allJadeInteriorLightTileSources: TileSource[] = [
    JadeInteriorLightRightCorner,
    JadeInteriorLightLeftCorner,
    JadeInteriorLightSquareFloor,
    JadeInteriorLightFloor,
    JadeInteriorLightSquareWall,
    JadeInteriorLightSquareWallAlt,
    JadeInteriorLightColumn
];

