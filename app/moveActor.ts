import _ from 'lodash';

import { FRAME_LENGTH } from 'app/gameConstants';
import { damageActor, throwHeldObject } from 'app/updateActor';
import { getTileBehaviorsAndObstacles, isPointOpen } from 'app/utils/field';

import { Actor, Direction, GameState, Hero, MovementProperties } from 'app/types';

export function moveActor(state: GameState, actor: Actor, dx: number, dy: number, {
    canPush = false,
    canFall = false,
    canSwim = false,
    canClimb = false,
    canWiggle = true,
}: MovementProperties) {
    let sx = dx;
    if (sx < -1 || sx > 1) {
        sx /= Math.abs(sx);
    }
    let sy = dy;
    if (sy < -1 || sy > 1) {
        sy /= Math.abs(sy);
    }
    let mx = 0, my = 0;
    let s = 0;
    while (s < 100) {
        let movedX = false, movedY = false;
        if (sx) {
            // You can't push when moving diagonally.
            movedX = moveActorInDirection(state, actor, sx, (sx < 0) ? 'left' : 'right', {
                canPush: canPush && !dy,
                canWiggle: canWiggle && !dy,
                canSwim,
                canFall,
                canClimb,
            });
            if (movedX) {
                mx += sx;
                if (sx > -1 && sx < 1) {
                    sx = 0;
                } else {
                    const delta = Math.abs(dx - mx);
                    if (delta < 1) {
                        sx *= delta;
                    }
                }
            }
        }
        if (sy) {
            // You can't push when moving diagonally.
            movedY = moveActorInDirection(state, actor, sy, (sy < 0) ? 'up' : 'down', {
                canPush: canPush && !dx,
                canWiggle: canWiggle && !dx,
                canSwim,
                canFall,
                canClimb,
            });
            if (movedY) {
                my += sy;
                if (sy > -1 && sy < 1) {
                    sy = 0;
                } else {
                    const delta = Math.abs(dy - my);
                    if (delta < 1) {
                        sy *= delta;
                    }
                }
            }
        }
        if (!movedX && !movedY) {
            return mx !== 0 || my !== 0;
        }
    }
    if (s >= 100) {
        console.error('infinite loop');
    }
    return true;
}
function moveActorInDirection(
    state: GameState,
    actor: Actor,
    amount: number,
    direction: Direction,
    movementProperties: MovementProperties
) {
    const {
        canPush = false,
        canFall = false,
        canSwim = false,
        canClimb = false,
        canWiggle = true,
    } = movementProperties;
    let ax = actor.x, ay = actor.y;
    if (direction === 'up' || direction === 'down') {
        ay += amount;
    } else {
        ax += amount;
    }

    let checkPoints: {x: number, y: number}[];
    // When moving vertically, we only care about the row we are moving into.
    if (direction === 'up') {
        checkPoints = [{x: ax, y: ay}, {x: ax + 7, y: ay}];
        if (actor.w > 8) {
            checkPoints = [...checkPoints, {x: ax + 8, y: ay}, {x: ax + 15, y: ay}];
        }
    } else if (direction === 'down') {
        checkPoints = [{x: ax, y: ay + actor.h - 1}, {x: ax + 7, y: ay + actor.h - 1}];
        if (actor.w > 8) {
            checkPoints = [...checkPoints, {x: ax + 8, y: ay + actor.h - 1}, {x: ax + 15, y: ay + actor.h - 1}];
        }
    } else if (direction === 'left') {
        checkPoints = [{x: ax, y: ay}, {x: ax, y: ay + 7}];
        if (actor.h > 8) {
            checkPoints = [...checkPoints, {x: ax, y: ay + 8}, {x: ax, y: ay + 15}];
        }
    } else if (direction === 'right') {
        checkPoints = [{x: ax + actor.w - 1, y: ay}, {x: ax + actor.w - 1, y: ay + 7}];
        if (actor.h > 8) {
            checkPoints = [...checkPoints, {x: ax + actor.w - 1, y: ay + 8}, {x: ax + actor.w - 1, y: ay + 15}];
        }
    }
    const excludedObjects = new Set<any>([actor]);
    if (actor.pickUpObject) {
        excludedObjects.add(actor.pickUpObject);
    }

    let blockedByTile = false, canJumpDown = true;
    let blockedByObject = false;
    let pushedObjects = [];
    for (const point of checkPoints) {
        const { tileBehavior, objects} = getTileBehaviorsAndObstacles(state, actor.area, point, excludedObjects);
        if (tileBehavior?.solid && tileBehavior?.damage > 0) {
            damageActor(state, actor, tileBehavior.damage, {
                vx: - 4 * (ax - actor.x),
                vy: - 4 * (ay - actor.y),
                vz: 2,
            });
        }
        // Climbable overrides solid tile behavior. This allows use to place tiles marked climbable on top
        // of solid tiles to make them passable.
        const isTilePassable = (!tileBehavior?.solid || tileBehavior.climbable);
        // The second condition is a hack to prevent enemies from walking over pits.
        if (!isTilePassable || (tileBehavior?.pit && !canFall)) {
            blockedByTile = true;
        }
        if (tileBehavior?.water && !canSwim) {
            blockedByTile = true;
        }
        if (tileBehavior?.climbable && !canClimb) {
            blockedByTile = true;
        }
        if (!isTilePassable && tileBehavior?.jumpDirection !== direction) {
            canJumpDown = false;
        }
        for (const object of objects) {
            blockedByObject = blockedByObject || object.behaviors?.solid;
            if (canPush) {
                pushedObjects.push(object);
            }
        }
    }
    pushedObjects = _.uniq(pushedObjects);
    if (canPush && (blockedByTile || pushedObjects.length) && (!actor.action || actor.action === 'walking' || actor.action === 'pushing')) {
        if (!canJumpDown && actor.action !== 'pushing') {
            actor.action = 'pushing';
            actor.animationTime = 0;
        }
        if (canJumpDown) {
            actor.jumpingTime = (actor.jumpingTime || 0) + FRAME_LENGTH;
            if (actor.jumpingTime >= 500) {
                actor.action = 'jumpingDown';
                actor.animationTime = 0;
                actor.vx = ax - actor.x;
                // Make the actor "jump up" a bit at the start.
                actor.vy = ay - actor.y - 2;
            }
        } else {
            actor.jumpingTime = 0;
        }
    } else if ((!blockedByTile && !pushedObjects.length) && actor.action === 'pushing') {
        actor.action = null;
        actor.jumpingTime = 0;
    } else {
        actor.jumpingTime = 0;
    }

    //if (!blockedByTile && pushedObjects.length === 1) {
    if (pushedObjects.length === 1) {
        if (pushedObjects[0].onPush) {
            pushedObjects[0].onPush(state, direction);
        }
    } else if (pushedObjects.length >= 1) {
        for (const object of pushedObjects) {
            const hitbox = object.getHitbox(state);
            if (Math.abs(ax - hitbox.x) < 8
                || Math.abs(ax + actor.w - hitbox.x - hitbox.w) < 8
                || Math.abs(ay - hitbox.y) < 8
                || Math.abs(ay + actor.h - hitbox.y - hitbox.h) < 8
            ) {
                if (object.onPush) {
                    object.onPush(state, direction);
                }
            }
        }
    }
    if (blockedByTile || blockedByObject) {
        // If this is true, wiggle the character up to Npx to get around corners.
        // This makes it much smoother to try and get into pixel perfect gaps.
        if (!canWiggle) {
            return false;
        }
        const maxWiggle = 8;
        function wiggleLeft(y: number) {
            for (let l = ax - 1; l >= ax - maxWiggle; l--) {
                let open = true;
                for (const x of [l, l + Math.floor(actor.w / 2), l + actor.w - 1]) {
                    if (!isPointOpen(state, actor.area, {x, y}, excludedObjects)) {
                        open = false;
                        break;
                    }
                }
                if (open) {
                    return moveActorInDirection(state, actor, -0.5, 'left', {
                        ...movementProperties,
                        canWiggle: false,
                    });
                }
            }
        }
        function wiggleRight(y: number) {
            for (let l = ax + 1; l <= ax + maxWiggle; l++) {
                let open = true;
                for (const x of [l, l + Math.floor(actor.w / 2), l + actor.w - 1]) {
                    if (!isPointOpen(state, actor.area, {x, y}, excludedObjects)) {
                        open = false;
                        break;
                    }
                }
                if (open) {
                    return moveActorInDirection(state, actor, 0.5, 'right', {
                        ...movementProperties,
                        canWiggle: false,
                    });
                }
            }
        }
        function wiggleUp(x: number) {
            for (let t = ay - 1; t >= ay - maxWiggle; t--) {
                let open = true;
                for (const y of [t, t + Math.floor(actor.h / 2), t + actor.h - 1]) {
                    if (!isPointOpen(state, actor.area, {x, y}, excludedObjects)) {
                        open = false;
                        break;
                    }
                }
                if (open) {
                    return moveActorInDirection(state, actor, -0.5, 'up', {
                        ...movementProperties,
                        canWiggle: false,
                    });
                }
            }
        }
        function wiggleDown(x: number) {
            for (let t = ay + 1; t <= ay + maxWiggle; t++) {
                let open = true;
                for (const y of [t, t + Math.floor(actor.h / 2), t + actor.h - 1]) {
                    if (!isPointOpen(state, actor.area, {x, y}, excludedObjects)) {
                        open = false;
                        break;
                    }
                }
                if (open) {
                    return moveActorInDirection(state, actor, 0.5, 'down', {
                        ...movementProperties,
                        canWiggle: false,
                    });
                }
            }
        }
        if (direction === 'up') {
            if (wiggleLeft(ay)) {
                return true;
            }
            if (wiggleRight(ay)) {
                return true;
            }
        } else if (direction === 'down') {
            if (wiggleLeft(ay + actor.h - 1)) {
                return true;
            }
            if (wiggleRight(ay + actor.h - 1)) {
                return true;
            }
        } else if (direction === 'left') {
            if (wiggleUp(ax)) {
                return true;
            }
            if (wiggleDown(ax)) {
                return true;
            }
        } else if (direction === 'right') {
            if (wiggleUp(ax + actor.w - 1)) {
                return true;
            }
            if (wiggleDown(ax + actor.w - 1)) {
                return true;
            }
        }
        return false;
    }
    actor.x = ax;
    actor.y = ay;
    return true;
}
export function checkForFloorEffects(state: GameState, hero: Hero) {
    const palette = hero.area.palette;
    const tileSize = palette.w;

    let leftColumn = Math.floor((hero.x + 4) / tileSize);
    let rightColumn = Math.floor((hero.x + hero.w - 5) / tileSize);
    let topRow = Math.floor((hero.y + 4) / tileSize);
    let bottomRow = Math.floor((hero.y + hero.h - 5) / tileSize);

    const behaviorGrid = hero.area.behaviorGrid;
    // We don't want a player to be able to walk in between pits without falling, so the character is forced to fall
    // any time all four corners are over pits.
    let fallingTopLeft = false, fallingTopRight = false, fallingBottomLeft = false, fallingBottomRight = false;
    let startSwimming = true;
    let startClimbing = false;
    for (let row = topRow; row <= bottomRow; row++) {
        for (let column = leftColumn; column <= rightColumn; column++) {
            const behaviors = behaviorGrid?.[row]?.[column];
            // This will happen when the player moves off the edge of the screen.
            if (!behaviors) {
                startSwimming = false;
                continue;
            }
            if (behaviors.climbable) {
                startClimbing = true;
            }
            if (behaviors.damage > 0) {
                damageActor(state, hero, behaviors.damage);
            }
            if (!behaviors.water) {
                startSwimming = false;
            }
            if (behaviors.pit && hero.action !== 'roll' && hero.z <= 0) {
                if (hero.y - row * 16 > 4) {
                    if (hero.x - column * 16 > 4) {
                        fallingTopLeft = true;
                    } else if (hero.x - column * 16 < -4) {
                        fallingTopRight = true;
                    } else {
                        fallingTopLeft = fallingTopRight = true;
                    }
                } else if (hero.y - row * 16 < -4) {
                    if (hero.x - column * 16 > 4) {
                        fallingBottomLeft = true;
                    } else if (hero.x - column * 16 < -4) {
                        fallingBottomRight = true;
                    } else {
                        fallingBottomLeft = fallingBottomRight = true;
                    }
                } else {
                    if (hero.x - column * 16 > 4) {
                        fallingTopLeft = fallingBottomLeft = true;
                    } else if (hero.x - column * 16 < -4) {
                        fallingTopRight = fallingBottomRight = true;
                    } else {
                        fallingTopLeft = fallingTopRight = fallingBottomLeft = fallingBottomRight = true;
                    }
                }
            }
        }
    }
    if (startSwimming && hero.action !== 'roll' && hero.action !== 'entering' && hero.action !== 'exiting') {
        hero.action = 'swimming';
    } else if (!startSwimming && hero.action === 'swimming') {
        hero.action = null;
    }
    if (startClimbing) {
        hero.action = 'climbing';
    } else if (!startClimbing && hero.action === 'climbing') {
        hero.action = null;
    }
    if (fallingTopLeft && fallingTopRight && fallingBottomLeft && fallingBottomRight) {
        throwHeldObject(state, hero);
        hero.action = 'falling';
        hero.x = Math.round(hero.x / tileSize) * tileSize;
        hero.y = Math.round(hero.y / tileSize) * tileSize;
        hero.animationTime = 0;
    } else {
        if (fallingTopLeft && fallingTopRight) {
            hero.y -= 0.1;
        }
        if (fallingTopLeft && fallingBottomLeft) {
            hero.x -= 0.1;
        }
        if (fallingBottomRight && fallingBottomLeft) {
            hero.y += 0.1;
        }
        if (fallingBottomRight && fallingTopRight) {
            hero.x += 0.1;
        }
    }
}
