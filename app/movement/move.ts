import { canMoveDown } from 'app/movement/canMoveDown';
import { canMoveLeft } from 'app/movement/canMoveLeft';
import { canMoveRight } from 'app/movement/canMoveRight';
import { canMoveUp } from 'app/movement/canMoveUp';


export function moveUp(
    state: GameState,
    object: ObjectInstance | EffectInstance,
    movementProperties: MovementProperties,
    amount: number
): {mx: number, my: number} {
    // Moving within the same subpixel is always allowed.
    if ((object.y | 0) === ((object.y - amount) | 0)) {
        object.y -= amount;
        if (movementProperties.actor) {
            movementProperties.actor.ignoreLedges = true;
        }
        return {mx: 0, my: -amount};
    }
    const hitbox = object.getMovementHitbox?.()  || object.getHitbox();
    const result = canMoveUp(state, object.area, hitbox, movementProperties);
    if (result === true) {
        object.y -= amount;
        checkToStopPushing(state, object);
        return {mx: 0, my: -amount};
    }
    if (!result.wiggle || !movementProperties.canWiggle) {
        checkToPushObject(state, object as Hero, result.pushedObjects, 'up', movementProperties);
        return {mx: 0, my: 0};
    }
    if (result.wiggle === 'right') {
        const wiggleResult = moveRight(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
        if (wiggleResult.my || wiggleResult.mx) {
            return wiggleResult;
        }
        checkToPushObject(state, object as Hero, result.pushedObjects, 'up', movementProperties);
    }
    if (result.wiggle === 'left') {
        const wiggleResult = moveLeft(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
        if (wiggleResult.my || wiggleResult.mx) {
            return wiggleResult;
        }
        checkToPushObject(state, object as Hero, result.pushedObjects, 'up', movementProperties);
    }
    return {mx: 0, my: 0};
}

export function moveLeft(
    state: GameState,
    object: ObjectInstance | EffectInstance,
    movementProperties: MovementProperties,
    amount: number
): {mx: number, my: number} {
    // Moving within the same subpixel is always allowed.
    if ((object.x | 0) === ((object.x - amount) | 0)) {
        object.x -= amount;
        if (movementProperties.actor) {
            movementProperties.actor.ignoreLedges = true;
        }
        return {mx: -amount, my: 0};
    }
    const hitbox = object.getMovementHitbox?.()  || object.getHitbox();
    const result = canMoveLeft(state, object.area, hitbox, movementProperties);
    if (result === true) {
        object.x -= amount;
        checkToStopPushing(state, object);
        return {mx: -amount, my: 0};
    }
    if (!result.wiggle || !movementProperties.canWiggle) {
        checkToPushObject(state, object as Hero, result.pushedObjects, 'left', movementProperties);
        return {mx: 0, my: 0};
    }
    if (result.wiggle === 'down') {
        const wiggleResult = moveDown(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
        if (wiggleResult.my || wiggleResult.mx) {
            return wiggleResult;
        }
        checkToPushObject(state, object as Hero, result.pushedObjects, 'left', movementProperties);
    }
    if (result.wiggle === 'up') {
        const wiggleResult = moveUp(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
        if (wiggleResult.my || wiggleResult.mx) {
            return wiggleResult;
        }
        checkToPushObject(state, object as Hero, result.pushedObjects, 'left', movementProperties);
    }
    return {mx: 0, my: 0};
}

export function moveDown(
    state: GameState,
    object: ObjectInstance | EffectInstance,
    movementProperties: MovementProperties,
    amount: number
): {mx: number, my: number} {
    // Moving within the same subpixel is always allowed.
    if ((object.y | 0) === ((object.y + amount) | 0)) {
        object.y += amount;
        if (movementProperties.actor) {
            movementProperties.actor.ignoreLedges = true;
        }
        return {mx: 0, my: amount};
    }
    const hitbox = object.getMovementHitbox?.()  || object.getHitbox();
    const result = canMoveDown(state, object.area, hitbox, movementProperties);
    if (result === true) {
        object.y += amount;
        checkToStopPushing(state, object);
        return {mx: 0, my: amount};
    }
    if (!result.wiggle || !movementProperties.canWiggle) {
        checkToPushObject(state, object as Hero, result.pushedObjects, 'down', movementProperties);
        return {mx: 0, my: 0};
    }
    if (result.wiggle === 'right') {
        const wiggleResult = moveRight(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
        if (wiggleResult.my || wiggleResult.mx) {
            return wiggleResult;
        }
        checkToPushObject(state, object as Hero, result.pushedObjects, 'down', movementProperties);
    }
    if (result.wiggle === 'left') {
        const wiggleResult = moveLeft(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
        if (wiggleResult.my || wiggleResult.mx) {
            return wiggleResult;
        }
        checkToPushObject(state, object as Hero, result.pushedObjects, 'down', movementProperties);
    }
    return {mx: 0, my: 0};
}

export function moveRight(
    state: GameState,
    object: ObjectInstance | EffectInstance,
    movementProperties: MovementProperties,
    amount: number
): {mx: number, my: number} {
    // Moving within the same subpixel is always allowed.
    if ((object.x | 0) === ((object.x + amount) | 0)) {
        object.x += amount;
        if (movementProperties.actor) {
            movementProperties.actor.ignoreLedges = true;
        }
        return {mx: amount, my: 0};
    }
    const hitbox = object.getMovementHitbox?.() || object.getHitbox();
    const result = canMoveRight(state, object.area, hitbox, movementProperties);
    if (result === true) {
        object.x += amount;
        checkToStopPushing(state, object);
        return {mx: amount, my: 0};
    }
    if (!result.wiggle || !movementProperties.canWiggle) {
        checkToPushObject(state, object as Hero, result.pushedObjects, 'right', movementProperties);
        return {mx: 0, my: 0};
    }
    if (result.wiggle === 'down') {
        const wiggleResult = moveDown(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
        if (wiggleResult.my || wiggleResult.mx) {
            return wiggleResult;
        }
        checkToPushObject(state, object as Hero, result.pushedObjects, 'right', movementProperties);
    }
    if (result.wiggle === 'up') {
        const wiggleResult = moveUp(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
        if (wiggleResult.my || wiggleResult.mx) {
            return wiggleResult;
        }
        checkToPushObject(state, object as Hero, result.pushedObjects, 'right', movementProperties);
    }
    return {mx: 0, my: 0};
}

function checkToStopPushing(
    state: GameState,
    actorObject: ObjectInstance | EffectInstance,
) {
    if ((actorObject as Hero).action === 'pushing') {
        (actorObject as Hero).action = 'walking';
    }
}

function checkToPushObject(
    state: GameState,
    actorObject: Hero,
    pushedObjects: (ObjectInstance | EffectInstance)[],
    direction: Direction,
    movementProperties: MovementProperties
): boolean {
    if (!movementProperties.canPush) {
        return false;
    }
    if (!actorObject.action || actorObject.action === 'walking') {
        actorObject.action = 'pushing';
        // actorObject.animationTime = 0;
    }
    if (!pushedObjects || actorObject.action !== 'pushing') {
        return false;
    }
    if (pushedObjects.length === 1) {
        if (pushedObjects[0].onPush) {
            pushedObjects[0].onPush(state, direction);
            actorObject.lastTouchedObject = pushedObjects[0];
            return true;
        }
    } else if (pushedObjects.length >= 1) {
        const actorHitbox = actorObject.getMovementHitbox?.() || actorObject.getHitbox();
        for (const object of pushedObjects) {
            const hitbox = object.getHitbox(state);
            if (Math.abs(actorHitbox.x - hitbox.x) < 8
                || Math.abs(actorHitbox.x + actorHitbox.w - hitbox.x - hitbox.w) < 8
                || Math.abs(actorHitbox.y - hitbox.y) < 8
                || Math.abs(actorHitbox.y + actorHitbox.h - hitbox.y - hitbox.h) < 8
            ) {
                if (object.onPush) {
                    object.onPush(state, direction);
                    actorObject.lastTouchedObject = pushedObjects[0];
                    return true;
                }
            }
        }
    }
    return false;
}
