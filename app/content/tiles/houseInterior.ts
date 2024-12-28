import { requireFrame } from 'app/utils/packedImages';

let x = 0, y = 0;
// First tile is 886
// Tiles 889 + 893 used to be alternate solid lava tiles, but are no longer defined.
// There isn't currently a convenient way to replace these tiles so they are left blank for now.
// The simplest solution would probably be to add them back to the source image as additional lava tiles if we ever need any.
export const rugTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/objects/furniture/rugs.png', {x: 0, y: 0, w: 48, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor2'},
    },
    paletteTargets: [{key: 'house', x, y}],
};
