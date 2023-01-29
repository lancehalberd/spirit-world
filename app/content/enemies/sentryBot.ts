import { addEffectToArea } from 'app/content/areas';
import { LaserBeam } from 'app/content/effects/laserBeam';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {
    sentryBotAnimations,
} from 'app/content/enemyAnimations';
import { lifeLootTable } from 'app/content/lootTables';
import { FRAME_LENGTH } from 'app/gameConstants';
import {
    paceAndCharge,
} from 'app/utils/enemies';
import { getTileBehaviors } from 'app/utils/field';
import { getVectorToNearbyTarget } from 'app/utils/target';

import { Enemy, GameState } from 'app/types';

const updateTarget = (state: GameState, enemy: Enemy, ignoreWalls: boolean = false): boolean => {
    const vector = getVectorToNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
    if (!vector) {
        return false;
    }
    const {x, y, mag} = vector;
    const hitbox = enemy.getHitbox(state);
    const tx = hitbox.x + hitbox.w / 2 + x * 1000, ty = hitbox.y + hitbox.h / 2 + y * 1000;
    const { mag: sightDistance } = getEndOfLineOfSight(state, enemy, tx, ty);
    if (!ignoreWalls && sightDistance < mag) {
        return false;
    }
    // The idea here is to target as far as possible beyond the target.
    enemy.params.targetX = tx;
    enemy.params.targetY = ty;
    return true;
};

function getEndOfLineOfSight(state: GameState, enemy: Enemy, tx: number, ty: number): {
    x: number,
    y: number,
    mag: number
    blocked?: boolean
} {
    const hitbox = enemy.getHitbox(state);
    const cx = hitbox.x + hitbox.w / 2;
    const cy = hitbox.y + hitbox.h / 2;
    const dx = tx - cx, dy = ty - cy;
    const mag = Math.sqrt(dx * dx + dy * dy);
    for (let i = 20; i < mag; i += 4) {
        const x = cx + i * dx / mag, y = cy + i * dy / mag;
        const { tileBehavior } = getTileBehaviors(state, enemy.area, {x, y});
        if (!tileBehavior?.low && tileBehavior?.solid) {
            return {x, y, mag: i, blocked: true};
        }
    }
    return {x: tx, y: ty, mag};
}

const chargeTime = 400;

enemyDefinitions.sentryBot = {
    animations: sentryBotAnimations,
    flying: false, acceleration: 0.2, aggroRadius: 112, speed: 2,
    life: 12, touchHit: { damage: 2, element: 'lightning'},
    lootTable: lifeLootTable,
    immunities: ['lightning'],
    canBeKnockedBack: false,
    update(this: void, state: GameState, enemy: Enemy) {
        if (enemy.params.laserCooldown > 0) {
            enemy.params.laserCooldown -= FRAME_LENGTH;
        }
        enemy.shielded = (enemy.params.laserCooldown ?? 0) <= 0 && enemy.mode !== 'stunned';
        if (enemy.mode === 'choose') {
            paceAndCharge(state, enemy);
            if ((enemy.params.laserCooldown ?? 0) <= 0 && updateTarget(state, enemy)) {
                enemy.params.lasersLeft = 3;
                enemy.setMode('prepareLaser');
            }
        } else if (enemy.mode === 'walk' || enemy.mode === 'knocked' || enemy.mode === 'stunned' || enemy.mode === 'charge') {
            paceAndCharge(state, enemy);
        } else if (enemy.mode === 'prepareLaser') {
            const aimingTime = enemy.params.lasersLeft === 3 ? 500 : 400;
            if (!updateTarget(state, enemy, true)) {
                enemy.setMode('choose');
            } else if (enemy.modeTime >= aimingTime) {
                    enemy.setMode('fireLaser');
            }
        } else if (enemy.mode === 'fireLaser') {
            const hitbox = enemy.getHitbox(state);
            if (enemy.modeTime === chargeTime - 180) {
                const cx = hitbox.x + hitbox.w / 2;
                const cy = hitbox.y + hitbox.h / 2;
                addEffectToArea(state, enemy.area, new LaserBeam({
                    sx: cx, sy: cy,
                    tx: enemy.params.targetX, ty: enemy.params.targetY,
                    radius: 5, damage: 4, duration: 200,
                }));
            }
            if (enemy.modeTime === chargeTime) {
                enemy.params.lasersLeft--;
                enemy.params.laserCooldown = 2000;
                if (enemy.params.lasersLeft > 0) {
                    enemy.setMode('prepareLaser');
                } else {
                    enemy.setMode('choose');
                }
            }
        }
    },
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        const hitbox = enemy.getHitbox(state);
        if (enemy.shielded) {
            context.strokeStyle = 'yellow';
            context.save();
                context.globalAlpha *= (0.7 + 0.3 * Math.random());
                context.beginPath();
                context.arc(hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, 16, 0, 2 * Math.PI);
                context.stroke();
            context.restore();
        }
        if (enemy.mode === 'prepareLaser') {
            const {x, y} = getEndOfLineOfSight(state, enemy, enemy.params.targetX, enemy.params.targetY);
            drawTargetingLine(context, state, enemy, x,  y, 'yellow');
        } else if (enemy.mode === 'fireLaser') {
            const {x, y} = getEndOfLineOfSight(state, enemy, enemy.params.targetX, enemy.params.targetY);
            if (enemy.modeTime < chargeTime - 180) {
                drawTargetingLine(context, state, enemy, x, y, 'red');
            }
        }
    },
};

function drawTargetingLine(
    context: CanvasRenderingContext2D, state: GameState,
    enemy: Enemy, targetX: number, targetY: number, color: string
): void {
    const hitbox = enemy.getHitbox(state);
    const cx = (hitbox.x + hitbox.w / 2) | 0;
    const cy = (hitbox.y + hitbox.h / 2) | 0;
    context.save();
        // Indicator of where the attack will hit.
        context.globalAlpha *= 0.7;
        context.strokeStyle = color;
        context.beginPath();
        context.moveTo(cx, cy);
        context.lineTo(targetX, targetY);
        context.stroke();
    context.restore();
}
