import { FieldAnimationEffect, enemyFallAnimation, splashAnimation } from 'app/content/effects/animationEffect';
import { addEffectToArea } from 'app/utils/effects';
import { directionMap, getDirection, getTileBehaviorsAndObstacles } from 'app/utils/field';
import { getAreaSize } from 'app/utils/getAreaSize';
import { sample } from 'app/utils/index';
import { getLineOfSightTargetAndDirection, getVectorToNearbyTarget } from 'app/utils/target';
import { getSectionBoundingBox, moveActor } from 'app/moveActor';



export function moveEnemyToTargetLocation(
    state: GameState,
    enemy: Enemy, tx: number, ty: number,
    animationStyle?: string,
    movementProperties?: MovementProperties
): number {
    movementProperties = movementProperties ?? {};
    const hitbox = enemy.getHitbox(state);
    const dx = tx - (hitbox.x + hitbox.w / 2), dy = ty - (hitbox.y + hitbox.h / 2);
    if (animationStyle) {
        enemy.d = getDirection(dx, dy);
        enemy.changeToAnimation(animationStyle)
    }
    //enemy.currentAnimation = enemy.enemyDefinition.animations.idle[enemy.d];
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > enemy.speed) {
        moveEnemy(state, enemy, enemy.speed * dx / mag, enemy.speed * dy / mag, {
            ...movementProperties,
            boundingBox: false,
        });
        return mag - enemy.speed;
    }
    moveEnemy(state, enemy, dx, dy, {...movementProperties, boundingBox: false});
    return 0;
}

// The enemy choose a vector and accelerates in that direction for a bit.
// The enemy slides a bit since it doesn't immediately move in the desired direction.
const maxScurryTime = 4000;
const minScurryTime = 1000;
export function scurryRandomly(state: GameState, enemy: Enemy) {
    if (enemy.mode === 'choose' && enemy.modeTime > 200) {
        enemy.params.theta = 2 * Math.PI * Math.random();
        enemy.setMode('scurry');
        enemy.changeToAnimation('idle')
    }
    let tvx = 0, tvy = 0;
    if (enemy.mode === 'scurry') {
        tvx = enemy.speed * Math.cos(enemy.params.theta);
        tvy = enemy.speed * Math.sin(enemy.params.theta);
        if (enemy.modeTime > minScurryTime &&
            Math.random() < (enemy.modeTime - minScurryTime) / (maxScurryTime - minScurryTime)
        ) {
            enemy.setMode('choose');
        }
    }
    const ax = tvx - enemy.vx;
    const ay = tvy - enemy.vy;
    accelerateInDirection(state, enemy, {x: ax, y: ay});
    moveEnemy(state, enemy, enemy.vx, enemy.vy, {});
}

export function accelerateInDirection(state: GameState, enemy: Enemy, a: {x: number, y: number}): void {
    let mag = Math.sqrt(a.x * a.x + a.y * a.y);
    if (mag) {
        enemy.vx = enemy.vx + enemy.acceleration * a.x / mag;
        enemy.vy = enemy.vy + enemy.acceleration * a.y / mag;
        mag = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
        if (mag > enemy.speed) {
            enemy.vx = enemy.speed * enemy.vx / mag;
            enemy.vy = enemy.speed * enemy.vy / mag;
        }
    }
}

export function scurryAndChase(state: GameState, enemy: Enemy) {
    const chaseVector = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    if (chaseVector) {
        accelerateInDirection(state, enemy, chaseVector);
        moveEnemy(state, enemy, enemy.vx, enemy.vy, {});
    } else {
        scurryRandomly(state, enemy);
    }
}

export function paceAndCharge(state: GameState, enemy: Enemy) {
    if (enemy.mode === 'knocked') {
        enemy.animationTime = 0;
        enemy.z += enemy.vz;
        enemy.vz -= 0.5;
        moveEnemy(state, enemy, enemy.vx, enemy.vy, {canFall: true});
        if (enemy.z < 0) {
            enemy.z = 0;
        }
    } else if (enemy.mode === 'stunned') {
        enemy.animationTime = 0;
        if (enemy.modeTime > 1000) {
            enemy.setMode('choose');
            enemy.setAnimation('idle', enemy.d);
        }
    } else if (enemy.mode !== 'charge') {
        const {d, hero} = getLineOfSightTargetAndDirection(state, enemy, undefined, false, enemy.aggroRadius);
        if (hero) {
            enemy.d = d;
            enemy.setMode('charge');
            enemy.canBeKnockedBack = false;
            enemy.setAnimation('attack', enemy.d);
        } else {
            paceRandomly(state, enemy);
        }
    } else if (enemy.mode === 'charge') {
        if (enemy.modeTime < 400) {
            enemy.animationTime = 0;
            return;
        }
        if (!moveEnemyFull(state, enemy, 3 * enemy.speed * directionMap[enemy.d][0], 3 * enemy.speed * directionMap[enemy.d][1], {canFall: true, canSwim: true, canWiggle: false})) {
            enemy.setMode('stunned');
            enemy.canBeKnockedBack = true;
            enemy.knockBack(state, {
                vx: -enemy.speed * directionMap[enemy.d][0],
                vy: -enemy.speed * directionMap[enemy.d][1],
                vz: 4,
            });
        }
    }
}

// The enemy pauses to choose a random direction, then moves in that direction for a bit and repeats.
// If the enemy encounters an obstacle, it will change directions more quickly.
export function paceRandomly(state: GameState, enemy: Enemy, pauseDuration = 400) {
    if (enemy.mode !== 'walk' && enemy.modeTime > pauseDuration / 2) {
        enemy.setMode('walk');
        enemy.d = sample(['up', 'down', 'left', 'right']);
        enemy.currentAnimation = enemy.enemyDefinition.animations.idle[enemy.d];
    }
    if (enemy.mode === 'walk') {
        if (enemy.modeTime >= pauseDuration / 2) {
            if (!moveEnemy(state, enemy, enemy.speed * directionMap[enemy.d][0], enemy.speed * directionMap[enemy.d][1], {})) {
                enemy.setMode('choose');
                enemy.modeTime = 200;
            }
        }
        if (enemy.modeTime > 700 && Math.random() < (enemy.modeTime - 700) / 3000) {
            enemy.setMode('choose');
        }
    }
}

export function checkForFloorEffects(state: GameState, enemy: Enemy) {
    // If the enemy is removed from the area during custom update logic, this check no longer applies.
    if (!enemy.area) {
        return;
    }
    //const behaviorGrid = enemy.area.behaviorGrid;
    //const tileSize = 16;

    const hitbox = enemy.getHitbox(state);
    /*let leftColumn = Math.floor((hitbox.x + 6) / tileSize);
    let rightColumn = Math.floor((hitbox.x + hitbox.w - 7) / tileSize);
    let topRow = Math.floor((hitbox.y + 6) / tileSize);
    let bottomRow = Math.floor((hitbox.y + hitbox.h - 7) / tileSize);*/

    const checkForPits = enemy.z <= 0
        && !enemy.flying
        // Bosses don't fall in pits.
        && enemy.definition?.type !== 'boss'
        // Specific enemies can be set to ignore pits.
        && !enemy.enemyDefinition.ignorePits;

    /*for (let row = topRow; row <= bottomRow; row++) {
        for (let column = leftColumn; column <= rightColumn; column++) {
            const behaviors = behaviorGrid?.[row]?.[column];
            // This will happen when the player moves off the edge of the screen.
            if (!behaviors) {
                continue;
            }
            if (behaviors.pit && checkForPits) {
                makeEnemyFallIntoPit(state, enemy);
                return;
            }
        }
    }*/

    if (checkForPits) {
        const x = hitbox.x + hitbox.w / 2;
        const y = hitbox.y + hitbox.h / 2;
        const { tileBehavior } = getTileBehaviorsAndObstacles(state, enemy.area, {x, y});
        if (tileBehavior?.pit) {
            makeEnemyFallIntoPit(state, enemy);
        } else if (tileBehavior?.water) {
            makeEnemyFallIntoWater(state, enemy);
        }
    }
}

function makeEnemyFallIntoPit(state: GameState, enemy: Enemy) {
    const hitbox = enemy.getHitbox(state);
    const pitAnimation = new FieldAnimationEffect({
        animation: enemyFallAnimation,
        x: Math.floor(hitbox.x / 16) * 16, y: Math.floor(hitbox.y / 16) * 16,
    });
    addEffectToArea(state, enemy.area, pitAnimation);
    enemy.status = 'gone';
}

function makeEnemyFallIntoWater(state: GameState, enemy: Enemy) {
    const hitbox = enemy.getHitbox(state);
    const x = hitbox.x + hitbox.w / 2;
    const y = hitbox.y + hitbox.h / 2;
    const animation = new FieldAnimationEffect({
        animation: splashAnimation,
        x: ((x / 16) | 0) * 16, y: ((y / 16) | 0) * 16,
    });
    addEffectToArea(state, enemy.area, animation);
    enemy.status = 'gone';
}

export function hasEnemyLeftSection(state: GameState, enemy: Enemy, padding = 32): boolean {
    const { section } = getAreaSize(state);
    const hitbox = enemy.getHitbox(state);
    return (enemy.vx < 0 && hitbox.x + hitbox.w < section.x - padding)
        || (enemy.vx > 0 && hitbox.x > section.x + section.w + padding)
        || (enemy.vy < 0 && hitbox.y + hitbox.h < section.y - padding)
        || (enemy.vy > 0 && hitbox.y > section.y + section.h + padding);
}



// Returns true if the enemy moves at all.
export function moveEnemy(state: GameState, enemy: Enemy, dx: number, dy: number, movementProperties: MovementProperties): boolean {
    const {mx, my} = moveEnemyProper(state, enemy, dx, dy, movementProperties);
    return mx !== 0 || my !== 0;
}

// Returns true only if the enemy moves the full amount.
export function moveEnemyFull(state: GameState, enemy: Enemy, dx: number, dy: number, movementProperties: MovementProperties): boolean {
    const {mx, my} = moveEnemyProper(state, enemy, dx, dy, movementProperties);
    return Math.abs(mx - dx) < 0.01 && Math.abs(my - dy) < 0.01;
}

function moveEnemyProper(state: GameState, enemy: Enemy, dx: number, dy: number, movementProperties: MovementProperties): {mx: number, my: number} {
    movementProperties = {...movementProperties, dx, dy};
    if (enemy.enemyDefinition.baseMovementProperties) {
        movementProperties = {...enemy.enemyDefinition.baseMovementProperties, ...movementProperties};
    }
    if (!movementProperties.excludedObjects) {
        movementProperties.excludedObjects = new Set();
    }
    movementProperties.excludedObjects.add(state.hero);
    movementProperties.excludedObjects.add(state.hero.astralProjection);
    movementProperties.boundingBox = movementProperties.boundingBox ?? getSectionBoundingBox(state, enemy, 16);
    /*for (const clone of enemy.area.objects.filter(object => object instanceof Clone)) {
        movementProperties.excludedObjects.add(clone);
    }*/
    if (enemy.flying) {
        const hitbox = enemy.getHitbox(state);
        const ax = enemy.x + dx;
        const ay = enemy.y + dy;
        const { boundingBox } = movementProperties;
        if (boundingBox) {
            if (ax < boundingBox.x || ax + hitbox.w > boundingBox.x + boundingBox.w
                || ay < boundingBox.y || ay + hitbox.h > boundingBox.y + boundingBox.h
            ) {
                return {mx: 0, my: 0};
            }
        }
        enemy.x = ax;
        enemy.y = ay;
        return {mx: dx, my: dy};
    }
    return moveActor(state, enemy, dx, dy, movementProperties);
}
