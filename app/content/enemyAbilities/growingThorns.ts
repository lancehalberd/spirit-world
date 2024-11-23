import { GrowingThorn } from 'app/content/effects/growingThorn';
import { addEffectToArea } from 'app/utils/effects';
import { getVectorToNearbyTarget, getVectorToTarget, isTargetVisible } from 'app/utils/target';

export const growingThornsAbility: EnemyAbility<Target> = {
    getTarget(this: void, state: GameState, enemy: Enemy): Target {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets)?.target;
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: Target): void {
        enemy.changeToAnimation('growThorns');
    },
    updateAbility(this: void, state: GameState, enemy: Enemy, target: Target): boolean {
        // Cancel the ability if the target is no longer in range
        if (!isTargetVisible(state, enemy, target) || getVectorToTarget(state, enemy, target).mag > 160) {
            return false;
        }
        if (enemy.activeAbility.time % 600 === 300) { // 300, 900, 1500, 2100
            const targetHitbox = target.getHitbox();
            const thorns = new GrowingThorn({
                x: targetHitbox.x + targetHitbox.w / 2,
                y: targetHitbox.y + targetHitbox.h / 2,
                damage: 1,
            });
            addEffectToArea(state, enemy.area, thorns);
        }
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: Target): void {
        enemy.changeToAnimation('idle');
    },
    initialCooldown: 2000,
    cooldown: 5000,
    initialCharges: 0,
    // This is the duration of the actual attack
    prepTime: 2400,
    recoverTime: 1200,
};
