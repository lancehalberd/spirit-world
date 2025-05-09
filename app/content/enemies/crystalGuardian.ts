import { addParticleAnimations } from 'app/content/effects/animationEffect';
import { SpikePod } from 'app/content/effects/spikePod';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {groundSpikeLineAbility} from 'app/content/enemyAbilities/groundSpike';
import {
    crystalGuardianAnimations,
    // smallCrystalBarrierFlashFrame,
    smallCrystalBarrierNormalFrame,
    smallCrystalBarrierDamagedFrame,
    smallCrystalBarrierVeryDamagedFrame,
    crystalBarrierSmallParticles,
    crystalBarrierLargeParticles,
} from 'app/content/enemyAnimations';
import { FRAME_LENGTH } from 'app/gameConstants';
import { drawFrameCenteredAt } from 'app/utils/animations';
import { addEffectToArea } from 'app/utils/effects';
import { getVectorToNearbyTarget } from 'app/utils/target';


const maxShieldLife = 6;

type NearbyTargetType = ReturnType<typeof getVectorToNearbyTarget>;

const spikePodAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType) {
        enemy.changeToAnimation('spell');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        const {x, y} = target;
        // This should spawn in a fixed radius around the guardian in between it and the target.
        addEffectToArea(state, enemy.area, new SpikePod({
            x: enemy.x + enemy.w / 2 + 72 * x,
            y: enemy.y + enemy.h / 2 + 72 * y,
            damage: 2,
            source: enemy,
        }));
    },
    cooldown: 3000,
    initialCharges: 1,
    charges: 1,
    prepTime: 200,
    recoverTime: 1000,
};

enemyDefinitions.crystalGuardian = {
    naturalDifficultyRating: 5,
    alwaysReset: true,
    abilities: [{
        ...groundSpikeLineAbility,
        prepTime: crystalGuardianAnimations.attack.down.duration - 200
    }, spikePodAbility],
    params: {
        shieldLife: maxShieldLife,
        shieldInvulnerableTime: 0,
    },
    animations: crystalGuardianAnimations, aggroRadius: 128,
    life: 8, touchDamage: 2,
    canBeKnockedBack: false,
    // The damage from tile behaviors will trigger when the player attempts to move into the same pixel,
    // which is more specific than touch damage on enemies which requires actually being in the same pixel.
    // Touch damage gets added to this enemy when the shield goes down.
    tileBehaviors: {solid: true},
    elementalMultipliers: {'lightning': 1.5},
    getHitbox(enemy: Enemy): Rect {
        const hitbox = enemy.getDefaultHitbox();
        if (enemy.params.shieldLife) {
            const frame = smallCrystalBarrierNormalFrame;
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
                if (hit.isBonk && state.hero.savedData.activeTools.staff & 2) {
                    // The Tower Staff destroys the shield in a single hit.
                    enemy.params.shieldLife = 0;
                } else {
                    // Right now shield takes a flat 2 damage no matter the source.
                    enemy.params.shieldLife = Math.max(0, enemy.params.shieldLife - 2);
                }
                enemy.params.shieldInvulnerableTime = 100;
                enemy.makeSound(state, 'enemyHit');
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
            enemy.behaviors = { solid: true, touchHit: {damage: 2, source: null}};
        }
        if (enemy.params.shieldInvulnerableTime  > 0) {
            enemy.params.shieldInvulnerableTime -= FRAME_LENGTH;
        }
        if (!enemy.activeAbility) {
            if (enemy.invulnerableFrames > 0) {
                enemy.changeToAnimation('hurt');
            } else {
                enemy.changeToAnimation('idle');
            }
            if (enemy.enemyInvulnerableFrames <= 0) {
                enemy.useRandomAbility(state);
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
            frame = smallCrystalBarrierNormalFrame;
        } else if (enemy.params.shieldLife > maxShieldLife / 3) {
            frame = smallCrystalBarrierDamagedFrame;
        } else {
            frame = smallCrystalBarrierVeryDamagedFrame;
        }
        const hitbox = enemy.getHitbox();
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
    renderPreview(context: CanvasRenderingContext2D, enemy: Enemy, target?: Rect): void {
        enemy.defaultRenderPreview(context, target);
        drawFrameCenteredAt(context, smallCrystalBarrierNormalFrame, target || enemy.getHitbox());
        /*target = enemy.getHitbox();
        context.save();
            context.globalAlpha *= 0.8;
            context.fillStyle = 'white';
            context.fillRect(target.x, target.y, target.w, target.h);
        context.restore();*/
    },
};
