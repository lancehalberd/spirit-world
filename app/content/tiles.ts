import _ from 'lodash';

import { simpleLootTable, lifeLootTable, moneyLootTable } from 'app/content/lootTables';
import { createCanvasAndContext } from 'app/dom';
import { createAnimation } from 'app/utils/animations';
import { requireImage } from 'app/utils/images';

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
    linkableTiles: [183],
    linkedOffset: 181,
};
const lightStoneBehavior: TileBehaviors = {
    defaultLayer: 'field',
    low: true, solid: true, pickupWeight: 1, lootTable: simpleLootTable,
    particles: lightStoneParticles,
    linkableTiles: [185, 186],
    linkedOffset: 179,
};

const heavyStoneBehavior: TileBehaviors = {
    defaultLayer: 'field',
    low: true, solid: true, pickupWeight: 2, lootTable: moneyLootTable,
    particles: heavyStoneParticles,
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
}
const southCliffBehavior: TileBehaviors = {
    jumpDirection: 'down',
    solid: true,
}
const climbableWall: TileBehaviors = {
    defaultLayer: 'field',
    climbable: true,
    solid: true,
}

const spiritBushParticles: Frame[] = createAnimation('gfx/tiles/bushspirit.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
const spiritLightStoneParticles: Frame[] = createAnimation('gfx/tiles/rocksspirit.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
const spiritHeavyStoneParticles: Frame[] = createAnimation('gfx/tiles/rocksspirit.png', {w: 16, h: 16}, {x: 7, cols: 3}).frames;
const spiritThornParticles: Frame[] = createAnimation('gfx/tiles/thornsspirit.png', {w: 16, h: 16}, {x: 2, cols: 5}).frames;
const spiritBushBehavior: TileBehaviors = {
    ...bushBehavior,
    underTile: 201,
    particles: spiritBushParticles,
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

function addTiles(palettes: TileSource[]) {
    const w = 16, h = 16;
    let index = 1;
    for (const palette of palettes) {
        for (let py = 0; py < palette.source.h / h; py ++) {
            for (let px = 0; px < palette.source.w / w; px ++) {
                const behaviors = palette.behaviors?.[`${px}x${py}`] || palette.behaviors?.all;
                if (behaviors?.skipped) {
                    continue;
                }
                allTiles[index] = {
                    index,
                    frame: {
                        image: palette.source.image,
                        x: palette.source.x + px * w,
                        y: palette.source.y + py * h,
                        w,
                        h
                    },
                    behaviors,
                };
                index++;
            }
        }
    }
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

const vineTile = canvasPalette(context => {
        context.fillStyle = 'green';
        context.fillRect(6, 0, 4, 16);
}, climbableWall);
const vineTileBase = canvasPalette(context => {
        context.fillStyle = 'green';
        context.fillRect(6, 0, 4, 6);
}, { defaultLayer: 'field', growTiles: [28]});

const rockWallFrame: Frame = {
    image: requireImage('gfx/tiles/rockwalltiles.png'),
    x: 0, y: 0, w: 48, h: 32,
}


const caveFloorPalette: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavefloor.png'), x: 0, y: 0, w: 336, h: 16},
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

const shallowWaterPalette: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/water.png'), x: 0, y: 0, w: 64, h: 64},
    behaviors: {'all': {defaultLayer: 'field', shallowWater: true}},
};

const deepWaterPalette: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/water.png'), x: 64, y: 0, w: 128, h: 64},
    behaviors: {'all': deepWaterBehavior, '7x3': { skipped: true }},
};
/*
const shallowAngledWaterPalette: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/water.png'), x: 0, y: 64, w: 64, h: 32},
    behaviors: {'2x1': { skipped: true }},
};
const deepAngledWaterPalette: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/water.png'), x: 64, y: 64, w: 128, h: 32},
    behaviors: {'2x1': { skipped: true }, '6x1': { skipped: true }},
};
*/
const comboWaterPalette: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/water.png'), x: 192, y: 0, w: 64, h: 64},
    behaviors: {'all': {defaultLayer: 'field', shallowWater: true}, '3x1': { skipped: true }, '3x2': { skipped: true }, '3x3': { skipped: true }},
};

const spiritPlantParticles = createAnimation('gfx/tiles/spiritplants.png', {w: 16, h: 16}, {x: 5, cols: 4}).frames;

const spiritPlantBehavior: TileBehaviors = {
    defaultLayer: 'field',
    solid: true, pickupWeight: 0, cuttable: 1, lootTable: lifeLootTable,
    underTile: 110,
    particles: spiritPlantParticles,
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

const treeLeaves = canvasPalette((context: CanvasRenderingContext2D) => {
    context.fillStyle = 'green';
    context.fillRect(0, 8, 16, 8);
    context.globalAlpha = 0.6;
    context.arc(8, 8, 8, 0, 2 * Math.PI);
    context.fill();
    context.beginPath();
    context.arc(8, 8, 12, 0, 2 * Math.PI);
    context.fill();
}, { defaultLayer: 'foreground' });

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


const cloudTiles: TileSource = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cloud.png'), x: 0, y: 0, w: 64, h: 96},
    behaviors: {'all': {cloudGround: true, defaultLayer: 'field'}, '2x4': { skipped: true },  '2x5': { skipped: true },  '3x4': { skipped: true },  '3x5': { skipped: true }},
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
    vineTile,
    vineTileBase,
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
    treeLeaves,
    shallowWaterPalette,
    deepWaterPalette,
    //shallowAngledWaterPalette,
    //deepAngledWaterPalette,
    comboWaterPalette,
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
    cloudTiles,
    railsTiles,
    spiritRailsTiles,
]);

