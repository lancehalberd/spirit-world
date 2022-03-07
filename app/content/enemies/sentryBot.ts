import {
    getVectorToNearbyTarget,
    paceAndCharge,
} from 'app/content/enemies';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {
    sentryBotAnimations,
} from 'app/content/enemyAnimations';
import { lifeLootTable } from 'app/content/lootTables';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getTileBehaviors, hitTargets } from 'app/utils/field';

import { Enemy, GameState } from 'app/types';

// const dischargeRadius = 48;
const dischargeW = 10;

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
        //const tileX = Math.floor(x / 16), tileY = Math.floor(y / 16);
        const { tileBehavior } = getTileBehaviors(state, enemy.area, {x, y});
        if (!tileBehavior?.low && tileBehavior?.solid) {
            return {x, y, mag: i, blocked: true};
        }
    }
    return {x: tx, y: ty, mag};
}

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
            const aimingTime = enemy.params.lasersLeft === 3 ? 500 : 200;
            if (!updateTarget(state, enemy, true)) {
                enemy.setMode('choose');
            } else if (enemy.modeTime >= aimingTime) {
                    enemy.setMode('fireLaser');
            }
        } else if (enemy.mode === 'fireLaser') {
            const chargeTime = enemy.params.lasersLeft === 3 ? 500 : 300;
            const hitbox = enemy.getHitbox(state);
            if (enemy.modeTime === chargeTime - 180) {
                const cx = hitbox.x + hitbox.w / 2;
                const cy = hitbox.y + hitbox.h / 2;
                const {x, y} = getEndOfLineOfSight(state, enemy, enemy.params.targetX, enemy.params.targetY);
                hitTargets(state, enemy.area, {
                    damage: 4,
                    hitRay: {
                        x1: cx,
                        y1: cy,
                        x2: x,
                        y2: y,
                        r: 5,
                    },
                    hitAllies: true,
                    knockAwayFromHit: true,
                });
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
            drawTargetingLine(context, state, enemy, x,  y);
        } else if (enemy.mode === 'fireLaser') {
            const {x, y, mag} = getEndOfLineOfSight(state, enemy, enemy.params.targetX, enemy.params.targetY);
            const cx = (hitbox.x + hitbox.w / 2) | 0;
            const cy = (hitbox.y + hitbox.h / 2) | 0;
            const chargeTime = enemy.params.lasersLeft === 3 ? 500 : 300;
            if (enemy.modeTime < chargeTime - 240) {
                drawTargetingLine(context, state, enemy, x, y);
            } else {
                context.save();
                    const laserFadeTime = enemy.modeTime - (chargeTime - 180);
                    context.globalAlpha = Math.max(0, 1 - laserFadeTime / 180);
                    context.translate(cx, cy);
                    const theta = Math.atan2(y - cy, x - cx);
                    context.rotate(theta);
                    // shoot a laser
                    // Create a linear gradient
                    const gradient = context.createLinearGradient(
                        0,
                        -dischargeW / 2,
                        0,
                        dischargeW / 2,
                    );

                    // Add color stops
                    gradient.addColorStop(0, "rgba(252,70,107,0)");
                    gradient.addColorStop(0.1, "rgba(252,70,107,0.2)");
                    gradient.addColorStop(0.2, "rgba(252,70,107,0.8)");
                    gradient.addColorStop(0.3, "rgba(251,63,215,1)");
                    gradient.addColorStop(0.4, "rgba(250,250,250,1)");
                    gradient.addColorStop(0.6, "rgba(250,250,250,1)");
                    gradient.addColorStop(0.7, "rgba(251,63,215,1)");
                    gradient.addColorStop(0.8, "rgba(252,70,107,0.8)");
                    gradient.addColorStop(0.9, "rgba(252,70,107,0.2)");
                    gradient.addColorStop(1, "rgba(252,70,107,0)");

                    // Set the fill style and draw a rectangle
                    context.fillStyle = gradient;
                    context.fillRect(0, -dischargeW / 2, mag, dischargeW);
                context.restore();
            }
        }
    },
};

function drawTargetingLine(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy, targetX: number, targetY: number): void {
    const hitbox = enemy.getHitbox(state);
    const cx = (hitbox.x + hitbox.w / 2) | 0;
    const cy = (hitbox.y + hitbox.h / 2) | 0;
    context.save();
        // Indicator of where the attack will hit.
        context.globalAlpha *= 0.7;
        context.strokeStyle = 'red';
        context.beginPath();
        context.moveTo(cx, cy);
        context.lineTo(targetX, targetY);
        context.stroke();
        //context.fillRect(cx - 1, cy, 2, 1000);
    context.restore();
}
