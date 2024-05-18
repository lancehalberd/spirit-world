import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { LightningDischarge } from 'app/content/effects/lightningDischarge';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { lifeLootTable } from 'app/content/lootTables';
import { Enemy } from 'app/content/enemy';

import { omniAnimation } from 'app/content/enemyAnimations';
import { FRAME_LENGTH } from 'app/gameConstants';
// import { renderDamageWarning } from 'app/render/renderDamageWarning';
import { renderLightningRay } from 'app/render/renderLightning'
import { createAnimation } from 'app/utils/animations';
import { addEffectToArea } from 'app/utils/effects';
import { moveEnemyFull } from 'app/utils/enemies';
import { hitTargets } from 'app/utils/field';
import { addObjectToArea, removeObjectFromArea } from 'app/utils/objects';
import { getVectorToNearbyTarget, getVectorToTarget } from 'app/utils/target';

const orbAnimation = createAnimation('gfx/tiles/futuristic.png', {w: 12, h: 12}, {left: 18, top: 979});

interface OrbProps {
    bobTheta?: number
    bobThetaV?: number
    inertia: number
    closestOrb?: Enemy<OrbProps>
    closestOrbDistance?: number
    invertedDuration?: number
}

const baseBobThetaV = 0.15;
const fastBobThetaV = 0.35;

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
    onHit(this: void, state: GameState, enemy: Enemy<OrbProps>, hit: HitProperties): HitResult {
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
        for (const otherEnemy of enemy.area.enemies) {
            if (otherEnemy === enemy) {
                continue;
            }
            if (getAttraction(otherEnemy) > 0) {
                const v = getVectorToTarget(state, enemy, otherEnemy);
                if (v.mag < beamDistance) {
                    /*renderDamageWarning(context, {
                        circle: getBlastCircle(enemy, otherEnemy),
                        duration: 1000,
                        time: 0,
                    });*/
                    renderLightningRay(context, {
                        x1: enemy.x + 6, y1: enemy.y + 6 - enemy.z,
                        x2: (otherEnemy.x + 6 + enemy.x + 6) / 2, y2: (otherEnemy.y + 8 - otherEnemy.z + enemy.y + 6 - enemy.z) / 2,
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

function getAttraction(enemy: Enemy): number {
    if (enemy.definition.enemyType === 'smallOrb') {
        return 1;
    } else if (enemy.definition.enemyType === 'mediumOrb' || enemy.definition.enemyType === 'mediumOrbBoss') {
        return 2;
    } else if (enemy.definition.enemyType === 'largeOrbBoss') {
        return 2;
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
    animations: {idle: omniAnimation(orbAnimation)}, life: 8, touchHit: {element: 'lightning', damage: 2}, update: updateOrb,
    immunities: ['lightning'],
};

enemyDefinitions.mediumOrbBoss = {
    ...baseOrbDefinition, scale: 2,
    animations: {idle: omniAnimation(orbAnimation)}, life: 16, touchHit: {element: 'lightning', damage: 2}, update: updateOrb,
    immunities: ['lightning'],
};


enemyDefinitions.largeOrbBoss = {
    ...baseOrbDefinition, scale: 2,
    animations: {idle: omniAnimation(orbAnimation)}, life: 24, touchHit: {element: 'lightning', damage: 2}, update: updateOrb,
    immunities: ['lightning'],
};

function updateOrb(this: void, state: GameState, enemy: Enemy<OrbProps>) {
    const hitbox = enemy.getHitbox(state);
    if (enemy.modeTime % 100 === 0) {
        addSparkleAnimation(state, enemy.area, {...hitbox, x: 0, y: 0}, { element: 'lightning', target: enemy });
    }
    const isInverted = enemy.params.invertedDuration > 0;
    if (isInverted) {
        enemy.params.invertedDuration -= FRAME_LENGTH;
    }
    enemy.vx = enemy.vx || 0;
    enemy.vy = enemy.vy || 0;
    const maxSpeed = 3;

    //delete enemy.params.closestOrb;
    //enemy.params.closestOrbDistance = 1000;
    for (const otherEnemy of enemy.area.enemies) {
        if (otherEnemy === enemy) {
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
            if (v.mag < beamDistance) {
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
    const v = getVectorToNearbyTarget(state, enemy, 128, enemy.area.allyTargets);
    if (v) {
        const inversion = isInverted ? -1 : 1;
        const attraction = 4;
        const mag = Math.max(v.mag, 24);
        enemy.vx += inversion * v.x / mag * attraction / (enemy.params.inertia || 10);
        enemy.vy += inversion * v.y / mag * attraction / (enemy.params.inertia || 10);
    }
    // Reduce speed over time.
    enemy.vx *= 0.99;
    enemy.vy *= 0.99;
    const minSpeed = enemy.enemyDefinition.speed;
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
