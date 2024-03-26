import {
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
} from 'app/content/bitMasks';
import { 
    southernWallBehavior,
    topRightWall,
    topLeftWall,
} from 'app/content/tiles/constants';
import { requireFrame } from 'app/utils/packedImages';

const obsidianImage = 'gfx/tiles/obsidianCliffs.png';


const obsidianWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(obsidianImage, {x: 0, y: 144, w: 48, h: 48}),
    behaviors: {
        'all': southernWallBehavior,
    },
};

const obsidianAngledWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame(obsidianImage, {x: 64, y: 144, w: 64, h: 48}),
    behaviors: {
        'all': southernWallBehavior,
        '0x2': topRightWall, '1x2': topLeftWall, '2x2': topRightWall, '3x2': topLeftWall,
    },
};

const obsidianStairs: TileSource = {
    w: 16, h: 16,
    source: requireFrame(obsidianImage, {x: 144, y: 48, w: 48, h: 80}),
    behaviors: {
        'all': { defaultLayer: 'field' },
    },
};

let defaultLayer: DefaultLayer = 'field';
const obsidianLedges: TileSource = {
    w: 16, h: 16,
    source: requireFrame(obsidianImage, {x: 0, y: 48, w: 128, h: 96}),
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
    source: requireFrame(obsidianImage, {x: 64, y: 192, w: 32, h: 32}),
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
    source: requireFrame(obsidianImage, {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        '1x1': { defaultLayer: 'floor' },
    },
    tileCoordinates: [
        [0, 0],[1, 0],[2, 0], [4, 0], [5, 0],
        [0, 1],[1, 1],[2, 1],
        [0, 2],[1, 2],[2, 2], [4, 2], [5, 2],
    ],
};


export const allObsidianTileSources: TileSource[] = [
    obsidianWalls,
    obsidianAngledWalls,
    obsidianFloor,
    obsidianLedges,
    obsidianLedgeBits,
    obsidianStairs,
];
