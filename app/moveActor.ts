import { uniq } from 'lodash';

import { getAreaSize } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { directionMap, getTileBehaviorsAndObstacles, isPointOpen } from 'app/utils/field';

import { Actor, Direction, GameState, Hero, MovementProperties } from 'app/types';

export function moveActor(state: GameState, actor: Actor, dx: number, dy: number, {
    boundToSection,
    boundToSectionPadding,
    canPush = false,
    canFall = false,
    canSwim = false,
    canClimb = false,
    canWiggle = true,
    excludedObjects = new Set(),
}: MovementProperties): {mx: number, my: number} {
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
                boundToSection,
                boundToSectionPadding,
                canPush: canPush && !dy,
                canWiggle: canWiggle && !dy,
                canSwim,
                canFall,
                canClimb,
                excludedObjects
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
                boundToSection,
                boundToSectionPadding,
                canPush: canPush && !dx,
                canWiggle: canWiggle && !dx,
                canSwim,
                canFall,
                canClimb,
                excludedObjects
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
            return {mx, my};
        }
    }
    if (s >= 100) {
        console.error('infinite loop');
    }
    return {mx, my};
}
function moveActorInDirection(
    state: GameState,
    actor: Actor,
    amount: number,
    direction: Direction,
    movementProperties: MovementProperties
): boolean {
    const {
        canPush = false,
        canFall = false,
        canSwim = false,
        canClimb = false,
        canJump = false,
        canWiggle = true,
    } = movementProperties;
    let ax = actor.x, ay = actor.y;
    if (direction === 'up' || direction === 'down') {
        ay += amount;
    } else {
        ax += amount;
    }
    if (movementProperties.boundToSection) {
        const p = movementProperties.boundToSectionPadding ?? 0;
        const { section } = getAreaSize(state);
        if (ax < section.x + p || ax + actor.w > section.x + section.w - p
            || ay < section.y + p || ay + actor.h > section.y + section.h - p
        ) {
            return false;
        }
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
    const excludedObjects = new Set<any>([...movementProperties.excludedObjects, actor]);
    if (actor.pickUpObject) {
        excludedObjects.add(actor.pickUpObject);
    }

    let blockedByTile = false, canJumpDown = canJump;
    let blockedByObject = false;
    let pushedObjects = [];
    for (const point of checkPoints) {
        const { tileBehavior, objects} = getTileBehaviorsAndObstacles(state, actor.area, point, excludedObjects);
        if (tileBehavior?.solid && tileBehavior?.damage > 0) {
            actor.onHit?.(state, { damage: tileBehavior.damage, knockback: {
                vx: - 4 * (ax - actor.x),
                vy: - 4 * (ay - actor.y),
                vz: 2,
            }});
            return false;
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
        if (tileBehavior.edges?.up
            || tileBehavior.edges?.down
            || tileBehavior.edges?.left
            || tileBehavior.edges?.right
        ) {
            //console.log(tileBehavior.edges);
            /*if (tileBehavior.edges?.up && direction !== 'up') {
                blockedByTile = true;
            }
            if (tileBehavior.edges?.down && direction !== 'down') {
                blockedByTile = true;
            }
            if (tileBehavior.edges?.left && direction !== 'left') {
                blockedByTile = true;
            }
            if (tileBehavior.edges?.right && direction !== 'right') {
                blockedByTile = true;
            }*/
            blockedByTile = true;
            canJumpDown = canJumpDown && !!tileBehavior.edges[direction];
        } else if (!isTilePassable && tileBehavior?.jumpDirection !== direction) {
            canJumpDown = false;
        }
        for (const object of objects) {
            blockedByObject = blockedByObject || object.behaviors?.solid;
            if (canPush && object.behaviors?.solid) {
                pushedObjects.push(object);
            }
        }
    }
    pushedObjects = uniq(pushedObjects);
    if (canPush && (blockedByTile || pushedObjects.length) && (!actor.action || actor.action === 'walking' || actor.action === 'pushing')) {
        if (!canJumpDown && actor.action !== 'pushing') {
            actor.action = 'pushing';
            actor.animationTime = 0;
        }
        if (canJumpDown) {
            actor.jumpingTime = (actor.jumpingTime || 0) + FRAME_LENGTH;
            if (actor.jumpingTime >= 250) {
                const [dx, dy] = directionMap[direction];
                if (direction === 'down') {
                    actor.action = 'jumpingDown';
                    actor.jumpDirection = direction;
                    actor.jumpingVx = 2 * dx;
                    actor.jumpingVy = 2 * dy;
                    actor.jumpingVz = 4;
                    actor.jumpingDownY = actor.y;
                } else if (direction === 'up') {
                    let targetY: number = null
                    for (let i = 2; i <= 6; i++) {
                        const y = Math.round(actor.y / 16 + i * dy) * 16;
                        const { tileBehavior: b1 } = getTileBehaviorsAndObstacles(state, actor.area, {x: actor.x, y});
                        const { tileBehavior: b2 } = getTileBehaviorsAndObstacles(state, actor.area, {x: actor.x + actor.w - 1, y});
                        if (!b1.solid && !b2.solid && !b1.cannotLand && !b2.cannotLand) {
                            targetY = y;
                            break;
                        }
                    }
                    //console.log(actor.x, targetY);
                    if (targetY !== null) {
                        const distance = actor.y - targetY;
                        actor.action = 'jumpingDown';
                        actor.jumpDirection = direction;
                        //const speed = distance > 54 ? 4 : 2;
                        const speed = Math.min(4, Math.round(distance / 15));
                        const frames = Math.round(distance / speed);
                        actor.jumpingVy = dy * distance / frames;
                        actor.jumpingVx = 0;
                        const az = -0.5;
                        actor.jumpingVz = -(frames - 1) * az / 2;
                    } else {
                        actor.jumpingTime = 0;
                    }
                } else {
                    let targetX: number = null
                    for (let i = 2; i <= 6; i++) {
                        const x = Math.round(actor.x / 16 + i * dx) * 16;
                        const { tileBehavior: b1 } = getTileBehaviorsAndObstacles(state, actor.area, {x, y: actor.y});
                        const { tileBehavior: b2 } = getTileBehaviorsAndObstacles(state, actor.area, {x, y: actor.y + actor.h - 1});
                        //console.log(x, actor.y, b1.solid, b1.cannotLand, b2.solid, b2.cannotLand);
                        if (!b1.solid && !b2.solid && !b1.cannotLand && !b2.cannotLand) {
                            targetX = x;
                            break;
                        }
                    }
                    //console.log(targetX, actor.y);
                    if (targetX !== null) {
                        actor.action = 'jumpingDown';
                        actor.jumpDirection = direction;
                        const distance = Math.abs(actor.x - targetX);
                        //const speed = distance > 54 ? 4 : 2;
                        const speed = Math.min(4, Math.round(distance / 15));
                        const frames = Math.round(distance / speed);
                        actor.jumpingVx = dx * distance / frames;
                        actor.jumpingVy = 0;
                        const az = -0.5;
                        actor.jumpingVz = -(frames - 1) * az / 2;
                        //console.log(distance, frames, actor.jumpingVx, actor.jumpingVz);
                    } else {
                        actor.jumpingTime = 0;
                    }
                }
                actor.animationTime = 0;
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
    if (actor.action === 'pushing' && !canPush) {
        actor.action = null;
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
                    if (!isPointOpen(state, actor.area, {x, y}, movementProperties, excludedObjects)) {
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
                    if (!isPointOpen(state, actor.area, {x, y}, movementProperties, excludedObjects)) {
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
                    if (!isPointOpen(state, actor.area, {x, y}, movementProperties, excludedObjects)) {
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
                    if (!isPointOpen(state, actor.area, {x, y}, movementProperties, excludedObjects)) {
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
    const tileSize = 16;

    let leftColumn = Math.floor((hero.x + 4) / tileSize);
    let rightColumn = Math.floor((hero.x + hero.w - 5) / tileSize);
    let topRow = Math.floor((hero.y + 4) / tileSize);
    let bottomRow = Math.floor((hero.y + hero.h - 5) / tileSize);

    const behaviorGrid = hero.area.behaviorGrid;
    // We don't want a player to be able to walk in between pits without falling, so the character is forced to fall
    // any time all four corners are over pits.
    hero.wading = true;
    hero.swimming = hero.action !== 'roll' && hero.z <= 0;
    hero.slipping = hero.z > 0;
    let fallingTopLeft = false, fallingTopRight = false, fallingBottomLeft = false, fallingBottomRight = false;
    let startClimbing = false;
    for (let row = topRow; row <= bottomRow; row++) {
        for (let column = leftColumn; column <= rightColumn; column++) {
            let behaviors = behaviorGrid[row]?.[column];
            // During screen transitions, the row/column will be out of bounds for the current screen,
            // so we need to wrap them and work against the next screen.
            if (row < 0 || row >= 32 || column < 0 || column >= 32) {
                if (!state.nextAreaInstance) {
                    continue;
                }
                behaviors = state.nextAreaInstance.behaviorGrid[(row + 32) % 32]?.[(column + 32) % 32];
            }
            // Default behavior is open solid ground.
            if (!behaviors) {
                hero.swimming = false;
                hero.wading = false;
                continue;
            }
            if (behaviors.climbable) {
                startClimbing = true;
            }
            if (behaviors.damage > 0 && hero.onHit) {
                hero.onHit(state, { damage: behaviors.damage });
            }
            if (!behaviors.water) {
                hero.swimming = false;
            }
            if (behaviors.slippery && !hero.equipedGear?.ironBoots) {
                hero.slipping = !hero.isAstralProjection;
            }
            if (!behaviors.shallowWater && !behaviors.water) {
                hero.wading = false;
            }
            // Use z <= 1 so that feather boots are still caught here.
            if (behaviors.pit && hero.action !== 'roll' && hero.z <= 1) {
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
    if (hero.swimming && hero.equipedGear?.cloudBoots) {
        hero.swimming = false;
        hero.wading = true;
    }
    if (startClimbing) {
        hero.action = 'climbing';
    } else if (!startClimbing && hero.action === 'climbing') {
        hero.action = null;
    }
    if (fallingTopLeft && fallingTopRight && fallingBottomLeft && fallingBottomRight) {
        hero.throwHeldObject(state);
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
