import {allTiles} from 'app/content/tiles';
import {drawFrame} from 'app/utils/animations';
import {getDrawPriority} from 'app/utils/layers';
import {resetTileBehavior} from 'app/utils/tileBehavior';
import {requireFrame} from 'app/utils/packedImages';


// Add get layer to freeze

const tinyIceTiles = requireFrame('gfx/tiles/tinyIceTiles.png', {x: 0, y: 0, w: 128, h: 32});

export function refreshAreaIce(state: GameState, area: AreaInstance) {
    delete area.needsIceRefresh;
    for (let ty = 0; ty < area.h; ty++) {
        for (let tx = 0; tx < area.w; tx++) {
            // Only process tiles that have been marked as dirty to prevent checking lots of unnecessary tiles.
            if (area.tilesDrawn[ty]?.[tx]) {
                continue;
            }
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
            let underLedges: any, underDiagonalLedge: any;//, foundFrozenTile = false;
            for (const layer of area.layers) {
                // Never freeze anything in the foreground.
                if (getDrawPriority(layer.definition) === 'foreground') {
                    break;
                }
                if (layer.tiles[ty][tx] === allTiles[294]) {
                    //foundFrozenTile = true;
                }
                // TODO: treat the mask as another layer and apply the ice rendering to the mask layer when selected.
                // The ice should be drawn first then the mask frame.
                // The goal is for NE/NW mask tiles that include ledges render ice underneath
                const behaviors = {
                    ...layer.tiles[ty][tx]?.behaviors,
                    ...layer.maskTiles?.[ty]?.[tx]?.behaviors,
                };
                // Blocking layers prevent freezing until another layer is found that erases the blocking behavior.
                if (foundBlockingLayer && !(behaviors?.isLava || behaviors?.isLavaMap || behaviors?.cloudGround || behaviors?.isGround === true)) {
                    continue;
                }
                foundBlockingLayer = false;
                if (behaviors?.isFrozen || (!behaviors?.isOverlay
                    && !behaviors?.solid
                    && !behaviors?.pit && !behaviors?.pitMap
                    // Experimental: keep ledges drawn over ice for clarity and consistency with tiles
                    // that combine ledges+walls (usually SW/SE ledges).
                    && !behaviors?.ledges)
                    //&& !behaviors?.maskFrame
                ) {
                    underLedges = behaviors?.ledges || underLedges;
                    underDiagonalLedge = behaviors?.diagonalLedge || underDiagonalLedge;
                    topLayer = layer;
                } else {
                    foundBlockingLayer = true;
                    underLedges = behaviors?.ledges;// undefined;
                    underDiagonalLedge = behaviors?.diagonalLedge;//undefined;
                    /*if (foundFrozenTile) {
                        console.log('Clearing found frozen tile');
                    }
                    foundFrozenTile = false;*/
                }
            }
            // Don't adjust or freeze over existing frozen tiles.
            /*if (foundFrozenTile) {
                continue;
            }*/
            // If this is literally the square frozen tile, don't replace it.
            if (!topLayer || topLayer.tiles[ty][tx] === allTiles[294]) {
                continue;
            }
            // Fabricate a frozen tile that has the original tile "underneath it", so it will
            // return to the original state if exposed to fire.
            const currentTileBehaviors = topLayer.tiles[ty][tx]?.behaviors;
            const underTile = currentTileBehaviors?.isFrozen ? currentTileBehaviors.underTile : topLayer.tiles[ty][tx]?.index;
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
