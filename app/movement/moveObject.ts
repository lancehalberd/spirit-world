import { moveDown, moveLeft, moveRight, moveUp } from 'app/movement/move';
import { directionMap, getDirection } from 'app/utils/field';

import { Direction, GameState, MovementProperties, ObjectInstance, EffectInstance } from 'app/types';

// This file contains a couple of functions copied from `moveActor` that have been simplified for use with objects.
export function moveObject(state: GameState, object: ObjectInstance | EffectInstance, dx: number, dy: number, movementProperties: MovementProperties): {mx: number, my: number} {
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
            movedX = moveObjectInDirection(state, object, sx, d, {
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
            movedY = moveObjectInDirection(state, object, sy, d, {
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

function moveObjectInDirection(
    state: GameState,
    object: ObjectInstance | EffectInstance,
    amount: number,
    direction: Direction,
    movementProperties: MovementProperties
): boolean {
    const excludedObjects = new Set<any>([...movementProperties.excludedObjects, object]);
    const canWiggle = movementProperties.canWiggle ?? true;
    movementProperties = {
        ...movementProperties,
        canWiggle,
        excludedObjects,
    }

    // If this movement would move outside of the bounding rectangle, do not allow
    // it if it moves them further outside the rectangle, but do allow it otherwise.
    if (movementProperties.boundingBox) {
        const hitbox = object.getHitbox();
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
    let result = false;
    if (direction === 'up') {
        result = moveUp(state, object, movementProperties, -amount);
    }
    if (direction === 'left') {
        result = moveLeft(state, object, movementProperties, -amount);
    }
    if (direction === 'down') {
        result = moveDown(state, object, movementProperties, amount);
    }
    if (direction === 'right') {
        result = moveRight(state, object, movementProperties, amount);
    }
    return result;
}