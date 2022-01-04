import {
    getVectorToNearbyTarget,
    paceRandomly,
} from 'app/content/enemies';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {
    sentryBotAnimations,
} from 'app/content/enemyAnimations';
import { lifeLootTable } from 'app/content/lootTables';
import { hitTargets } from 'app/utils/field';

import { Enemy, GameState } from 'app/types';

const chargeTime = 500;
// const dischargeRadius = 48;
const dischargeW = 10;

const updateTarget = (state: GameState, enemy: Enemy): boolean => {
    const vector = getVectorToNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
    if (!vector) {
        return false;
    }
    const {x, y} = vector;
    const hitbox = enemy.getHitbox(state);
    // The idea here is to stop 40px away from the target
    enemy.params.targetX = hitbox.x + hitbox.w / 2 + x * 1000;
    enemy.params.targetY = hitbox.y + hitbox.h / 2 + y * 1000;
    return true;
}

enemyDefinitions.sentryBot = {
    animations: sentryBotAnimations,
    flying: false, acceleration: 0.2, aggroRadius: 112, speed: 2,
    life: 4, touchHit: { damage: 2, element: 'lightning'},
    lootTable: lifeLootTable,
    immunities: ['lightning'],
    update(this: void, state: GameState, enemy: Enemy) {
        if (enemy.mode === 'choose') {
            paceRandomly(state, enemy);
            if (updateTarget(state, enemy)) {
                enemy.setMode('prepareLaser');
            }
        } else if (enemy.mode === 'walk') {
            paceRandomly(state, enemy);
        } else if (enemy.mode === 'prepareLaser') {
            if (!updateTarget(state, enemy)) {
                enemy.setMode('choose');
            } else if (enemy.modeTime >= 500) {
                    enemy.setMode('fireLaser');
            }
        } else if (enemy.mode === 'fireLaser') {
            const hitbox = enemy.getHitbox(state);
            if (enemy.modeTime === chargeTime - 180) {
                const cx = hitbox.x + hitbox.w / 2;
                const cy = hitbox.y + hitbox.h / 2;
                hitTargets(state, enemy.area, {
                    damage: 4,
                    hitRay: {
                        x1: cx,
                        y1: cy,
                        x2: enemy.params.targetX,
                        y2: enemy.params.targetY,
                        r: 5,
                    },
                    hitAllies: true,
                    knockAwayFromHit: true,
                });
            }
            if (enemy.modeTime === chargeTime) {
                enemy.setMode('choose');
            }
        }
        enemy.shielded = true;
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
        if (enemy.mode === 'prepareLaser') {
            drawTargetingLine(context, state, enemy);
        } else if (enemy.mode === 'fireLaser') {
            const cx = (hitbox.x + hitbox.w / 2) | 0;
            const cy = (hitbox.y + hitbox.h / 2) | 0;
            if (enemy.modeTime < chargeTime - 240) {
                drawTargetingLine(context, state, enemy);
            } else {
                context.save();
                    const laserFadeTime = enemy.modeTime - (chargeTime - 180);
                    context.globalAlpha = Math.max(0, 1 - laserFadeTime / 180);
                    context.translate(cx, cy);
                    const theta = Math.atan2(enemy.params.targetY - cy, enemy.params.targetX - cx);
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
                    context.fillRect(0, -dischargeW / 2, 1000, dischargeW);
                context.restore();
            }
        }
    },
};

function drawTargetingLine(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
    const hitbox = enemy.getHitbox(state);
    const cx = (hitbox.x + hitbox.w / 2) | 0;
    const cy = (hitbox.y + hitbox.h / 2) | 0;
    context.save();
        // Indicator of where the attack will hit.
        context.globalAlpha *= 0.7;
        context.strokeStyle = 'red';
        context.moveTo(cx, cy);
        context.lineTo(enemy.params.targetX, enemy.params.targetY);
        context.stroke();
        //context.fillRect(cx - 1, cy, 2, 1000);
    context.restore();
}
