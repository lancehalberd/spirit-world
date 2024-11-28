import { LaserBeam } from 'app/content/effects/laserBeam';
import { addEffectToArea } from 'app/utils/effects';
import { getEndOfLineOfSight, getVectorToNearbyTarget } from 'app/utils/target';


export const laserBeamAbility: EnemyAbility<Point> = {
        getTarget(this: void, state: GameState, enemy: Enemy): Point {
        const vector = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
        if (!vector) {
            return;
        }
        const {x, y, mag} = vector;
        const hitbox = enemy.getHitbox(state);
        const tx = hitbox.x + hitbox.w / 2 + x * 1000, ty = hitbox.y + hitbox.h / 2 + y * 1000;
        const { mag: sightDistance, targetIsBelow } = getEndOfLineOfSight(state, enemy, tx, ty);
        if (targetIsBelow || sightDistance < mag) {
            return;
        }
        // The idea here is to target as far as possible beyond the target.
        return {x: tx, y: ty};
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: Point): void {
        const hitbox = enemy.getHitbox(state);
        const cx = hitbox.x + hitbox.w / 2;
        const cy = hitbox.y + hitbox.h / 2;
        addEffectToArea(state, enemy.area, new LaserBeam({
            sx: cx, sy: cy,
            tx: target.x, ty: target.y,
            radius: 5, damage: 4, duration: 200, tellDuration: 800,
            source: enemy,
        }));
    },
    cooldown: 3000,
    prepTime: 0,
    recoverTime: 1000,
};

