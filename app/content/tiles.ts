import _ from 'lodash';

import { simpleLootTable, lifeLootTable, moneyLootTable } from 'app/content/lootTables';
import { createCanvasAndContext, debugCanvas } from 'app/dom';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { allImagesLoaded, requireImage } from 'app/utils/images';

import { Frame, FullTile, TileBehaviors } from 'app/types';


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

const bushParticles: Frame[] = createAnimation('gfx/tiles/bush.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
const lightStoneParticles: Frame[] = createAnimation('gfx/tiles/rocks.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
const heavyStoneParticles: Frame[] = createAnimation('gfx/tiles/rocks.png', {w: 16, h: 16}, {x: 7, cols: 3}).frames;
const thornParticles: Frame[] = createAnimation('gfx/tiles/thorns.png', {w: 16, h: 16}, {x: 2, cols: 5}).frames;
const bushBehavior: TileBehaviors = {
    defaultLayer: 'field',
    solid: true, pickupWeight: 0, cuttable: 1, lootTable: lifeLootTable,
    underTile: 22,
    particles: bushParticles,
    breakSound: 'bushShatter',
    linkableTiles: [183],
    linkedOffset: 181,
};
const lightStoneBehavior: TileBehaviors = {
    defaultLayer: 'field',
    low: true, solid: true, pickupWeight: 1, lootTable: simpleLootTable,
    particles: lightStoneParticles,
    breakSound: 'rockShatter',
    linkableTiles: [185, 186],
    linkedOffset: 179,
};

const heavyStoneBehavior: TileBehaviors = {
    defaultLayer: 'field',
    low: true, solid: true, pickupWeight: 2, lootTable: moneyLootTable,
    particles: heavyStoneParticles,
    breakSound: 'rockShatter',
    linkableTiles: [187, 188],
    linkedOffset: 179,
};
const wallBehavior: TileBehaviors = {
    solid: true
};
const lowWallBehavior: TileBehaviors = {
    defaultLayer: 'field',
    low: true,
    solid: true,
};
const pitBehavior: TileBehaviors = { defaultLayer: 'field', pit: true };
const thornBehavior: TileBehaviors = {
    defaultLayer: 'field',
    low: true, damage: 1, cuttable: 1,
    underTile: 23,
    particles: thornParticles,
    linkedOffset: 179,
};
const deepWaterBehavior: TileBehaviors = {
    defaultLayer: 'field',
    water: true,
};
const southCliffBehavior: TileBehaviors = {
    jumpDirection: 'down',
    solid: true,
};
const climbableWall: TileBehaviors = {
    defaultLayer: 'field',
    climbable: true,
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
    drawFrame(context, source, source);
    debugCanvas(canvas);
    context.fillStyle = 'red';
    const imageData = context.getImageData(0, 0, source.w, source.h).data;
    //console.log(imageData.length, source.w * source.h * 4);
    const imageMap: {[key: string]: {x: number, y: number}} = {};
    for (let y = 0; y < source.h; y += 16) {
        for (let x = 0; x < source.w; x += 16) {
            // Special exemption for CLIFF graphics.
            if (x >= 368 && (y >= 64 && y < 192)) {
                continue;
            }
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
                imageMap[key] = {x: x / 16, y: y / 16};
            } else {
                context.fillRect(x, y, 16, 16);
            }
        }
    }
    return Object.values(imageMap);
}
/*const allCliffTiles: Frame = {
    image: requireImage('gfx/tiles/cliffwalls.png'),
    x: 0, y: 0,
    //w: 48, h: 48,
    w: 368, h: 288,
};
allImagesLoaded().then(async () => {
    console.log(await findUniqueTiles(allCliffTiles).map(o => `[${o.x},${o.y}]`).join(','));
});*/

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
    behaviors: {all: {linkedOffset: 448}},
};
const caveFloorSpiritPalette: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavefloorspirit.png'), x: 0, y: 0, w: 336, h: 16},
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

const furnitureRugTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/temp_furniture.png'), x: 688, y: 0, w: 4 * 16, h: 4 * 16},
    behaviors: {'all': {water: false, shallowWater: false, slippery: true, elementTiles: {fire: 0}, solid: false, solidMap: null}},
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


const clouds: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cloud.png'), x: 0, y: 0, w: 64, h: 80},
    behaviors: {
        'all': { cloudGround: true, defaultLayer: 'field' },
    },
};
const cloudAngles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cloud.png'), x: 64, y: 0, w: 64, h: 64},
    behaviors: {
        'all': { cloudGround: true, defaultLayer: 'field' },
        '0x0': { skipped: true }, '3x0': { skipped: true },
        '0x3': { skipped: true }, '3x3': { skipped: true },
    },
};

const vineBase: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/vines.png'), x: 48, y: 0, w: 16, h: 16},
    behaviors: {
        'all': { defaultLayer: 'field' },
    },
};
const vineMiddle: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/vines.png'), x: 80, y: 16, w: 16, h: 32},
    behaviors: {
        'all': climbableWall,
    },
};
const vineTop: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/vines.png'), x: 80, y: 48, w: 16, h: 16},
    behaviors: {
        'all': { defaultLayer: 'field' },
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
        'all': { defaultLayer: 'field', solid: true },
    },
};
const treeLeavesTop: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/treesheet.png'), x: 80, y: 0, w: 64, h: 16},
    behaviors: {
        'all': { defaultLayer: 'foreground2' },
    },
};
const treeLeaves: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/treesheet.png'), x: 64, y: 16, w: 96, h: 48},
    behaviors: {
        'all': { defaultLayer: 'foreground' },
    },
};
const treeLeavesBottom: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/treesheet.png'), x: 96, y: 64, w: 32, h: 16},
    behaviors: {
        'all': { defaultLayer: 'foreground' },
    },
};
const treeLeavesDoor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/treesheet.png'), x: 16, y: 96, w: 32, h: 16},
    behaviors: {
        'all': { defaultLayer: 'foreground' },
    },
};
const treeLeavesMerged: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/treesheet.png'), x: 160, y: 16, w: 32, h: 48},
    behaviors: {
        'all': { defaultLayer: 'foreground' },
    },
};
const treeLeavesCorridor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/treesheet.png'), x: 224, y: 16, w: 16, h: 48},
    behaviors: {
        'all': { defaultLayer: 'foreground' },
    },
};
const treeStumpDoor: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/treesheet.png'), x: 64, y: 96, w: 64, h: 32},
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

const stairs: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/exteriorstairs.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[2,2],[0,3],[1,3],[2,3]]
};

const cliffs: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cliffwalls.png'), x: 0, y: 0, w: 48, h: 64},
    behaviors: {
        // use `floor2` as default so that the edges of these can appear on top of textured floor
        'all': { defaultLayer: 'floor2', solid: true },
        '4x2': { defaultLayer: 'floor2', solid: true, jumpDirection: 'up' },
        '2x3': { defaultLayer: 'floor2', solid: true, jumpDirection: 'left' },
        '6x3': { defaultLayer: 'floor2', solid: true, jumpDirection: 'right' },
        '4x6': { defaultLayer: 'floor2', solid: true, jumpDirection: 'down' },
        // Eventually would want to add solidMap behaviors for all the angled tiles here as well.
    },
    tileCoordinates: [
        [0,0],[1,0],[8,0],             [9,0],[11,0],[17,0],
        [0,1],[1,1],[2,1],[7,1],[8,1], [10,1],[13,1],[16,1],
        [1,2],[4,2],[7,2],             [9,2],[11,2],[13,2],[15,2],[17,2],  [18,2],[19,2],[20,2],[21,2],
        [2,3],[6,3],[8,3],             [11,3],[15,3],                      [18,3],[19,3],[20,3],[21,3],
                                                                           [18,4], [19,4],[20,4],[21,4],
                                                                           [18,5],[19,5],[20,5],
        [2,6],[4,6],[6,6],             [11,6],[12,6],[15,6],               [18,6],[19,6],[20,6],[22,6],
                                       [10,7],[16,7],                      [18,7],[19,7],
        [0,8],[4,8],[8,8],             [9,8],[10,8],[17,8],                [18,8],[19,8],

        [0,9],[1,9],[8,9],  [10,9],[13,9],[16,9],[19,9],
        [0,10],[8,10],      [10,10],[11,10],[12,10],[13,10],[16,10],[17,10],[18,10],[19,10],
                            [9,11],[10,11],[13,11],[14,11],[15,11],[16,11],[19,11],[20,11],
                            [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],[17,12],[18,12],[19,12],[20,12],
                            [9,13],[10,13],[11,13],[12,13],[14,13],[15,13],[16,13],[17,13],[18,13],[19,13],[20,13],
                            [10,14],[11,14],[12,14],[16,14],[17,14],[18,14],
                            [10,15],[11,15],[12,15],[13,15],[16,15],[17,15],[18,15],[19,15],
        [0,17],[1,17],[8,17]
    ],
};



/*const newCliffTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/CLIFF.png'), x: 0, y: 0, w: 560, h: 400},
    behaviors: {
        'all': { defaultLayer: 'floor2', solid: true, low: false },
    },
    tileCoordinates: [
        [0,0],[1,0],[4,0],[5,0],[8,0],[9,0],[10,0],[11,0],[13,0],[19,0],[20,0],[21,0],
        [22,0],[23,0],[28,0],[29,0], [30,0],[31,0],[32,0],[0,1],[1,1],[2,1],[7,1],[8,1],
        [9,1],[10,1],[13,1],[19,1],[23,1],[28,1],[29,1],[31,1],[32,1],[1,2],[3,2],[4,2],
        [7,2],[9,2],[13,2],[17,2],[18,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2],[26,2],
        [27,2],[33,2],[34,2],[0,3],[2,3],[3,3],[6,3],[8,3],[9,3],[13,3],[20,3],[21,3],
        [22,3],[23,3],[0,4],[2,4],[6,4],[8,4],[9,4],[10,4],[13,4],[16,4],[19,4],[20,4],
        [21,4],[22,4],[2,5],[6,5],[9,5],[10,5],[12,5],[13,5],[16,5],[17,5],[18,5],[19,5],
        [20,5],[21,5],[22,5],[0,6],[2,6],[3,6],[4,6],[6,6],[8,6],[9,6],[10,6],[11,6],
        [14,6],[17,6],[18,6],[20,6],[22,6],[2,7],[7,7],[11,7],[14,7],[17,7],[18,7],[20,7],
        [21,7],[22,7],[0,8],[1,8],[4,8],[5,8],[8,8],[12,8],[13,8],[16,8],[17,8],[18,8],
        [19,8],[20,8],[21,8],[22,8],[0,9],[1,9],[3,9],[4,9],[6,9],[8,9],[11,9],[13,9],
        [16,9],[17,9],[18,9],[19,9],[0,10],[1,10],[2,10],[7,10],[8,10],[2,11],[3,11],
        [4,11],[6,11],[9,11],[15,11],[2,12],[6,12],[9,12],[10,12],[14,12],[15,12],[19,12],
        [20,12],[21,12],[22,12],[23,12],[24,12],[25,12],[26,12],[9,13],[15,13],[19,13],
        [22,13],[23,13],[26,13],[29,13],[30,13],[31,13],[32,13],[2,14],[6,14],[11,14],
        [12,14],[13,14],[19,14],[22,14],[23,14],[26,14],[29,14],[30,14],[31,14],[32,14],
        [2,15],[3,15],[6,15],[19,15],[20,15],[21,15],[22,15],[23,15],[24,15],[25,15],
        [26,15],[28,15],[29,15],[32,15],[33,15],[1,16],[7,16],[28,16],[29,16],[32,16],
        [33,16],[0,17],[1,17],[2,17],[8,17],[19,17],[20,17],[24,17],[25,17],[28,17],
        [29,17],[30,17],[31,17],[32,17],[33,17],[0,18],[1,18],[2,18],[3,18],[4,18],[5,18],
        [7,18],[10,18],[13,18],[16,18],[19,18],[20,18],[24,18],[25,18],[30,18],[31,18],
        [0,19],[1,19],[2,19],[3,19],[7,19],[8,19],[9,19],[10,19],[13,19],[14,19],[15,19],
        [16,19],[21,19],[22,19],[23,19],[24,19],[25,19],[27,19],[28,19],[0,20],[1,20],
        [2,20],[3,20],[6,20],[7,20],[10,20],[11,20],[12,20],[13,20],[16,20],[17,20],[21,20],
        [25,20],[27,20],[28,20],[0,21],[1,21],[2,21],[6,21],[7,21],[8,21],[9,21],[10,21],
        [11,21],[12,21],[13,21],[14,21],[15,21],[16,21],[17,21],[19,21],[20,21],[26,21],
        [27,21],[0,22],[1,22],[2,22],[6,22],[7,22],[8,22],[9,22],[11,22],[12,22],[13,22],
        [14,22],[15,22],[17,22],[19,22],[20,22],[22,22],[23,22],[24,22],[25,22],[26,22],
        [0,23],[1,23],[7,23],[8,23],[9,23],[13,23],[14,23],[15,23],[19,23],[20,23],[22,23],
        [26,23],[0,24],[1,24],[7,24],[8,24],[9,24],[10,24],[13,24],[14,24],[15,24],[16,24],
        [20,24],[21,24],[27,24],[28,24]
    ],
};*/


const deletedTileSource: TileSource = solidColorTile('#FF0000');
function deletedTiles(n: number): TileSource[] {
    return [...new Array(n)].map(() => deletedTileSource);
}

addTiles([
    // This is the empty tile.
    singleTileSource('gfx/tiles/bush.png', {defaultLayer: 'field'}, -16),
    singleTileSource('gfx/tiles/bush.png', bushBehavior, 0),
    singleTileSource('gfx/tiles/cactussheet.png', {...bushBehavior, damage: 1}),
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
            'all': { linkedOffset: 179}
        }
    },
    singleTileSource('gfx/tiles/bush.png', null, 16),
    singleTileSource('gfx/tiles/thorns.png', null, 16),
    solidColorTile('#0000FF', deepWaterBehavior), // deep water
    solidColorTile('#A0A0FF'), // shallow water
    gradientColorTile(['#A08000', '#806000'], 0, 0, 0, 16, southCliffBehavior), // southCliffTop
    solidColorTile('#806000', wallBehavior), // cliffBottom
    ...deletedTiles(2),
    stampTileSource(rockWallFrame, {
        '0x0': wallBehavior, '1x0': wallBehavior, '2x0': wallBehavior,
        '0x1': wallBehavior, '1x1': wallBehavior, '2x1': wallBehavior,
    }),
    caveFloorPalette,
    singleTileSource('gfx/tiles/cavewalls.png', { solid: true }), // 'Abyss' between walls
    caveWallsPalette,
    caveCornersPalette,
    spiritPlantsPalette,
    brightGrass,
    ...deletedTiles(1),
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
    furnitureRugTiles,
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
    caveFloorSpiritPalette,
    treeStump,
    treeLeavesTop,
    treeLeaves,
    treeLeavesBottom,
    treeLeavesDoor,
    treeLeavesMerged,
    treeLeavesCorridor,
    treeStumpDoor,
    cliffs,
]);

