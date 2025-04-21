import {
    BITMAP_BOTTOM_LEFT_8, BITMAP_BOTTOM_RIGHT_8,
} from 'app/content/bitMasks';
import {
    southernWallBehavior,
    topRightWall,
    topLeftWall,
    bottomLeftWall,
    bottomRightWall,
} from 'app/content/tiles/constants';


import { requireFrame } from 'app/utils/packedImages';

const vanaraHoleyTile: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vanara.png', {x: 0, y: 0, w: 208, h: 336}),
    behaviors: {
        'all': { defaultLayer: 'floor'},
    },
    tileCoordinates: [
       [1,1],        [9,1],[10,1],             [13,1],[14,1],[15,1],
                [8,2],           [11,2],       [13,2],[14,2],[15,2],
                [8,3],           [11,3],       [13,3],[14,3],[15,3],
                     [9,4],[10,4] 
    ],
}

const vanaraCeilingTrim: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vanara.png', {x: 0, y: 0, w: 208, h: 336}),
    behaviors: {
        'all': {defaultLayer: 'foreground2'},
        '1x6': {defaultLayer: 'foreground2', solidMap: BITMAP_BOTTOM_LEFT_8},
        '3x6': {defaultLayer: 'foreground2', solidMap: BITMAP_BOTTOM_RIGHT_8},
    },
    tileCoordinates: [
               [1,3], [2,3],[3, 3],
        [0,4], [1,4],       [3, 4],[4, 4],
        [0,5],                     [4, 5],
        [0,6],[1, 6],       [3, 6],[4, 6],
              [1, 7],[2,7], [3, 7],
    ],
}

const vanaraWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vanara.png', {x: 0, y: 0, w: 208, h: 336}),
    behaviors: {
        'all': southernWallBehavior,
        '3x8': bottomRightWall, '4x8': bottomLeftWall,
        '3x11': topLeftWall, '4x11': topRightWall,
        '6x8': bottomRightWall, '7x8': bottomLeftWall,
    },
    tileCoordinates: [
        [1,8],      [3, 8],[4, 8],     [6,8],[7,8],
        [1,9],      [3, 9],[4, 9],
        [1,10],     [3,10],[4,10],
                    [3,11],[4,11]
    ],
}

const vanaraStairs: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vanara.png', {x: 0, y: 0, w: 208, h: 336}),
    behaviors: {
        'all': { defaultLayer: 'field' },
    },
    tileCoordinates: [
        [1, 16], [2, 16], [3, 16],
        [1, 17], [2, 17], [3, 17],
        [1, 18], [2, 18], [3, 18],
        [1, 19], [2, 19], [3, 19],
        [1, 20], [2, 20], [3, 20],
    ],
}

export const allVanaraTileSources: TileSource[] = [
    vanaraHoleyTile,
    vanaraCeilingTrim,
    vanaraStairs,
    vanaraWalls
];
