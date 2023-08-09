import {
    BITMAP_BOTTOM,
    BITMAP_BOTTOM_LEFT_8, BITMAP_BOTTOM_RIGHT_8,
    BITMAP_TOP_LEFT_8_STRIP, BITMAP_TOP_RIGHT_8_STRIP,
    BITMAP_BOTTOM_LEFT, BITMAP_BOTTOM_RIGHT,
    BITMAP_TOP_LEFT, BITMAP_TOP_RIGHT,
} from 'app/content/bitMasks';
import { createAnimation } from 'app/utils/animations';

import { rareLifeLootTable, simpleLootTable, lifeLootTable, moneyLootTable } from 'app/content/lootTables';



export const bushParticles: Frame[] = createAnimation('gfx/tiles/bush.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
export const lightStoneParticles: Frame[] = createAnimation('gfx/tiles/rocks.png', {w: 16, h: 16}, {x: 2, cols: 3}).frames;
export const heavyStoneParticles: Frame[] = createAnimation('gfx/tiles/rocks.png', {w: 16, h: 16}, {x: 7, cols: 3}).frames;
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
export const southernWallBehavior: TileBehaviors = {
    solid: true,
    // Wall appear behind the player except over doorways.
    defaultLayer: 'field',
    isSouthernWall: true,
}
export const lowWallBehavior: TileBehaviors = {
    defaultLayer: 'field',
    low: true,
    solid: true,
};
export const pitBehavior: TileBehaviors = { defaultLayer: 'field', pit: true };
export const thornBehavior: TileBehaviors = {
    defaultLayer: 'field',
    lootTable: rareLifeLootTable,
    low: true, touchHit: {damage: 1, spiritCloakDamage: 5, isGroundHit: true }, cuttable: 1,
    underTile: 23,
    particles: thornParticles,
    linkedOffset: 179,
};
export const deepWaterBehavior: TileBehaviors = {
    defaultLayer: 'field',
    water: true,
};
export const climbableWall: TileBehaviors = {
    defaultLayer: 'field',
    climbable: true,
    isSouthernWall: true,
    solid: true,
    low: true,
};
export const spiritBushBehavior: TileBehaviors = {
    ...bushBehavior,
    underTile: 201,
    particles: spiritBushParticles,
    breakSound: 'bushShatter',
    linkableTiles: [2],
};
export const spiritLightStoneBehavior: TileBehaviors = {
    ...lightStoneBehavior, particles: spiritLightStoneParticles,
    linkableTiles: [6, 7],
};
export const spiritHeavyStoneBehavior: TileBehaviors = {
    ...heavyStoneBehavior, particles: spiritHeavyStoneParticles,
    linkableTiles: [8, 9],
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
// All of these solid maps are set so that only the bottom half of the ceiling graphics are solid.
export const ceilingBehavior: TileBehaviors = { defaultLayer: 'foreground2', isVeryTall: true, solid: true};
export const bottomCeilingBehavior: TileBehaviors = { defaultLayer: 'foreground2', isVeryTall: true, solidMap: BITMAP_BOTTOM};
export const topLeftCeiling: TileBehaviors = { ...ceilingBehavior, isVeryTall: true, solid: false, solidMap: BITMAP_TOP_LEFT_8_STRIP};
export const topRightCeiling: TileBehaviors = { ...ceilingBehavior, isVeryTall: true, solid: false,  solidMap: BITMAP_TOP_RIGHT_8_STRIP};
export const bottomLeftCeiling: TileBehaviors = { ...ceilingBehavior, isVeryTall: true, solid: false,  solidMap: BITMAP_BOTTOM_LEFT_8};
export const bottomRightCeiling: TileBehaviors = { ...ceilingBehavior, isVeryTall: true, solid: false,  solidMap: BITMAP_BOTTOM_RIGHT_8};

export const topLeftWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT, isSouthernWall: true};
export const topRightWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT, isSouthernWall: true};
export const bottomLeftWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_LEFT, isSouthernWall: true};
export const bottomRightWall: TileBehaviors = { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_RIGHT, isSouthernWall: true};
