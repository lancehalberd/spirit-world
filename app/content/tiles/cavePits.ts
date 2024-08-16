import { requireFrame } from 'app/utils/packedImages';

const cavePitsImage = 'gfx/tiles/cavePits.png';

let y = 0, x = 2;
const cavePitWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(cavePitsImage, {x: 64, y: 96, w: 48, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'floor2', pit: true, pitWall: true },
    },
    paletteTargets: [{key: 'pits', x, y}],
};
y++;
const cavePits: TileSource = {
    w: 16, h: 16,
    source: requireFrame(cavePitsImage, {x: 64, y: 48, w: 48, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'floor2', pit: true },
    },
    paletteTargets: [{key: 'pits', x, y}],
};
x -= 2;
y += 2;
const cavePitEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame(cavePitsImage, {x: 112, y: 64, w: 80, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'field', isGround: false },
    },
    paletteTargets: [{key: 'pits', x, y}],
    tileCoordinates: [
        [0, 0],[1, 0 ],[4, 0],
        [0, 1],        [4, 1],
        [0, 2],        [4, 2],
    ],
};

export const cavePitAngledWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(cavePitsImage, {x: 96, y: 128, w: 32, h: 32}),
    behaviors: {
        '0x0': { defaultLayer: 'floor2', pit: true, pitWall: true },
        '1x0': { defaultLayer: 'floor2', pit: true, pitWall: true },
        '0x1': { defaultLayer: 'floor2', pit: true },
        '1x1': { defaultLayer: 'floor2', pit: true },
    },
};

export const cavePitHorizontalWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(cavePitsImage, {x: 144, y: 128, w: 32, h: 32}),
    behaviors: {
        '0x0': { defaultLayer: 'field', solid: true, isSouthernWall: true },
        '1x0': { defaultLayer: 'field', solid: true, isSouthernWall: true },
        '0x1': { defaultLayer: 'floor2', pit: true, pitWall: true },
        '1x1': { defaultLayer: 'floor2', pit: true, pitWall: true },
    },
};

// Read a single frame selected on a brush from a source image.
// allTiles[editingState.brush.none.tiles[0][0]].frame
export const allCavePitTileSources: TileSource[] = [
    cavePitWalls, // 3
    cavePits, // 6
    cavePitEdges, // 7
    // = 16
];
