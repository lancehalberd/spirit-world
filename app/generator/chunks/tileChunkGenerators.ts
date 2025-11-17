import {applyNineSlice, slices} from 'app/generator/nineSlice';
import {applyCaveWalls} from 'app/generator/styles/cave';
import {createStoneFloor, createSpecialStoneFloor} from 'app/generator/styles/stone';
import {chunkGenerators} from 'app/generator/chunks/tileChunkGeneratorHash';
export {chunkGenerators} from 'app/generator/chunks/tileChunkGeneratorHash';

export * from 'app/generator/chunks/trees';


function combinedGenerator(generators: ChunkGenerator[]): ChunkGenerator {
    const newGenerator: ChunkGenerator = {
        generate(random: SRandom, area: AreaDefinition, r: Rect, alternateArea: AreaDefinition) {
            for (const generator of generators) {
                random.generateAndMutate();
                generator.generate(random, area, r, alternateArea);
            }
        }
    }
    for (const generator of generators) {
        if (generator.minW) {
            newGenerator.minW = Math.max(generator.minW, newGenerator.minW ?? 0);
        }
        if (generator.minH) {
            newGenerator.minH = Math.max(generator.minH, newGenerator.minH ?? 0);
        }
        if (generator.maxW) {
            newGenerator.maxW = Math.min(generator.maxW, newGenerator.maxW ?? 1000);
        }
        if (generator.maxH) {
            newGenerator.maxH = Math.min(generator.maxH, newGenerator.maxH ?? 1000);
        }
    }
    return newGenerator;
}

for (const key of Object.keys(slices) as (keyof typeof slices)[]) {
    const slice = slices[key];
    chunkGenerators[`slices-${key}`] = {
        minW: slice.w,
        minH: slice.h,
        generate(random: SRandom, area: AreaDefinition, r: Rect, alternateArea: AreaDefinition) {
            applyNineSlice(random, slice, r, area, alternateArea);
        },
    };
}
chunkGenerators.stoneFloor = {
    generate: createStoneFloor,
};
chunkGenerators.stoneRoom = combinedGenerator([chunkGenerators[`slices-outerStoneWalls`], chunkGenerators.stoneFloor]);
chunkGenerators.caveWalls = {
    generate: applyCaveWalls
};
chunkGenerators.specialStoneFloor = {
    minW: 3,
    minH: 3,
    generate: createSpecialStoneFloor
};


