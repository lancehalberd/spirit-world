import { FRAME_LENGTH, CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { initializeGame } from 'app/initialize';
import { getState } from 'app/state';
import { areAllImagesLoaded } from 'app/utils/images';

import { getActorTargets } from 'app/getActorTargets';
import { KEY, isKeyDown } from 'app/keyCommands';
import { moveActor } from 'app/moveActor';

import { GameState } from 'app/types';

let isGameInitialized = false;
export function update() {
    // Don't run the main loop until everything necessary is initialized.
    if (!isGameInitialized) {
        if (areAllImagesLoaded())  {
            initializeGame();
            isGameInitialized = true;
        }
        return;
    }
    const state = getState();
    state.time += FRAME_LENGTH;
    const speed = 2;
    const area = state.areaInstance;
    try {
        const dy = Math.round(speed * isKeyDown(KEY.DOWN)) - Math.round(speed * isKeyDown(KEY.UP));
        const dx = Math.round(speed * isKeyDown(KEY.RIGHT)) - Math.round(speed * isKeyDown(KEY.LEFT));
        if (dx || dy) {
            moveActor(state, state.hero, dx, dy);
        }
        if (dx < 0 && (state.hero.d === 'right' || Math.abs(dx) > Math.abs(dy))) {
            state.hero.d = 'left';
        } else if (dx > 0 && (state.hero.d === 'left' || Math.abs(dx) > Math.abs(dy))) {
            state.hero.d = 'right';
        } else if (dy < 0 && (state.hero.d === 'down' || Math.abs(dy) > Math.abs(dx))) {
            state.hero.d = 'up';
        } else if (dy > 0 && (state.hero.d === 'up' || Math.abs(dy) > Math.abs(dx))) {
            state.hero.d = 'down';
        }
        if (!state.hero.pickUpTile && isKeyDown(KEY.SPACE, 20)) {
            const tiles = getActorTargets(state, state.hero);
            if (tiles.length === 1) {
                const layer = area.layers[0];
                const tile = layer.tiles[tiles[0].y]?.[tiles[0].x];
                const behavior = area.behaviorGrid?.[tiles[0].y]?.[tiles[0].x];
                if (behavior?.canPickup && behavior?.underTile) {
                    layer.tiles[tiles[0].y][tiles[0].x] = behavior?.underTile;
                    layer.tilesDrawn[tiles[0].y][tiles[0].x] = false;
                    const key = `${behavior?.underTile.x}x${behavior?.underTile.y}`;
                    area.behaviorGrid[tiles[0].y][tiles[0].x] = area.palette.behaviors[key];
                    state.hero.pickUpFrame = 0;
                    state.hero.pickUpTile = tile;
                }
            }
        }
        if (state.hero.pickUpTile) {
            state.hero.pickUpFrame++;
            if (state.hero.pickUpFrame >= 5) {
                if (isKeyDown(KEY.SPACE, 20)) {
                    state.hero.pickUpTile = null;
                }
            }
        }
        const { w, h } = getAreaSize(state);
        if (state.hero.x <= -state.hero.w) {
            state.hero.x += w;
        } else if (state.hero.x >= w) {
            state.hero.x -= w;
        }
        if (state.hero.y <= -state.hero.h) {
            state.hero.y += h;
        } else if (state.hero.y >= h) {
            state.hero.y -= h;
        }
        updateCamera(state);
    } catch (e) {
        console.log(e.stack);
        debugger;
    }
}

function getAreaSize(state: GameState): {w: number, h: number} {
    const area = state.areaInstance;
    const palette = area.palette;
    return {
        w: palette.w * area.w,
        h: palette.h * area.h,
    }
}

function updateCamera(state: GameState): void {
    const { w, h } = getAreaSize(state);
    let targetX = Math.floor(state.hero.x - CANVAS_WIDTH / 2 + 16 / 2);
    targetX = Math.max(0, Math.min(w - CANVAS_WIDTH, targetX));
    let targetY = Math.floor(state.hero.y - CANVAS_HEIGHT / 2 + 16 / 2);
    targetY = Math.max(0, Math.min(h - CANVAS_HEIGHT, targetY));
    const speed = 8;
    if (state.camera.x < targetX) {
        state.camera.x = Math.min(state.camera.x + speed, targetX);
    } else if (state.camera.x > targetX) {
        state.camera.x = Math.max(state.camera.x - speed, targetX);
    }
    if (state.camera.y < targetY) {
        state.camera.y = Math.min(state.camera.y + speed, targetY);
    } else if (state.camera.y > targetY) {
        state.camera.y = Math.max(state.camera.y - speed, targetY);
    }
}
