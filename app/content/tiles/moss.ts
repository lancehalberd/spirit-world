import {requireFrame} from 'app/utils/packedImages';

const greenFloor: TileBehaviors = {defaultLayer: 'floor', linkedOffset: 45};
const greenFloor2: TileBehaviors = {defaultLayer: 'floor2', linkedOffset: 45, isGround: false};
const purpleFloor: TileBehaviors = {defaultLayer: 'floor', linkedOffset: -45};
const purpleFloor2: TileBehaviors = {defaultLayer: 'floor2', linkedOffset: -45, isGround: false};

const greenConvexTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/moss.png', {x: 0, y: 16, w: 80, h: 80}),
    behaviors: {
        'all': greenFloor2,
        '1x1': greenFloor,
        '2x1': greenFloor,
        '3x1': greenFloor,
        '1x2': greenFloor,
        '2x2': greenFloor,
        '3x2': greenFloor,
        '1x3': greenFloor,
        '2x3': greenFloor,
        '3x4': greenFloor,
    },
};

const greenInteriorCornerTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/moss.png', {x: 96, y: 32, w: 48, h: 48}),
    behaviors: {
        'all': greenFloor2,
    },
    tileCoordinates: [
        [0, 0],[2, 0],
        [0, 2],[2, 2],
    ],
};

const greenAngledTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/moss.png', {x: 192, y: 16, w: 80, h: 80}),
    behaviors: {
        'all': greenFloor2,
        '0x0': greenFloor,
        '4x0': greenFloor,
        '0x4': greenFloor,
        '4x4': greenFloor,
    },
    tileCoordinates: [
        [0, 0],[1, 0],[3, 0],[4, 0],
        [0, 1],[1, 1],[3, 1],[4, 1],
        [0, 3],[1, 3],[3, 3],[4, 3],
        [0, 4],[1, 4],[3, 4],[4, 4],
    ],
};

const purpleConvexTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/moss.png', {x: 304, y: 16, w: 80, h: 80}),
    behaviors: {
        'all': purpleFloor2,
        '1x1': purpleFloor,
        '2x1': purpleFloor,
        '3x1': purpleFloor,
        '1x2': purpleFloor,
        '2x2': purpleFloor,
        '3x2': purpleFloor,
        '1x3': purpleFloor,
        '2x3': purpleFloor,
        '3x4': purpleFloor,
    },
};

const purpleInteriorCornerTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/moss.png', {x: 400, y: 32, w: 48, h: 48}),
    behaviors: {
        'all': purpleFloor2,
    },
    tileCoordinates: [
        [0, 0],[2, 0],
        [0, 2],[2, 2],
    ],
};

const purpleAngledTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/moss.png', {x: 496, y: 16, w: 80, h: 80}),
    behaviors: {
        'all': purpleFloor2,
        '0x0': purpleFloor,
        '4x0': purpleFloor,
        '0x4': purpleFloor,
        '4x4': purpleFloor,
    },
    tileCoordinates: [
        [0, 0],[1, 0],[3, 0],[4, 0],
        [0, 1],[1, 1],[3, 1],[4, 1],
        [0, 3],[1, 3],[3, 3],[4, 3],
        [0, 4],[1, 4],[3, 4],[4, 4],
    ],
};

export const allMossTiles: TileSource[] = [
    greenConvexTiles,
    greenInteriorCornerTiles,
    greenAngledTiles,
    purpleConvexTiles,
    purpleInteriorCornerTiles,
    purpleAngledTiles,
];
