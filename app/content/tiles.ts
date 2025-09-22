import {
    BITMAP_MIDDLE_DOWN_RIGHT, BITMAP_MIDDLE_UP_RIGHT,
    BITMAP_BOTTOM, BITMAP_BOTTOM_2,
    BITMAP_BOTTOM_LEFT, BITMAP_BOTTOM_RIGHT,
    BITMAP_TOP_LEFT, BITMAP_TOP_RIGHT,
    BITMAP_LEFT_2,
    BITMAP_RIGHT_2, BITMAP_TOP_2,
} from 'app/content/bitMasks';
import {
    canvasPalette,
    deletedTileSource,
    deletedTiles,
    emptyTile,
    solidColorTile,
    bottomLeftCeiling,
    bottomRightCeiling,
    bouncyWallBehaviors,
    bushBehavior,
    ceilingBehavior,
    climbableWall,
    crystalParticles,
    deepWaterBehavior,
    dirtParticles,
    emptyWallBehaviors,
    emptyLedgeBehaviors,
    heavyStoneBehavior,
    lightStoneBehavior,
    pitBehavior,
    singleTileSource,
    southernWallBehavior,
    spiritPlantBehavior,
    spiritBushBehavior,
    spiritThornBehavior,
    spiritLightStoneBehavior,
    spiritHeavyStoneBehavior,
    spiritUnliftableStoneBehavior,
    thornBehavior,
    topLeftWall,
    topRightWall,
    unliftableStoneBehavior,
} from 'app/content/tiles/constants';
import { paletteHash } from 'app/content/tiles/paletteHash';
import {
    allCavePitTileSources,
    cavePitHorizontalWalls,
    cavePitAngledWallsIn,
    cavePitAngledWallsOut,
} from 'app/content/tiles/cavePits';
import { allCrystalCavePitTileSources, crystalCaveWallToPitTileSources } from 'app/content/tiles/crystalCavePits';
import {allCrystalCaveTileSources, crystalTransparentFloor} from 'app/content/tiles/crystalCaveTiles';
import {allCrystalSpikeTiles} from 'app/content/tiles/crystalSpikes';
import { allDesertTileSources } from 'app/content/tiles/desertTiles';
import { allFancyStoneCeilingTileSources } from 'app/content/tiles/fancyStoneTiles';
import { allFuturisticTileSources } from 'app/content/tiles/futuristicTiles';
import {allFlowerTiles, allGardenTiles} from 'app/content/tiles/garden';
import {rugTiles} from 'app/content/tiles/houseInterior';
import { lava, lavaBubbles, lavaStone } from 'app/content/tiles/lava';
import {allMossTiles} from 'app/content/tiles/moss';
import { allObsidianTileSources } from 'app/content/tiles/obsidianTiles';
import { allStoneTileSources } from 'app/content/tiles/stoneTiles';
import { allStoneCeilingTileSources } from 'app/content/tiles/stoneCeilingTiles';
import { allStoneExteriorTileSources } from 'app/content/tiles/stoneExteriorTiles';
import {allVanaraPitTileSources, vanaraAngledPits} from 'app/content/tiles/vanaraPits';
import { allWoodTileSources, extraWoodWalls } from 'app/content/tiles/woodTiles';
import { drawFrame } from 'app/utils/animations';
import { createCanvasAndContext, debugCanvas } from 'app/utils/canvas';
import { allImagesLoaded } from 'app/utils/images';
import { requireFrame } from 'app/utils/packedImages';
import {
    allVanaraTileSources,
    vanaraHoleyTransitionTile,
    vanaraPlainFloorTile,
    vanaraShortWallSources,
    vanaraWallTrim,
    vanaraWallEdges,
} from 'app/content/tiles/vanaraTree'
import {allLightJadeCityTileSources} from 'app/content/tiles/jadeCityLight';
import {allDarkJadeCityTileSources} from 'app/content/tiles/jadeCityDark';
import { allJadeInteriorLightTileSources } from './tiles/jadeInteriorLight';
import { allJadeInteriorDarkTileSources } from './tiles/jadeInteriorDark';


export const allTiles: FullTile[] = [null];
window['allTiles'] = allTiles;

/*
const [iceFrame, iceEdgeFrame] = createAnimation('gfx/tiles/iceTile.png', {w: 16, h:16}, {cols: 2}).frames;
const interiorMask = requireFrame('gfx/tiles/smallMasks.png', {x: 0, y: 0, w: 128, h:8});
const edgeMask = requireFrame('gfx/tiles/smallMasks.png', {x: 0, y: 8, w: 128, h:8});
export async function createIceTiles() {
    await allImagesLoaded();
    const [patternCanvas, patternContext] = createCanvasAndContext(8, 8);
    const [maskCanvas, maskContext] = createCanvasAndContext(128, 8);
    const [canvas, context] = createCanvasAndContext(128, 32);

    let yTarget = 0;
    for (const [x, y] of [[0, 0], [-8, 0], [0, -8], [-8, -8]]) {
        // Draw the interior for this row.
        patternContext.clearRect(0, 0, 8, 8);
        drawFrame(patternContext, iceFrame, {x, y, w: 16, h: 16});
        maskContext.globalCompositeOperation = 'source-over';
        maskContext.clearRect(0, 0, 128, 8);
        drawFrame(maskContext, interiorMask, {...interiorMask, x: 0, y: 0});
        maskContext.globalCompositeOperation = 'source-in';
        maskContext.fillStyle = maskContext.createPattern(patternCanvas, 'repeat');
        maskContext.fillRect(0, 0, 128, 8);
        context.drawImage(maskCanvas, 0, 0, 128, 8, 0, yTarget, 128, 8);

        // Draw the exterior for this row.
        patternContext.clearRect(0, 0, 8, 8);
        drawFrame(patternContext, iceEdgeFrame, {x, y, w: 16, h: 16});
        maskContext.globalCompositeOperation = 'source-over';
        maskContext.clearRect(0, 0, 128, 8);
        drawFrame(maskContext, edgeMask, {...edgeMask, x: 0, y: 0});
        maskContext.globalCompositeOperation = 'source-in';
        maskContext.fillStyle = maskContext.createPattern(patternCanvas, 'repeat');
        maskContext.fillRect(0, 0, 128, 8);
        context.drawImage(maskCanvas, 0, 0, 128, 8, 0, yTarget, 128, 8);

        yTarget += 8;
    }

    window.debugCanvas(canvas, 4);
}
createIceTiles();*/


let index = 1;
function addSingleTileFromTileSource(tileSource: TileSource, x: number, y: number) {
    const behaviors = tileSource.behaviors?.[`${x}x${y}`] || tileSource.behaviors?.all;
    if (behaviors?.skipped) {
        return;
    }
    const w = 16, h = 16;
    const frame: Frame = {
        image: tileSource.source.image,
        x: tileSource.source.x + x * w,
        y: tileSource.source.y + y * h,
        w,
        h,
    };
    let animation: FrameAnimation;
    if (tileSource.animationProps) {
        const sourceFrames: Frame[] = [frame];
        for (let i = 1; i < tileSource.animationProps.frames; i++) {
            sourceFrames[i] = {
                ...frame,
                x: frame.x + i * tileSource.animationProps.offset.x * 16,
                y: frame.y + i * tileSource.animationProps.offset.y * 16,
            };
        }
        const frames: Frame[] = [];
        for (const sourceframeIndex of tileSource.animationProps.frameSequence) {
            frames.push(sourceFrames[sourceframeIndex]);
        }
        animation = {
            frames,
            // These properties won't actually be used, but let's go ahead and set them to
            // reflect how the animations will be used.
            frameDuration: 8,
            duration: 960,
        };
    }
    allTiles[index] = {
        index,
        frame,
        animation,
        behaviors,
    };
    index++;
}

function addTiles(palettes: TileSource[]) {
    const w = 16, h = 16;
    for (const palette of palettes) {

        // Use specified array of coordinates if found.
        if (palette.tileCoordinates) {
            for (const coordinates of palette.tileCoordinates) {
                if (!coordinates) {
                    continue;
                }
                const [x, y] = coordinates;
                addSingleTileFromTileSource(palette, x, y);
                for (const target of (palette.paletteTargets || [])) {
                    paletteHash[target.key] = (paletteHash[target.key] || [[]]);
                    const ty = target.y + y, tx = target.x + x;
                    paletteHash[target.key][ty] = paletteHash[target.key][ty] || [];
                    paletteHash[target.key][ty][tx] = index - 1;
                }
            }
        } else {
            // Otherwise loop over all coordinates.
            for (let py = 0; py < palette.source.h / h; py ++) {
                for (let px = 0; px < palette.source.w / w; px ++) {
                    addSingleTileFromTileSource(palette, px, py);
                    for (const target of (palette.paletteTargets || [])) {
                        paletteHash[target.key] = (paletteHash[target.key] || [[]]);
                        const ty = target.y + py, tx = target.x + px;
                        paletteHash[target.key][ty] = paletteHash[target.key][ty] || [];
                        paletteHash[target.key][ty][tx] = index - 1;
                    }
                }
            }
        }
    }
}

const emptyKey = [...new Array(16 * 16 * 4)].map(() => 0).join(',');
export async function findUniqueTiles(source: Frame) {
    await allImagesLoaded();
    const [canvas, context] = createCanvasAndContext(source.w, source.h);
    drawFrame(context, source, {...source, x: 0, y: 0});
    debugCanvas(canvas);
    context.fillStyle = 'red';
    const imageData = context.getImageData(0, 0, source.w, source.h).data;
    //console.log(imageData.length, source.w * source.h * 4);
    const imageMap: {[key: string]: {x: number, y: number}} = {};
    for (let y = 0; y < source.h; y += 16) {
        for (let x = 0; x < source.w; x += 16) {
            // Special exemption for CLIFF graphics.
            //if (x >= 368 && (y >= 64 && y < 192)) {
            //    continue;
            //}
            const pixels: string[] = [];
            for (let sy = 0; sy < 16; sy++) {
                const py = y + sy;
                const i = (py * source.w + x) * 4;
                const slice = imageData.slice(i, i + 16 * 4);
                //console.log(slice.length, ':', slice);
                pixels.push(slice.join(','));
            }
            const key = pixels.join(',');
            if (key === emptyKey) {
                continue;
            }
            if (!imageMap[key]) {
                imageMap[key] = {x: (x + source.x) / 16, y: (y + source.y) / 16};
            } else {
                console.log(x, y);
                context.fillRect(x, y, 16, 16);
            }
        }
    }
    return Object.values(imageMap);
}
export function generateTileHash({ frame }: {frame: Frame}): string {
    const [, context] = createCanvasAndContext(16, 16);
    drawFrame(context, frame, {x: 0, y: 0, w: 16, h: 16});
    const imageData = context.getImageData(0, 0, 16, 16).data;
    return imageData.join(',');
}
let imageMap: TileHashMap;
export function generateTileHashMap(): TileHashMap {
    if (imageMap) {
        return imageMap;
    }
    imageMap = {};
    imageMap[emptyKey] = allTiles[1];
    // don't add the null+empty tiles.
    addTilesToTileHashMap(allTiles.slice(2));
    return imageMap;
}
export function addTilesToTileHashMap(tiles: FullTile[]) {
    for (const tile of tiles) {
        if (!tile || tile?.behaviors?.deleted) {
            continue;
        }
        const hashKey = generateTileHash(tile);
        if (hashKey !== emptyKey && imageMap[hashKey]) {
            const otherTile = imageMap[hashKey];
            // We don't want to use the same tile from multiple places, so log an error if we discover
            // the same tile being sampled from multiple places. It is okay to sample the same place twice
            // since we may want tiles that look the same with different behaviors.
            if (otherTile.frame.image !== tile.frame.image ||
                otherTile.frame.x !== tile.frame.x ||
                otherTile.frame.y !== tile.frame.y
            ) {
                console.error('Found duplicate tiles:', imageMap[hashKey].index, tile.index);
            }
            continue;
        }
        imageMap[hashKey] = tile;
    }
}

let newTileInsertPoint = 0;
export function addNewTile(frame: Frame): FullTile {
    //console.log('Adding new tile', (frame.image as HTMLImageElement)?.src, frame.x, frame.y);
    // Move to the next tile insert point.
    for(;newTileInsertPoint < allTiles.length; newTileInsertPoint++) {
        if (allTiles[newTileInsertPoint]?.behaviors?.deleted) {
            break;
        }
    }
    //console.log('Adding new tile', newTileInsertPoint);
    allTiles[newTileInsertPoint] = {
        index: newTileInsertPoint,
        frame,
    };
    addTilesToTileHashMap([allTiles[newTileInsertPoint]]);
    return allTiles[newTileInsertPoint];
}

async function logUniqueTiles(newTiles: Frame): Promise<void> {
    const coords = await findUniqueTiles(newTiles);
    if (!coords.length) {
        console.log('no tiles found');
        return;
    }
    const stringGrid = [['']];
    let l = coords[0].x, r = coords[0].x, t = coords[0].y, b = coords[0].y;
    for (const {x, y} of coords) {
        l = Math.min(l, x);
        r = Math.max(r, x);
        t = Math.min(t, y);
        b = Math.max(b, y);
        stringGrid[y] = stringGrid[y] || [''];
        stringGrid[y][x] = '[' + `${x}`.padStart(2, ' ') + ',' + `${y}`.padStart(2, ' ') + '],';
    }
    let result = '';
    for (let y = t; y <= b; y++) {
        for (let x = l; x <= r; x++) {
            result += (stringGrid[y]?.[x] || '        ');
        }
        result += '\n';
    }
    console.log(result);
}

function stampTileSource(frame: Frame, tileCoordinates: number[][], behaviors: {[key: string]: TileBehaviors} = {}): TileSource {
    return {
        w: 16, h: 16,
        source: frame,
        tileCoordinates,
        behaviors,
    };
}

export function gradientColorTile(
    colors: string[],
    x0: number, y0: number, x1: number, y1: number,
    behaviors: TileBehaviors = null
): TileSource {
    return canvasPalette(context => {
        const gradient = context.createLinearGradient(x0, y0, x1, y1);
        for (let i = 0; i < colors.length; i++) {
            gradient.addColorStop(i * 1 / (colors.length - 1), colors[i])
        }
        context.fillStyle = gradient;
        context.fillRect(0, 0, 16, 16);
    }, behaviors);
}

const rockWallFrame: Frame = requireFrame('gfx/tiles/rockwalltiles.png');

const caveFloorPalette: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cavefloor.png', {x: 0, y: 0, w: 336, h: 16}),
    behaviors: {all: {linkedOffset: 448}, '0x0': {linkedOffset: 1078}},
};
const caveFloorSpiritPalette: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cavefloorspirit.png', {x: 16, y: 0, w: 320, h: 16}),
    behaviors: {},
};

const caveCornersPalette: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cavewalls.png', {x: 32, y: 0, w: 8 * 32, h: 32}),
    behaviors: {'all': {solid: true}},
};
const caveWallsPalette: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cavewalls.png', {x: 0, y: 32, w: 32, h: 4 * 32}),
    behaviors: {'all': {solid: true}},
};


const spiritPlantsPalette: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/spiritplants.png', {x: 0, y: 0, w: 5 * 16, h: 16}),
    behaviors: {
        '0x0': spiritPlantBehavior,
        '1x0': spiritPlantBehavior,
        '2x0': {brightness: 0.4, lightRadius: 24},
        '3x0': {brightness: 0.4, lightRadius: 24},
    },
};
const brightGrass: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/grass.png', {x: 0, y: 0, w: 11 * 16, h: 16}),
    // This slows down firefox.
    /*behaviors: {
        '0x0': {brightness: 1, lightRadius: 16},
    },*/
};


const iceTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/iceTile.png', {x: 0, y: 0, w: 16, h: 16}),
    behaviors: {'all': {isGround: true, isFrozen: true, slippery: true, elementTiles: {fire: 0}}},
};

const railsTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/rails.png', {x: 0, y: 0, w: 64, h: 16}),
    behaviors: {
        'all': {solid: true, defaultLayer: 'field', linkedOffset: 4},
        '1x0': {solid: true, defaultLayer: 'field2', linkedOffset: 4}
    },
};

const spiritRailsTiles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/rails.png', {x: 0, y: 16, w: 64, h: 16}),
    behaviors: {
        'all': {solid: true, defaultLayer: 'field'},
        '1x0': {solid: true, defaultLayer: 'field2'},
    },
};


const waterAnimationProps = {
    frames: 3,
    frameSequence: [0,0,1,2,2,1],
    offset: {x: 0, y: 5},
};

const shallowWaterBehavior: TileBehaviors = { defaultLayer: 'water', shallowWater: true };
const deepToShallow: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/deeptoshallowwater.png', {x: 0, y: 0, w: 64, h: 80}),
    behaviors: {
        'all': shallowWaterBehavior,
        '0x3': deepWaterBehavior, '1x3': deepWaterBehavior,
        '0x4': deepWaterBehavior, '1x4': deepWaterBehavior,
        '3x2': { skipped: true }
    },
    animationProps: waterAnimationProps,
};
const deepToShallowAngles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/deeptoshallowwater.png', {x: 64, y: 0, w: 64, h: 64}),
    behaviors: {
        'all': deepWaterBehavior,
        '0x0': { skipped: true }, '3x0': { skipped: true },
        '0x3': { skipped: true }, '3x3': { skipped: true },
        '1x1': shallowWaterBehavior, '1x2': shallowWaterBehavior,
        '2x1': shallowWaterBehavior, '2x2': shallowWaterBehavior,
    },
    animationProps: waterAnimationProps,
};
const shallowToDeep: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/shallowtodeepwater1.png', {x: 0, y: 0, w: 64, h: 80}),
    behaviors: {
        'all': deepWaterBehavior,
        '0x3': shallowWaterBehavior, '1x3': shallowWaterBehavior,
        '0x4': shallowWaterBehavior, '1x4': shallowWaterBehavior,
        '3x2': { skipped: true }
    },
    animationProps: waterAnimationProps,
};
const shallowToDeepAngles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/shallowtodeepwater1.png', {x: 64, y: 0, w: 64, h: 64}),
    behaviors: {
        'all': shallowWaterBehavior,
        '0x0': { skipped: true }, '3x0': { skipped: true },
        '0x3': { skipped: true }, '3x3': { skipped: true },
        '1x1': deepWaterBehavior, '1x2': deepWaterBehavior,
        '2x1': deepWaterBehavior, '2x2': deepWaterBehavior,
    },
    animationProps: waterAnimationProps,
};

const waterWaves: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/shallowtodeepwater1.png', {x: 144, y: 0, w: 16, h: 64}),
    behaviors: {
        'all': {defaultLayer: 'field', isGround: false},
    },
    animationProps: {
        frames: 3,
        frameSequence: [0,0,1,2,2,1],
        offset: {x: 1, y: 0},
    }
};
const waterRocks: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/shallowtodeepwater1.png', {x: 144, y: 80, w: 16, h: 48}),
    behaviors: {
        'all': {defaultLayer: 'field', isGround: false},
    },
    animationProps: {
        frames: 3,
        frameSequence: [0,0,1,2,2,1],
        offset: {x: 1, y: 0},
    }
};

const shore: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/watershore.png', {x: 0, y: 0, w: 64, h: 80}),
    behaviors: {
        'all': { defaultLayer: 'floor' },
        '3x0': { skipped: true }, '3x1': { skipped: true },
    },
    animationProps: waterAnimationProps,
};
const shoreAngles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/watershore.png', {x: 64, y: 0, w: 64, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor' },
        '0x0': { skipped: true }, '3x0': { skipped: true },
        '0x3': { skipped: true }, '3x3': { skipped: true },
    },
    animationProps: waterAnimationProps,
};

const shoreMask: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/blackmaskground.png', {x: 0, y: 0, w: 64, h: 80}),
    behaviors: {
        'all': { defaultLayer: 'floor', isGround: false },
        '3x0': { skipped: true }, '3x1': { skipped: true },
    },
};
const shoreAnglesMask: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/blackmaskground.png', {x: 64, y: 0, w: 64, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor', isGround: false },
        '0x0': { skipped: true }, '3x0': { skipped: true },
        '0x3': { skipped: true }, '3x3': { skipped: true },
    },
};

const cloudBehavior = <const>{ cloudGround: true, defaultLayer: 'field'  };
const clouds: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cloud.png', {x: 0, y: 0, w: 64, h: 80}),
    behaviors: {
        'all': cloudBehavior,
        '0x0': { ...cloudBehavior, ledges: {up: true, left: true}},
        '1x0': { ...cloudBehavior, ledges: {up: true}},
        '2x0': { ...cloudBehavior, ledges: {up: true, right: true}},
        '0x1': { ...cloudBehavior, ledges: {left: true}},
        '2x1': { ...cloudBehavior, ledges: {right: true}},
        '0x2': { ...cloudBehavior, ledges: {down: true, left: true}},
        '1x2': { ...cloudBehavior, ledges: {down: true}},
        '2x2': { ...cloudBehavior, ledges: {down: true, right: true}},
        '0x3': { ...cloudBehavior, ledges: {up: true, left: true}},
        '1x3': { ...cloudBehavior, ledges: {up: true, right: true}},
        '0x4': { ...cloudBehavior, ledges: {down: true, left: true}},
        '1x4': { ...cloudBehavior, ledges: {down: true, right: true}},
    },
};
const cloudAngles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cloud.png', {x: 64, y: 0, w: 64, h: 64}),
    behaviors: {
        'all': cloudBehavior,
        '0x0': { skipped: true }, '3x0': { skipped: true },
        '0x3': { skipped: true }, '3x3': { skipped: true },
        '1x0': { ...cloudBehavior, diagonalLedge: 'upleft'},
        '0x1': { ...cloudBehavior, diagonalLedge: 'upleft'},
        '2x0': { ...cloudBehavior, diagonalLedge: 'upright'},
        '3x1': { ...cloudBehavior, diagonalLedge: 'upright'},
        '0x2': { ...cloudBehavior, diagonalLedge: 'downleft'},
        '1x3': { ...cloudBehavior, diagonalLedge: 'downleft'},
        '2x3': { ...cloudBehavior, diagonalLedge: 'downright'},
        '3x2': { ...cloudBehavior, diagonalLedge: 'downright'},
    },
};

const vineBase: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vines.png', {x: 48, y: 0, w: 16, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'field', brightness: 0.5, lightRadius: 24 },
    },
};
const vineMiddle: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vines.png', {x: 80, y: 16, w: 16, h: 32}),
    behaviors: {
        'all': {...climbableWall, brightness: 0.5, lightRadius: 24},
    },
};
const vineTop: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/vines.png', {x: 80, y: 48, w: 16, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'field', brightness: 0.5, lightRadius: 24 },
    },
};

function applyMask(targetSource: TileSource, maskSource: TileSource) {
    const {w, h} = targetSource;
    for (let py = 0; py < targetSource.source.h / h; py ++) {
        for (let px = 0; px < targetSource.source.w / w; px ++) {
            const behaviors = targetSource.behaviors?.[`${px}x${py}`] || targetSource.behaviors?.all || {};
            if (behaviors?.skipped) {
                continue;
            }
            const maskBehaviors = maskSource.behaviors?.[`${px}x${py}`] || maskSource.behaviors?.all || {};
            targetSource.behaviors[`${px}x${py}`] = {
                ...behaviors,
                ...maskBehaviors,
                maskFrame: {
                    image: maskSource.source.image,
                    x: maskSource.source.x + px * w,
                    y: maskSource.source.y + py * h,
                    w,
                    h,
                },
            };
        }
    }
}

applyMask(shore, shoreMask);
applyMask(shoreAngles, shoreAnglesMask);

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


const crackedFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/clifffloors.png', {x: 0, y: 0, w: 48, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'floor' },
    },
};

const breakableFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/clifffloors.png', {x: 0, y: 0, w: 16, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'field', underTile: 4, isBrittleGround: true, particles: dirtParticles, breakSound: 'rockShatter'},
    },
};

const stairs: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/exteriorstairs.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[2,2],[0,3],[1,3],[2,3]]
};

const shadows: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/shadowtiles.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'field2', isGround: false, isOverlay: true },
    },
    tileCoordinates: [
        [0,0],[1,0],[2,0],[3,0],[4,0],[6,0],[7,0],[8,0],[9,0],[0,1],[2,1],[3,1],[4,1],[6,1],[7,1],[8,1],[9,1],
        [0,2],[2,2],[3,2],[4,2],[5,2],[7,2],[8,2],[10,2],[0,3],[4,3],[5,3],[7,3],[8,3],[10,3],
        [0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[0,5],[7,5],[8,5]
    ],
};


const caveCeiling: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cavearranged2.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'foreground2', isGround: false },
        '0x12': bottomLeftCeiling, '1x12': bottomLeftCeiling,
        '2x12': bottomRightCeiling, '3x12': bottomRightCeiling,
    },
    tileCoordinates: [
                        [ 2, 7],[ 3, 7],[ 4, 7],[ 5, 7],
                        [ 2, 8],[ 3, 8],[ 4, 8],[ 5, 8],
                        [ 2, 9],[ 3, 9],
        [ 0,10],[ 1,10],[ 2,10],[ 3,10],

        [ 0,12],[ 1,12],[ 2,12],[ 3,12],
    ],
};

const caveCeilingTopAngles: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cavearranged2.png', {x: 0, y: 0, w: 48, h: 80}),
    behaviors: {
        '8x2': ceilingBehavior, '9x2': ceilingBehavior,
        '10x2': ceilingBehavior, '11x2': ceilingBehavior,
    },
    tileCoordinates: [
        [ 8, 2],[ 9, 2],[10, 2],[11, 2],
    ],
};

const caveWalls: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cavearranged2.png', {x: 0, y: 0, w: 48, h: 80}),
    behaviors: {
        'all': southernWallBehavior,
        '12x3': topRightWall, '13x3': topRightWall,
        '14x3': topLeftWall, '15x3': topLeftWall,
    },
    tileCoordinates: [
    [ 7, 0],[ 8, 0],[ 9, 0],[10, 0],[11, 0],[12, 0],[13, 0],[14, 0],[15, 0],
    [ 7, 1],[ 8, 1],[ 9, 1],[10, 1],[11, 1],[12, 1],[13, 1],[14, 1],
                                            [12, 2],[13, 2],[14, 2],[15, 2],
                                            [12, 3],[13, 3],[14, 3],[15, 3],
    ],
};

const caveStairs: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cavearranged2.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'field' },
    },
    tileCoordinates: [
        [16, 0],[17, 0],[18, 0],
        [16, 1],[17, 1],[18, 1],
        [16, 2],[17, 2],[18, 2],
        [16, 3],[17, 3],[18, 3],
        [16, 4],[17, 4],[18, 4],
    ],
};

const caveLedges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cavearranged2.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },

        // Set groundHeight to 1 for ledges so that lava effects do not apply when standing over the
        // ledge adjacent to lava tiles. This is a bit of a hack because we only check the height of
        // the actor when looking for collisions, but not for floor hazards.
        '8x8': { defaultLayer: 'floor2', ledges: { right: true }, isGround: false, groundHeight: 1 },
        '9x8': { defaultLayer: 'floor2', ledges: { right: true }, isGround: false, groundHeight: 1 },
        '8x9': { defaultLayer: 'floor2', ledges: { left: true }, isGround: false, groundHeight: 1 },
        '9x9': { defaultLayer: 'floor2', ledges: { left: true }, isGround: false, groundHeight: 1 },
        // Specifically avoid setting groundHeight to 1 for the down direction because we sometimes use this
        // on water tiles which prevents swimming in those tiles, and we currently don't place lava
        // directly south of ledge tiles.
        '10x9': { defaultLayer: 'floor2', ledges: { down: true }, isGround: false},
        '11x9': { defaultLayer: 'floor2', ledges: { down: true }, isGround: false},
        '12x9': { defaultLayer: 'floor2', ledges: {up: true}, isGround: false, groundHeight: 1 },
        '13x9': { defaultLayer: 'floor2', ledges: {up: true}, isGround: false, groundHeight: 1 },

        '8x10': { defaultLayer: 'floor2', ledges: { right: true }, solidMap: BITMAP_RIGHT_2, isGround: false, low: true },
        '9x10': { defaultLayer: 'floor2', ledges: { right: true }, solidMap: BITMAP_RIGHT_2, isGround: false, low: true },
        '8x11': { defaultLayer: 'floor2', ledges: { left: true }, solidMap: BITMAP_LEFT_2, isGround: false, low: true },
        '9x11': { defaultLayer: 'floor2', ledges: { left: true }, solidMap: BITMAP_LEFT_2, isGround: false, low: true },
        '10x11': { defaultLayer: 'floor2', ledges: { down: true }, solidMap: BITMAP_BOTTOM_2, isGround: false, low: true },
        '11x11': { defaultLayer: 'floor2', ledges: { down: true }, solidMap: BITMAP_BOTTOM_2, isGround: false, low: true },
        '12x11': {
            defaultLayer: 'floor2', ledges: { up: true }, solidMap: BITMAP_TOP_2, isGround: true, low: true,
            maskFrame: requireFrame('gfx/tiles/cavearranged2.png', {x: 192, y: 160, w: 16, h: 16}),
        },
        '13x11': {
            defaultLayer: 'floor2', ledges: { up: true }, solidMap: BITMAP_TOP_2, isGround: true, low: true,
            maskFrame: requireFrame('gfx/tiles/cavearranged2.png', {x: 208, y: 160, w: 16, h: 16}),
        },
        '8x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright', isGround: false },
        '9x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft', isGround: false },
        '10x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_RIGHT, low: true, diagonalLedge: 'downright', isGround: false },
        '11x12': { defaultLayer: 'floor2', solidMap: BITMAP_BOTTOM_LEFT, low: true, diagonalLedge: 'downleft', isGround: false },
        '12x12': { defaultLayer: 'floor2'},
        '13x12': { defaultLayer: 'floor2'},

        '8x13': {
            defaultLayer: 'floor2', diagonalLedge: 'upright', isGroundMap: BITMAP_BOTTOM_LEFT,
            maskFrame: requireFrame('gfx/tiles/cavearranged2.png', {x: 64, y: 208, w: 16, h: 16}),
        },
        '9x13': {
            defaultLayer: 'floor2', diagonalLedge: 'upleft', isGroundMap: BITMAP_BOTTOM_RIGHT,
            maskFrame: requireFrame('gfx/tiles/cavearranged2.png', {x: 80, y: 208, w: 16, h: 16}),
        },
        '10x13': {
            defaultLayer: 'floor2', diagonalLedge: 'upright', isGroundMap: BITMAP_BOTTOM_RIGHT,
            maskFrame: requireFrame('gfx/tiles/cavearranged2.png', {x: 96, y: 208, w: 16, h: 16}),
        },
        '11x13': {
            defaultLayer: 'floor2', diagonalLedge: 'upleft',isGroundMap: BITMAP_BOTTOM_LEFT,
            maskFrame: requireFrame('gfx/tiles/cavearranged2.png', {x: 112, y: 208, w: 16, h: 16}),
        },
        '12x13': { defaultLayer: 'floor2', isGround: false},
        '13x13': { defaultLayer: 'floor2', isGround: false},

        '8x14': { defaultLayer: 'floor2', ledges: { down: true, right: true }, solidMap: BITMAP_BOTTOM_RIGHT, isGround: false, low: true },
        '9x14': { defaultLayer: 'floor2', ledges: { down: true, left: true }, solidMap: BITMAP_BOTTOM_LEFT, isGround: false, low: true },
        '10x14': { defaultLayer: 'floor2', ledges: { down: true, right: true }, solidMap: BITMAP_BOTTOM_RIGHT, isGround: false, low: true },
        '11x14': { defaultLayer: 'floor2', ledges: { down: true, left: true }, solidMap: BITMAP_BOTTOM_LEFT, isGround: false, low: true },
        '12x14': { defaultLayer: 'floor2', isGround: false},
        '13x14': { defaultLayer: 'floor2', isGround: false},

        '8x15': {
            defaultLayer: 'floor2', low: true, diagonalLedge: 'upright',
            solidMap: BITMAP_MIDDLE_DOWN_RIGHT, isGroundMap: BITMAP_BOTTOM_LEFT,
            maskFrame: requireFrame('gfx/tiles/cavearranged2.png', {x: 64, y: 192, w: 16, h: 16}),
        },
        '9x15': {
            defaultLayer: 'floor2', low: true, diagonalLedge: 'upleft',
            solidMap: BITMAP_MIDDLE_UP_RIGHT, isGroundMap: BITMAP_BOTTOM_RIGHT,
            maskFrame: requireFrame('gfx/tiles/cavearranged2.png', {x: 80, y: 192, w: 16, h: 16})
        },
        '10x15': {
            defaultLayer: 'floor2', low: true, diagonalLedge: 'upright',
            solidMap: BITMAP_MIDDLE_DOWN_RIGHT, isGroundMap: BITMAP_BOTTOM_LEFT,
            maskFrame: requireFrame('gfx/tiles/cavearranged2.png', {x: 96, y: 192, w: 16, h: 16}), },
        '11x15': {
            defaultLayer: 'floor2', low: true, diagonalLedge: 'upleft',
            solidMap: BITMAP_MIDDLE_UP_RIGHT, isGroundMap: BITMAP_BOTTOM_RIGHT,
            maskFrame: requireFrame('gfx/tiles/cavearranged2.png', {x: 112, y: 192, w: 16, h: 16}),
        },
        '12x15': { defaultLayer: 'floor2', isGround: false},
        '13x15': { defaultLayer: 'floor2', isGround: false},
    },
    tileCoordinates: [
        [ 8, 8],[ 9, 8],
        [ 8, 9],[ 9, 9],[10, 9],[11, 9],[12, 9],[13, 9],
        [ 8,10],[ 9,10],
        [ 8,11],[ 9,11],[10,11],[11,11],[12,11],[13,11],
        [ 8,12],[ 9,12],[10,12],[11,12],[12,12],[13,12],
        [ 8,13],[ 9,13],[10,13],[11,13],[12,13],[13,13],
        [ 8,14],[ 9,14],[10,14],[11,14],[12,14],[13,14],
        [ 8,15],[ 9,15],[10,15],[11,15],[12,15],[13,15],
    ],
};

const caveLedgeCorners2: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cavearranged2.png', {x: 64, y: 224, w: 64, h: 32}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
}

const caveFloorDecorations: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cavearranged2.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
    tileCoordinates: [
        [15, 5],[16, 5],[17, 5],[18, 5],
        [15, 6],[16, 6],[17, 6],[18, 6],
        [15, 7],[16, 7],[17, 7],[18, 7],
                        [17, 8],[18, 8],
                [16, 9],[17, 9],[18, 9],
                [16,10],        [18,10],
                [16,11],[17,11],[18,11],
                [16,12],[17,12],
        [15,13],[16,13],[17,13],[18,13],
        [15,14],[16,14],[17,14],[18,14],
                [16,15],[17,15],
    ],
};

const caveFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cavearranged2.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        '12x5': { defaultLayer: 'floor', linkedOffset: 339 /* 775 -> 1114 */},
        '12x6': { defaultLayer: 'floor', linkedOffset: 338 /* 776 -> 1114 */},
    },
    tileCoordinates: [
        [12, 5],
        [12, 6],
    ],
};
const caveFloorEdgesGreen: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cavearranged2.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor2', linkedOffset: 339 },
    },
    tileCoordinates: [
        // Index 777 should map to 1116
        [ 8, 4],[ 9, 4],[10, 4],[11, 4],
        [ 8, 5],[ 9, 5],[10, 5],[11, 5],
    ],
};
const caveFloorEdgesRed: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/cavearranged2.png', {x: 0, y: 0, w: 48, h: 64}),
    behaviors: {
        // Index 785 should map to 1116
        'all': { defaultLayer: 'floor2', linkedOffset: 331 },
    },
    tileCoordinates: [
        [ 8, 6],[ 9, 6],[10, 6],[11, 6],
        [ 8, 7],[ 9, 7],[10, 7],[11, 7],
    ],
};

const newTiles: Frame = requireFrame('gfx/tiles/stonebuildingtileset.png', {x: 96, y: 0, w: 80, h: 96});
(async () => console.log((await findUniqueTiles(newTiles)).map(o => `[${o.x},${o.y}]`).join(',')));//();
(() => logUniqueTiles(newTiles));//();


const floorEyeTile: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/eyemonsterbase.png', {x: 0, y: 0, w: 16, h: 16}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
};

const crystalBeadFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/crystalbeadpiles.png', {x: 0, y: 0, w: 256, h: 48}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
        // We place the horizontal edges on field layer by default so it is easy to overlap
        // the horizontal+vertical edges.
        '1x0': { defaultLayer: 'field' },
        '4x0': { defaultLayer: 'field' },
        '1x2': { defaultLayer: 'field' },
        '4x2': { defaultLayer: 'field' },
        '1x1': { slippery: true, defaultLayer: 'field', cuttable: 1, low: true, underTile: 1138, numberParticles: 6, particles: crystalParticles },
    },
    tileCoordinates: [
                [ 1, 0],                [ 4, 0],
        [ 0, 1],[ 1, 1],[ 2, 1],[ 3, 1],[ 4, 1],[ 5, 1],
                [ 1, 2],                [ 4, 2],
    ]
};

const spiritFloor: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/spiritfloor.png', {x: 0, y: 0, w: 80, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor' },
    },
    tileCoordinates: [
        [4, 1],
        [4, 3],
    ],
};
const spiritFloorEdges: TileSource = {
    w: 16, h: 16,
    source: requireFrame('gfx/tiles/spiritfloor.png', {x: 0, y: 0, w: 64, h: 64}),
    behaviors: {
        'all': { defaultLayer: 'floor2' },
    },
};

const solidPitSource: TileSource = solidColorTile('#111111', {pit: true});
const solidSkySource: TileSource = solidColorTile('#0088FF', {pit: true});

addTiles([
    emptyTile,
    singleTileSource('gfx/tiles/bush.png', bushBehavior, 0),
    singleTileSource('gfx/tiles/cactussheet.png', {
        ...bushBehavior,
        throwDamage: 4,
        touchHit: { 
            damage: 1, spiritCloakDamage: 5, 
            hitAllies: true,
            hitEnemies: true,
            source: null,
        },
    }),
    singleTileSource('gfx/tiles/cavePits.png', pitBehavior, 16, 48),
    singleTileSource('gfx/tiles/thorns.png', thornBehavior),
    singleTileSource('gfx/tiles/rocks.png', lightStoneBehavior),
    singleTileSource('gfx/tiles/rocks.png', lightStoneBehavior, 16),
    singleTileSource('gfx/tiles/rocks.png', heavyStoneBehavior, 80),
    singleTileSource('gfx/tiles/rocks.png', heavyStoneBehavior, 96),
    singleTileSource('gfx/tiles/rocks.png', {...unliftableStoneBehavior, linkedOffset: 179}, 160),
    {
        w: 16, h: 16,
        source: requireFrame('gfx/tiles/grass.png', {x: 0, y: 0, w: 11 * 16, h: 16}),
        behaviors: {
            'all': { linkedOffset: 179, defaultLayer: 'floor2', isGround: false},
            '0x0': { linkedOffset: 179, defaultLayer: 'floor', isGround: true},
        }
    },
    singleTileSource('gfx/tiles/bush.png', null, 16),
    singleTileSource('gfx/tiles/thorns.png', null, 16),
    singleTileSource('gfx/tiles/thornsspirit.png', { touchHit: {damage: 1, spiritCloakDamage: 2, isGroundHit: true, source: null }, defaultLayer: 'field' }),
    breakableFloor,
    deletedTiles(2),
    // This is the 'Abyss' tile for the southern edge of walls, it uses bitmap bottom so the player can
    // go behind it a bit.
    singleTileSource('gfx/tiles/cavearranged2.png', { defaultLayer: 'foreground', isVeryTall: true, solidMap: BITMAP_BOTTOM }, 0, 240),
    solidPitSource,
    stampTileSource(rockWallFrame, [
            [0,0], [1,0], [2, 0],
            [0,1], [1,1], [2, 1],
        ], {
        '0x0': southernWallBehavior, '1x0': southernWallBehavior, '2x0': southernWallBehavior,
        '0x1': southernWallBehavior, '1x1': southernWallBehavior, '2x1': southernWallBehavior,
    }),
    caveFloorPalette,
    // 'Abyss' between walls.
    singleTileSource('gfx/tiles/cavearranged2.png', { defaultLayer: 'foreground', isVeryTall: true, solid: true }, 0, 240),
    caveWallsPalette,
    caveCornersPalette,
    spiritPlantsPalette,
    brightGrass,
    floorEyeTile,
    shore,
    shoreAngles,
    cloudAngles,
    vineBase,
    vineMiddle,
    vineTop,
    crackedFloor,
    stairs,
    singleTileSource('gfx/tiles/bushspirit.png', spiritBushBehavior, 0),
    singleTileSource('gfx/tiles/thornsspirit.png', spiritThornBehavior),
    singleTileSource('gfx/tiles/rocksspirit.png', spiritLightStoneBehavior),
    singleTileSource('gfx/tiles/rocksspirit.png', spiritLightStoneBehavior, 16),
    singleTileSource('gfx/tiles/rocksspirit.png', spiritHeavyStoneBehavior, 80),
    singleTileSource('gfx/tiles/rocksspirit.png', spiritHeavyStoneBehavior, 96),
    singleTileSource('gfx/tiles/rocksspirit.png', spiritUnliftableStoneBehavior, 160),
    {
        w: 16, h: 16,
        source: requireFrame('gfx/tiles/grassspirit.png', {x: 0, y: 0, w: 11 * 16, h: 16}),
    },
    singleTileSource('gfx/tiles/bushspirit.png', null, 16),
    singleTileSource('gfx/tiles/thornsspirit.png', null, 16),
    deletedTiles(48),
    rugTiles,
    deletedTiles(2),
    solidSkySource,
    bouncyWallBehaviors,
    deletedTiles(4),
    ...allGardenTiles,
    waterWaves,
    deletedTiles(1),
    iceTiles,
    lavaBubbles,
    waterRocks,
    // Save these slots for additional empty wall behaviors we might want.
    deletedTiles(4),
    emptyWallBehaviors,
    singleTileSource('gfx/tiles/crystalPits.png', pitBehavior, 16, 48),
    ...allFlowerTiles,
    ...allCavePitTileSources,
    ...allCrystalCavePitTileSources,
    emptyLedgeBehaviors,
    cavePitHorizontalWalls,
    cavePitAngledWallsIn,
    cavePitAngledWallsOut,
    clouds,
    railsTiles,
    spiritRailsTiles,
    shallowToDeep,
    shallowToDeepAngles,
    deepToShallow,
    deepToShallowAngles,
    crystalTransparentFloor,
    caveFloorSpiritPalette,
    treeStump,
    treeLeavesTop,
    treeLeaves,
    treeLeavesBottom,
    treeLeavesDoor,
    treeLeavesMerged,
    treeLeavesCorridor,
    treeStumpDoor,
    ...allWoodTileSources,
    shadows,
    extraWoodWalls,
    caveCeiling,
    caveWalls,
    caveFloor,
    caveFloorEdgesGreen,
    caveFloorEdgesRed,
    caveFloorDecorations,
    caveLedges,
    caveStairs,
    caveCeilingTopAngles,
    lava,
    knobbyTreeStump,
    knobbyTreeLeavesTop,
    knobbyTreeLeaves,
    knobbyTreeLeavesBottom,
    knobbyTreeLeavesDoor,
    knobbyTreeLeavesMerged,
    knobbyTreeLeavesCorridor,
    knobbyTreeStumpDoor,
    ...allCrystalCaveTileSources,
    spiritFloor,
    spiritFloorEdges,
    crystalBeadFloor,
    lavaStone,
    ...allStoneTileSources,
    ...allStoneExteriorTileSources,
    ...allStoneCeilingTileSources,
    ...allDesertTileSources,
    ...allFancyStoneCeilingTileSources,
    ...allObsidianTileSources,
    ...allFuturisticTileSources,
    ...crystalCaveWallToPitTileSources,
    caveLedgeCorners2,
    ...allCrystalSpikeTiles,
    ...allVanaraPitTileSources,
    ...allVanaraTileSources,
    ...allLightJadeCityTileSources,
    ...allDarkJadeCityTileSources,
    ...allJadeInteriorLightTileSources,
    ...allJadeInteriorDarkTileSources,
    vanaraHoleyTransitionTile,
    vanaraPlainFloorTile,
    vanaraAngledPits,
    ...vanaraShortWallSources,
    vanaraWallTrim,
    ...allMossTiles,
    ...vanaraWallEdges,
]);

// This invalid is in the middle of a bunch of other tiles so it is easiest to just delete after adding it.
allTiles[127] = {
    index: 127,
    frame: deletedTileSource.source,
    behaviors: { deleted: true },
};
