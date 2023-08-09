import { applyNineSlice, slices } from 'app/generator/nineSlice';


type ChunkGenerator = (area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) => void

export const chunkGenerators: {[key: string]: ChunkGenerator} = {
    clear(area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) {
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
    chunkGenerators[`slices-${key}`] = (area: AreaDefinition, r: Rect, alternateArea?: AreaDefinition) => {
        applyNineSlice(area,r, slices[key], alternateArea);
    };
}
