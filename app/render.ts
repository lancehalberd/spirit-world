import _ from 'lodash';

import { Clone } from 'app/content/clone';
import { Enemy } from 'app/content/enemy';
import { editingState, renderEditor } from 'app/development/tileEditor';
import { createCanvasAndContext, mainContext } from 'app/dom';
import { CANVAS_HEIGHT, CANVAS_WIDTH, MAX_SPIRIT_RADIUS } from 'app/gameConstants';
import { renderHeroEyes, renderHeroShadow, renderShadow } from 'app/renderActor';
import { renderDefeatedMenu } from 'app/renderDefeatedMenu';
import { renderHUD } from 'app/renderHUD';
import { renderMenu } from 'app/renderMenu';
import { renderMessage } from 'app/render/renderMessage';
import { renderTitle } from 'app/renderTitle';
import { getState } from 'app/state';
import { drawFrame } from 'app/utils/animations';
import { directionMap } from 'app/utils/field';

import { AreaInstance, AreaLayer, AreaLayerDefinition, Frame, GameState, LayerTile } from 'app/types';

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
    if (state.defeated) {
        renderDefeatedMenu(context, state);
    } else if (state.paused) {
        renderMenu(context, state);
    }
    // Don't draw the HUD while editing since it obscures some tiles.
    if (!editingState.isEditing) {
        // Draw the HUD onto the field.
        renderHUD(context, state);
    }
}

export function translateContextForAreaAndCamera(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance): void {
    context.translate(-state.camera.x + area.cameraOffset.x, -state.camera.y + area.cameraOffset.y);
}

function checkToRedrawTiles(area: AreaInstance) {
    if (editingState.isEditing) {
        const {w, h} = area.palette;
        for (let y = 0; y < area.h; y++) {
            for (let x = 0; x < area.w; x++) {
                if (!area.tilesDrawn?.[y]?.[x]) {
                    area.context.clearRect(x * w, y * h, w, h);
                }
            }
        }
    }
    area.layers.map((layer, index) => renderLayer(area, layer, area.definition.parentDefinition?.layers[index]));
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
    }
    if (state.hero.spiritRadius > 0 && state.alternateAreaInstance.checkToRedrawTiles) {
        checkToRedrawTiles(state.alternateAreaInstance);
    }
    if (state.nextAreaInstance?.checkToRedrawTiles) {
        checkToRedrawTiles(state.nextAreaInstance);
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
        translateContextForAreaAndCamera(context, state, area);
        context.drawImage(
            area.canvas,
            state.camera.x - area.cameraOffset.x, state.camera.y - area.cameraOffset.y, CANVAS_WIDTH, CANVAS_HEIGHT,
            state.camera.x - area.cameraOffset.x, state.camera.y - area.cameraOffset.y, CANVAS_WIDTH, CANVAS_HEIGHT,
        );
        for (const object of area.objects) {
            if (object.drawPriority === 'background') {
                object?.render(context, state);
            }
        }
    context.restore();
}

export function renderAreaObjectsBeforeHero(context: CanvasRenderingContext2D, state: GameState, area: AreaInstance): void {
    if (!area) {
        return;
    }
    context.save();
        translateContextForAreaAndCamera(context, state, area);
        if (area === state.areaInstance) {
            renderHeroShadow(context, state, state.hero);
        }
        // Render shadows before anything else.
        for (const object of area.objects) {
            if (object.drawPriority === 'sprites') {
                if (object instanceof Clone) {
                    renderHeroShadow(context, state, object);
                } else if (object instanceof Enemy &&  object.hasShadow) {
                    renderShadow(context, state, object);
                }
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
            if (!object.drawPriority || object.drawPriority === 'foreground') {
                object?.render(context, state);
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

export function getTileFrame(area: AreaInstance, tile: LayerTile): Frame {
    const layer = _.find(area.layers, { key: tile.layerKey});
    const palette = layer.palette;
    return {
        image: palette.source.image,
        x: palette.source.x + tile.x * palette.w,
        y: palette.source.y + tile.y * palette.h,
        w: palette.w,
        h: palette.h,
    };
}

export function renderLayer(area: AreaInstance, layer: AreaLayer, parentLayer: AreaLayerDefinition): void {
    const context = area.context;
    const palette = layer.palette;
    const { w, h } = palette;
    const baseFrame = {
        image: palette.source.image,
        w,
        h,
    };
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
                debugger;
            }
            /*if (!tile && parentLayer) {
                tile = parentLayer.grid.tiles[y][x];
            }*/
            const frame: Frame = {
                ...baseFrame,
                x: palette.source.x + tile.x * w,
                y: palette.source.y + tile.y * h,
            };
            drawFrame(context, frame, {x: x * w, y: y * h, w, h});
        }
    }
    context.restore();
}
