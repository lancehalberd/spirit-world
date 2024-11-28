
import { throwIceGrenadeAtLocation } from 'app/content/effects/frostGrenade';
import { getVectorToNearbyTarget } from 'app/utils/target';


type NearbyTargetType = ReturnType<typeof getVectorToNearbyTarget>;
export const iceGrenadeAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType) {
        enemy.changeToAnimation('prepare');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        enemy.changeToAnimation('attack');
        const hitbox = target.target.getHitbox();
        throwIceGrenadeAtLocation(state, enemy, {tx: hitbox.x + hitbox.w / 2, ty: hitbox.y + hitbox.h / 2}, {damage: 1, z: 20, source: enemy});
    },
    cooldown: 3000,
    initialCooldown: 1000,
    initialCharges: 0,
    charges: 1,
    prepTime: 200,
    recoverTime: 200,
};
