import {getOrAddLayer} from 'app/utils/layers';
import {allTiles} from 'app/content/tiles';
import {renderTileFrame} from 'app/development/renderEditor';

export function stampGenerator(stamp: Stamp) {
    return {
        minW: stamp.w,
        minH: stamp.h,
        maxW: stamp.w,
        maxH: stamp.h,
        generate(random: SRandom, area: AreaDefinition, r: Rect, alternateArea: AreaDefinition) {
            for (const layerKey of Object.keys(stamp.layers)) {
                const layer = getOrAddLayer(layerKey, area, alternateArea);
                for (let y = r.y; y < r.y + stamp.h; y++) {
                    if (y < 0) {
                        continue;
                    }
                    if (y >= layer.grid.h) {
                        break;
                    }
                    for (let x = r.x; x < r.x + stamp.w; x++) {
                        const stampTile = stamp.layers[layerKey][y - r.y][x - r.x];
                        if (stampTile === undefined) {
                            continue;
                        }
                        if (x < 0) {
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
        renderPreview(context: CanvasRenderingContext2D, random: SRandom, area: AreaInstance, r: Rect, alternateArea: AreaInstance) {
            for (const layerKey of Object.keys(stamp.layers)) {
                for (let y = r.y; y < r.y + stamp.h; y++) {
                    for (let x = r.x; x < r.x + stamp.w; x++) {
                        const tile = allTiles[stamp.layers[layerKey][y - r.y][x - r.x]];
                        if (tile) {
                            renderTileFrame(tile, 0, context, {x: x * 16, y: y * 16, w: 16, h: 16});
                        }
                    }
                }
            }
        },
    }
}
