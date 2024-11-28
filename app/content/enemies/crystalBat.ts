import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {crystalProjectileArcAbility} from 'app/content/enemyAbilities/crystalProjectile';
import {crystalBatAnimations} from 'app/content/enemyAnimations';
import { moneyLootTable } from 'app/content/lootTables';
import {
    moveEnemyToTargetLocation,
    scurryRandomly,
} from 'app/utils/enemies';
import { pad } from 'app/utils/index';
import {  getVectorToNearbyTarget } from 'app/utils/target';




enemyDefinitions.crystalBat = {
    naturalDifficultyRating: 4,
    abilities: [crystalProjectileArcAbility],
    animations: crystalBatAnimations,
    flipLeft: true,
    speed: 1, flying: true,
    life: 4, touchHit: { damage: 1, source: null},
    lootTable: moneyLootTable,
    initialMode: 'chooseDirection',
    elementalMultipliers: {'lightning': 2},
    updateFlyingZ(this: void, state: GameState, enemy: Enemy) {
        if (enemy.action === 'knocked') {
            enemy.az = -0.2;
            return;
        }
        if (enemy.activeAbility) {
            if (enemy.activeAbility.time < enemy.activeAbility.definition.prepTime) {
                enemy.z = Math.min(32, enemy.z + 0.4);
                enemy.vz = 2;
            } else {
                enemy.z = Math.max(12, enemy.z + enemy.vz);
                enemy.vz = Math.max(-2, enemy.vz - 0.3);
            }
        } else {
            enemy.z = Math.max(Math.min(enemy.z + 1, 4), enemy.z + enemy.vz);
            // Bob up and down.
            if (enemy.z < 18 && enemy.az <= 0) {
                enemy.az = 0.3;
            } else if (enemy.z > 22 && enemy.az >= 0){
                enemy.az = -0.2;
            }
            enemy.vz = Math.max(-0.3, Math.min(0.4, enemy.vz + enemy.az));
        }
    },
    update(this: void, state: GameState, enemy: Enemy) {
        if (enemy.activeAbility) {
            if (enemy.modeTime % 100 === 0) {
                addSparkleAnimation(state, enemy.area, pad(enemy.getHitbox(state), -4), { element: 'ice' });
            }
            const attackDuration = crystalBatAnimations.attack.up.duration;
            if (enemy.activeAbility.time >= enemy.activeAbility.definition.prepTime + 400) {
                enemy.changeToAnimation('idle');
            } else if (enemy.currentAnimationKey !== 'attack') {
                // Time the attack animation so that it will finish right as the ability is used.
                if (enemy.activeAbility.time + attackDuration - 400 >= enemy.activeAbility.definition.prepTime) {
                    enemy.changeToAnimation('attack');
                }
            }
        } else {
            if (enemy.modeTime % 400 === 0) {
                addSparkleAnimation(state, enemy.area, pad(enemy.getHitbox(state), -4), { element: 'ice' });
            }
            // If not using an ability yet, attempt to use one.
            enemy.useRandomAbility(state);
            // If still not using an ability, then just move.
            if (!enemy.activeAbility) {
                const v = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
                if (v) {
                    if (v.x <= 0) {
                        enemy.d = 'left';
                    } else {
                        enemy.d = 'right';
                    }
                    enemy.changeToAnimation('idle');
                    if (v.mag < 20 || v.mag > 40) {
                        const targetHitbox = v.target.getHitbox(state);
                        const targetX = targetHitbox.x + targetHitbox.w / 2, targetY = targetHitbox.y + targetHitbox.h / 2;
                        const theta = Math.atan2(targetY - enemy.definition.y, targetX - enemy.definition.x);
                        const goalX = targetX - 32 * Math.cos(theta);
                        const goalY = targetY - 32 * Math.sin(theta);
                        moveEnemyToTargetLocation(state, enemy, goalX, goalY);
                        boundEnemyPosition(enemy);
                    } else {
                        scurryRandomly(state, enemy);
                        boundEnemyPosition(enemy);
                    }
                } else {
                    scurryRandomly(state, enemy);
                    boundEnemyPosition(enemy);
                }
            } else {
                // Face the target when choosing an ability.
                if (enemy.activeAbility.target.x <= 0) {
                    enemy.d = 'left';
                } else {
                    enemy.d = 'right';
                }
                enemy.changeToAnimation('idle');
            }
        }
    }
};

function boundEnemyPosition(enemy: Enemy) {
    enemy.x = Math.max(enemy.definition.x - 48, Math.min(enemy.definition.x + 48, enemy.x));
    enemy.y = Math.max(enemy.definition.y - 48, Math.min(enemy.definition.y + 48, enemy.y));
}
