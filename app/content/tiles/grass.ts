import {requireFrame} from 'app/utils/packedImages';

const convexTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/grassCover.png', {x: 48, y: 0, w: 48, h: 48}),
    behaviors: {
        'all': {defaultLayer: 'floor2', linkedOffset: 21},
        '1x1': {defaultLayer: 'floor', linkedOffset: 21},
    },
};

const innerTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/grassCover.png', {x: 48, y: 48, w: 32, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor2', linkedOffset: 21},
    },
};

const concaveCorners: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/grassCover.png', {x: 0, y: 80, w: 32, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor2', linkedOffset: 21},
    },
};

const squareCorners: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/grassCover.png', {x: 48, y: 112, w: 32, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor2', linkedOffset: 21},
    },
};

export const allGrassTiles: TileSource[] = [
    convexTiles,
    innerTiles,
    concaveCorners,
    squareCorners,
];
