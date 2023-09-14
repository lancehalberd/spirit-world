import { moveDown, moveLeft, moveRight, moveUp } from 'app/movement/move';
import { directionMap, getDirection } from 'app/utils/field';


// This file contains a couple of functions copied from `moveActor` that have been simplified for use with objects.
export function moveObject(state: GameState, object: ObjectInstance | EffectInstance, dx: number, dy: number, movementProperties: MovementProperties): {mx: number, my: number} {
    let sx = dx;
    let sy = dy;
    let mx = 0, my = 0;
    let s = 0;
    const fullDirection = getDirection(dx, dy, true);
    while (s < 100) {
        let moved = false;
        if (sx) {
            // You can't push when moving diagonally.
            const d = (sx < 0) ? 'left' : 'right';
            const amount = (sx < -1) ? -1 : (sx > 1 ? 1 : sx);
            const result = moveObjectInDirection(state, object, amount, d, {
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
            const d = (sy < 0) ? 'up' : 'down';
            const amount = (sy < -1) ? -1 : (sy > 1 ? 1 : sy);
            const result = moveObjectInDirection(state, object, amount, d, {
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

function moveObjectInDirection(
    state: GameState,
    object: ObjectInstance | EffectInstance,
    amount: number,
    direction: Direction,
    movementProperties: MovementProperties
): {mx: number, my: number} {
    const excludedObjects = new Set<any>([...movementProperties.excludedObjects, object]);
    const canWiggle = movementProperties.canWiggle ?? true;
    movementProperties = {
        ...movementProperties,
        canWiggle,
        excludedObjects,
    };

    // If this movement would move outside of the bounding rectangle, do not allow
    // it if it moves them further outside the rectangle, but do allow it otherwise.
    if (movementProperties.boundingBox) {
        const hitbox = {...object.getHitbox()};
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
    if (direction === 'up') {
        return moveUp(state, object, movementProperties, -amount);
    }
    if (direction === 'left') {
        return moveLeft(state, object, movementProperties, -amount);
    }
    if (direction === 'down' ) {
        return moveDown(state, object, movementProperties, amount);
    }
    if (direction === 'right') {
        return moveRight(state, object, movementProperties, amount);
    }
    return {mx: 0, my: 0};
}
