import { isPixelInShortRect } from 'app/utils/index';

import { Direction, GameState, ObjectInstance, Tile, TileBehaviors } from 'app/types';

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
    const tileBehavior = state.areaInstance?.behaviorGrid[ty]?.[tx];
    if (tileBehavior?.solid) {
        return false;
    }
    // If the behavior has a bitmap for solid pixels, read the exact pixel to see if it is blocked.
    if (tileBehavior?.solidMap) {
        const sy = (y | 0) % 16;
        const sx = (x | 0) % 16;
        // console.log(tileBehavior.solidMap, y, x, sy, sx, tileBehavior.solidMap[sy] >> (15 - sx));
        if (tileBehavior.solidMap[sy] >> (15 - sx) & 1) {
            return false;
        }
    } else if (tileBehavior?.solid) {
        return false;
    }
    for (const object of state.areaInstance.objects) {
        if (object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
            continue;
        }
        if (object.getHitbox && object.behaviors?.solid) {
            if (isPixelInShortRect(x, y, object.getHitbox(state))) {
                return false;
            }
        }
    }
    return true;
}

export function getTileBehaviorsAndObstacles(state: GameState, {x, y}: Tile): {tileBehavior: TileBehaviors, objects: ObjectInstance[]} {
    const objects: ObjectInstance[] = [];
    const tx = Math.floor(x / 16);
    const ty = Math.floor(y / 16);
    const tileBehavior = {...(state.areaInstance?.behaviorGrid[ty]?.[tx] || {})};

    if (tx < state.areaSection.x || tx >= state.areaSection.x + state.areaSection.w
        || ty < state.areaSection.y || ty >= state.areaSection.y + state.areaSection.h) {
        tileBehavior.outOfBounds = true;
    }
    // If the behavior has a bitmap for solid pixels, read the exact pixel to see if it is blocked.
    if (tileBehavior.solidMap) {
        const sy = (y | 0) % 16;
        const sx = (x | 0) % 16;
        // console.log(tileBehavior.solidMap, y, x, sy, sx, tileBehavior.solidMap[sy] >> (15 - sx));
        tileBehavior.solid = !!(tileBehavior.solidMap[sy] >> (15 - sx) & 1);
    }
    for (const object of state.areaInstance.objects) {
        if (object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
            continue;
        }
        if (object.getHitbox && object.behaviors?.solid) {
            if (isPixelInShortRect(x, y, object.getHitbox(state))) {
                objects.push(object);
                tileBehavior.solid = true;
            }
        }
    }
    return { tileBehavior, objects };
}

