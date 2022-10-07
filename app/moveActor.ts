import { uniq } from 'lodash';

import { destroyTile, getAreaSize } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import {
    directionMap,
    getTileBehaviorsAndObstacles,
    isPointOpen,
    tileHitAppliesToTarget,
} from 'app/utils/field';
import { rectanglesOverlap } from 'app/utils/index';

import { Actor, Direction, GameState, Hero, MovementProperties } from 'app/types';

export function moveActor(state: GameState, actor: Actor, dx: number, dy: number, {
    boundToSection,
    boundToSectionPadding,
    canPush = false,
    canFall = false,
    canJump = false,
    canSwim = false,
    canClimb = false,
    canWiggle = true,
    direction,
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
                canJump,
                canPush: canPush && !dy,
                canWiggle: canWiggle && !dy,
                canSwim,
                canFall,
                canClimb,
                direction,
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
                canJump,
                canPush: canPush && !dx,
                canWiggle: canWiggle && !dx,
                canSwim,
                canFall,
                canClimb,
                direction,
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

    // Check the 1st + 7th pixel from the top/left, then the 1st + 7th pixel from the bottom/right
    // if they are different.
    let checkPoints: {x: number, y: number}[];
    // When moving vertically, we only care about the row we are moving into.
    if (direction === 'up' || direction === 'down') {
        const y = direction === 'up' ? ay : ay + actor.h - 1;
        checkPoints = [{x: ax, y}, {x: ax + 7, y}];
        if (actor.w > 8) {
            checkPoints = [...checkPoints, {x: ax + actor.w - 8, y}, {x: ax + actor.w - 1, y}];
        }
    } else {
        const x = direction === 'left' ? ax : ax + actor.w - 1;
        checkPoints = [{x, y: ay}, {x, y: ay + 7}];
        if (actor.h > 8) {
            checkPoints = [...checkPoints, {x, y: ay + actor.h - 8}, {x, y: ay + actor.h - 1}];
        }
    }
    const excludedObjects = new Set<any>([...movementProperties.excludedObjects, actor]);
    if (actor.pickUpObject) {
        excludedObjects.add(actor.pickUpObject);
    }

    let blockedByTile = false, canJumpDown = canJump;
    let blockedByObject = false;
    let pushedObjects = [];
    let quickJump = false;
    for (const point of checkPoints) {
        const { tileBehavior, objects, tx, ty} = getTileBehaviorsAndObstacles(
            state, actor.area, point, excludedObjects, null, null, direction
        );
        if (tileBehavior?.solid && (
                tileBehavior?.touchHit
                && !tileBehavior.touchHit?.isGroundHit
                // tile touchHit always applies to
                && tileHitAppliesToTarget(state, tileBehavior.touchHit, actor)
            )
        ) {
            const { returnHit } = actor.onHit?.(state, { ...tileBehavior.touchHit, knockback: {
                vx: - 4 * (ax - actor.x),
                vy: - 4 * (ay - actor.y),
                vz: 2,
            }});
            // Apply reflected damage to enemies if they were the source of the `touchHit`.
            if (returnHit && tileBehavior.touchHit.source?.onHit) {
                tileBehavior.touchHit.source.onHit(state, returnHit);
            }
            if (tileBehavior.cuttable && tileBehavior.cuttable <= returnHit?.damage) {
                for (const layer of actor.area.layers) {
                    const tile = layer.tiles[ty]?.[tx];
                    if (tile?.behaviors?.cuttable <= returnHit.damage) {
                        destroyTile(state, actor.area, { x: tx, y: ty, layerKey: layer.key });
                    }
                }
            }
            return false;
        }
        // Climbable overrides solid tile behavior. This allows use to place tiles marked climbable on top
        // of solid tiles to make them passable.
        const isTilePassable = (!tileBehavior?.solid || tileBehavior.climbable);
        // The second condition is a hack to prevent enemies from walking over pits.
        if (!isTilePassable || ((tileBehavior?.pit || tileBehavior?.isLava || tileBehavior?.isBrittleGround) && !canFall)) {
            blockedByTile = true;
        }
        // !canSwim is a hack to keep enemies/astralProjection out of low ceiling doorways.
        if (tileBehavior?.lowCeiling && (actor.z > 3 || !canSwim)) {
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
            if (tileBehavior.cloudGround) {
                quickJump = true;
            }
            blockedByTile = true;
            canJumpDown = canJumpDown && !!tileBehavior.edges[direction];
        } else if (!isTilePassable && tileBehavior?.jumpDirection !== direction) {
            canJumpDown = false;
        }
        for (const object of objects) {
            const objectBehaviors = object.behaviors || object.getBehaviors?.(state);
            blockedByObject = blockedByObject || objectBehaviors?.solid;
            if (canPush && objectBehaviors?.solid) {
                pushedObjects.push(object);
            }
        }
    }
    canJumpDown = canJumpDown && !blockedByObject;
    pushedObjects = uniq(pushedObjects);
    if (canPush && (blockedByTile || pushedObjects.length) && (!actor.action || actor.action === 'walking' || actor.action === 'pushing')) {
        if (!canJumpDown && actor.action !== 'pushing') {
            actor.action = 'pushing';
            actor.animationTime = 0;
        }
        if (canJumpDown) {
            actor.jumpingTime = (actor.jumpingTime || 0) + FRAME_LENGTH;
            if (actor.jumpingTime >= 250 || (quickJump && actor.jumpingTime > 50)) {
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
            actor.lastTouchedObject = pushedObjects[0];
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
                    actor.lastTouchedObject = pushedObjects[0];
                }
            }
        }
    }
    if (blockedByTile || blockedByObject) {
        // If this is true, wiggle the character up to Npx to get around corners.
        // This makes it much smoother to try and get into pixel perfect gaps.
        if (!canWiggle || canJumpDown) {
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
    if (!hero.area) {
        return;
    }
    const tileSize = 16;
    const hitbox = hero.getHitbox(state)

    let leftColumn = Math.floor((hero.x + 4) / tileSize);
    let rightColumn = Math.floor((hero.x + hero.w - 5) / tileSize);
    let topRow = Math.floor((hero.y + 4) / tileSize);
    let bottomRow = Math.floor((hero.y + hero.h - 5) / tileSize);

    const behaviorGrid = hero.area.behaviorGrid;
    // We don't want a player to be able to walk in between pits without falling, so the character is forced to fall
    // any time all four corners are over pits.
    hero.wading = hero.z <= 0;
    hero.swimming = hero.action !== 'roll' && hero.z <= 0;
    hero.slipping = !!hero.equipedGear?.cloudBoots;
    let fallingTopLeft = false, fallingTopRight = false, fallingBottomLeft = false, fallingBottomRight = false;
    let startClimbing = false;
    hero.groundHeight = 0;
    // Apply floor effects from objects/effects.
    for (const entity of [...hero.area.objects, ...hero.area.effects]) {
        if (entity.getHitbox && entity.behaviors?.groundHeight > hero.groundHeight) {
            if (rectanglesOverlap(entity.getHitbox(state), hitbox)) {
                hero.groundHeight = entity.behaviors.groundHeight;
            }
        }
    }
    hero.canFloat = true;
    for (let row = topRow; row <= bottomRow; row++) {
        for (let column = leftColumn; column <= rightColumn; column++) {
            let behaviors = behaviorGrid[row]?.[column];
            let actualRow = row;
            let actualColumn = column;
            // During screen transitions, the row/column will be out of bounds for the current screen,
            // so we need to wrap them and work against the next screen.
            if (row < 0 || row >= 32 || column < 0 || column >= 32) {
                if (!state.nextAreaInstance) {
                    continue;
                }
                actualRow = (row + 32) % 32;
                actualColumn = (column + 32) % 32;
                behaviors = state.nextAreaInstance.behaviorGrid[actualRow]?.[actualColumn];
            }
            // Default behavior is open solid ground.
            if (!behaviors) {
                hero.swimming = false;
                hero.wading = false;
                continue;
            }
            if (behaviors.groundHeight > hero.groundHeight) {
                hero.groundHeight = behaviors.groundHeight;
            }
            if (behaviors?.isBrittleGround && hero.z <= 0 && hero.action !== 'roll') {
                for (const layer of hero.area.layers) {
                    const tile = layer.tiles[actualRow]?.[actualColumn];
                    if (tile?.behaviors?.isBrittleGround) {
                        destroyTile(state, hero.area, {x: actualColumn, y: actualRow, layerKey: layer.key});
                    }
                }
            }
            if (behaviors.climbable) {
                startClimbing = true;
            }
            if (behaviors.touchHit && hero.onHit) {
                if (!behaviors.touchHit.isGroundHit || hero.z <= 0) {
                    const { returnHit } = hero.onHit(state, behaviors.touchHit);

                    if (behaviors.cuttable && behaviors.cuttable <= returnHit?.damage) {
                        for (const layer of hero.area.layers) {
                            const tile = layer.tiles[actualRow]?.[actualColumn];
                            if (tile?.behaviors?.cuttable <= returnHit.damage) {
                                destroyTile(state, hero.area, { x: actualColumn, y: actualRow, layerKey: layer.key });
                            }
                        }
                    }
                }
            }
            if (!behaviors.water) {
                hero.swimming = false;
            }
            if (behaviors.slippery && !hero.equipedGear?.ironBoots) {
                hero.slipping = !hero.isAstralProjection && !hero.isInvisible;
            }
            // Clouds boots are not slippery when walking on clouds.
            if (behaviors.cloudGround && hero.equipedGear?.cloudBoots) {
                hero.slipping = false;
            }
            if (!behaviors.shallowWater && !behaviors.water) {
                hero.wading = false;
            }
            // Cloud boots allow you to stand on, but not float over liquids.
            if (behaviors.isLava || behaviors.cloudGround || behaviors.water || behaviors.shallowWater) {
                hero.canFloat = false;
            }
            if (behaviors.isLava && hero.z <= 0) {
                hero.onHit(state, { damage: 8, element: 'fire' });
            }
            // Lava is like a pit for the sake of cloud walking boots sinking over them, but it damages
            // like normal damaging ground rather than a pit. This was done because there were many instances
            // it was difficult to reset the player's position when transition screens over lava.
            if (behaviors.pit || (behaviors.cloudGround && !hero.equipedGear?.cloudBoots)) {
                const tileIsUp = row < bottomRow;
                const tileIsDown = row > topRow;
                const tileIsLeft = column < rightColumn;
                const tileIsRight = column > leftColumn;
                if (tileIsUp) {
                    if (tileIsLeft) {
                        fallingTopLeft = true;
                    } else if (tileIsRight) {
                        fallingTopRight = true;
                    } else {
                        fallingTopLeft = fallingTopRight = true;
                    }
                } else if (tileIsDown) {
                    if (tileIsLeft) {
                        fallingBottomLeft = true;
                    } else if (tileIsRight) {
                        fallingBottomRight = true;
                    } else {
                        fallingBottomLeft = fallingBottomRight = true;
                    }
                } else {
                    if (tileIsLeft) {
                        fallingTopLeft = fallingBottomLeft = true;
                    } else if (tileIsRight) {
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
    hero.isTouchingPit = fallingTopLeft || fallingTopRight || fallingBottomLeft || fallingBottomRight;
    hero.isOverPit = fallingTopLeft && fallingTopRight && fallingBottomLeft && fallingBottomRight;
    if (hero.isOverPit && !state.nextAreaSection && !state.nextAreaInstance) {
        if (hero.z <= 0 && hero.action !== 'roll') {
            let behaviors = behaviorGrid[Math.round(hero.y / tileSize)]?.[Math.round(hero.x / tileSize)];
            if (behaviors?.cloudGround && hero.equipedGear.cloudBoots) {
                // Do nothing.
            } else {
                hero.throwHeldObject(state);
                hero.action = 'falling';
                hero.x = Math.round(hero.x / tileSize) * tileSize;
                hero.y = Math.round(hero.y / tileSize) * tileSize;
                hero.animationTime = 0;
            }
        }
    } else if (hero.z <= 0 && hero.action !== 'roll') {
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
