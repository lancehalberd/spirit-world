import { getJumpVector } from 'app/movement/getJumpVector';
import { moveDown, moveLeft, moveRight, moveUp } from 'app/movement/move';
import { directionMap, getDirection } from 'app/utils/direction';
import { getAreaSize } from 'app/utils/getAreaSize';
import { pad } from 'app/utils/index';

export function moveActor(state: GameState, actor: Actor, dx: number, dy: number, movementProperties: MovementProperties): {mx: number, my: number} {
    let sx = dx;
    if (sx < -1){
        sx = -1;
    } else if(sx > 1) {
        sx = 1;
    }
    let sy = dy;
    if (sy < -1){
        sy = -1;
    } else if(sy > 1) {
        sy = 1;
    }
    let mx = 0, my = 0;
    let s = 0;
    const fullDirection = getDirection(dx, dy, true);
    while (s < 100) {
        let movedX = false, movedY = false;
        if (sx) {
            // You can't push when moving diagonally.
            const d = (sx < 0) ? 'left' : 'right';
            movedX = moveActorInDirection(state, actor, sx, d, {
                ...movementProperties,
                canPush: movementProperties.canPush && d === fullDirection,
                canWiggle: (movementProperties.canWiggle ?? true) && !dy,
                excludedObjects: movementProperties.excludedObjects || new Set()
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
            const d = (sy < 0) ? 'up' : 'down';
            movedY = moveActorInDirection(state, actor, sy, d, {
                ...movementProperties,
                canPush: movementProperties.canPush && d === fullDirection,
                canWiggle: (movementProperties.canWiggle ?? true) && !dx,
                excludedObjects: movementProperties.excludedObjects || new Set()
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
    if (actor.action === 'jumpingDown') {
        return false;
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

    // If this movement would move outside of the bounding rectangle, do not allow
    // it if it moves them further outside the rectangle, but do allow it otherwise.
    if (movementProperties.boundingBox) {
        const hitbox = {...actor.getHitbox()};
        const v = directionMap[direction];
        hitbox.x += v[0] * amount;
        hitbox.y += v[1] * amount;
        const { boundingBox } = movementProperties;
        if ((hitbox.x < boundingBox.x && direction === 'left')
            || (hitbox.x + hitbox.w > boundingBox.x + boundingBox.w && direction === 'right')
            || (hitbox.y < boundingBox.y && direction === 'up')
            || (hitbox.y + hitbox.h > boundingBox.y + boundingBox.h && direction === 'down')
        ) {
            return false;
        }
    }
    actor.ignoreLedges = false;
    let result = false;
    if (direction === 'up') {
        result = moveUp(state, actor, movementProperties, -amount);
    }
    if (direction === 'left') {
        result = moveLeft(state, actor, movementProperties, -amount);
    }
    if (direction === 'down') {
        result = moveDown(state, actor, movementProperties, amount);
    }
    if (direction === 'right') {
        result = moveRight(state, actor, movementProperties, amount);
    }
    if (!actor.ignoreLedges) {
        const jv = getJumpVector(state, actor.area, actor.getHitbox());
        if (jv[0] !== 0 || jv[1] !== 0) {
            if (actor.action === 'thrown' || actor.action === 'knocked' || actor.action === 'knockedHard') {
                actor.action = 'jumpingDown';
                actor.jumpingVx = actor.vx;
                actor.jumpingVy = actor.vy;
                actor.jumpingVz = actor.vz;
            } else {
                let speed = 2;
                if ((actor as Hero).equippedBoots === 'cloudBoots') {
                    speed = 2.2;
                } else if ((actor as Hero).equippedBoots === 'ironBoots') {
                    speed = 1.5;
                }
                actor.action = 'jumpingDown';
                actor.jumpingVx = speed * jv[0];
                actor.jumpingVy = speed * jv[1];
                actor.jumpingVz = 3;
                actor.animationTime = 0;
            }
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
