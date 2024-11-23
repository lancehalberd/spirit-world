import {growingThornsAbility} from 'app/content/enemyAbilities/growingThorns';
import { Spike } from 'app/content/effects/arrow';
import { omniAnimation } from 'app/content/enemyAnimations';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { createAnimation } from 'app/utils/animations';
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


enemyDefinitions.mushroom = {
    naturalDifficultyRating: 5,
    abilities: [spikeWaveAbility, growingThornsAbility],
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
