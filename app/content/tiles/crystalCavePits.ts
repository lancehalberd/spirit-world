import { requireFrame } from 'app/utils/packedImages';

const crystalCavePitsImage = 'gfx/tiles/crystalPits.png';

let y = 0, x = 8;
const crystalCavePitWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(crystalCavePitsImage, {x: 64, y: 96, w: 48, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'floor2', pit: true, pitWall: true },
    },
    paletteTargets: [{key: 'pits', x, y}],
};
y++;
const crystalCavePits: TileSource = {
    w: 16, h: 16,
    source: requireFrame(crystalCavePitsImage, {x: 64, y: 48, w: 48, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'floor2', pit: true },
    },
    paletteTargets: [{key: 'pits', x, y}],
};
x -= 2;
y += 2;
const crystalCavePitEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame(crystalCavePitsImage, {x: 112, y: 64, w: 80, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [
        [0, 0],[1, 0 ],[4, 0],
        [0, 1],        [4, 1],
        [0, 2],        [4, 2],
    ],
    paletteTargets: [{key: 'pits', x, y}],
};

// Read a single frame selected on a brush from a source image.
// allTiles[editingState.brush.none.tiles[0][0]].frame
export const allCrystalCavePitTileSources: TileSource[] = [
    crystalCavePitWalls, // 3
    crystalCavePits, // 6
    crystalCavePitEdges, // 7
    // = 16
];
