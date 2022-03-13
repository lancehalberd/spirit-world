import {
    addEffectToArea,
    playAreaSound
} from 'app/content/areas';
import { addArcOfSparks, addRadialSparks } from 'app/content/effects/spark';
import { LaserBeam } from 'app/content/effects/laserBeam';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {
    accelerateInDirection,
    getNearbyTarget,
    //getVectorToNearbyTarget,
    //getVectorToTarget,
    moveEnemy,
    moveEnemyToTargetLocation,
    //paceRandomly,
} from 'app/content/enemies';
import { droneAnimations } from 'app/content/enemyAnimations';
import { rectanglesOverlap } from 'app/utils/index';
import { addScreenShake } from 'app/utils/field';

import { AreaInstance, Enemy, GameState, HitProperties, HitResult } from 'app/types';

const LASER_CHARGE_TIME = 2000;
const SLAM_HANDS_DURATION = 4000;
// Period of time the golem pauses after using slam hands.
const SLAM_HANDS_PAUSE_DURATION = 2500;

enemyDefinitions.golem = {
    animations: droneAnimations, life: 32, scale: 4, touchHit: { damage: 2 },
    acceleration: 0.3, speed: 3,
    update: updateGolem,
    params: {
        enrageLevel: 0,
    },
    immunities: ['fire', 'ice'],
    elementalMultipliers: {'lightning': 2},
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        let frameIndex = Math.floor(7 - enemy.params.cloudLife);
        frameIndex = Math.min(7, Math.max(0, frameIndex));
        context.fillStyle = 'red';
        context.beginPath();
        const hitbox = enemy.getHitbox(state);
        context.arc(hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h - 10, 6, 0, 2 * Math.PI);
        context.fill();
        if (enemy.mode === 'chargeLaser') {
            context.save();
                const p = enemy.modeTime / LASER_CHARGE_TIME;
                context.globalAlpha *= 0.2 + 0.8 * p;
                const r = 6 + 16 * (1 - p);
                context.fillStyle = 'yellow';
                context.beginPath();
                const hitbox = enemy.getHitbox(state);
                context.arc(hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h - 10, r, 0, 2 * Math.PI);
                context.fill();
            context.restore();
        }
    },
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        const hitbox = enemy.getHitbox(state);
        const hitInnerBox = hit.hitbox && rectanglesOverlap({
            x: hitbox.x + hitbox.w / 2 - 6,
            y: hitbox.y + hitbox.h - 20,
            w: 12,
            h: 20,
        }, hit.hitbox);
        // Only striking the vulnerable point will deal damage.
        if (!hitInnerBox) {
            playAreaSound(state, enemy.area, 'blockAttack');
            return { blocked: true, stopped: true };
        }
        if (hit.damage) {
            hit = {
                ...hit,
                damage: hit.isArrow ? hit.damage + 3 : hit.damage / 2,
            };
        }
        return enemy.defaultOnHit(state, hit);
    },
};
enemyDefinitions.golemHand = {
    animations: droneAnimations, life: 12, scale: 2, update: updateGolemHand,
    canBeKnockedBack: false, canBeKnockedDown: false,
    acceleration: 0.3, speed: 4,
    touchHit: { damage: 2},
    immunities: ['fire', 'ice'],
    elementalMultipliers: {'lightning': 2},
    initialMode: 'choose',
    params: {
        enrageLevel: 0,
        side: 'none',
    },
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        if (enemy.isInvulnerable) {
            return {};
        }
        // Hands take reduced damage unless they are stunned.
        if (hit.damage && enemy.mode !== 'stunned') {
            enemy.applyDamage(state, hit.damage / 5, 'blockAttack');
            return { blocked: true, stopped: true };
        }
        enemy.defaultOnHit(state, hit);
        return { blocked: true, stopped: true };
    },
};

function getGolem(this: void, state: GameState, area: AreaInstance): Enemy {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'golem') as Enemy;
}

function getOtherHands(this: void, state: GameState, enemy: Enemy): Enemy[] {
    return enemy.area.objects.filter(target =>
        target !== enemy && target instanceof Enemy
        && target.definition.enemyType === 'golemHand' && !isEnemyDefeated(target)
    ) as Enemy[];
}


function isEnemyDefeated(enemy: Enemy): boolean {
    return !enemy || (enemy.life <= 0 && !enemy.isImmortal) || enemy.status === 'gone';
}

function updateGolem(this: void, state: GameState, enemy: Enemy): void {
    // const target = getVectorToNearbyTarget(state, enemy, isEnraged ? 144 : 500, enemy.area.allyTargets);
    if (enemy.params.enragedAttacks > 0) {
        enemy.enemyInvulnerableFrames = enemy.invulnerableFrames = 20;
        enemy.params.enragedAttacks -= 0.05;
        if (enemy.mode === 'choose') {
            enemy.setMode('prepareStrafe');
        } else if (enemy.mode === 'prepareStrafe') {
            enemy.setMode('choose');
        }
        return;
    }
    // This gets all hands since the golem is not a golemHand.
    const hands = getOtherHands(state, enemy);
    // Boss moves slower for each hand remaining.
    enemy.speed = Math.max(1, enemy.enemyDefinition.speed - hands.length);
    // The golem cannot move when hands are taking certain actions or while firing a laser.
    // Golem can always move if both hands are defeated.
    const canMove = !hands.length
        || (
            ((enemy.mode === 'slamHands' && enemy.modeTime < SLAM_HANDS_DURATION) || !hands.some(hand => hand.mode !== 'choose'))
            && !(enemy.mode === 'chargeLaser' && enemy.modeTime > LASER_CHARGE_TIME - 400)
            && (!enemy.params.laser || enemy.params.laser.done)
        );
    const hitbox = enemy.getHitbox(state);
    const cx = hitbox.x + hitbox.w / 2;//, cy = hitbox.y + hitbox.h / 2;
    if (canMove) {
        const target = getNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
        const targetHitbox = target.getHitbox(state);
        // Track the player's x position when possible.
        if (targetHitbox.x < hitbox.x ||
            (enemy.mode === 'chargeLaser' && targetHitbox.x + targetHitbox.w / 2 < cx - 4)
        ) {
            moveEnemy(state, enemy, -enemy.speed, 0, {});
        } else if (targetHitbox.x + targetHitbox.w > hitbox.x + hitbox.w ||
            (enemy.mode === 'chargeLaser' && targetHitbox.x + targetHitbox.w / 2 > cx + 4)
        ) {
            moveEnemy(state, enemy, enemy.speed, 0, {});
        }
    }
    if (enemy.params.laser) {
        const sx = hitbox.x + hitbox.w / 2, sy = hitbox.y + hitbox.h - 10;
        enemy.params.laser.sx = sx;
        enemy.params.laser.sy = sy;
        enemy.params.laser.tx = sx;
        enemy.params.laser.ty = sy + 512;
    }
    if (enemy.mode === 'choose' || enemy.mode === 'prepareStrafe') {
        if (enemy.modeTime >= 2000 + 2000 * hands.length) {
            enemy.setMode('prepareAttack');
        }
    } else if (enemy.mode === 'prepareAttack') {
        if (hands.every(hand => hand.mode === 'choose')) {
            if (hands.length >= 2 && Math.random() <= 0.75) {
                enemy.setMode('slamHands');
            } else {
                enemy.setMode('chargeLaser');
            }
        }
    } else if (enemy.mode === 'chargeLaser') {
        if (enemy.modeTime >= LASER_CHARGE_TIME) {
            enemy.setMode('fireLaser');
        }
    } else if (enemy.mode === 'fireLaser') {
        const sx = hitbox.x + hitbox.w / 2, sy = hitbox.y + hitbox.h - 10;
        enemy.params.laser = new LaserBeam({
            sx: sx, sy, tx: sx, ty: sy + 512,
            radius: 8, damage: 3, duration: 900,
        });
        addEffectToArea(state, enemy.area, enemy.params.laser);
        enemy.setMode('cooldown')
    } else if (enemy.mode === 'cooldown') {
        if (enemy.modeTime >= 2000) {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'slamHands') {
        if (enemy.modeTime >= SLAM_HANDS_DURATION + SLAM_HANDS_PAUSE_DURATION) {
            enemy.setMode('choose');
        }
    }
    if (enemy.life <= enemy.enemyDefinition.life * 2 / 3 && enemy.params.enrageLevel === 0) {
        enemy.params.enrageLevel = 1;
        enemy.params.enragedAttacks = 2;
        enemy.modeTime = 0;
    } else if (enemy.life <= enemy.enemyDefinition.life * 1 / 3 && enemy.params.enrageLevel === 1) {
        enemy.params.enrageLevel = 2;
        enemy.params.enragedAttacks = 3;
        enemy.modeTime = 0;
    }
}

function moveHandToPosition(this: void, state: GameState, enemy: Enemy, otherHands: Enemy[]): void {
    const hitbox = enemy.getHitbox(state);
    const golem = getGolem(state, enemy.area);
    const golemHitbox = golem.getHitbox(state);
    if (!otherHands.find(hand => hand.mode !== 'hoverOverTarget' && hand.mode !== 'targetedSlam')) {
        // An isolated hand will center itself over the golem's weak spot
        const x = golemHitbox.x + golemHitbox.w / 2;
        const y = golemHitbox.y + golemHitbox.h + hitbox.h / 2;
        moveEnemyToTargetLocation(state, enemy, x, y - enemy.z);
    } else if (enemy.params.side === 'left') {
        const x = golemHitbox.x + golemHitbox.w / 2 - hitbox.w / 2 + 3;
        const y = golemHitbox.y + golemHitbox.h + hitbox.h / 2;
        moveEnemyToTargetLocation(state, enemy, x, y - enemy.z);
    } else if (enemy.params.side === 'right') {
        const x = golemHitbox.x + golemHitbox.w / 2 + hitbox.w / 2 - 3;
        const y = golemHitbox.y + golemHitbox.h + hitbox.h / 2;
        moveEnemyToTargetLocation(state, enemy, x, y - enemy.z);
    }
}

function updateGolemHand(this: void, state: GameState, enemy: Enemy): void {
    // For multiple golems we would need to associate hands with the golem closest to their spawn point.
    const golem = getGolem(state, enemy.area);
    // Currently hands without golems are not supported.
    if (!golem) {
        return;
    }
    // Prevent interacting with the hand when it is too high
    enemy.isInvulnerable = (enemy.z > 20);
    enemy.touchHit = (enemy.z <= 20) ? enemy.enemyDefinition.touchHit : null;
    const otherHands = getOtherHands(state, enemy);
    const hitbox = enemy.getHitbox(state);
    const golemHitbox = golem?.getHitbox(state);
    // If the hand doesn't have a side yet, assign one based on its relative position to the golem.
    if (enemy.params.side === 'none') {
        if (hitbox.x + hitbox.w / 2 <= golemHitbox.x + golemHitbox.w / 2) {
            enemy.params.side = 'left';
        } else {
            enemy.params.side = 'right';
        }
    }
    if (enemy.mode === 'choose') {
        if (enemy.z < 10) {
            enemy.z++;
        }
        // Hands should move apart and stay apart just before the laser fires.
        if ((golem.mode === 'chargeLaser' && golem.modeTime > LASER_CHARGE_TIME - 100)
            || golem.mode === 'fireLaser'
            || (golem.params.laser && !golem.params.laser.done)
        ) {
            if (enemy.params.side === 'left') {
                const x = golemHitbox.x + golemHitbox.w / 2 - hitbox.w;
                const y = golemHitbox.y + golemHitbox.h + hitbox.h / 2;
                moveEnemyToTargetLocation(state, enemy, x, y - enemy.z);
            } else if (enemy.params.side === 'right') {
                const x = golemHitbox.x + golemHitbox.w / 2 + hitbox.w;
                const y = golemHitbox.y + golemHitbox.h + hitbox.h / 2;
                moveEnemyToTargetLocation(state, enemy, x, y - enemy.z);
            }
            return;
        }
        moveHandToPosition(state, enemy, otherHands);
        // Do not start attacking with hands while charging the laser.
        if (golem.mode === 'prepareAttack' || golem.mode === 'chargeLaser') {
            return;
        }
        if (golem.mode === 'slamHands') {
            enemy.setMode('raiseHand');
            return;
        }
        if (enemy.modeTime > 1000
            && (!otherHands.length || otherHands.some(hand => hand.mode === 'choose' && hand.modeTime >= 400))
        ) {
            const target = getNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
            if (!target || Math.random() < 0.6) {
                enemy.setMode('raiseHand');
            } else if (otherHands.length && Math.random() < 0.5) {
                enemy.setMode('hoverOverTarget');
            } else {
                enemy.setMode('followTarget');
            }
        }
    } else if (enemy.mode === 'followTarget') {
        if (enemy.z > 5) {
            enemy.z--;
        }
        const target = getNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
        if (target && enemy.modeTime < 1000) {
            const targetHitbox = target.getHitbox(state);
            const x = targetHitbox.x + targetHitbox.w / 2;
            const y = golemHitbox.y + golemHitbox.h + hitbox.h / 2 + 8;
            moveEnemyToTargetLocation(state, enemy, x, y - enemy.z);
        }
        if (enemy.modeTime >= 1300) {
            enemy.setMode('punch');
        }
    } else if (enemy.mode === 'hoverOverTarget') {
        if (enemy.z < 40) {
            enemy.z++;
        }
        const target = getNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
        if (target && enemy.modeTime < 1000) {
            const targetHitbox = target.getHitbox(state);
            const x = targetHitbox.x + targetHitbox.w / 2;
            const y = targetHitbox.y + targetHitbox.h / 2;
            moveEnemyToTargetLocation(state, enemy, x, y - enemy.z);
        }
        if (enemy.modeTime >= 1300) {
            enemy.setMode('targetedSlam');
        }
    } else if (enemy.mode === 'return') {
        if (enemy.z < 10) {
            enemy.z++;
            moveHandToPosition(state, enemy, otherHands);
        } else {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'raiseHand') {
        moveHandToPosition(state, enemy, otherHands);
        if (enemy.z < 20) {
            enemy.z++;
            if (golem.mode === 'slamHands' && golem.modeTime >= 1000) {
                enemy.z++
            }
        } else {
            if (golem.mode === 'slamHands') {
                // Wait a moment after raising both hands before slamming.
                if (golem.modeTime < 1000 || enemy.modeTime < 400) {
                    return;
                }
                // Stagger the hands so they hit in an even pattern
                if (!otherHands.length
                    || otherHands.some(hand =>
                        (hand.mode === 'raiseHand' && hand.modeTime > 200)
                        || (hand.mode === 'stunned' && hand.modeTime > 200)
                    )
                ) {
                    enemy.setMode('slamHand');
                }
            } else if (enemy.modeTime > 400) {
                enemy.setMode('slamHand');
            }
        }
    } else if (enemy.mode === 'slamHand') {
        enemy.z -= 2;
        if (enemy.z <= 0) {
            enemy.z = 0;
            playAreaSound(state, enemy.area, 'bossDeath');
            addScreenShake(state, 0, 2);
            addArcOfSparks(
                state, enemy.area,
                [hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2],
                3 + (golem?.params.enrageLevel || 0),
                Math.PI / 2, Math.PI / 3
            );
            if (golem.mode === 'slamHands') {
                // Continue slamming until the last 2 seconds of the slam attack.
                if (golem.modeTime <= SLAM_HANDS_DURATION) {
                    enemy.setMode('raiseHand');
                } else {
                    enemy.params.stunTime = SLAM_HANDS_DURATION + SLAM_HANDS_PAUSE_DURATION - golem.modeTime;
                    enemy.setMode('stunned');
                }
            } else {
                enemy.params.stunTime = 500;
                enemy.setMode('stunned');
            }
        }
    } else if (enemy.mode === 'targetedSlam') {
        enemy.z -= 3;
        if (enemy.z <= 0) {
            enemy.z = 0;
            playAreaSound(state, enemy.area, 'bossDeath');
            addScreenShake(state, 0, 3);
            addRadialSparks(
                state, enemy.area,
                [hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2],
                6, Math.PI / 6
            );
            enemy.params.stunTime = 1000;
            enemy.setMode('stunned');
        }
    } else if (enemy.mode === 'punch') {
        accelerateInDirection(state, enemy, {x: 0, y: 1});
        if (!moveEnemy(state, enemy, enemy.vx, enemy.vy, {})) {
            playAreaSound(state, enemy.area, 'bossDeath');
            addScreenShake(state, 0, 3);
            enemy.params.stunTime = 1000;
            enemy.setMode('stunned');
        }
    } else if (enemy.mode === 'stunned') {
        if (enemy.modeTime >= enemy.params.stunTime) {
            enemy.setMode('return');
        }
    }
}

