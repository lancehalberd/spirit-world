import { requireFrame } from 'app/utils/packedImages';

let x = 0, y = 0;
export const rugTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/objects/furniture/rugs.png', {x: 0, y: 0, w: 48, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor2'},
    },
    paletteTargets: [{key: 'house', x, y}],
};
