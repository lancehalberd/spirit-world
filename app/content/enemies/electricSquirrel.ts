import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { addEffectToArea } from 'app/content/areas';
import { LightningDischarge } from 'app/content/effects/lightningDischarge';
import {
    moveEnemyFull,
} from 'app/content/enemies';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {
    electricSquirrelAnimations, superElectricSquirrelAnimations,
} from 'app/content/enemyAnimations';
import { lifeLootTable } from 'app/content/lootTables';
import { getDirection } from 'app/utils/field';

import { Enemy, GameState, HitProperties, HitResult } from 'app/types';


const maxJumpSpeed = 5;
function jumpTowardsPoint(state: GameState, enemy: Enemy, {x: tx, y: ty}, radius = 32) {
    const enemyHitbox = enemy.getHitbox(state);
    const x = enemyHitbox.x + enemyHitbox.w / 2;
    const y = enemyHitbox.y + enemyHitbox.h / 2;
    enemy.vz = 3;
    enemy.az = -0.2;
    // This is in frames.
    const duration = -2 * enemy.vz / enemy.az;
    enemy.vx = (tx - x) / duration;
    enemy.vy = (ty - y) / duration;
    const mag = Math.sqrt(enemy.vx ** 2 + enemy.vy ** 2);
    if (mag > maxJumpSpeed) {
        enemy.vx = maxJumpSpeed * enemy.vx / mag;
        enemy.vy = maxJumpSpeed * enemy.vy / mag;
    }
    enemy.setMode('jumping');
    enemy.params.discharge = new LightningDischarge({x, y, radius, damage: 4, source: enemy, tellDuration: 20 * duration});
    addEffectToArea(state, enemy.area, enemy.params.discharge);
}

const touchHit: HitProperties = { damage: 4, element: 'lightning'};
enemyDefinitions.electricSquirrel = {
    animations: electricSquirrelAnimations,
    acceleration: 0.2, aggroRadius: 112, speed: 3,
    life: 6, touchHit,
    lootTable: lifeLootTable,
    initialMode: 'chooseDirection',
    immunities: ['lightning'],
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        // Cannot be hit while jumping.
        if (enemy.mode === 'jumping') {
            return {};
        }
        if (enemy.mode !== 'recover') {
            if (hit.source?.getHitbox) {
                // If the hit has a source, try jumping to it
                const hitbox = hit.source.getHitbox(state);
                jumpTowardsPoint(state, enemy, {x: hitbox.x + hitbox.w / 2, y: hitbox.y + hitbox.h / 2});
            } else if (hit.knockback?.vx || hit.knockback?.vy) {
                // If the hit would knock the enemy back in a direction, jump in the opposite direction
                const enemyHitbox = enemy.getHitbox(state);
                const x = enemyHitbox.x + enemyHitbox.w / 2;
                const y = enemyHitbox.y + enemyHitbox.h / 2;
                jumpTowardsPoint(state, enemy, {x: x - 48 * (hit.knockback.vx || 0), y: y - 48 * (hit.knockback.vy || 0)});
            } else {
                // Jumpin a random direction otherwise.
                const theta = 2 * Math.PI * Math.random();
                const enemyHitbox = enemy.getHitbox(state);
                const x = enemyHitbox.x + enemyHitbox.w / 2;
                const y = enemyHitbox.y + enemyHitbox.h / 2;
                jumpTowardsPoint(state, enemy, {x: x + 48 * Math.cos(theta), y: y + 48 * Math.sin(theta)});
            }
            return {};
        }
        return enemy.defaultOnHit(state, hit);
    },
    update(this: void, state: GameState, enemy: Enemy) {
        enemy.isInvulnerable = (enemy.z > 4);
        enemy.touchHit = (enemy.z <= 0) ? touchHit : null;
        if (enemy.mode === 'pause') {
            if (enemy.modeTime % 100 === 0) {
                addSparkleAnimation(state, enemy.area, enemy.getHitbox(state), { element: 'lightning' });
            }
            enemy.changeToAnimation('idle');
            if (enemy.modeTime >= 1000) {
                enemy.setMode('chooseDirection');
            }
        } else if (enemy.mode === 'chooseDirection') {
            const theta = Math.floor(Math.random() * 4) * Math.PI / 2 + Math.PI / 4;
            enemy.vx = enemy.speed * Math.cos(theta);
            enemy.vy = enemy.speed * Math.sin(theta);
            enemy.d = getDirection(enemy.vx, enemy.vy);
            enemy.changeToAnimation('idle');
            enemy.setMode('run')
        } else if (enemy.mode === 'run') {
            if (enemy.modeTime % 100 === 0) {
                addSparkleAnimation(state, enemy.area, enemy.getHitbox(state), { element: 'lightning' });
            }
            enemy.changeToAnimation('move');
            // Pause sometime after moving for 4 seconds. Max time is theoretically 12s, but is likely much sooner.
            if (enemy.modeTime % 500 === 0 && Math.random() < (enemy.modeTime - 4000) / 8000) {
                enemy.setMode('pause');
            }
            // While running, jump at nearby targets if an attack is present.
            /*const target = getNearbyTarget(state, enemy, 64, enemy.area.allyTargets);
            if (target) {
                const foundAttack = enemy.area.effects.some(effect => effect.isPlayerAttack);
                if (foundAttack) {
                    const hitbox = target.getHitbox(state);
                    jumpTowardsPoint(state, enemy, {x: hitbox.x + hitbox.w / 2, y: hitbox.y + hitbox.h / 2});
                }
            }*/
            if (!moveEnemyFull(state, enemy, enemy.vx, 0, {canWiggle: false})) {
                enemy.vx = -enemy.vx;
            }
            if (!moveEnemyFull(state, enemy, 0, enemy.vy, {canWiggle: false})) {
                enemy.vy = -enemy.vy;
            }
            enemy.d = getDirection(enemy.vx, enemy.vy);
            enemy.changeToAnimation('idle');
        } else if (enemy.mode === 'jumping') {
            enemy.changeToAnimation('climbing');
            if (enemy.modeTime % 60 === 0) {
                addSparkleAnimation(state, enemy.area, enemy.getHitbox(state), { element: 'lightning' });
            }
            if (!moveEnemyFull(state, enemy, enemy.vx, 0, {})) {
                enemy.vx = -enemy.vx;
            }
            if (!moveEnemyFull(state, enemy, 0, enemy.vy, {})) {
                enemy.vy = -enemy.vy;
            }
            enemy.z += enemy.vz;
            enemy.vz = Math.max(-8, enemy.vz - 0.2);
            if (enemy.params.discharge) {
                const enemyHitbox = enemy.getHitbox(state);
                enemy.params.discharge.x = enemyHitbox.x + enemyHitbox.w / 2;
                enemy.params.discharge.y = enemyHitbox.y + enemyHitbox.h / 2;
            }
            if (enemy.z <= 0) {
                enemy.z = 0;
                enemy.setMode('recover');
                enemy.params.discharge = null;
            }
        } else if (enemy.mode === 'recover') {
            if (enemy.modeTime >= 500) {
                enemy.changeToAnimation('idle');
            }
            if (enemy.modeTime >= 1000) {
                enemy.setMode('chooseDirection');
            }
        }
    }
};

enemyDefinitions.superSquirrel = {
    animations: superElectricSquirrelAnimations,
    acceleration: 0.2, aggroRadius: 112, speed: 2.5, scale: 2,
    life: 12, touchHit,
    lootTable: lifeLootTable,
    initialMode: 'chooseDirection',
    immunities: ['lightning'],
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        // Cannot be hit while jumping.
        if (enemy.mode === 'jumping') {
            return {};
        }
        if (enemy.mode !== 'recover') {
            if (hit.source?.getHitbox) {
                // If the hit has a source, try jumping to it
                const hitbox = hit.source.getHitbox(state);
                jumpTowardsPoint(state, enemy, {x: hitbox.x + hitbox.w / 2, y: hitbox.y + hitbox.h / 2}, 48);
            } else if (hit.knockback?.vx || hit.knockback?.vy) {
                // If the hit would knock the enemy back in a direction, jump in the opposite direction
                const enemyHitbox = enemy.getHitbox(state);
                const x = enemyHitbox.x + enemyHitbox.w / 2;
                const y = enemyHitbox.y + enemyHitbox.h / 2;
                jumpTowardsPoint(state, enemy, {x: x - 48 * (hit.knockback.vx || 0), y: y - 48 * (hit.knockback.vy || 0)}, 48);
            } else {
                // Jumpin a random direction otherwise.
                const theta = 2 * Math.PI * Math.random();
                const enemyHitbox = enemy.getHitbox(state);
                const x = enemyHitbox.x + enemyHitbox.w / 2;
                const y = enemyHitbox.y + enemyHitbox.h / 2;
                jumpTowardsPoint(state, enemy, {x: x + 48 * Math.cos(theta), y: y + 48 * Math.sin(theta)}, 48);
            }
            return {};
        }
        return enemy.defaultOnHit(state, hit);
    },
    update(this: void, state: GameState, enemy: Enemy) {
        enemy.isInvulnerable = (enemy.z > 4);
        enemy.touchHit = (enemy.z <= 0) ? touchHit : null;
        if (enemy.mode === 'pause') {
            if (enemy.modeTime % 60 === 0) {
                addSparkleAnimation(state, enemy.area, enemy.getHitbox(state), { element: 'lightning' });
            }
            enemy.changeToAnimation('idle');
            if (enemy.modeTime >= 1000) {
                enemy.setMode('chooseDirection');
            }
        } else if (enemy.mode === 'chooseDirection') {
            enemy.changeToAnimation('idle');
            const theta = Math.floor(Math.random() * 4) * Math.PI / 2 + Math.PI / 4;
            enemy.vx = enemy.speed * Math.cos(theta);
            enemy.vy = enemy.speed * Math.sin(theta);
            enemy.setMode('run')
        } else if (enemy.mode === 'run') {
            if (enemy.modeTime % 60 === 0) {
                addSparkleAnimation(state, enemy.area, enemy.getHitbox(state), { element: 'lightning' });
            }
            enemy.changeToAnimation('move');
            // Pause sometime after moving for 4 seconds. Max time is theoretically 12s, but is likely much sooner.
            if (enemy.modeTime % 500 === 0 && Math.random() < (enemy.modeTime - 4000) / 8000) {
                enemy.setMode('pause');
            }
            if (!moveEnemyFull(state, enemy, enemy.vx, 0, {canWiggle: false})) {
                enemy.vx = -enemy.vx;
            }
            if (!moveEnemyFull(state, enemy, 0, enemy.vy, {canWiggle: false})) {
                enemy.vy = -enemy.vy;
            }
        } else if (enemy.mode === 'jumping') {
            enemy.changeToAnimation('climbing');
            if (enemy.modeTime % 60 === 0) {
                addSparkleAnimation(state, enemy.area, enemy.getHitbox(state), { element: 'lightning' });
            }
            if (!moveEnemyFull(state, enemy, enemy.vx, 0, {})) {
                enemy.vx = -enemy.vx;
            }
            if (!moveEnemyFull(state, enemy, 0, enemy.vy, {})) {
                enemy.vy = -enemy.vy;
            }
            enemy.z += enemy.vz;
            enemy.vz = Math.max(-8, enemy.vz - 0.2);
            if (enemy.params.discharge) {
                const enemyHitbox = enemy.getHitbox(state);
                enemy.params.discharge.x = enemyHitbox.x + enemyHitbox.w / 2;
                enemy.params.discharge.y = enemyHitbox.y + enemyHitbox.h / 2;
            }
            if (enemy.z <= 0) {
                enemy.z = 0;
                enemy.setMode('recover');
                enemy.params.discharge = null;
            }
        } else if (enemy.mode === 'recover') {
            if (enemy.modeTime >= 500) {
                enemy.changeToAnimation('idle');
            }
            if (enemy.modeTime >= 1000) {
                enemy.setMode('chooseDirection');
            }
        }
    }
};
