import { LightningBolt } from 'app/content/effects/lightningBolt';
import { addEffectToArea } from 'app/utils/effects';
import { getVectorToNearbyTarget } from 'app/utils/target';


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
            source: enemy,
        });
        addEffectToArea(state, target.target.area, lightningBolt);
    },
    cooldown: 4000,
    initialCharges: 0,
    charges: 3,
    chargesRecovered: 3,
    prepTime: 0,
    recoverTime: 1000,
};

export const stationaryChargedLightningBoltAbility: EnemyAbility<Target> = {
    getTarget(this: void, state: GameState, enemy: Enemy): Target {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets)?.target;
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: Target) {
        enemy.changeToAnimation('attack');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: Target): void {
        const hitbox = target.getHitbox();
        const props = {
            damage: 4,
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2,
            delay: 800,
            shockWaves: 6,
            shockWaveTheta: 0,
            shockWaveDelta: Math.PI / 6,
            strikes: 2,
            source: enemy,
        }
        const lightningBolt = new LightningBolt(props);
        addEffectToArea(state, target.area, lightningBolt);
    },
    cooldown: 3000,
    recoverTime: 1000,
};

export const chargedLightningBoltAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType) {
        enemy.changeToAnimation('attack');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        enemy.params.theta = (enemy.params.theta || 0) + Math.PI / 4;
        const hitbox = enemy.getHitbox();
        const r = Math.max(hitbox.w / 2, hitbox.h / 2) + 24;
        const props = {
            damage: 4,
            x: hitbox.x + hitbox.w / 2 + r * target.x,
            y: hitbox.y + hitbox.h / 2 + r * target.y,
            vx: target.x,
            vy: target.y,
            delay: 800,
            shockWaves: 6,
            shockWaveTheta: enemy.params.theta,
            shockWaveDelta: 0, //Math.PI / 6,
            strikes: 4,
            source: enemy,
        }
        const lightningBolt = new LightningBolt(props);
        addEffectToArea(state, target.target.area, lightningBolt);
    },
    cooldown: 4000,
    initialCharges: 0,
    charges: 1,
    chargesRecovered: 1,
    prepTime: 0,
    recoverTime: 1000,
};
