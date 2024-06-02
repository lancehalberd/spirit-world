import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { LightningDischarge } from 'app/content/effects/lightningDischarge';
import { addRadialSparks } from 'app/content/effects/spark';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { lifeLootTable } from 'app/content/lootTables';
import { Enemy } from 'app/content/enemy';

import { omniAnimation } from 'app/content/enemyAnimations';
import { FRAME_LENGTH } from 'app/gameConstants';
// import { renderDamageWarning } from 'app/render/renderDamageWarning';
import { renderLightningRay } from 'app/render/renderLightning'
import { createAnimation } from 'app/utils/animations';
import { addEffectToArea } from 'app/utils/effects';
import { isEnemyMissing, moveEnemyFull, moveEnemyToTargetLocation } from 'app/utils/enemies';
import { hitTargets } from 'app/utils/field';
import { addObjectToArea, removeObjectFromArea } from 'app/utils/objects';
import { getVectorToNearbyTarget, getVectorToTarget } from 'app/utils/target';

const orbAnimation = createAnimation('gfx/tiles/futuristic.png', {w: 12, h: 12}, {left: 18, top: 979});
const largeOrbAnimation = createAnimation('gfx/enemies/largeOrb.png', {w: 48, h: 48}, {left: 0, top: 0});

interface OrbProps {
    bobTheta?: number
    bobThetaV?: number
    inertia: number
    closestOrb?: Enemy<OrbProps>
    closestOrbDistance?: number
    invertedDuration?: number
    orbCount?: number
    smallOrbs?: Enemy<OrbProps>[]
    largeOrb?: Enemy<OrbProps>
    spinTheta?: number
    spinThetaV?: number
    shockwaveIndex?: number
    shockwaveTimer?: number
    shockwaveTheta?: number
}

const baseBobThetaV = 0.15;
const fastBobThetaV = 0.35;

const baseSpinThetaV = Math.PI / 2 * FRAME_LENGTH / 1000;
const fastSpinThetaV = 2 * Math.PI * FRAME_LENGTH / 1000;

const warningDistance = 144;
const beamDistance = 80;
const blastDistance = 24;

const baseOrbDefinition: Partial<EnemyDefinition<OrbProps>> = {
    flying: true,
    lootTable: lifeLootTable,
    params: {inertia: 2},
    speed: 1.2,
    updateFlyingZ(this: void, state: GameState, enemy: Enemy<OrbProps>) {
        enemy.params.bobTheta = enemy.params.bobTheta || 0;
        enemy.params.bobThetaV = enemy.params.bobThetaV || baseBobThetaV;
        // Return to the same rate after a while.
        if (enemy.params.bobThetaV > baseBobThetaV) {
            enemy.params.bobThetaV -= 0.001;
        }
        enemy.params.bobTheta += enemy.params.bobThetaV;
        const targetZ = 14 + 2 * Math.sin(enemy.params.bobTheta);
        if (enemy.z < targetZ - 1) {
            enemy.z++;
        } else if (enemy.z > targetZ + 1) {
            enemy.z--;
        } else {
            enemy.z = targetZ;
        }
    },
    onDeath(state: GameState, enemy: Enemy) {
        if (enemy.params.possessedTarget && enemy.params.baseTargetType) {
            const target = enemy.params.possessedTarget;
            const baseEnemy = new Enemy(state, {
                id: target.definition?.id,
                status: 'normal',
                type: 'enemy',
                enemyType: enemy.params.baseTargetType,
                x: target.x,
                y: target.y,
            });
            baseEnemy.z = target.z;
            removeObjectFromArea(state, target);
            addObjectToArea(state, enemy.area.alternateArea, baseEnemy);
        }
    },
    renderOver(this: void, context: CanvasRenderingContext2D, state: GameState, enemy: Enemy<OrbProps>) {
        const hitbox = enemy.getHitbox();
        const cx = hitbox.x + hitbox.w / 2, cy = hitbox.y + hitbox.h / 2;
        if (enemy.params.smallOrbs) {
            // Large orbs render beams to all captured small orbs.
            for (const smallOrb of enemy.params.smallOrbs) {
                renderHalfBeam(context, enemy, smallOrb);
            }
            return;
        } else if (enemy.params.largeOrb) {
            // Small orbs captured by a large orb only render beams to the large orb.
            renderHalfBeam(context, enemy, enemy.params.largeOrb);
            return;
        }
        for (const otherEnemy of enemy.area.enemies) {
            if (otherEnemy === enemy) {
                continue;
            }
            if (isEnemyMissing(enemy.area, otherEnemy)) {
                continue;
            }
            const inversion = (enemy.params.invertedDuration > 0 || otherEnemy.params.invertedDuration > 0) ? -1 : 1;
            if (inversion > 0 && getAttraction(otherEnemy) > 0) {
                const v = getVectorToTarget(state, enemy, otherEnemy);
                const otherHitbox = otherEnemy.getHitbox();
                const ocx = otherHitbox.x + otherHitbox.w / 2, ocy = otherHitbox.y + otherHitbox.h / 2;
                if (v.mag < beamDistance) {
                    /*renderDamageWarning(context, {
                        circle: getBlastCircle(enemy, otherEnemy),
                        duration: 1000,
                        time: 0,
                    });*/
                    renderLightningRay(context, {
                        x1: cx, y1: cy,
                        x2: (cx + ocx) / 2, y2: (cy + ocy) / 2,
                        r: 4,
                    }, 2, 20);
                } else if (v.mag < warningDistance) {

                    const p = 1 - (v.mag - beamDistance) / (warningDistance - beamDistance);
                    context.save();
                        context.globalAlpha *= 0.3 * p;
                        /*renderDamageWarning(context, {
                            circle: getBlastCircle(enemy, otherEnemy, p),
                            duration: 1000,
                            time: 0,
                        });*/
                        renderLightningRay(context, {
                            x1: enemy.x + 6, y1: enemy.y + 6 - enemy.z,
                            x2: enemy.x + 6 + p * v.x * beamDistance / 2, y2:enemy.y + 6 - enemy.z + p * v.y * beamDistance / 2,
                            r: 2,
                        }, 1, 15);
                    context.restore();

                }
            }
        }
    }
};
function renderHalfBeam(context: CanvasRenderingContext2D, orbA: Enemy, orbB: Enemy) {
    const hitbox = orbA.getHitbox();
        const cx = hitbox.x + hitbox.w / 2, cy = hitbox.y + hitbox.h / 2;
    const otherHitbox = orbB.getHitbox();
    const ocx = otherHitbox.x + otherHitbox.w / 2, ocy = otherHitbox.y + otherHitbox.h / 2;
    renderLightningRay(context, {
        x1: cx, y1: cy,
        x2: (cx + ocx) / 2, y2: (cy + ocy) / 2,
        r: 4,
    }, 2, 20);
}

function getAttraction(enemy: Enemy): number {
    if (enemy.definition.enemyType === 'smallOrb') {
        return 1;
    } else if (enemy.definition.enemyType === 'largeOrb') {
        return 3;
    }
    return 0;
}

function getBlastCircle(enemy: Enemy, otherEnemy: Enemy, p = 1): Circle {
    const hitbox = enemy.getHitbox();
    const otherHitbox = otherEnemy.getHitbox();
    return {
        x: (hitbox.x + hitbox.w / 2 + otherHitbox.x + otherHitbox.w / 2) / 2,
        y: (hitbox.y + hitbox.h / 2 + otherHitbox.y + otherHitbox.h / 2) / 2,
        r: 48 * p,
    };
}

enemyDefinitions.smallOrb = {
    ...baseOrbDefinition,
    animations: {idle: omniAnimation(orbAnimation)}, life: 8, touchHit: {element: 'lightning', damage: 2}, update: updateSmallOrb,
    immunities: ['lightning'],
    onHit(this: void, state: GameState, enemy: Enemy<OrbProps>, hit: HitProperties): HitResult {
        if (enemy.params.largeOrb) {
            return enemy.defaultBlockHit(state, hit, true);
        }
        const result = enemy.defaultOnHit(state, hit);
        if (result.hit) {
            // The orb bob's faster after taking damage.
            enemy.params.bobThetaV = fastBobThetaV;
        }
        // TODO: Find a better way to prevent the orb from falling to the ground when knocked.
        if (enemy.action === 'knocked') {
            delete enemy.action;
        }
        return result;
    },
};

enemyDefinitions.largeOrb = {
    ...baseOrbDefinition,
    tileBehaviors: {
        brightness: 0.6,
        lightRadius: 40,
    },
    params: {
        // The lower this is the faster the orb will accelerate towards the player.
        inertia: 1.5,
        orbCount: 2,
    },
    speed: 0.8,
    animations: {idle: omniAnimation(largeOrbAnimation)}, life: 48, touchHit: {element: 'lightning', damage: 2}, update: updateLargeOrb,
    immunities: ['lightning'],
    onHit(this: void, state: GameState, enemy: Enemy<OrbProps>, hit: HitProperties): HitResult {
        const life = enemy.life;
        const result = enemy.defaultOnHit(state, hit);
        // The orb can be knocked back a little once it is in its pinch mode.
        if (result.hit && enemy.params.invertedDuration) {
            let knockback = hit.knockback;
            if (hit.knockAwayFrom) {
                const hitbox = enemy.getHitbox();
                const dx = (hitbox.x + hitbox.w / 2) - hit.knockAwayFrom.x;
                const dy = (hitbox.y + hitbox.h / 2) - hit.knockAwayFrom.y;
                const mag = Math.sqrt(dx * dx + dy * dy);
                if (mag) {
                    knockback = {vx: 4 * dx / mag, vy: 4 * dy / mag, vz: 0};
                }
            }
            if (knockback) {
                enemy.vx += knockback.vx;
                enemy.vy += knockback.vy;
            }
        }
        const damage = life - enemy.life;
        if (damage > 0) {
            // The orb bob's faster after taking damage.
            enemy.params.spinThetaV = Math.min(fastSpinThetaV, enemy.params.spinThetaV + damage * Math.PI / 16 * FRAME_LENGTH / 1000);
        }
        return result;
    },
};


function updateLargeOrb(this: void, state: GameState, enemy: Enemy<OrbProps>) {
    // For convenience, mark the largeOrb on itself.
    enemy.params.largeOrb = enemy;
    const hitbox = enemy.getMovementHitbox();
    // Ranges from 24 -> 60 as the large orb goes from full to 1/3 life.
    const orbitRadius = Math.min(60, 40 + (60 - 40) * (enemy.enemyDefinition.life - enemy.life) / (enemy.life * 2 / 3));
    if (!enemy.params.smallOrbs) {
        enemy.params.shockwaveTimer = 2000;
        enemy.params.smallOrbs = [];
        for (let i = 0; i < enemy.params.orbCount; i++) {
            const theta = i * 2 * Math.PI / enemy.params.orbCount;
            const smallOrb = new Enemy(state, {
                id: '',
                status: 'normal',
                type: 'enemy',
                enemyType: 'smallOrb',
                x: hitbox.x + hitbox.w / 2 + orbitRadius * Math.cos(theta) - 6,
                y: hitbox.y + hitbox.h / 2 + orbitRadius * Math.sin(theta) - 6,
            });
            smallOrb.params.largeOrb = enemy;
            smallOrb.z = 14;
            smallOrb.speed = 6;
            addObjectToArea(state, enemy.area, smallOrb);
            enemy.params.smallOrbs.push(smallOrb);
        }
    }

    if (!enemy.params.invertedDuration) {
        if (enemy.life <= enemy.enemyDefinition.life / 3) {
            enemy.vx = enemy.vy = 0;
            // The large orb will explode after this duration.
            enemy.params.invertedDuration = 8000;
            for (const smallOrb of enemy.params.smallOrbs) {
                delete smallOrb.params.largeOrb;
                const v = getVectorToTarget(state, enemy, smallOrb);
                const maxSpeed = 2.5 * smallOrb.enemyDefinition.speed;
                smallOrb.vx = maxSpeed * v.x;
                smallOrb.vy = maxSpeed * v.y;
            }
            enemy.params.smallOrbs = [];
            return;
        }
    }
    if (enemy.modeTime % 100 === 0) {
        addSparkleAnimation(state, enemy.area, {...hitbox, x: 0, y: 0}, { element: 'lightning', target: enemy });
    }
    if (enemy.params.invertedDuration) {
        enemy.params.invertedDuration -= FRAME_LENGTH;
        if (enemy.params.invertedDuration <= 0) {
            enemy.life = 0;
        }
        moveOrbTowardsClosestTarget(state, enemy);
        return;
    }
    enemy.params.spinThetaV = enemy.params.spinThetaV || baseSpinThetaV;
    if (enemy.params.spinThetaV > baseSpinThetaV) {
        enemy.params.spinThetaV -= 0.0001;
    }
    enemy.params.spinTheta = (enemy.params.spinTheta || 0) + enemy.params.spinThetaV;
    enemy.params.smallOrbs = enemy.params.smallOrbs.filter(orb => !isEnemyMissing(enemy.area, orb));
    for (let i = 0; i < enemy.params.smallOrbs.length; i++) {
        const smallOrb = enemy.params.smallOrbs[i];
        const smallOrbHitbox = smallOrb.getMovementHitbox();
        const theta = enemy.params.spinTheta + i * 2 * Math.PI / enemy.params.smallOrbs.length;
        const tx = hitbox.x + hitbox.w / 2 + orbitRadius * Math.cos(theta);
        const ty = hitbox.y + hitbox.h / 2 + orbitRadius * Math.sin(theta);
        //smallOrb.x = tx - smallOrbHitbox.w / 2;
        //smallOrb.y = ty - smallOrbHitbox.h / 2;
        const dx = tx - smallOrb.x - smallOrbHitbox.w / 2, dy = ty - smallOrb.y - smallOrbHitbox.h / 2;
        const mag = Math.sqrt(dx * dx + dy * dy);
        const speed = moveEnemyToTargetLocation(state, smallOrb, tx, ty);
        // Keep the small orbs velocity up to date in case the larbe orb goes missing.
        smallOrb.vx = speed * dx / mag;
        smallOrb.vy = speed * dy / mag;
    }
    enemy.params.shockwaveTimer -= FRAME_LENGTH * enemy.params.smallOrbs.length;
    if (enemy.params.shockwaveTimer <= 0) {
        const target = getVectorToNearbyTarget(state, enemy, 296, enemy.area.allyTargets)?.target;
        if (target) {
            // When a target is nearby, place an attack from an orb that will hit the target if they stand still.
            for (const smallOrb of enemy.params.smallOrbs) {
                const v = getVectorToTarget(state, smallOrb, target);
                let theta = -1;
                if (Math.abs(v.x) < 0.05 || Math.abs(v.y) <= 0.05) {
                    theta = 0;
                } else if (Math.abs(1 - Math.abs(v.x / v.y)) <= 0.05) {
                    theta = Math.PI / 4;
                }
                if (theta >= 0) {
                    const smallOrbHitbox = smallOrb.getMovementHitbox();
                    addRadialSparks(
                        state, enemy.area, [smallOrbHitbox.x + smallOrbHitbox.w / 2, smallOrbHitbox.y + smallOrbHitbox.h / 2],
                        4, theta, 3,
                        {damage: 2, delay: 800}
                    );
                    enemy.params.shockwaveTimer = 2000;
                    break;
                }
            }
        } else {
            // Randomly attack from the small orbs when no target is nearby.
            enemy.params.shockwaveTimer = 2000;
            enemy.params.shockwaveIndex = (enemy.params.shockwaveIndex || 0) + 1;
            enemy.params.shockwaveTheta = (enemy.params.shockwaveTheta || 0) + Math.PI / 4;
            const smallOrb = enemy.params.smallOrbs[enemy.params.shockwaveIndex % enemy.params.smallOrbs.length];
            const smallOrbHitbox = smallOrb.getMovementHitbox();
            addRadialSparks(
                state, enemy.area, [smallOrbHitbox.x + smallOrbHitbox.w / 2, smallOrbHitbox.y + smallOrbHitbox.h / 2],
                4, enemy.params.shockwaveTheta, 3,
                {damage: 2, delay: 800}
            );
        }

    }


}

function updateSmallOrb(this: void, state: GameState, enemy: Enemy<OrbProps>) {
    const hitbox = enemy.getHitbox();
    if (enemy.params.largeOrb) {
        if (isEnemyMissing(enemy.area, enemy.params.largeOrb)) {
            console.log("Removing large orb");
            enemy.params.largeOrb.params.smallOrbs = [];
            delete enemy.params.largeOrb;
        }
    }
    if (enemy.params.largeOrb) {

        if (enemy.modeTime % 60 === 0) {
            addSparkleAnimation(state, enemy.area, {...hitbox, x: 0, y: 0}, { element: 'lightning', target: enemy });
        }
        return;
    }
    if (enemy.modeTime % 100 === 0) {
        addSparkleAnimation(state, enemy.area, {...hitbox, x: 0, y: 0}, { element: 'lightning', target: enemy });
    }
    const isInverted = enemy.params.invertedDuration > 0;
    if (isInverted) {
        enemy.params.invertedDuration -= FRAME_LENGTH;
    }
    enemy.vx = enemy.vx || 0;
    enemy.vy = enemy.vy || 0;


    //delete enemy.params.closestOrb;
    //enemy.params.closestOrbDistance = 1000;
    for (const otherEnemy of enemy.area.enemies) {
        if (otherEnemy === enemy) {
            continue;
        }
        if (isEnemyMissing(enemy.area, otherEnemy)) {
            continue;
        }
        const attraction = getAttraction(otherEnemy);
        if (attraction > 0) {
            const inversion = (isInverted || otherEnemy.params.invertedDuration > 0) ? -1 : 1;
            const v = getVectorToTarget(state, enemy, otherEnemy);
            // Sphere's are never considered closer than their combined radiuses.
            /*if (v.mag < enemy.params.closestOrbDistance) {
                enemy.params.closestOrb
                enemy.params.closestOrbDistance = v.mag;
            }*/
            if (v.mag < beamDistance && inversion > 0) {
                // This orb gets captured when it is within beam distance of anything connected to a large orb.
                if (otherEnemy.params.largeOrb) {
                    enemy.params.largeOrb = otherEnemy.params.largeOrb;
                    enemy.params.largeOrb.params.smallOrbs.push(enemy);
                    return;
                }
                hitTargets(state, enemy.area, {
                    damage: 2,
                    element: 'lightning',
                    hitRay: {
                        x1: enemy.x + 6, y1: enemy.y + 6 - enemy.z,
                        x2: (otherEnemy.x + 6 + enemy.x + 6) / 2, y2: (otherEnemy.y + 8 - otherEnemy.z + enemy.y + 6 - enemy.z) / 2,
                        r: 4,
                    },
                    hitAllies: true,
                    knockAwayFromHit: true,
                });
            }
            if (inversion > 0 && v.mag < blastDistance) {
                const maxSpeed = 2.5 * enemy.enemyDefinition.speed;
                enemy.vx = -maxSpeed * v.x;
                enemy.vy = -maxSpeed * v.y;
                enemy.params.bobThetaV = fastBobThetaV;
                enemy.params.invertedDuration = 1000;
                otherEnemy.vx = maxSpeed * v.x;
                otherEnemy.vy = maxSpeed * v.y;
                otherEnemy.params.bobThetaV = fastBobThetaV;
                otherEnemy.params.invertedDuration = 1000;
                const blastCircle = getBlastCircle(enemy, otherEnemy);
                const discharge = new LightningDischarge({
                    x: blastCircle.x,
                    y: blastCircle.y,
                    tellDuration: 400,
                    radius: blastCircle.r,
                });
                addEffectToArea(state, enemy.area, discharge);
            } else if (v.mag > 1){
                enemy.vx += inversion * v.x / v.mag * attraction / (enemy.params.inertia || 10);
                enemy.vy += inversion * v.y / v.mag * attraction / (enemy.params.inertia || 10);
            }
        }
    }
    moveOrbTowardsClosestTarget(state, enemy);
}


function moveOrbTowardsClosestTarget(state: GameState, enemy: Enemy<OrbProps>) {
    const v = getVectorToNearbyTarget(state, enemy, 128, enemy.area.allyTargets);
    if (v) {
        const attraction = 4;
        const mag = Math.max(v.mag, 24);
        enemy.vx += v.x / mag * attraction / (enemy.params.inertia || 10);
        enemy.vy += v.y / mag * attraction / (enemy.params.inertia || 10);
    }
    // Reduce speed over time.
    enemy.vx *= 0.99;
    enemy.vy *= 0.99;
    const minSpeed = enemy.enemyDefinition.speed;
    const maxSpeed = 2.5 * minSpeed;
    const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
    if (speed > maxSpeed) {
        enemy.vx = maxSpeed * enemy.vx / speed;
        enemy.vy = maxSpeed * enemy.vy / speed;
    } else if (speed > 0 && speed < minSpeed) {
        enemy.vx = minSpeed * enemy.vx / speed;
        enemy.vy = minSpeed * enemy.vy / speed;
    }

    // TODO: Implement this so that this enemy ignores pits+low walls but not other walls/ledges.
    enemy.flying = false;
    if (!moveEnemyFull(state, enemy, enemy.vx, 0, {canWiggle: false})) {
        enemy.vx = -enemy.vx;
    }
    if (!moveEnemyFull(state, enemy, 0, enemy.vy, {canWiggle: false})) {
        enemy.vy = -enemy.vy;
    }
    enemy.flying = true;
}
