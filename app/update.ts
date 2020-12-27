import { ThrownObject } from 'app/content/thrownObject';
import { FRAME_LENGTH, CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { initializeGame } from 'app/initialize';
import { getTileFrame } from 'app/render';
import { getState, initializeState } from 'app/state';
import { areAllImagesLoaded } from 'app/utils/images';

import { getActorTargets } from 'app/getActorTargets';
import { KEY, isKeyDown } from 'app/keyCommands';
import { checkForFloorDamage, moveActor } from 'app/moveActor';

import { GameState } from 'app/types';

const directionMap = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
};
const rollSpeed = [5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 2, 2];

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
    const area = state.areaInstance;
    try {
        let dx = 0, dy = 0;
        if (state.hero.invulnerableFrames > 0) {
            state.hero.invulnerableFrames--;
        }
        if (state.hero.action === 'roll') {
            dx = directionMap[state.hero.d][0] * rollSpeed[state.hero.actionFrame];
            dy = directionMap[state.hero.d][1] * rollSpeed[state.hero.actionFrame];
            state.hero.actionFrame++;
            if (state.hero.actionFrame >= rollSpeed.length) {
                state.hero.action = null;
            }
        } else {
            const speed = 2;
            dy = Math.round(speed * isKeyDown(KEY.DOWN)) - Math.round(speed * isKeyDown(KEY.UP));
            dx = Math.round(speed * isKeyDown(KEY.RIGHT)) - Math.round(speed * isKeyDown(KEY.LEFT));
            if (dx < 0 && (state.hero.d === 'right' || Math.abs(dx) > Math.abs(dy))) {
                state.hero.d = 'left';
            } else if (dx > 0 && (state.hero.d === 'left' || Math.abs(dx) > Math.abs(dy))) {
                state.hero.d = 'right';
            } else if (dy < 0 && (state.hero.d === 'down' || Math.abs(dy) > Math.abs(dx))) {
                state.hero.d = 'up';
            } else if (dy > 0 && (state.hero.d === 'up' || Math.abs(dy) > Math.abs(dx))) {
                state.hero.d = 'down';
            }
        }
        if (dx || dy) {
            moveActor(state, state.hero, dx, dy);
        }
        if (!state.hero.action && !state.hero.pickUpTile && isKeyDown(KEY.SHIFT, 20)) {
            state.hero.action = 'roll';
            state.hero.actionFrame = 0;
        }
        if (!state.hero.action && !state.hero.pickUpTile && isKeyDown(KEY.SPACE, 20)) {
            const tiles = getActorTargets(state, state.hero);
            if ((dx || dy) && !tiles.some(({x, y}) => area.behaviorGrid?.[y]?.[x]?.solid)) {
                state.hero.action = 'roll';
                state.hero.actionFrame = 0;
            } else {
                for (const target of tiles) {
                    const layer = area.layers[0];
                    const tile = layer.tiles[target.y]?.[target.x];
                    const behavior = area.behaviorGrid?.[target.y]?.[target.x];
                    if (behavior?.canPickup && behavior?.underTile) {
                        layer.tiles[target.y][target.x] = behavior?.underTile;
                        layer.tilesDrawn[target.y][target.x] = false;
                        const key = `${behavior?.underTile.x}x${behavior?.underTile.y}`;
                        area.behaviorGrid[target.y][target.x] = area.palette.behaviors[key];
                        state.hero.pickUpFrame = 0;
                        state.hero.pickUpTile = tile;
                        break;
                    }
                }
            }
        }
        if (state.hero.pickUpTile) {
            state.hero.pickUpFrame++;
            if (state.hero.pickUpFrame >= 5) {
                if (isKeyDown(KEY.SPACE, 20)) {
                    const throwSpeed = 6;
                    const thrownObject = new ThrownObject({
                        frame: getTileFrame(state.areaInstance.palette, state.hero.pickUpTile),
                        x: state.hero.x,
                        y: state.hero.y,
                        vx: directionMap[state.hero.d][0] * throwSpeed,
                        vy: directionMap[state.hero.d][1] * throwSpeed,
                        vz: 2,
                    });
                    state.areaInstance.objects.push(thrownObject);
                    state.hero.pickUpTile = null;
                }
            }
        }
        checkForFloorDamage(state, state.hero);
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
        for (const object of state.areaInstance.objects) {
            object?.update(state);
        }
        updateCamera(state);
        if (state.hero.life <= 0) {
            initializeState();
            getState().gameHasBeenInitialized = true;
        }
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
