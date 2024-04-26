/*import {
    BITMAP_BOTTOM_6,
    BITMAP_BOTTOM_LEFT, BITMAP_BOTTOM_RIGHT,
    BITMAP_LEFT_6,
    BITMAP_RIGHT_6,
    BITMAP_TOP_6,
    BITMAP_TOP_LEFT_8, BITMAP_TOP_RIGHT_8,
    BITMAP_BOTTOM_LEFT_8, BITMAP_BOTTOM_RIGHT_8,
    BITMAP_BOTTOM_LEFT_8_STRIP, BITMAP_BOTTOM_RIGHT_8_STRIP,
    BITMAP_DIAGONAL_TOP_LEFT_LEDGE, BITMAP_DIAGONAL_TOP_RIGHT_LEDGE,
    orBitMasks,
} from 'app/content/bitMasks';*/
import { 
    southernWallBehavior,
    topRightWall,
    topLeftWall,
} from 'app/content/tiles/constants';
import { requireFrame } from 'app/utils/packedImages';

const futuristicImage = 'gfx/tiles/futuristic.png';

const squareFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 16, y: 16, w: 48, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        '1x1': { defaultLayer: 'floor' },
    },
    paletteTargets: [{key: 'future', x: 0, y : 0}],
};

const convexCorners: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 144, y: 16, w: 48, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [
        // Thin ledges you can jump off of
        [ 0, 0], [ 2, 0],
        [ 0, 2], [ 2, 2],
    ],
    paletteTargets: [{key: 'future', x: 3, y : 0}],
};

const concaveCorners: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 224, y: 32, w: 48, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [
        // Thin ledges you can jump off of
        [ 0, 0], [ 2, 0],
        [ 0, 2], [ 2, 2],
    ],
    paletteTargets: [{key: 'future', x: 6, y : 0}],
};

const pitWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 640, y: 16, w: 48, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'floor', pit: true, pitWall: true },
    },
    paletteTargets: [{key: 'future', x: 9, y : 0}],
};
const pit: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 640, y: 48, w: 48, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'floor', pit: true },
    },
    paletteTargets: [{key: 'future', x: 9, y : 2}],
};


const ceilingEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 0, y: 128, w: 80, h: 80}),
    behaviors: {
        'all': { defaultLayer: 'foreground2' },
    },
    tileCoordinates: [
                 [1, 0], [2, 0], [3, 0],
        [ 0, 1], [1, 1],         [3, 1],[4, 1],
        [ 0, 2],                        [4, 2],
        [ 0, 3], [1, 3],         [3, 3],[4, 3],
                 [1, 4], [2, 4], [3, 4],
    ],
    paletteTargets: [{key: 'future', x: 0, y : 3}],
};
const ceilingCorners: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 160, y: 128, w: 32, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'foreground2' },
    },
    paletteTargets: [{key: 'future', x: 5, y : 3}],
};

const angledWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 80, y: 224, w: 96, h: 96}),
    behaviors: {
        'all': southernWallBehavior,
        '0x5': topLeftWall,
        '1x4': topLeftWall,
        '2x3': topLeftWall,

        '3x3': topRightWall,
        '4x4': topRightWall,
        '5x5': topRightWall,
    },
    tileCoordinates: [
                 [0, 1], [2, 0], [3, 0], [4, 0],
                 [1, 1], [2, 1], [3, 1], [4, 1],
        [ 0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2],
        [ 0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
        [ 0, 4], [1, 4],                 [4, 4], [5, 4],
        [ 0, 5],                                 [5, 5],
    ],
    paletteTargets: [{key: 'future', x: 0, y : 8}],
};

const wallTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 16, y: 208, w: 48, h: 48}),
    behaviors: {
        'all': southernWallBehavior,
    },
    paletteTargets: [{key: 'future', x: 6, y : 8}],
};

const wallStrip: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 16, y: 272, w: 16, h: 48}),
    behaviors: {
        'all': southernWallBehavior,
    },
    paletteTargets: [{key: 'future', x: 9, y : 8}],
};

/*


const obsidianStairs: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 144, y: 48, w: 48, h: 80}),
    behaviors: {
        'all': { defaultLayer: 'field' },
    },
};

let defaultLayer: DefaultLayer = 'field';
const obsidianLedges: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 0, y: 48, w: 128, h: 96}),
    behaviors: {
        'all': { defaultLayer },
        // Thin ledges you can jump off of
        '0x0': { defaultLayer, ledges: { left: true, up: true } },
        '1x0': { defaultLayer, ledges: { up: true } },
        '2x0': { defaultLayer, ledges: { right: true, up: true } },
        '0x1': { defaultLayer, ledges: { left: true } },
        '2x1': { defaultLayer, ledges: { right: true } },
        '0x2': { defaultLayer, ledges: { left: true, down: true } },
        '1x2': { defaultLayer, ledges: { down: true } },
        '2x2': { defaultLayer, ledges: { right: true, down: true } },
        '4x0': { defaultLayer, diagonalLedge: 'upleft'},
        '5x0': { defaultLayer, diagonalLedge: 'upright'},
        '4x2': { defaultLayer, solidMap: BITMAP_BOTTOM_LEFT, diagonalLedge: 'downleft'},
        '5x2': { defaultLayer, solidMap: BITMAP_BOTTOM_RIGHT, diagonalLedge: 'downright'},
        '6x2': { defaultLayer, solidMap: BITMAP_BOTTOM_LEFT, diagonalLedge: 'downleft'},
        '7x2': { defaultLayer, solidMap: BITMAP_BOTTOM_RIGHT, diagonalLedge: 'downright'},
        // Tall ledges that act as walls
        '0x3': { defaultLayer, solidMap: orBitMasks(BITMAP_TOP_6, BITMAP_LEFT_6), ledges: { left: true, up: true } },
        '1x3': { defaultLayer, solidMap: BITMAP_TOP_6, ledges: { up: true } },
        '2x3': { defaultLayer, solidMap: orBitMasks(BITMAP_TOP_6, BITMAP_RIGHT_6), ledges: { right: true, up: true } },
        '0x4': { defaultLayer, solidMap: BITMAP_LEFT_6, ledges: { left: true } },
        '2x4': { defaultLayer, solidMap: BITMAP_RIGHT_6, ledges: { right: true } },
        '4x4': { defaultLayer, solidMap: BITMAP_LEFT_6, ledges: { left: true } },
        '5x4': { defaultLayer, solidMap: BITMAP_RIGHT_6, ledges: { right: true } },
        '0x5': { defaultLayer, solidMap: orBitMasks(BITMAP_BOTTOM_6, BITMAP_LEFT_6), ledges: { left: true, down: true } },
        '1x5': { defaultLayer, solidMap: BITMAP_BOTTOM_6, ledges: { down: true } },
        '2x5': { defaultLayer, solidMap: orBitMasks(BITMAP_BOTTOM_6, BITMAP_RIGHT_6), ledges: { right: true, down: true } },
        '4x3': { defaultLayer, solidMap: BITMAP_DIAGONAL_TOP_LEFT_LEDGE, diagonalLedge: 'upleft'},
        '5x3': { defaultLayer, solidMap: BITMAP_DIAGONAL_TOP_RIGHT_LEDGE, diagonalLedge: 'upright'},
        '4x5': { defaultLayer, solidMap: orBitMasks(BITMAP_BOTTOM_LEFT, BITMAP_BOTTOM_LEFT_8_STRIP), diagonalLedge: 'downleft'},
        '5x5': { defaultLayer, solidMap: orBitMasks(BITMAP_BOTTOM_RIGHT, BITMAP_BOTTOM_RIGHT_8_STRIP), diagonalLedge: 'downright'},
        '6x5': { defaultLayer, solidMap: orBitMasks(BITMAP_BOTTOM_LEFT, BITMAP_BOTTOM_LEFT_8_STRIP), diagonalLedge: 'downleft'},
        '7x5': { defaultLayer, solidMap: orBitMasks(BITMAP_BOTTOM_RIGHT, BITMAP_BOTTOM_RIGHT_8_STRIP), diagonalLedge: 'downright'},
    },
    tileCoordinates: [
        // Thin ledges you can jump off of
        [ 0, 0],[ 1, 0],[ 2, 0],[4, 0], [5, 0],
        [ 0, 1],        [ 2, 1],
        [ 0, 2],[ 1, 2],[ 2, 2],[4, 2], [5, 2],[6, 2], [7, 2],
        // Tall ledges that act as walls
        [ 0, 3],[ 1, 3],[ 2, 3],[4, 3], [5, 3],
        [ 0, 4],        [ 2, 4],[4, 4], [5, 4],
        [ 0, 5],[ 1, 5],[ 2, 5],[4, 5], [5, 5],[6, 5], [7, 5],
    ],
};

const obsidianLedgeBits: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 64, y: 192, w: 32, h: 32}),
    behaviors: {
        'all': southernWallBehavior,
        '0x0': {defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT_8},
        '1x0': {defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT_8},
        '0x1': {defaultLayer: 'field', solidMap: BITMAP_BOTTOM_LEFT_8},
        '1x1': {defaultLayer: 'field', solidMap: BITMAP_BOTTOM_RIGHT_8},
    },
};

const obsidianFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        '1x1': { defaultLayer: 'floor' },
    },
    tileCoordinates: [
        [0, 0],[1, 0],[2, 0], [4, 0], [5, 0],
        [0, 1],[1, 1],[2, 1],
        [0, 2],[1, 2],[2, 2], [4, 2], [5, 2],
    ],
};*/


export const allFuturisticTileSources: TileSource[] = [
    squareFloor,
    convexCorners,
    concaveCorners,
    pitWalls,
    pit,
    ceilingEdges,
    ceilingCorners,
    angledWalls,
    wallTiles,
    wallStrip,
];
