
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
