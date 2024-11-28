import { CrystalSpike } from 'app/content/effects/arrow';
import { getVectorToNearbyTarget } from 'app/utils/target';


export const crystalProjectileAbility: EnemyAbility<Vector> = {
    getTarget(this: void, state: GameState, enemy: Enemy): Vector {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: Vector): void {
        const theta = Math.atan2(target.y, target.x);
        const dx = Math.cos(theta);
        const dy = Math.sin(theta);
        const hitbox = enemy.getHitbox();
        CrystalSpike.spawn(state, enemy.area, {
            ignoreWallsDuration: 200,
            x: hitbox.x + hitbox.w / 2 + hitbox.w / 4 * dx,
            y: hitbox.y + hitbox.h / 2 + hitbox.h / 4 * dy,
            damage: 2,
            vx: 4 * dx,
            vy: 4 * dy,
            source: enemy,
        });
    },
    cooldown: 4000,
    initialCharges: 0,
    charges: 1,
    prepTime: 200,
    recoverTime: 200,
};

export const crystalProjectileArcAbility: EnemyAbility<Vector> = {
    getTarget(this: void, state: GameState, enemy: Enemy): Vector {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: Vector): void {
        const theta = Math.atan2(target.y, target.x);
        for (let i = 0; i < 4; i++) {
            const dx = Math.cos(theta + i * Math.PI / 5 - 2 * Math.PI / 5);
            const dy = Math.sin(theta + i * Math.PI / 5 - 2 * Math.PI / 5);
            const hitbox = enemy.getHitbox();
            CrystalSpike.spawn(state, enemy.area, {
                ignoreWallsDuration: 200,
                x: hitbox.x + hitbox.w / 2 + hitbox.w / 4 * dx,
                y: hitbox.y + hitbox.h / 2 + hitbox.h / 4 * dy,
                damage: 2,
                vx: 4 * dx,
                vy: 4 * dy,
                source: enemy,
            });
        }
    },
    cooldown: 5000,
    initialCharges: 1,
    charges: 2,
    // During the prep time the bat will fly higher in the air.
    prepTime: 1000,
    // The bat will fall down during the recover time.
    recoverTime: 1000,
};

export const crystalNovaAbility: EnemyAbility<boolean> = {
    getTarget(this: void, state: GameState, enemy: Enemy): boolean {
        return !!getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets).target;
    },
    useAbility(this: void, state: GameState, enemy: Enemy): void {
        const hitbox = enemy.getHitbox();
        for (let i = 0; i < 8; i++) {
            const theta = 2 * Math.PI * i / 8;
            const dx = Math.cos(theta);
            const dy = Math.sin(theta);
            CrystalSpike.spawn(state, enemy.area, {
                ignoreWallsDuration: 200,
                x: hitbox.x + hitbox.w / 2 + hitbox.w / 4 * dx,
                y: hitbox.y + hitbox.h / 2 + hitbox.h / 4 * dy,
                damage: 2,
                vx: 2 * dx,
                vy: 2 * dy,
                source: enemy,
            });
        }
    },
    cooldown: 4000,
    initialCharges: 0,
    charges: 1,
    prepTime: 200,
    recoverTime: 200,
};

