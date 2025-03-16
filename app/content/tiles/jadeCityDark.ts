import {
    orBitMasks,
    BITMAP_TOP_6,
    BITMAP_LEFT_6,
    BITMAP_RIGHT_6,
    BITMAP_BOTTOM_6,
    BITMAP_BOTTOM_13,
    BITMAP_VERT_MIDDLE_6,
    BITMAP_TOP_RIGHT_MISS_CORN_6,
    BITMAP_TOP_LEFT_MISS_CORN_6,
    BITMAP_TOP_LEFT_CORN_6,
    BITMAP_TOP_RIGHT_CORN_6,
    BITMAP_TOP_RIGHT_6,
    BITMAP_TOP_LEFT_6,
    BITMAP_BOTTOM_LEFT_CORN_10,
    BITMAP_BOTTOM_RIGHT_CORN_10,
    BITMAP_TOP_3,
    BITMAP_DIAGONAL_TOP_LEFT_LEDGE,
    BITMAP_DIAGONAL_TOP_RIGHT_LEDGE,
    BITMAP_TOP_RIGHT_11,
    BITMAP_TOP_LEFT_11,
    BITMAP_LEFT,
    BITMAP_RIGHT,
    BITMAP_BOTTOM,
    BITMAP_BOTTOM_LEFT_11,
    BITMAP_BOTTOM_RIGHT_11
} from 'app/content/bitMasks';


import {
    southernWallBehavior,
    topRightWall,
    topLeftWall,
    bottomLeftWall,
    bottomRightWall,
} from 'app/content/tiles/constants';


import { requireFrame } from 'app/utils/packedImages';




const jadeCityFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 0, y: 0, w: 64, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor'}
    }
}


const jadeCityDarkRailings: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 144, y: 160, w: 112, h: 16}),
    behaviors: {
        'all': southernWallBehavior,
        '0x0':{ defaultLayer: 'field', solidMap: BITMAP_BOTTOM_13},
        '1x0':{ defaultLayer: 'field', solidMap: BITMAP_VERT_MIDDLE_6},
        '2x0':{ defaultLayer: 'field', solidMap: BITMAP_VERT_MIDDLE_6}


    }
}

const jadeCityDarkDome: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 96, y: 0, w: 64, h: 48}),
    behaviors: {
        'all': southernWallBehavior,
        '0x0': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_RIGHT_11},
        '0x1': { defaultLayer: 'field', solidMap: BITMAP_RIGHT},
        '0x2': { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT_11},
        '1x0': { defaultLayer: 'foreground', solidMap: BITMAP_BOTTOM},
        '2x0': { defaultLayer: 'foreground', solidMap: BITMAP_BOTTOM},
        '3x0': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_LEFT_11},
        '3x1': { defaultLayer: 'field', solidMap: BITMAP_LEFT},
        '3x2': { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT_11},
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
    }
}


const jadeCityDarkWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 0, y: 160, w: 112, h: 48}),
    behaviors: {
        'all': southernWallBehavior,
    }
}




const jadeTopRight: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_DIAGONAL_TOP_RIGHT_LEDGE, isSouthernWall: true, isGround: false};
const jadeTopLeft: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_DIAGONAL_TOP_LEFT_LEDGE, isSouthernWall: true, isGround: false};
const jadeCityDarkSlopedWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 272, y: 112, w: 128, h: 112}),
    behaviors: {
        'all': southernWallBehavior,
        '6x3': bottomLeftWall, '7x3': bottomRightWall,
        '6x6': topRightWall, '7x6': topLeftWall,
        '0x0': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_LEFT_CORN_10}, //Slightly uneven, tweak size of corner
        '1x1': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_LEFT_CORN_10},
        '2x2': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_LEFT_CORN_10},
        '3x2': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_RIGHT_CORN_10},
        '4x1': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_RIGHT_CORN_10},
        '5x0': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_RIGHT_CORN_10},
        '2x6': jadeTopRight, '3x6': jadeTopLeft,
        '1x5': jadeTopRight, '4x5': jadeTopLeft,
        '0x4': jadeTopRight, '5x4': jadeTopLeft,
        '2x3': bottomLeftWall, '3x3': bottomRightWall,
        '1x2': bottomLeftWall, '4x2': bottomRightWall,
        '0x1': bottomLeftWall, '5x1': bottomRightWall,
    }
}


const jadeCityDarkTowers: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 272, y: 0, w: 128, h: 112}),
    behaviors: {
        'all': southernWallBehavior,
        '0x3': { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT_MISS_CORN_6},
        '2x3': { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT_MISS_CORN_6},
        '0x6': topRightWall, '2x6': topLeftWall,
        '4x6': topRightWall, '6x6': topLeftWall,
        '1x1': { defaultLayer: 'field', solidMap: BITMAP_TOP_6},
        '0x5': { defaultLayer: 'field', solidMap: BITMAP_TOP_6},
        '0x1': { defaultLayer: 'field', solidMap: BITMAP_DIAGONAL_TOP_LEFT_LEDGE},
        '2x1': { defaultLayer: 'field', solidMap: BITMAP_DIAGONAL_TOP_RIGHT_LEDGE},
        '0x2': { defaultLayer: 'field', solidMap: BITMAP_LEFT_6},
        '2x2': { defaultLayer: 'field', solidMap: BITMAP_RIGHT_6},
        '4x0': { defaultLayer: 'field', solidMap: BITMAP_DIAGONAL_TOP_LEFT_LEDGE},
        '5x0': { defaultLayer: 'field', solidMap: BITMAP_TOP_6},
        '6x0': { defaultLayer: 'field', solidMap: BITMAP_DIAGONAL_TOP_RIGHT_LEDGE},
        '3x1': { defaultLayer: 'field', solidMap: BITMAP_RIGHT_6},
        '3x2': { defaultLayer: 'field', solidMap: BITMAP_RIGHT_6},
        '7x1': { defaultLayer: 'field', solidMap: BITMAP_LEFT_6},
        '7x2': { defaultLayer: 'field', solidMap: BITMAP_LEFT_6},
        '4x1': { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT_CORN_6},
        '6x1': { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT_CORN_6},
        '4x2': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_LEFT_CORN_10},
        '6x2': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_RIGHT_CORN_10},
        '3x5': { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT_6},
        '7x5': { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT_6}
}
}




//Bottom Edges go under player
let defaultLayer: DefaultLayer = 'field';
const jadeCityDarkEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 0, y: 32, w: 80, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'field' },
        '0x1': { defaultLayer, solidMap: orBitMasks(BITMAP_TOP_6, BITMAP_LEFT_6), ledges: { left: true, up: true } },
        '1x1': { defaultLayer, solidMap: BITMAP_TOP_6, ledges: { up: true } },
        '2x1': { defaultLayer, solidMap: BITMAP_TOP_6, ledges: { up: true } },
        '3x1': { defaultLayer, solidMap: BITMAP_TOP_6, ledges: { up: true } },
        '4x1': { defaultLayer, solidMap: orBitMasks(BITMAP_TOP_6, BITMAP_RIGHT_6), ledges: { right: true, up: true } },
        '0x2': { defaultLayer, solidMap: BITMAP_LEFT_6, ledges: { left: true } },
        '1x2': { defaultLayer, solidMap: BITMAP_TOP_6, ledges: { up: true } },
        '3x2': { defaultLayer, solidMap: BITMAP_TOP_6, ledges: { up: true } },
        '4x2': { defaultLayer, solidMap: BITMAP_RIGHT_6, ledges: { right: true } },
        '0x3': { defaultLayer, solidMap: orBitMasks(BITMAP_BOTTOM_6, BITMAP_LEFT_6), ledges: { left: true, down: true } },
        '1x3': { defaultLayer, solidMap: BITMAP_BOTTOM_6, ledges: { down: true } },
        '2x3': { defaultLayer, solidMap: BITMAP_BOTTOM_6, ledges: { down: true } },
        '3x3': { defaultLayer, solidMap: BITMAP_BOTTOM_6, ledges: { down: true } },
        '4x3': { defaultLayer, solidMap: orBitMasks(BITMAP_BOTTOM_6, BITMAP_RIGHT_6), ledges: { right: true, down: true } },
    }
}


const jadeCityDarkExtraEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 16, y: 144, w: 48, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'field', solidMap: BITMAP_TOP_6, ledges: { down: true } }
    }
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
    }
}


const jadeCityDarkColumnWall: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityDark.png', {x: 0, y: 96, w: 80, h: 64}),
    behaviors: {
        'all': southernWallBehavior,
        '0x3': { defaultLayer: 'field', solidMap: BITMAP_TOP_3 },
        '4x3': { defaultLayer: 'field', solidMap: BITMAP_TOP_3 }
    }
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
    jadeCityDarkDome
];

