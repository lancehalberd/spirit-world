import { omniAnimation } from 'app/content/enemyAnimations';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { createAnimation } from 'app/utils/animations';

const duration  = 6;
const octopusGeometry: FrameDimensions = { w: 100, h: 100, content: {x: 31, y: 50, w: 38, h: 25} };
export const octopusIdleAnimation = createAnimation('gfx/enemies/octopus-idle.png', octopusGeometry, {cols: 3, duration: 5, frameMap: [0,1,2,2,2,1,1,0,0]});
const octopusDashGeometry: FrameDimensions = { w: 80, h: 80, content: {x: 21, y: 40, w: 38, h: 25} };
export const octopusDashAnimation = createAnimation('gfx/enemies/octopus-dash.png', octopusDashGeometry, {x: 1, cols: 14, duration});
export const octopusSpinAttackAnimation = createAnimation('gfx/enemies/octopus-spin.png', octopusGeometry,
    { x: 1, cols: 18, duration, loopFrame: 9});
export const octopusSpinAttackEndAnimation = createAnimation('gfx/enemies/octopus-spin.png', octopusGeometry,
    { x: 19, cols: 3, duration, loop: false});

export const octopusAnimations: ActorAnimations = {
    idle: omniAnimation(octopusIdleAnimation),
    spinDash: omniAnimation(octopusDashAnimation),
    spinAttack: omniAnimation(octopusSpinAttackAnimation),
    spinAttackEnd: omniAnimation(octopusSpinAttackEndAnimation),
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
        }
        // After 4 seconds, finish the attack by transition back to the idle animation.
        if (enemy.currentAnimationKey !== 'spinAttack' || enemy.animationTime > 4000) {
            if (enemy.runAnimationSequence(['spinAttack', 'spinAttackEnd', 'idle'])) {
                enemy.setMode('choose');
            }
        }
    } else if (enemy.mode === 'spinDash') {
        if (enemy.currentAnimationKey !== 'spinDash' && enemy.modeTime < 100) {
            enemy.changeToAnimation('spinDash', 'idle');
        }
        if (enemy.currentAnimationKey !== 'spinDash') {
            enemy.setMode('choose');
        }
    } else {
        if (enemy.modeTime >= 5000) {
            if (Math.random() < 0.5) {
                enemy.setMode('spinAttack');
            } else {
                enemy.setMode('spinDash');
            }
        }
    }
    const targetZ = enemy.mode === 'choose' ? Math.max(12, state.hero.z - 8) : Math.max(Math.min(32, state.hero.z), 16);
    if (enemy.currentAnimationKey === 'idle') {
        // The octopus bobs up and down in time with its idle animation. The movement is slowed any time it
        // gets more than 4px away from its target z value.
        if (enemy.animationTime % enemy.currentAnimation.duration <= enemy.currentAnimation.duration / 3) {
            // Rise during the first half of the animation.
            const amountOver = Math.max(0, enemy.z - targetZ - 4);
            enemy.z += 0.6 / (1 + amountOver);
        } else {
            // Fall during the second half of the animation
            const amountOver = Math.max(0, targetZ - 4 - enemy.z);
            enemy.z -= 0.3 / (1 + amountOver);
        }
    } else {
        enemy.z = Math.min(Math.max(targetZ, enemy.z - 0.5), targetZ, enemy.z + 0.5);
    }
}
