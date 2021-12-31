import { addSparkleAnimation } from 'app/content/animationEffect';
import {
    getVectorToNearbyTarget,
    moveEnemyToTargetLocation,
    paceRandomly,
} from 'app/content/enemies';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {
    droneAnimations,
} from 'app/content/enemyAnimations';
import { lifeLootTable } from 'app/content/lootTables';
import { hitTargets } from 'app/utils/field';

import { Enemy, GameState } from 'app/types';

const chargeTime = 1000;
const dischargeRadius = 48;

const updateTarget = (state: GameState, enemy: Enemy): boolean => {
    const vector = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    if (!vector) {
        return false;
    }
    const {x, y, mag} = vector;
    const hitbox = enemy.getHitbox(state);
    // The idea here is to stop 40px away from the target
    enemy.params.targetX = hitbox.x + hitbox.w / 2 + x * (mag - 40);
    enemy.params.targetY = hitbox.y + hitbox.h / 2 + y * (mag - 40);
    return true;
}

enemyDefinitions.lightningDrone = {
    animations: droneAnimations,
    flying: true, acceleration: 0.2, aggroRadius: 112, speed: 2,
    life: 4, touchHit: { damage: 2, element: 'lightning'},
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
                if (moveEnemyToTargetLocation(state, enemy, enemy.params.targetX, enemy.params.targetY) === 0) {
                    enemy.setMode('discharge');
                }
            }
        } else if (enemy.mode === 'discharge') {
            const hitbox = enemy.getHitbox(state);
            if (enemy.modeTime % 100 === 60) {
                addSparkleAnimation(state, enemy.area, hitbox, 'lightning');
            }
            if (enemy.modeTime >= chargeTime) {
                const cx = hitbox.x + hitbox.w / 2;
                const cy = hitbox.y + hitbox.h / 2;
                for (let i = 0; i < 6; i++) {
                    const theta = i * 2 * Math.PI / 6;
                    addSparkleAnimation(state, enemy.area, {
                        ...hitbox,
                        x: cx + 32 * Math.cos(theta) - 4,
                        y: cy + 32 * Math.sin(theta) - 4,
                        w: 8,
                        h: 8,
                    }, 'lightning');
                }
                hitTargets(state, enemy.area, {
                    damage: 4,
                    element: 'lightning',
                    hitCircle: {
                        x: cx,
                        y: cy,
                        r: dischargeRadius,
                    },
                    hitAllies: true,
                    hitObjects: true,
                    hitTiles: true,
                    hitEnemies: true,
                    knockAwayFrom: {x: cx, y: cy},
                });
                enemy.setMode('choose');
            }
        }
        enemy.shielded = enemy.mode !== 'discharge';
    },
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        const hitbox = enemy.getHitbox(state);
        if (enemy.shielded) {
            context.strokeStyle = 'yellow';
            context.save();
                context.globalAlpha *= (0.7 + 0.3 * Math.random());
                context.beginPath();
                context.arc(hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, hitbox.w / 2, 0, 2 * Math.PI);
                context.stroke();
            context.restore();
        }
        if (enemy.mode === 'discharge') {
            const p = Math.max(0, enemy.modeTime / chargeTime);
            context.save();
                // Darker yellow outline shows the full radius of the attack.
                context.globalAlpha *= 0.3;
                context.beginPath();
                context.arc(hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, dischargeRadius, 0, 2 * Math.PI);
                context.strokeStyle = 'yellow';
                context.stroke();
                // Lighter fill grows to indicate when the attack will hit.
                context.globalAlpha *= 0.3;
                context.beginPath();
                context.arc(hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, p * dischargeRadius, 0, 2 * Math.PI);
                context.fillStyle = 'yellow';
                context.fill();
            context.restore();
        }
    },
};
