import { GrowingThorn } from 'app/content/effects/growingThorn';
import { Spike } from 'app/content/effects/arrow';
import { omniAnimation } from 'app/content/enemyAnimations';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { getVectorToTarget, isTargetVisible } from 'app/utils/target';
import { createAnimation } from 'app/utils/animations';
import { addEffectToArea } from 'app/utils/effects';
import { getVectorToNearbyTarget } from 'app/utils/target';

const mushroomGeometry: FrameDimensions = { w: 32, h: 32, content: {x: 2, y: 20, w: 28, h: 12} };
export const mushroomIdleAnimation = createAnimation('gfx/enemies/Mushroom-Monster.png', mushroomGeometry,
    { rows: 1/*2*/, duration: 20});
export const mushroomHurtAnimation = createAnimation('gfx/enemies/Mushroom-Monster.png', mushroomGeometry,
    { y: 2, cols: 2, duration: 5, frameMap: [1, 1, 0]}, {loop: false});
export const mushroomInflateAnimation = createAnimation('gfx/enemies/Mushroom-Monster.png', mushroomGeometry,
    { y: 3, cols: 2, duration: 10}, {loop: false});
export const mushroomDeflateAnimation = createAnimation('gfx/enemies/Mushroom-Monster.png', mushroomGeometry,
    { y: 4, cols: 1, duration: 20}, {loop: false});
export const mushroomGrowThornsAnimation = createAnimation('gfx/enemies/Mushroom-Monster.png', mushroomGeometry,
    { y: 5, cols: 4, duration: 10}, {loop: true});

export const mushroomAnimations: ActorAnimations = {
    idle: omniAnimation(mushroomIdleAnimation),
    hurt: omniAnimation(mushroomHurtAnimation),
    inflate: omniAnimation(mushroomInflateAnimation),
    deflate: omniAnimation(mushroomDeflateAnimation),
    growThorns: omniAnimation(mushroomGrowThornsAnimation),
    death: omniAnimation(mushroomHurtAnimation),
};

type NearbyTargetType = ReturnType<typeof getVectorToNearbyTarget>;

const spikeWaveAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, 80, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        enemy.changeToAnimation('inflate');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        enemy.changeToAnimation('deflate', 'idle');
        for (let i = 0; i < 8; i++) {
            const theta = 2 * Math.PI * i / 8;
            const dx = Math.cos(theta + i * Math.PI / 5 - 2 * Math.PI / 5);
            const dy = Math.sin(theta + i * Math.PI / 5 - 2 * Math.PI / 5);
            const hitbox = enemy.getHitbox();
            Spike.spawn(state, enemy.area, {
                x: hitbox.x + hitbox.w / 2 + hitbox.w / 4 * dx,
                y: hitbox.y + hitbox.h / 2 + hitbox.h / 4 * dy,
                z: 4,
                damage: 1,
                vx: 4 * dx,
                vy: 4 * dy,
            });
        }
    },
    cooldown: 3000,
    // The mushroom will inflate during the preparation
    prepTime: 1000,
    // The mushroom will deflated during the recovery time.
    recoverTime: 1000,
};
const growThornsAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        enemy.changeToAnimation('growThorns');
    },
    updateAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): boolean {
        // Cancel the ability if the target is no longer in range
        if (!isTargetVisible(state, enemy, target.target) || getVectorToTarget(state, enemy, target.target).mag > 160) {
            return false;
        }
        if (enemy.activeAbility.time % 600 === 300) { // 300, 900, 1500, 2100
            const targetHitbox = target.target.getHitbox();
            const thorns = new GrowingThorn({
                x: targetHitbox.x + targetHitbox.w / 2,
                y: targetHitbox.y + targetHitbox.h / 2,
                damage: 1,
            });
            addEffectToArea(state, enemy.area, thorns);
        }
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        enemy.changeToAnimation('idle');
    },
    cooldown: 5000,
    initialCharges: 0,
    // This is the duration of the actual attack
    prepTime: 2400,
    recoverTime: 1200,
};

enemyDefinitions.mushroom = {
    abilities: [spikeWaveAbility, growThornsAbility],
    alwaysReset: true,
    animations: mushroomAnimations, aggroRadius: 128,
    life: 8, touchDamage: 2, update: updateEnt,
    ignorePits: true,
    elementalMultipliers: {'fire': 2},
    // The damage from tile behaviors will trigger when the player attempts to move into the same pixel,
    // which is more specific than touch damage on enemies which requires actually being in the same pixel.
    tileBehaviors: {touchHit: { damage: 2}, solid: true},
    canBeKnockedBack: false,
};

function updateEnt(state: GameState, enemy: Enemy): void {
    enemy.useRandomAbility(state);
}
