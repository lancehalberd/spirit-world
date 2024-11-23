import { Enemy } from 'app/content/enemy';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { addSlamEffect } from 'app/content/bosses/golem';
import { moneyLootTable } from 'app/content/lootTables';
import { scurryAndChase } from 'app/utils/enemies';
import { addScreenShake, hitTargets } from 'app/utils/field';
import { getVectorToNearbyTarget } from 'app/utils/target';

enemyDefinitions.crusher = {
    ...enemyDefinitions.golemHand,
    naturalDifficultyRating: 8,
    life: 8,
    aggroRadius: 128,
    acceleration: 1, speed: 3,
    initialAnimation: 'idle',
    initialMode: 'choose',
    lootTable: moneyLootTable,
    showHealthBar: false,
    update(this: void, state: GameState, enemy: Enemy) {
        // animations are only defined for left/right directions, so force left.
        if (enemy.d !== 'left' && enemy.d !== 'right') {
            enemy.d = 'left';
        }
        if (enemy.mode === 'idle' || enemy.mode === 'choose' || enemy.mode === 'scurry') {
            enemy.changeToAnimation('idle');
            if (enemy.z < 30) {
                enemy.z++;
                return;
            }
            // Enemy hitbox is used for chasing player, but it includes z as a component of the y value, which we don't want in this case.
            // So temporarily set z to 0 while doing movement/targeting calculations.
            const tempZ = enemy.z;
            enemy.z = 0;
            scurryAndChase(state, enemy);
            const chaseVector = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
            enemy.z = tempZ;
            if (chaseVector?.mag < 10) {
                enemy.setMode('preparingSlam')
                enemy.vx = enemy.vy = 0;
            }
            // Otherwise move randomly near spawn point.
        } else if (enemy.mode === 'preparingSlam') {
            enemy.changeToAnimation('preparing');
            // HARD MODE: The hand can switch back to 'scurry' with higher chance based on how far the target is from the hand.
            if (enemy.z < 40) {
                enemy.z++;
            } else if (enemy.modeTime >= 400) {
                enemy.setMode('slamHand');
            }
        } else if (enemy.mode === 'slamHand') {
            enemy.changeToAnimation('slamming');
            enemy.z -= 3;
            if (enemy.z < 8) {
                const hitbox = {...enemy.getHitbox()};
                // Remove the z component from the hitbox to make the hit from the slam feel intuitive.
                hitbox.y += enemy.z;
                // This damage is higher than the same attack used by the hands during the Golem boss fight.
                // This allows this damage to stay relevant later into the game and the increased damage is less punishing outside of a boss fight.
                // The attack is well telegraphed and should generally be easy to dodge.
                // In the Tomb this enemy is near a save point, and the extra difficulty should help prepare players
                // to focus on dodging this attack during the boss fight.
                hitTargets(state, enemy.area, {
                    hitbox,
                    damage: 4,
                    knockAwayFromHit: true,
                    hitAllies: true,
                });
            }
            if (enemy.z <= 0) {
                enemy.z = 0;
                enemy.makeSound(state, 'bossDeath');
                if (enemy.area === state.areaInstance) {
                    addScreenShake(state, 0, 3);
                }
                addSlamEffect(state, enemy);
                enemy.setMode('stunned');
            }
        } else if (enemy.mode === 'stunned') {
            enemy.changeToAnimation('returning');
            if (enemy.modeTime >= 1000) {
                enemy.setMode('choose');
            }
        }
    },
};
