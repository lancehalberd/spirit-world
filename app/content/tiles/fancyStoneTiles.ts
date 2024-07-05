import {
    deletedTiles,
    southernWallBehavior,
} from 'app/content/tiles/constants';
import { requireFrame } from 'app/utils/packedImages';

const convexFancyStoneCeilingTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/ceilingtilesfancystone.png', {x: 0, y: 0, w: 48, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        '1x1': { defaultLayer: 'floor' },
    },
};

const concaveFancyStoneCeilingTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/ceilingtilesfancystone.png', {x: 48, y: 0, w: 64, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
};

const fancyStoneCeilingAlternateTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/ceilingtilesfancystone.png', {x: 32, y: 48, w: 16, h: 16}),
    behaviors: {
        '0x1': {defaultLayer: 'floor2', underTile: 4, isBrittleGround: true},
    },
};

const fancyStoneEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/nicestonebuilding.png', {x: 0, y: 0, w: 80, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'foreground2' },
        '1x1': {skipped: true},
        '3x2': {skipped: true},
        '4x2': {skipped: true},
    },
};

const fancyStoneWall: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/nicestonebuilding.png', {x: 0, y: 48, w: 48, h: 48}),
    behaviors: {
        'all': southernWallBehavior,
    },
};

const fancyStonePillar: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/nicestonebuilding.png', {x: 64, y: 32, w: 16, h: 64}),
    behaviors: {
        'all': southernWallBehavior,
        '0x3': { defaultLayer: 'floor2'},
    },
};

export const allFancyStoneCeilingTileSources: TileSource[] = [
    convexFancyStoneCeilingTiles,
    concaveFancyStoneCeilingTiles,
    deletedTiles(1),
    fancyStoneCeilingAlternateTiles,
    fancyStoneWall,
    fancyStonePillar,
    fancyStoneEdges,
];
