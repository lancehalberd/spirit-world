import { omniAnimation } from 'app/content/enemyAnimations';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { createAnimation } from 'app/utils/animations';

const octopusGeometry: FrameDimensions = { w: 100, h: 100, content: {x: 31, y: 50, w: 38, h: 25} };
const image = 'gfx/enemies/octopus.png';
export const octopusIdleAnimation = createAnimation(image, octopusGeometry);
export const octopusSpinAttackAnimation = createAnimation(image, octopusGeometry,
    { x: 1, cols: 15, duration: 6}, {loopFrame: 9});

export const octopusAnimations: ActorAnimations = {
    idle: omniAnimation(octopusIdleAnimation),
    spinAttack: omniAnimation(octopusSpinAttackAnimation),
};


// TODO: keep the octopus hitbox from changing with its z position since we fight in underwater where the hero
// can easily change z position.
enemyDefinitions.octopus = {
    naturalDifficultyRating: 8,
    floating: true,
    abilities: [],
    alwaysReset: true,
    animations: octopusAnimations, aggroRadius: 160,
    life: 10, touchDamage: 2, update: updateOctopus,
    ignorePits: true,
    elementalMultipliers: {'lightning': 2},
    touchHit: {damage: 3, source: null},
    canBeKnockedBack: false,
    initialize(state: GameState, enemy: Enemy) {
    }
};

function updateOctopus(state: GameState, enemy: Enemy): void {
    enemy.useRandomAbility(state);
    if (enemy.mode === 'spinAttack') {
        if (enemy.currentAnimationKey !== 'spinAttack' && enemy.modeTime < 100) {
            enemy.changeToAnimation('spinAttack');
        }
        if (enemy.currentAnimationKey === 'spinAttack') {
            enemy.z = Math.min(Math.max(state.hero.z, 12), 32, enemy.z + 0.5);
        }
        if (enemy.currentAnimationKey === 'spinAttack' && enemy.animationTime > 4000) {
            enemy.changeToAnimation('spinAttack', 'idle');
        }
        if (enemy.currentAnimationKey === 'idle') {
            enemy.setMode('choose');
        }
    } else {
        enemy.z = Math.max(0, enemy.z - 0.2);
        if (enemy.modeTime >= 1000) {
            enemy.setMode('spinAttack');
        }
    }
}
