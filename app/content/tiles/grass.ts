import {requireFrame} from 'app/utils/packedImages';

const convexTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/grassCover.png', {x: 0, y: 0, w: 48, h: 48}),
    behaviors: {
        'all': {defaultLayer: 'floor2'},
        '1x1': {defaultLayer: 'floor'},
    },
};

const innerTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/grassCover.png', {x: 0, y: 48, w: 32, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor'},
    },
};

const concaveTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/grassCover.png', {x:32, y: 48, w: 32, h: 32}),
    behaviors: {
        'all': {defaultLayer: 'floor2'},
    },
};

export const allGrassTiles: TileSource[] = [
    convexTiles,
    innerTiles,
    concaveTiles,
];
