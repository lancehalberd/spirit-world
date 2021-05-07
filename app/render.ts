import _ from 'lodash';

import { Clone } from 'app/content/clone';
import { Enemy } from 'app/content/enemy';
import { editingState, renderEditor } from 'app/development/tileEditor';
import { createCanvasAndContext, mainContext } from 'app/dom';
import {
    CANVAS_HEIGHT, CANVAS_WIDTH, MAX_SPIRIT_RADIUS,
    FADE_IN_DURATION, FADE_OUT_DURATION,
    CIRCLE_WIPE_IN_DURATION, CIRCLE_WIPE_OUT_DURATION,
} from 'app/gameConstants';
import { renderAreaLighting, updateLightingCanvas } from 'app/render/areaLighting';
import { renderHeroEyes, renderHeroShadow, renderEnemyShadow } from 'app/renderActor';
import { renderDefeatedMenu } from 'app/renderDefeatedMenu';
import { renderHUD } from 'app/renderHUD';
import { renderMenu } from 'app/renderMenu';
import { renderMessage } from 'app/render/renderMessage';
import { renderTitle } from 'app/renderTitle';
import { getState } from 'app/state';
import { drawFrame } from 'app/utils/animations';

import { AreaInstance, AreaLayer, AreaLayerDefinition, GameState } from 'app/types';

// This is the max size of the s
const [spiritCanvas, spiritContext] = createCanvasAndContext(MAX_SPIRIT_RADIUS * 2, MAX_SPIRIT_RADIUS * 2);
/*document.body.append(spiritCanvas);
spiritCanvas.style.position = 'absolute';
spiritCanvas.style.top = '0';*/
//let spiritCanvasRadius: number;
export function updateSpiritCanvas(state: GameState, radius: number): void {
    //if (radius === spiritCanvasRadius) {
    //    return;
    //}
    //spiritCanvasRadius = radius;
    const spiritAlpha = 0.2 + 0.8 * radius / MAX_SPIRIT_RADIUS;
    const x = spiritCanvas.width / 2;
    const y = spiritCanvas.height / 2
    spiritContext.save();
        const area = state.alternateAreaInstance;
        spiritContext.clearRect(0, 0, spiritCanvas.width, spiritCanvas.height);
        const gradient = spiritContext.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        spiritContext.fillStyle = 'white';
        spiritContext.globalAlpha = spiritAlpha;
        spiritContext.fillStyle = gradient;
        spiritContext.beginPath();
        spiritContext.arc(x, y, radius, 0, 2 * Math.PI);
        spiritContext.fill();
        /*spiritContext.beginPath();
        spiritContext.arc(x, y, 3 * radius / 4, 0, 2 * Math.PI);
        spiritContext.fill();
        spiritContext.globalAlpha = 0.6 * spiritAlpha;
        spiritContext.beginPath();
        spiritContext.arc(x, y, 7 * radius / 8, 0, 2 * Math.PI);
        spiritContext.fill();
        spiritContext.globalAlpha = 0.6 * spiritAlpha;
        spiritContext.beginPath();
        spiritContext.arc(x, y, radius, 0, 2 * Math.PI);
        spiritContext.fill();*/
        spiritContext.translate(
            -(state.hero.x + state.hero.w / 2 - state.camera.x - spiritCanvas.width / 2),
            -(state.hero.y - state.camera.y - spiritCanvas.height / 2)
        );
        spiritContext.globalAlpha = 1;
        spiritContext.globalCompositeOperation = 'source-atop';
        renderAreaBackground(spiritContext, state, area);
        renderAreaObjectsBeforeHero(spiritContext, state, area);
        spiritContext.save();
            translateContextForAreaAndCamera(spiritContext, state, area);
            renderHeroEyes(spiritContext, state, state.hero.activeClone || state.hero);
        spiritContext.restore();

        renderAreaObjectsAfterHero(spiritContext, state, area);
    spiritContext.restore();
}

export function render() {
    const context = mainContext;
    const state = getState();
    if (!state?.gameHasBeenInitialized) {
        return;
    }
    if (state.transitionState) {
        renderField(context, state);
        renderTransition(context, state);
        renderHUD(context, state);
        return;
    }
    if (state.messageState?.pages) {
        renderMessage(context, state);
        return;
    }
    if (state.scene === 'title' || state.scene === 'chooseGameMode' ||
            state.scene === 'deleteSavedGame' || state.scene === 'deleteSavedGameConfirmation'
    ) {
        renderTitle(context, state);
        return;
    }
    // Only render if the state has actually progressed since the last render.
    if (state.lastTimeRendered >= state.time) {
        return;
    }
    state.lastTimeRendered = state.time;
    renderField(context, state);
    if (state.defeatState.defeated) {
        renderHUD(context, state);
        context.save();
            context.globalAlpha = 0.7 * Math.min(1, state.defeatState.time / 1000);
            context.fillStyle = '#888';
            context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.restore();
        if (state.defeatState.time >= 1000) {
            renderDefeatedMenu(context, state);
        }
        return;
    } else if (state.paused) {
        renderMenu(context, state);
    }
    // Don't draw the HUD while editing since it obscures some tiles.
    if (!editingState.isEditing) {
        // Draw the HUD onto the field.
        renderHUD(context, state);
    }
}

function renderTransition(context: CanvasRenderingContext2D, state: GameState) {
    if (state.transitionState.type === 'portal') {
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
                state.transitionState.pattern = context.createPattern(state.transitionState.patternCanvas, 'repeat');
            }
            context.save();
                const p = state.transitionState.time / CIRCLE_WIPE_OUT_DURATION;
                const radius = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * Math.max(0, Math.min(1, p));
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
        if (state.transitionState.time <= FADE_OUT_DURATION) {
            context.save();
                const p = Math.min(1, 1.5 * state.transitionState.time / FADE_OUT_DURATION);
                context.globalAlpha = p;
                context.fillStyle = '#000';
                context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            context.restore();
        } else {
            context.save();
                const alpha = 1.5 - 1.5 * (state.transitionState.time - FADE_OUT_DURATION) / FADE_IN_DURATION;
                context.globalAlpha = Math.max(0, Math.min(1, alpha));
                context.fillStyle = '#000';
                context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            context.restore();
        }
    } else {
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

export function translateContextForAreaAndCamera(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance): void {
    context.translate(-state.camera.x + area.cameraOffset.x, -state.camera.y + area.cameraOffset.y);
}

function checkToRedrawTiles(area: AreaInstance) {
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
    area.layers.map((layer, index) => renderLayer(area, layer, area.definition.parentDefinition?.layers[index], index >= 2));
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

export function renderField(context: CanvasRenderingContext2D, state: GameState): void {
    if (editingState.isEditing) {
        context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    // Update any background tiles that have changed.
    if (state.areaInstance.checkToRedrawTiles) {
        checkToRedrawTiles(state.areaInstance);
        updateLightingCanvas(state.areaInstance);
    }
    if (state.hero.spiritRadius > 0 && state.alternateAreaInstance.checkToRedrawTiles) {
        checkToRedrawTiles(state.alternateAreaInstance);
        updateLightingCanvas(state.alternateAreaInstance);
    }
    if (state.nextAreaInstance?.checkToRedrawTiles) {
        checkToRedrawTiles(state.nextAreaInstance);
        updateLightingCanvas(state.nextAreaInstance);
    }

    const hero = state.hero.activeClone || state.hero;

    // Draw the field, enemies, objects and hero.
    renderAreaBackground(context, state, state.areaInstance);
    renderAreaBackground(context, state, state.nextAreaInstance);
    renderAreaObjectsBeforeHero(context, state, state.areaInstance);
    renderAreaObjectsBeforeHero(context, state, state.nextAreaInstance);
    context.save();
        translateContextForAreaAndCamera(context, state, state.areaInstance);
        state.hero.render(context, state);
    context.restore();
    renderAreaObjectsAfterHero(context, state, state.areaInstance);
    renderAreaObjectsAfterHero(context, state, state.nextAreaInstance);
    if (state.hero.spiritRadius > 0) {
        context.save();
        context.globalAlpha = 0.6 * state.hero.spiritRadius / MAX_SPIRIT_RADIUS;
        context.fillStyle = '#888';
        context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.restore();
        updateSpiritCanvas(state, state.hero.spiritRadius);
        context.drawImage(spiritCanvas,
            0, 0, spiritCanvas.width, spiritCanvas.height,
            hero.x + hero.w / 2 - spiritCanvas.width / 2
            - state.camera.x + state.areaInstance.cameraOffset.x,
            hero.y - spiritCanvas.height / 2
             - state.camera.y + state.areaInstance.cameraOffset.y,
            spiritCanvas.width, spiritCanvas.height
        );
    }
    renderAreaForeground(context, state, state.areaInstance);
    renderAreaForeground(context, state, state.nextAreaInstance);

    // Render any editor specific graphics if appropriate.
    renderEditor(context, state);
    renderAreaLighting(context, state, state.areaInstance, state.nextAreaInstance);
}

// Fully renders an area to a canvas, but with no state effects like spirit sight.
// This is used during the transition to and from the spirit world.
export function renderArea(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance, forceHero: boolean = false): void {
    // Update any background tiles that have changed.
    if (area.checkToRedrawTiles) {
        checkToRedrawTiles(area);
        updateLightingCanvas(area);
    }
    const hero = state.hero.activeClone || state.hero;
    // Draw the field, enemies, objects and hero.
    renderAreaBackground(context, state, area);
    renderAreaObjectsBeforeHero(context, state, area);
    if (forceHero || hero.area === area) {
        context.save();
            translateContextForAreaAndCamera(context, state, area);
            state.hero.render(context, state);
        context.restore();
    }
    renderAreaObjectsAfterHero(context, state, area);
    renderAreaForeground(context, state, area);
    renderAreaLighting(context, state, area);
}

export function renderAreaBackground(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance): void {
    if (!area) {
        return;
    }
    context.save();
        translateContextForAreaAndCamera(context, state, area);
        context.drawImage(
            area.canvas,
            state.camera.x - area.cameraOffset.x, state.camera.y - area.cameraOffset.y, CANVAS_WIDTH, CANVAS_HEIGHT,
            state.camera.x - area.cameraOffset.x, state.camera.y - area.cameraOffset.y, CANVAS_WIDTH, CANVAS_HEIGHT,
        );
        for (const object of area.objects) {
            if (object.drawPriority === 'background') {
                object.render?.(context, state);
            }
        }
    context.restore();
}

export function renderAreaForeground(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance): void {
    if (!area?.foregroundCanvas) {
        return;
    }
    context.save();
        translateContextForAreaAndCamera(context, state, area);
        context.drawImage(
            area.foregroundCanvas,
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
        translateContextForAreaAndCamera(context, state, area);
        if (area === state.areaInstance && !editingState.isEditing) {
            renderHeroShadow(context, state, state.hero);
        }
        // Render shadows before anything else.
        for (const object of area.objects) {
            if (object.renderShadow) {
                object.renderShadow(context, state);
            } else if (object instanceof Clone) {
                renderHeroShadow(context, state, object);
            } else if (object instanceof Enemy && object.hasShadow && object.status !== 'gone') {
                renderEnemyShadow(context, state, object);
            }
        }
        const objectsToRender = [];
        for (const object of area.objects) {
            if (object.drawPriority === 'sprites' && object.y <= state.hero.y) {
                if (object.render) {
                    objectsToRender.push(object);
                }
            }
        }
        objectsToRender.sort((A, B) => A.y - B.y);
        for (const object of objectsToRender) {
            object.render(context, state);
        }
    context.restore();
}

export function renderAreaObjectsAfterHero(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance): void {
    if (!area) {
        return;
    }
    context.save();
        translateContextForAreaAndCamera(context, state, area);
        const objectsToRender = [];
        for (const object of area.objects) {
            if (object.renderForeground) {
                object.renderForeground(context, state);
            } else if (!object.drawPriority || object.drawPriority === 'foreground') {
                object.render?.(context, state);
            } else if (object.drawPriority === 'sprites' && object.y > state.hero.y) {
                if (object.render) {
                    objectsToRender.push(object);
                }
            }
        }
        objectsToRender.sort((A, B) => A.y - B.y);
        for (const object of objectsToRender) {
            object.render(context, state);
        }
    context.restore();
}

export function renderLayer(area: AreaInstance, layer: AreaLayer, parentLayer: AreaLayerDefinition, isForeground: boolean): void {
    // Create foreground canvas only as needed.
    if (isForeground && !area.foregroundContext) {
        [area.foregroundCanvas, area.foregroundContext] = createCanvasAndContext(
            16 * layer.definition.grid.w,
            16 * layer.definition.grid.h,
        );
    }
    const context = isForeground ? area.foregroundContext : area.context;
    const w = 16, h = 16;
    context.save();
    if (editingState.isEditing && getState().areaInstance.layers[editingState.selectedLayerIndex] !== layer) {
        //console.log(getState().areaInstance.layers[editingState.selectedLayerIndex], layer);
        context.globalAlpha = 0.5;
    }
    for (let y = 0; y < layer.h; y++) {
        if (!area.tilesDrawn[y]) {
            area.tilesDrawn[y] = [];
        }
        for (let x = 0; x < layer.w; x++) {
            if (area.tilesDrawn[y][x]) {
                continue;
            }
            let tile = layer.tiles[y][x];
            if (!tile) {
                continue;
                debugger;
            }
            drawFrame(context, tile.frame, {x: x * w, y: y * h, w, h});
        }
    }
    context.restore();
}
