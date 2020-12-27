import { createCanvasAndContext, mainContext } from 'app/dom';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from 'app/gameConstants';
import { renderActor } from 'app/renderActor';
import { getState } from 'app/state';
import { drawFrame } from 'app/utils/animations';

import { AreaLayer, Frame, Tile, TilePalette } from 'app/types';

const [backgroundCanvas, backgroundContext] = createCanvasAndContext(512, 512);

export function render() {
    const state = getState();
    if (!state?.gameHasBeenInitialized) {
        return;
    }
    // Only render if the state has actually progressed since the last render.
    if (state.lastTimeRendered >= state.time) {
        return;
    }
    state.lastTimeRendered = state.time;
    const area = state.areaInstance;

    area.layers.map(layer => renderLayer(backgroundContext, layer));
    mainContext.save();
    mainContext.translate(-state.camera.x, -state.camera.y);
        mainContext.drawImage(
            backgroundCanvas,
            state.camera.x, state.camera.y, CANVAS_WIDTH, CANVAS_HEIGHT,
            state.camera.x, state.camera.y, CANVAS_WIDTH, CANVAS_HEIGHT,
        );
        renderActor(mainContext, state, state.hero);
        for (const object of state.areaInstance.objects) {
            object?.render(mainContext, state);
        }
    mainContext.restore();
    /*const index = Math.floor(state.hero.x / 32) % easternFrames.length;
    const frame = easternFrames[index];
    drawFrame(mainContext, frame, {...frame, x:0,y:0});*/
    mainContext.fillStyle = 'red';
    mainContext.strokeStyle = 'red';
    for (let i = 0; i < state.hero.maxLife; i++) {
        if (i < state.hero.life) {
            mainContext.fillRect(5 + i * 15, 5, 10, 15);
        } else {
            mainContext.strokeRect(5 + i * 15, 5, 10, 15);
        }
    }
}

export function getTileFrame({w, h, source}: TilePalette, tile: Tile): Frame {
    return {
        image: source.image,
        x: source.x + tile.x * w,
        y: source.x + tile.y * h,
        w,
        h,
    }
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
