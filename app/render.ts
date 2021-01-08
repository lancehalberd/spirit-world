import { editingState, renderEditor } from 'app/development/tileEditor';
import { createCanvasAndContext, mainContext } from 'app/dom';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from 'app/gameConstants';
import { renderHero, renderShadow } from 'app/renderActor';
import { renderHUD } from 'app/renderHUD';
import { renderMenu } from 'app/renderMenu';
import { getState } from 'app/state';
import { drawFrame } from 'app/utils/animations';
import { directionMap } from 'app/utils/field';

import { AreaInstance, AreaLayer, Frame, GameState, Tile, TilePalette } from 'app/types';

const [darkCanvas, darkContext] = createCanvasAndContext(CANVAS_WIDTH / 2 + 4, CANVAS_HEIGHT / 2 + 4);
let darkCanvasRadius: number;
let darkPercent: number = 0;
export function updateDarkCanvas(radius: number): void {
    if (radius === darkCanvasRadius && darkPercent >= 1) {
        return;
    }
    darkCanvasRadius = radius;
    darkContext.save();
        darkContext.fillStyle = 'black';
        darkContext.globalAlpha = darkPercent;
        darkContext.clearRect(0, 0, darkCanvas.width, darkCanvas.height);
        darkContext.beginPath();
        darkContext.rect(0, 0, darkCanvas.width, darkCanvas.height);
        darkContext.arc(darkCanvas.width / 2, darkCanvas.height / 2, radius / 4, 0, 2 * Math.PI, true);
        darkContext.fill();
        darkContext.globalAlpha = 0.8 * darkPercent;
        darkContext.beginPath();
        darkContext.rect(0, 0, darkCanvas.width, darkCanvas.height);
        darkContext.arc(darkCanvas.width / 2, darkCanvas.height / 2, 3 * radius / 16, 0, 2 * Math.PI, true);
        darkContext.fill();
        darkContext.globalAlpha = 0.6 * darkPercent;
        darkContext.beginPath();
        darkContext.rect(0, 0, darkCanvas.width, darkCanvas.height);
        darkContext.arc(darkCanvas.width / 2, darkCanvas.height / 2, radius / 8, 0, 2 * Math.PI, true);
        darkContext.fill();
    darkContext.restore();
}

function getDarkRadius(state: GameState): number {
    if (state.hero.passiveTools.trueSight) {
        return 320;
    }
    if (state.hero.passiveTools.catEyes) {
        return 80;
    }
    return 20;
}


export function render() {
    const context = mainContext;
    const state = getState();
    if (!state?.gameHasBeenInitialized) {
        return;
    }
    // Only render if the state has actually progressed since the last render.
    if (state.lastTimeRendered >= state.time) {
        return;
    }
    state.lastTimeRendered = state.time;
    if (!state.paused) {
        renderField(context, state);
    } else {
        renderMenu(context, state);
    }
    // Draw the HUD onto the field.
    renderHUD(context, state);
}

export function renderField(context: CanvasRenderingContext2D, state: GameState): void {
    // Update any background tiles that have changed.
    state.areaInstance.layers.map(layer => renderLayer(state.areaInstance.context, layer));
    state.nextAreaInstance?.layers?.map(layer => renderLayer(state.nextAreaInstance.context, layer));

    // Draw the field, enemies, objects and hero.
    renderAreaBackground(context, state, state.areaInstance);
    renderAreaBackground(context, state, state.nextAreaInstance);
    renderAreaObjectsBeforeHero(context, state, state.areaInstance);
    renderAreaObjectsBeforeHero(context, state, state.nextAreaInstance);
    context.save();
        context.translate(-state.camera.x + state.areaInstance.cameraOffset.x, -state.camera.y + state.areaInstance.cameraOffset.y);
        renderHero(context, state, state.hero);
    context.restore();
    renderAreaObjectsAfterHero(context, state, state.areaInstance);
    renderAreaObjectsAfterHero(context, state, state.nextAreaInstance);

    // Render any editor specific graphics if appropriate.
    renderEditor(context, state);
    if (darkPercent < 1 && (state.areaInstance.definition.dark || state.nextAreaInstance?.definition.dark)) {
        darkPercent = Math.min(darkPercent + 0.05, 1);
    } else if (darkPercent > 0){
        darkPercent = Math.max(darkPercent - 0.05, 0);
    }
    if (darkPercent > 0) {
        context.save()
            const radius = getDarkRadius(state);
            updateDarkCanvas(radius);
            if (editingState.isEditing) {
                context.globalAlpha = 0.5;
            }
            const hero = state.hero.activeClone || state.hero;
            context.drawImage(darkCanvas,
                0, 0, darkCanvas.width, darkCanvas.height,
                hero.x + hero.w / 2 - darkCanvas.width * 2 + 12 * directionMap[hero.d][0]
                - state.camera.x + state.areaInstance.cameraOffset.x,
                hero.y + hero.h / 2 - darkCanvas.height * 2 + 12 * directionMap[hero.d][1]
                 - state.camera.y + state.areaInstance.cameraOffset.y,
                darkCanvas.width * 4, darkCanvas.height * 4
            );
        context.restore();
    }
}

export function renderAreaBackground(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance): void {
    if (!area) {
        return;
    }
    context.save();
        context.translate(-state.camera.x + area.cameraOffset.x, -state.camera.y + area.cameraOffset.y);
        context.drawImage(
            area.canvas,
            state.camera.x - area.cameraOffset.x, state.camera.y - area.cameraOffset.y, CANVAS_WIDTH, CANVAS_HEIGHT,
            state.camera.x - area.cameraOffset.x, state.camera.y - area.cameraOffset.y, CANVAS_WIDTH, CANVAS_HEIGHT,
        );
    context.restore();
}

export function renderAreaObjectsBeforeHero(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance): void {
    if (!area) {
        return;
    }
    context.save();
        context.translate(-state.camera.x + area.cameraOffset.x, -state.camera.y + area.cameraOffset.y);
        renderShadow(context, state, state.hero);
        // Render shadows before anything else.
        for (const object of area.objects) {
            if (object.drawPriority === 'sprites') {
                renderShadow(context, state, object);
            }
        }
        for (const object of area.objects) {
            if (object.drawPriority === 'background' || (object.drawPriority === 'sprites' && object.y <= state.hero.y)) {
                object?.render(context, state);
            }
        }
    context.restore();
}

export function renderAreaObjectsAfterHero(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance): void {
    if (!area) {
        return;
    }
    context.save();
        context.translate(-state.camera.x - area.cameraOffset.x, -state.camera.y - area.cameraOffset.y);
        for (const object of area.objects) {
            if (!object.drawPriority ||
                object.drawPriority === 'foreground' ||
                (object.drawPriority === 'sprites' && object.y > state.hero.y)
            ) {
                object?.render(context, state);
            }
        }
    context.restore();
}

export function getTileFrame({w, h, source}: TilePalette, tile: Tile): Frame {
    return {
        image: source.image,
        x: source.x + tile.x * w,
        y: source.x + tile.y * h,
        w,
        h,
    };
}

export function renderLayer(context: CanvasRenderingContext2D, layer: AreaLayer): void {
    const palette = layer.palette;
    const { w, h } = palette;
    const baseFrame = {
        image: palette.source.image,
        w,
        h,
    };
    for (let y = 0; y < layer.h; y++) {
        if (!layer.tilesDrawn[y]) {
            layer.tilesDrawn[y] = [];
        }
        for (let x = 0; x < layer.w; x++) {
            if (layer.tilesDrawn[y][x]) {
                continue;
            }
            layer.tilesDrawn[y][x] = true;
            const tile = layer.tiles[y][x];
            const frame: Frame = {
                ...baseFrame,
                x: palette.source.x + tile.x * w,
                y: palette.source.y + tile.y * h,
            };
            // TODO: Remove this when we have real pit graphics.
            context.fillRect(x * w, y * h, w, h);
            drawFrame(context, frame, {x: x * w, y: y * h, w, h});
        }
    }
}
