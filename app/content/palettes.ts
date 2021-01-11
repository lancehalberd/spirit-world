import _ from 'lodash';

import { createCanvasAndContext } from 'app/dom';
import { createAnimation } from 'app/utils/animations';
import { allImagesLoaded, requireImage } from 'app/utils/images';

import { TileBehaviors, TilePalette } from 'app/types';

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

const bushBehavior: TileBehaviors = {solid: true, pickupWeight: 0, cuttable: 1, lootChance: 0.5, lootTypes: ['peach'] };
const lightStoneBehavior: TileBehaviors = {solid: true, pickupWeight: 1, lootChance: 0.2, lootTypes: ['peach']};
const heavyStoneBehavior: TileBehaviors = {solid: true, pickupWeight: 1, lootChance: 0.2, lootTypes: ['peach']};
const solidBehavior: TileBehaviors = { solid: true };
const pitBehavior: TileBehaviors = { pit: true };
const thornBehavior: TileBehaviors = { damage: 1, cuttable: 1 };

export const [mapTilesFrame] = createAnimation('gfx/tiles/overworld.png', {w: 384, h: 640}).frames;
/*const worldMapPalette: TilePalette = {
    w: 16, h: 16,
    // The source frame of the tiles.
    source: mapTilesFrame,
    // Array of tiles to randomly apply by default.
    defaultTiles: [{x: 0, y: 16}, {x: 1, y: 16}, {x: 2, y: 16}, {x: 3, y: 16}],
    behaviors: {
        '0x7': {solidMap: BITMAP_TOP_RIGHT},
        '1x1': {solidMap: BITMAP_TOP},
        '1x4': {solidMap: BITMAP_BOTTOM},
        '5x6': {solidMap: BITMAP_LEFT},
        '3x7': {solidMap: BITMAP_RIGHT},
        '11x3': pitBehavior,
        '16x8': {...lightStoneBehavior, underTile: {x: 1, y: 8}},
        '16x9': {...lightStoneBehavior, underTile: {x: 1, y: 9}},
        '16x10': {...lightStoneBehavior, underTile: {x: 1, y: 10}},
        '17x8': {...heavyStoneBehavior, underTile: {x: 1, y: 8}},
        '17x9': {...heavyStoneBehavior, underTile: {x: 1, y: 9}},
        '17x10': {...heavyStoneBehavior, underTile: {x: 1, y: 10}},
        '18x8': {...heavyStoneBehavior, underTile: {x: 1, y: 8}},
        '18x9': {...heavyStoneBehavior, underTile: {x: 1, y: 9}},
        '18x10': {...heavyStoneBehavior, underTile: {x: 1, y: 10}},
        '5x8': solidBehavior,
        '5x9': solidBehavior,
        '5x10': solidBehavior,
        '6x8': {...bushBehavior, underTile: {x: 0, y: 16}},
        '6x9': {...bushBehavior, underTile: {x: 1, y: 23}},
        '6x10': {...bushBehavior, underTile: {x: 13, y: 13}},
        '7x8': {...thornBehavior, underTile: {x: 0, y: 16}},
        '7x9': {...thornBehavior, underTile: {x: 1, y: 23}},
        '7x10': {...thornBehavior, underTile: {x: 13, y: 13}},
    },
};*/

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
        singleTilePalette('gfx/tiles/bushes.png', null, -16),
        singleTilePalette('gfx/tiles/bushes.png', bushBehavior, 16),
        singleTilePalette('gfx/tiles/cactussheet.png', {...bushBehavior, damage: 1}),
        singleTilePalette('gfx/tiles/pit.png', pitBehavior),
        singleTilePalette('gfx/tiles/thornstiles.png', thornBehavior),
        singleTilePalette('gfx/tiles/rocks.png', lightStoneBehavior),
        singleTilePalette('gfx/tiles/rocks.png', lightStoneBehavior, 16),
        singleTilePalette('gfx/tiles/rocks.png', heavyStoneBehavior, 80),
        singleTilePalette('gfx/tiles/rocks.png', heavyStoneBehavior, 96),
        singleTilePalette('gfx/tiles/rocks.png', solidBehavior, 160),
        {
            w: 16, h: 16,
            source: {image: requireImage('gfx/tiles/grass.png'), x: 0, y: 0, w: 11 * 16, h: 16},
            defaultTiles: [],
        }
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
const floorPalette = {...fieldPalette, defaultTiles: [{x: 10, y: 0}]}

export const palettes: {[key: string]: TilePalette} = {
    field: fieldPalette,
    floor: floorPalette
};
