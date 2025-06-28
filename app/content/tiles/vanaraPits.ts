import {BITMAP_TOP_LEFT, BITMAP_TOP_RIGHT} from 'app/content/bitMasks';
import {pitBehavior, singleTileSource} from 'app/content/tiles/constants';
import { requireFrame } from 'app/utils/packedImages';

const vanaraPitsImage = 'gfx/tiles/vanaraPits.png';

const vanaraPitWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(vanaraPitsImage, {x: 128, y: 48, w: 48, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'floor2', pit: true, pitWall: true },
    },
};
const vanaraPits: TileSource = {
    w: 16, h: 16,
    source: requireFrame(vanaraPitsImage, {x: 64, y: 48, w: 48, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'floor2', pit: true },
    },
};
const vanaraPitEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame(vanaraPitsImage, {x: 112, y: 64, w: 80, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'field', isGround: false },
    },
    tileCoordinates: [
        [0, 0],[1, 0 ],[4, 0],
        [0, 1],        [4, 1],
        [0, 2],        [4, 2],
    ],
};

export const vanaraPitHorizontalWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(vanaraPitsImage, {x: 144, y: 144, w: 32, h: 16}),
    behaviors: {
        '0x0': { defaultLayer: 'floor2', pit: true, pitWall: true },
        '1x0': { defaultLayer: 'floor2', pit: true, pitWall: true },
    },
};
export const vanaraPitAngledWallsIn: TileSource = {
    w: 16, h: 16,
    source: requireFrame(vanaraPitsImage, {x: 96, y: 128, w: 32, h: 32}),
    behaviors: {
        '0x0': { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT, isSouthernWall: true },
        '1x0': { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT, isSouthernWall: true },
        '0x1': { defaultLayer: 'floor2', pit: true },
        '1x1': { defaultLayer: 'floor2', pit: true },
    },
};
export const vanaraPitAngledWallsOut: TileSource = {
    w: 16, h: 16,
    source: requireFrame(vanaraPitsImage, {x: 48, y: 128, w: 32, h: 32}),
    behaviors: {
        '0x0': { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT, isSouthernWall: true },
        '1x0': { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT, isSouthernWall: true },
        '0x1': { defaultLayer: 'floor2', pit: true },
        '1x1': { defaultLayer: 'floor2', pit: true },
    },
};

// Read a single frame selected on a brush from a source image.
// allTiles[editingState.brush.none.tiles[0][0]].frame
export const allVanaraPitTileSources: TileSource[] = [
    vanaraPitWalls, // 3
    vanaraPits, // 6
    vanaraPitEdges, // 7
    vanaraPitHorizontalWalls, // 2
    vanaraPitAngledWallsIn, // 4
    vanaraPitAngledWallsOut, // 4
    singleTileSource(vanaraPitsImage, pitBehavior, 16, 48),
    // = 26
];

