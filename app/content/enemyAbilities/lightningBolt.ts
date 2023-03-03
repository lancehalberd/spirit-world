import { LightningBolt } from 'app/content/effects/lightningBolt';
import { addEffectToArea } from 'app/utils/effects';
import { getVectorToNearbyTarget } from 'app/utils/target';

import { EnemyAbility, Enemy, GameState } from 'app/types';

type NearbyTargetType = ReturnType<typeof getVectorToNearbyTarget>;
export const lightningBoltAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType) {
        enemy.changeToAnimation('attack');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        enemy.params.theta = (enemy.params.theta || 0) + Math.PI / 4;
        const hitbox = target.target.getHitbox();
        const lightningBolt = new LightningBolt({
            damage: 4,
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2,
            shockWaveTheta: enemy.params.theta,
        });
        addEffectToArea(state, enemy.area, lightningBolt);
    },
    cooldown: 4000,
    initialCharges: 0,
    charges: 3,
    chargesRecovered: 3,
    prepTime: 0,
    recoverTime: 1000,
};
