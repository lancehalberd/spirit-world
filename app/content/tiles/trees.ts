import {
    BITMAP_BOTTOM_LEFT,
    BITMAP_BOTTOM_RIGHT,
    BITMAP_TOP_LEFT,
    BITMAP_TOP_RIGHT,
} from 'app/content/bitMasks';
import {requireFrame} from 'app/utils/packedImages';


const treeStump: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/treesheet.png', {x: 0, y: 128, w: 64, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'field', solid: true, linkedOffset: 401 },
        '0x0': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_RIGHT, linkedOffset: 401},
        '3x0': { defaultLayer: 'field', solidMap: BITMAP_BOTTOM_LEFT, linkedOffset: 401},
        '0x2': { defaultLayer: 'field', solidMap: BITMAP_TOP_RIGHT, linkedOffset: 401},
        '3x2': { defaultLayer: 'field', solidMap: BITMAP_TOP_LEFT, linkedOffset: 401},
    },
};
const treeLeavesTop: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/treesheet.png', {x: 80, y: 0, w: 64, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'foreground2', linkedOffset: 401 },
    },
};
const treeLeaves: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/treesheet.png', {x: 64, y: 16, w: 96, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'foreground', linkedOffset: 401 },
    },
};
const treeLeavesBottom: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/treesheet.png', {x: 96, y: 64, w: 32, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'foreground', linkedOffset: 401 },
    },
};
const treeLeavesDoor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/treesheet.png', {x: 16, y: 96, w: 32, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'foreground', linkedOffset: 401 },
    },
};
const treeLeavesMerged: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/treesheet.png', {x: 160, y: 16, w: 32, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'foreground', linkedOffset: 401 },
    },
};
const treeLeavesCorridor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/treesheet.png', {x: 224, y: 16, w: 16, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'foreground', linkedOffset: 401 },
    },
};
const treeStumpDoor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/treesheet.png', {x: 64, y: 96, w: 64, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'field', solid: true, linkedOffset: 401 },
    },
};

export const bigTreeSources: TileSource[] = [
    treeStump,
    treeLeavesTop,
    treeLeaves,
    treeLeavesBottom,
    treeLeavesDoor,
    treeLeavesMerged,
    treeLeavesCorridor,
    treeStumpDoor,
];


const knobbyTreeStump: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/knobbytrees.png', {x: 0, y: 128, w: 64, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'field', solid: true },
    },
};
const knobbyTreeLeavesTop: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/knobbytrees.png', {x: 80, y: 0, w: 64, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'foreground2' },
    },
};
const knobbyTreeLeaves: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/knobbytrees.png', {x: 64, y: 16, w: 96, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'foreground' },
    },
};
const knobbyTreeLeavesBottom: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/knobbytrees.png', {x: 96, y: 64, w: 32, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'foreground' },
    },
};
const knobbyTreeLeavesDoor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/knobbytrees.png', {x: 16, y: 96, w: 32, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'foreground' },
    },
};
const knobbyTreeLeavesMerged: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/knobbytrees.png', {x: 160, y: 16, w: 32, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'foreground' },
    },
};
const knobbyTreeLeavesCorridor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/knobbytrees.png', {x: 224, y: 16, w: 16, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'foreground' },
    },
};
const knobbyTreeStumpDoor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/knobbytrees.png', {x: 64, y: 96, w: 64, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'field', solid: true },
    },
};


export const bigKnobbyTreeSources: TileSource[] = [
    knobbyTreeStump,
    knobbyTreeLeavesTop,
    knobbyTreeLeaves,
    knobbyTreeLeavesBottom,
    knobbyTreeLeavesDoor,
    knobbyTreeLeavesMerged,
    knobbyTreeLeavesCorridor,
    knobbyTreeStumpDoor,
];


// The top 2 tiles are currently missing, but could be added if we want to display this
// without the leaves covering it.
const smallTreeTrunk: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/treesheet.png', {x: 208, y: 128, w: 32, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'field', solid: true, linkedOffset: 8 },
    },
};
const smallTreeTop: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/treesheet.png', {x: 208, y: 96, w: 32, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'foreground', linkedOffset: 8 },
    },
};
const smallKnobbyTreeTrunk: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/knobbytrees.png', {x: 160, y: 144, w: 32, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'field',  solid: true},
    },
};
const smallKnobbyTreeTop: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/knobbytrees.png', {x: 192, y: 144, w: 32, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'foreground'},
    },
};

export const smallTreeSources: TileSource[] = [
    smallTreeTrunk,
    smallTreeTop,
    smallKnobbyTreeTrunk,
    smallKnobbyTreeTop,
];
