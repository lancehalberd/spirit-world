import {lightStoneParticles} from 'app/content/tiles/constants';
import { requireFrame } from 'app/utils/packedImages';

const convexStoneCeilingTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/ceilingtiles.png', {x: 0, y: 0, w: 48, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        '1x1': { defaultLayer: 'floor' },
    },
};

const concaveStoneCeilingTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/ceilingtiles.png', {x: 48, y: 0, w: 64, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
};

const stoneCeilingAlternateTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/ceilingtiles.png', {x: 16, y: 48, w: 16, h: 32}),
    behaviors: {
        '0x0': {defaultLayer: 'floor'},
        '0x1': {defaultLayer: 'floor2', underTile: 4, isBrittleGround: true, particles: lightStoneParticles, breakSound: 'rockShatter'},
    },
};

export const allStoneCeilingTileSources: TileSource[] = [
    convexStoneCeilingTiles,
    concaveStoneCeilingTiles,
    stoneCeilingAlternateTiles,
];
