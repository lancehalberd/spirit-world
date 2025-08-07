import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { LightningDischarge } from 'app/content/effects/lightningDischarge';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {
    droneAnimations,
} from 'app/content/enemyAnimations';
import { lifeLootTable } from 'app/content/lootTables';
import { addEffectToArea } from 'app/utils/effects';
import {
    moveEnemyToTargetLocation,
    paceRandomly,
} from 'app/utils/enemies';
import { hitTargets } from 'app/utils/field';
import {
    getMovementAnchor,
    getVectorToMovementTarget,
    getVectorToNearbyTarget,
} from 'app/utils/target';


const chargeTime = 1000;
const dischargeRadius = 48;

const updateTarget = (state: GameState, enemy: Enemy): boolean => {
    const {target} = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets) ?? {};
    if (!target) {
        return false;
    }
    const vector = getVectorToMovementTarget(state, enemy, target)
    const {x, y, mag} = vector;
    const sourceAnchor = getMovementAnchor(enemy);
    // The idea here is to stop 40px away from the target
    enemy.params.targetX = sourceAnchor.x + x * Math.max(0, mag - 40);
    enemy.params.targetY = sourceAnchor.y + y * Math.max(0, mag - 40);
    return true;
}

enemyDefinitions.lightningDrone = {
    naturalDifficultyRating: 4,
    animations: droneAnimations,
    flying: true, acceleration: 0.2, aggroRadius: 112, speed: 2,
    life: 4, touchHit: { damage: 2, element: 'lightning', source: null},
    lootTable: lifeLootTable,
    immunities: ['lightning'],
    update(this: void, state: GameState, enemy: Enemy) {
        if (enemy.mode === 'choose') {
            paceRandomly(state, enemy);
            if (updateTarget(state, enemy)) {
                enemy.setMode('approach');
            }
        } else if (enemy.mode === 'walk') {
            paceRandomly(state, enemy);
        } else if (enemy.mode === 'approach') {
            if (!updateTarget(state, enemy)) {
                enemy.setMode('choose');
            } else if (enemy.modeTime >= 500) {
                if (moveEnemyToTargetLocation(state, enemy, enemy.params.targetX, enemy.params.targetY, 'idle') === 0) {
                    enemy.setMode('discharge');
                    const hitbox = enemy.getHitbox(state);
                    const discharge = new LightningDischarge({
                        x: hitbox.x + hitbox.w / 2,
                        y: hitbox.y + hitbox.h / 2,
                        tellDuration: chargeTime,
                        radius: dischargeRadius,
                        boundSource: enemy,
                        source: enemy,
                    });
                    addEffectToArea(state, enemy.area, discharge);
                }
            }
        } else if (enemy.mode === 'discharge') {
            enemy.animationTime = 0;
            // Draw some extra lightning over the drone while the discharge is charging.
            if (enemy.modeTime % 100 === 60) {
                addSparkleAnimation(state, enemy.area, enemy.getHitbox(state), { element: 'lightning' });
            }
            if (enemy.modeTime >= chargeTime) {
                enemy.setMode('choose');
            }
        }
        enemy.shielded = enemy.mode !== 'discharge';
        if (enemy.area !== state.areaInstance) {
            const hitbox = enemy.getHitbox(state);
            if (enemy.modeTime % 60 === 0) {
                addSparkleAnimation(state, state.areaInstance, hitbox, { element: 'lightning' });
            }
            hitTargets(state, state.areaInstance, {
                damage: 4,
                element: 'lightning',
                hitbox,
                // Hack to prevent damage from this attack when the hero has lightning blessing.
                hitAllies: !state.hero.savedData.passiveTools.lightningBlessing,
                hitObjects: true,
                hitTiles: true,
                hitEnemies: true,
                knockAwayFrom: {x: hitbox.x + hitbox.w / 2, y: hitbox.y + hitbox.h / 2},
                source: enemy,
            });
        }
    },
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        const hitbox = enemy.getHitbox(state);
        if (enemy.shielded) {
            context.strokeStyle = 'yellow';
            context.save();
                context.globalAlpha *= (0.7 + 0.3 * Math.random());
                context.beginPath();
                context.arc(hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2 - 2, hitbox.w / 2 + 3, 0, 2 * Math.PI);
                context.stroke();
            context.restore();
        }
    },
};
