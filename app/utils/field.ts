import { isPixelInShortRect } from 'app/utils/index';

import { AreaInstance, Direction, GameState, ObjectInstance, Tile, TileBehaviors } from 'app/types';

export const directionMap = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
};

export const directionToLeftRotationsFromRight = {
    right: 0,
    up: 1,
    left: 2,
    down: 3,
}
export const leftRotationsFromRightToDirection = Object.keys(directionToLeftRotationsFromRight) as Direction[];

export function rotateDirection(d: Direction, leftRotations: number): Direction {
    // Calculates a new rotation in the range of 0-3.
    const newRotation = ((directionToLeftRotationsFromRight[d] + leftRotations) % 4 + 4) % 4;
    return leftRotationsFromRightToDirection[newRotation];
}


// 15, 4, 4,
// This is a map of offsets used to animate an object being picked up by the player, and is designed for use with a
// 16x16 tile.
export const carryMap = {
    'right': [{x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 9, y: -13}, {x: 7, y: -16}, {x: 0, y: -17}],
    'left': [{x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -9, y: -13}, {x: -7, y: -16}, {x: 0, y: -17}],
    'down': [{x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: -4}, {x: 0, y: -9}, {x: 0, y: -17}],
    'up': [{x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -16}, {x: 0, y: -17}, {x: 0, y: -17}],
};

export function getDirection(dx: number, dy: number): Direction {
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx < 0 ? 'left' : 'right';
    }
    return dy < 0 ? 'up' : 'down';
}

export function isPointOpen(
    state: GameState,
    area: AreaInstance,
    {x, y}: {x: number, y: number},
    excludeObjects: Set<any> = null
): boolean {
    const tx = Math.floor(x / 16);
    const ty = Math.floor(y / 16);
    if (tx < state.areaSection.x || tx >= state.areaSection.x + state.areaSection.w
        || ty < state.areaSection.y || ty >= state.areaSection.y + state.areaSection.h) {
        return false;
    }
    const tileBehavior = area?.behaviorGrid[ty]?.[tx];
    // If the behavior has a bitmap for solid pixels, read the exact pixel to see if it is blocked.
    if (tileBehavior?.solidMap && !tileBehavior?.climbable) {
        const sy = (y | 0) % 16;
        const sx = (x | 0) % 16;
        // console.log(tileBehavior.solidMap, y, x, sy, sx, tileBehavior.solidMap[sy] >> (15 - sx));
        if (tileBehavior.solidMap[sy] >> (15 - sx) & 1) {
            return false;
        }
    } else if (tileBehavior?.solid && !tileBehavior?.climbable) {
        return false;
    }
    for (const object of area.objects) {
        if (object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
            continue;
        }
        if (excludeObjects?.has(object)) {
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

export function getTileBehaviorsAndObstacles(
    state: GameState,
    area: AreaInstance,
    {x, y}: Tile,
    excludeObjects: Set<any> = null
): {tileBehavior: TileBehaviors, objects: ObjectInstance[]} {
    const objects: ObjectInstance[] = [];
    const tx = Math.floor(x / 16);
    const ty = Math.floor(y / 16);
    const tileBehavior = {...(area?.behaviorGrid[ty]?.[tx] || {})};

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
    for (const object of area.objects) {
        if (object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
            continue;
        }
        if (excludeObjects?.has(object)) {
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

