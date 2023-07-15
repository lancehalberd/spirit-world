import {
    BITMAP_BOTTOM_5,
    BITMAP_LEFT_5,
    BITMAP_RIGHT_5,
    BITMAP_TOP_6,
    BITMAP_TOP_7,
    orBitMasks,
} from 'app/content/bitMasks';
import {
    bottomCeilingBehavior,
    ceilingBehavior,
    southernWallBehavior,
} from 'app/content/tiles/constants';
import { requireImage } from 'app/utils/images';


const leftRailMask = BITMAP_LEFT_5;
const rightRailMask = BITMAP_RIGHT_5;
const topRailMask = BITMAP_TOP_7;
const bottomRailMask = BITMAP_BOTTOM_5;
const topAndLeftRailMask = orBitMasks(leftRailMask, topRailMask);
const topAndRightRailMask = orBitMasks(rightRailMask, topRailMask);
const bottomAndLeftRailMask = orBitMasks(leftRailMask, bottomRailMask);
const bottomAndRightRailMask = orBitMasks(rightRailMask, bottomRailMask);
const baseRailBehavior: TileBehaviors = { defaultLayer: 'field', low: true };


// Railings are 5px wide on the sides, 5 px tall on the south and 7px tall on the north
const stoneRailings1: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/stonebuildingtileset.png'), x: 0, y: 0, w: 256, h: 96},
    behaviors: {
        '0x0': { ...baseRailBehavior, solidMap: topAndLeftRailMask },
        '1x0': { ...baseRailBehavior, solidMap: topRailMask },
        '2x0': { ...baseRailBehavior, solidMap: topAndRightRailMask },
        '3x0': { ...baseRailBehavior, solidMap: rightRailMask },
        '5x0': { ...baseRailBehavior, solidMap: leftRailMask },
        '0x1': { ...baseRailBehavior, solidMap: leftRailMask },
        '2x1': { ...baseRailBehavior, solidMap: rightRailMask },
        '3x1': { ...baseRailBehavior, solidMap: rightRailMask },
        '5x1': { ...baseRailBehavior, solidMap: leftRailMask },
        '0x2': { ...baseRailBehavior, solidMap: bottomAndLeftRailMask },
        '1x2': { ...baseRailBehavior, solidMap: bottomRailMask },
        '2x2': { ...baseRailBehavior, solidMap: bottomAndRightRailMask },
        '4x2': southernWallBehavior,
        '5x2': southernWallBehavior,

    },
    tileCoordinates: [
        [ 0, 0],[ 1, 0],[ 2, 0],[ 3, 0],[ 4, 0],[ 5, 0],
        [ 0, 1],        [ 2, 1],[ 3, 1],[ 4, 1],[ 5, 1],
        [ 0, 2],[ 1, 2],[ 2, 2],        [ 4, 2],[ 5, 2],
    ],
};
const stoneRailings2: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/stonebuildingtileset.png'), x: 0, y: 0, w: 256, h: 96},
    behaviors: {
        '6x0': { ...baseRailBehavior, solidMap: topAndLeftRailMask },
        '7x0': { ...baseRailBehavior, solidMap: topRailMask },
        '8x0': { ...baseRailBehavior, solidMap: topRailMask },
        '9x0': { defaultLayer: 'floor2', ledges: {up: true} },
        '10x0': { ...baseRailBehavior, solidMap: topAndRightRailMask },

        '6x1': { defaultLayer: 'floor2', ledges: {left: true} },
        '10x1': { defaultLayer: 'floor2', ledges: {right: true} },

        '6x2': { ...baseRailBehavior, solidMap: leftRailMask },
        '10x2': { ...baseRailBehavior, solidMap: rightRailMask },
        '6x3': { ...baseRailBehavior, solidMap: leftRailMask },
        '10x3': { ...baseRailBehavior, solidMap: rightRailMask },

        '6x4': { ...baseRailBehavior, solidMap: bottomAndLeftRailMask },
        '7x4': { ...baseRailBehavior, solidMap: bottomRailMask },
        '8x4': { ...baseRailBehavior, solidMap: bottomRailMask },
        '9x4': { defaultLayer: 'floor2', ledges: {down: true} },
        '10x4': { ...baseRailBehavior, solidMap: bottomAndRightRailMask },

        '6x5': { defaultLayer: 'field', solidMap: BITMAP_TOP_6},
        '7x5': { defaultLayer: 'field', solidMap: BITMAP_TOP_6},
        '8x5': { defaultLayer: 'field', solidMap: BITMAP_TOP_6},
        '9x5': { defaultLayer: 'field', solidMap: BITMAP_TOP_6},

    },
    tileCoordinates: [
        [ 6, 0],[ 7, 0],[ 8, 0],[ 9, 0],[10, 0],
        [ 6, 1],                        [10, 1],
        [ 6, 2],                        [10, 2],
        [ 6, 3],                        [10, 3],
        [ 6, 4],[ 7, 4],[ 8, 4],[ 9, 4],[10, 4],
        [ 6, 5],[ 7, 5],[ 8, 5],[ 9, 5],
    ],
};


const stoneWallTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/stonebuildingtileset.png'), x: 0, y: 0, w: 256, h: 96},
    behaviors: {
        'all': { defaultLayer: 'field', solid: true },
        '5x5': { defaultLayer: 'field', solidMap: BITMAP_TOP_6},
    },
    tileCoordinates: [
        [ 0, 3],[ 1, 3],[ 2, 3],[ 3, 3],[ 4, 3],[ 5, 3],
        [ 0, 4],[ 1, 4],[ 2, 4],[ 3, 4],[ 4, 4],[ 5, 4],
        [ 0, 5],                [ 3, 5],[ 4, 5],[ 5, 5],
    ],
};

const stoneCeilingTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/stonebuildingtileset.png'), x: 0, y: 0, w: 256, h: 96},
    behaviors: {
        'all': ceilingBehavior,
        '11x0': bottomCeilingBehavior,
        '12x0': bottomCeilingBehavior,
        '13x0': bottomCeilingBehavior,
        '14x0': bottomCeilingBehavior,
        '15x0': bottomCeilingBehavior,
        '13x3': bottomCeilingBehavior,
        '14x3': bottomCeilingBehavior,
        '11x4': bottomCeilingBehavior,
        '12x4': bottomCeilingBehavior,
        '13x4': bottomCeilingBehavior,
        '13x1': southernWallBehavior,
        '14x1': southernWallBehavior,

    },
    tileCoordinates: [
        [11, 0],[12, 0],[13, 0],[14, 0],[15, 0],
        [11, 1],        [13, 1],[14, 1],
        [11, 2],[12, 2],                [15, 2],
        [11, 3],[12, 3],[13, 3],[14, 3],[15, 3],
        [11, 4],[12, 4],[13, 4],
        [11, 5],[12, 5],[13, 5],
    ],
};


export const allStoneExteriorTileSources: TileSource[] = [
    stoneWallTiles,
    stoneCeilingTiles,
    stoneRailings1,
    stoneRailings2,
];
