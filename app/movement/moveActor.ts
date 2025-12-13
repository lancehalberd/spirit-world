import { getJumpVector } from 'app/movement/getJumpVector';
import { moveDown, moveLeft, moveRight, moveUp } from 'app/movement/move';
import { playAreaSound } from 'app/musicController';
import { directionMap, getCardinalDirection, getDirection } from 'app/utils/direction';
import { getAreaSize } from 'app/utils/getAreaSize';
import { pad } from 'app/utils/index';
import { canMoveDown } from 'app/movement/canMoveDown';
import { canMoveLeft } from 'app/movement/canMoveLeft';
import { canMoveRight } from 'app/movement/canMoveRight';
import { canMoveUp } from 'app/movement/canMoveUp';

export function canActorMove(state: GameState, actor: Actor, movementProperties: MovementProperties = {}): boolean {
    const movementPropertiesWithDefaults = {
        canFall: true,
        canSwim: true,
        canMoveInLava: true,
        ...movementProperties,
    };
    const hitbox = actor.getMovementHitbox?.()  || actor.getHitbox();
    return canMoveUp(state, actor.area, hitbox, movementPropertiesWithDefaults) === true
        || canMoveDown(state, actor.area, hitbox, movementPropertiesWithDefaults) === true
        || canMoveLeft(state, actor.area, hitbox, movementPropertiesWithDefaults) === true
        || canMoveRight(state, actor.area, hitbox, movementPropertiesWithDefaults) === true;
}

export function moveActor(state: GameState, actor: Actor, dx: number, dy: number, movementProperties: MovementProperties = {}): {mx: number, my: number} {
    if (!actor.area) {
        return {mx: 0, my: 0};
    }
    let sx = dx;
    let sy = dy;
    let mx = 0, my = 0;
    let s = 0;
    const fullDirection = getDirection(dx, dy, true);
    while (s < 100) {
        let moved = false;
        if (sx) {
            // You can't push when moving diagonally.
            // To support this we would need to:
            // 1. Set the direction to match which way they are pushing.
            // 2. Make sure the push is smooth
            // 3. Make sure the push animation is continuous.
            // Even solving all problems, the player will slide against the pushed objects which isn't great.
            // A better solution is probably to allow pushing diagonally if the player can only move in one direction anyway,
            // but this is tricky because we don't have the information to determine this when we are moving in a single dimension.
            const d = (sx < 0) ? 'left' : 'right';
            // Move at most one pixel at a time.
            const amount = (sx < -1) ? -1 : (sx > 1 ? 1 : sx);
            const result = moveActorInDirection(state, actor, amount, d, {
                // By default actors can move over hazards.
                canFall: true,
                canSwim: true,
                canMoveInLava: true,
                actor,
                dx, dy,
                ...movementProperties,
                canPush: movementProperties.canPush && d === fullDirection,
                canWiggle: (movementProperties.canWiggle ?? true) && !dy,
                excludedObjects: movementProperties.excludedObjects || new Set()
            });
            if (result.mx || result.my) {
                moved = true;
                mx += result.mx;
                my += result.my;
                if (sx <= -1) {
                    sx++;
                } else if(sx >= 1) {
                    sx--;
                } else {
                    sx = 0;
                }
            }
        }
        if (sy) {
            // You can't push when moving diagonally.
            // See above for details.
            const d = (sy < 0) ? 'up' : 'down';
            // Move at most one pixel at a time.
            const amount = (sy < -1) ? -1 : (sy > 1 ? 1 : sy);
            const result = moveActorInDirection(state, actor, amount, d, {
                // By default actors can move over hazards.
                canFall: true,
                canSwim: true,
                canMoveInLava: true,
                actor,
                dx, dy,
                ...movementProperties,
                canPush: movementProperties.canPush && d === fullDirection,
                canWiggle: (movementProperties.canWiggle ?? true) && !dx,
                excludedObjects: movementProperties.excludedObjects || new Set()
            });
            if (result.mx || result.my) {
                moved = true;
                mx += result.mx;
                my += result.my;
                if (sy <= -1) {
                    sy++;
                } else if(sy >= 1) {
                    sy--;
                } else {
                    sy = 0;
                }
            }
        }
        if (!moved) {
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
): {mx: number, my: number} {
    if (actor.action === 'jumpingDown') {
        return {mx: 0, my: 0};
    }
    const excludedObjects = new Set<any>([...movementProperties.excludedObjects, actor]);
    if (actor.pickUpObject) {
        excludedObjects.add(actor.pickUpObject);
    }
    const canWiggle = movementProperties.canWiggle ?? true;
    movementProperties = {
        actor,
        ...movementProperties,
        canWiggle,
        excludedObjects,
    };
    // Movement left or right either does not allow you to change your climbing status.
    // So if you are already climbing, you must move to climbable tiles, and if you are not
    // climbing, you cannot move to climbable tiles.
    if (actor.action === 'climbing') {
        if (direction === 'left' || direction === 'right') {
            movementProperties.mustClimb = true;
        }
    } else {
        if (direction === 'left' || direction === 'right') {
            movementProperties.canClimb = false;
        }
    }

    // If this movement would move outside of the bounding rectangle, do not allow
    // it if it moves them further outside the rectangle, but do allow it otherwise.
    if (movementProperties.boundingBox) {
        const hitbox = {...(actor.getMovementHitbox?.() || actor.getHitbox())};
        const v = directionMap[direction];
        hitbox.x += v[0] * amount;
        hitbox.y += v[1] * amount;
        const { boundingBox } = movementProperties;
        if ((hitbox.x < boundingBox.x && direction === 'left')
            || (hitbox.x + hitbox.w > boundingBox.x + boundingBox.w && direction === 'right')
            || (hitbox.y < boundingBox.y && direction === 'up')
            || (hitbox.y + hitbox.h > boundingBox.y + boundingBox.h && direction === 'down')
        ) {
            return {mx: 0, my: 0};
        }
    }
    actor.ignoreLedges = false;
    let result = {mx: 0, my: 0};
    if (direction === 'up') {
        // Movement up/down requires being fully aligned with climbable or non climbable tiles,
        // so when climbing is allowed we first try moving without climbing, and if that fails,
        // we then try moving with required climbing.
        let canClimb = movementProperties.canClimb;
        movementProperties.canClimb = false;
        result = moveUp(state, actor, movementProperties, -amount);
        if (canClimb && !result.mx && !result.my) {
            movementProperties.mustClimb = true;
            result = moveUp(state, actor, movementProperties, -amount);
        }
    }
    if (direction === 'left') {
        result = moveLeft(state, actor, movementProperties, -amount);
    }
    if (direction === 'down' ) {
        // Movement up/down requires being fully aligned with climbable or non climbable tiles,
        // so when climbing is allowed we first try moving without climbing, and if that fails,
        // we then try moving with required climbing.
        let canClimb = movementProperties.canClimb;
        movementProperties.canClimb = false;
        result = moveDown(state, actor, movementProperties, amount);
        if (canClimb && !result.mx && !result.my) {
            movementProperties.mustClimb = true;
            result = moveDown(state, actor, movementProperties, amount);
        }
    }
    if (direction === 'right') {
        result = moveRight(state, actor, movementProperties, amount);
    }
    if (actor.canJumpOffLedges && !actor.ignoreLedges && actor.action !== 'climbing') {
        const jv = getJumpVector(state, actor.area, actor.getHitbox());
        if (jv[0] !== 0 || jv[1] !== 0) {
            if (actor.pickUpObject || actor.pickUpTile) {
                (actor as Hero).throwHeldObject?.(state);
            }
            playAreaSound(state, state.areaInstance, 'fall');
            actor.jumpingTime = 0;
            if (actor.action === 'thrown' || actor.action === 'knocked' || actor.action === 'knockedHard') {
                actor.action = 'jumpingDown';
                actor.jumpingVx = actor.vx;
                actor.jumpingVy = actor.vy;
                actor.jumpingVz = actor.vz;
                // The jump trajectory will not be modified to try to avoid landing on obstacles.
                actor.isJumpingWrecklessly = true;
            } else {
                let speed = 2;
                /*if ((actor as Hero).savedData.equippedBoots === 'cloudBoots') {
                    speed = 2.2;
                } else if ((actor as Hero).savedData.equippedBoots === 'ironBoots') {
                    speed = 1.5;
                }*/
                actor.action = 'jumpingDown';
                actor.jumpingVx = speed * jv[0];
                actor.jumpingVy = speed * jv[1];
                actor.jumpingVz = 3;
                actor.animationTime = 0;
                actor.isJumpingWrecklessly = false;
            }
            // Actor shouldn't be touching the ground when they start jumping down.
            actor.z = Math.max(actor.z, 1);
            actor.isAirborn = true;
            actor.canTrampoline = true;
            actor.grabObject = null;
        }
    }
    return result;
}

export function getSectionBoundingBox(state: GameState, object: ObjectInstance, padding = 0): Rect {
    const { section } = getAreaSize(state);
    if (padding) {
        return pad(section, -padding);
    }
    return section;
}

export function getEnemyBoundingBox(state: GameState, object: ObjectInstance, w: number, h: number = w): Rect {
    const hitbox = object.getHitbox();
    return {
        x: object.definition.x + hitbox.w / 2 - w / 2,
        y: object.definition.y + hitbox.h / 2 - h / 2,
        w,
        h,
    };
}

export function intersectRectangles({x, y, w, h}: Rect, {x: X, y: Y, w: W, h: H}: Rect): Rect {
    const l = Math.max(x, X), t = Math.max(y, Y), r = Math.min(x + w, X + W), b = Math.min(y + h, Y + H);
    return {x: l, y: t, w: r - l, h: b - t};
}

export function getMovementAnchor(actor: Actor): Point {
    const hitbox = actor.getMovementHitbox?.() ?? actor.getHitbox();
    return {
         x: hitbox.x + hitbox.w / 2,
         y: hitbox.y + hitbox.h / 2,
    }
}

// Move an actor's so that the middle of their hitboxes moves towards a target location at a given speed per frame
// and then returns the distance remaining.
export function moveActorTowardsLocation(
    state: GameState,
    actor: Actor,
    {x, y}: Point,
    speed = 1,
    movementProperties: MovementProperties = {}
): number {
    const anchor = getMovementAnchor(actor);
    const dx = x - anchor.x, dy = y - anchor.y;
    actor.d = getCardinalDirection(dx, dy, actor.d);
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > speed) {
        moveActor(state, actor, speed * dx / mag, speed * dy / mag, {boundingBox: false, ...movementProperties});
        return mag - speed;
    }
    moveActor(state, actor, dx, dy, {boundingBox: false, ...movementProperties});
    return 0;
}

export function getDistanceToPoint(state: GameState, actor: Actor, {x, y}: Point) {
    const anchor = getMovementAnchor(actor);
    const dx = x - anchor.x, dy = y - anchor.y;
    return Math.sqrt(dx * dx + dy * dy);
}
