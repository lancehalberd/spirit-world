import {
    BITMAP_TOP_RIGHT, BITMAP_BOTTOM_RIGHT, BITMAP_TOP_LEFT, BITMAP_BOTTOM_LEFT,
} from 'app/content/bitMasks';
import { requireFrame } from 'app/utils/packedImages';

const baseFloorSpikeBehavior: TileBehaviors = {
    defaultLayer: 'floor2',
    touchHit: {damage: 2, spiritCloakDamage: 10, isGroundHit: true, source: null }
};
const baseSouthernWallSpikeBehavior: TileBehaviors = {
    defaultLayer: 'field2',
    touchHit: {
        damage: 4,
        spiritCloakDamage: 10,
        hitAllies: true,
        hitEnemies: true,
        source: null,
    },
    solid: true,
    isSouthernWall: true,
};
const baseShortWallSpikeBehavior: TileBehaviors = {
    defaultLayer: 'field',
    touchHit: {
        damage: 4,
        spiritCloakDamage: 10,
        hitAllies: true,
        hitEnemies: true,
        source: null,
    },
    low: true,
};

let x = 0, y = 0;
export const shortWallCrystalSpikes: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalSpikes.png', {x: 0, y: 0, w: 48, h: 48}),
    behaviors: {
        'all': {...baseShortWallSpikeBehavior, solid: true},
        '0x0': {...baseShortWallSpikeBehavior, solid: BITMAP_BOTTOM_RIGHT},
        '2x0': {...baseShortWallSpikeBehavior, solid: BITMAP_BOTTOM_LEFT},
        '0x2': {...baseShortWallSpikeBehavior, solid: BITMAP_TOP_RIGHT},
        '2x2': {...baseShortWallSpikeBehavior, solid: BITMAP_TOP_LEFT},
    },
    paletteTargets: [{key: 'spirit', x, y}],
};

y += 3;
export const floorCrystalSpikes: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalSpikes.png', {x: 0, y: 128, w: 48, h: 48}),
    behaviors: {
        'all': {...baseFloorSpikeBehavior},
        // Just remove the touch hit on the corners for now as we don't support bitmaps for touch hit yet.
        '0x0': {...baseFloorSpikeBehavior, touchHit: undefined},
        '2x0': {...baseFloorSpikeBehavior, touchHit: undefined},
        '0x2': {...baseFloorSpikeBehavior, touchHit: undefined},
        '2x2': {...baseFloorSpikeBehavior, touchHit: undefined},
    },
    paletteTargets: [{key: 'spirit', x, y}],
};

x += 3;
y = 0;

export const shortWallTransitionCrystalSpikes: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalSpikes.png', {x: 64, y: 0, w: 48, h: 32}),
    behaviors: {
        'all': {...baseShortWallSpikeBehavior, solid: true},
    },
    paletteTargets: [{key: 'spirit', x, y}],
};

y += 2;
export const southernWallCrystalSpikes: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalSpikes.png', {x: 64, y: 32, w: 48, h: 48}),
    behaviors: {
        'all': {...baseSouthernWallSpikeBehavior, solid: true},
    },
    paletteTargets: [{key: 'spirit', x, y}],
};

export const allCrystalSpikeTiles: TileSource[] = [
    floorCrystalSpikes,
    shortWallCrystalSpikes,
    shortWallTransitionCrystalSpikes,
    southernWallCrystalSpikes,
];
