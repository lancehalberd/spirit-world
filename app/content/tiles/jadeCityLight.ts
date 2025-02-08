import {
    orBitMasks,
    BITMAP_TOP_6, 
    BITMAP_LEFT_6,
    BITMAP_RIGHT_6,
    BITMAP_BOTTOM_6
} from 'app/content/bitMasks';

import {
    southernWallBehavior,
} from 'app/content/tiles/constants';

import { requireFrame } from 'app/utils/packedImages';

const jadeCityFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 0, y: 0, w: 64, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor'}
    }
}

//FINISH BEHAVIORS
const jadeCityDomes: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 0, y: 0, w: 64, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor'}
    }
}

//ADD BITMAPS
const jadeCityLightRailings: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 144, y: 160, w: 112, h: 16}),
    behaviors: {
        'all': southernWallBehavior
    }
}

//CHANGE BACK unlit window in decorations?

const jadeCityLightDecorations: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 0, y: 224, w: 96, h: 48}),
    behaviors: {
        'all': {defaultLayer: 'floor2'}
    }
}

const jadeCityLightWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 0, y: 160, w: 112, h: 48}),
    behaviors: {
        'all': southernWallBehavior
    }
}

//Bottom Edges go under player, need to fix
let defaultLayer: DefaultLayer = 'field';
const jadeCityLightEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 0, y: 32, w: 80, h: 64}),
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

const jadeCityLightExtraEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/jadeCityLight.png', {x: 16, y: 144, w: 48, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_6, ledges: { down: true } }
    }
}

export const allLightJadeCityTileSources: TileSource[] = [
    jadeCityFloor, 
    jadeCityDomes,
    jadeCityLightRailings,
    jadeCityLightDecorations,
    jadeCityLightWalls,
    jadeCityLightEdges,
    jadeCityLightExtraEdges
];