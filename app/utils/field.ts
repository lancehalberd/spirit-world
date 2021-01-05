import { isPixelInShortRect } from 'app/utils/index';

import { Direction, GameState, ObjectInstance, Tile } from 'app/types';

export const directionMap = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
};

export function getDirection(dx: number, dy: number): Direction {
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx < 0 ? 'left' : 'right';
    }
    return dy < 0 ? 'up' : 'down';
}

export function isPointOpen(state: GameState, {x, y}: {x: number, y: number}): boolean {
    const tx = Math.floor(x / 16);
    const ty = Math.floor(y / 16);
    if (tx < state.areaSection.x || tx >= state.areaSection.x + state.areaSection.w
        || ty < state.areaSection.y || ty >= state.areaSection.y + state.areaSection.h) {
        return false;
    }
    const tileBehavior = state.areaInstance?.behaviorGrid[ty][tx];
    if (tileBehavior?.solid) {
        return false;
    }
    for (const object of state.areaInstance.objects) {
        if (object.getHitbox && object.behaviors?.solid) {
            if (isPixelInShortRect(x, y, object.getHitbox(state))) {
                return false;
            }
        }
    }
    return true;
}

export function getSolidObstacles(state: GameState, {x, y}: Tile): {open: boolean, tiles: Tile[], objects: ObjectInstance[]} {
    const tiles: Tile[] = [];
    const objects: ObjectInstance[] = [];
    const tx = Math.floor(x / 16);
    const ty = Math.floor(y / 16);
    const tileBehavior = state.areaInstance?.behaviorGrid[ty][tx];
    let open = true;
    if (tx < state.areaSection.x || tx >= state.areaSection.x + state.areaSection.w
        || ty < state.areaSection.y || ty >= state.areaSection.y + state.areaSection.h) {
        open = false;
    }
    if (tileBehavior?.solid) {
        tiles.push({x: tx, y: ty});
        open = false;
    }
    for (const object of state.areaInstance.objects) {
        if (object.getHitbox && object.behaviors?.solid) {
            if (isPixelInShortRect(x, y, object.getHitbox(state))) {
                objects.push(object);
                open = false;
            }
        }
    }
    return { open, tiles, objects };
}
