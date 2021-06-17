import { destroyTile, resetTileBehavior } from 'app/content/areas';
import { allTiles } from 'app/content/tiles';
import { isPixelInShortRect, rectanglesOverlap, roundRect } from 'app/utils/index';

import {
    AreaInstance, AreaLayer, Direction, GameState, Hero,
    HitProperties, HitResult, MovementProperties,
    ObjectInstance, ShortRectangle, Tile, TileCoords, TileBehaviors,
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

export function getDirection(dx: number, dy: number, includeDiagonals = false, defaultDirection: Direction = null): Direction {
    if (Math.abs(dy) < 0.3) {
        dy = 0;
    }
    if (Math.abs(dx) < 0.3) {
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
        isPointOpen(state, hero.area, {x: x + 14, y: y + 2}, {canSwim: true}, excludedObjects) &&
        isPointOpen(state, hero.area, {x: x + 2, y: y + 14}, {canSwim: true}, excludedObjects) &&
        isPointOpen(state, hero.area, {x: x + 14, y: y + 14}, {canSwim: true}, excludedObjects);
}

export function isPointOpen(
    state: GameState,
    area: AreaInstance,
    {x, y}: {x: number, y: number},
    movementProperties: MovementProperties,
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
    } else if (tileBehavior?.solid && (!tileBehavior?.climbable || !movementProperties.canClimb)) {
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
    return { tileBehavior, tx, ty };
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
        if (object.status === 'hidden' || object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
            continue;
        }
        if (excludedObjects?.has(object)) {
            continue;
        }
        if (object.getHitbox && (object.onPush || object.behaviors?.solid)) {
            if (isPixelInShortRect(x | 0, y | 0, roundRect(object.getHitbox(state)))) {
                objects.push(object);
                if (object.behaviors?.solid) {
                    tileBehavior.solid = true;
                }
            }
        }
    }
    if (state.hero.area === area && !excludedObjects?.has(state.hero)) {
        if (isPixelInShortRect(x | 0, y | 0, roundRect(state.hero))) {
            objects.push(state.hero);
            tileBehavior.solid = true;
        }
    }
    return { tileBehavior, tx, ty, objects };
}

export function getTilesInRectangle(area: AreaInstance, rect: ShortRectangle): TileCoords[] {
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

export function hitTargets(this: void, state: GameState, area: AreaInstance, hit: HitProperties): HitResult {
    const combinedResult: HitResult = { pierced: true, hitTargets: new Set() };
    let targets: ObjectInstance[] = [];
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
                if (object.onHit) {
                    let knockback = hit.knockback;
                    if (!hit.knockback && hit.knockAwayFrom) {
                        const dx = (hitbox.x + hitbox.w / 2) - hit.knockAwayFrom.x;
                        const dy = (hitbox.y + hitbox.h / 2) - hit.knockAwayFrom.y;
                        const mag = Math.sqrt(dx * dx + dy * dy);
                        knockback = mag ? {vx: 4 * dx / mag, vy: 4 * dy / mag, vz: 0} : null;
                    }
                    const result = object.onHit(state, { ...hit, direction: getDirection(dx, dy), knockback });
                    combinedResult.hit ||= result.hit;
                    combinedResult.blocked ||= result.blocked;
                    combinedResult.pierced &&= ((!result.hit && !result.blocked) || result.pierced);
                    combinedResult.stopped ||= result.stopped;
                    combinedResult.setElement ||= result.setElement;
                    combinedResult.knockback ||= result.knockback;
                    if (result.hit || result.blocked) {
                        combinedResult.hitTargets.add(object);
                    }
                } else if (object.behaviors?.solid) {
                    combinedResult.hit = true;
                    if (!object.behaviors.low) {
                        combinedResult.pierced = false;
                    }
                }
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
            if (object.onHit) {
                const result = object.onHit(state, { ...hit, direction, knockback });
                combinedResult.hit ||= result.hit;
                combinedResult.blocked ||= result.blocked;
                combinedResult.pierced &&= ((!result.hit && !result.blocked) || result.pierced);
                combinedResult.stopped ||= result.stopped;
                combinedResult.setElement ||= result.setElement;
                combinedResult.knockback ||= result.knockback;
                    if (result.hit || result.blocked) {
                        combinedResult.hitTargets.add(object);
                    }
            } else if (object.behaviors?.solid) {
                combinedResult.hit = true;
                if (!object.behaviors.low) {
                    combinedResult.pierced = false;
                }
            }
        }
    }
    let hitTiles = [];
    if (hit.hitTiles && hit.hitbox) {
        hitTiles = getTilesInRectangle(area, hit.hitbox);
    }
    if (hit.hitTiles && hit.hitCircle) {
        hitTiles = [...hitTiles, ...getTilesInCircle(area, hit.hitCircle)];
    }
    for (const target of hitTiles) {
        const behavior = area.behaviorGrid?.[target.y]?.[target.x];
        // Ice hits that effect tiles cover them in ice as long as they aren't pits or walls.
        if (hit.element === 'ice' && typeof behavior?.elementTiles?.fire === 'undefined' && !behavior?.solid && !behavior?.pit) {
            let topLayer: AreaLayer = area.layers[0];
            for (const layer of area.layers) {
                if (layer.definition.drawPriority !== 'foreground') {
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
        if (behavior?.cuttable <= hit.damage && (!behavior?.low || hit.cutsGround)) {
            // We need to find the specific cuttable layers that can be destroyed.
            for (const layer of area.layers) {
                const tile = layer.tiles[target.y][target.x];
                if (tile?.behaviors?.cuttable <= hit.damage) {
                    destroyTile(state, area, {...target, layerKey: layer.key});
                }
            }
            combinedResult.hit = true;
        } else if ((behavior?.cuttable > hit.damage || behavior?.solid) && (!behavior?.low || hit.cutsGround)) {
            combinedResult.hit = true;
            combinedResult.pierced = false;
            combinedResult.stopped = true;
            if (behavior?.cuttable > hit.damage) {
                combinedResult.blocked = true;
            }
        }
    }

    return combinedResult;
}



