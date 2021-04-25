import _ from 'lodash';

import { simpleLootTable, lifeLootTable, moneyLootTable } from 'app/content/lootTables';
import { createCanvasAndContext } from 'app/dom';
import { createAnimation } from 'app/utils/animations';
import { allImagesLoaded, requireImage } from 'app/utils/images';

import { Frame, Tile, TileBehaviors, TilePalette } from 'app/types';

export const BITMAP_TOP_RIGHT: Uint16Array = new Uint16Array([
    0xFFFF, 0x7FFF, 0x3FFF, 0x1FFF, 0x0FFF, 0x07FF, 0x03FF, 0x01FF,
    0x00FF, 0x007F, 0x003F, 0x001F, 0x000F, 0x0007, 0x0003, 0x0001,
]);

export const BITMAP_TOP: Uint16Array = new Uint16Array([
    0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF,
    0, 0, 0, 0, 0, 0, 0, 0,
]);
export const BITMAP_BOTTOM: Uint16Array = new Uint16Array([
    0, 0, 0, 0, 0, 0, 0, 0,
    0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF,
]);
export const BITMAP_LEFT: Uint16Array = new Uint16Array([
    0xFF00, 0xFF00, 0xFF00, 0xFF00, 0xFF00, 0xFF00, 0xFF00, 0xFF00,
    0xFF00, 0xFF00, 0xFF00, 0xFF00, 0xFF00, 0xFF00, 0xFF00, 0xFF00,
]);
export const BITMAP_RIGHT: Uint16Array = new Uint16Array([
    0x00FF, 0x00FF, 0x00FF, 0x00FF, 0x00FF, 0x00FF, 0x00FF, 0x00FF,
    0x00FF, 0x00FF, 0x00FF, 0x00FF, 0x00FF, 0x00FF, 0x00FF, 0x00FF,
]);


export const BITMAP_TOP_12: Uint16Array = new Uint16Array([
    0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF,
    0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0, 0, 0, 0,
]);
export const BITMAP_BOTTOM_12: Uint16Array = new Uint16Array([
    0, 0, 0, 0, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF,
    0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF,
]);
export const BITMAP_LEFT_12: Uint16Array = new Uint16Array([
    0xFFF0, 0xFFF0, 0xFFF0, 0xFFF0, 0xFFF0, 0xFFF0, 0xFFF0, 0xFFF0,
    0xFFF0, 0xFFF0, 0xFFF0, 0xFFF0, 0xFFF0, 0xFFF0, 0xFFF0, 0xFFF0,
]);
export const BITMAP_RIGHT_12: Uint16Array = new Uint16Array([
    0x0FFF, 0x0FFF, 0x0FFF, 0x0FFF, 0x0FFF, 0x0FFF, 0x0FFF, 0x0FFF,
    0x0FFF, 0x0FFF, 0x0FFF, 0x0FFF, 0x0FFF, 0x0FFF, 0x0FFF, 0x0FFF,
]);

const bushParticles: Frame[] = createAnimation('gfx/tiles/bush.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
const lightStoneParticles: Frame[] = createAnimation('gfx/tiles/rocks.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
const heavyStoneParticles: Frame[] = createAnimation('gfx/tiles/rocks.png', {w: 16, h: 16}, {x: 7, cols: 3}).frames;
const thornParticles: Frame[] = createAnimation('gfx/tiles/thorns.png', {w: 16, h: 16}, {x: 2, cols: 5}).frames;
const bushBehavior: TileBehaviors = {
    solid: true, pickupWeight: 0, cuttable: 1, lootTable: lifeLootTable,
    underTile: {x: 5, y: 1},
    particles: bushParticles,
    linked: true,
};
const lightStoneBehavior: TileBehaviors = {
    low: true, solid: true, pickupWeight: 1, lootTable: simpleLootTable,
    particles: lightStoneParticles,
    linked: true,
};
const heavyStoneBehavior: TileBehaviors = {
    low: true, solid: true, pickupWeight: 1, lootTable: moneyLootTable,
    particles: heavyStoneParticles,
    linked: true,
};
const wallBehavior: TileBehaviors = { solid: true };
const lowWallBehavior: TileBehaviors = { low: true, solid: true };
const pitBehavior: TileBehaviors = { pit: true };
const thornBehavior: TileBehaviors = {
    low: true, damage: 1, cuttable: 1,
    underTile: {x: 6, y: 1},
    particles: thornParticles,
};
const deepWaterBehavior: TileBehaviors = {
    water: true,
}
const southCliffBehavior: TileBehaviors = {
    jumpDirection: 'down',
    solid: true,
    low: true,
}
const climbableWall: TileBehaviors = {
    climbable: true,
    solid: true,
    low: true,
}

const spiritBushParticles: Frame[] = createAnimation('gfx/tiles/bushspirit.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
const spiritLightStoneParticles: Frame[] = createAnimation('gfx/tiles/rocksspirit.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
const spiritHeavyStoneParticles: Frame[] = createAnimation('gfx/tiles/rocksspirit.png', {w: 16, h: 16}, {x: 7, cols: 3}).frames;
const spiritThornParticles: Frame[] = createAnimation('gfx/tiles/thornsspirit.png', {w: 16, h: 16}, {x: 2, cols: 5}).frames;
const spiritBushBehavior: TileBehaviors = {
    ...bushBehavior, particles: spiritBushParticles,
};
const spiritLightStoneBehavior: TileBehaviors = {
    ...lightStoneBehavior, particles: spiritLightStoneParticles,
};
const spiritHeavyStoneBehavior: TileBehaviors = {
    ...heavyStoneBehavior, particles: spiritHeavyStoneParticles,
};
const spiritThornBehavior: TileBehaviors = {
    ...thornBehavior, particles: spiritThornParticles,
};


interface TilePaletteStamp extends TilePalette {
    isStamp?: boolean
}

function combinePalettes(palettes: TilePaletteStamp[]): TilePalette {
    const size = 16;
    let totalTiles: number = palettes.reduce(
        (sum, palette) => sum + (palette.source.w / size) * (palette.source.h / size), 0);
    const w = 16, h = Math.ceil(totalTiles / 16);
    // Don't draw the combined palettes until all images have loaded.
    const [canvas] = createCanvasAndContext(w * 16, h * 16);
    // document.body.append(canvas);
    const targetPalette: TilePalette = {
        w: 16, h: 16,
        source: {image: canvas, x: 0, y: 0, w: canvas.width, h: canvas.height},
        behaviors: {},
        defaultTiles: [{x: 0, y: 0}]
    };
    async function populatePaletteOnLoad() {
        await allImagesLoaded();
        drawCombinedPalettes(targetPalette, canvas, palettes);
    }
    populatePaletteOnLoad();
    return targetPalette;
}

function drawCombinedPalettes(targetPalette: TilePalette, canvas: HTMLCanvasElement, palettes: TilePaletteStamp[]): void {
    const {w, h} = palettes[0];
    const context = canvas.getContext('2d');
    let x = 0, y = 0;
    for (const palette of palettes) {
        const stamp: Tile[][] = [];
        for (let py = 0; py < palette.source.h / h; py ++) {
            stamp[py] = [];
            for (let px = 0; px < palette.source.w / w; px ++) {
                context.drawImage(palette.source.image,
                    palette.source.x + px * w, palette.source.y + py * h, w, h,
                    x * w, y * h, w, h
                );
                const behaviors = palette.behaviors?.[`${px}x${py}`] || palette.behaviors?.all;
                if (behaviors?.skipped) {
                    continue;
                }
                if (behaviors) {
                    targetPalette.behaviors[`${x}x${y}`] = behaviors;
                }
                stamp[py][x] = {x, y};
                x++;
                if (x >= canvas.width / w) {
                    x = 0;
                    y ++;
                }
            }
        }
        if (palette.isStamp) {
            targetPalette.stamps = targetPalette.stamps || [];
            targetPalette.stamps.push(stamp);
        }
    }
}

function singleTilePalette(source: string, behaviors: TileBehaviors = null, x = 0, y = 0, w = 16, h = 16): TilePalette {
    return {
        w, h,
        source: {image: requireImage(source), x, y, w, h},
        behaviors: behaviors ? {'0x0': behaviors} : {},
        defaultTiles: []
    };
}

function stampTilePallete(frame: Frame, behaviors: {[key: string]: TileBehaviors} = {}): TilePaletteStamp {
    return {
        w: 16, h: 16,
        source: frame,
        behaviors,
        defaultTiles: [],
        isStamp: true,
    };
}
function canvasPalette(draw: (context: CanvasRenderingContext2D) => void, behaviors: TileBehaviors = null): TilePalette {
    const [canvas, context] = createCanvasAndContext(16, 16);
    draw(context);
    /*canvas.style.position = 'absolute';
    canvas.style.top = '0';
    document.body.append(canvas);*/
    return {
        w: 16, h: 16,
        source: {image: canvas, x: 0, y: 0, w: 16, h: 16},
        behaviors: behaviors ? {'0x0': behaviors} : {},
        defaultTiles: []
    };
}
function solidColorTile(color: string, behaviors: TileBehaviors = null): TilePalette {
    return canvasPalette(context => {
        context.fillStyle = color;
        context.fillRect(0, 0, 16, 16);
    }, behaviors);
}
function gradientColorTile(colors: string[], x0, y0, x1, y1, behaviors: TileBehaviors = null): TilePalette {
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
}, { growTiles: [{x: 11, y: 1}]});

const rockWallFrame: Frame = {
    image: requireImage('gfx/tiles/rockwalltiles.png'),
    x: 0, y: 0, w: 48, h: 32,
}


const caveFloorPalette: TilePalette = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavefloor.png'), x: 0, y: 0, w: 336, h: 16},
    behaviors: {},
    defaultTiles: [{x: 0, y: 0}]
};

const caveCornersPalette: TilePalette = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavewalls.png'), x: 32, y: 0, w: 8 * 32, h: 32},
    behaviors: {'all': {solid: true}},
    defaultTiles: [{x: 0, y: 0}]
};
const caveWallsPalette: TilePalette = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/cavewalls.png'), x: 0, y: 32, w: 32, h: 4 * 32},
    behaviors: {'all': {solid: true}},
    defaultTiles: [{x: 0, y: 0}]
};

const shallowWaterPalette: TilePalette = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/water.png'), x: 0, y: 0, w: 64, h: 64},
    // Currently shallow water has no special behavior.
    behaviors: {},
    defaultTiles: []
};

const deepWaterPalette: TilePalette = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/water.png'), x: 64, y: 0, w: 128, h: 64},
    // Currently shallow water has no special behavior.
    behaviors: {'all': deepWaterBehavior, '7x3': { skipped: true }},
    defaultTiles: []
};

const shallowAngledWaterPalette: TilePalette = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/water.png'), x: 0, y: 64, w: 64, h: 32},
    // Currently shallow water has no special behavior.
    behaviors: {'2x1': { skipped: true }},
    defaultTiles: []
};
const deepAngledWaterPalette: TilePalette = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/water.png'), x: 64, y: 64, w: 128, h: 32},
    // Currently shallow water has no special behavior.
    behaviors: {'2x1': { skipped: true }, '6x1': { skipped: true }},
    defaultTiles: []
};

const comboWaterPalette: TilePalette = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/water.png'), x: 192, y: 0, w: 64, h: 96},
    // Currently shallow water has no special behavior.
    behaviors: {'2x5': { skipped: true }, '3x1': { skipped: true }, '3x2': { skipped: true }, '3x3': { skipped: true }},
    defaultTiles: []
};


const spiritPlantParticles = createAnimation('gfx/tiles/spiritplants.png', {w: 16, h: 16}, {x: 5, cols: 4}).frames;

const spiritPlantBehavior = {
    solid: true, pickupWeight: 0, cuttable: 1, lootTable: lifeLootTable,
    underTile: {x: 5, y: 1},
    particles: spiritPlantParticles,
    brightness: 0.6,
    lightRadius: 48,
};
const spiritPlantsPalette: TilePalette = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/spiritplants.png'), x: 0, y: 0, w: 5 * 16, h: 16},
    behaviors: {
        '0x0': spiritPlantBehavior,
        '1x0': spiritPlantBehavior,
        '2x0': {brightness: 0.4, lightRadius: 24},
        '3x0': {brightness: 0.4, lightRadius: 24},
    },
    defaultTiles: [{x: 0, y: 0}]
};
const brightGrass: TilePalette = {
    w: 16, h: 16,
    source: {image: requireImage('gfx/tiles/grass.png'), x: 0, y: 0, w: 11 * 16, h: 16},
    defaultTiles: [],
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
});

const fieldPalette = {...combinePalettes([
        // This is the empty tile.
        singleTilePalette('gfx/tiles/bush.png', null, -16),
        singleTilePalette('gfx/tiles/bush.png', bushBehavior, 0),
        singleTilePalette('gfx/tiles/cactussheet.png', {...bushBehavior, damage: 1}),
        singleTilePalette('gfx/tiles/pit.png', pitBehavior),
        singleTilePalette('gfx/tiles/thorns.png', thornBehavior),
        singleTilePalette('gfx/tiles/rocks.png', lightStoneBehavior),
        singleTilePalette('gfx/tiles/rocks.png', lightStoneBehavior, 16),
        singleTilePalette('gfx/tiles/rocks.png', heavyStoneBehavior, 80),
        singleTilePalette('gfx/tiles/rocks.png', heavyStoneBehavior, 96),
        singleTilePalette('gfx/tiles/rocks.png', lowWallBehavior, 160),
        {
            w: 16, h: 16,
            source: {image: requireImage('gfx/tiles/grass.png'), x: 0, y: 0, w: 11 * 16, h: 16},
            defaultTiles: [],
        },
        singleTilePalette('gfx/tiles/bush.png', null, 16),
        singleTilePalette('gfx/tiles/thorns.png', null, 16),
        solidColorTile('#0000FF', deepWaterBehavior), // deep water
        solidColorTile('#A0A0FF'), // shallow water
        gradientColorTile(['#A08000', '#806000'], 0, 0, 0, 16, southCliffBehavior), // southCliffTop
        solidColorTile('#806000', lowWallBehavior), // cliffBottom
        vineTile,
        vineTileBase,
        stampTilePallete(rockWallFrame, {
            '0x0': wallBehavior, '1x0': wallBehavior, '2x0': wallBehavior,
            '0x1': wallBehavior, '1x1': wallBehavior, '2x1': wallBehavior,
        }),
        caveFloorPalette,
        singleTilePalette('gfx/tiles/cavewalls.png', { solid: true }), // 'Abyss' between walls
        caveWallsPalette,
        caveCornersPalette,
        spiritPlantsPalette,
        brightGrass,
        treeLeaves,
        shallowWaterPalette,
        deepWaterPalette,
        shallowAngledWaterPalette,
        deepAngledWaterPalette,
        comboWaterPalette,
    ]),
    defaultTiles: [
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},
        {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0},

        {x: 11, y: 0}, {x: 12, y: 0}, {x: 13, y: 0},{x: 14, y: 0}, {x: 15, y: 0},
        {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1},
    ]
};
const floorPalette = {...fieldPalette, defaultTiles: [{x: 10, y: 0}]};
const spiritFieldPalette = {...combinePalettes([
        // This is the empty tile.
        singleTilePalette('gfx/tiles/bushspirit.png', null, -16),
        singleTilePalette('gfx/tiles/bushspirit.png', spiritBushBehavior, 0),
        // No spirit version of this tile
        singleTilePalette('gfx/tiles/cactussheet.png', {...spiritBushBehavior, damage: 1}),
        // No spirit version of this tile
        singleTilePalette('gfx/tiles/pit.png', pitBehavior),
        singleTilePalette('gfx/tiles/thornsspirit.png', spiritThornBehavior),
        singleTilePalette('gfx/tiles/rocksspirit.png', spiritLightStoneBehavior),
        singleTilePalette('gfx/tiles/rocksspirit.png', spiritLightStoneBehavior, 16),
        singleTilePalette('gfx/tiles/rocksspirit.png', spiritHeavyStoneBehavior, 80),
        singleTilePalette('gfx/tiles/rocksspirit.png', spiritHeavyStoneBehavior, 96),
        singleTilePalette('gfx/tiles/rocksspirit.png', lowWallBehavior, 160),
        {
            w: 16, h: 16,
            source: {image: requireImage('gfx/tiles/grassspirit.png'), x: 0, y: 0, w: 11 * 16, h: 16},
            defaultTiles: [],
        },
        singleTilePalette('gfx/tiles/bushspirit.png', null, 16),
        singleTilePalette('gfx/tiles/thornsspirit.png', null, 16),
        solidColorTile('#8080FF', deepWaterBehavior), // deep water
        solidColorTile('#D0D0FF'), // shallow water
        gradientColorTile(['#A08000', '#806000'], 0, 0, 0, 16, southCliffBehavior), // southCliffTop
        solidColorTile('#806000', lowWallBehavior), // cliffBottom
        vineTile,
        vineTileBase,
        stampTilePallete(rockWallFrame, {
            '0x0': wallBehavior, '1x0': wallBehavior, '2x0': wallBehavior,
            '0x1': wallBehavior, '1x1': wallBehavior, '2x1': wallBehavior,
        }),
        caveFloorPalette,
        singleTilePalette('gfx/tiles/cavewalls.png', { solid: true }), // 'Abyss' between walls
        caveWallsPalette,
        caveCornersPalette,
        spiritPlantsPalette,
        brightGrass,
        treeLeaves,
        shallowWaterPalette,
        deepWaterPalette,
        shallowAngledWaterPalette,
        deepAngledWaterPalette,
        comboWaterPalette,
    ]),
    defaultTiles: [null]
};
const spiritFloorPalette = {...spiritFieldPalette, defaultTiles: [null]};


export const palettes: {[key: string]: TilePalette} = {
    field: fieldPalette,
    floor: floorPalette,
    spiritField: spiritFieldPalette,
    spiritFloor: spiritFloorPalette,
};
