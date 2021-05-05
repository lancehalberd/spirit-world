import { isPixelInShortRect } from 'app/utils/index';

import { AreaInstance, Direction, GameState, Hero, ObjectInstance, Tile, TileBehaviors } from 'app/types';

const root2over2 = Math.sqrt(2) / 2;

export const directionMap = {
    upleft: [-root2over2, -root2over2],
    up: [0, -1],
    upright: [root2over2, -root2over2],
    downleft: [-root2over2, root2over2],
    down: [0, 1],
    downright: [root2over2, root2over2],
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

export function getDirection(dx: number, dy: number, includeDiagonals = false): Direction {
    if (includeDiagonals) {
        const r = Math.abs(dx) / (Math.abs(dy) + .000001);
        if (r >= 2) {
            return dx < 0 ? 'left' : 'right';
        }
        if (r <= 1 / 2) {
            return dy < 0 ? 'up' : 'down';
        }
        if (dy < 0) {
            return dx < 0 ? 'upleft' : 'upright';
        }
        return dx < 0 ? 'downleft' : 'downright';
    }
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx < 0 ? 'left' : 'right';
    }
    return dy < 0 ? 'up' : 'down';
}

export function canTeleportToCoords(state: GameState, hero: Hero, {x, y}: Tile): boolean {
    const excludedObjects = new Set([hero]);
    return isPointOpen(state, hero.area, {x: x + 2, y: y + 2}, excludedObjects) &&
        isPointOpen(state, hero.area, {x: x + 14, y: y + 2}, excludedObjects) &&
        isPointOpen(state, hero.area, {x: x + 2, y: y + 14}, excludedObjects) &&
        isPointOpen(state, hero.area, {x: x + 14, y: y + 14}, excludedObjects);
}

export function isPointOpen(
    state: GameState,
    area: AreaInstance,
    {x, y}: {x: number, y: number},
    excludedObjects: Set<any> = null
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
        if (excludedObjects?.has(object)) {
            continue;
        }
        if (object.getHitbox && object.behaviors?.solid) {
            if (isPixelInShortRect(x, y, object.getHitbox(state))) {
                return false;
            }
        }
    }
    if (state.hero.area === area && !excludedObjects?.has(state.hero)) {
        if (isPixelInShortRect(x, y, state.hero)) {
            return false;
        }
    }
    return true;
}

export function getTileBehaviorsAndObstacles(
    state: GameState,
    area: AreaInstance,
    {x, y}: Tile,
    excludedObjects: Set<any> = null,
    nextArea: AreaInstance = null,
): {tileBehavior: TileBehaviors, tx: number, ty: number, objects: ObjectInstance[]} {
    const objects: ObjectInstance[] = [];
    let tx = Math.floor(x / 16);
    let ty = Math.floor(y / 16);
    let definedBehavior = area?.behaviorGrid[ty]?.[tx];
    if (!definedBehavior && nextArea) {
        tx = Math.floor((x - nextArea.cameraOffset.x) / 16);
        ty = Math.floor((y - nextArea.cameraOffset.y) / 16);
        definedBehavior = nextArea?.behaviorGrid[ty]?.[tx];
    }
    const tileBehavior = {...(definedBehavior || {})};
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
        if (excludedObjects?.has(object)) {
            continue;
        }
        if (object.getHitbox && (object.onPush || object.behaviors?.solid)) {
            if (isPixelInShortRect(x, y, object.getHitbox(state))) {
                objects.push(object);
                if (object.behaviors?.solid) {
                    tileBehavior.solid = true;
                }
            }
        }
    }
    if (state.hero.area === area && !excludedObjects?.has(state.hero)) {
        if (isPixelInShortRect(x, y, state.hero)) {
            objects.push(state.hero);
            tileBehavior.solid = true;
        }
    }
    return { tileBehavior, tx, ty, objects };
}

