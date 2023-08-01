import { canMoveDown } from 'app/movement/canMoveDown';
import { canMoveLeft } from 'app/movement/canMoveLeft';
import { canMoveRight } from 'app/movement/canMoveRight';
import { canMoveUp } from 'app/movement/canMoveUp';


export function moveUp(
    state: GameState,
    object: ObjectInstance | EffectInstance,
    movementProperties: MovementProperties,
    amount: number
): boolean {
    const hitbox = object.getMovementHitbox?.()  || object.getHitbox();
    // Moving within the same subpixel is always allowed.
    if ((hitbox.y | 0) === ((hitbox.y - amount) | 0)) {
        object.y -= amount;
        if (movementProperties.actor) {
            movementProperties.actor.ignoreLedges = true;
        }
        return true;
    }
    const result = canMoveUp(state, object.area, hitbox, movementProperties);
    if (result === true) {
        object.y -= amount;
        checkToStopPushing(state, object);
        return true;
    }
    if (!result.wiggle || !movementProperties.canWiggle) {
        checkToPushObject(state, object as Hero, result.pushedObjects, 'up', movementProperties);
        return false;
    }
    if (result.wiggle === 'right') {
        return moveRight(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
    }
    if (result.wiggle === 'left') {
        return moveLeft(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
    }
    return false;
}

export function moveLeft(
    state: GameState,
    object: ObjectInstance | EffectInstance,
    movementProperties: MovementProperties,
    amount: number
): boolean {
    const hitbox = object.getMovementHitbox?.()  || object.getHitbox();
    // Moving within the same subpixel is always allowed.
    if ((hitbox.x | 0) === ((hitbox.x - amount) | 0)) {
        object.x -= amount;
        if (movementProperties.actor) {
            movementProperties.actor.ignoreLedges = true;
        }
        return true;
    }
    const result = canMoveLeft(state, object.area, hitbox, movementProperties);
    if (result === true) {
        object.x -= amount;
        checkToStopPushing(state, object);
        return true;
    }
    if (!result.wiggle || !movementProperties.canWiggle) {
        checkToPushObject(state, object as Hero, result.pushedObjects, 'left', movementProperties);
        return false;
    }
    if (result.wiggle === 'down') {
        return moveDown(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
    }
    if (result.wiggle === 'up') {
        return moveUp(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
    }
    return false;
}

export function moveDown(
    state: GameState,
    object: ObjectInstance | EffectInstance,
    movementProperties: MovementProperties,
    amount: number
): boolean {
    const hitbox = object.getMovementHitbox?.()  || object.getHitbox();
    // Moving within the same subpixel is always allowed.
    if ((hitbox.y | 0) === ((hitbox.y + amount) | 0)) {
        object.y += amount;
        if (movementProperties.actor) {
            movementProperties.actor.ignoreLedges = true;
        }
        return true;
    }
    const result = canMoveDown(state, object.area, hitbox, movementProperties);
    if (result === true) {
        object.y += amount;
        checkToStopPushing(state, object);
        return true;
    }
    if (!result.wiggle || !movementProperties.canWiggle) {
        checkToPushObject(state, object as Hero, result.pushedObjects, 'down', movementProperties);
        return false;
    }
    if (result.wiggle === 'right') {
        return moveRight(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
    }
    if (result.wiggle === 'left') {
        return moveLeft(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
    }
    return false;
}

export function moveRight(
    state: GameState,
    object: ObjectInstance | EffectInstance,
    movementProperties: MovementProperties,
    amount: number
): boolean {
    const hitbox = object.getMovementHitbox?.()  || object.getHitbox();
    // Moving within the same subpixel is always allowed.
    if ((hitbox.x | 0) === ((hitbox.x + amount) | 0)) {
        object.x += amount;
        if (movementProperties.actor) {
            movementProperties.actor.ignoreLedges = true;
        }
        return true;
    }
    const result = canMoveRight(state, object.area, hitbox, movementProperties);
    if (result === true) {
        object.x += amount;
        checkToStopPushing(state, object);
        return true;
    }
    if (!result.wiggle || !movementProperties.canWiggle) {
        checkToPushObject(state, object as Hero, result.pushedObjects, 'right', movementProperties);
        return false;
    }
    if (result.wiggle === 'down') {
        return moveDown(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
    }
    if (result.wiggle === 'up') {
        return moveUp(state, object, {
            ...movementProperties,
            canWiggle: false,
        }, amount);
    }
    return false;
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
) {
    if (!movementProperties.canPush) {
        return;
    }
    if (!actorObject.action || actorObject.action === 'walking') {
        actorObject.action = 'pushing';
        actorObject.animationTime = 0;
    }
    if (!pushedObjects || actorObject.action !== 'pushing') {
        return;
    }
    if (pushedObjects.length === 1) {
        if (pushedObjects[0].onPush) {
            pushedObjects[0].onPush(state, direction);
            actorObject.lastTouchedObject = pushedObjects[0];
        }
    } else if (pushedObjects.length >= 1) {
        const actorHitbox = actorObject.getMovementHitbox?.()  || actorObject.getHitbox();
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
                }
            }
        }
    }
}
