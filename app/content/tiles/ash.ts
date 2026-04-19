import {requireFrame} from 'app/utils/packedImages';

const convexTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/ash.png', {x: 0, y: 0, w: 48, h: 48}),
    behaviors: {
        'all': {defaultLayer: 'floor2', linkedIndex: 0},
        '1x1': {defaultLayer: 'floor'},
    },
};

const innerTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/ash.png', {x: 0, y: 48, w: 32, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor2', linkedIndex: 0},
    },
};

const concaveCorners: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/ash.png', {x: 0, y: 80, w: 32, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor2', linkedIndex: 0},
    },
};

const squareCorners: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/ash.png', {x: 0, y: 112, w: 32, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor2', linkedIndex: 0},
    },
};

export const allAshTiles: TileSource[] = [
    convexTiles,
    innerTiles,
    concaveCorners,
    squareCorners,
];
