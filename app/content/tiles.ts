import {
    BITMAP_MIDDLE_DOWN_RIGHT, BITMAP_MIDDLE_UP_RIGHT,
    BITMAP_BOTTOM, BITMAP_BOTTOM_6,
    BITMAP_BOTTOM_LEFT_8, BITMAP_BOTTOM_RIGHT_8,
    BITMAP_TOP_LEFT_8_STRIP, BITMAP_TOP_RIGHT_8_STRIP,
    BITMAP_BOTTOM_LEFT, BITMAP_BOTTOM_RIGHT,
    BITMAP_TOP_LEFT, BITMAP_TOP_RIGHT,
    BITMAP_LEFT_6, BITMAP_LEFT_6_BOTTOM_9, BITMAP_LEFT_6_TOP_5,
    BITMAP_RIGHT_6, BITMAP_RIGHT_6_BOTTOM_9, BITMAP_RIGHT_6_TOP_5,
} from 'app/content/bitMasks';
import { rareLifeLootTable, simpleLootTable, lifeLootTable, moneyLootTable } from 'app/content/lootTables';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { createCanvasAndContext, debugCanvas } from 'app/utils/canvas';
import { allImagesLoaded, requireImage } from 'app/utils/images';

import { Frame, FullTile, TileBehaviors, TileHashMap } from 'app/types';


export const allTiles: FullTile[] = [null];
window['allTiles'] = allTiles;

export interface TileSource {
    // The size of the tiles
    w: number,
    h: number,
    // The source frame of the tiles.
    source: Frame,
    behaviors?: {
        [key: string]: TileBehaviors,
    },
    tileCoordinates?: number[][],
}

export const bushParticles: Frame[] = createAnimation('gfx/tiles/bush.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
export const lightStoneParticles: Frame[] = createAnimation('gfx/tiles/rocks.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
export const heavyStoneParticles: Frame[] = createAnimation('gfx/tiles/rocks.png', {w: 16, h: 16}, {x: 7, cols: 3}).frames;
const thornParticles: Frame[] = createAnimation('gfx/tiles/thorns.png', {w: 16, h: 16}, {x: 2, cols: 5}).frames;
const bushBehavior: TileBehaviors = {
    defaultLayer: 'field',
    solid: true, pickupWeight: 0, cuttable: 1, lootTable: lifeLootTable,
    midHeight: true,
    underTile: 22,
    particles: bushParticles,
    breakSound: 'bushShatter',
    linkableTiles: [183],
    linkedOffset: 181,
};
const lightStoneBehavior: TileBehaviors = {
    defaultLayer: 'field',
    low: true, solid: true, pickupWeight: 1, lootTable: simpleLootTable,
    throwDamage: 2,
    particles: lightStoneParticles,
    breakSound: 'rockShatter',
    linkableTiles: [185, 186],
    linkedOffset: 179,
};

const heavyStoneBehavior: TileBehaviors = {
    defaultLayer: 'field',
    low: true, solid: true, pickupWeight: 2, lootTable: moneyLootTable,
    throwDamage: 4,
    particles: heavyStoneParticles,
    breakSound: 'rockShatter',
    linkableTiles: [187, 188],
    linkedOffset: 179,
};
const southernWallBehavior: TileBehaviors = {
    solid: true,
    // Wall appear behind the player except over doorways.
    defaultLayer: 'field',
    isSouthernWall: true,
}
const lowWallBehavior: TileBehaviors = {
    defaultLayer: 'field',
    low: true,
    solid: true,
};
const pitBehavior: TileBehaviors = { defaultLayer: 'field', pit: true };
const thornBehavior: TileBehaviors = {
    defaultLayer: 'field',
    lootTable: rareLifeLootTable,
    low: true, touchHit: {damage: 1, spiritCloakDamage: 5, isGroundHit: true }, cuttable: 1,
    underTile: 23,
    particles: thornParticles,
    linkedOffset: 179,
};
const deepWaterBehavior: TileBehaviors = {
    defaultLayer: 'field',
    water: true,
};
const southCliffBehavior: TileBehaviors = {
    ledges: {up: false},
    isSouthernWall: true,
    solid: true,
};
const climbableWall: TileBehaviors = {
    defaultLayer: 'field',
    climbable: true,
    isSouthernWall: true,
    solid: true,
    low: true,
};

const spiritBushParticles: Frame[] = createAnimation('gfx/tiles/bushspirit.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
const spiritLightStoneParticles: Frame[] = createAnimation('gfx/tiles/rocksspirit.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
const spiritHeavyStoneParticles: Frame[] = createAnimation('gfx/tiles/rocksspirit.png', {w: 16, h: 16}, {x: 7, cols: 3}).frames;
const spiritThornParticles: Frame[] = createAnimation('gfx/tiles/thornsspirit.png', {w: 16, h: 16}, {x: 2, cols: 5}).frames;
const spiritBushBehavior: TileBehaviors = {
    ...bushBehavior,
    underTile: 201,
    particles: spiritBushParticles,
    breakSound: 'bushShatter',
    linkableTiles: [2],
};
const spiritLightStoneBehavior: TileBehaviors = {
    ...lightStoneBehavior, particles: spiritLightStoneParticles,
    linkableTiles: [6, 7],
};
const spiritHeavyStoneBehavior: TileBehaviors = {
    ...heavyStoneBehavior, particles: spiritHeavyStoneParticles,
    linkableTiles: [8, 9],
};
const spiritThornBehavior: TileBehaviors = {
    ...thornBehavior,
    underTile: 202,
    particles: spiritThornParticles,
};

let index = 1;
function addSingleTileFromTileSource(tileSource: TileSource, x: number, y: number) {
    const behaviors = tileSource.behaviors?.[`${x}x${y}`] || tileSource.behaviors?.all;
    if (behaviors?.skipped) {
        return;
    }
    const w = 16, h = 16;
    allTiles[index] = {
        index,
        frame: {
            image: tileSource.source.image,
            x: tileSource.source.x + x * w,
            y: tileSource.source.y + y * h,
            w,
            h
        },
        behaviors,
    };
    index++;
}

function addTiles(palettes: TileSource[]) {
    const w = 16, h = 16;
    for (const palette of palettes) {
        // Use specified array of coordinates if found.
        if (palette.tileCoordinates) {
            for (const coordinates of palette.tileCoordinates) {
                const [x, y] = coordinates;
                addSingleTileFromTileSource(palette, x, y);
            }
        } else {
            // Otherwise loop over all coordinates.
            for (let py = 0; py < palette.source.h / h; py ++) {
                for (let px = 0; px < palette.source.w / w; px ++) {
                    addSingleTileFromTileSource(palette, px, py);
                }
            }
        }
    }
}

const emptyKey = [...new Array(16 * 16 * 4)].map(() => 0).join(',');
export async function findUniqueTiles(source: Frame) {
    await allImagesLoaded();
    const [canvas, context] = createCanvasAndContext(source.w, source.h);
    drawFrame(context, source, {...source, x: 0, y: 0});
    debugCanvas(canvas);
    context.fillStyle = 'red';
    const imageData = context.getImageData(0, 0, source.w, source.h).data;
    //console.log(imageData.length, source.w * source.h * 4);
    const imageMap: {[key: string]: {x: number, y: number}} = {};
    for (let y = 0; y < source.h; y += 16) {
        for (let x = 0; x < source.w; x += 16) {
            // Special exemption for CLIFF graphics.
            //if (x >= 368 && (y >= 64 && y < 192)) {
            //    continue;
            //}
            const pixels: string[] = [];
            for (let sy = 0; sy < 16; sy++) {
                const py = y + sy;
                const i = (py * source.w + x) * 4;
                const slice = imageData.slice(i, i + 16 * 4);
                //console.log(slice.length, ':', slice);
                pixels.push(slice.join(','));
            }
            const key = pixels.join(',');
            if (key === emptyKey) {
                continue;
            }
            if (!imageMap[key]) {
                imageMap[key] = {x: (x + source.x) / 16, y: (y + source.y) / 16};
            } else {
                console.log(x, y);
                context.fillRect(x, y, 16, 16);
            }
        }
    }
    return Object.values(imageMap);
}
export function generateTileHash({ frame }): string {
    const [, context] = createCanvasAndContext(16, 16);
    drawFrame(context, frame, {x: 0, y: 0, w: 16, h: 16});
    const imageData = context.getImageData(0, 0, 16, 16).data;
    return imageData.join(',');
}
let imageMap: TileHashMap;
export function generateTileHashMap(): TileHashMap {
    if (imageMap) {
        return imageMap;
    }
    imageMap = {};
    imageMap[emptyKey] = allTiles[1];
    // don't add the null+empty tiles.
    addTilesToTileHashMap(allTiles.slice(2));
    return imageMap;
}
export function addTilesToTileHashMap(tiles: FullTile[]) {
    for (const tile of tiles) {
        if (!tile || tile?.behaviors?.deleted) {
            continue;
        }
        const hashKey = generateTileHash(tile);
        if (hashKey !== emptyKey && imageMap[hashKey]) {
            const otherTile = imageMap[hashKey];
            // We don't want to use the same tile from multiple places, so log an error if we discover
            // the same tile being sampled from multiple places. It is okay to sample the same place twice
            // since we may want tiles that look the same with different behaviors.
            if (otherTile.frame.image !== tile.frame.image ||
                otherTile.frame.x !== tile.frame.x ||
                otherTile.frame.y !== tile.frame.y
            ) {
                console.error('Found duplicate tiles:', imageMap[hashKey].index, tile.index);
            }
            continue;
        }
        imageMap[hashKey] = tile;
    }
}

let newTileInsertPoint = 0;
export function addNewTile(frame: Frame): FullTile {
    //console.log('Adding new tile', (frame.image as HTMLImageElement)?.src, frame.x, frame.y);
    // Move to the next tile insert point.
    for(;newTileInsertPoint < allTiles.length; newTileInsertPoint++) {
        if (allTiles[newTileInsertPoint]?.behaviors?.deleted) {
            break;
        }
    }
    //console.log('Adding new tile', newTileInsertPoint);
    allTiles[newTileInsertPoint] = {
        index: newTileInsertPoint,
        frame,
    };
    addTilesToTileHashMap([allTiles[newTileInsertPoint]]);
    return allTiles[newTileInsertPoint];
}

async function logUniqueTiles(newTiles: Frame): Promise<void> {
    const coords = await findUniqueTiles(newTiles);
    if (!coords.length) {
        console.log('no tiles found');
        return;
    }
    const stringGrid = [['']];
    let l = coords[0].x, r = coords[0].x, t = coords[0].y, b = coords[0].y;
    for (const {x, y} of coords) {
        l = Math.min(l, x);
        r = Math.max(r, x);
        t = Math.min(t, y);
        b = Math.max(b, y);
        stringGrid[y] = stringGrid[y] || [''];
        stringGrid[y][x] = '[' + `${x}`.padStart(2, ' ') + ',' + `${y}`.padStart(2, ' ') + '],';
    }
    let result = '';
    for (let y = t; y <= b; y++) {
        for (let x = l; x <= r; x++) {
            result += (stringGrid[y]?.[x] || '        ');
        }
        result += '\n';
    }
    console.log(result);
}

function singleTileSource(source: string, behaviors: TileBehaviors = null, x = 0, y = 0, w = 16, h = 16): TileSource {
    return {
        w, h,
        source: {image: requireImage(source), x, y, w, h},
        behaviors: behaviors ? {'0x0': behaviors} : {},
    };
}

function stampTileSource(frame: Frame, behaviors: {[key: string]: TileBehaviors} = {}): TileSource {
    return {
        w: 16, h: 16,
        source: frame,
        behaviors,
    };
}
function canvasPalette(draw: (context: CanvasRenderingContext2D) => void, behaviors: TileBehaviors = null): TileSource {
    const [canvas, context] = createCanvasAndContext(16, 16);
    draw(context);
    /*canvas.style.position = 'absolute';
    canvas.style.top = '0';
    document.body.append(canvas);*/
    return {
        w: 16, h: 16,
        source: {image: canvas, x: 0, y: 0, w: 16, h: 16},
        behaviors: behaviors ? {'0x0': behaviors} : {},
    };
}
function solidColorTile(color: string, behaviors: TileBehaviors = null): TileSource {
    return canvasPalette(context => {
        context.fillStyle = color;
        context.fillRect(0, 0, 16, 16);
    }, behaviors);
}
function gradientColorTile(colors: string[], x0, y0, x1, y1, behaviors: TileBehaviors = null): TileSource {
    return canvasPalette(context => {
        const gradient = context.createLinearGradient(x0, y0, x1, y1);
        for (let i = 0; i < colors.length; i++) {
            gradient.addColorStop(i * 1 / (colors.length - 1), colors[i])
        }
        context.fillStyle = gradient;
        context.fillRect(0, 0, 16, 16);
    }, behaviors);
}

const rockWallFrame: Frame = {
    image: requireImage('gfx/tiles/rockwalltiles.png'),
    x: 0, y: 0, w: 48, h: 32,
}


const caveFloorPalette: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavefloor.png'), x: 0, y: 0, w: 336, h: 16},
    behaviors: {all: {linkedOffset: 448}, '0x0': {linkedOffset: 1078}},
};
const caveFloorSpiritPalette: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavefloorspirit.png'), x: 16, y: 0, w: 320, h: 16},
    behaviors: {},
};

const caveCornersPalette: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavewalls.png'), x: 32, y: 0, w: 8 * 32, h: 32},
    behaviors: {'all': {solid: true}},
};
const caveWallsPalette: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavewalls.png'), x: 0, y: 32, w: 32, h: 4 * 32},
    behaviors: {'all': {solid: true}},
};

const spiritPlantParticles = createAnimation('gfx/tiles/spiritplants.png', {w: 16, h: 16}, {x: 5, cols: 4}).frames;

const spiritPlantBehavior: TileBehaviors = {
    defaultLayer: 'field',
    solid: true, pickupWeight: 0, cuttable: 1, lootTable: lifeLootTable,
    midHeight: true,
    underTile: 110,
    particles: spiritPlantParticles,
    breakSound: 'bushShatter',
    brightness: 0.6,
    lightRadius: 48,
};
const spiritPlantsPalette: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/spiritplants.png'), x: 0, y: 0, w: 5 * 16, h: 16},
    behaviors: {
        '0x0': spiritPlantBehavior,
        '1x0': spiritPlantBehavior,
        '2x0': {brightness: 0.4, lightRadius: 24},
        '3x0': {brightness: 0.4, lightRadius: 24},
    },
};
const brightGrass: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/grass.png'), x: 0, y: 0, w: 11 * 16, h: 16},
    behaviors: {
        '0x0': {brightness: 1, lightRadius: 16},
    },
};

const lightCaveCornersPalette: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavewalls2temp.png'), x: 32, y: 0, w: 8 * 32, h: 32},
    behaviors: {'all': {solid: true}},
};
const lightCaveWallsPalette: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavewalls2temp.png'), x: 0, y: 32, w: 32, h: 4 * 32},
    behaviors: {'all': {solid: true}},
};


const furnitureCozyTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_furniture.png'), x: 496, y: 0, w: 4 * 16, h: 3 * 16},
    behaviors: {
        'all': {defaultLayer: 'field', solid: true, low: true},
        '3x2': {pit: true},
    },
};

const furnitureWoodTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_furniture.png'), x: 560, y: 272, w: 4 * 16, h: 6 * 16},
    behaviors: {
        'all': {defaultLayer: 'field', solid: true, low: true},
    },
};

const furniturePlantTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_woodAndFood.png'), x: 112, y: 206, w: 1 * 16, h: 1 * 16},
    behaviors: {
        'all': {defaultLayer: 'field', solid: true, low: true},
    },
};

const iceTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/iceTile.png'), x: 0, y: 0, w: 16, h: 16},
    behaviors: {'all': {isGround: true, slippery: true, elementTiles: {fire: 0}}},
};

const furnitureLampTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_furniture.png'), x: 560, y: 368, w: 1 * 16, h: 1 * 16},
    behaviors: {
        'all': {defaultLayer: 'field', solid: true, low: true, brightness: 0.6, lightRadius: 32},
    },
};

const laundryTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_laundry32.png'), x: 0, y: 0, w: 6 * 16, h: 2 * 16},
    behaviors: {
        'all': {defaultLayer: 'field', solid: true, low: false},
    },
};

const fireTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_fire.png'), x: 0, y: 0, w: 1 * 16, h: 1 * 16},
    behaviors: {
        'all': {defaultLayer: 'field', solid: true, low: false},
    },
};

const logChoppingTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_woodAndFood.png'), x: 240, y: 64, w: 1 * 16, h: 1 * 16},
    behaviors: {
        'all': {solid: true, low: true},
    },
};

const foodBoxTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_woodAndFood.png'), x: 192, y: 102, w: 4 * 16, h: 2 * 16},
    behaviors: {
        'all': {solid: true, low: true},
    },
};

const logAndFoodBagTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_woodAndFood.png'), x: 64, y: 160, w: 5 * 16, h: 1 * 16},
    behaviors: {
        'all': {solid: true, low: true},
    },
};

const largeLogPileTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_woodAndFood.png'), x: 112, y: 176, w: 2 * 16, h: 2 * 16},
    behaviors: {
        'all': {solid: true, low: true},
    },
};

const blueHouseTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_furniture.png'), x: 368, y: 80, w: 4 * 16, h: 5 * 16},
    behaviors: {
        'all': {solid: true, low: false},
    },
};

const greenHouseTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_furniture.png'), x: 368, y: 160, w: 4 * 16, h: 5 * 16},
    behaviors: {
        'all': {solid: true, low: false},
    },
};

const fenceTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_furniture.png'), x: 240, y: 0, w: 3 * 16, h: 3 * 16},
    behaviors: {
        'all': {solid: true, low: true},
    },
};

const bridgeHorizontalTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_bridgeAndTree.png'), x: 128, y: 48, w: 3 * 16, h: 1 * 16},
    behaviors: {},
};

const bridgeVerticalTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_bridgeAndTree.png'), x: 144, y: 32, w: 3 * 16, h: 1 * 16},
    behaviors: {},
};

const roomFloorTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_furniture.png'), x: 768, y: 192, w: 3 * 16, h: 1 * 16},
};

const railsTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/rails.png'), x: 0, y: 0, w: 64, h: 16},
    behaviors: {'all': {solid: true, defaultLayer: 'field', linkedOffset: 4}},
};

const spiritRailsTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/rails.png'), x: 0, y: 16, w: 64, h: 16},
    behaviors: {'all': {solid: true, defaultLayer: 'field'}},
};

const shallowWaterBehavior: TileBehaviors = { defaultLayer: 'field', shallowWater: true };
const deepToShallow: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/deeptoshallowwater.png'), x: 0, y: 0, w: 64, h: 80},
    behaviors: {
        'all': shallowWaterBehavior,
        '0x3': deepWaterBehavior, '1x3': deepWaterBehavior,
        '0x4': deepWaterBehavior, '1x4': deepWaterBehavior,
        '3x2': { skipped: true }
    },
};
const deepToShallowAngles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/deeptoshallowwater.png'), x: 64, y: 0, w: 64, h: 64},
    behaviors: {
        'all': deepWaterBehavior,
        '0x0': { skipped: true }, '3x0': { skipped: true },
        '0x3': { skipped: true }, '3x3': { skipped: true },
        '1x1': shallowWaterBehavior, '1x2': shallowWaterBehavior,
        '2x1': shallowWaterBehavior, '2x2': shallowWaterBehavior,
    },
};
const shallowToDeep: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/shallowtodeepwater1.png'), x: 0, y: 0, w: 64, h: 80},
    behaviors: {
        'all': deepWaterBehavior,
        '0x3': shallowWaterBehavior, '1x3': shallowWaterBehavior,
        '0x4': shallowWaterBehavior, '1x4': shallowWaterBehavior,
        '3x2': { skipped: true }
    },
};
const shallowToDeepAngles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/shallowtodeepwater1.png'), x: 64, y: 0, w: 64, h: 64},
    behaviors: {
        'all': shallowWaterBehavior,
        '0x0': { skipped: true }, '3x0': { skipped: true },
        '0x3': { skipped: true }, '3x3': { skipped: true },
        '1x1': deepWaterBehavior, '1x2': deepWaterBehavior,
        '2x1': deepWaterBehavior, '2x2': deepWaterBehavior,
    },
};

const shore: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/watershore.png'), x: 0, y: 0, w: 64, h: 80},
    behaviors: {
        'all': { defaultLayer: 'floor' },
        '3x0': { skipped: true }, '3x1': { skipped: true },
    },
};
const shoreAngles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/watershore.png'), x: 64, y: 0, w: 64, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor' },
        '0x0': { skipped: true }, '3x0': { skipped: true },
        '0x3': { skipped: true }, '3x3': { skipped: true },
    },
};

const shoreMask: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/blackmaskground.png'), x: 0, y: 0, w: 64, h: 80},
    behaviors: {
        'all': { defaultLayer: 'floor' },
        '3x0': { skipped: true }, '3x1': { skipped: true },
    },
};
const shoreAnglesMask: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/blackmaskground.png'), x: 64, y: 0, w: 64, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor' },
        '0x0': { skipped: true }, '3x0': { skipped: true },
        '0x3': { skipped: true }, '3x3': { skipped: true },
    },
};

const cloudBehavior = <const>{ cloudGround: true, defaultLayer: 'field'  };
const clouds: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cloud.png'), x: 0, y: 0, w: 64, h: 80},
    behaviors: {
        'all': cloudBehavior,
        '0x0': { ...cloudBehavior, ledges: {up: true, left: true}},
        '1x0': { ...cloudBehavior, ledges: {up: true}},
        '2x0': { ...cloudBehavior, ledges: {up: true, right: true}},
        '0x1': { ...cloudBehavior, ledges: {left: true}},
        '2x1': { ...cloudBehavior, ledges: {right: true}},
        '0x2': { ...cloudBehavior, ledges: {down: true, left: true}},
        '1x2': { ...cloudBehavior, ledges: {down: true}},
        '2x2': { ...cloudBehavior, ledges: {down: true, right: true}},
        '0x3': { ...cloudBehavior, ledges: {up: true, left: true}},
        '1x3': { ...cloudBehavior, ledges: {up: true, right: true}},
        '0x4': { ...cloudBehavior, ledges: {down: true, left: true}},
        '1x4': { ...cloudBehavior, ledges: {down: true, right: true}},
    },
};
const cloudAngles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cloud.png'), x: 64, y: 0, w: 64, h: 64},
    behaviors: {
        'all': cloudBehavior,
        '0x0': { skipped: true }, '3x0': { skipped: true },
        '0x3': { skipped: true }, '3x3': { skipped: true },
        '1x0': { ...cloudBehavior, solidMap: BITMAP_TOP_LEFT, low: true, diagonalLedge: 'upleft'},
        '0x1': { ...cloudBehavior, solidMap: BITMAP_TOP_LEFT, low: true, diagonalLedge: 'upleft'},
        '2x0': { ...cloudBehavior, solidMap: BITMAP_TOP_RIGHT, low: true, diagonalLedge: 'upright'},
        '3x1': { ...cloudBehavior, solidMap: BITMAP_TOP_RIGHT, low: true, diagonalLedge: 'upright'},
        '0x2': { ...cloudBehavior, solidMap: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft'},
        '1x3': { ...cloudBehavior, solidMap: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft'},
        '2x3': { ...cloudBehavior, solidMap: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright'},
        '3x2': { ...cloudBehavior, solidMap: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright'},
    },
};

const vineBase: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/vines.png'), x: 48, y: 0, w: 16, h: 16},
    behaviors: {
        'all': { defaultLayer: 'field', brightness: 0.5, lightRadius: 24 },
    },
};
const vineMiddle: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/vines.png'), x: 80, y: 16, w: 16, h: 32},
    behaviors: {
        'all': {...climbableWall, brightness: 0.5, lightRadius: 24},
    },
};
const vineTop: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/vines.png'), x: 80, y: 48, w: 16, h: 16},
    behaviors: {
        'all': { defaultLayer: 'field', brightness: 0.5, lightRadius: 24 },
    },
};

function applyMask(targetSource: TileSource, maskSource: TileSource) {
    const {w, h} = targetSource;
    for (let py = 0; py < targetSource.source.h / h; py ++) {
        for (let px = 0; px < targetSource.source.w / w; px ++) {
            const behaviors = targetSource.behaviors?.[`${px}x${py}`] || targetSource.behaviors?.all || {};
            if (behaviors?.skipped) {
                continue;
            }
            targetSource.behaviors[`${px}x${py}`] = {
                ...behaviors,
                maskFrame: {
                    image: maskSource.source.image,
                    x: maskSource.source.x + px * w,
                    y: maskSource.source.y + py * h,
                    w,
                    h,
                },
            };
        }
    }
}

applyMask(shore, shoreMask);
applyMask(shoreAngles, shoreAnglesMask);

const treeStump: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/treesheet.png'), x: 0, y: 128, w: 64, h: 48},
    behaviors: {
        'all': { defaultLayer: 'field', solid: true, linkedOffset: 401 },
    },
};
const treeLeavesTop: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/treesheet.png'), x: 80, y: 0, w: 64, h: 16},
    behaviors: {
        'all': { defaultLayer: 'foreground2', linkedOffset: 401 },
    },
};
const treeLeaves: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/treesheet.png'), x: 64, y: 16, w: 96, h: 48},
    behaviors: {
        'all': { defaultLayer: 'foreground', linkedOffset: 401 },
    },
};
const treeLeavesBottom: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/treesheet.png'), x: 96, y: 64, w: 32, h: 16},
    behaviors: {
        'all': { defaultLayer: 'foreground', linkedOffset: 401 },
    },
};
const treeLeavesDoor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/treesheet.png'), x: 16, y: 96, w: 32, h: 16},
    behaviors: {
        'all': { defaultLayer: 'foreground', linkedOffset: 401 },
    },
};
const treeLeavesMerged: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/treesheet.png'), x: 160, y: 16, w: 32, h: 48},
    behaviors: {
        'all': { defaultLayer: 'foreground', linkedOffset: 401 },
    },
};
const treeLeavesCorridor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/treesheet.png'), x: 224, y: 16, w: 16, h: 48},
    behaviors: {
        'all': { defaultLayer: 'foreground', linkedOffset: 401 },
    },
};
const treeStumpDoor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/treesheet.png'), x: 64, y: 96, w: 64, h: 32},
    behaviors: {
        'all': { defaultLayer: 'field', solid: true, linkedOffset: 401 },
    },
};


const knobbyTreeStump: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/knobbytrees.png'), x: 0, y: 128, w: 64, h: 48},
    behaviors: {
        'all': { defaultLayer: 'field', solid: true },
    },
};
const knobbyTreeLeavesTop: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/knobbytrees.png'), x: 80, y: 0, w: 64, h: 16},
    behaviors: {
        'all': { defaultLayer: 'foreground2' },
    },
};
const knobbyTreeLeaves: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/knobbytrees.png'), x: 64, y: 16, w: 96, h: 48},
    behaviors: {
        'all': { defaultLayer: 'foreground' },
    },
};
const knobbyTreeLeavesBottom: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/knobbytrees.png'), x: 96, y: 64, w: 32, h: 16},
    behaviors: {
        'all': { defaultLayer: 'foreground' },
    },
};
const knobbyTreeLeavesDoor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/knobbytrees.png'), x: 16, y: 96, w: 32, h: 16},
    behaviors: {
        'all': { defaultLayer: 'foreground' },
    },
};
const knobbyTreeLeavesMerged: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/knobbytrees.png'), x: 160, y: 16, w: 32, h: 48},
    behaviors: {
        'all': { defaultLayer: 'foreground' },
    },
};
const knobbyTreeLeavesCorridor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/knobbytrees.png'), x: 224, y: 16, w: 16, h: 48},
    behaviors: {
        'all': { defaultLayer: 'foreground' },
    },
};
const knobbyTreeStumpDoor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/knobbytrees.png'), x: 64, y: 96, w: 64, h: 32},
    behaviors: {
        'all': { defaultLayer: 'field', solid: true },
    },
};


const crackedFloor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/clifffloors.png'), x: 0, y: 0, w: 48, h: 16},
    behaviors: {
        'all': { defaultLayer: 'floor' },
    },
};

const breakableFloor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/clifffloors.png'), x: 0, y: 0, w: 16, h: 16},
    behaviors: {
        'all': { defaultLayer: 'field', underTile: 4, isBrittleGround: true},
    },
};

const stairs: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/exteriorstairs.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[2,2],[0,3],[1,3],[2,3]]
};

// use `foreground2` as default so that it can appear on top of walls that might be on `foreground`
// All of these solid maps are set so that only the bottom half of the ceiling graphics are solid.
const ceilingBehavior: TileBehaviors = { defaultLayer: 'foreground2', isVeryTall: true, solid: true};
const bottomCeilingBehavior: TileBehaviors = { defaultLayer: 'foreground2', isVeryTall: true, solidMap: BITMAP_BOTTOM};
const topLeftCeiling: TileBehaviors = { ...ceilingBehavior, isVeryTall: true, solid: false, solidMap: BITMAP_TOP_LEFT_8_STRIP};
const topRightCeiling: TileBehaviors = { ...ceilingBehavior, isVeryTall: true, solid: false,  solidMap: BITMAP_TOP_RIGHT_8_STRIP};
const bottomLeftCeiling: TileBehaviors = { ...ceilingBehavior, isVeryTall: true, solid: false,  solidMap: BITMAP_BOTTOM_LEFT_8};
const bottomRightCeiling: TileBehaviors = { ...ceilingBehavior, isVeryTall: true, solid: false,  solidMap: BITMAP_BOTTOM_RIGHT_8};


const woodCeiling: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/woodhousetilesarranged.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': ceilingBehavior,
        '3x0': bottomCeilingBehavior,
        '1x1': bottomCeilingBehavior,
        '2x2': bottomCeilingBehavior, '3x2': bottomCeilingBehavior, '4x2': bottomCeilingBehavior,
        '0x3': bottomCeilingBehavior, '1x3': bottomCeilingBehavior, '3x3': bottomCeilingBehavior,
        '0x4': topLeftCeiling, '4x4': topLeftCeiling, '1x7': topLeftCeiling,
        '1x4': topRightCeiling, '5x4': topRightCeiling, '0x7': topRightCeiling,
        '5x3': bottomLeftCeiling, '0x5': bottomLeftCeiling, '1x6': bottomLeftCeiling,
        '4x3': bottomRightCeiling, '1x5': bottomRightCeiling, '0x6': bottomRightCeiling,
        // Breakable tiles: [2,5] + [2,6] should be door sprites.
    },
    tileCoordinates: [
        [0,0],            [3,0],
        [0,1],[1,1],[2,1],[3,1],[4,1],
        [0,2],[1,2],[2,2],[3,2],[4,2],
        [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],
        [0,4],[1,4],[2,4],      [4,4],[5,4],
        [0,5],[1,5],// [2,5],
        [0,6],[1,6],// [2,6],
        [0,7],[1,7]
    ],
};

const topLeftWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT, isSouthernWall: true};
const topRightWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT, isSouthernWall: true};
const bottomLeftWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_LEFT, isSouthernWall: true};
const bottomRightWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_RIGHT, isSouthernWall: true};

const woodWalls: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/woodhousetilesarranged.png'), x: 0, y: 0, w: 48, h: 80},
    behaviors: {
        'all': southernWallBehavior,
        '11x4': topLeftWall, '12x4': topLeftWall,
        '9x4': topRightWall, '10x4': topRightWall,
        '9x0': bottomLeftWall, '10x0': bottomLeftWall,
        '11x0': bottomRightWall, '12x0': bottomRightWall,
    },
    tileCoordinates: [
        [7,0],[8,0],[9,0],[10,0],[11,0],[12,0],
        [7,1],[8,1],[9,1],[10,1],[11,1],[12,1],
        [7,2],[8,2],[9,2],[10,2],[11,2],[12,2],
        [7,3],      [9,3],[10,3],[11,3],[12,3],
        [7,4],      [9,4],[10,4],[11,4],[12,4],
        [7,5],
    ],
};
const extraWoodWalls: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/woodhousetilesarranged.png'), x: 0, y: 0, w: 48, h: 80},
    behaviors: {
        'all': southernWallBehavior,
    },
    tileCoordinates: [
                    [9,6],[10,6],[11,6],[12,6],
    ],
};
const woodStairs: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/woodhousetilesarranged.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'field' },
        '13x0': { defaultLayer: 'field', solidMap: BITMAP_LEFT_6_BOTTOM_9},
        '13x1': { defaultLayer: 'field', solidMap: BITMAP_LEFT_6},
        '13x2': { defaultLayer: 'field', solidMap: BITMAP_LEFT_6},
        '13x3': { defaultLayer: 'field', solidMap: BITMAP_LEFT_6},
        '13x4': { defaultLayer: 'field', solidMap: BITMAP_LEFT_6_TOP_5},
        '15x0': { defaultLayer: 'field', solidMap: BITMAP_RIGHT_6_BOTTOM_9},
        '15x1': { defaultLayer: 'field', solidMap: BITMAP_RIGHT_6},
        '15x2': { defaultLayer: 'field', solidMap: BITMAP_RIGHT_6},
        '15x3': { defaultLayer: 'field', solidMap: BITMAP_RIGHT_6},
        '15x4': { defaultLayer: 'field', solidMap: BITMAP_RIGHT_6_TOP_5},
    },
    tileCoordinates: [
        [13,0],[14,0],[15,0],
        [13,1],[14,1],[15,1],
        [13,2],[14,2],[15,2],
        [13,3],[14,3],[15,3],
        [13,4],[14,4],[15,4]
    ],
};

const woodLedges: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/woodhousetilesarranged.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        '8x9': { defaultLayer: 'floor2', ledges: { up: true, left: true}},
        '9x9': { defaultLayer: 'floor2', ledges: { up: true }},
        '10x9': { defaultLayer: 'floor2', ledges: { up: true, right: true}},
        '8x10': { defaultLayer: 'floor2', ledges: { left: true}},
        '10x10': { defaultLayer: 'floor2', ledges: {right: true}},
        '8x11': { defaultLayer: 'floor2', ledges: { down: true, left: true}},
        '9x11': { defaultLayer: 'floor2', ledges: { down: true }},
        '10x11': { defaultLayer: 'floor2', ledges: { down: true, right: true}},
        '9x12': { defaultLayer: 'floor2', diagonalLedge: 'upleft'},
        '10x12': { defaultLayer: 'floor2', diagonalLedge: 'upright'},
        '8x14': { defaultLayer: 'floor2', diagonalLedge: 'downleft'},
        '11x14': { defaultLayer: 'floor2', diagonalLedge: 'downright'},
    },
    tileCoordinates: [
        // This is a quare
        [8,9], [9,9], [10,9],
        [8,10],       [10,10],
        [8,11],[9,11],[10,11],
        // Diamond
        [9,12],[10,12], // TL,TR
        [9,13],[10,13], // Inner TL, Inner TR
        [8,14],[9,14],[10,14],[11,14] //BL, Inner BL, Inner BR, BR

    ],
};
const woodFloorDecorations: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/woodhousetilesarranged.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [
        [14,9],[15,9],[16,9],[17,9],[18,9],[14,10],[16,10],[17,10],[18,10],
        [14,11],[15,11],[16,11],[15,12],[16,12],[14,13],[15,13],[16,13],[17,13],
        [14,14],[15,14],[16,14],[17,14],[15,15],[16,15]

    ],
};
const woodFloor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/woodhousetilesarranged.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor' },
    },
    tileCoordinates: [
        [13,6],[14,6],[15,6],[16,6],[13,7],[14,7],[15,7],[13,8],[14,8],[16,8]
    ],
};

const shadows: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/shadowtiles.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'field2', isGround: false },
    },
    tileCoordinates: [
        [0,0],[1,0],[2,0],[3,0],[4,0],[6,0],[7,0],[8,0],[9,0],[0,1],[2,1],[3,1],[4,1],[6,1],[7,1],[8,1],[9,1],
        [0,2],[2,2],[3,2],[4,2],[5,2],[7,2],[8,2],[10,2],[0,3],[4,3],[5,3],[7,3],[8,3],[10,3],
        [0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[0,5],[7,5],[8,5]
    ],
};


const caveCeiling: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavearranged.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'foreground2' },
        '0x12': bottomLeftCeiling, '1x12': bottomLeftCeiling,
        '2x12': bottomRightCeiling, '3x12': bottomRightCeiling,
    },
    tileCoordinates: [
                        [ 2, 7],[ 3, 7],[ 4, 7],[ 5, 7],
                        [ 2, 8],[ 3, 8],[ 4, 8],[ 5, 8],
                        [ 2, 9],[ 3, 9],
        [ 0,10],[ 1,10],[ 2,10],[ 3,10],

        [ 0,12],[ 1,12],[ 2,12],[ 3,12],
    ],
};

const caveCeilingTopAngles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavearranged.png'), x: 0, y: 0, w: 48, h: 80},
    behaviors: {
        '8x2': ceilingBehavior, '9x2': ceilingBehavior,
        '10x2': ceilingBehavior, '11x2': ceilingBehavior,
    },
    tileCoordinates: [
        [ 8, 2],[ 9, 2],[10, 2],[11, 2],
    ],
};

const caveWalls: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavearranged.png'), x: 0, y: 0, w: 48, h: 80},
    behaviors: {
        'all': southernWallBehavior,
        '12x3': topRightWall, '13x3': topRightWall,
        '14x3': topLeftWall, '15x3': topLeftWall,
    },
    tileCoordinates: [
    [ 7, 0],[ 8, 0],[ 9, 0],[10, 0],[11, 0],[12, 0],[13, 0],[14, 0],[15, 0],
    [ 7, 1],[ 8, 1],[ 9, 1],[10, 1],[11, 1],[12, 1],[13, 1],[14, 1],
                                            [12, 2],[13, 2],[14, 2],[15, 2],
                                            [12, 3],[13, 3],[14, 3],[15, 3],
    ],
};

const caveStairs: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavearranged.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'field' },
    },
    tileCoordinates: [
        [16, 0],[17, 0],[18, 0],
        [16, 1],[17, 1],[18, 1],
        [16, 2],[17, 2],[18, 2],
        [16, 3],[17, 3],[18, 3],
        [16, 4],[17, 4],[18, 4],
    ],
};

const caveLedges: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavearranged.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        '8x8': { defaultLayer: 'floor2', ledges: { right: true }, isGround: false },
        '9x8': { defaultLayer: 'floor2', ledges: { right: true }, isGround: false },

        '8x9': { defaultLayer: 'floor2', ledges: { left: true }, isGround: false },
        '9x9': { defaultLayer: 'floor2', ledges: { left: true }, isGround: false },
        '10x9': { defaultLayer: 'floor2', ledges: { down: true }, isGround: false },
        '11x9': { defaultLayer: 'floor2', ledges: { down: true }, isGround: false },
        '12x9': { defaultLayer: 'floor2', ledges: {down: false}, solidMap: BITMAP_BOTTOM_6, low: true, isGround: false },
        '13x9': { defaultLayer: 'floor2', ledges: {down: false}, solidMap: BITMAP_BOTTOM_6, low: true, isGround: false },

        '8x10': { defaultLayer: 'floor2', solidMap: BITMAP_RIGHT_6, isGround: false },
        '9x10': { defaultLayer: 'floor2', solidMap: BITMAP_RIGHT_6, isGround: false },

        '8x11': { defaultLayer: 'floor2', solidMap: BITMAP_LEFT_6, isGround: false },
        '9x11': { defaultLayer: 'floor2', solidMap: BITMAP_LEFT_6, isGround: false },
        '10x11': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_6, isGround: false },
        '11x11': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_6, isGround: false },
        '12x11': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_6, isGround: false },
        '13x11': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_6, isGround: false },

        '8x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright', isGround: false },
        '9x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft', isGround: false },
        '10x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright', isGround: false },
        '11x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft', isGround: false },
        '12x12': { defaultLayer: 'floor2'},
        '13x12': { defaultLayer: 'floor2'},

        '8x13': { defaultLayer: 'floor2', diagonalLedge: 'upright', isGround: false },
        '9x13': { defaultLayer: 'floor2', diagonalLedge: 'upleft', isGround: false },
        '10x13': { defaultLayer: 'floor2', diagonalLedge: 'upright', isGround: false },
        '11x13': { defaultLayer: 'floor2', diagonalLedge: 'upleft', isGround: false },
        '12x13': { defaultLayer: 'floor2', isGround: false},
        '13x13': { defaultLayer: 'floor2', isGround: false},

        '8x14': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_RIGHT, isGround: false },
        '9x14': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_LEFT, isGround: false },
        '10x14': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_RIGHT, isGround: false },
        '11x14': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_LEFT, isGround: false},
        '12x14': { defaultLayer: 'floor2', isGround: false},
        '13x14': { defaultLayer: 'floor2', isGround: false},

        '8x15': { defaultLayer: 'floor2', solidMap: BITMAP_MIDDLE_DOWN_RIGHT, isGround: false },
        '9x15': { defaultLayer: 'floor2', solidMap: BITMAP_MIDDLE_UP_RIGHT, isGround: false },
        '10x15': { defaultLayer: 'floor2', solidMap: BITMAP_MIDDLE_DOWN_RIGHT, isGround: false },
        '11x15': { defaultLayer: 'floor2', solidMap: BITMAP_MIDDLE_UP_RIGHT, isGround: false},
        '12x15': { defaultLayer: 'floor2', isGround: false},
        '13x15': { defaultLayer: 'floor2', isGround: false},
    },
    tileCoordinates: [
        [ 8, 8],[ 9, 8],
        [ 8, 9],[ 9, 9],[10, 9],[11, 9],[12, 9],[13, 9],
        [ 8,10],[ 9,10],
        [ 8,11],[ 9,11],[10,11],[11,11],[12,11],[13,11],
        [ 8,12],[ 9,12],[10,12],[11,12],[12,12],[13,12],
        [ 8,13],[ 9,13],[10,13],[11,13],[12,13],[13,13],
        [ 8,14],[ 9,14],[10,14],[11,14],[12,14],[13,14],
        [ 8,15],[ 9,15],[10,15],[11,15],[12,15],[13,15],
    ],
};

const caveFloorDecorations: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavearranged.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [
        [15, 5],[16, 5],[17, 5],[18, 5],
        [15, 6],[16, 6],[17, 6],[18, 6],
        [15, 7],[16, 7],[17, 7],[18, 7],
                        [17, 8],[18, 8],
                [16, 9],[17, 9],[18, 9],
                [16,10],        [18,10],
                [16,11],[17,11],[18,11],
                [16,12],[17,12],
        [15,13],[16,13],[17,13],[18,13],
        [15,14],[16,14],[17,14],[18,14],
                [16,15],[17,15],
    ],
};

const caveFloor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavearranged.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        '12x5': { defaultLayer: 'floor', linkedOffset: 339 /* 775 -> 1114 */},
        '12x6': { defaultLayer: 'floor', linkedOffset: 338 /* 776 -> 1114 */},
    },
    tileCoordinates: [
        [12, 5],
        [12, 6],
    ],
};
const caveFloorEdgesGreen: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavearranged.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor2', linkedOffset: 339 },
    },
    tileCoordinates: [
        // Index 777 should map to 1116
        [ 8, 4],[ 9, 4],[10, 4],[11, 4],
        [ 8, 5],[ 9, 5],[10, 5],[11, 5],
    ],
};
const caveFloorEdgesRed: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavearranged.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor2', linkedOffset: 331 },
    },
    tileCoordinates: [
        // Index 785 should map to 1116
        [ 8, 6],[ 9, 6],[10, 6],[11, 6],
        [ 8, 7],[ 9, 7],[10, 7],[11, 7],
    ],
};


const crystalCaveCeiling: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/crystalcavesheet.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'foreground2' },
        '0x12': bottomLeftCeiling, '1x12': bottomLeftCeiling,
        '2x12': bottomRightCeiling, '3x12': bottomRightCeiling,
    },
    tileCoordinates: [
                        [ 2, 7],[ 3, 7],[ 4, 7],[ 5, 7],
                        [ 2, 8],[ 3, 8],[ 4, 8],[ 5, 8],
                        [ 2, 9],[ 3, 9],
        [ 0,10],[ 1,10],[ 2,10],[ 3,10],

        [ 0,12],[ 1,12],[ 2,12],[ 3,12],
    ],
};

const crystalCaveCeilingTopAngles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/crystalcavesheet.png'), x: 0, y: 0, w: 48, h: 80},
    behaviors: {
        '8x2': bottomLeftCeiling, '9x2': bottomLeftCeiling,
        '10x2': bottomRightCeiling, '11x2': bottomRightCeiling,
    },
    tileCoordinates: [
        [ 8, 2],[ 9, 2],[10, 2],[11, 2],
    ],
};

const crystalCaveWalls: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/crystalcavesheet.png'), x: 0, y: 0, w: 48, h: 80},
    behaviors: {
        'all': southernWallBehavior,
        '12x3': topRightWall, '13x3': topRightWall,
        '14x3': topLeftWall, '15x3': topLeftWall,
    },
    tileCoordinates: [
    [ 7, 0],[ 8, 0],[ 9, 0],[10, 0],[11, 0],[12, 0],[13, 0],[14, 0],[15, 0],
    [ 7, 1],[ 8, 1],[ 9, 1],[10, 1],[11, 1],[12, 1],[13, 1],[14, 1],
                                            [12, 2],[13, 2],[14, 2],[15, 2],
                                            [12, 3],[13, 3],[14, 3],[15, 3],
    ],
};

const crystalCaveStairs: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/crystalcavesheet.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'field' },
    },
    tileCoordinates: [
        [16, 0],[17, 0],[18, 0],
        [16, 1],[17, 1],[18, 1],
        [16, 2],[17, 2],[18, 2],
        [16, 3],[17, 3],[18, 3],
        [16, 4],[17, 4],[18, 4],
    ],
};

const crystalCaveLedges: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/crystalcavesheet.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        '8x8': { defaultLayer: 'floor2', ledges: { right: true } },
        '9x8': { defaultLayer: 'floor2', ledges: { right: true } },

        '8x9': { defaultLayer: 'floor2', ledges: { left: true } },
        '9x9': { defaultLayer: 'floor2', ledges: { left: true } },
        '10x9': { defaultLayer: 'floor2', ledges: { down: true } },
        '11x9': { defaultLayer: 'floor2', ledges: { down: true } },
        '12x9': { defaultLayer: 'floor2', ledges: {down: false}, solidMap: BITMAP_BOTTOM_6, low: true, },
        '13x9': { defaultLayer: 'floor2', ledges: {down: false}, solidMap: BITMAP_BOTTOM_6, low: true, },

        '8x10': { defaultLayer: 'floor2', solidMap: BITMAP_RIGHT_6 },
        '9x10': { defaultLayer: 'floor2', solidMap: BITMAP_RIGHT_6 },

        '8x11': { defaultLayer: 'floor2', solidMap: BITMAP_LEFT_6 },
        '9x11': { defaultLayer: 'floor2', solidMap: BITMAP_LEFT_6 },
        '10x11': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_6 },
        '11x11': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_6 },
        '12x11': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_6 },
        '13x11': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_6 },

        '8x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright' },
        '9x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft' },
        '10x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright' },
        '11x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft' },
        '12x12': { defaultLayer: 'floor2'},
        '13x12': { defaultLayer: 'floor2'},

        '8x13': { defaultLayer: 'floor2', diagonalLedge: 'upright' },
        '9x13': { defaultLayer: 'floor2', diagonalLedge: 'upleft' },
        '10x13': { defaultLayer: 'floor2', diagonalLedge: 'upright' },
        '11x13': { defaultLayer: 'floor2', diagonalLedge: 'upleft' },
        '12x13': { defaultLayer: 'floor2'},
        '13x13': { defaultLayer: 'floor2'},

        '8x14': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_RIGHT },
        '9x14': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_LEFT },
        '10x14': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_RIGHT },
        '11x14': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_LEFT},

        '8x15': { defaultLayer: 'floor2', solidMap: BITMAP_MIDDLE_DOWN_RIGHT },
        '9x15': { defaultLayer: 'floor2', solidMap: BITMAP_MIDDLE_UP_RIGHT },
        '10x15': { defaultLayer: 'floor2', solidMap: BITMAP_MIDDLE_DOWN_RIGHT },
        '11x15': { defaultLayer: 'floor2', solidMap: BITMAP_MIDDLE_UP_RIGHT},

    },
    tileCoordinates: [
        [ 8, 8],[ 9, 8],
        [ 8, 9],[ 9, 9],[10, 9],[11, 9],[12, 9],[13, 9],
        [ 8,10],[ 9,10],
        [ 8,11],[ 9,11],[10,11],[11,11],[12,11],[13,11],
        [ 8,12],[ 9,12],[10,12],[11,12],[12,12],[13,12],
        [ 8,13],[ 9,13],[10,13],[11,13],[12,13],[13,13],
        [ 8,14],[ 9,14],[10,14],[11,14],[12,14],[13,14],
        [ 8,15],[ 9,15],[10,15],[11,15],[12,15],[13,15],
    ],
};

const crystalCaveFloorDecorations: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/crystalcavesheet.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [
        [15, 5],                [18, 5],
        [15, 6],        [17, 6],[18, 6],
        [15, 7],[16, 7],[17, 7],[18, 7],
                        [17, 8],[18, 8],
                [16, 9],[17, 9],[18, 9],
                [16,10],        [18,10],
                [16,11],[17,11],[18,11],
                [16,12],[17,12],
        [15,13],[16,13],[17,13],[18,13],
        [15,14],[16,14],[17,14],[18,14],
                [16,15],[17,15],
    ],
};

const crystalCaveFloor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/crystalcavesheet.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor' },
        '13x5': { defaultLayer: 'field', underTile: 4, isBrittleGround: true},
    },
    tileCoordinates: [
        [12, 4], [13, 4], [14, 4],
        [12, 5], [13, 5], [14, 5],
    ],
};
const crystalCaveFloorEdges: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/crystalcavesheet.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [
        [ 8, 4],[ 9, 4],[10, 4],[11, 4],
        [ 8, 5],[ 9, 5],[10, 5],[11, 5],
    ],
};

const crystalGrates: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/crystalgrateplain.png'), x: 0, y: 0, w: 48, h: 32},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
};
const newTiles: Frame = {
    image: requireImage('gfx/tiles/crystalbeadpiles.png'),
    x: 0, y: 0,
    //w: 48, h: 48,
    w: 256, h: 48,
};
//(async () => console.log((await findUniqueTiles(newTiles)).map(o => `[${o.x},${o.y}]`).join(',')));//();
(() => logUniqueTiles(newTiles));//();


const floorEyeTile: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/eyemonsterbase.png'), x: 0, y: 0, w: 16, h: 16},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
};


export const crystalParticles: Frame[] = createAnimation('gfx/effects/particles_beads.png', {w: 3, h: 3}, {x: 0, cols: 10}).frames;

const crystalBeadFloor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/crystalbeadpiles.png'), x: 0, y: 0, w: 256, h: 48},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        // We place the horizontal edges on field layer by default so it is easy to overlap
        // the horizontal+vertical edges.
        '1x0': { defaultLayer: 'field' },
        '4x0': { defaultLayer: 'field' },
        '1x2': { defaultLayer: 'field' },
        '4x2': { defaultLayer: 'field' },
        '1x1': { slippery: true, defaultLayer: 'field', cuttable: 1, low: true, underTile: 1138, numberParticles: 6, particles: crystalParticles },
    },
    tileCoordinates: [
                [ 1, 0],                [ 4, 0],
        [ 0, 1],[ 1, 1],[ 2, 1],[ 3, 1],[ 4, 1],[ 5, 1],
                [ 1, 2],                [ 4, 2],
    ]
};

/*
const [lavaCanvas, lavaContext] = createCanvasAndContext(64, 80);
const createLavaTiles = async () => {
    await allImagesLoaded();
    drawTintedImage(lavaContext,
        {image: requireImage('gfx/tiles/cloud.png'), x: 0, y: 0, w: 64, h: 80, color: '#F00', amount: 0.6},
        {x: 0, y: 0, w: lavaCanvas.width, h: lavaCanvas.height }
    );
}
createLavaTiles();*/
//debugCanvas(lavaCanvas);
// First tile is 886
const lava: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/lava.png'), x: 0, y: 0, w: 64, h: 80},
    behaviors: {
        'all': { defaultLayer: 'floor2', isLava: true, editorTransparency: 0.3, elementOffsets: {ice: 256} },
    },
};
// First tile is 1142
const lavaStone: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/lavaStone.png'), x: 0, y: 0, w: 64, h: 80},
    behaviors: {
        'all': { defaultLayer: 'floor2', isGround: true, elementOffsets: {fire: -256} },
    },
};

const spiritFloor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/spiritfloor.png'), x: 0, y: 0, w: 80, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor' },
    },
    tileCoordinates: [
        [4, 1],
        [4, 3],
    ],
};
const spiritFloorEdges: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/spiritfloor.png'), x: 0, y: 0, w: 64, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
};



const deletedTileSource: TileSource = solidColorTile('#FF0000', {deleted: true});
function deletedTiles(n: number): TileSource[] {
    return [...new Array(n)].map(() => deletedTileSource);
}
// Add this to ignore if deletedTiles isn't called
deletedTiles;

const solidPitSource: TileSource = solidColorTile('#111111', {pit: true});

addTiles([
    // This is the empty tile.
    singleTileSource('gfx/tiles/bush.png', {defaultLayer: 'field'}, -16),
    singleTileSource('gfx/tiles/bush.png', bushBehavior, 0),
    singleTileSource('gfx/tiles/cactussheet.png', {
        ...bushBehavior,
        throwDamage: 4,
        touchHit: { 
            damage: 1, spiritCloakDamage: 5, 
            hitAllies: true,
            hitEnemies: true,
        },
    }),
    singleTileSource('gfx/tiles/pit.png', pitBehavior),
    singleTileSource('gfx/tiles/thorns.png', thornBehavior),
    singleTileSource('gfx/tiles/rocks.png', lightStoneBehavior),
    singleTileSource('gfx/tiles/rocks.png', lightStoneBehavior, 16),
    singleTileSource('gfx/tiles/rocks.png', heavyStoneBehavior, 80),
    singleTileSource('gfx/tiles/rocks.png', heavyStoneBehavior, 96),
    singleTileSource('gfx/tiles/rocks.png', {
        ...lowWallBehavior,
           linkedOffset: 179,
        }, 160),
    {
        w: 16, h: 16,
        source: {image: requireImage('gfx/tiles/grass.png'), x: 0, y: 0, w: 11 * 16, h: 16},
        behaviors: {
            'all': { linkedOffset: 179, defaultLayer: 'floor2'},
            '0x0': { linkedOffset: 179, defaultLayer: 'floor'},
        }
    },
    singleTileSource('gfx/tiles/bush.png', null, 16),
    singleTileSource('gfx/tiles/thorns.png', null, 16),
    singleTileSource('gfx/tiles/thornsspirit.png', { touchHit: {damage: 1, spiritCloakDamage: 2, isGroundHit: true }, defaultLayer: 'field' }),
    breakableFloor,
    gradientColorTile(['#A08000', '#806000'], 0, 0, 0, 16, southCliffBehavior), // southCliffTop
    solidColorTile('#806000', southernWallBehavior), // cliffBottom
    // This is the 'Abyss' tile for the southern edge of walls, it uses bitmap bottom so the player can
    // go behind it a bit.
    singleTileSource('gfx/tiles/cavearranged.png', { defaultLayer: 'foreground', isVeryTall: true, solidMap: BITMAP_BOTTOM }, 0, 240),
    solidPitSource,
    stampTileSource(rockWallFrame, {
        '0x0': southernWallBehavior, '1x0': southernWallBehavior, '2x0': southernWallBehavior,
        '0x1': southernWallBehavior, '1x1': southernWallBehavior, '2x1': southernWallBehavior,
    }),
    caveFloorPalette,
    // 'Abyss' between walls.
    singleTileSource('gfx/tiles/cavearranged.png', { defaultLayer: 'foreground', isVeryTall: true, solid: true }, 0, 240),
    caveWallsPalette,
    caveCornersPalette,
    spiritPlantsPalette,
    brightGrass,
    floorEyeTile,
    shore,
    shoreAngles,
    cloudAngles,
    vineBase,
    vineMiddle,
    vineTop,
    crackedFloor,
    stairs,
    singleTileSource('gfx/tiles/bushspirit.png', spiritBushBehavior, 0),
    singleTileSource('gfx/tiles/thornsspirit.png', spiritThornBehavior),
    singleTileSource('gfx/tiles/rocksspirit.png', spiritLightStoneBehavior),
    singleTileSource('gfx/tiles/rocksspirit.png', spiritLightStoneBehavior, 16),
    singleTileSource('gfx/tiles/rocksspirit.png', spiritHeavyStoneBehavior, 80),
    singleTileSource('gfx/tiles/rocksspirit.png', spiritHeavyStoneBehavior, 96),
    singleTileSource('gfx/tiles/rocksspirit.png', lowWallBehavior, 160),
    {
        w: 16, h: 16,
        source: {image: requireImage('gfx/tiles/grassspirit.png'), x: 0, y: 0, w: 11 * 16, h: 16},
    },
    singleTileSource('gfx/tiles/bushspirit.png', null, 16),
    singleTileSource('gfx/tiles/thornsspirit.png', null, 16),
    lightCaveWallsPalette,
    lightCaveCornersPalette,
    furnitureCozyTiles,
    furnitureWoodTiles,
    furnitureLampTiles,
    furniturePlantTiles,
    ...deletedTiles(5),
    iceTiles,
    ...deletedTiles(10),
    laundryTiles,
    fireTiles,
    logChoppingTiles,
    foodBoxTiles,
    logAndFoodBagTiles,
    largeLogPileTiles,
    blueHouseTiles,
    greenHouseTiles,
    fenceTiles,
    bridgeHorizontalTiles,
    bridgeVerticalTiles,
    roomFloorTiles,
    clouds,
    railsTiles,
    spiritRailsTiles,
    shallowToDeep,
    shallowToDeepAngles,
    deepToShallow,
    deepToShallowAngles,
    deletedTileSource,
    caveFloorSpiritPalette,
    treeStump,
    treeLeavesTop,
    treeLeaves,
    treeLeavesBottom,
    treeLeavesDoor,
    treeLeavesMerged,
    treeLeavesCorridor,
    treeStumpDoor,
    woodCeiling,
    woodWalls,
    woodFloor,
    woodFloorDecorations,
    woodLedges,
    woodStairs,
    shadows,
    extraWoodWalls,
    caveCeiling,
    caveWalls,
    caveFloor,
    caveFloorEdgesGreen,
    caveFloorEdgesRed,
    caveFloorDecorations,
    caveLedges,
    caveStairs,
    caveCeilingTopAngles,
    lava,
    knobbyTreeStump,
    knobbyTreeLeavesTop,
    knobbyTreeLeaves,
    knobbyTreeLeavesBottom,
    knobbyTreeLeavesDoor,
    knobbyTreeLeavesMerged,
    knobbyTreeLeavesCorridor,
    knobbyTreeStumpDoor,
    crystalCaveCeiling,
    crystalCaveWalls,
    crystalCaveFloor,
    crystalCaveFloorEdges,
    crystalCaveFloorDecorations,
    crystalCaveLedges,
    crystalCaveStairs,
    crystalCaveCeilingTopAngles,
    crystalGrates,
    spiritFloor,
    spiritFloorEdges,
    crystalBeadFloor,
    lavaStone,
]);

// This invalid is in the middle of a bunch of other tiles so it is easiest to just delete after adding it.
allTiles[127] = {
    index: 127,
    frame: deletedTileSource.source,
    behaviors: { deleted: true },
};

