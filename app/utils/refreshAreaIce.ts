import {allTiles} from 'app/content/tiles';
import {drawFrame} from 'app/utils/animations';
import {getDrawPriority} from 'app/utils/layers';
import {resetTileBehavior} from 'app/utils/tileBehavior';
import {requireFrame} from 'app/utils/packedImages';


const tinyIceTiles = requireFrame('gfx/tiles/tinyIceTiles.png', {x: 0, y: 0, w: 128, h: 32});

// This iteration of ice just adds edges of ice around full ice tiles.
// In general it made the ice larger than it needed to be, didn't have as interesting patterns, and didn't support
// removing the ice edges after adding them.
// Adds extra edges around frozen tiles so that they don't look as blocky.
/*export function refreshAreaIce(state: GameState, area: AreaInstance) {
    console.log('refreshAreaIce');
    delete area.needsIceRefresh;
    //return;
    for (let ty = 0; ty < area.h; ty++) {
        for (let tx = 0; tx < area.w; tx++) {
            const behavior = area.behaviorGrid?.[ty]?.[tx];
            // If the entire tile is already ice, skip it.
            if (behavior.slippery) {
                continue;
            }
            const T = area.behaviorGrid?.[ty - 1]?.[tx]?.slippery ? 1 : 0;
            const L = area.behaviorGrid?.[ty]?.[tx - 1]?.slippery ? 1 : 0;
            const R = area.behaviorGrid?.[ty]?.[tx + 1]?.slippery ? 1 : 0;
            const B = area.behaviorGrid?.[ty + 1]?.[tx]?.slippery ? 1 : 0;
            const TL = T || L || (area.behaviorGrid?.[ty - 1]?.[tx - 1]?.slippery ? 1 : 0);
            const TR = T || R || (area.behaviorGrid?.[ty - 1]?.[tx + 1]?.slippery ? 1 : 0);
            const BL = B || L || (area.behaviorGrid?.[ty + 1]?.[tx - 1]?.slippery ? 1 : 0);
            const BR = B || R || (area.behaviorGrid?.[ty + 1]?.[tx + 1]?.slippery ? 1 : 0);
            if (!T && !L && !R && !B && !TL && !TR && !BL && !BR) {
                continue;
            }
            let topLayer: AreaLayer;
            let foundBlockingLayer = false;
            // We want to allow freezing on top of ledge behaviors without losing the ledge behaviors, so we have to
            // record any found any then include those on the frozen tile behavior.
            let underLedges: any, underDiagonalLedge: any;
            for (const layer of area.layers) {
                // Never freeze anything in the foreground.
                if (getDrawPriority(layer.definition) === 'foreground') {
                    break;
                }
                const behaviors = layer.tiles[ty][tx]?.behaviors;
                // Blocking layers prevent freezing until another layer is found that erases the blocking behavior.
                if (foundBlockingLayer && !(behaviors?.isLava || behaviors?.isLavaMap || behaviors?.cloudGround || behaviors?.isGround === true)) {
                    continue;
                }
                foundBlockingLayer = false;
                if (!behaviors?.isOverlay
                    && !behaviors?.solid && !behaviors?.solidMap
                    && !behaviors?.pit && !behaviors?.pitMap
                ) {
                    underLedges = behaviors?.ledges || underLedges;
                    underDiagonalLedge = behaviors?.diagonalLedge || underDiagonalLedge;
                    topLayer = layer;
                } else {
                    foundBlockingLayer = true;
                    underLedges = undefined;
                    underDiagonalLedge = undefined;
                }
            }
            if (!topLayer) {
                continue;
            }
            // Fabricate a frozen tile that has the original tile "underneath it", so it will
            // return to the original state if exposed to fire.
            const underTile = topLayer.tiles[ty][tx];
            // console.log('freezing tile', tx, ty, topLayer.key, underTile);
            const offset1 = 8 * ((TL << 0) + (T << 1) + (L << 2) + (0 << 3));
            const offset2 = 8 * ((T << 0) + (TR << 1) + (0 << 2) + (R << 3));
            const offset3 = 8 * ((L << 0) + (0 << 1) + (BL << 2) + (B << 3));
            const offset4 = 8 * ((0 << 0) + (R << 1) + (B << 2) + (BR << 3));
            //console.log({TL, T, TR, L, R, BL, B, BR});
            //console.log({offset1, offset2, offset3, offset4});
            topLayer.tiles[ty][tx] = {
                ...allTiles[0],
                behaviors: {
                    render(context: CanvasRenderingContext2D, tile: FullTile, target: Rect, frameIndex: number) {
                        if (offset1) {
                            drawFrame(context, {image: tinyIceTiles.image, x: tinyIceTiles.x + offset1, y: tinyIceTiles.y, w: 8, h: 8}, {x: target.x, y: target.y, w: 8, h: 8});
                        }
                        if (offset2) {
                            drawFrame(context, {image: tinyIceTiles.image, x: tinyIceTiles.x + offset2, y: tinyIceTiles.y, w: 8, h: 8}, {x: target.x + 8, y: target.y, w: 8, h: 8});
                        }
                        if (offset3) {
                            drawFrame(context, {image: tinyIceTiles.image, x: tinyIceTiles.x + offset3, y: tinyIceTiles.y, w: 8, h: 8}, {x: target.x, y: target.y + 8, w: 8, h: 8});
                        }
                        if (offset4) {
                            drawFrame(context, {image: tinyIceTiles.image, x: tinyIceTiles.x + offset4, y: tinyIceTiles.y, w: 8, h: 8}, {x: target.x + 8, y: target.y + 8, w: 8, h: 8});
                        }
                    },
                    // This is set to draw the underTile under the ice.
                    // The element tile is actually what is used to replace the tile if
                    // the ice is melted.
                    underTile: underTile?.index || 0,
                    showUnderTile: true,
                    ledges: underLedges,
                    diagonalLedge: underDiagonalLedge,
                },
            };
            if (area.tilesDrawn[ty]?.[tx]) {
                area.tilesDrawn[ty][tx] = false;
            }
            area.checkToRedrawTiles = true;
            resetTileBehavior(area, {x: tx, y: ty});
        }
    }
}*/


export function refreshAreaIce(state: GameState, area: AreaInstance) {
    delete area.needsIceRefresh;
    for (let ty = 0; ty < area.h; ty++) {
        for (let tx = 0; tx < area.w; tx++) {
            const behavior = area.behaviorGrid?.[ty]?.[tx];
            const M = behavior?.isFrozen ? 1 : 0;
            if (!M) {
                // This misses one tile that I intend to have a corner of ice in when two adjacent tiles are frozen but
                // the current tile is not. The pattern doesn't look too bad, and it is complicated to fix this issue
                // because it would involve covering a tile with ice without setting the isFrozen flag.
                // Will probably wait to fix this until we do another version that sets the slipperyMap to add pixel
                // precision floor effects and maybe
                continue;
            }
            const T = area.behaviorGrid?.[ty - 1]?.[tx]?.isFrozen ? 1 : 0;
            const L = area.behaviorGrid?.[ty]?.[tx - 1]?.isFrozen ? 1 : 0;
            const R = area.behaviorGrid?.[ty]?.[tx + 1]?.isFrozen ? 1 : 0;
            const B = area.behaviorGrid?.[ty + 1]?.[tx]?.isFrozen ? 1 : 0;
            const TL = (T && L) || (area.behaviorGrid?.[ty - 1]?.[tx - 1]?.isFrozen ? 1 : 0);
            const TR = (T && R) || (area.behaviorGrid?.[ty - 1]?.[tx + 1]?.isFrozen ? 1 : 0);
            const BL = (B && L) || (area.behaviorGrid?.[ty + 1]?.[tx - 1]?.isFrozen ? 1 : 0);
            const BR = (B && R) || (area.behaviorGrid?.[ty + 1]?.[tx + 1]?.isFrozen ? 1 : 0);
            let topLayer: AreaLayer;
            let foundBlockingLayer = false;
            // We want to allow freezing on top of ledge behaviors without losing the ledge behaviors, so we have to
            // record any found any then include those on the frozen tile behavior.
            let underLedges: any, underDiagonalLedge: any;
            for (const layer of area.layers) {
                // Never freeze anything in the foreground.
                if (getDrawPriority(layer.definition) === 'foreground') {
                    break;
                }
                const behaviors = layer.tiles[ty][tx]?.behaviors;
                // Blocking layers prevent freezing until another layer is found that erases the blocking behavior.
                if (foundBlockingLayer && !(behaviors?.isLava || behaviors?.isLavaMap || behaviors?.cloudGround || behaviors?.isGround === true)) {
                    continue;
                }
                foundBlockingLayer = false;
                if (!behaviors?.isOverlay
                    && !behaviors?.solid && !behaviors?.solidMap
                    && !behaviors?.pit && !behaviors?.pitMap
                ) {
                    underLedges = behaviors?.ledges || underLedges;
                    underDiagonalLedge = behaviors?.diagonalLedge || underDiagonalLedge;
                    topLayer = layer;
                } else {
                    foundBlockingLayer = true;
                    underLedges = undefined;
                    underDiagonalLedge = undefined;
                }
            }
            // If this is literally the square frozen tile, don't replace it.
            if (!topLayer || topLayer.tiles[ty][tx] === allTiles[294]) {
                continue;
            }
            // Fabricate a frozen tile that has the original tile "underneath it", so it will
            // return to the original state if exposed to fire.
            const currentTileBehaviors = topLayer.tiles[ty][tx]?.behaviors;
            const underTile = currentTileBehaviors.isFrozen ? currentTileBehaviors.underTile : topLayer.tiles[ty][tx]?.index;
            // console.log('freezing tile', tx, ty, topLayer.key, underTile);
            const offset1 = 8 * ((TL << 0) + (T << 1) + (L << 2) + (M << 3));
            const offset2 = 8 * ((T << 0) + (TR << 1) + (M << 2) + (R << 3));
            const offset3 = 8 * ((L << 0) + (M << 1) + (BL << 2) + (B << 3));
            const offset4 = 8 * ((M << 0) + (R << 1) + (B << 2) + (BR << 3));
            //console.log({TL, T, TR, L, M, R, BL, B, BR});
            //console.log({offset1, offset2, offset3, offset4});
            topLayer.tiles[ty][tx] = {
                index: 294,
                // This is the empty frame, but it actually won't even be drawn.
                frame: allTiles[1].frame,
                behaviors: {
                    render(context: CanvasRenderingContext2D, tile: FullTile, target: Rect, frameIndex: number) {
                        if (offset1) {
                            drawFrame(context, {image: tinyIceTiles.image, x: tinyIceTiles.x + offset1, y: tinyIceTiles.y, w: 8, h: 8}, {x: target.x, y: target.y, w: 8, h: 8});
                        }
                        if (offset2) {
                            drawFrame(context, {image: tinyIceTiles.image, x: tinyIceTiles.x + offset2, y: tinyIceTiles.y + 8, w: 8, h: 8}, {x: target.x + 8, y: target.y, w: 8, h: 8});
                        }
                        if (offset3) {
                            drawFrame(context, {image: tinyIceTiles.image, x: tinyIceTiles.x + offset3, y: tinyIceTiles.y + 16, w: 8, h: 8}, {x: target.x, y: target.y + 8, w: 8, h: 8});
                        }
                        if (offset4) {
                            drawFrame(context, {image: tinyIceTiles.image, x: tinyIceTiles.x + offset4, y: tinyIceTiles.y + 24, w: 8, h: 8}, {x: target.x + 8, y: target.y + 8, w: 8, h: 8});
                        }
                    },
                    isFrozen: true,
                    slippery: true,
                    // This is set to draw the underTile under the ice.
                    // The element tile is actually what is used to replace the tile if
                    // the ice is melted.
                    underTile: underTile || 0,
                    showUnderTile: true,
                    ledges: underLedges,
                    diagonalLedge: underDiagonalLedge,
                    elementTiles: {
                        fire: underTile || 0,
                    },
                },
            };
            if (area.tilesDrawn[ty]?.[tx]) {
                area.tilesDrawn[ty][tx] = false;
            }
            area.checkToRedrawTiles = true;
            resetTileBehavior(area, {x: tx, y: ty});
        }
    }
}
