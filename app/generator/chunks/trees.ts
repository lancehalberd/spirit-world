import {getOrAddLayer} from 'app/utils/layers';
import {allTiles} from 'app/content/tiles';
import {renderTileFrame} from 'app/development/renderEditor';
import {stampGenerator} from 'app/generator/chunks/stampGenerator';
import {chunkGenerators} from 'app/generator/chunks/tileChunkGeneratorHash';
import {typedKeys} from 'app/utils/types'


const smallTreeStamp = {
    w: 2, h: 2, layers: {
        field: [[0, 0], [205, 206]],
        foreground: [[207, 208], [209, 210]],
        behaviors: [[314, 314], [0, 0]],
    },
};
chunkGenerators.smallTree = stampGenerator(smallTreeStamp);

const largeTreeLayers = {
    field: [
        [],
        [],
        [,505,506,507,508,],
        [,509,510,511,512,],
        [,513,514,515,516,]
    ],
    foreground: [
        [,517,518,519,520,],
        [521,522,523,524,525,526],
        [527,528,529,530,531,532],
        [533,534,535,536,537,538],
        [,,539,540,,],
    ],
};
// There are a few special merged tiles for certain combinations base leaf tiles.
// Each row in this array, the first two tiles can combine to create the third tile.
const largeTreeMergeTiles = [
    [521, 525, 543],
    [522, 526, 544],
    [527, 531, 545],
    [528, 532, 546],
    [533, 537, 547],
    [534, 538, 548],
    [521, 526, 549],
    [527, 532, 550],
    [533, 538, 551],
];
function getComboTile(currentTile: number, newTile: number): number|undefined {
    for (const [A, B, combo] of largeTreeMergeTiles) {
        if (
            newTile === A && (currentTile === B || currentTile === combo) ||
            newTile === B && (currentTile === A || currentTile === combo)
        ) {
            return combo;
        }
    }
}
// Lower index tiles appear in front of higher index tiles when the tiles overlap and cannot merge.
const largeTreeTilePriority = [
    517,518,519,520,
    521,522,523,524,525,543,544,549,
    526,527,528,529,530,531,532,545,546,550,
    533,534,535,536,537,538,547,548,551,
    539,540,
];
chunkGenerators.largeTree = {
    minW: 6, maxW: 6,
    minH: 5, maxH: 5,
    generate(random: SRandom, area: AreaDefinition, r: Rect, alternateArea: AreaDefinition) {
        const fieldLayer = getOrAddLayer('field', area, alternateArea);
        for (let y = r.y; y < r.y + r.h; y++) {
            if (y < 0) {
                continue;
            }
            if (y >= fieldLayer.grid.h) {
                break;
            }
            for (let x = r.x; x < r.x + r.w; x++) {
                if (x < 0) {
                    continue;
                }
                if (x >= fieldLayer.grid.w) {
                    break;
                }
                const tileIndex = largeTreeLayers.field[y - r.y][x - r.x];
                if (tileIndex === undefined) {
                    continue;
                }
                if (!fieldLayer.grid.tiles[y]) {
                    fieldLayer.grid.tiles[y] = [];
                }
                fieldLayer.grid.tiles[y][x] = tileIndex;
            }
        }
        const foregroundLayer = getOrAddLayer('foreground', area, alternateArea);
        for (let y = r.y; y < r.y + r.h; y++) {
            if (y < 0) {
                continue;
            }
            if (y >= foregroundLayer.grid.h) {
                break;
            }
            for (let x = r.x; x < r.x + r.w; x++) {
                if (x < 0) {
                    continue;
                }
                if (x >= foregroundLayer.grid.w) {
                    break;
                }
                let newTile = largeTreeLayers.foreground[y - r.y][x - r.x];
                if (newTile === undefined) {
                    continue;
                }
                if (!foregroundLayer.grid.tiles[y]) {
                    foregroundLayer.grid.tiles[y] = [];
                }
                let currentTile = foregroundLayer.grid.tiles[y][x];
                // Handle the simple case first, nothing is in the foreground layer, just
                // apply the new tile there.
                if (!currentTile || currentTile === newTile) {
                    foregroundLayer.grid.tiles[y][x] = newTile;
                    continue;
                }

                let comboTile = getComboTile(currentTile, newTile);
                if (comboTile) {
                    foregroundLayer.grid.tiles[y][x] = comboTile;
                    continue;
                }
                let currentTilePriority = largeTreeTilePriority.indexOf(currentTile);
                let newTilePriority = largeTreeTilePriority.indexOf(newTile);
                if (currentTilePriority >= 0 && newTilePriority > currentTilePriority) {
                    // The old tile is on top of the new tile, so just swap them and then continue on
                    // as if we are now applying the old tile.
                    foregroundLayer.grid.tiles[y][x] = newTile;
                    newTile = currentTile;
                    currentTile = foregroundLayer.grid.tiles[y][x];
                }

                // The foreground layer is occupied. We will either place this tile on foreground2,
                // or move the existing tile to foreground2 and place this tile underneath on the foreground.
                const foreground2Layer = getOrAddLayer('foreground2', area, alternateArea);

                if (!foreground2Layer.grid.tiles[y]) {
                    foreground2Layer.grid.tiles[y] = [];
                }
                currentTile = foreground2Layer.grid.tiles[y][x];
                if (!currentTile || currentTile === newTile) {
                    foreground2Layer.grid.tiles[y][x] = newTile;
                    continue;
                }
                comboTile = getComboTile(currentTile, newTile);
                if (comboTile) {
                    foreground2Layer.grid.tiles[y][x] = comboTile;
                    continue;
                }
                currentTilePriority = largeTreeTilePriority.indexOf(currentTile);
                newTilePriority = largeTreeTilePriority.indexOf(newTile)
                if (currentTilePriority >= 0 && newTilePriority > currentTilePriority) {
                    // The old tile is on top of the new tile, so just swap them and then continue on
                    // as if we are now applying the old tile.
                    foreground2Layer.grid.tiles[y][x] = newTile;
                    newTile = currentTile;
                    currentTile = foreground2Layer.grid.tiles[y][x];
                }
                const foreground3Layer = getOrAddLayer('foreground3', area, alternateArea);
                foreground3Layer.grid.tiles[y][x] = newTile
            }
        }
    },
    renderPreview(context: CanvasRenderingContext2D, random: SRandom, area: AreaInstance, r: Rect, alternateArea: AreaInstance) {
        for (const layerKey of typedKeys(largeTreeLayers)) {
            for (let y = r.y; y < r.y + r.h; y++) {
                for (let x = r.x; x < r.x + r.w; x++) {
                    const tile = allTiles[largeTreeLayers[layerKey][y - r.y][x - r.x]];
                    if (tile) {
                        renderTileFrame(tile, 0, context, {x: x * 16, y: y * 16, w: 16, h: 16});
                    }
                }
            }
        }
    },
}
