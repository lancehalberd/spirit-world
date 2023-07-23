import { requireImage } from 'app/utils/images';

const convexDesertTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/deserttiles.png'), x: 0, y: 0, w: 48, h: 48},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        '1x1': { defaultLayer: 'floor' },
    },
};

const concaveDesertTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/deserttiles.png'), x: 48, y: 0, w: 64, h: 32},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
};

const desertDecorationsTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/deserttiles.png'), x: 0, y: 64, w: 128, h: 32},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        '0x0': {skipped: true},
        '1x0': {skipped: true},
        '2x0': {skipped: true},
    },
};

const desertSandPilesTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/deserttiles.png'), x: 48, y: 32, w: 64, h: 32},
    behaviors: {
        'all': { defaultLayer: 'field2' },
    },
};

export const allDesertTileSources: TileSource[] = [
    convexDesertTiles,
    concaveDesertTiles,
    desertDecorationsTiles,
    desertSandPilesTiles,
];
