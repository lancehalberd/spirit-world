import {addLineOfSpikes, GroundSpike} from 'app/content/effects/groundSpike';
import {addEffectToArea} from 'app/utils/effects';
import {getNearbyTarget, getVectorToNearbyTarget} from 'app/utils/target';

export const groundSpikeAbility: EnemyAbility<Target> = {
    getTarget(this: void, state: GameState, enemy: Enemy): Target {
        return getNearbyTarget(state, enemy, enemy.enemyDefinition.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: Target) {
        enemy.changeToAnimation('attack');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: Target): void {
        const targetHitbox = target.getHitbox(state);
        const spike = new GroundSpike({
            x: targetHitbox.x + targetHitbox.w / 2,
            y: targetHitbox.y + targetHitbox.h / 2,
            damage: 4,
            source: enemy,
        });
        addEffectToArea(state, enemy.area, spike);
    },
    initialCooldown: 1500,
    cooldown: 1000,
    initialCharges: 0,
};

export const groundSpikeLineAbility: EnemyAbility<Vector> = {
    getTarget(this: void, state: GameState, enemy: Enemy): Vector {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: Vector) {
        enemy.changeToAnimation('attack');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: Vector): void {
        addLineOfSpikes({
            state, area: enemy.area,
            source: [enemy.x + enemy.w / 2 + target.x * 8, enemy.y + enemy.h / 2 + target.y * 8],
            target: [enemy.x + enemy.w / 2 + target.x * 32, enemy.y + enemy.h / 2 + target.y * 32],
            spikeProps: {source: enemy},
        });
    },
    cooldown: 5000,
    initialCharges: 0,
    charges: 1,
    prepTime: 200,
    recoverTime: 400,
};
