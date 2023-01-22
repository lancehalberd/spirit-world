import { destroyTile, removeEffectFromArea, removeObjectFromArea, resetTileBehavior } from 'app/content/areas';
import { getObjectBehaviors } from 'app/content/objects';
import { allTiles } from 'app/content/tiles';
import { isPixelInShortRect, rectanglesOverlap } from 'app/utils/index';

import {
    AreaInstance, AreaLayer, Direction, EffectInstance, Enemy, GameState, Hero,
    HitProperties, HitResult, MovementProperties,
    ObjectInstance, Rect, Tile, TileCoords, TileBehaviors,
} from 'app/types';

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
    upright: 1,
    up: 2,
    upleft: 3,
    left: 4,
    downleft: 5,
    down: 6,
    downright: 7,
}
export const leftRotationsFromRightToDirection = Object.keys(directionToLeftRotationsFromRight) as Direction[];

// leftRotations is in 90 degree rotations to the left and can accept half rotations for 45 degrees.
export function rotateDirection(d: Direction, leftRotations: number): Direction {
    leftRotations = Math.round(leftRotations * 2);
    // Calculates a new rotation in the range of 0-7.
    const newRotation = ((directionToLeftRotationsFromRight[d] + leftRotations) % 8 + 8) % 8;
    return leftRotationsFromRightToDirection[newRotation];
}


// 15, 4, 4,
// This is a map of offsets used to animate an object being picked up by the player, and is designed for use with a
// 16x16 tile.
// Originally values before adding new carrying animations, consistent y offset at end of animations.
/*export const carryMap = {
    'right': [{x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 9, y: -13}, {x: 7, y: -16}, {x: 0, y: -17}],
    'left': [{x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -9, y: -13}, {x: -7, y: -16}, {x: 0, y: -17}],
    'down': [{x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: -4}, {x: 0, y: -9}, {x: 0, y: -17}],
    'up': [{x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -16}, {x: 0, y: -17}, {x: 0, y: -17}],
};*/
// New values to match new carrying animations, final y offset is a bit different depending on direction.
export const carryMap = {
    'right': [{x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 9, y: -13}, {x: 7, y: -16}, {x: 0, y: -17}],
    'left': [{x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -9, y: -13}, {x: -7, y: -16}, {x: 0, y: -17}],
    //'right': [{x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 12, y: -9}, {x: 9, y: -12}, {x: 7, y: -15}, {x: 0, y: -16}],
    //'left': [{x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -12, y: -9}, {x: -9, y: -12}, {x: -7, y: -15}, {x: 0, y: -16}],
    'down': [{x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: -4}, {x: 0, y: -9}, {x: 0, y: -17}],
    //'down': [{x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: 3}, {x: 0, y: -3}, {x: 0, y: -7}, {x: 0, y: -13}],
    'up': [{x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -15}, {x: 0, y: -16}, {x: 0, y: -17}, {x: 0, y: -17}],
};

export function getDirection(dx: number, dy: number, includeDiagonals = false, defaultDirection: Direction = null): Direction {
    if (Math.abs(dy) < 0.2) {
        dy = 0;
    }
    if (Math.abs(dx) < 0.2) {
        dx = 0;
    }
    if (defaultDirection && !dy && !dx) {
        return defaultDirection;
    }
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
    return isPointOpen(state, hero.area, {x: x + 2, y: y + 2}, {canSwim: true}, excludedObjects) &&
        isPointOpen(state, hero.area, {x: x + 13, y: y + 2}, {canSwim: true}, excludedObjects) &&
        isPointOpen(state, hero.area, {x: x + 2, y: y + 13}, {canSwim: true}, excludedObjects) &&
        isPointOpen(state, hero.area, {x: x + 13, y: y + 13}, {canSwim: true}, excludedObjects);
}

export function canSomersaultToCoords(state: GameState, hero: Hero, {x, y}: Tile): boolean {
    const excludedObjects = new Set([hero]);
    return isPointOpen(state, hero.area, {x: x + 2, y: y + 2}, {canSwim: true, canFall: true}, excludedObjects) &&
        isPointOpen(state, hero.area, {x: x + 13, y: y + 2}, {canSwim: true, canFall: true}, excludedObjects) &&
        isPointOpen(state, hero.area, {x: x + 2, y: y + 13}, {canSwim: true, canFall: true}, excludedObjects) &&
        isPointOpen(state, hero.area, {x: x + 13, y: y + 13}, {canSwim: true, canFall: true}, excludedObjects);
}

export function isPointOpen(
    state: GameState,
    area: AreaInstance,
    {x, y, z}: {x: number, y: number, z?: number},
    movementProperties: MovementProperties,
    excludedObjects: Set<any> = null
): boolean {
    const tx = Math.floor(x / 16);
    const ty = Math.floor(y / 16);
    if (!state.areaSection || tx < state.areaSection.x || tx >= state.areaSection.x + state.areaSection.w
        || ty < state.areaSection.y || ty >= state.areaSection.y + state.areaSection.h) {
        return false;
    }
    const tileBehavior = area?.behaviorGrid[ty]?.[tx];
    const sy = (y | 0) % 16;
    const sx = (x | 0) % 16;
    if (tileBehavior?.solid && (!tileBehavior?.climbable || !movementProperties.canClimb)) {
        return false;
    } else if (tileBehavior?.lowCeiling && z >= 3) {
        return false;
    } else if (tileBehavior?.solidMap && !tileBehavior?.climbable) {
        // If the behavior has a bitmap for solid pixels, read the exact pixel to see if it is blocked.
        if (movementProperties.needsFullTile) {
            return false;
        }
        // console.log(tileBehavior.solidMap, y, x, sy, sx, tileBehavior.solidMap[sy] >> (15 - sx));
        if (tileBehavior.solidMap[sy] >> (15 - sx) & 1) {
            return false;
        }
    } else if (tileBehavior?.ledges?.up && sy === 0 && movementProperties.direction !== 'up') {
        return false;
    } else if (tileBehavior?.ledges?.down && sy === 15 && movementProperties.direction !== 'down') {
        return false;
    } else if (tileBehavior?.ledges?.left && sx === 0 && movementProperties.direction !== 'left') {
        return false;
    } else if (tileBehavior?.ledges?.right && sx === 15 && movementProperties.direction !== 'right') {
        return false;
    }
    if (tileBehavior?.water && !movementProperties.canSwim) {
        return false;
    }
    if (tileBehavior?.pit && !movementProperties.canFall) {
        return false;
    }
    for (const object of area.objects) {
        if (object.status === 'hidden' || object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
            continue;
        }
        if (excludedObjects?.has(object)) {
            continue;
        }
        const behaviors = getObjectBehaviors(state, object);
        if (object.getHitbox && behaviors?.solid) {
            if (isPixelInShortRect(x, y, object.getHitbox(state))) {
                return false;
            }
        } /*else if (object.getHitbox && behaviors?.solidMap) {
            // Currently we don't support solidMap on objects. They can just apply this
            // to the tile map if necessary, otherwise, maybe we should add something like
            // getPixelBehavior(x: number, y: number): TileBehaviors to objects.
            const hitbox = object.getHitbox(state);
            let sx = (x - hitbox.x) | 0;
            let sy = (y - hitbox.y) | 0;
            if (tileBehavior.solidMap[sy] >> (15 - sx) & 1) {
                return false;
            }
        }*/
    }
    // Not sure why we have a special check for the hero here.
    /*if (state.hero.area === area && !excludedObjects?.has(state.hero)) {
        if (isPixelInShortRect(x, y, state.hero)) {
            return false;
        }
    }*/
    return true;
}

export function getTileBehaviors(
    state: GameState,
    area: AreaInstance,
    {x, y}: Tile,
    nextArea: AreaInstance = null,
): {tileBehavior: TileBehaviors, tx: number, ty: number} {
    let tx = Math.floor(x / 16);
    let ty = Math.floor(y / 16);
    let definedBehavior = area?.behaviorGrid[ty]?.[tx];
    if (!definedBehavior && nextArea) {
        tx = Math.floor((x - nextArea.cameraOffset.x) / 16);
        ty = Math.floor((y - nextArea.cameraOffset.y) / 16);
        definedBehavior = nextArea?.behaviorGrid[ty]?.[tx];
    }
    const tileBehavior = {...(definedBehavior || {})};
    if (!state.areaSection || tx < state.areaSection.x || tx >= state.areaSection.x + state.areaSection.w
        || ty < state.areaSection.y || ty >= state.areaSection.y + state.areaSection.h) {
        tileBehavior.outOfBounds = true;
    }
    // If the behavior has a bitmap for solid pixels, read the exact pixel to see if it is blocked.
    if (!tileBehavior.solid && tileBehavior.solidMap) {
        const sy = (y | 0) % 16;
        const sx = (x | 0) % 16;
        // console.log(tileBehavior.solidMap, y, x, sy, sx, tileBehavior.solidMap[sy] >> (15 - sx));
        tileBehavior.solid = !!(tileBehavior.solidMap[sy] >> (15 - sx) & 1);
    }
    return { tileBehavior, tx, ty };
}

export function getTileBehaviorsAndObstacles(
    state: GameState,
    area: AreaInstance,
    {x, y}: Tile,
    excludedObjects: Set<any> = null,
    nextArea: AreaInstance = null,
    objectTest: (object: EffectInstance | ObjectInstance) => boolean = null,
    direction?: Direction,
): {tileBehavior: TileBehaviors, tx: number, ty: number, objects: ObjectInstance[]} {
    const objects: ObjectInstance[] = [];
    let tx = (x / 16) | 0;
    let ty = (y / 16) | 0;
    let definedBehavior = area?.behaviorGrid[ty]?.[tx];
    if (!definedBehavior && nextArea) {
        tx = ((x - nextArea.cameraOffset.x) / 16) | 0;
        ty = ((y - nextArea.cameraOffset.y) / 16) | 0;
        definedBehavior = nextArea?.behaviorGrid[ty]?.[tx];
    }
    const tileBehavior = {...(definedBehavior || {})};
    if (!state.areaSection || tx < state.areaSection.x || tx >= state.areaSection.x + state.areaSection.w
        || ty < state.areaSection.y || ty >= state.areaSection.y + state.areaSection.h) {
        tileBehavior.outOfBounds = true;
    }
    const sy = (y | 0) % 16;
    const sx = (x | 0) % 16;
    // If the behavior has a bitmap for solid pixels, read the exact pixel to see if it is blocked.
    if (!tileBehavior.solid && tileBehavior.solidMap) {
        // console.log(tileBehavior.solidMap, y, x, sy, sx, tileBehavior.solidMap[sy] >> (15 - sx));
        tileBehavior.solid = !!(tileBehavior.solidMap[sy] >> (15 - sx) & 1);
    }
    for (const object of area.objects) {
        if (object.status === 'hidden' || object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch'
            || object.status === 'gone'
        ) {
            continue;
        }
        if (excludedObjects?.has(object)) {
            continue;
        }
        const behaviors = getObjectBehaviors(state, object);
        if (object.getHitbox && (object.onPush || behaviors?.solid || behaviors?.pit || objectTest)) {
            const hitbox = object.getHitbox(state);
            if (isPixelInShortRect(x | 0, y | 0,
                { x: hitbox.x | 0, y: hitbox.y | 0, w: hitbox.w | 0, h: hitbox.h | 0 }
            )) {
                // If objectTest is defined, only include objects that match it.
                if (objectTest) {
                    if (objectTest(object)) {
                        objects.push(object);
                    }
                    continue;
                }
                objects.push(object);
                if (behaviors?.pit) {
                    tileBehavior.pit = true;
                }
                if (behaviors?.solid) {
                    if (!tileBehavior.solid) {
                        // Set solid height behaviors if this is thirst solid object.
                        if (behaviors.low) {
                            tileBehavior.low = true;
                        } else if (behaviors.midHeight) {
                            tileBehavior.midHeight = true;
                        }
                        tileBehavior.solid = true;
                    } else {
                        // Increase the height of solid tiles as necessary.
                        if (tileBehavior.low && !behaviors.low) {
                            tileBehavior.low = false;
                            tileBehavior.midHeight = true;
                        }
                        if (tileBehavior.midHeight && !behaviors.midHeight) {
                            tileBehavior.midHeight = false;
                        }
                    }
                }
                if (behaviors?.touchHit) {
                    // Don't apply touchHit from enemies during iframes when they shouldn't damage the hero.
                    if (!(object instanceof Enemy) || !(object.invulnerableFrames > 0)) {
                        tileBehavior.touchHit = {...behaviors.touchHit};
                        if (object instanceof Enemy) {
                            tileBehavior.touchHit.source = object;
                        }
                    }
                }
            }
        }
    }
    if (state.hero.area === area && !excludedObjects?.has(state.hero)) {
        if (isPixelInShortRect(x | 0, y | 0,
            { x: state.hero.x | 0, y: state.hero.y | 0, w: state.hero.w | 0, h: state.hero.h | 0 }
        )) {
            if (!objectTest || objectTest(state.hero)) {
                objects.push(state.hero);
            }
            tileBehavior.solid = true;
        }
    }
    // Edge behaviors only apply to specific lines in the tiles.
    if (tileBehavior.ledges) {
        // Copy this so we don't edit the source behavior.
        tileBehavior.ledges = {...tileBehavior.ledges};
        if (tileBehavior.ledges?.up && sy !== 0) {
            delete tileBehavior.ledges.up;
        }
        if (tileBehavior.ledges?.down && sy !== 15) {
            delete tileBehavior.ledges.down;
        }
        if (tileBehavior.ledges?.left && sx !== 0) {
            delete tileBehavior.ledges.left;
        }
        if (tileBehavior.ledges?.right && sx !== 15) {
            delete tileBehavior.ledges.right;
        }
    }
    // If the actor is at the edge of a tile moving into the next tile,
    // Check if the tile they are currently moving out of has an edge in the direction of the movement.
    if (sy === 15 && direction === 'up') {
        if (area?.behaviorGrid[ty + 1]?.[tx]?.ledges?.up) {
            tileBehavior.ledges = tileBehavior.ledges || {};
            tileBehavior.ledges.up = true;
        }
    }
    if (sy === 0 && direction === 'down') {
        if (area?.behaviorGrid[ty - 1]?.[tx]?.ledges?.down) {
            tileBehavior.ledges = tileBehavior.ledges || {};
            tileBehavior.ledges.down = true;
        }
    }
    if (sx === 15 && direction === 'left') {
        if (area?.behaviorGrid[ty]?.[tx + 1]?.ledges?.left) {
            tileBehavior.ledges = tileBehavior.ledges || {};
            tileBehavior.ledges.left = true;
        }
    }
    if (sx === 0 && direction === 'right') {
        if (area?.behaviorGrid[ty]?.[tx - 1]?.ledges?.right) {
            tileBehavior.ledges = tileBehavior.ledges || {};
            tileBehavior.ledges.right = true;
        }
    }
    return { tileBehavior, tx, ty, objects };
}

export function getTilesInRectangle(area: AreaInstance, rect: Rect): TileCoords[] {
    const tileSize = 16;
    const tiles: TileCoords[] = []
    const l = Math.floor(rect.x / tileSize);
    const r = Math.floor((rect.x + rect.w - 1) / tileSize);
    const t = Math.floor(rect.y / tileSize);
    const b = Math.floor((rect.y + rect.h - 1) / tileSize);
    for (let y = t; y <= b; y++) {
        if (y < 0 || y >= 32) continue;
        for (let x = l; x <= r; x++) {
            if (x < 0 || x >= 32) continue;
            tiles.push({x, y});
        }
    }
    return tiles;
}

export function getTilesInCircle(area: AreaInstance, {x, y, r}: {x: number, y: number, r: number}): TileCoords[] {
    const tileSize = 16;
    const tiles: TileCoords[] = []
    const T = Math.round((y - r) / tileSize);
    const B = Math.round((y + r) / tileSize) - 1;
    const r2 = r * r;
    // console.log({x, y, r});
    // console.log({T, B});
    for (let ty = T; ty <= B; ty++) {
        if (ty < 0 || ty >= 32) continue;
        const my = ty * tileSize + tileSize / 2;
        const dy = my - y;
        const dx = Math.sqrt(r2 - dy * dy);
        const L = Math.round((x - dx) / tileSize);
        const R = Math.round((x + dx) / tileSize) - 1;
        // console.log({my, dy, dx, L, R});
        for (let tx = L; tx <= R; tx++) {
            if (tx < 0 || tx >= 32) continue;
            tiles.push({x: tx, y: ty});
        }
    }
    return tiles;
}

function distanceToSegment({x, y}, {x1, y1, x2, y2}) {
    const lengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (lengthSquared == 0) {
        const dx = x2 - x, dy = y2 - y;
        return {
            distance: Math.sqrt(dx * dx + dy * dy),
            // Return the vector pointing from the point to the closest point on the line.
            dx, dy,
        };
    }
    // The dot product of A * B over the length gives the full length of the projection of
    // A onto B, dividing by the length a second time changes it to a percentage of the length of B.
    let t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    const closestX = x1 + t * (x2 - x1), closestY = y1 + t * (y2 - y1);
    const dx = closestX - x, dy = closestY - y;
    return {
        distance: Math.sqrt(dx * dx + dy * dy),
        // Return the vector pointing from the point to the closest point on the line.
        dx, dy,
    }
}

export function tileHitAppliesToTarget(this: void, state: GameState, hit: HitProperties, target: ObjectInstance | EffectInstance) {
    // Hits from tiles only apply to enemies if `hitEnemies` is explicitly set to `true`.
    if (target instanceof Enemy){
        return hit?.hitEnemies === true;
    }
    // Hits from tiles always apply to heroes unless `hitAllies` is explicitly set to `false`.
    if (target instanceof Hero) {
        return hit?.hitAllies !== false;
    }
    // Hits from tiles only apply to objects if `hitObjects` is explicitly set to `true`.
    return hit?.hitObjects === true;
}

export function hitTargets(this: void, state: GameState, area: AreaInstance, hit: HitProperties): HitResult {
    // explicitly default element to null if it is not set.
    hit = {...hit, element: hit.element ?? null}
    const combinedResult: HitResult = { pierced: true, hitTargets: new Set() };
    let targets: (EffectInstance | ObjectInstance)[] = [];
    if (hit.hitEnemies) {
        targets = [...targets, ...area.enemyTargets];
    }
    if (hit.hitAllies) {
        targets = [...targets, ...area.allyTargets];
    }
    if (hit.hitObjects) {
        targets = [...targets, ...area.neutralTargets];
    }
    for (const object of targets) {
        if (!object.getHitbox) {
            continue;
        }
        if (object.status === 'hidden' || object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch' || object.status === 'gone') {
            continue;
        }
        if (hit.ignoreTargets?.has(object)) {
            continue;
        }
        const hitbox = object.getHitbox(state);
        if (hit.hitCircle) {
            const r = hit.hitCircle.r;
            // Fudge a little by pretending the target is a circle.
            const fakeRadius = hitbox.w / 4 + hitbox.h / 4;
            const r2 = (r + fakeRadius) ** 2;
            const dx = hitbox.x + hitbox.w / 2 - hit.hitCircle.x;
            const dy = hitbox.y + hitbox.h / 2 - hit.hitCircle.y;
            if (dx * dx + dy * dy < r2) {
                let knockback = hit.knockback;
                let knockAwayFrom = hit.knockAwayFrom || (hit.knockAwayFromHit && hit.hitCircle);
                if (!knockback && knockAwayFrom) {
                    const dx = (hitbox.x + hitbox.w / 2) - knockAwayFrom.x;
                    const dy = (hitbox.y + hitbox.h / 2) - knockAwayFrom.y;
                    const mag = Math.sqrt(dx * dx + dy * dy);
                    knockback = mag ? {vx: 4 * dx / mag, vy: 4 * dy / mag, vz: 0} : null;
                }
                applyHitToObject(state, object, {...hit, direction: getDirection(dx, dy), knockback}, combinedResult);
            }
        } else if (hit.hitRay) {
            const fakeRadius = hitbox.w / 4 + hitbox.h / 4;
            const { distance, dx, dy } = distanceToSegment(
                { x: hitbox.x + hitbox.w / 2, y: hitbox.y + hitbox.h / 2},
                hit.hitRay
            );
            const didHit = distance <= (hit.hitRay.r + fakeRadius);
            if (didHit) {
                let knockback = hit.knockback;
                if (!knockback && hit.knockAwayFrom) {
                    const dx = (hitbox.x + hitbox.w / 2) - hit.knockAwayFrom.x;
                    const dy = (hitbox.y + hitbox.h / 2) - hit.knockAwayFrom.y;
                    const mag = Math.sqrt(dx * dx + dy * dy);
                    knockback = mag ? {vx: 4 * dx / mag, vy: 4 * dy / mag, vz: 2} : null;
                }
                if (!knockback && hit.knockAwayFromHit) {
                    if (distance) {
                        knockback = {vx: -4 * dx / distance, vy: -4 * dy / distance, vz: 2};
                    } else {
                        const dx = hit.hitRay.x2 - hit.hitRay.x1, dy = hit.hitRay.y2 - hit.hitRay.y1;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        knockback = {vx: 4 * dx / distance, vy: 4 * dy / distance, vz: 2};
                    }
                }
                applyHitToObject(state, object, {...hit, direction: getDirection(dx, dy), knockback}, combinedResult);
            }
        } else if (hit.hitbox && rectanglesOverlap(hitbox, hit.hitbox)) {
            const direction = getDirection(
                hitbox.x - hit.hitbox.x + 8 * (hit.vx || 0),
                hitbox.y - hit.hitbox.y + 8 * (hit.vy || 0)
            );
            let knockback = hit.knockback;
            if (!hit.knockback && hit.knockAwayFrom) {
                const dx = (hitbox.x + hitbox.w / 2) - hit.knockAwayFrom.x;
                const dy = (hitbox.y + hitbox.h / 2) - hit.knockAwayFrom.y;
                const mag = Math.sqrt(dx * dx + dy * dy);
                knockback = mag ? {vx: 4 * dx / mag, vy: 4 * dy / mag, vz: 0} : null;
            }
            applyHitToObject(state, object, {...hit, direction, knockback}, combinedResult);
        }
    }
    let hitTiles = [];
    if (hit.hitTiles && (hit.tileHitbox || hit.hitbox)) {
        hitTiles = getTilesInRectangle(area, hit.tileHitbox || hit.hitbox);
    }
    if (hit.hitTiles && hit.hitCircle) {
        hitTiles = [...hitTiles, ...getTilesInCircle(area, hit.hitCircle)];
    }
    // TODO: Get tiles hit by ray
    for (const target of hitTiles) {
        const behavior = area.behaviorGrid?.[target.y]?.[target.x];
        // Ice hits that effect tiles cover them in ice as long as they aren't pits or walls.
        if (hit.element === 'ice' && typeof behavior?.elementTiles?.fire === 'undefined'
            // Cannot freeze ground in hot areas.
            && !area.isHot
            && !behavior?.solid && !behavior?.solidMap && !(behavior?.covered || behavior?.blocksStaff)
            && !behavior?.pit && !behavior?.ledges && !behavior?.diagonalLedge
            && !behavior?.isLava && !behavior?.isLavaMap
        ) {
            let topLayer: AreaLayer = area.layers[0];
            for (const layer of area.layers) {
                // 'foreground' layer defaults to being in the foreground regardless of drawPriority.
                if (layer.definition.key !== 'foreground' && layer.definition.drawPriority !== 'foreground') {
                    topLayer = layer;
                } else {
                    break;
                }
            }
            // Fabricate a frozen tile that has the original tile "underneath it", so it will
            // return to the original state if exposed to fire.
            topLayer.tiles[target.y][target.x] = {
                ...allTiles[294],
                behaviors: {
                    ...allTiles[294].behaviors,
                    elementTiles: {
                        fire: topLayer.tiles[target.y][target.x]?.index || 0,
                    },
                },
            };
            if (area.tilesDrawn[target.y]?.[target.x]) {
                area.tilesDrawn[target.y][target.x] = false;
            }
            area.checkToRedrawTiles = true;
            resetTileBehavior(area, target);
            //console.log('froze tile', area.behaviorGrid?.[target.y]?.[target.x]);
        } else if (hit.element === 'fire' && typeof behavior?.elementTiles?.fire !== 'undefined') {
            for (const layer of area.layers) {
                const tile = layer.tiles?.[target.y]?.[target.x];
                const fireTile = tile?.behaviors?.elementTiles?.fire;
                if (typeof fireTile !== 'undefined') {
                    layer.tiles[target.y][target.x] = layer.originalTiles[target.y][target.x] = allTiles[fireTile];
                }
            }
            if (area.tilesDrawn[target.y]?.[target.x]) {
                area.tilesDrawn[target.y][target.x] = false;
            }
            area.checkToRedrawTiles = true;
            resetTileBehavior(area, target);
        }
        const direction = (hit.vx || hit.vy) ? getDirection(hit.vx, hit.vy, true) : null;
        if (behavior?.cuttable <= hit.damage && (!behavior?.low || hit.cutsGround)) {
            // We need to find the specific cuttable layers that can be destroyed.
            for (const layer of area.layers) {
                const tile = layer.tiles[target.y][target.x];
                if (tile?.behaviors?.cuttable <= hit.damage) {
                    destroyTile(state, area, {...target, layerKey: layer.key});
                }
            }
            combinedResult.hit = true;
        } else if (
            (
                (behavior?.cuttable > hit.damage || behavior?.solid)
                && (!behavior?.low || hit.cutsGround)
                && (!behavior?.isSouthernWall || (direction !== 'down' && direction !== 'downleft' && direction !== 'downright'))
            )
            || (direction === 'upleft' && (behavior?.ledges?.down || behavior?.ledges?.right || behavior?.diagonalLedge === 'downright'))
            || (direction === 'up' && (behavior?.ledges?.down || behavior?.diagonalLedge === 'downleft' || behavior?.diagonalLedge === 'downright'))
            || (direction === 'upright' && (behavior?.ledges?.down || behavior?.diagonalLedge === 'downleft' || behavior?.ledges?.right))
            || (direction === 'downleft' && (behavior?.ledges?.up || behavior?.ledges?.right || behavior?.diagonalLedge === 'upright'))
            || (direction === 'down' && (behavior?.ledges?.up || behavior?.diagonalLedge === 'upleft' || behavior?.diagonalLedge === 'upright'))
            || (direction === 'downright' && (behavior?.ledges?.up || behavior?.diagonalLedge === 'upleft' || behavior?.ledges?.left))
            || (direction === 'left' && (behavior?.ledges?.right || behavior?.diagonalLedge === 'downright' || behavior?.diagonalLedge === 'upright'))
            || (direction === 'right' && (behavior?.ledges?.left || behavior?.diagonalLedge === 'downleft' || behavior?.diagonalLedge === 'upleft'))
        ) {
            combinedResult.hit = true;
            combinedResult.pierced = false;
            combinedResult.stopped = true;
            if (behavior?.cuttable > hit.damage) {
                combinedResult.blocked = true;
            }
        } else if (!combinedResult.stopped && hit.hitbox && behavior?.solidMap && (!behavior?.low || hit.cutsGround)) {
            const checkPoints = [
                {x: hit.hitbox.x, y: hit.hitbox.y}, {x: hit.hitbox.x + hit.hitbox.w, y: hit.hitbox.y},
                {x: hit.hitbox.x, y: hit.hitbox.y + hit.hitbox.h}, {x: hit.hitbox.x + hit.hitbox.w, y: hit.hitbox.y + hit.hitbox.h},
            ];
            for (const {x, y} of checkPoints) {
                const sx = (x - target.x * 16) | 0, sy = (y - target.y * 16) | 0;
                if (sx < 0 || sx > 15 || sy < 0 || sy >= 15) {
                    continue;
                }
                if (behavior.solidMap[sy] >> (15 - sx) & 1) {
                    combinedResult.hit = true;
                    combinedResult.pierced = false;
                    combinedResult.stopped = true;
                    break;
                }
            }
        }
    }

    return combinedResult;
}

function isObject(object: ObjectInstance | EffectInstance): object is ObjectInstance {
    return !!(object as ObjectInstance).isObject;
}

function applyHitToObject(state: GameState, object: ObjectInstance | EffectInstance, hit: HitProperties, combinedResult: HitResult) {
    const behaviors = getObjectBehaviors(state, object);
    if (object.onHit) {
        const result = object.onHit(state, hit);
        if (combinedResult.destroyed && result.hit && !result.destroyed && !result.pierced) {
            combinedResult.destroyed = false;
        } else if (combinedResult.destroyed !== false && result.destroyed) {
            combinedResult.destroyed = true;
        }
        combinedResult.hit ||= result.hit;
        combinedResult.blocked ||= result.blocked;
        combinedResult.pierced &&= ((!result.hit && !result.blocked) || result.pierced);
        combinedResult.stopped ||= result.stopped;
        combinedResult.setElement ||= result.setElement;
        combinedResult.knockback ||= result.knockback;
        combinedResult.reflected ||= result.reflected;
        if (result.hit || result.blocked) {
            combinedResult.hitTargets.add(object);
        }
    } else if (behaviors?.solid) {
        combinedResult.hit = true;
        if (!behaviors.low) {
            combinedResult.pierced = false;
        }
    }
    if (hit.destroysObjects) {
        if (isObject(object)) {
            if ((object as ObjectInstance).onDestroy) {
                const [dx, dy] = directionMap[hit.direction];
                object.onDestroy(state, dx, dy);
            } else if (behaviors?.destructible) {
                removeObjectFromArea(state, object);
            }
        } else {
            if (behaviors?.destructible) {
                removeEffectFromArea(state, object);
            }
        }
    }
}

export function coverTile(
    this: void, state: GameState, area: AreaInstance, tx: number, ty: number, coverTile: number
): boolean {
    const behavior = area.behaviorGrid?.[ty]?.[tx];
    // For now solid tiles and pits cannot be covered
    if (behavior?.solid || behavior?.pit || behavior?.covered
        || behavior?.blocksStaff || behavior?.solidMap
        || behavior?.diagonalLedge
    ) {
        return false;
    }
    let topLayer: AreaLayer = area.layers[0];
    for (const layer of area.layers) {
        if (layer.definition.key === 'foreground' || layer.definition.drawPriority === 'foreground') {
            break;
        }
        topLayer = layer;
    }
    let currentIndex = topLayer.tiles[ty][tx]?.index || 0;
    if (currentIndex === coverTile) {
        return false;
    }
    // If the covered tile has its own under tile, apply it instead of the
    // current tile provided the current tile is empty.
    const newUnderTile = allTiles[coverTile].behaviors?.underTile;
    if (newUnderTile && currentIndex <= 1) {
        currentIndex = newUnderTile;
    }
    topLayer.tiles[ty][tx] = {
        ...allTiles[coverTile],
        behaviors: {
            ...allTiles[coverTile].behaviors,
            underTile: currentIndex,
            covered: true,
        },
    };
    if (area.tilesDrawn[ty]?.[tx]) {
        area.tilesDrawn[ty][tx] = false;
    }
    area.checkToRedrawTiles = true;
    resetTileBehavior(area, {x: tx, y: ty});
    return true;
}

export function uncoverTile(
    this: void, state: GameState, area: AreaInstance, tx: number, ty: number
): boolean {
    const behavior = area.behaviorGrid?.[ty]?.[tx];
    // If the tile is not cuttable and has no underTile behavior, it cannot be uncovered.
    if (!behavior?.cuttable && !behavior?.underTile) {
        return false;
    }
    // We need to find the specific cuttable layers that can be destroyed.
    for (const layer of area.layers) {
        const tile = layer.tiles[ty][tx];
        if (tile?.behaviors?.cuttable || behavior?.underTile) {
            destroyTile(state, area, {x: tx, y: ty, layerKey: layer.key});
            return true;
        }
    }
}

export function addScreenShake(state: GameState, dx: number, dy: number, duration = 200): void {
    state.screenShakes.push({
        dx, dy, startTime: state.fieldTime, endTime: state.fieldTime + duration
    });
}
