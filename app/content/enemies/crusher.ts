import { Enemy } from 'app/content/enemy';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { addSlamEffect, golemHandAnimations } from 'app/content/bosses/golem';
import { moneyLootTable } from 'app/content/lootTables';

import { scurryAndChase } from 'app/utils/enemies';
import { addScreenShake, hitTargets } from 'app/utils/field';
import { getVectorToNearbyTarget } from 'app/utils/target';


enemyDefinitions.crusher = {
    animations: golemHandAnimations, life: 8, scale: 1,
    floating: true,
    flipRight: true,
    canBeKnockedBack: false, canBeKnockedDown: false,
    acceleration: 0.3, speed: 2,
    touchHit: { damage: 4, knockAwayFromHit: true},
    initialAnimation: 'idle',
    initialMode: 'choose',
    lootTable: moneyLootTable,
    update(this: void, state: GameState, enemy: Enemy) {
        // Prevent interacting with the hand when it is too high
        enemy.isInvulnerable = (enemy.z > 16);
        enemy.touchHit = enemy.mode === 'stunned' ? enemy.enemyDefinition.touchHit : null;

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
            }
            // Otherwise move randomly near spawn point.
        } else if (enemy.mode === 'preparingSlam') {
            enemy.changeToAnimation('preparing');
            if (enemy.z < 40) {
                enemy.z++;
            } else if (enemy.modeTime >= 300) {
                enemy.setMode('slamming');
            }
        } else if (enemy.mode === 'slamming') {
            enemy.changeToAnimation('slamming');
            enemy.z -= 3;
            if (enemy.z < 8) {
                const hitbox = {...enemy.getHitbox()};
                // Remove the z component from the hitbox to make the hit from the slam feel intuitive.
                hitbox.y += enemy.z;
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
