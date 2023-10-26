import { applyNineSlice, slices } from 'app/generator/nineSlice';
import { getOrAddLayer } from 'app/utils/layers';
import { allTiles } from 'app/content/tiles';


type ChunkGenerator = (random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) => void

function combinedGenerator(generators: ChunkGenerator[]): ChunkGenerator {
    return function(random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) {
        for (const generator of generators) {
            random.generateAndMutate();
            generator(random, area, r, alternateArea);
        }
    }
}

export const chunkGenerators: {[key: string]: ChunkGenerator} = {
    clear(random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) {
        for (const layer of area.layers) {
            for (let y = r.y; y < r.y + r.h; y++) {
                if (y >= layer.grid.h) {
                    break;
                }
                for (let x = r.x; x < r.x + r.w; x++) {
                    if (x >= layer.grid.w) {
                        break;
                    }
                    if (!layer.grid.tiles[y]) {
                        layer.grid.tiles[y] = [];
                    }
                    layer.grid.tiles[y][x] = 0;
                }
            }
        }
    }
};

for (const key of Object.keys(slices)) {
    chunkGenerators[`slices-${key}`] = (random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) => {
        applyNineSlice(random, slices[key], r, area, alternateArea);
    };
}
chunkGenerators.stoneRoom = combinedGenerator([chunkGenerators[`slices-outerStoneWalls`], createStoneFloor]);


const singleStoneTiles = [1237, 1238];
const doubleStoneTiles = [1239, 1240];
const emptyStoneTile = 1217;
const fancyStoneTile = 1216;
const fancierStoneTile = 1215;
const fanciestStoneTile = 1214;


function createStoneFloor(random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) {
    const floorLayer = getOrAddLayer('floor', area, alternateArea);
    const tiles = floorLayer.grid.tiles;
    for (let y = 0; y < r.h; y++) {
        const tY = r.y + y;
        if (tY >= floorLayer.grid.h) {
            break;
        }
        if (!tiles[tY]) {
            tiles[tY] = [];
        }
        for (let x = 0; x < r.w; x++) {
            const tX = r.x + x;
            if (tX >= floorLayer.grid.w) {
                break;
            }
            if (x < r.w - 1 && (x % 2 === y % 2) && random.generateAndMutate() < 0.2 * (y % 3 + 2)) {
                tiles[tY][tX]  = doubleStoneTiles[0];
                tiles[tY][tX + 1] = doubleStoneTiles[1];
                x++;
            } else if (random.generateAndMutate() < 0.3) {
                tiles[tY][tX] = emptyStoneTile;
            } else {
                tiles[tY][tX] = random.element(singleStoneTiles);
                random.generateAndMutate()
            }
        }
    }
}
export function createSpecialStoneFloor(random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) {
    const floorLayer = getOrAddLayer('floor', area, alternateArea);
    const tiles = floorLayer.grid.tiles;
    for (let y = 0; y < r.h; y++) {
        const tY = r.y + y;
        if (tY >= floorLayer.grid.h) {
            break;
        }
        if (!tiles[tY]) {
            tiles[tY] = [];
        }
        for (let x = 0; x < r.w; x++) {
            const tX = r.x + x;
            if (tX >= floorLayer.grid.w) {
                break;
            }
            const isOutsideRow = y === 0 || y === r.h - 1;
            const isOutsideColumn = x === 0 || x === r.w - 1;
            if (isOutsideRow && isOutsideColumn) {
                tiles[tY][tX] = fancyStoneTile;
            } else if (isOutsideRow || isOutsideColumn) {
                tiles[tY][tX] = fancierStoneTile;
            } else {
                tiles[tY][tX] = fanciestStoneTile;
            }
        }
    }
}


// Adds cave walls everywhere that is currently solid in the field layer.
// This assumes cave wall height is 2, but this could be generalized to support taller cave walls.
export function applyCaveWalls(random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) {
    const fieldLayer = getOrAddLayer('field', area, alternateArea);
    const foregroundLayer = getOrAddLayer('foreground', area, alternateArea);
    const foreground2Layer = getOrAddLayer('foreground2', area, alternateArea);
    const fieldTiles = fieldLayer.grid.tiles;
    const foregroundTiles = foregroundLayer.grid.tiles;
    const foreground2Tiles = foreground2Layer.grid.tiles;
    // Limit the rectangle to the bounds of the area.
    const x =  Math.max(0, r.x), y = Math.max(0, r.y);
    r = {
        x, y,
        w: Math.min(r.w, fieldLayer.grid.w - x),
        h: Math.min(r.h, fieldLayer.grid.h - y),
    };
    const solidChunks: {v: {top: number, bottom: number}, h: {left: number, right: number}}[][] = [];
    for (let y = r.y; y < r.y + r.h; y++) {
        solidChunks[y] = [];
        if (!fieldTiles[y]) {
            debugger;
        }
        for (let x = r.x; x < r.x + r.w; x++) {
            const fieldTile = allTiles[fieldTiles[y][x]];
            if (!fieldTile?.behaviors?.solid) {
                continue;
            }
            const v = solidChunks[y - 1]?.[x]?.v || {top: y, bottom: y + 1};
            const h = solidChunks[y][x - 1]?.h || {left: x, right: x + 1};
            v.bottom = y + 1;
            h.right = x + 1;
            // Chunks that go off the edge of the box are assumed to be solid indefinitely, so extend the range by 10.
            if (v.top === r.y) {
                v.top -= 10;
            }
            if (v.bottom === r.y + r.h) {
                v.bottom += 10;
            }
            if (h.left === r.x) {
                h.left -= 10;
            }
            if (h.right === r.x + r.w) {
                h.right += 10;
            }
            solidChunks[y][x] = {v, h}
        }
    }
    for (let i = 0; i < 10; i++) {
        let changed = false;
        for (let y = r.y; y < r.y + r.h; y++) {
            for (let x = r.x; x < r.x + r.w; x++) {
                if (!solidChunks[y][x]) {
                    continue;
                }
                const {v, h} = solidChunks[y][x];
                if (v.bottom - v.top >= 4 && h.right - h.left >= 2) {
                    continue;
                }
                // Split the vertical chunk into two pieces.
                // Create a new chunk for any pieces left above.
                const top = Math.max(v.top, r.y);
                if (y > top) {
                    const newV = {...v, bottom: y};
                    for (let j = top; j < y; j++) {
                        solidChunks[j][x].v = newV;
                    }
                }
                // Update the existing chunk for piece below
                v.top = y + 1;
                // Split the horizontal chunk into two pieces.
                const left = Math.max(h.left, r.x);
                if (x > left) {
                    const newH = {...h, right: x};
                    for (let j = left; j < x; j++) {
                        solidChunks[y][j].h = newH;
                    }
                }
                h.left = x + 1;

                // Place a single tile wall here, we cannot tile this with walls.
                fieldTiles[y][x] = 10;
                // This tile is no longer part of any solid chunks.
                delete solidChunks[y][x];
                changed = true;
            }
        }
        if (!changed) {
            break;
        }
    }
    for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
            if (!solidChunks[y][x]) {
                continue;
            }
            fieldTiles[y][x] = 0;
            const parity = (x + y) % 2
            const {v, h} = solidChunks[y][x];
            if (y === v.top) {
                // Northern facing wall
                if (x === h.left) {
                    foreground2Tiles[y][x] = [748, 749][parity];
                } else if (x === h.right - 1) {
                    foreground2Tiles[y][x] = [746, 747][parity];
                } else {
                    foregroundTiles[y][x] = 57;
                    // This row should always be defined since rows beyond the range would be assumed solid (and this is the top of the chunk).
                    foreground2Tiles[y - 1][x] = [744, 745][(parity + 1) % 2];
                }
            } else if (y === v.bottom - 1) {
                // Bottom part of south wall
                if (x === h.left) {
                    fieldTiles[y][x] = [771, 772][parity];
                } else if (x === h.right - 1) {
                    fieldTiles[y][x] = [773, 774][parity];
                } else {
                    fieldTiles[y][x] = [762, 763][parity];
                }
            } else if (y === v.bottom - 2) {
                // Upper part of south wall
                if (x === h.left) {
                    fieldTiles[y][x] = [765, 768][parity];
                } else if (x === h.right - 1) {
                    fieldTiles[y][x] = [766, 769][parity];
                } else {
                    // TODO: detect left/right edges 1 tile below this tile and use interior diagonals instead here.
                    fieldTiles[y][x] = [753, 754][parity];
                }
            } else if (y === v.bottom - 3) {
                // Ceiling above south wall
                foregroundTiles[y][x] = 57;
                if (x === h.left) {
                    foreground2Tiles[y][x] = [882, 883][parity];
                } else if (x === h.right - 1) {
                    foreground2Tiles[y][x] = [884, 885][parity];
                } else {
                    // TODO: detect left/right edges 2 tiles below this tile and use interior diagonals instead here.
                    foreground2Tiles[y][x] = [732, 733][parity];
                }
            } else {
                // Vertical interior.
                foregroundTiles[y][x] = 57;
                if (x === h.left) {
                    foreground2Tiles[y][x] = [736, 740][parity];
                } else if (x === h.right - 1) {
                    foreground2Tiles[y][x] = [737, 741][parity];
                } else {
                    // detect left/right edges 1 or 2 tiles below and add edges here.
                }
            }
        }
    }
}

chunkGenerators.caveWalls = applyCaveWalls;
chunkGenerators.stoneFloor = createStoneFloor;
chunkGenerators.specialStoneFloor = createSpecialStoneFloor;

/*interface DungeonGenerationRules {
    entranceIds: string[]
    world: 'spirit'|'material'|'hybrid'
    size?: number
    enemyTypes?: EnemyType[]
    bossTypes?: BossType[]

}*/
