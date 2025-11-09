import {applyNineSlice, slices} from 'app/generator/nineSlice';
import {applyCaveWalls} from 'app/generator/styles/cave';
import {createStoneFloor, createSpecialStoneFloor} from 'app/generator/styles/stone';
import {getOrAddLayer} from 'app/utils/layers';


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

function stampGenerator(stamp: Stamp) {
    return {
        minW: stamp.w,
        minH: stamp.h,
        maxW: stamp.w,
        maxH: stamp.h,
        generate(random: SRandom, area: AreaDefinition, r: Rect, alternateArea: AreaDefinition) {
            for (const layerKey of Object.keys(stamp.layers)) {
                const layer = getOrAddLayer(layerKey, area, alternateArea);
                for (let y = r.y; y < r.y + stamp.h; y++) {
                    if (y >= layer.grid.h) {
                        break;
                    }
                    for (let x = r.x; x < r.x + stamp.w; x++) {
                        const stampTile = stamp.layers[layerKey][y - r.y][x - r.x];
                        if (stampTile === undefined) {
                            continue;
                        }
                        if (x >= layer.grid.w) {
                            break;
                        }
                        if (!layer.grid.tiles[y]) {
                            layer.grid.tiles[y] = [];
                        }
                        layer.grid.tiles[y][x] = stampTile;
                    }
                }
            }
        },
    }
}

export const chunkGenerators: {[key: string]: ChunkGenerator} = {
    clear: {
        generate(random: SRandom, area: AreaDefinition, r: Rect, alternateArea: AreaDefinition) {
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
    },
};

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

const smallTreeStamp = {
    w: 2, h: 2, layers: {
        field: [[0, 0], [205, 206]],
        foreground: [[207, 208], [209, 210]],
        behaviors: [[314, 314], [0, 0]],
    },
};slices
chunkGenerators.smallTree = stampGenerator(smallTreeStamp);


interface Stamp {
    w: number
    h: number
    layers: {
        [key: string]: (number|undefined)[][]
    }
}

