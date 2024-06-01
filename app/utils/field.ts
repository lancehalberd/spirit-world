import { allTiles } from 'app/content/tiles';
import { isUnderLedge } from 'app/movement/isUnderLedge';
import { destroyTile } from 'app/utils/destroyTile';
import { directionMap, getDirection } from 'app/utils/direction';
import { removeEffectFromArea } from 'app/utils/effects';
import { isPixelInShortRect, rectanglesOverlap } from 'app/utils/index';
import { getFieldInstanceAndParts, getObjectBehaviors, removeObjectFromArea } from 'app/utils/objects';
import { resetTileBehavior } from 'app/utils/tileBehavior';


export { directionMap, getDirection } from 'app/utils/direction';

export function canTeleportToCoords(state: GameState, hero: Hero, {x, y}: Point): boolean {
    return isTileOpen(state, hero.area, {x, y}, {canSwim: true, canFall: true}) && !isUnderLedge(state, hero.area, {x, y, w: 16, h: 16});
}

export function canSomersaultToCoords(state: GameState, hero: Hero, {x, y}: Point): boolean {
    return isTileOpen(state, hero.area, {x, y}, {canSwim: true, canFall: true}) && !isUnderLedge(state, hero.area, {x, y, w: 16, h: 16});
}
window['canSomersaultToCoords'] = canSomersaultToCoords;

export function isTileOpen(state: GameState, area: AreaInstance, {x, y}: Point, movementProperties: MovementProperties): boolean {
    x = x | 0;
    y = y | 0;
    /*console.log(x, y, isPointOpen(state, area, {x: x, y: y}, movementProperties));
    console.log(x + 15, y, isPointOpen(state, area, {x: x + 15, y: y}, movementProperties));
    console.log(x, y + 15, isPointOpen(state, area, {x: x, y: y + 15}, movementProperties));
    console.log(x + 15, y + 15, isPointOpen(state, area, {x: x + 15, y: y + 15}, movementProperties));*/
   /* return isPointOpen(state, area, {x: x + 2, y: y + 2}, movementProperties) &&
        isPointOpen(state, area, {x: x + 13, y: y + 2}, movementProperties) &&
        isPointOpen(state, area, {x: x + 2, y: y + 13}, movementProperties) &&
        isPointOpen(state, area, {x: x + 13, y: y + 13}, movementProperties);*/
    return isPointOpen(state, area, {x: x, y: y}, movementProperties) &&
        isPointOpen(state, area, {x: x + 15, y: y}, movementProperties) &&
        isPointOpen(state, area, {x: x, y: y + 15}, movementProperties) &&
        isPointOpen(state, area, {x: x + 15, y: y + 15}, movementProperties);
}

export function isPointOpen(
    state: GameState,
    area: AreaInstance,
    {x, y, z}: {x: number, y: number, z?: number},
    movementProperties: MovementProperties,
): boolean {
    const tx = Math.floor(x / 16);
    const ty = Math.floor(y / 16);
    // Point is not considered open if it is not in either the current or next area section.
    if (!state.areaSection || tx < state.areaSection.x || tx >= state.areaSection.x + state.areaSection.w
        || ty < state.areaSection.y || ty >= state.areaSection.y + state.areaSection.h) {
        if (!state.nextAreaSection || tx < state.nextAreaSection.x || tx >= state.nextAreaSection.x + state.nextAreaSection.w
            || ty < state.nextAreaSection.y || ty >= state.nextAreaSection.y + state.nextAreaSection.h) {
            return false;
        }
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
    } else if (!movementProperties.canCrossLedges && tileBehavior?.ledges?.up && sy === 0
        && movementProperties.direction && movementProperties.direction !== 'up') {
        return false;
    } else if (!movementProperties.canCrossLedges && tileBehavior?.ledges?.down && sy === 15
        && movementProperties.direction && movementProperties.direction !== 'down') {
        return false;
    } else if (!movementProperties.canCrossLedges && tileBehavior?.ledges?.left && sx === 0
        && movementProperties.direction && movementProperties.direction !== 'left') {
        return false;
    } else if (!movementProperties.canCrossLedges && tileBehavior?.ledges?.right && sx === 15
        && movementProperties.direction && movementProperties.direction !== 'right') {
        return false;
    }
    if (tileBehavior?.water && !movementProperties.canSwim) {
        return false;
    }
    if (tileBehavior?.pit && !movementProperties.canFall) {
        return false;
    }
    for (const object of area.objects) {
        if (object.status === 'gone' || object.status === 'hidden' || object.status === 'hiddenEnemy' || object.status === 'hiddenSwitch') {
            continue;
        }
        if (movementProperties.excludedObjects?.has(object)) {
            continue;
        }
        // Object behaviors do not support solidMap, they can just return different values
        // for specific x/y coordinates if necessary.
        const behaviors = getObjectBehaviors(state, object, x, y);
        if (object.getHitbox && behaviors?.solid) {
            return false;
        }
    }
    // Not sure why we have a special check for the hero here.
    /*if (state.hero.area === area && !excludedObjects?.has(state.hero)) {
        if (isPixelInShortRect(x, y, state.hero)) {
            return false;
        }
    }*/
    return true;
}

export function getCompositeBehaviors(
    state: GameState,
    area: AreaInstance,
    {x, y}: Point,
    nextArea: AreaInstance = null,
): TileBehaviors {
    let tileBehavior: TileBehaviors = {}
    const allObjects = [
        ...area.objects,
        ...area.effects,
        ...(nextArea?.objects || []),
        ...(nextArea?.effects || []),
    ]
    tileBehavior.groundHeight = 0;
    let lastSolidBehavior: TileBehaviors;
    for (const baseObject of allObjects) {
        for (const entity of getFieldInstanceAndParts(state, baseObject)) {
            const behaviors = getObjectBehaviors(state, entity, x, y);
            if (!behaviors) {
                continue;
            }
            // Currently we evaluate behaviors in the default object order, but we should instead
            // evaluate them in the order they are drawn so the objects that appear on top visually
            // override the objects underneath.
            const groundHeight = behaviors.groundHeight || 0;
            // For non-solid objects, only the behaviors with the highest ground matter.
            if (groundHeight > tileBehavior.groundHeight) {
                tileBehavior = behaviors;
            } else if (groundHeight >= tileBehavior.groundHeight) {
                // TODO: Rather than combine these, we should probably only apply the behavior
                // from the object that is drawn on top (which the player would see at this pixel).
                tileBehavior = {
                    ...tileBehavior,
                    ...behaviors
                };
                if (behaviors.isGround || behaviors.isNotSolid) {
                    tileBehavior.solid = false;
                    // isGround overrides any previous solid behavior.
                    lastSolidBehavior = null;
                }
            }
            if (behaviors.solid) {
                lastSolidBehavior = behaviors;
            }
        }
    }
    if (lastSolidBehavior) {
        return lastSolidBehavior;
    }

    // Ignore tile behaviors behind objects that are marked as isGround or have positive groundHeight.
    if (tileBehavior.groundHeight > 0 || tileBehavior.isGround) {
        return tileBehavior;
    }
    delete tileBehavior.groundHeight;
    return {
        ...getTileBehaviors(state, area, {x, y}, nextArea).tileBehavior,
        ...tileBehavior,
    };
}

export function getTileBehaviors(
    state: GameState,
    area: AreaInstance,
    {x, y}: Point,
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
                    if (!(object.isEnemyTarget) || !((object as Enemy).invulnerableFrames > 0)) {
                        tileBehavior.touchHit = {...behaviors.touchHit};
                        if (object.isEnemyTarget) {
                            tileBehavior.touchHit.source = (object as Enemy);
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
        if (y < 0 || y >= area.h) continue;
        for (let x = l; x <= r; x++) {
            if (x < 0 || x >= area.w) continue;
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
        if (ty < 0 || ty >= area.h) continue;
        const my = ty * tileSize + tileSize / 2;
        const dy = my - y;
        const dx = Math.sqrt(r2 - dy * dy);
        const L = Math.round((x - dx) / tileSize);
        const R = Math.round((x + dx) / tileSize) - 1;
        // console.log({my, dy, dx, L, R});
        for (let tx = L; tx <= R; tx++) {
            if (tx < 0 || tx >= area.w) continue;
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
    if (target.isEnemyTarget){
        return hit?.hitEnemies === true;
    }
    // Hits from tiles always apply to heroes unless `hitAllies` is explicitly set to `false`.
    if (target.isAllyTarget) {
        return hit?.hitAllies !== false;
    }
    // Hits from tiles only apply to objects if `hitObjects` is explicitly set to `true`.
    return hit?.hitObjects === true;
}

export function hitTargets(this: void, state: GameState, area: AreaInstance, hit: HitProperties): HitResult {
    const combinedResult: HitResult = { pierced: true, hitTargets: new Set() };
    if (!area) {
        return combinedResult;
    }
    // explicitly default element to null if it is not set.
    hit = {...hit, element: hit.element ?? null}
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
        // Projectiles from high attacks ignore anything that isn't very tall.
        if (hit.projectile?.isHigh && !object.behaviors?.isVeryTall) {
            continue;
        }
        // If the hit specifies a z range, skip objects outside of the range.
        if (hit.zRange) {
            const z = object.z || 0;
            const height = object.height || 20;
            if (z + height < hit.zRange[0] || z > hit.zRange[1]) {
                continue;
            }
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
                    const f = hit.knockbackForce || 1
                    if (distance) {
                        knockback = {vx: -4 * f * dx / distance, vy: -4 * f * dy / distance, vz: 2 * f};
                    } else {
                        const dx = hit.hitRay.x2 - hit.hitRay.x1, dy = hit.hitRay.y2 - hit.hitRay.y1;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        knockback = {vx: 4 * f * dy / distance, vy: -4 * f * dx / distance, vz: 2 * f};
                    }
                }
                applyHitToObject(state, object, {...hit, direction: getDirection(dx, dy), knockback}, combinedResult);
            }
        } else if (hit.hitbox && rectanglesOverlap(hitbox, hit.hitbox)) {
            const direction = hit.direction || getDirection(
                hitbox.x - hit.hitbox.x + 8 * (hit.vx || 0),
                hitbox.y - hit.hitbox.y + 8 * (hit.vy || 0)
            );
            let knockback = hit.knockback;
            if (!knockback && hit.knockAwayFrom) {
                const dx = (hitbox.x + hitbox.w / 2) - hit.knockAwayFrom.x;
                const dy = (hitbox.y + hitbox.h / 2) - hit.knockAwayFrom.y;
                const mag = Math.sqrt(dx * dx + dy * dy);
                knockback = mag ? {vx: 4 * dx / mag, vy: 4 * dy / mag, vz: 0} : null;
            }
            if (!knockback && hit.knockAwayFromHit) {
                const dx = (hitbox.x + hitbox.w / 2) - (hit.hitbox.x + hit.hitbox.w / 2);
                const dy = (hitbox.y + hitbox.h / 2) - (hit.hitbox.y + hit.hitbox.h / 2);
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
    let setProjectileHigh = false, setProjectileLow = false;
    if (hit.projectile?.isHigh) {
        hit.projectile.passedLedgeTiles = [];
    }
    // TODO: Get tiles hit by ray
    for (const target of hitTiles) {
        const behavior = area.behaviorGrid?.[target.y]?.[target.x];
        // Projectiles from high attacks ignore anything that isn't very tall or a ledge.
        if (hit.projectile?.isHigh) {
            const direction = (hit.vx || hit.vy) ? getDirection(hit.vx, hit.vy, true) : null;
            hit.projectile.passedLedgeTiles.push(target);
            if (!setProjectileLow && (
                (direction === 'upleft' && (behavior?.ledges?.down || behavior?.ledges?.right || behavior?.diagonalLedge === 'downright'))
                || (direction === 'up' && (behavior?.ledges?.down || behavior?.diagonalLedge === 'downleft' || behavior?.diagonalLedge === 'downright'))
                || (direction === 'upright' && (behavior?.ledges?.down || behavior?.diagonalLedge === 'downleft' || behavior?.ledges?.left))
                || (direction === 'downleft' && (behavior?.ledges?.up || behavior?.ledges?.right || behavior?.diagonalLedge === 'upright'))
                || (direction === 'down' && (behavior?.ledges?.up || behavior?.diagonalLedge === 'upleft' || behavior?.diagonalLedge === 'upright'))
                || (direction === 'downright' && (behavior?.ledges?.up || behavior?.diagonalLedge === 'upleft' || behavior?.ledges?.left))
                || (direction === 'left' && (behavior?.ledges?.right || behavior?.diagonalLedge === 'downright' || behavior?.diagonalLedge === 'upright'))
                || (direction === 'right' && (behavior?.ledges?.left || behavior?.diagonalLedge === 'downleft' || behavior?.diagonalLedge === 'upleft'))
            )) {
                setProjectileLow = true;
            }
            // Ignore tiles that are not very tall.
            if (!behavior?.isVeryTall) {
                continue;
            }
        } else if (hit.projectile && !setProjectileHigh) {
            // Check if this projectile is going down over a cliff and set isHigh to true if so.
            const direction = (hit.vx || hit.vy) ? getDirection(hit.vx, hit.vy, true) : null;
            if ((direction === 'downright' && (behavior?.ledges?.down || behavior?.ledges?.right || behavior?.diagonalLedge === 'downright'))
                || (direction === 'down' && (behavior?.ledges?.down || behavior?.diagonalLedge === 'downleft' || behavior?.diagonalLedge === 'downright'))
                || (direction === 'downleft' && (behavior?.ledges?.down || behavior?.diagonalLedge === 'downleft' || behavior?.ledges?.left))
                || (direction === 'upright' && (behavior?.ledges?.up || behavior?.ledges?.right || behavior?.diagonalLedge === 'upright'))
                || (direction === 'up' && (behavior?.ledges?.up || behavior?.diagonalLedge === 'upleft' || behavior?.diagonalLedge === 'upright'))
                || (direction === 'upleft' && (behavior?.ledges?.up || behavior?.diagonalLedge === 'upleft' || behavior?.ledges?.left))
                || (direction === 'right' && (behavior?.ledges?.right || behavior?.diagonalLedge === 'downright' || behavior?.diagonalLedge === 'upright'))
                || (direction === 'left' && (behavior?.ledges?.left || behavior?.diagonalLedge === 'downleft' || behavior?.diagonalLedge === 'upleft'))
            ) {
                setProjectileHigh = true;
            }
        }
        if (behavior?.elementOffsets?.[hit.element]) {
            for (const layer of area.layers) {
                const offset = layer.tiles?.[target.y]?.[target.x]?.behaviors?.elementOffsets?.[hit.element];
                if (offset) {
                    const tileIndex = layer.tiles[target.y][target.x].index;
                    layer.tiles[target.y][target.x] = allTiles[tileIndex + offset];
                }
            }
            if (area.tilesDrawn[target.y]?.[target.x]) {
                area.tilesDrawn[target.y][target.x] = false;
            }
            area.checkToRedrawTiles = true;
            resetTileBehavior(area, target);
        } else if (behavior?.elementTiles?.[hit.element] !== undefined) {
            for (const layer of area.layers) {
                const tileIndex = layer.tiles?.[target.y]?.[target.x]?.behaviors?.elementTiles?.[hit.element];
                if (tileIndex !== undefined) {
                    layer.tiles[target.y][target.x] = allTiles[tileIndex];
                }
            }
            if (area.tilesDrawn[target.y]?.[target.x]) {
                area.tilesDrawn[target.y][target.x] = false;
            }
            area.checkToRedrawTiles = true;
            resetTileBehavior(area, target);
        } else if (hit.element === 'ice' && typeof behavior?.elementTiles?.fire === 'undefined'
            // Cannot freeze generic ground tiles in hot areas.
            && !state.areaSection?.isHot
            // Only attackes that hit allies freeze most ground tiles. Attacks from the player should only freeze water tiles
            // and any ground tiles that are useful to freeze.
            && (hit.hitAllies
                || behavior?.isBrittleGround || behavior?.isLava || behavior?.isLavaMap || behavior?.touchHit
                || behavior?.shallowWater || behavior?.water
            )
        ) {
            let topLayer: AreaLayer;
            let foundBlockingLayer = false;
            // We want to allow freezing on top of ledge behaviors without losing the ledge behaviors, so we have to
            // record any found any then include those on the frozen tile behavior.
            let underLedges: any, underDiagonalLedge: any;
            for (const layer of area.layers) {
                // 'foreground' layer defaults to being in the foreground regardless of drawPriority.
                if (layer.definition.key !== 'foreground' && layer.definition.drawPriority !== 'foreground') {
                    const behaviors = layer.tiles[target.y][target.x]?.behaviors;
                    // Blocking layers prevent freezing until another layer is found that erases the blocking behavior.
                    if (foundBlockingLayer && !(behaviors?.isLava || behaviors?.cloudGround || behaviors?.isGround === true)) {
                        continue;
                    }
                    foundBlockingLayer = false;
                    if (!behaviors?.isOverlay
                        && !behaviors?.solid && !behaviors?.solidMap
                        && !behaviors?.pit
                    ) {
                        underLedges = behaviors?.ledges || underLedges;
                        underDiagonalLedge = behaviors?.diagonalLedge || underDiagonalLedge;
                        topLayer = layer;
                    } else {
                        foundBlockingLayer = true;
                        underLedges = undefined;
                        underDiagonalLedge = undefined;
                    }
                } else {
                    break;
                }
            }
            if (topLayer) {
                // Fabricate a frozen tile that has the original tile "underneath it", so it will
                // return to the original state if exposed to fire.
                const underTile = topLayer.tiles[target.y][target.x];
                topLayer.tiles[target.y][target.x] = {
                    ...allTiles[294],
                    behaviors: {
                        ...allTiles[294].behaviors,
                        // This is set to draw the underTile under the ice.
                        // The element tile is actually what is used to replace the tile if
                        // the ice is melted.
                        underTile: underTile?.index || 0,
                        showUnderTile: true,
                        ledges: underLedges,
                        diagonalLedge: underDiagonalLedge,
                        elementTiles: {
                            fire: underTile?.index || 0,
                        },
                    },
                };
                if (area.tilesDrawn[target.y]?.[target.x]) {
                    area.tilesDrawn[target.y][target.x] = false;
                }
                area.checkToRedrawTiles = true;
                resetTileBehavior(area, target);
            }
            //console.log('froze tile', area.behaviorGrid?.[target.y]?.[target.x]);
        } /*else if (hit.element === 'fire' && typeof behavior?.elementTiles?.fire !== 'undefined') {
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
        }*/
        // Determine if this hit a solid wall that would stop a projectile:
        const direction = (hit.vx || hit.vy) ? getDirection(hit.vx, hit.vy, true) : null;

        // This hit a tile that could be cut so we ignore
        if (behavior?.cuttable <= hit.damage && (!behavior?.low || hit.cutsGround)) {
            // We need to find the specific cuttable layers that can be destroyed.
            for (const layer of area.layers) {
                const tile = layer.tiles[target.y][target.x];
                if (tile?.behaviors?.cuttable <= hit.damage) {
                    destroyTile(state, area, {...target, layerKey: layer.key});
                }
            }
            combinedResult.hit = true;
            continue;
        }
        if (behavior?.pickupWeight <= hit.crushingPower) {
            // We need to find the specific liftable layers that can be destroyed.
            for (const layer of area.layers) {
                const tile = layer.tiles[target.y][target.x];
                if (tile?.behaviors?.pickupWeight <= hit.crushingPower) {
                    destroyTile(state, area, {...target, layerKey: layer.key});
                }
            }
            combinedResult.hit = true;
            continue;
        }
        if (
            (
                (behavior?.cuttable > hit.damage || behavior?.solid)
                && (!behavior?.low || hit.cutsGround)
                && (!behavior?.isSouthernWall || (direction !== 'down' && direction !== 'downleft' && direction !== 'downright'))
            )
            || (!hit.projectile?.passedLedgeTiles?.find(t => t.x === target.x && t.y === target.y) && (
                (direction === 'upleft' && (behavior?.ledges?.down || behavior?.ledges?.right || behavior?.diagonalLedge === 'downright'))
                || (direction === 'up' && (behavior?.ledges?.down || behavior?.diagonalLedge === 'downleft' || behavior?.diagonalLedge === 'downright'))
                || (direction === 'upright' && (behavior?.ledges?.down || behavior?.diagonalLedge === 'downleft' || behavior?.ledges?.left))
                || (direction === 'downleft' && (behavior?.ledges?.up || behavior?.ledges?.right || behavior?.diagonalLedge === 'upright'))
                || (direction === 'down' && (behavior?.ledges?.up || behavior?.diagonalLedge === 'upleft' || behavior?.diagonalLedge === 'upright'))
                || (direction === 'downright' && (behavior?.ledges?.up || behavior?.diagonalLedge === 'upleft' || behavior?.ledges?.left))
                || (direction === 'left' && (behavior?.ledges?.right || behavior?.diagonalLedge === 'downright' || behavior?.diagonalLedge === 'upright'))
                || (direction === 'right' && (behavior?.ledges?.left || behavior?.diagonalLedge === 'downleft' || behavior?.diagonalLedge === 'upleft'))
            ))
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
    if (setProjectileLow) {
        hit.projectile.isHigh = false;
    } else if (setProjectileHigh) {
        hit.projectile.isHigh = true;
    }

    return combinedResult;
}

export function breakBrittleTiles(state: GameState, area: AreaInstance, hitbox: Rect) {
    const tiles = getTilesInRectangle(area, hitbox);
    const behaviorGrid = area.behaviorGrid;
    for (const {x, y} of tiles) {
        let behaviors = behaviorGrid[y]?.[x];
        if (!behaviors?.isBrittleGround) {
            continue;
        }
        for (const layer of area.layers) {
            const tile = layer.tiles[y]?.[x];
            if (tile?.behaviors?.isBrittleGround) {
                destroyTile(state, area, {x, y, layerKey: layer.key});
                break;
            }
        }
    }
}

export function isTargetHit(hitbox: Rect, hit: HitProperties): boolean {
    if (hit.hitCircle) {
        const r = hit.hitCircle.r;
        // Fudge a little by pretending the target is a circle.
        const fakeRadius = hitbox.w / 4 + hitbox.h / 4;
        const r2 = (r + fakeRadius) ** 2;
        const dx = hitbox.x + hitbox.w / 2 - hit.hitCircle.x;
        const dy = hitbox.y + hitbox.h / 2 - hit.hitCircle.y;
        return dx * dx + dy * dy < r2;
    }
    if (hit.hitRay) {
        // Fudge a little by pretending the target is a circle.
        const fakeRadius = hitbox.w / 4 + hitbox.h / 4;
        const { distance } = distanceToSegment(
            { x: hitbox.x + hitbox.w / 2, y: hitbox.y + hitbox.h / 2},
            hit.hitRay
        );
        return distance <= (hit.hitRay.r + fakeRadius);
    }
    return hit.hitbox && rectanglesOverlap(hitbox, hit.hitbox);
}

function isObject(object: ObjectInstance | EffectInstance): object is ObjectInstance {
    return !!(object as ObjectInstance).isObject;
}

function getHitTestPoints(hit: HitProperties): Point[] {
    const points: Point[] = [];
    if (hit.hitCircle) {
        const c = hit.hitCircle;
        points.push({x: c.x, y: c.y - c.r});
        points.push({x: c.x - c.r, y: c.y});
        points.push({x: c.x + c.r, y: c.y});
        points.push({x: c.x, y: c.y + c.r});
    } else if (hit.hitRay) {
        // This isn't great.
        const r = hit.hitRay;
        points.push({x: r.x1, y: r.y1});
        points.push({x: r.x2, y: r.y2});
    } else {
        const box = hit.hitbox;
        points.push({x: box.x, y: box.y});
        points.push({x: box.x + box.w - 1, y: box.y});
        points.push({x: box.x, y: box.y + box.h - 1});
        points.push({x: box.x + box.w - 1, y: box.y + box.h - 1});
    }
    return points;
}

function applyHitToObject(state: GameState, object: ObjectInstance | EffectInstance, hit: HitProperties, combinedResult: HitResult) {
    let behaviors: TileBehaviors = {solid: false, destructible: false, low: false};
    if (object.getBehaviors) {
        for (const p of getHitTestPoints(hit)) {
            const pointBehaviors = object.getBehaviors(state, p.x, p.y);
            behaviors.solid = behaviors.solid || pointBehaviors.solid;
            behaviors.destructible = behaviors.destructible || pointBehaviors.destructible;
            behaviors.low = behaviors.low || pointBehaviors.low;
            // We can stop after finding a single solid point.
            if (behaviors.solid) {
                break;
            }
        }
    } else {
        behaviors = object.behaviors;
    }
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
        combinedResult.returnHit ||= result.returnHit;
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
