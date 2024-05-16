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
    bottomCeilingBehavior,
    bottomLeftCeiling,
    bottomLeftShallowCeiling,
    bottomRightCeiling,
    bottomRightShallowCeiling,
    ceilingBehavior,
    singleTileSource,
    southernWallBehavior,
    topRightWall,
    topLeftWall,
} from 'app/content/tiles/constants';
import { requireFrame } from 'app/utils/packedImages';

const futuristicImage = 'gfx/tiles/futuristic.png';

const foreground2: TileBehaviors = { defaultLayer: 'foreground2'};

let y = 0;
const lightSquareFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 16, y: 16, w: 48, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor', linkedOffset: 17 },
    },
    paletteTargets: [{key: 'future', x: 0, y}],
};

const lightConvexCorners: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 144, y: 16, w: 48, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor2', linkedOffset: 17 },
    },
    tileCoordinates: [
        // Thin ledges you can jump off of
        [ 0, 0], [ 2, 0],
        [ 0, 2], [ 2, 2],
    ],
    paletteTargets: [{key: 'future', x: 3, y}],
};

const lightConcaveCorners: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 224, y: 32, w: 48, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor2', linkedOffset: 17 },
    },
    tileCoordinates: [
        // Thin ledges you can jump off of
        [ 0, 0], [ 2, 0],
        [ 0, 2], [ 2, 2],
    ],
    paletteTargets: [{key: 'future', x: 6, y}],
};

// TODO: Add behaviors for angled pits+pit walls.
const angledPit: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 688, y: 16, w: 64, h: 80}),
    behaviors: {
        'all': { defaultLayer: 'floor', pit: true },
    },
    tileCoordinates: [
                [1, 0], [2, 0],
        [0, 1], [1, 1], [2, 1], [3, 1],
        [0, 2], [1, 2], [2, 2], [3, 2],
        [0, 3], [1, 3], [2, 3], [3, 3],
                [1, 4], [2, 4],
    ],
    paletteTargets: [{key: 'future', x: 9, y}],
};

const pitWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 624, y: 16, w: 48, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'floor', pit: true, pitWall: true },
    },
    paletteTargets: [{key: 'future', x: 13, y}],
};
const pit: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 624, y: 32, w: 48, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'floor', pit: true },
    },
    paletteTargets: [{key: 'future', x: 13, y: y + 1}],
};

y += 3;

const darkSquareFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 16, y: 112, w: 48, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor', linkedOffset: -17 },
    },
    paletteTargets: [{key: 'future', x: 0, y}],
};

const darkConvexCorners: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 144, y: 112, w: 48, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor2', linkedOffset: -17 },
    },
    tileCoordinates: [
        // Thin ledges you can jump off of
        [ 0, 0], [ 2, 0],
        [ 0, 2], [ 2, 2],
    ],
    paletteTargets: [{key: 'future', x: 3, y}],
};

const darkConcaveCorners: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 224, y: 128, w: 48, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor2', linkedOffset: -17 },
    },
    tileCoordinates: [
        // Thin ledges you can jump off of
        [ 0, 0], [ 2, 0],
        [ 0, 2], [ 2, 2],
    ],
    paletteTargets: [{key: 'future', x: 6, y}],
};

const wallStrip: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 16, y: 384, w: 16, h: 48}),
    behaviors: {
        'all': southernWallBehavior,
    },
    paletteTargets: [{key: 'future', x: 7, y}],
};

const wallTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 48, y: 384, w: 48, h: 48}),
    behaviors: {
        'all': southernWallBehavior,
    },
    paletteTargets: [{key: 'future', x: 13, y}],
};

y += 3;


const angledWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 16, y: 448, w: 96, h: 96}),
    behaviors: {
        'all': southernWallBehavior,
        '1x0': ceilingBehavior,
        '2x0': ceilingBehavior,
        '3x0': ceilingBehavior,
        '4x0': ceilingBehavior,

        '1x1': ceilingBehavior,
        '4x1': ceilingBehavior,

        '0x2': ceilingBehavior,
        '5x2': ceilingBehavior,

        '0x5': topLeftWall,
        '1x4': topLeftWall,
        '2x3': topLeftWall,

        '3x3': topRightWall,
        '4x4': topRightWall,
        '5x5': topRightWall,
    },
    tileCoordinates: [
                 [1, 0], [2, 0], [3, 0], [4, 0],
                 [1, 1], [2, 1], [3, 1], [4, 1],
        [ 0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2],
        [ 0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
        [ 0, 4], [1, 4],                 [4, 4], [5, 4],
        [ 0, 5],                                 [5, 5],
    ],
    paletteTargets: [{key: 'future', x: 0, y}],
};

const angledWallInteriors: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 352, y: 400, w: 96, h: 48}),
    behaviors: {
        'all': southernWallBehavior,
    },
    tileCoordinates: [
                         [2, 0], [3, 0],
                 [1, 1],                 [4, 1],
        [ 0, 2],         [2, 2], [3, 2],         [5, 2],
    ],
};

const ceilingEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 0, y: 208, w: 80, h: 80}),
    behaviors: {
        'all': ceilingBehavior,
        '0x3': bottomLeftShallowCeiling,
        '1x4': bottomLeftShallowCeiling,
        '2x4': bottomCeilingBehavior,
        '4x3': bottomRightShallowCeiling,
        '3x4': bottomRightShallowCeiling,
    },
    tileCoordinates: [
                 [1, 0], [2, 0], [3, 0],
        [ 0, 1], [1, 1],         [3, 1],[4, 1],
        [ 0, 2],                        [4, 2],

                 [1, 4], [2, 4], [3, 4],
    ],
    paletteTargets: [{key: 'future', x: 6, y}],
};
const bottomLeftCeilingWithAbyss = singleTileSource(futuristicImage, bottomLeftCeiling, 528, 256, [{key: 'future', x: 7, y: y + 3}]);
const bottomRightCeilingWithAbyss = singleTileSource(futuristicImage, bottomRightCeiling, 560, 256, [{key: 'future', x: 9, y: y + 3}]);


const ceilingCorners: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 160, y: 288, w: 32, h: 64}),
    behaviors: {
        'all': ceilingBehavior,
        '0x0': bottomCeilingBehavior,
        '1x0': bottomCeilingBehavior,
    },
    paletteTargets: [{key: 'future', x: 11, y}],
};

y += 6;


const leftTopCurvedCeiling: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 352, y: 240, w: 16, h: 32}),
    behaviors: {
        'all': foreground2,
    },
    paletteTargets: [{key: 'future', x: 0, y: y + 2}],
};

const leftBottomCurvedCeiling: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 352, y: 320, w: 32, h: 16}),
    behaviors: {
        'all': foreground2,
    },
    paletteTargets: [{key: 'future', x: 0, y: y + 7}],
};
const leftBottomCurvedCeilingWithAbyss = singleTileSource(futuristicImage, bottomLeftCeiling, 608, 336, [{key: 'future', x: 1, y: y + 8}]);

const bottomLeftCurvedCeiling: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 384, y: 352, w: 32, h: 32}),
    behaviors: {
        'all': foreground2,
        '0x1': bottomLeftShallowCeiling,
        '1x1': bottomCeilingBehavior,
    },
    tileCoordinates: [
                [1, 0],
        [0, 1], [1, 1],
    ],
    paletteTargets: [{key: 'future', x: 2, y: y + 9}],
};
const bottomLeftCurvedCeilingWithAbyss = singleTileSource(futuristicImage, bottomLeftCeiling, 624, 352, [{key: 'future', x: 2, y: y + 9}]);

const leftCurvedWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 240, y: 480, w: 16, h: 80}),
    behaviors: {
        'all': southernWallBehavior,
        '0x0': ceilingBehavior,
        '0x3': topLeftWall,
        '0x4': { defaultLayer: 'field'},
    },
    paletteTargets: [{key: 'future', x: 1, y: y + 2}],
};

const leftTopCurvedWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 272, y: 432, w: 16, h: 80}),
    behaviors: {
        'all': southernWallBehavior,
        '0x0': ceilingBehavior,
        '0x1': ceilingBehavior,
        '0x4': topLeftWall,
    },
    paletteTargets: [{key: 'future', x: 2, y}],
};

const topLeftCurvedWallTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 176, y: 368, w: 16, h: 80}),
    behaviors: {
        'all': southernWallBehavior,
        '0x0': ceilingBehavior,
        '0x4': { defaultLayer: 'field'},
    },
    paletteTargets: [{key: 'future', x: 3, y}],
};
const topRightCurvedWallTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 208, y: 368, w: 16, h: 80}),
    behaviors: {
        'all': southernWallBehavior,
        '0x0': ceilingBehavior,
        '0x4': { defaultLayer: 'field'},
    },
    paletteTargets: [{key: 'future', x: 4, y}],
};

const rightTopCurvedWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 288, y: 432, w: 16, h: 80}),
    behaviors: {
        'all': southernWallBehavior,
        '0x0': ceilingBehavior,
        '0x1': ceilingBehavior,
        '0x4': topRightWall,
    },
    paletteTargets: [{key: 'future', x: 5, y}],
};

const rightCurvedWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 320, y: 480, w: 16, h: 80}),
    behaviors: {
        'all': southernWallBehavior,
        '0x0': ceilingBehavior,
        '0x3': topRightWall,
        '0x4': { defaultLayer: 'field'},
    },
    paletteTargets: [{key: 'future', x: 6, y: y + 2}],
};


const rightTopCurvedCeiling: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 464, y: 240, w: 16, h: 32}),
    behaviors: {
        'all': foreground2,
    },
    paletteTargets: [{key: 'future', x: 7, y: y + 2}],
};

const rightBottomCurvedCeiling: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 448, y: 320, w: 32, h: 16}),
    behaviors: {
        'all': foreground2,
    },
    paletteTargets: [{key: 'future', x: 6, y: y + 7}],
};
const rightBottomCurvedCeilingWithAbyss = singleTileSource(futuristicImage, bottomRightCeiling, 688, 336, [{key: 'future', x: 6, y: y + 8}]);

const bottomRightCurvedCeiling: TileSource = {
    w: 16, h: 16,
    source: requireFrame(futuristicImage, {x: 416, y: 352, w: 32, h: 32}),
    behaviors: {
        'all': foreground2,
        '0x1': bottomCeilingBehavior,
        '1x1': bottomRightShallowCeiling,
    },
    tileCoordinates: [
        [0, 0],
        [0, 1], [1, 1],
    ],
    paletteTargets: [{key: 'future', x: 4, y: y + 9}],
};
const bottomRightCurvedCeilingWithAbyss = singleTileSource(futuristicImage, bottomRightCeiling, 672, 352, [{key: 'future', x: 5, y: y + 9}]);



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

// Read a single frame selected on a brush from a source image.
// allTiles[editingState.brush.none.tiles[0][0]].frame
export const allFuturisticTileSources: TileSource[] = [
    lightSquareFloor,
    lightConvexCorners,
    lightConcaveCorners,
    darkSquareFloor,
    darkConvexCorners,
    darkConcaveCorners,
    pitWalls,
    pit,
    angledPit,
    wallStrip,
    wallTiles,
    angledWalls,
    leftTopCurvedWalls,
    leftCurvedWalls,
    topLeftCurvedWallTiles,
    topRightCurvedWallTiles,
    rightTopCurvedWalls,
    rightCurvedWalls,
    ceilingEdges,
    ceilingCorners,
    bottomLeftCeilingWithAbyss,
    bottomRightCeilingWithAbyss,
    bottomLeftCurvedCeilingWithAbyss,
    bottomRightCurvedCeilingWithAbyss,
    leftBottomCurvedCeilingWithAbyss,
    rightBottomCurvedCeilingWithAbyss,
    leftTopCurvedCeiling,
    leftBottomCurvedCeiling,
    bottomLeftCurvedCeiling,
    bottomRightCurvedCeiling,
    rightTopCurvedCeiling,
    rightBottomCurvedCeiling,
    angledWallInteriors,
];
