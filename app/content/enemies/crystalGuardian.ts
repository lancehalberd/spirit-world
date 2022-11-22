import { addEffectToArea } from 'app/content/areas';
import { addParticleAnimations } from 'app/content/effects/animationEffect';
import { addLineOfSpikes } from 'app/content/effects/groundSpike';
import { SpikePod } from 'app/content/effects/spikePod';
import {
    getVectorToNearbyTarget,
} from 'app/content/enemies';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {
    entAnimations,
    crystalBarrierNormalAnimation,
    crystalBarrierDamagedAnimation,
    crystalBarrierVeryDamagedAnimation,
    crystalBarrierSmallParticles,
    crystalBarrierLargeParticles,
} from 'app/content/enemyAnimations';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getFrame, drawFrameCenteredAt } from 'app/utils/animations';
import { playSound } from 'app/musicController';

import { Enemy, Frame, GameState, HitProperties, HitResult, Rect } from 'app/types';

const maxShieldLife = 8;

enemyDefinitions.crystalGuardian = {
    alwaysReset: true,
    params: {
        shieldLife: maxShieldLife,
        shieldInvulnerableTime: 0,
    },
    animations: entAnimations, aggroRadius: 128,
    life: 8, touchDamage: 2,
    canBeKnockedBack: false,
    // The damage from tile behaviors will trigger when the player attempts to move into the same pixel,
    // which is more specific than touch damage on enemies which requires actually being in the same pixel.
    // Touch damage gets added to this enemy when the shield goes down.
    tileBehaviors: {solid: true},
    getHitbox(enemy: Enemy): Rect {
        const hitbox = enemy.getDefaultHitbox();
        if (enemy.params.shieldLife) {
            const frame = crystalBarrierNormalAnimation.frames[0];
            const w = (frame.content?.w ?? frame.w) * enemy.scale;
            const h = (frame.content?.h ?? frame.h) * enemy.scale;
            return {
                // Shield is horizontally centered over the eye.
                x: hitbox.x + (hitbox.w - w) / 2,
                // Shield hitbox is 16px below the bottom of the eye hitbox.
                y: hitbox.y + (hitbox.h - h),
                w, h,
            };
        }
        return hitbox;
    },
    getYDepth(enemy: Enemy): number {
        return enemy.y + 28;
    },
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        if (enemy.params.shieldLife > 0) {
            if (hit.canDamageCrystalShields && enemy.params.shieldInvulnerableTime <= 0) {
                // Right now shield takes a flat 2 damage no matter the source.
                enemy.params.shieldLife = Math.max(0, enemy.params.shieldLife - 2);
                enemy.params.shieldInvulnerableTime = 100;
                playSound('enemyHit');
                const hitbox = enemy.getHitbox();
                addParticleAnimations(state, enemy.area,
                    hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, 16, crystalBarrierSmallParticles,
                    {numberParticles: 3}, 8);
                addParticleAnimations(state, enemy.area,
                    hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, 16, crystalBarrierLargeParticles,
                    {numberParticles: 4}, 20);
                addParticleAnimations(state, enemy.area,
                    hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, 16, crystalBarrierSmallParticles,
                    {numberParticles: 6}, 32);
                // This makes the boss invulnerable without showing the damaged frame (which only shows)
                // if this value is greater than 10.
                // This is just to not immediately hit the eye when the shield first breaks.
                enemy.enemyInvulnerableFrames = 10;
                return { hit: true };
            }
            if (hit.canDamageCrystalShields) {
                return { hit: true };
            }
        }
        // Use the default hit behavior, the attack will be blocked if the shield is still up.
        return enemy.defaultOnHit(state, hit);
    },
    update(state: GameState, enemy: Enemy): void {
        enemy.shielded = enemy.params.shieldLife > 0;
        if (!enemy.shielded) {
            enemy.behaviors = { solid: true, touchHit: {damage: 2 }};
        }
        if (enemy.params.shieldInvulnerableTime  > 0) {
            enemy.params.shieldInvulnerableTime -= FRAME_LENGTH;
        }
        // Summon a pod once very 2 seconds if a target is nearby.
        if (enemy.modeTime % 3000 === 0) {
            const v = getVectorToNearbyTarget(state, enemy, enemy.enemyDefinition.aggroRadius, enemy.area.allyTargets);
            if (v) {
                const {x, y} = v;
                // This should spawn in a fixed radius around the guardian in between it and the target.
                addEffectToArea(state, enemy.area, new SpikePod({
                    x: enemy.x + enemy.w / 2 + 72 * x,
                    y: enemy.y + enemy.h / 2 + 72 * y,
                    damage: 2,
                }));
            }
        }
        if (enemy.modeTime % 5000 === 0) {
            const v = getVectorToNearbyTarget(state, enemy, enemy.enemyDefinition.aggroRadius, enemy.area.allyTargets);
            if (v) {
                addLineOfSpikes({
                    state, area: enemy.area,
                    source: [enemy.x + enemy.w / 2 + v.x * 8, enemy.y + enemy.h / 2 + v.y * 8],
                    target: [enemy.x + enemy.w / 2 + v.x * 32, enemy.y + enemy.h / 2 + v.y * 32],
                });
            }
        }
    },
    ignorePits: true,
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        if (enemy.params.shieldLife <= 0) {
            return;
        }
        let frame: Frame;
        if (enemy.params.shieldLife === maxShieldLife) {
            frame = getFrame(crystalBarrierNormalAnimation, enemy.animationTime);
        } else if (enemy.params.shieldLife > maxShieldLife / 3) {
            frame = getFrame(crystalBarrierDamagedAnimation, enemy.animationTime);
        } else {
            frame = getFrame(crystalBarrierVeryDamagedAnimation, enemy.animationTime);
        }
        const hitbox = enemy.getHitbox(state);
        drawFrameCenteredAt(context, frame, hitbox);

        // Debug the vector to where the pod will by created.
        /*const v = getVectorToNearbyTarget(state, enemy, enemy.enemyDefinition.aggroRadius, enemy.area.allyTargets);
        if (v) {
            context.beginPath();
            context.moveTo(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
            context.lineTo(enemy.x + enemy.w / 2 + v.x * 48, enemy.y + enemy.h / 2 + v.y * 48);
            context.strokeStyle = 'red';
            context.stroke();
        }*/
    },
    renderPreview(context: CanvasRenderingContext2D, enemy: Enemy, target: Rect): void {
        enemy.defaultRenderPreview(context, target);
        context.save();
            context.globalAlpha *= 0.8;
            context.fillStyle = 'white';
            context.fillRect(target.x, target.y, target.w, target.h);
        context.restore();
    },
};
