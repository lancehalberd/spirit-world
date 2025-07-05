import {
    BITMAP_BOTTOM,
    BITMAP_BOTTOM_LEFT_8, BITMAP_BOTTOM_LEFT_24, BITMAP_BOTTOM_RIGHT_8, BITMAP_BOTTOM_RIGHT_24,
    BITMAP_TOP_LEFT_8_STRIP, BITMAP_TOP_RIGHT_8_STRIP,
    BITMAP_BOTTOM_LEFT, BITMAP_BOTTOM_RIGHT,
    BITMAP_TOP_LEFT, BITMAP_TOP_RIGHT,
} from 'app/content/bitMasks';
import { createCanvasAndContext } from 'app/utils/canvas';
import { createAnimation } from 'app/utils/animations';
import { requireFrame } from 'app/utils/packedImages';

import { rareLifeLootTable, simpleLootTable, lifeLootTable, moneyLootTable } from 'app/content/lootTables';
import { editingState } from 'app/development/editingState';


export function singleTileSource(
    source: string,
    behaviors: TileBehaviors = null,
    x = 0, y = 0,
    paletteTargets: PaletteTarget[] = []
): TileSource {
    const w = 16, h = 16;
    return {
        w, h,
        source: requireFrame(source, {x, y, w, h}),
        behaviors: behaviors ? {'0x0': behaviors} : {},
        paletteTargets,
    };
}

export const bushParticles: Frame[] = createAnimation('gfx/tiles/bush.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
export const lightStoneParticles: Frame[] = createAnimation('gfx/tiles/rocks.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
export const heavyStoneParticles: Frame[] = createAnimation('gfx/tiles/rocks.png', {w: 16, h: 16}, {x: 7, cols: 3}).frames;
export const crystalParticles: Frame[] = createAnimation('gfx/effects/particles_beads.png', {w: 3, h: 3}, {x: 0, cols: 10}).frames;
// Pot fragments are used as a placeholder.join
export const dirtParticles: Frame[] = createAnimation('gfx/tiles/tippablepot.png', {w: 16, h: 18}, {x: 6, cols: 5}).frames;
const thornParticles: Frame[] = createAnimation('gfx/tiles/thorns.png', {w: 16, h: 16}, {x: 2, cols: 5}).frames;


const spiritBushParticles: Frame[] = createAnimation('gfx/tiles/bushspirit.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
const spiritLightStoneParticles: Frame[] = createAnimation('gfx/tiles/rocksspirit.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
const spiritHeavyStoneParticles: Frame[] = createAnimation('gfx/tiles/rocksspirit.png', {w: 16, h: 16}, {x: 7, cols: 3}).frames;
const spiritThornParticles: Frame[] = createAnimation('gfx/tiles/thornsspirit.png', {w: 16, h: 16}, {x: 2, cols: 5}).frames;
const spiritPlantParticles = createAnimation('gfx/tiles/spiritplants.png', {w: 16, h: 16}, {x: 5, cols: 4}).frames;

export const bushBehavior: TileBehaviors = {
    defaultLayer: 'field',
    solid: true, pickupWeight: 0, cuttable: 1, lootTable: lifeLootTable,
    midHeight: true,
    underTile: 22,
    particles: bushParticles,
    breakSound: 'bushShatter',
    linkableTiles: [183],
    linkedOffset: 181,
};
export const lightStoneBehavior: TileBehaviors = {
    defaultLayer: 'field',
    low: true, solid: true, pickupWeight: 1, lootTable: simpleLootTable,
    throwDamage: 2,
    particles: lightStoneParticles,
    breakSound: 'rockShatter',
    linkableTiles: [185, 186],
    linkedOffset: 179,
};

export const heavyStoneBehavior: TileBehaviors = {
    defaultLayer: 'field',
    low: true, solid: true, pickupWeight: 2, lootTable: moneyLootTable,
    throwDamage: 4,
    particles: heavyStoneParticles,
    breakSound: 'rockShatter',
    linkableTiles: [187, 188],
    linkedOffset: 179,
};
export const lowWallBehavior: TileBehaviors = {
    defaultLayer: 'field',
    low: true,
    solid: true,
};
export const unliftableStoneBehavior: TileBehaviors = {
    ...lowWallBehavior,
    // This is too heavy to pick up without modding the game,
    // but falling rolling stones can still destroy these tiles.
    pickupWeight: 3,
    throwDamage: 8,
    particles: heavyStoneParticles,
    breakSound: 'rockShatter',
    linkedOffset: 179,
};
export const southernWallBehavior: TileBehaviors = {
    solid: true,
    // Wall appear behind the player except over doorways.
    defaultLayer: 'field',
    isSouthernWall: true,
}
export const pitBehavior: TileBehaviors = { defaultLayer: 'field', pit: true, isSingleTilePit: true };
export const thornBehavior: TileBehaviors = {
    defaultLayer: 'field',
    lootTable: rareLifeLootTable,
    low: true, touchHit: {damage: 1, spiritCloakDamage: 5, isGroundHit: true, source: null }, cuttable: 1,
    underTile: 23,
    isGround: true,
    showUnderTile: true,
    particles: thornParticles,
    linkedOffset: 179,
};
export const deepWaterBehavior: TileBehaviors = {
    defaultLayer: 'water',
    water: true,
};
export const climbableWall: TileBehaviors = {
    defaultLayer: 'field',
    climbable: true,
    isSouthernWall: true,
    solid: true,
    //low: true,
};
export const spiritBushBehavior: TileBehaviors = {
    ...bushBehavior,
    underTile: 201,
    particles: spiritBushParticles,
    breakSound: 'bushShatter',
    linkableTiles: [2],
    linkedOffset: 0,
};
export const spiritLightStoneBehavior: TileBehaviors = {
    ...lightStoneBehavior, particles: spiritLightStoneParticles,
    linkableTiles: [6, 7],
    linkedOffset: 0,
};
export const spiritHeavyStoneBehavior: TileBehaviors = {
    ...heavyStoneBehavior, particles: spiritHeavyStoneParticles,
    linkableTiles: [8, 9],
    linkedOffset: 0,
};
export const spiritUnliftableStoneBehavior: TileBehaviors = {
    ...lowWallBehavior,
    // This is too heavy to pick up without modding the game,
    // but falling rolling stones can still destroy these tiles.
    pickupWeight: 3,
    throwDamage: 8,
    particles: heavyStoneParticles,
    breakSound: 'rockShatter',
};
export const spiritThornBehavior: TileBehaviors = {
    ...thornBehavior,
    underTile: 202,
    particles: spiritThornParticles,
};
export const spiritPlantBehavior: TileBehaviors = {
    defaultLayer: 'field',
    solid: true, pickupWeight: 0, cuttable: 1, lootTable: lifeLootTable,
    midHeight: true,
    underTile: 110,
    particles: spiritPlantParticles,
    breakSound: 'bushShatter',
    brightness: 0.6,
    lightRadius: 48,
};


// use `foreground2` as default so that it can appear on top of walls that might be on `foreground`
export const baseCeilingBehavior: TileBehaviors = { defaultLayer: 'foreground2', isVeryTall: true, isGround: false};

export const ceilingBehavior: TileBehaviors = { ...baseCeilingBehavior, solid: true};
export const bottomCeilingBehavior: TileBehaviors = { ...baseCeilingBehavior, solidMap: BITMAP_BOTTOM};
export const bottomLeftCeiling: TileBehaviors = { ...baseCeilingBehavior, solidMap: BITMAP_BOTTOM_LEFT_8};
export const bottomLeftShallowCeiling: TileBehaviors = { ...baseCeilingBehavior, solidMap: BITMAP_BOTTOM_LEFT_24};
export const bottomRightCeiling: TileBehaviors = { ...baseCeilingBehavior, solidMap: BITMAP_BOTTOM_RIGHT_8};
export const bottomRightShallowCeiling: TileBehaviors = { ...baseCeilingBehavior, solidMap: BITMAP_BOTTOM_RIGHT_24};
export const topLeftCeiling: TileBehaviors = { ...baseCeilingBehavior, solidMap: BITMAP_TOP_LEFT_8_STRIP};
export const topRightCeiling: TileBehaviors = { ...baseCeilingBehavior, solidMap: BITMAP_TOP_RIGHT_8_STRIP};

export const topLeftWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT, isSouthernWall: true, isGround: false};
export const topRightWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT, isSouthernWall: true, isGround: false};
export const bottomLeftWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_LEFT, isSouthernWall: true, isGround: false};
export const bottomRightWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_RIGHT, isSouthernWall: true, isGround: false};

const [emptyCanvas] = createCanvasAndContext(16, 16);
export const emptyTile: TileSource = {
    w: 16, h: 16,
    source: {image: emptyCanvas, x: 0, y: 0, w: 16, h: 16},
    behaviors: {'0x0': {defaultLayer: 'field'}},
    paletteTargets: [],
};

export function renderEmptyLedges(context: CanvasRenderingContext2D, tile: FullTile, {x, y}: Point) {
    if (!editingState.isEditing) {
        return;
    }
    context.strokeStyle = 'orange';
    context.lineWidth = 1;
    context.beginPath();
    if (tile.behaviors.ledges?.up) {
        context.moveTo(x + 0.5, y + 0.5);
        context.lineTo(x + 15.5, y + 0.5);
    }
    if (tile.behaviors.ledges?.down) {
        context.moveTo(x + 0.5, y + 15.5);
        context.lineTo(x + 15.5, y + 15.5);
    }
    if (tile.behaviors.ledges?.left) {
        context.moveTo(x + 0.5, y + 0.5);
        context.lineTo(x + 0.5, y + 15.5);
    }
    if (tile.behaviors.ledges?.right) {
        context.moveTo(x + 15.5, y + 0.5);
        context.lineTo(x + 15.5, y + 15.5);
    }
    if (tile.behaviors.diagonalLedge === 'upleft') {
        context.moveTo(x + 0.5, y + 15.5);
        context.lineTo(x + 15.5, y + 0.5);
        context.moveTo(x + 0.5, y + 13.5);
        context.lineTo(x + 13.5, y + 0.5);
    }
    if (tile.behaviors.diagonalLedge === 'downright') {
        context.moveTo(x + 0.5, y + 15.5);
        context.lineTo(x + 15.5, y + 0.5);
        context.moveTo(x + 2.5, y + 15.5);
        context.lineTo(x + 15.5, y + 2.5);
    }
    if (tile.behaviors.diagonalLedge === 'upright') {
        context.moveTo(x + 0.5, y + 0.5);
        context.lineTo(x + 15.5, y + 15.5);
        context.moveTo(x + 2.5, y + 0.5);
        context.lineTo(x + 15.5, y + 13.5);
    }
    if (tile.behaviors.diagonalLedge === 'downleft') {
        context.moveTo(x + 0.5, y + 0.5);
        context.lineTo(x + 15.5, y + 15.5);
        context.moveTo(x + 0.5, y + 2.5);
        context.lineTo(x + 13.5, y + 15.5);
    }
    context.stroke();
}
const baseLedgeBehavior: TileBehaviors = {defaultLayer: 'behaviors', render: renderEmptyLedges};
export const emptyLedgeBehaviors: TileSource = {
    ...emptyTile,
    source: {image: emptyTile.source.image, x: 0, y: 0, w: 80, h: 48},
    behaviors: {
        '0x0': {...baseLedgeBehavior, ledges: {up: true, left: true} },
        '1x0': {...baseLedgeBehavior, ledges: {up: true} },
        '2x0': {...baseLedgeBehavior, ledges: {up: true, right: true} },
        '0x1': {...baseLedgeBehavior, ledges: {left: true} },
        '2x1': {...baseLedgeBehavior, ledges: {right: true} },
        '0x2': {...baseLedgeBehavior, ledges: {down: true, left: true} },
        '1x2': {...baseLedgeBehavior, ledges: {down: true} },
        '2x2': {...baseLedgeBehavior, ledges: {down: true, right: true} },
        '3x0': {...baseLedgeBehavior, diagonalLedge: 'upleft' },
        '4x0': {...baseLedgeBehavior, diagonalLedge: 'upright' },
        '3x1': {...baseLedgeBehavior, diagonalLedge: 'downleft' },
        '4x1': {...baseLedgeBehavior, diagonalLedge: 'downright' },
    },
    paletteTargets: [{key: 'behaviors', x: 0, y: 0}],
    tileCoordinates: [
        [0, 0],[1, 0],[2, 0], [3, 0],[4, 0],
        [0, 1],       [2, 1], [3, 1],[4, 1],
        [0, 2],[1, 2],[2, 2],
    ],
};
export function renderEmptyWall(context: CanvasRenderingContext2D, tile: FullTile, {x, y}: Point) {
    if (!editingState.isEditing) {
        return;
    }
    context.fillStyle = 'red';
    renderBitmap(context, tile, {x, y});
}
export function renderBouncyWall(context: CanvasRenderingContext2D, tile: FullTile, {x, y}: Point) {
    if (!editingState.isEditing) {
        return;
    }
    context.fillStyle = 'purple';
    renderBitmap(context, tile, {x, y});
}
export function renderBitmap(context: CanvasRenderingContext2D, tile: FullTile, {x, y}: Point) {
    if (!editingState.isEditing) {
        return;
    }
    if (tile.behaviors.solid) {
        context.fillRect(x, y, 16, 16);
    } else if (tile.behaviors.solidMap === BITMAP_BOTTOM) {
        context.fillRect(x, y + 8, 16, 8);
    } else if (tile.behaviors.solidMap === BITMAP_BOTTOM_LEFT_24) {
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + 8, y);
        context.lineTo(x + 16, y + 8);
        context.lineTo(x + 16, y + 16);
        context.lineTo(x, y + 16);
        context.fill();
    } else if (tile.behaviors.solidMap === BITMAP_BOTTOM_RIGHT_24) {
        context.beginPath();
        context.moveTo(x, y + 8);
        context.lineTo(x + 8, y);
        context.lineTo(x + 16, y);
        context.lineTo(x + 16, y + 16);
        context.lineTo(x, y + 16);
        context.fill();
    } else if (tile.behaviors.solidMap === BITMAP_TOP_LEFT) {
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + 16, y);
        context.lineTo(x, y + 16);
        context.fill();
    } else if (tile.behaviors.solidMap === BITMAP_TOP_RIGHT) {
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + 16, y);
        context.lineTo(x + 16, y + 16);
        context.fill();
    } else if (tile.behaviors.solidMap === BITMAP_BOTTOM_LEFT) {
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x, y + 16);
        context.lineTo(x + 16, y + 16);
        context.fill();
    } else if (tile.behaviors.solidMap === BITMAP_BOTTOM_RIGHT) {
        context.beginPath();
        context.moveTo(x + 16, y);
        context.lineTo(x + 16, y + 16);
        context.lineTo(x, y + 16);
        context.fill();
    }
}
const baseEmptyWallBehaviors: TileBehaviors = {defaultLayer: 'behaviors', render: renderEmptyWall, solid: false};
export const emptyWallBehaviors: TileSource = {
    ...emptyTile,
    source: {image: emptyTile.source.image, x: 0, y: 0, w: 64, h: 32},
    behaviors: {
        '0x0': {...baseEmptyWallBehaviors, solidMap: BITMAP_TOP_LEFT },
        '1x0': {...baseEmptyWallBehaviors, solidMap: BITMAP_TOP_RIGHT },
        '2x0': {...baseEmptyWallBehaviors, solidMap: BITMAP_BOTTOM_LEFT },
        '3x0': {...baseEmptyWallBehaviors, solidMap: BITMAP_BOTTOM_RIGHT },
        '0x1': {...baseEmptyWallBehaviors, solidMap: BITMAP_BOTTOM_LEFT_24 },
        '1x1': {...baseEmptyWallBehaviors, solidMap: BITMAP_BOTTOM },
        '2x1': {...baseEmptyWallBehaviors, solidMap: BITMAP_BOTTOM_RIGHT_24 },
        '3x1': {...baseEmptyWallBehaviors, solid: true },
    },
    paletteTargets: [{key: 'behaviors', x: 0, y: 3}],
};
const baseBouncyWallBehaviors: TileBehaviors = {defaultLayer: 'behaviors', render: renderBouncyWall, solid: false, touchHit: {damage: 0, source: null, knockbackForce: 0.5}};
export const bouncyWallBehaviors: TileSource = {
    ...emptyTile,
    source: {image: emptyTile.source.image, x: 0, y: 0, w: 80, h: 16},
    behaviors: {
        '0x0': {...baseBouncyWallBehaviors, solidMap: BITMAP_TOP_LEFT },
        '1x0': {...baseBouncyWallBehaviors, solidMap: BITMAP_TOP_RIGHT },
        '2x0': {...baseBouncyWallBehaviors, solidMap: BITMAP_BOTTOM_LEFT },
        '3x0': {...baseBouncyWallBehaviors, solidMap: BITMAP_BOTTOM_RIGHT },
        '4x0': {...baseBouncyWallBehaviors, solid: true },
    },
};


export function canvasPalette(draw: (context: CanvasRenderingContext2D) => void, behaviors: TileBehaviors = null): TileSource {
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
export function solidColorTile(color: string, behaviors: TileBehaviors = null): TileSource {
    return canvasPalette(context => {
        context.fillStyle = color;
        context.fillRect(0, 0, 16, 16);
    }, behaviors);
}

export const deletedTileSource: TileSource = solidColorTile('#FF0000', {deleted: true});
export function deletedTiles(n: number): TileSource {
    return {
        ...deletedTileSource,
        tileCoordinates: [...new Array(n)].map(() => [0, 0]),
    };
}
// Add this to ignore if deletedTiles isn't called
deletedTiles;
