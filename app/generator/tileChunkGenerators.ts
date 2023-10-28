import { applyNineSlice, slices } from 'app/generator/nineSlice';
import { applyCaveWalls } from 'app/generator/styles/cave';
import { createStoneFloor, createSpecialStoneFloor } from 'app/generator/styles/stone';


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
chunkGenerators.caveWalls = applyCaveWalls;
chunkGenerators.stoneFloor = createStoneFloor;
chunkGenerators.specialStoneFloor = createSpecialStoneFloor;
