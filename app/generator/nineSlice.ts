import { fillGrid } from 'app/utils/index';
import { getOrAddLayer } from 'app/utils/layers';

// const floor2Tiles = [793, 796, 797, 799, 800];

export function applyNineSlice(random: SRandom, slice: NineSlice, r: Rect, area: AreaDefinition, alternateArea: AreaDefinition): void {
    // Height of bottom slice
    const B = slice.h - (slice.r.y + slice.r.h);
    // Width of right slice
    const R = slice.w - (slice.r.x + slice.r.w);
    for (const sliceLayer of slice.layers) {
        const areaLayer = getOrAddLayer(sliceLayer.key, area, alternateArea);
        // If the alternate area is the spirit world, then we will automatically erase the tiles changed so that
        // the new tiles will be inherited by the spirit world.
        const alternateAreaLayer = alternateArea?.isSpiritWorld && getOrAddLayer(sliceLayer.key, alternateArea, area);
        // Top
        for (let y = 0; y < r.h; y++) {
            const tY = r.y + y;
            if (tY >= areaLayer.grid.h) {
                break;
            }
            const sourceY = (y < slice.r.y)
                // Top slice
                ? y
                : (B >= r.h - y)
                    // Bottom slice
                    ? slice.r.y + slice.r.h + y - (r.h - B)
                    // Middle slice (repeats tile pattern)
                    : (y - slice.r.y) % slice.r.h + slice.r.y;
            for (let x = 0; x < r.w; x++) {
                const tX = r.x + x;
                if (tX >= areaLayer.grid.w) {
                    break;
                }
                const sourceX = (x < slice.r.x)
                    // Left slice
                    ? x
                    : (R >= r.w - x)
                        // Right slice slice
                        ? slice.r.x + slice.r.w + x - (r.w - R)
                        // Middle slice (repeats tile pattern)
                        : (x - slice.r.x) % slice.r.w + slice.r.x;
                try {
                    if (!areaLayer.grid.tiles[tY]) {
                        areaLayer.grid.tiles[tY] = [];
                    }
                    areaLayer.grid.tiles[tY][tX] = sliceLayer.grid[sourceY][sourceX];
                    if (alternateAreaLayer?.grid) {
                        if (!alternateAreaLayer.grid.tiles[tY]) {
                            alternateAreaLayer.grid.tiles[tY] = [];
                        }
                        alternateAreaLayer.grid.tiles[tY][tX] = 0;
                    }
                } catch (e) {
                    debugger;
                }
            }
        }
    }
}

export const caveRoom: NineSlice = {
    w: 6, h: 8,
    r: {x: 2, y: 4, w : 2, h : 2},
    layers: [
        {
            key: 'floor',
            grid: fillGrid(36, 6, 8),
        },
        {
            key: 'field',
            grid: [
                [0,  0,  0,  0,  0,0],
                [0,  0,753,754,  0,0],
                [0,764,762,763,764,0],
                [0,773,  0,  0,772,0],
                [0,  0,  0,  0,  0,0],
                [0,  0,  0,  0,  0,0],
                [0,  0,  0,  0,  0,0],
                [0,  0,  0,  0,  0,0],
            ]
        },
        {
            key: 'foreground',
            grid: [
                [57,57,57,57,57,57],
                [57,57, 0, 0,57,57],
                [57, 0, 0, 0, 0,57],
                [57, 0, 0, 0, 0,57],
                [57, 0, 0, 0, 0,57],
                [57, 0, 0, 0, 0,57],
                [57, 0, 0, 0, 0,57],
                [57,28,28,28,28,57],
            ]
        },
        {
            key: 'foreground2',
            grid: [
                [  0,  0,732,733,  0,  0],
                [  0,884,  0,  0,883,  0],
                [737,  0,  0,  0,  0,736],
                [741,  0,  0,  0,  0,740],
                [737,  0,  0,  0,  0,736],
                [741,  0,  0,  0,  0,740],
                [  0,746,744,745,749,  0],
                [  0,  0,  0,  0,  0,  0],
            ]
        }
    ]
};

export const outerStoneWalls: NineSlice = {
    w: 6, h: 8,
    r: {x: 2, y: 4, w : 2, h : 2},
    layers: [
        {
            key: 'field',
            grid: [
                [0,  0,  0,  0,  0,0],
                [0,1203,1204,1203,1204,0],
                [0,1204,1203,1204,1203,0],
                [0,  0,  0,  0,  0,0],
                [0,  0,  0,  0,  0,0],
                [0,  0,  0,  0,  0,0],
                [0,  0,  0,  0,  0,0],
                [0,  0,  0,  0,  0,0],
            ]
        },
        {
            key: 'field2',
            grid: [
                [0,0,0,0,0,0],
                [700,695, 0, 0, 692,703],
                [700,703, 0, 0, 700,703],
                [700,703, 0, 0, 700,703],
                [700,703, 0, 0, 700,703],
                [700,703, 0, 0, 700,703],
                [700,703, 0, 0, 700,703],
                [0,0,0,0,0,0],
            ]
        },
        {
            key: 'foreground2',
            grid: [
                [1172,1163,1163,1163,1163,1171],
                [1162,   0,   0,   0,   0,1162],
                [1162,   0,   0,   0,   0,1162],
                [1162,   0,   0,   0,   0,1162],
                [1162,   0,   0,   0,   0,1162],
                [1162,   0,   0,   0,   0,1162],
                [1162,   0,   0,   0,   0,1162],
                [1168,1163,1163,1163,1163,1167],
            ]
        }
    ]
};


export const innerStoneWalls: NineSlice = {
    w: 6, h: 5,
    r: {x: 2, y: 1, w : 2, h : 1},
    layers: [
        {
            key: 'field',
            grid: [
                [0,   0,   0,   0,   0,0],
                [0,   0,   0,   0,   0,0],
                [0,   0,   0,   0,   0,0],
                [0,1203,1204,1203,1204,0],
                [0,1204,1203,1204,1203,0],
            ]
        },
        {
            key: 'field2',
            grid: [
                [688,0,0, 0, 0,691],
                [700,0,0, 0, 0,703],
                [700,0,0, 0, 0,703],
                [700,0,0, 0, 0,703],
                [708,0,0, 0, 0,709],
            ]
        },
        {
            key: 'foreground2',
            grid: [
                [   0,1172,1163,1163,1171,   0],
                [   0,1162,  57,  57,1162,   0],
                [   0,1168,1163,1163,1167,   0],
                [   0,   0,   0,   0,   0,   0],
                [   0,   0,   0,   0,   0,   0],
            ]
        }
    ]
};

export const stonePlatform: NineSlice = {
    w: 5, h: 3,
    r: {x: 2, y: 1, w : 1, h : 1},
    layers: [
        {
            key: 'floor2',
            grid: [
                [0,652,653,654,0],
                [0,655,  0,656,0],
                [0,657,658,659,0],
            ]
        },
        {
            key: 'field',
            grid: [
                [0,1241,1242,1243,0],
                [0,1244,   0,1245,0],
                [0,1246,1247,1248,0],
            ]
        },
        {
            key: 'field2',
            grid: [
                [692,0,0,0,695],
                [700,0,0,0,703],
                [700,0,0,0,703],
            ]
        },
    ]
};

export const slices = {
    caveRoom,
    outerStoneWalls,
    innerStoneWalls,
    stonePlatform,
};
