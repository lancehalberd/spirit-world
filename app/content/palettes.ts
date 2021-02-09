import _ from 'lodash';

import { createCanvasAndContext } from 'app/dom';
import { createAnimation } from 'app/utils/animations';
import { allImagesLoaded, requireImage } from 'app/utils/images';

import { Frame, TileBehaviors, TilePalette } from 'app/types';

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

const bushParticles: Frame[] = createAnimation('gfx/tiles/bush.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
const lightStoneParticles: Frame[] = createAnimation('gfx/tiles/rocks.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
const heavyStoneParticles: Frame[] = createAnimation('gfx/tiles/rocks.png', {w: 16, h: 16}, {x: 7, cols: 3}).frames;
const thornParticles: Frame[] = createAnimation('gfx/tiles/thorns.png', {w: 16, h: 16}, {x: 2, cols: 5}).frames;
const bushBehavior: TileBehaviors = {
    solid: true, pickupWeight: 0, cuttable: 1, lootChance: 0.5, lootTypes: ['peach'],
    underTile: {x: 5, y: 1},
    particles: bushParticles,
    linked: true,
};
const lightStoneBehavior: TileBehaviors = {
    low: true, solid: true, pickupWeight: 1, lootChance: 0.2, lootTypes: ['peach'],
    particles: lightStoneParticles,
    linked: true,
};
const heavyStoneBehavior: TileBehaviors = {
    low: true, solid: true, pickupWeight: 1, lootChance: 0.2, lootTypes: ['peach'],
    particles: heavyStoneParticles,
    linked: true,
};
// const wallBehavior: TileBehaviors = { solid: true };
const lowWallBehavior: TileBehaviors = { low: true, solid: true };
const pitBehavior: TileBehaviors = { pit: true };
const thornBehavior: TileBehaviors = {
    low: true, damage: 1, cuttable: 1,
    underTile: {x: 6, y: 1},
    particles: thornParticles,
};

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

function combinePalettes(palettes: TilePalette[]): TilePalette {
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

function drawCombinedPalettes(targetPalette: TilePalette, canvas: HTMLCanvasElement, palettes: TilePalette[]): void {
    const {w, h} = palettes[0];
    const context = canvas.getContext('2d');
    let x = 0, y = 0;
    for (const palette of palettes) {
        for (let py = 0; py < palette.source.h / h; py ++) {
            for (let px = 0; px < palette.source.w / w; px ++) {
                context.drawImage(palette.source.image,
                    palette.source.x + px * w, palette.source.y + py * h, w, h,
                    x * w, y * h, w, h
                );
                const behaviors = palette.behaviors?.[`${px}x${py}`];
                if (behaviors) {
                    targetPalette.behaviors[`${x}x${y}`] = behaviors;
                }
                x++;
                if (x >= canvas.width / w) {
                    x = 0;
                    y ++;
                }
            }
        }
    }
}

function singleTilePalette(source: string, behaviors: TileBehaviors, x = 0, y = 0, w = 16, h = 16): TilePalette {
    return {
        w, h,
        source: {image: requireImage(source), x, y, w, h},
        behaviors: behaviors ? {'0x0': behaviors} : {},
        defaultTiles: []
    };
}

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
