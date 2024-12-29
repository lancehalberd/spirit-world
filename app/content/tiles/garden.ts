import {lifeLootTable} from 'app/content/lootTables';
import {bushParticles, singleTileSource} from 'app/content/tiles/constants';
import {requireFrame} from 'app/utils/packedImages';

let x = 0, y = 0;
const bigFlowerTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/flowers.png', {x: 0, y: 0, w: 144, h: 16}),
    behaviors: {
        'all': {defaultLayer: 'floor2'},
    },
    paletteTargets: [{key: 'garden', x, y}],
};
y++;
const smallFlowerTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/flowers.png', {x: 0, y: 48, w: 144, h: 16}),
    behaviors: {
        'all': {defaultLayer: 'floor2'},
    },
    paletteTargets: [{key: 'garden', x, y}],
};

y++
const gardenPlotTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crops.png', {x: 0, y: 0, w: 48, h: 48}),
    behaviors: {
        'all': {defaultLayer: 'floor2'},
    },
    paletteTargets: [{key: 'garden', x, y}],
};
x += 3;
const gardenPlotRoundCornerTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crops.png', {x: 48, y: 0, w: 48, h: 48}),
    behaviors: {
        'all': {defaultLayer: 'floor2'},
    },
    paletteTargets: [{key: 'garden', x, y}],
    tileCoordinates: [
        [0,0], [2,0],
        [0,2], [2,2],
    ],
};

const pepperBehaviors: TileBehaviors = {
    defaultLayer: 'field',
    solid: true, pickupWeight: 0, cuttable: 1, lootTable: lifeLootTable,
    midHeight: true,
    underTile: 288,
    particles: bushParticles,
    breakSound: 'bushShatter',
    linkableTiles: [183],
    linkedOffset: 181,
};

const carrotParticles: Frame[] = [
    requireFrame('gfx/tiles/crops.png', {x: 112, y: 32, w: 16, h: 13}),
    requireFrame('gfx/tiles/crops.png', {x: 144, y: 40, w: 16, h: 4}),
    requireFrame('gfx/tiles/crops.png', {x: 144, y: 44, w: 16, h: 4}),
];

const carrotBehaviors: TileBehaviors = {
    defaultLayer: 'field',
    solid: true, pickupWeight: 0, cuttable: 1, lootTable: lifeLootTable,
    low: true,
    particles: carrotParticles,
    breakSound: 'bushShatter',
    linkableTiles: [183],
    linkedOffset: 181,
};
x++;
const cropTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crops.png', {x: 112, y: 16, w: 16, h: 32}),
    behaviors: {
        '0x0': pepperBehaviors,
        '0x1': {...carrotBehaviors, underTile: 288, pickupTile: 287},
    },
    paletteTargets: [{key: 'garden', x, y}],
    tileCoordinates: [
        [0,0],
        [0,1],
    ],
};
y++;
x--;
const emptyCropTile: TileSource = singleTileSource(
    'gfx/tiles/crops.png',
    {defaultLayer: 'field'},
    128, 32,
    [{key: 'garden', x, y}],
);
x += 2;
const fullCarrotTile: TileSource = singleTileSource(
    'gfx/tiles/crops.png',
    carrotBehaviors,
    144, 32,
    [{key: 'garden', x, y}],
);

export const allFlowerTiles: TileSource[] = [
    bigFlowerTiles,
    smallFlowerTiles,
];

export const allGardenTiles: TileSource[] = [
    gardenPlotTiles,
    gardenPlotRoundCornerTiles,
    cropTiles,
    fullCarrotTile,
    emptyCropTile,
];
