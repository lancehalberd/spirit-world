import {renderAR} from 'app/arGames/arGame';
import {getOrCreateAreaInstanceFromLocation} from 'app/content/areas';
import {allTiles} from 'app/content/tiles';
import {editingState} from 'app/development/editingState';
import {
    CANVAS_HEIGHT, CANVAS_WIDTH, MAX_SPIRIT_RADIUS,
    FADE_IN_DURATION, FADE_OUT_DURATION,
    CIRCLE_WIPE_IN_DURATION, CIRCLE_WIPE_OUT_DURATION, MUTATE_DURATION,
    WATER_TRANSITION_DURATION,
} from 'app/gameConstants';
import {renderAreaLighting, renderSurfaceLighting, updateLightingCanvas, updateWaterSurfaceCanvas} from 'app/render/areaLighting';
import {fogCanvas} from 'app/render/fog';
import {renderHeroEyes, renderHeroShadow} from 'app/renderActor';
import {drawFrame } from 'app/utils/animations';
import {getBackgroundFrame, getBackgroundFrameIndex} from 'app/utils/area';
import {createCanvasAndContext, drawCanvas} from 'app/utils/canvas';
import {getDrawPriority} from 'app/utils/layers';
import {getFieldInstanceAndParts} from 'app/utils/objects';

// This is the max size of the spirit sight circle.
// The canvas is slightly wider to account for the circles being centered on each eye, which are 4 pixels from the center of the face.
const [spiritCanvas, spiritContext] = createCanvasAndContext((MAX_SPIRIT_RADIUS + 4) * 2, MAX_SPIRIT_RADIUS * 2);

//let spiritCanvasRadius: number;
export function updateSpiritCanvas(state: GameState, radius: number, maxRadius: number): void {
    //if (radius === spiritCanvasRadius) {
    //    return;
    //}
    //spiritCanvasRadius = radius;
    const spiritAlpha = 0.2 + 0.8 * radius / maxRadius;
    const x = spiritCanvas.width / 2;
    const y = spiritCanvas.height / 2
    const area = state.alternateAreaInstance;
    spiritContext.save();
        spiritContext.clearRect(0, 0, spiritCanvas.width, spiritCanvas.height);
        spiritContext.globalAlpha = spiritAlpha;
        let gradient = spiritContext.createRadialGradient(x - 4, y, 0, x - 4, y, radius);
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        spiritContext.fillStyle = gradient;
        spiritContext.beginPath();
        spiritContext.arc(x - 5, y, radius, 0, 2 * Math.PI);
        spiritContext.fill();
        gradient = spiritContext.createRadialGradient(x + 4, y, 0, x + 4, y, radius);
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        spiritContext.fillStyle = gradient;
        spiritContext.beginPath();
        spiritContext.arc(x + 5, y, radius, 0, 2 * Math.PI);
        spiritContext.fill();
        spiritContext.translate(
            -((state.hero.x | 0) + state.hero.w / 2 - state.camera.x - spiritCanvas.width / 2) | 0,
            -((state.hero.y | 0) - state.camera.y - spiritCanvas.height / 2 + 1) | 0
        );
        spiritContext.globalAlpha = 1;
        spiritContext.globalCompositeOperation = 'source-atop';
        renderAreaBackground(spiritContext, state, area);
        renderAreaObjectsBeforeHero(spiritContext, state, area);
        spiritContext.save();
            translateContextForAreaAndCamera(spiritContext, state, area);
            renderHeroEyes(spiritContext, state, state.hero);
        spiritContext.restore();
        renderAreaObjectsAfterHero(spiritContext, state, area);
        renderAreaForeground(spiritContext, state, area);
        // renderForegroundObjects(spiritContext, state, area);
    spiritContext.restore();
    if (state.zone.surfaceKey && !area.definition.isSpiritWorld) {
        spiritContext.save();
            spiritContext.globalCompositeOperation = 'source-atop';
            spiritContext.globalAlpha = 0.6;
            spiritContext.fillStyle = 'blue';
            spiritContext.fillRect(0, 0, spiritCanvas.width, spiritCanvas.height);
        spiritContext.restore();
    }
}

function applyScreenShakes(context: CanvasRenderingContext2D, state: GameState) {
    context.save();
    for (const screenShake of state.screenShakes) {
        const t = state.fieldTime + (state.transitionState?.time || 0) - screenShake.startTime;
        // If endTime is falsey, p stays at 1 the entire time.
        const p = screenShake.endTime
            ? Math.max(0, (1 - t / (screenShake.endTime - screenShake.startTime)))
            : 1;
        const amplitude = p * Math.sin(t / 20);
        context.translate(Math.round(screenShake.dx * amplitude), Math.round(screenShake.dy * amplitude));
    }
}

function removeScreenShakes(context: CanvasRenderingContext2D, state: GameState) {
    context.restore();
}

export function renderStandardFieldStack(context: CanvasRenderingContext2D, state: GameState, renderHero: boolean = null): void {
    applyScreenShakes(context, state);
        renderField(context, state, renderHero);
        renderSurfaceLighting(context, state, state.areaInstance, state.nextAreaInstance);
        renderFieldForeground(context, state, state.areaInstance, state.nextAreaInstance);
        renderWaterOverlay(context, state);
        renderHeatOverlay(context, state, state.areaSection);
        renderSpiritOverlay(context, state);
        renderAreaLighting(context, state, state.areaInstance, state.nextAreaInstance);
        context.save();
            translateContextForAreaAndCamera(context, state, state.areaInstance);
            renderAR(context, state);
        context.restore();
    removeScreenShakes(context, state);
}
export function renderStandardFieldStackWithoutWaterOverlay(context: CanvasRenderingContext2D, state: GameState, renderHero: boolean = null): void {
    renderField(context, state, renderHero);
    renderSurfaceLighting(context, state, state.areaInstance, state.nextAreaInstance);
    renderFieldForeground(context, state, state.areaInstance, state.nextAreaInstance);
    renderSpiritOverlay(context, state);
    renderAreaLighting(context, state, state.areaInstance, state.nextAreaInstance);
    context.save();
        translateContextForAreaAndCamera(context, state, state.areaInstance);
        renderAR(context, state);
    context.restore();
}

export function translateContextForAreaAndCamera(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance): void {
    context.translate((-state.camera.x + area.cameraOffset.x) | 0, (-state.camera.y + area.cameraOffset.y) | 0);
}

/*
export function checkToRedrawTiles(area: AreaInstance) {
    if (editingState.isEditing) {
        const w = 16, h = 16;
        for (let y = 0; y < area.h; y++) {
            for (let x = 0; x < area.w; x++) {
                if (!area.tilesDrawn?.[y]?.[x]) {
                    area.context.clearRect(x * w, y * h, w, h);
                    if (area.foregroundContext) {
                        area.foregroundContext.clearRect(x * w, y * h, w, h);
                    }
                }
            }
        }
    }
    area.layers.map((layer, index) => renderLayer(area, layer, area.definition.parentDefinition?.layers?.[index]));
    for (let y = 0; y < area.h; y++) {
        if (!area.tilesDrawn[y]) {
            area.tilesDrawn[y] = [];
        }
        for (let x = 0; x < area.w; x++) {
            area.tilesDrawn[y][x] = true;
        }
    }
    area.checkToRedrawTiles = false;
}
*/
export function checkToRedrawTiles(area: AreaInstance) {
    const w = 16, h = 16;
    for (let y = 0; y < area.h; y++) {
        if (!area.tilesDrawn[y]) {
            area.tilesDrawn[y] = [];
        }
        for (let x = 0; x < area.w; x++) {
            if (area.tilesDrawn?.[y]?.[x]) {
                continue;
            }
            area.tilesDrawn[y][x] = true;
            for (const backgroundFrame of area.backgroundFrames) {
                if (!backgroundFrame.tilesDrawn[y]?.[x]) {
                    continue;
                }
                backgroundFrame.tilesDrawn[y][x] = false;
                if (editingState.isEditing) {
                    backgroundFrame.context.clearRect(x * w, y * h, w, h);
                }
            }
            for (const foregroundFrame of area.foregroundFrames) {
                if (!foregroundFrame.tilesDrawn[y]?.[x]) {
                    continue;
                }
                foregroundFrame.tilesDrawn[y][x] = false;
                foregroundFrame.context.clearRect(x * w, y * h, w, h);
            }
        }
    }
    area.drawnFrames = new Set();
    area.checkToRedrawTiles = false;
}

// Draws a full screen of tiles that contains all tiles necessary to display the current frame of the game for this area frame.
export function drawDisplayedTiles(state: GameState, area: AreaInstance, frame: AreaFrame): number {
    let tilesDrawn = 0;
    if (!area || area.drawnFrames.has(frame)) {
        return tilesDrawn;
    }
    const tx = ((state.camera.x - area.cameraOffset.x) / 16) | 0;
    const ty = ((state.camera.y - area.cameraOffset.y) / 16) | 0;
    // These are the maximum number of distinct tiles that can at least be partially shown at once.
    const w = 18;
    const h = 16;
    const bounds: Rect = {
        x: Math.min(area.w - w, Math.max(tx - 1, 0)),
        y: Math.min(area.h - h, Math.max(ty - 1, 0)),
        w,
        h,
    };
    return renderTiles(area, frame, bounds);
}
export function drawDisplayedFrames(state: GameState, area: AreaInstance, currentFrameIndex = getBackgroundFrameIndex(state, area)) {
    if (!area) {
        return;
    }
    drawDisplayedTiles(state, area, area.backgroundFrames[currentFrameIndex]);
    drawDisplayedTiles(state, area, area.foregroundFrames[0]);
}
const tilesPerFrame = 256;
export function drawEntireFrame(state: GameState, area: AreaInstance, frameIndex: number): void {
   if (!area) {
        return;
    }
    const bounds = {x: 0, y: 0, w: area.w, h: area.h}
    renderTiles(area, area.backgroundFrames[frameIndex], bounds, 0);
    renderTiles(area, area.foregroundFrames[frameIndex], bounds, 0);
    area.drawnFrames.add(area.backgroundFrames[frameIndex]);
    area.drawnFrames.add(area.foregroundFrames[frameIndex]);
}
export function drawRemainingFrames(state: GameState, area: AreaInstance, currentFrameIndex = getBackgroundFrameIndex(state, area)): number {
    let drawCount = 0;
    if (!area) {
        return drawCount;
    }
    if (editingState.isEditing) {
        drawEntireFrame(state, area, 0);
        return area.w * area.h;
    }
    const bounds = {x: 0, y: 0, w: area.w, h: area.h}

    drawDisplayedFrames(state, area, currentFrameIndex);
    drawCount = 0;
    for (let i = 0; i < 6; i++) {
        const frameIndex = (currentFrameIndex + i) % 6;
        const backgroundFrame = area.backgroundFrames[frameIndex];
        if (area.drawnFrames.has(backgroundFrame)) {
            continue;
        }
        drawCount += renderTiles(area, backgroundFrame, bounds, tilesPerFrame - drawCount);
        // If drawCount is greater than 0, this frame may not be finished.
        if (drawCount >= tilesPerFrame) {
            break;
        }
        // console.log('Drawing backgroundFrame', frameIndex);
        area.drawnFrames.add(backgroundFrame);
    }
    for (let i = 0; i < 1; i++) {
        const frameIndex = 0;
        let foregroundFrame: AreaFrame = area.foregroundFrames[frameIndex];
        if (area.drawnFrames.has(foregroundFrame)) {
            continue;
        }
        drawCount += renderTiles(area, foregroundFrame, bounds, tilesPerFrame - drawCount);
        if (drawCount >= tilesPerFrame) {
            break;
        }
        // console.log('Drawing foregroundFrame', frameIndex);
        area.drawnFrames.add(foregroundFrame);
    }
    /*if (drawCount > 0) {
        console.log(drawCount);
    }*/
    return drawCount;
}

//const baseVariantRandom = SRandom.seed(variantSeed);

const [maskCanvas, maskContext] = createCanvasAndContext(16, 16);
export function renderTiles(
    area: AreaInstance,
    areaFrame: AreaFrame,
    r: Rect = {x: 0, y: 0, w: area.w, h: area.h},
    maxTiles = 0,
): number {
    const w = 16, h = 16;
    const context = areaFrame.context;
    // Collect layers to draw to this Area Frame based on whether it is a background or foreground frame.
    const layersToDraw: AreaLayer[] = [];
    for (let index = 0; index < area.layers.length; index++) {
        const layer = area.layers[index];
        const isForeground = getDrawPriority(layer.definition) === 'foreground';
        if (isForeground !== areaFrame.isForeground) {
            continue;
        }
        layersToDraw.push(layer);
    }
    let tilesDrawn = 0;
    for (let y = r.y; y < r.y + r.h; y++) {
        if (!areaFrame.tilesDrawn[y]) {
            areaFrame.tilesDrawn[y] = [];
        }
        for (let x = r.x; x < r.x + r.w; x++) {
            if (areaFrame.tilesDrawn[y][x]) {
                continue;
            }
            tilesDrawn++;
            if (maxTiles && tilesDrawn > maxTiles) {
                // console.log(areaFrame.isForeground ? 'F' : 'B', areaFrame.frameIndex, ' drew limit ', maxTiles);
                return maxTiles;
            }
            areaFrame.tilesDrawn[y][x] = true;
            for (const layer of layersToDraw) {
                let tile = layer.tiles[y]?.[x];
                const maskTile = layer.maskTiles?.[y]?.[x];
                // This is a bit of a hack to keep water from animating under frozen tiles, but this might be okay
                // in the long run since we don't have that many animated tiles.
                const frameIndex = area.behaviorGrid[y]?.[x]?.isFrozen ? 0 : areaFrame.frameIndex;
                context.save();
                if (editingState.isEditing && editingState.selectedLayerKey !== layer.key) {
                    if (layer.definition.visibilityOverride === 'fade') {
                        context.globalAlpha *= 0.3;
                    } else if (editingState.selectedLayerKey) {
                        context.globalAlpha *= 0.5;
                    }
                }
                if (tile?.behaviors?.underTile > 1 && tile?.behaviors?.showUnderTile) {
                    const underTile = allTiles[tile?.behaviors?.underTile];
                    if (underTile?.frame) {
                        // underTile is never animated.
                        drawFrame(context, underTile.frame, {x: x * w, y: y * h, w, h});
                    }
                }
                if (editingState.isEditing) {
                    if (tile?.behaviors?.editorTransparency) {
                        context.globalAlpha *= tile.behaviors.editorTransparency;
                    }
                }
                if (maskTile) {
                    // Create the masked tile to draw underneath the mask frame.
                    if (tile) {
                        maskContext.clearRect(0, 0, 16, 16);
                        maskContext.globalCompositeOperation = 'source-over';
                        if (!maskTile.behaviors.maskFrame) {
                            console.error('Mask tile was missing maskFrame. This can happen when tile indexes are shifted due to added/removed tiles.');
                            debugger;
                        }
                        // mask frames do not support animation.
                        drawFrame(maskContext, maskTile.behaviors.maskFrame, {x: 0, y: 0, w: 16, h: 16});
                        maskContext.globalCompositeOperation = 'source-in';
                        renderTileFrame(tile, frameIndex, maskContext, {x: 0, y: 0, w: 16, h: 16});
                        // Draw the masked content first, then the mask frame on top.
                        //window['debugCanvas'](maskCanvas);
                        context.drawImage(maskCanvas, 0, 0, 16, 16, x * w, y * h, w, h);
                    }
                    renderTileFrame(maskTile, frameIndex, context, {x: x * w, y: y * h, w, h});
                } else if (tile) {
                    renderTileFrame(tile, frameIndex, context, {x: x * w, y: y * h, w, h});
                }
                context.restore();
            }
        }
    }
    // console.log(areaFrame.isForeground ? 'F' : 'B', areaFrame.frameIndex, ' drew ', tilesDrawn);
    return tilesDrawn;
}
/*export function renderLayer(
    layer: AreaLayer,
    parentLayer: AreaLayerDefinition,
    areaFrame: AreaFrame,
    r: Rect = {x: 0, y: 0, w: layer.w, h: layer.h},
    maxTiles = 0,
): number {
    const w = 16, h = 16;
    const context = areaFrame.context;
    let tilesDrawn = 0;
    context.save();
    if (editingState.isEditing && editingState.selectedLayerKey !== layer.key) {
        if (layer.definition.visibilityOverride === 'fade') {
            context.globalAlpha *= 0.3;
        } else if (editingState.selectedLayerKey) {
            context.globalAlpha *= 0.5;
        }
    }
    for (let y = r.y; y < r.y + r.h; y++) {
        if (!areaFrame.tilesDrawn[y]) {
            areaFrame.tilesDrawn[y] = [];
        }
        for (let x = r.x; x < r.x + r.w; x++) {
            if (areaFrame.tilesDrawn[y][x]) {
                continue;
            }
            tilesDrawn++;
            if (maxTiles && tilesDrawn > maxTiles) {
                return;
            }
            let tile = layer.tiles[y][x];
            const maskTile = layer.maskTiles?.[y]?.[x];
            context.save();
            if (tile?.behaviors?.underTile > 1 && tile?.behaviors?.showUnderTile) {
                const underTile = allTiles[tile?.behaviors?.underTile];
                if (underTile?.frame) {
                    // underTile is never animated.
                    drawFrame(context, underTile.frame, {x: x * w, y: y * h, w, h});
                }
            }
            if (editingState.isEditing) {
                if (tile?.behaviors?.editorTransparency) {
                    context.globalAlpha *= tile.behaviors.editorTransparency;
                }
            }
            if (maskTile) {
                // Create the masked tile to draw underneath the mask frame.
                if (tile) {
                    maskContext.clearRect(0, 0, 16, 16);
                    maskContext.globalCompositeOperation = 'source-over';
                    if (!maskTile.behaviors.maskFrame) {
                        console.error('Mask tile was missing maskFrame. This can happen when tile indexes are shifted due to added/removed tiles.');
                        debugger;
                    }
                    // mask frames do not support animation.
                    drawFrame(maskContext, maskTile.behaviors.maskFrame, {x: 0, y: 0, w: 16, h: 16});
                    maskContext.globalCompositeOperation = 'source-in';
                    renderTileFrame(tile, areaFrame.frameIndex, maskContext, {x: 0, y: 0, w: 16, h: 16});
                    // Draw the masked content first, then the mask frame on top.
                    //window['debugCanvas'](maskCanvas);
                    context.drawImage(maskCanvas, 0, 0, 16, 16, x * w, y * h, w, h);
                }
                renderTileFrame(maskTile, areaFrame.frameIndex, context, {x: x * w, y: y * h, w, h});
            } else if (tile) {
                renderTileFrame(tile, areaFrame.frameIndex, context, {x: x * w, y: y * h, w, h});
            }
            context.restore();
        }
    }
    context.restore();
    return tilesDrawn;
}*/

function updateObjectsToRender(this: void, state: GameState, area: AreaInstance) {
    if (!area) {
        return;
    }
    area.objectsToRender = [];
    for (const object of [...area?.objects || [], ...area?.effects || []]) {
        for (const part of getFieldInstanceAndParts(state, object)) {
            // Invisible objects are not rendered unless the hero has true sight.
            if (!editingState.isEditing && !state.hero.savedData.passiveTools.trueSight && object.definition?.isInvisible) {
                continue;
            }
            if (part.render || part.renderShadow || part.renderForeground) {
                if (!part.renderParent) {
                    area.objectsToRender.push(part);
                }
                if (part.getYDepth) {
                    part.yDepth = part.getYDepth();
                } else if (part.getHitbox) {
                    const hitbox = part.getHitbox();
                    part.yDepth = hitbox.y + hitbox.h;
                } else {
                    part.yDepth = part.y;
                }
            }
        }
    }
    // Also include anything from the alternate area that has an `alternateRender*` method defined.
    // For example, Vanara NPCs render faint spirits in the alternate world.
    for (const object of [...area?.alternateArea?.objects || [], ...area?.alternateArea?.effects || []]) {
        for (const part of getFieldInstanceAndParts(state, object)) {
            // Invisible objects are not rendered unless the hero has true sight.
            if (!editingState.isEditing && !state.hero.savedData.passiveTools.trueSight && object.definition?.isInvisible) {
                continue;
            }
            if (part.alternateRender || part.alternateRenderShadow || part.alternateRenderForeground) {
                if (!part.renderParent) {
                    area.objectsToRender.push(part);
                }
                if (part.getYDepth) {
                    part.yDepth = part.getYDepth();
                } else if (part.getHitbox) {
                    const hitbox = part.getHitbox();
                    part.yDepth = hitbox.y + hitbox.h;
                } else {
                    part.yDepth = part.y;
                }
            }
        }
    }
}

export function renderField(
    context: CanvasRenderingContext2D,
    state: GameState,
    shouldRenderHero: boolean = null
): void {
    updateObjectsToRender(state, state.areaInstance);
    updateObjectsToRender(state, state.alternateAreaInstance);
    updateObjectsToRender(state, state.nextAreaInstance);
    if (editingState.isEditing) {
        context.fillStyle = 'yellow';
        context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
        // context.fillStyle = 'yellow';
        // context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    // Update any background tiles that have changed.
    if (state.areaInstance.checkToRedrawTiles) {
        checkToRedrawTiles(state.areaInstance);
        updateLightingCanvas(state.areaInstance);
        // Don't update the water surface canvas on the same draw as updating other tiles.
        // This won't be rendered until they leave they submerge and leave the current area so
        // there isn't any rush to update it.
        state.areaInstance.checkToRedrawWaterSurface = true;
    } else if (state.areaInstance.checkToRedrawWaterSurface) {
        // Update the canvas for displaying lights from the surface in the water area.
        state.areaInstance.checkToRedrawWaterSurface = false;
        if (state.underwaterAreaInstance) {
            updateWaterSurfaceCanvas(state, state.underwaterAreaInstance);
        }
    }
    if (state.alternateAreaInstance.checkToRedrawTiles) {
        checkToRedrawTiles(state.alternateAreaInstance);
        updateLightingCanvas(state.alternateAreaInstance);
    }
    if (state.nextAreaInstance?.checkToRedrawTiles) {
        checkToRedrawTiles(state.nextAreaInstance);
        updateLightingCanvas(state.nextAreaInstance);
    }
    drawRemainingFrames(state, state.areaInstance);
    drawRemainingFrames(state, state.nextAreaInstance);
    drawRemainingFrames(state, state.alternateAreaInstance);

    // Draw the field, enemies, objects and hero.
    renderAreaBackground(context, state, state.areaInstance);
    renderAreaBackground(context, state, state.nextAreaInstance);
    renderAreaObjectsBeforeHero(context, state, state.areaInstance);
    renderAreaObjectsBeforeHero(context, state, state.nextAreaInstance);
    if (shouldRenderHero === true || (shouldRenderHero !== false && state.hero.area === state.areaInstance)) {
        renderHero(context, state);
    }

    renderAreaObjectsAfterHero(context, state, state.areaInstance);
    renderAreaObjectsAfterHero(context, state, state.nextAreaInstance);

    if (editingState.isEditing) {
        // Draw adjacent areas when editing for additional context.
        for (let dy = -1; dy <= 1; dy++) {
            const y = state.location.areaGridCoords.y + dy;
            if (y < 0 || y > state.zone.floors[state.location.floor].grid.length - 1) {
                continue;
            }
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) {
                    continue;
                }
                const x = state.location.areaGridCoords.x + dx;
                if (x < 0 || x > state.zone.floors[state.location.floor].grid[y].length - 1) {
                    continue;
                }
                // This will use cached area instances if available.
                const area = getOrCreateAreaInstanceFromLocation(state, {
                    ...state.location,
                    areaGridCoords: {x, y},
                });
                if (!area) {
                    continue;
                }
                area.cameraOffset = {
                    x: dx * area.w * 16 + (state.nextAreaInstance?.cameraOffset.x || 0),
                    y: dy * area.h * 16 + (state.nextAreaInstance?.cameraOffset.y || 0),
                };
                if (area?.checkToRedrawTiles) {
                    checkToRedrawTiles(area);
                }
                drawRemainingFrames(state, area);
                renderAreaBackground(context, state, area);
                renderAreaForeground(context, state, area);
            }
        }
    }
}

export function renderHero(context: CanvasRenderingContext2D, state: GameState) {
    if (!state.hero.renderParent) {
        context.save();
            translateContextForAreaAndCamera(context, state, state.areaInstance);
            renderObjectWithEffects(context, state, state.hero, () => state.hero.render(context, state));
        context.restore();
    }
}

export function renderFieldForeground(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance, nextArea?: AreaInstance) {
    renderAreaForeground(context, state, area);
    if (nextArea) {
        renderAreaForeground(context, state, nextArea);
    }
    renderForegroundObjects(context, state, area);
    if (nextArea) {
        renderForegroundObjects(context, state, nextArea);
    }
}

export function renderWaterOverlay(context: CanvasRenderingContext2D, state: GameState) {
    if (!editingState.isEditing && state.zone.surfaceKey && !state.areaInstance.definition.isSpiritWorld && state.transitionState?.type !== 'surfacing') {
        context.save();
            context.globalAlpha = 0.6;
            context.fillStyle = 'blue';
            context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.restore();
    }
}

//effects/fog.png 256x128 -> 256x256 then creat pattern.
const fogV = {x: 10, y: 10};
export function renderHeatOverlay(context: CanvasRenderingContext2D, state: GameState, areaSection?: AreaSectionInstance) {
    if (!areaSection) {
        return;
    }
    if (!editingState.isEditing && state.hotLevel > 0) {
        context.save();
            context.globalAlpha = 0.4 * state.hotLevel;
            context.fillStyle = 'red';
            context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.restore();
    }
    if (!editingState.isEditing && areaSection?.isFoggy) {
        context.save();
            const fogPattern = context.createPattern(fogCanvas, 'repeat');
            const dx = state.camera.x - fogV.x * state.fieldTime / 1000;
            const dy = state.camera.y - fogV.y * state.fieldTime / 1000;
            context.translate(-dx, -dy);
            context.fillStyle = fogPattern;
            context.fillRect(dx, dy, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.restore();
    }
}

export function renderSpiritOverlay(context: CanvasRenderingContext2D, state: GameState) {
    if (state.hero.spiritRadius > 0) {
        context.save();
        const effectiveMaxRadius = state.hero.savedData.passiveTools.spiritSight
            ? state.hero.maxSpiritRadius
            : MAX_SPIRIT_RADIUS;
        context.globalAlpha = state.hero.spiritRadius / effectiveMaxRadius;
        context.fillStyle = '#888';
        context.globalCompositeOperation = 'hue';
        context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.restore();
        updateSpiritCanvas(state, state.hero.spiritRadius, effectiveMaxRadius);
        context.drawImage(spiritCanvas,
            0, 0, spiritCanvas.width, spiritCanvas.height,
            ((state.hero.x | 0) + state.hero.w / 2 - spiritCanvas.width / 2
            - state.camera.x + state.areaInstance.cameraOffset.x) | 0,
            ((state.hero.y | 0) - spiritCanvas.height / 2 + 1
             - state.camera.y + state.areaInstance.cameraOffset.y) | 0,
            spiritCanvas.width, spiritCanvas.height
        );
    }
}

// Fully renders an area to a canvas, but with no state effects like spirit sight.
// This is used during the transition to and from the spirit world.
export function renderArea(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance, renderHero: boolean = null): void {
    updateObjectsToRender(state, area);
    // Update any background tiles that have changed.
    if (area.checkToRedrawTiles) {
        checkToRedrawTiles(area);
        updateLightingCanvas(area);
    }
    drawRemainingFrames(state, area);
    // Draw the field, enemies, objects and hero.
    renderAreaBackground(context, state, area);
    renderAreaObjectsBeforeHero(context, state, area);
    if (renderHero === true || (renderHero !== false && state.hero.area === area)) {
        context.save();
            translateContextForAreaAndCamera(context, state, area);
            renderObjectWithEffects(context, state, state.hero, () => state.hero.render(context, state));
        context.restore();
    }
    renderAreaObjectsAfterHero(context, state, area);
    renderAreaForeground(context, state, area);
}

export function renderAreaBackground(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance): void {
    if (!area) {
        return;
    }
    // Render the entire area while editing. We can make this more specific if we notice performance issues.
    const rect = editingState.isEditing ?
        {x: 0, y: 0, w: area.w * 16, h: area.h * 16} : {
            x: (state.camera.x - area.cameraOffset.x) | 0,
            y: (state.camera.y - area.cameraOffset.y) | 0,
            w: CANVAS_WIDTH,
            h: CANVAS_HEIGHT,
        };
    context.save();
        translateContextForAreaAndCamera(context, state, area);
        drawCanvas(context, getBackgroundFrame(state, area).canvas, rect, rect);
    context.restore();
}

export function renderAreaForeground(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance): void {
    // Render the tiles foreground if it exists.
    if (area.foregroundFrames[0]) {
        // Render the entire area while editing. We can make this more specific if we notice performance issues.
        const rect = editingState.isEditing ?
            {x: 0, y: 0, w: area.w * 16, h: area.h * 16} : {
                x: (state.camera.x - area.cameraOffset.x) | 0,
                y: (state.camera.y - area.cameraOffset.y) | 0,
                w: CANVAS_WIDTH,
                h: CANVAS_HEIGHT,
            };
        context.save();
            translateContextForAreaAndCamera(context, state, area);
            drawCanvas(context, area.foregroundFrames[0].canvas, rect, rect);
        context.restore();
    }
    renderForegroundObjects(context, state, area);

    if (editingState.isEditing) {
        context.strokeStyle = '#FFF';
        context.save();
            translateContextForAreaAndCamera(context, state, area);
            for (const section of area.definition.sections) {
                context.strokeRect(section.x * 16, section.y * 16, section.w * 16, section.h * 16);
            }
        context.restore();
        context.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    }
    if (editingState.showWalls) {
        context.save();
            context.fillStyle = 'red';
            context.globalAlpha *= editingState.showWallsOpacity;
            translateContextForAreaAndCamera(context, state, area);
            for (let y = 0; y < area.h; y++) {
                if (!area.tilesDrawn[y]) {
                    area.tilesDrawn[y] = [];
                }
                for (let x = 0; x < area.w; x++) {
                    const behaviors = area.behaviorGrid[y][x];
                    if (behaviors?.solid === true) {
                        context.fillRect(16 * x, 16 * y, 16, 16);
                    } else if (behaviors?.solid) {
                        for (let sy = 0; sy < 16; sy++) {
                            for (let sx = 0; sx < 16; sx++) {
                                if (behaviors.solid[sy] >> (15 - sx) & 1) {
                                    context.fillRect(16 * x + sx, 16 * y +sy, 1, 1);
                                }
                            }
                        }
                    }
                }
            }
        context.restore();
    }
}

function renderObjectWithEffects(
    context: CanvasRenderingContext2D,
    state: GameState,
    object: ObjectInstance | EffectInstance,
    callback: () => void
): void {

        if (object.z > 100) {
            context.save();
            context.globalAlpha *= Math.max(0, 1 - (object.z - 100) / 28);
        }
        callback();
        if (object.z > 100) {
            context.restore();
        }
}

export function renderAreaObjectsBeforeHero(
    context: CanvasRenderingContext2D,
    state: GameState,
    area: AreaInstance,
    doNotTranslate: boolean = false,
): void {
    if (!area) {
        return;
    }
    const backgroundDepth: number|undefined = state.hero.getDrawPriority(state) === 'background'
        ? state.hero.drawPriorityIndex : undefined;
    context.save();
        if (!doNotTranslate) {
            translateContextForAreaAndCamera(context, state, area);
        }
        const backgroundObjects: (EffectInstance | ObjectInstance)[] = [];
        const spriteObjects: (EffectInstance | ObjectInstance)[] = [];
        // Currently the jumping down logic uses hero y value to simulate a z value.
        // Because of this, to render the hero in the correct order we need to pretend the
        // y value is greater than it actually is. Otherwise they will be rendered behind
        // things like door frames that they should be jumping in front of.
        const heroYDepth = (state.hero.action === 'jumpingDown' && state.hero.d === 'down')
            ? state.hero.y + 16 + state.hero.z : state.hero.y + 16;
        for (const object of area.objectsToRender) {
            const drawPriority = object.drawPriority || object.getDrawPriority?.(state);
            if (drawPriority === 'background') {
                if (backgroundDepth !== undefined && backgroundDepth < (object.drawPriorityIndex || 0)) {
                    continue;
                }
                if (object.area?.definition === area.definition && object.render) {
                    backgroundObjects.push(object);
                } else if (object.area?.definition !== area.definition && object.alternateRender) {
                    backgroundObjects.push(object);
                }
            }
            // If the hero has background draw priority, nothing in the sprite layer is drawn before it.
            if (backgroundDepth === undefined && drawPriority === 'sprites' && object.yDepth <= heroYDepth) {
                if (object.area?.definition === area.definition && object.render) {
                    spriteObjects.push(object);
                } else if (object.area?.definition !== area.definition && object.alternateRender) {
                    spriteObjects.push(object);
                }
            }
        }
        // Background objects are rendered in order of their drawPriorityIndex value.
        backgroundObjects.sort((A, B) => (A.drawPriorityIndex || 0) - (B.drawPriorityIndex || 0));
        for (const objectOrEffect of backgroundObjects) {
            if (objectOrEffect.area?.definition === area.definition) {
                renderObjectWithEffects(context, state, objectOrEffect, () => objectOrEffect.render?.(context, state));
            } else {
                renderObjectWithEffects(context, state, objectOrEffect, () => objectOrEffect.alternateRender?.(context, state));
            }
        }
        // Render shadows after background objects but before all sprite objects.
        for (const object of area.objectsToRender) {
            if (object.area?.definition === area.definition) {
                renderObjectWithEffects(context, state, object, () => object.renderShadow?.(context, state));
            } else {
                renderObjectWithEffects(context, state, object, () => object.alternateRenderShadow?.(context, state));
            }
        }
        if (!state.hero.renderParent) {
            if (area === state.areaInstance && !editingState.isEditing) {
                renderObjectWithEffects(context, state, state.hero, () => renderHeroShadow(context, state, state.hero));
            } else if (state.transitionState?.type === 'mutating' && area === state.transitionState.nextAreaInstance) {
                renderObjectWithEffects(context, state, state.hero, () => renderHeroShadow(context, state, state.hero));
            }
        }
        spriteObjects.sort((A, B) => A.yDepth - B.yDepth);
        for (const objectOrEffect of spriteObjects) {
            if (objectOrEffect.area?.definition === area.definition) {
                renderObjectWithEffects(context, state, objectOrEffect, () => objectOrEffect.render?.(context, state));
            } else {
                renderObjectWithEffects(context, state, objectOrEffect, () => objectOrEffect.alternateRender?.(context, state));
            }
        }
    context.restore();
}

export function renderAreaObjectsAfterHero(
    context: CanvasRenderingContext2D,
    state: GameState,
    area: AreaInstance,
    doNotTranslate: boolean = false,
): void {
    if (!area) {
        return;
    }
    context.save();
        if (!doNotTranslate) {
            translateContextForAreaAndCamera(context, state, area);
        }
        const backgroundObjects: (EffectInstance | ObjectInstance)[] = [];
        const spriteObjects: (EffectInstance | ObjectInstance)[] = [];
        const backgroundDepth: number|undefined = state.hero.getDrawPriority(state) === 'background'
            ? state.hero.drawPriorityIndex : undefined;
        // Currently the jumping down logic uses hero y value to simulate a z value.
        // Because of this, to render the hero in the correct order we need to pretend the
        // y value is greater than it actually is. Otherwise they will be rendered behind
        // things like door frames that they should be jumping in front of.
        const heroYDepth = (state.hero.action === 'jumpingDown' && state.hero.d === 'down')
            ? state.hero.y + 16 + state.hero.z : state.hero.y + 16;
        for (const object of area.objectsToRender) {
            const drawPriority = object.drawPriority || object.getDrawPriority?.(state);
            if (backgroundDepth !== undefined
                && (drawPriority === 'background')
                && backgroundDepth < (object.drawPriorityIndex || 0)
            ) {
                if (object.area?.definition === area.definition && object.render) {
                    backgroundObjects.push(object);
                } else if (object.area?.definition !== area.definition && object.alternateRender) {
                    backgroundObjects.push(object);
                }
                continue;
            }
            // If the hero has background draw priority, everything in the sprite layer is drawn after it.
            if (drawPriority === 'sprites' && (backgroundDepth !== undefined || (object.yDepth) > heroYDepth)) {
                if (object.area?.definition === area.definition && object.render) {
                    spriteObjects.push(object);
                } else if (object.area?.definition !== area.definition && object.alternateRender) {
                    spriteObjects.push(object);
                }
            }
        }
        // Background objects are rendered in order of their drawPriorityIndex value.
        backgroundObjects.sort((A, B) => (A.drawPriorityIndex || 0) - (B.drawPriorityIndex || 0));
        for (const objectOrEffect of backgroundObjects) {
            if (objectOrEffect.area?.definition === area.definition) {
                renderObjectWithEffects(context, state, objectOrEffect, () => objectOrEffect.render?.(context, state));
            } else {
                renderObjectWithEffects(context, state, objectOrEffect, () => objectOrEffect.alternateRender?.(context, state));
            }
        }
        // Sprite objects are rendered in order of their y positions.
        spriteObjects.sort((A, B) => A.yDepth - B.yDepth);
        for (const objectOrEffect of spriteObjects) {
            if (objectOrEffect.area?.definition === area.definition) {
                renderObjectWithEffects(context, state, objectOrEffect, () => objectOrEffect.render?.(context, state));
            } else {
                renderObjectWithEffects(context, state, objectOrEffect, () => objectOrEffect.alternateRender?.(context, state));
            }
        }
    context.restore();
}

export function renderForegroundObjects(
    context: CanvasRenderingContext2D,
    state: GameState,
    area: AreaInstance,
    doNotTranslate: boolean = false,
): void {
    if (!area) {
        return;
    }
    context.save();
        if (!doNotTranslate) {
            translateContextForAreaAndCamera(context, state, area);
        }
        const foregroundObjects: (EffectInstance | ObjectInstance)[] = [];
        // foreground2Objects render in front of the hero even when they are falling from great heights.
        const foreground2Objects: (EffectInstance | ObjectInstance)[] = [];
        for (const object of area.objectsToRender) {
            // There is no alternateRenderForeground2 supported yet.
            if (object.area?.definition === area.definition && object.renderForeground2) {
                foreground2Objects.push(object);
            }
            if ((object.area?.definition === area.definition && object.renderForeground)
                || (object.area?.definition !== area.definition && object.alternateRenderForeground)
            ) {
                foregroundObjects.push(object);
            } else {
                const drawPriority = object.drawPriority || object.getDrawPriority?.(state);
                if (!drawPriority || drawPriority === 'foreground') {
                    foregroundObjects.push(object);
                }
            }
        }
        for (const object of foregroundObjects) {
            if (object.area?.definition === area.definition) {
                if (object.renderForeground) {
                    renderObjectWithEffects(context, state, object, () => object.renderForeground(context, state));
                } else {
                    renderObjectWithEffects(context, state, object, () => object.render?.(context, state));
                }
            } else {
                if (object.alternateRenderForeground) {
                    renderObjectWithEffects(context, state, object, () => object.alternateRenderForeground(context, state));
                } else {
                    renderObjectWithEffects(context, state, object, () => object.alternateRender?.(context, state));
                }
            }
        }
        renderObjectWithEffects(context, state, state.hero, () => state.hero.renderForeground?.(context, state));
        for (const object of foreground2Objects) {
            if (object.area?.definition === area.definition) {
                renderObjectWithEffects(context, state, object, () => object.renderForeground2(context, state));
            }
        }
    context.restore();
}

function renderTileFrame(tile: FullTile, frameIndex: number, context: CanvasRenderingContext2D, target: Rect) {
    if (tile.behaviors?.render) {
        tile.behaviors.render(context, tile, target, frameIndex);
    } else if (tile.animation) {
        const frame = tile.animation.frames[frameIndex % tile.animation.frames.length];
        drawFrame(context, frame, target);
    } else {
        drawFrame(context, tile.frame, target);
    }
}

export function renderTransition(context: CanvasRenderingContext2D, state: GameState) {
    if (state.transitionState.type === 'diving' || state.transitionState.type === 'surfacing') {
        const dz = state.transitionState.nextLocation.z - state.hero.z;
        if (state.transitionState.time <= WATER_TRANSITION_DURATION) {
            context.fillStyle = 'black';
            context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            if (!state.transitionState.patternCanvas) {
                const [patternCanvas, patternContext] = createCanvasAndContext(CANVAS_WIDTH, CANVAS_HEIGHT);
                state.transitionState.patternCanvas = patternCanvas;
                renderArea(patternContext, state, state.transitionState.nextAreaInstance, false);
                if (state.transitionState.type === 'diving') {
                    patternContext.save();
                        translateContextForAreaAndCamera(patternContext, state, state.transitionState.nextAreaInstance);
                        renderHeroShadow(patternContext, state, state.hero, true);
                    patternContext.restore();
                    renderAreaLighting(patternContext, state, state.transitionState.nextAreaInstance);
                    renderSurfaceLighting(patternContext, state, state.transitionState.nextAreaInstance);
                } else {
                    renderHeatOverlay(patternContext, state, state.transitionState.nextAreaSection);
                }
                state.transitionState.pattern = context.createPattern(state.transitionState.patternCanvas, 'repeat');
            }
            const p = Math.min(1, state.transitionState.time / WATER_TRANSITION_DURATION);
            if (state.transitionState.type === 'surfacing') {
                context.save();
                    context.translate(0, dz + 24);
                    renderStandardFieldStackWithoutWaterOverlay(context, state, false);
                context.restore();
                context.save();
                    translateContextForAreaAndCamera(context, state, state.transitionState.nextAreaInstance);
                    state.hero.render(context, state);
                context.restore();
                context.save();
                    context.globalAlpha *= 0.6;
                    // This needs to match the styles we use for rendering underwater areas.
                    context.fillStyle = 'blue';
                    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                context.restore();
                context.save();
                    context.globalAlpha *= p * p;
                    context.translate(0, dz);
                    context.fillStyle = state.transitionState.pattern;
                    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                context.restore();
                context.save();
                    context.globalAlpha *= p * p;
                    translateContextForAreaAndCamera(context, state, state.transitionState.nextAreaInstance);
                    state.hero.render(context, state);
                context.restore();
            } else {
                context.save();
                    context.translate(0, dz);
                    context.fillStyle = state.transitionState.pattern;
                    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                context.restore();
                context.save();
                    translateContextForAreaAndCamera(context, state, state.transitionState.nextAreaInstance);
                    state.hero.render(context, state);
                context.restore();
                context.save();
                    context.globalAlpha *= 0.6;
                    // This needs to match the styles we use for rendering underwater areas.
                    context.fillStyle = 'blue';
                    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                context.restore();
                context.save();
                    context.translate(0, dz - 24);
                    context.globalAlpha *= (1 - p) * (1 - p);
                    renderStandardFieldStackWithoutWaterOverlay(context, state, false);
                context.restore();
                context.save();
                    context.globalAlpha *= (1 - p) * (1 - p);
                    translateContextForAreaAndCamera(context, state, state.transitionState.nextAreaInstance);
                    state.hero.render(context, state);
                context.restore();
            }
        } else {
            context.save();
                translateContextForAreaAndCamera(context, state, state.areaInstance);
                context.fillStyle = state.transitionState.pattern;
                context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            context.restore();
        }
        renderAreaLighting(context, state, state.areaInstance);
        return;
    } else if (state.transitionState.type === 'mutating') {
        if (!state.transitionState.nextAreaInstance) {
            console.error('missing next area instance for mutating');
            return;
        }
        if (!state.transitionState.patternCanvas) {
            const [patternCanvas, patternContext] = createCanvasAndContext(CANVAS_WIDTH, CANVAS_HEIGHT);
            state.transitionState.patternCanvas = patternCanvas;
            state.transitionState.patternContext = patternContext;
            renderStandardFieldStack(patternContext, state);
            //patternContext.drawImage(mainCanvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            //state.transitionState.pattern = context.createPattern(state.transitionState.patternCanvas, 'repeat');
        }
        if (!state.transitionState.underCanvas) {
            const [underCanvas, underContext] = createCanvasAndContext(CANVAS_WIDTH, CANVAS_HEIGHT);
            state.transitionState.underCanvas = underCanvas;
            const area = state.transitionState.nextAreaInstance;
            updateObjectsToRender(state, area);
            // Update any background tiles that have changed.
            if (area.checkToRedrawTiles) {
                checkToRedrawTiles(area);
                updateLightingCanvas(area);
                drawRemainingFrames(state, area);
                if (state.underwaterAreaInstance) {
                    updateWaterSurfaceCanvas(state, area);
                }
            }
            // Draw the field, enemies, objects and hero.
            renderAreaBackground(underContext, state, area);
            renderAreaObjectsBeforeHero(underContext, state, area);
            underContext.save();
                translateContextForAreaAndCamera(underContext, state, area);
                state.hero.render(underContext, state);
            underContext.restore();
            renderAreaObjectsAfterHero(underContext, state, area);
            renderSurfaceLighting(underContext, state, area);
            renderFieldForeground(underContext, state, area);
            renderHeatOverlay(underContext, state, state.transitionState.nextAreaSection);
            renderAreaLighting(underContext, state, area);
        }
        /*const offsets = [0, 4, 2, 6, 1, 5, 3, 7];
        if (state.transitionState.time > 0
            && state.transitionState.time % 100 === 0
            && state.transitionState.time / 100 <= offsets.length
        ) {
            for (let y = offsets[state.transitionState.time / 100 - 1]; y < CANVAS_HEIGHT; y += 8) {
                state.transitionState.patternContext.clearRect(
                    0, y, CANVAS_WIDTH, 1
                );
            }
        }*/
        context.save();
            applyScreenShakes(context, state);
            context.drawImage(state.transitionState.underCanvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            context.globalAlpha *= Math.max(0, (MUTATE_DURATION - state.transitionState.time) / MUTATE_DURATION);
            context.drawImage(state.transitionState.patternCanvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            removeScreenShakes(context, state);
        context.restore();
        return;
    }

    if (state.transitionState.type === 'portal') {
        renderStandardFieldStack(context, state);
        if (!state.alternateAreaInstance) {
            return;
        }
        const x = state.hero.x + state.hero.w / 2 - state.camera.x + state.areaInstance.cameraOffset.x;
        const y = state.hero.y + 2 - state.camera.y + state.areaInstance.cameraOffset.y;
        if (state.transitionState.time <= CIRCLE_WIPE_OUT_DURATION) {
            if (!state.transitionState.patternCanvas) {
                const [patternCanvas, patternContext] = createCanvasAndContext(CANVAS_WIDTH, CANVAS_HEIGHT);
                state.transitionState.patternCanvas = patternCanvas;
                renderArea(patternContext, state, state.alternateAreaInstance, true);
                renderHeatOverlay(patternContext, state, state.alternateAreaSection);
                state.transitionState.pattern = context.createPattern(state.transitionState.patternCanvas, 'repeat');
            }
            context.save();
                const p = state.transitionState.time / CIRCLE_WIPE_OUT_DURATION;
                const radius = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * 1.5 * Math.max(0, Math.min(1, p));
                context.fillStyle = state.transitionState.pattern;
                context.beginPath();
                context.arc(x, y, radius, 0, 2 * Math.PI);
                context.fill();
            context.restore();
        } else {
            context.save();
                translateContextForAreaAndCamera(context, state, state.areaInstance);
                context.fillStyle = state.transitionState.pattern;
                context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            context.restore();
        }
    } else if (state.transitionState.type === 'fade') {
        renderStandardFieldStack(context, state);
        const fadeColor = state.transitionState.fadeColor ?? '#000';
        if (state.transitionState.time <= FADE_OUT_DURATION) {
            context.save();
                const p = Math.min(1, 1.5 * state.transitionState.time / FADE_OUT_DURATION);
                context.globalAlpha = p;
                context.fillStyle = fadeColor
                context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            context.restore();
        } else {
            context.save();
                const alpha = 1.5 - 1.5 * (state.transitionState.time - FADE_OUT_DURATION) / FADE_IN_DURATION;
                context.globalAlpha = Math.max(0, Math.min(1, alpha));
                context.fillStyle = fadeColor;
                context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            context.restore();
        }
    } else {
        renderStandardFieldStack(context, state);
        const x = state.hero.x + state.hero.w / 2 - state.camera.x;
        const y = state.hero.y + 2 - state.camera.y;
        if (state.transitionState.time <= CIRCLE_WIPE_OUT_DURATION) {
            context.save();
                const p = 1 - 1.5 * state.transitionState.time / CIRCLE_WIPE_OUT_DURATION;
                const radius = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * Math.max(0, Math.min(1, p));
                context.fillStyle = '#000';
                context.beginPath();
                context.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                context.arc(x, y, radius, 0, 2 * Math.PI, true);
                context.fill();
            context.restore();
        } else {
            context.save();
                const p = 1.5 * (state.transitionState.time - CIRCLE_WIPE_OUT_DURATION) / CIRCLE_WIPE_IN_DURATION - 0.5;
                const radius = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * Math.max(0, Math.min(1, p));
                context.fillStyle = '#000';
                context.beginPath();
                context.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                context.arc(x, y, radius, 0, 2 * Math.PI, true);
                context.fill();
            context.restore();
        }
    }
}
