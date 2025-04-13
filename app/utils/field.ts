import {allTiles} from 'app/content/tiles';
import {getLedgeDelta} from 'app/movement/getLedgeDelta';
import {isUnderLedge} from 'app/movement/isUnderLedge';
import {destroyTile} from 'app/utils/destroyTile';
import {directionMap, getDirection} from 'app/utils/direction';
import {removeEffectFromArea} from 'app/utils/effects';
import {rectanglesOverlap} from 'app/utils/index';
import {getDrawPriority} from 'app/utils/layers';
import {getObjectBehaviors, removeObjectFromArea} from 'app/utils/objects';
import {resetTileBehavior} from 'app/utils/tileBehavior';


export {directionMap, getDirection} from 'app/utils/direction';

export function canTeleportToCoords(state: GameState, area: AreaInstance, {x, y}: Point): boolean {
    return isTileOpen(state, area, {x, y}) && !isUnderLedge(state, area, {x, y, w: 16, h: 16});
}

export function canSomersaultToCoords(state: GameState, area: AreaInstance, {x, y}: Point): boolean {
    return isTileOpen(state, area, {x, y}) && !isUnderLedge(state, area, {x, y, w: 16, h: 16});
}
window.canSomersaultToCoords = canSomersaultToCoords;

export function isTileOpen(state: GameState, area: AreaInstance, {x, y}: Point, movementProperties: MovementProperties = {}): boolean {
    movementProperties = {
        canSwim: true,
        canFall: true,
        canMoveInLava: true,
        ...movementProperties,
    };
    x = x | 0;
    y = y | 0;
    /*console.log(x, y, isPointOpen(state, area, {x: x, y: y}, movementProperties));
    console.log(x + 15, y, isPointOpen(state, area, {x: x + 15, y: y}, movementProperties));
    console.log(x, y + 15, isPointOpen(state, area, {x: x, y: y + 15}, movementProperties));
    console.log(x + 15, y + 15, isPointOpen(state, area, {x: x + 15, y: y + 15}, movementProperties));*/
    return isPointOpen(state, area, {x: x, y: y}, movementProperties) &&
        isPointOpen(state, area, {x: x + 15, y: y}, movementProperties) &&
        isPointOpen(state, area, {x: x, y: y + 15}, movementProperties) &&
        isPointOpen(state, area, {x: x + 15, y: y + 15}, movementProperties);
}

function isPointOpen(
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
    } else if (tileBehavior?.solidMap && (!tileBehavior?.climbable || !movementProperties.canClimb)) {
        // If the behavior has a bitmap for solid pixels, read the exact pixel to see if it is blocked.
        if (movementProperties.needsFullTile) {
            return false;
        }
        // console.log(tileBehavior.solidMap, y, x, sy, sx, tileBehavior.solidMap[sy] >> (15 - sx));
        if (tileBehavior.solidMap[sy] >> (15 - sx) & 1) {
            return false;
        }
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

function getHitTiles(area: AreaInstance, hit: HitProperties): TileCoords[] {
    let hitTiles: TileCoords[] = [];
    if (hit.tileHitbox || hit.hitbox) {
        hitTiles = getTilesInRectangle(area, hit.tileHitbox || hit.hitbox);
    }
    if (hit.hitCircle) {
        hitTiles = [...hitTiles, ...getTilesInCircle(area, hit.hitCircle)];
    }
    if (hit.hitRay) {
        hitTiles = [...hitTiles, ...getTilesInRay(area, hit.hitRay)];
    }
    return hitTiles;
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

export function getTilesInCircle(area: AreaInstance, {x, y, r}: Circle): TileCoords[] {
    const tileSize = 16;
    const tiles: TileCoords[] = []
    const T = Math.floor((y - r) / tileSize);
    const B = Math.ceil((y + r) / tileSize) - 1;
    const r2 = r * r;
    //console.log({x, y, r});
    //console.log({T, B});
    for (let ty = T; ty <= B; ty++) {
        if (ty < 0 || ty >= area.h) continue;
        const my = ty * tileSize + tileSize / 2;
        const dy = my - y;
        const dx = Math.sqrt(Math.max(0, r2 - dy * dy));
        const L = Math.floor((x - dx) / tileSize);
        const R = Math.ceil((x + dx) / tileSize) - 1;
        //console.log({my, dy, dx, L, R});
        for (let tx = L; tx <= R; tx++) {
            if (tx < 0 || tx >= area.w) continue;
            tiles.push({x: tx, y: ty});
        }
    }
    return tiles;
}

export function getTilesInRay(area: AreaInstance, {x1, y1, x2, y2, r}: Ray): TileCoords[] {
    const tileSize = 16;
    const tiles: TileCoords[] = []
    const T = Math.floor((Math.min(y1, y2) - r) / tileSize);
    const B = Math.ceil((Math.max(y1, y2) + r) / tileSize) - 1;
    //console.log({x1, y1, x2, y2, r});
    //console.log({T, B});
    for (let ty = T; ty <= B; ty++) {
        if (ty < 0 || ty >= area.h) continue;
        const L = Math.floor((Math.min(x1, x2) - r) / tileSize);
        const R = Math.ceil((Math.max(x1, x2) + r) / tileSize) - 1;
        //console.log({L, R});
        for (let tx = L; tx <= R; tx++) {
            if (tx < 0 || tx >= area.w) continue;

            const { distance } = distanceToSegment(
                { x: tx * 16 + 8, y: ty * 16 + 8},
                {x1, y1, x2, y2}
            );
            //console.log({tx, ty, distance});
            if (distance < 10) {
                tiles.push({x: tx, y: ty});
            }
        }
    }
    return tiles;
}

export function distanceToSegment({x, y}: Point, {x1, y1, x2, y2}: {x1: number, y1: number, x2: number, y2: number}) {
    const lengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (lengthSquared == 0) {
        const dx = x2 - x, dy = y2 - y;
        return {
            distance: Math.sqrt(dx * dx + dy * dy),
            // Return the vector pointing towards the end of the segment.
            dx, dy,
            cx: x, cy: y,
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
        // Return the closest point on the segment.
        cx: closestX, cy: closestY
    };
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
        // Ground hits don't apply to anything with a positve z value.
        if (hit.isGroundHit && object.z > 0) {
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
        // Projectiles from high attacks ignore anything that isn't very tall.
        if (hit.anchorPoint) {
            const objectAnchor = {
                x: hitbox.x + hitbox.w / 2,
                y: hitbox.y + hitbox.h / 2,
            };
            const delta = getLedgeDelta(state, area, hit.anchorPoint, objectAnchor);
            // At high heights, only hit objects above the anchor point or very tall objects.
            if (hit.isHigh && !(object.behaviors?.isVeryTall || delta > 0)) {
                continue;
            }
            // At normal height only hit objects on the same level
            // This includes delta == 0 or delta < 0 for very tall objects.
            if (hit.isHigh === false && delta && !(object.behaviors?.isVeryTall && delta <= 0)) {
                continue;
            }
        }
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
    const hitTiles = hit.hitTiles ? getHitTiles(area, hit) : [];
    if (hit.breaksGround) {
        // Don't calculate hit tiles again if we already know them.
        breakBrittleTiles(state, area, hitTiles.length ? hitTiles : getHitTiles(area, hit));
    }
    for (const target of hitTiles) {
        const behavior = area.behaviorGrid?.[target.y]?.[target.x];
        if (hit.anchorPoint) {
            const tileAnchor = {
                x: 16 * target.x + 8,
                y: 16 * target.y + 8,
            };
            // The behavior for the center of the tile on diagonal ledges is not easy to define so for
            // these tiles we push the tileAnchor point away from the diagonal and the hit.
            if (behavior?.diagonalLedge === 'upright' || behavior?.diagonalLedge === 'downleft') {
                if (hit.anchorPoint.x - hit.anchorPoint.y >= tileAnchor.x - tileAnchor.y) {
                    tileAnchor.x -= 2;
                    tileAnchor.y += 2;
                } else {
                    tileAnchor.x += 2;
                    tileAnchor.y -= 2;
                }
            }
            if (behavior?.diagonalLedge === 'upleft' || behavior?.diagonalLedge === 'downright') {
                if (hit.anchorPoint.x + hit.anchorPoint.y >= tileAnchor.x + tileAnchor.y) {
                    tileAnchor.x -= 2;
                    tileAnchor.y -= 2;
                } else {
                    tileAnchor.x += 2;
                    tileAnchor.y += 2;
                }
            }
            const delta = getLedgeDelta(state, area, hit.anchorPoint, tileAnchor);
            if (hit.isHigh) {
                // At high heights, only hit objects above the anchor point or very tall objects.
                if (!behavior?.isVeryTall && delta <= 0) {
                    continue;
                }
            } else if (hit.isHigh === false) {
                // A positive delta here means the projectile hit a cliff
                // We may want to change this behavior if this is causing projectiles to be blocked by hitting
                // ledges that are not in the direction of their movement. However, this might not be a problem
                // since when moving over ledges projectiles should be marked 'isHigh' which will prevent being
                // stopped until they pass up another ledge.
                if (delta > 0) {
                    combinedResult.hit = true;
                    combinedResult.pierced = false;
                    combinedResult.stopped = true;
                    if (behavior?.cuttable > hit.damage) {
                        combinedResult.blocked = true;
                    }
                }
                // At normal height only hit objects on the same level
                // This includes delta == 0 or delta < 0 for very tall objects.
                if (delta && !(behavior?.isVeryTall && delta <= 0)) {
                    continue;
                }
            }
        }

        // Check if the hit destroys part of the tile:
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
            (behavior?.cuttable > hit.damage || behavior?.solid)
            && (!behavior?.low || hit.cutsGround)
            //&& (!behavior?.isSouthernWall || (direction !== 'down' && direction !== 'downleft' && direction !== 'downright'))
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

        // Check if the hit applies an elemental effect to the tile.
        if (behavior?.elementOffsets?.[hit.element]) {
            for (const layer of [...area.layers].reverse()) {
                const behaviors = layer.tiles?.[target.y]?.[target.x]?.behaviors;
                const offset = behaviors?.elementOffsets?.[hit.element];
                if (offset) {
                    const tileIndex = layer.tiles[target.y][target.x].index;
                    layer.tiles[target.y][target.x] = allTiles[tileIndex + offset];
                }
                if (behaviors?.isGround || behaviors?.isGroundMap || behaviors?.solid || behaviors?.solidMap
                    || behaviors?.pit || behaviors?.pitMap || behaviors?.water || behaviors?.shallowWater
                    || behaviors?.isLava || behaviors?.isLavaMap
                ) {
                    break;
                }
            }
            if (area.tilesDrawn[target.y]?.[target.x]) {
                area.tilesDrawn[target.y][target.x] = false;
            }
            area.checkToRedrawTiles = true;
            resetTileBehavior(area, target);
        } else if (behavior?.elementTiles?.[hit.element] !== undefined) {
            // Only effect the layers on top of the first blocking layer.
            // This way if a layer like lava is covering tiles, hits won't interact with the covered up tiles.
            for (const layer of [...area.layers].reverse()) {
                const behaviors = layer.tiles?.[target.y]?.[target.x]?.behaviors;
                const tileIndex = behaviors?.elementTiles?.[hit.element];
                if (tileIndex !== undefined) {
                    if (behaviors?.isFrozen) {
                        area.needsIceRefresh = true;
                    }
                    layer.tiles[target.y][target.x] = allTiles[tileIndex];
                }
                if (behaviors?.isGround || behaviors?.isGroundMap || behaviors?.solid || behaviors?.solidMap
                    || behaviors?.pit || behaviors?.pitMap || behaviors?.water || behaviors?.shallowWater
                    || behaviors?.isLava || behaviors?.isLavaMap
                ) {
                    break;
                }
            }
            if (area.tilesDrawn[target.y]?.[target.x]) {
                area.tilesDrawn[target.y][target.x] = false;
            }
            for (const [x, y] of [
                [target.x - 1, target.y - 1], [target.x, target.y - 1], [target.x + 1, target.y - 1],
                [target.x - 1, target.y], [target.x + 1, target.y],
                [target.x - 1, target.y + 1], [target.x, target.y + 1], [target.x + 1, target.y + 1],
            ]) {
                // Any nearby tiles that are also frozen may also need to be redrawn with new ice graphics.
                if (area.behaviorGrid?.[y]?.[x]?.isFrozen && area.tilesDrawn[y]?.[x]) {
                    area.tilesDrawn[y][x] = false;
                }
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
                || behavior?.shallowWater || behavior?.water || behavior?.isFrozen
            )
        ) {
            let topLayer: AreaLayer;
            let foundBlockingLayer = false;
            // We want to allow freezing on top of ledge behaviors without losing the ledge behaviors, so we have to
            // record any found any then include those on the frozen tile behavior.
            let underLedges: any, underDiagonalLedge: any;
            for (const layer of area.layers) {
                // Never freeze anything in the foreground.
                if (getDrawPriority(layer.definition) === 'foreground') {
                    break;
                }
                //const behaviors = layer.tiles[target.y][target.x]?.behaviors;
                const behaviors = {
                    ...layer.tiles[target.y][target.x]?.behaviors,
                    ...layer.maskTiles?.[target.y]?.[target.x]?.behaviors,
                };
                // Blocking layers prevent freezing until another layer is found that erases the blocking behavior.
                if (foundBlockingLayer && !(behaviors?.isLava || behaviors?.isLavaMap || behaviors?.cloudGround || behaviors?.isGround === true)) {
                    continue;
                }
                foundBlockingLayer = false;
                if (!behaviors?.isOverlay
                    && !behaviors?.solid && !behaviors?.solidMap
                    && !behaviors?.pit && !behaviors?.pitMap
                    // Experimental: keep ledges drawn over ice for clarity and consistency with tiles
                    // that combine ledges+walls (usually SW/SE ledges).
                    && !behaviors?.ledges
                ) {
                    underLedges = behaviors?.ledges || underLedges;
                    underDiagonalLedge = behaviors?.diagonalLedge || underDiagonalLedge;
                    topLayer = layer;
                } else {
                    foundBlockingLayer = true;
                    underLedges = undefined;
                    underDiagonalLedge = undefined;
                }
            }
            if (topLayer) {
                // Fabricate a frozen tile that has the original tile "underneath it", so it will
                // return to the original state if exposed to fire.
                const underTile = topLayer.tiles[target.y][target.x];
                // console.log('freezing tile', target.x, target.y, topLayer.key, underTile);
                topLayer.tiles[target.y][target.x] = {
                    index: 294,
                    frame: allTiles[1].frame,
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
                for (const [x, y] of [
                    [target.x - 1, target.y - 1], [target.x, target.y - 1], [target.x + 1, target.y - 1],
                    [target.x - 1, target.y], [target.x + 1, target.y],
                    [target.x - 1, target.y + 1], [target.x, target.y + 1], [target.x + 1, target.y + 1],
                ]) {
                    // Any nearby tiles that are also frozen may also need to be redrawn with new ice graphics.
                    if (area.behaviorGrid?.[y]?.[x]?.isFrozen && area.tilesDrawn[y]?.[x]) {
                        area.tilesDrawn[y][x] = false;
                    }
                }
                // Indicate that ice edging needs to be added around newly frozen tiles.
                area.needsIceRefresh = true;
                area.checkToRedrawTiles = true;
                resetTileBehavior(area, target);
                // console.log('updated behavior', area.behaviorGrid?.[target.y]?.[target.x]);
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
        //const direction = (hit.vx || hit.vy) ? getDirection(hit.vx, hit.vy, true) : null;

    }
    return combinedResult;
}

export function breakBrittleTilesInRect(state: GameState, area: AreaInstance, hitbox: Rect) {
    if (!area) {
        return;
    }
    breakBrittleTiles(state, area, getTilesInRectangle(area, hitbox));
}

export function breakBrittleTiles(state: GameState, area: AreaInstance, tiles: TileCoords[]) {
    if (!area) {
        return;
    }
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
    // This could be called multiple times in a single frame, so make sure the object is still in the area before applying the hit.
    if (!object.area) {
        return;
    }
    let behaviors: TileBehaviors = {solid: false, destructible: false, low: false};
    if (object.getBehaviors) {
        for (const p of getHitTestPoints(hit)) {
            const pointBehaviors = object.getBehaviors(state, p.x, p.y);
            if (!pointBehaviors) {
                continue;
            }
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

export function canCoverTile(area: AreaInstance, tx: number, ty: number, coverTile: number): boolean {
    const topLayer = getLayerToCover(area, tx, ty);
    if (!topLayer) {
        return false;
    }
    const currentIndex = topLayer.tiles[ty][tx]?.index || 0;
    return currentIndex !== coverTile;
}

export function getLayerToCover(area: AreaInstance, tx: number, ty: number): AreaLayer|undefined {
    const behavior = area.behaviorGrid?.[ty]?.[tx];
    // For now solid tiles and pits cannot be covered
    if (behavior?.solid || behavior?.pit || behavior?.pitMap || behavior?.covered
        || behavior?.isLava || behavior?.isLavaMap
        || behavior?.blocksStaff || behavior?.solidMap
        || behavior?.diagonalLedge
    ) {
        return;
    }
    let topLayer: AreaLayer = area.layers[0];
    for (const layer of area.layers) {
        if (getDrawPriority(layer.definition) === 'foreground') {
            break;
        }
        topLayer = layer;
    }
    return topLayer;
}

export function coverTile(
    this: void, state: GameState, area: AreaInstance, tx: number, ty: number, coverTile: number, source?: Actor
): boolean {
    const topLayer = getLayerToCover(area, tx, ty);
    if (!topLayer) {
        return false;
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
            // Pass the source of the tile through to the touchHit if defined.
            touchHit: allTiles[coverTile].behaviors?.touchHit ? {
                ...allTiles[coverTile].behaviors.touchHit,
                source,
            } : undefined,
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
        if (tile?.behaviors?.cuttable || tile?.behaviors?.underTile) {
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
