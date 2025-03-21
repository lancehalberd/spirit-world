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

const baseLavaBehavior: TileBehaviors = {
    defaultLayer: 'floor2',
    editorTransparency: 0.3,
    elementOffsets: {ice: 256},
};

// First tile is 886
// Tiles 889 + 893 used to be alternate solid lava tiles, but are no longer defined.
// There isn't currently a convenient way to replace these tiles so they are left blank for now.
// The simplest solution would probably be to add them back to the source image as additional lava tiles if we ever need any.
export const lava: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/lavaAnimations.png', {x: 0, y: 0, w: 64, h: 80}),
    behaviors: {
        'all': { ...baseLavaBehavior, isLava: true},
        // 3x3 lava square
        '0x0': { ...baseLavaBehavior, isLavaMap: BITMAP_TOP_LEFT_INTERIOR_11},
        '1x0': { ...baseLavaBehavior, isLavaMap: BITMAP_TOP_INTERIOR_11},
        '2x0': { ...baseLavaBehavior, isLavaMap: BITMAP_TOP_RIGHT_INTERIOR_11},
        '0x1': { ...baseLavaBehavior, isLavaMap: BITMAP_LEFT_INTERIOR_11},
        '2x1': { ...baseLavaBehavior, isLavaMap: BITMAP_RIGHT_INTERIOR_11},
        '0x2': { ...baseLavaBehavior, isLavaMap: BITMAP_BOTTOM_LEFT_INTERIOR_11},
        '1x2': { ...baseLavaBehavior, isLavaMap: BITMAP_BOTTOM_INTERIOR_11},
        '2x2': { ...baseLavaBehavior, isLavaMap: BITMAP_BOTTOM_RIGHT_INTERIOR_11},
        // Single tile circle of lava
        '3x2': { ...baseLavaBehavior, isLavaMap: BITMAP_INTERIOR_11},
        // Small diamond of lava
        '0x3': { ...baseLavaBehavior, isLavaMap: BITMAP_TOP_LEFT_ANGLED_INTERIOR_11},
        '1x3': { ...baseLavaBehavior, isLavaMap: BITMAP_TOP_RIGHT_ANGLED_INTERIOR_11},
        '0x4': { ...baseLavaBehavior, isLavaMap: BITMAP_BOTTOM_LEFT_ANGLED_INTERIOR_11},
        '1x4': { ...baseLavaBehavior, isLavaMap: BITMAP_BOTTOM_RIGHT_ANGLED_INTERIOR_11},
        // Small square of lava missing interior corners
        '2x3': { ...baseLavaBehavior, isLavaMap: BITMAP_MISSING_BOTTOM_RIGHT_5},
        '3x3': { ...baseLavaBehavior, isLavaMap: BITMAP_MISSING_BOTTOM_LEFT_5},
        '2x4': { ...baseLavaBehavior, isLavaMap: BITMAP_MISSING_TOP_RIGHT_5},
        '3x4': { ...baseLavaBehavior, isLavaMap: BITMAP_MISSING_TOP_LEFT_5},
    },
    animationProps: {
        frames: 3,
        frameSequence: [0,0,1,2,2,1],
        offset: {x: 9, y: 0}
    },
};
// First tile is 1142
// Tiles 1145 + 1149 used to be alternate solid lavaStone tiles, but are no longer defined.
export const lavaStone: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/lavaAnimations.png', {x: 0, y: 80, w: 64, h: 80}),
    behaviors: {
        'all': { defaultLayer: 'floor2', isGround: true, elementOffsets: {fire: -256} },
    },
    animationProps: {
        frames: 3,
        frameSequence: [0,0,1,2,2,1],
        offset: {x: 9, y: 0}
    },
};

// This is 3 bubbles + 4 diamond patterns.
export const lavaBubbles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/lavaAnimations.png', {x: 0, y: 240, w: 16, h: 112}),
    behaviors: {
        'all': { defaultLayer: 'field',  elementTiles: {ice: 0} },
    },
    animationProps: {
        frames: 6,
        frameSequence: [0,1,2,3,4,5],
        offset: {x: 1, y: 0}
    },
};
