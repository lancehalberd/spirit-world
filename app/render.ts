import { renderEditor } from 'app/development/tileEditor';
import { mainContext } from 'app/dom';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from 'app/gameConstants';
import { renderActor } from 'app/renderActor';
import { getState } from 'app/state';
import { drawFrame } from 'app/utils/animations';

import { AreaInstance, AreaLayer, Frame, GameState, Tile, TilePalette } from 'app/types';

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
        renderActor(context, state, state.hero);
    context.restore();
    renderAreaObjectsAfterHero(context, state, state.areaInstance);
    renderAreaObjectsAfterHero(context, state, state.nextAreaInstance);

    // Render any editor specific graphics if appropriate.
    renderEditor(context, state);

    // Draw the HUD onto the field.
    renderHUD(context, state);
}

export function renderHUD(context: CanvasRenderingContext2D, state: GameState): void {
    for (let i = 0; i < state.hero.maxLife; i++) {
        context.fillStyle = 'white';
        context.fillRect(5 + i * 8, 5, 1, 10);
        context.fillRect(5 + i * 8, 5, 7, 1);
        context.fillRect(5 + i * 8 + 6, 5, 1, 10);
        context.fillRect(5 + i * 8, 5 + 9, 7, 1);
        if (i < state.hero.life) {
            context.fillStyle = 'red';
            context.fillRect(5 + i * 8 + 1, 5 + 1, 5, 8);
        }
    }
    context.fillStyle = 'black';
    context.fillRect(5, 16, Math.floor(state.hero.maxMagic), 4);
    context.fillStyle = 'blue';
    context.fillRect(5, 16, Math.floor(state.hero.magic), 4);
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
        for (const enemy of area.enemies) {
            if (enemy.y <= state.hero.y) {
                enemy.render(context, state);
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
        for (const enemy of area.enemies) {
            if (enemy.y > state.hero.y) {
                enemy.render(context, state);
            }
        }
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
            drawFrame(context, frame, {x: x * w, y: y * h, w, h});
        }
    }
}
