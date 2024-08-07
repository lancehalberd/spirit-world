import {
    BITMAP_TOP_LEFT_INTERIOR_11, BITMAP_TOP_INTERIOR_11, BITMAP_TOP_RIGHT_INTERIOR_11,
    BITMAP_LEFT_INTERIOR_11, BITMAP_INTERIOR_11, BITMAP_RIGHT_INTERIOR_11,
    BITMAP_BOTTOM_LEFT_INTERIOR_11, BITMAP_BOTTOM_INTERIOR_11, BITMAP_BOTTOM_RIGHT_INTERIOR_11,
    BITMAP_TOP_LEFT_ANGLED_INTERIOR_11, BITMAP_TOP_RIGHT_ANGLED_INTERIOR_11,
    BITMAP_BOTTOM_LEFT_ANGLED_INTERIOR_11, BITMAP_BOTTOM_RIGHT_ANGLED_INTERIOR_11,
    BITMAP_MISSING_BOTTOM_RIGHT_5, BITMAP_MISSING_BOTTOM_LEFT_5,
    BITMAP_MISSING_TOP_RIGHT_5, BITMAP_MISSING_TOP_LEFT_5,
} from 'app/content/bitMasks';
import { requireFrame } from 'app/utils/packedImages';

const baseLavaBehavior: TileBehaviors = { defaultLayer: 'floor2', editorTransparency: 0.3, elementOffsets: {ice: 256} };

// First tile is 886
export const lava: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/lava.png', {x: 0, y: 0, w: 64, h: 80}),
    behaviors: {
        'all': { ...baseLavaBehavior, isLava: true},
        // 3x3 lava square
        '0x0': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_TOP_LEFT_INTERIOR_11},
        '1x0': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_TOP_INTERIOR_11},
        '2x0': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_TOP_RIGHT_INTERIOR_11},
        '0x1': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_LEFT_INTERIOR_11},
        '2x1': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_RIGHT_INTERIOR_11},
        '0x2': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_BOTTOM_LEFT_INTERIOR_11},
        '1x2': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_BOTTOM_INTERIOR_11},
        '2x2': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_BOTTOM_RIGHT_INTERIOR_11},
        // Single tile circle of lava
        '3x2': { ...baseLavaBehavior, isLavaMap: BITMAP_INTERIOR_11},
        // Small diamond of lava
        '0x3': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_TOP_LEFT_ANGLED_INTERIOR_11},
        '1x3': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_TOP_RIGHT_ANGLED_INTERIOR_11},
        '0x4': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_BOTTOM_LEFT_ANGLED_INTERIOR_11},
        '1x4': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_BOTTOM_RIGHT_ANGLED_INTERIOR_11},
        // Small square of lava missing interior corners
        '2x3': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_MISSING_BOTTOM_RIGHT_5},
        '3x3': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_MISSING_BOTTOM_LEFT_5},
        '2x4': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_MISSING_TOP_RIGHT_5},
        '3x4': { ...baseLavaBehavior, isGround: true, isLavaMap: BITMAP_MISSING_TOP_LEFT_5},
    },
};
// First tile is 1142
export const lavaStone: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/lavaStone.png', {x: 0, y: 0, w: 64, h: 80}),
    behaviors: {
        'all': { defaultLayer: 'floor2', isGround: true, elementOffsets: {fire: -256} },
    },
};
