import { applyNineSlice, slices } from 'app/generator/nineSlice';
import { getOrAddLayer } from 'app/utils/layers';


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
function createSpecialStoneFloor(random: SRandom, area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) {
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
chunkGenerators.stoneFloor = createStoneFloor;

chunkGenerators.specialStoneFloor = createSpecialStoneFloor;

/*interface DungeonGenerationRules {
    entranceIds: string[]
    world: 'spirit'|'material'|'hybrid'
    size?: number
    enemyTypes?: EnemyType[]
    bossTypes?: BossType[]

}*/
