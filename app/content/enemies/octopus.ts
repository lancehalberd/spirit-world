import {addSparkleAnimation} from 'app/content/effects/animationEffect';
import {Blast} from 'app/content/effects/blast';
import {omniAnimation} from 'app/content/enemyAnimations';
import {enemyDefinitions} from 'app/content/enemies/enemyHash';
import {FRAME_LENGTH} from 'app/gameConstants';
import {createAnimation} from 'app/utils/animations';
import {addEffectToArea} from 'app/utils/effects';
import {getNearbyTarget, getTargetingAnchor} from 'app/utils/target';

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

const targetedDischargeAbility = {
    getTarget(state: GameState, enemy: Enemy): Target {
        return getNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(state: GameState, enemy: Enemy, target: Target): void {
        enemy.changeToAnimation('spinAttack');
        const anchor = getTargetingAnchor(target);
        const discharge = new Blast({
            x: anchor.x,
            y: anchor.y,
            damage: 4,
            element: 'lightning',
            radius: 40,
            source: enemy,
            hitProperties: {
                hitEnemies: false,
            },
        });
        addEffectToArea(state, enemy.area, discharge);
    },
    updateAbility(this: void, state: GameState, enemy: Enemy, target: boolean) {
        const hitbox = enemy.getHitbox(state);
        if (enemy.activeAbility.time % (2 * FRAME_LENGTH) === 0) {
            const theta = -Math.PI - enemy.activeAbility.time / FRAME_LENGTH / 2 * Math.PI / 8;
            addSparkleAnimation(state, enemy.area, {
                x: hitbox.x + hitbox.w / 2 + 60 * Math.cos(theta) - 1,
                y: hitbox.y + hitbox.h / 2 + 30 * Math.sin(theta) - 1,
                w: 2,
                h: 2,
            }, { element: 'lightning', velocity: {x: 0, y: 0, z: 6}});
        }
    },
    useAbility(state: GameState, enemy: Enemy, target: Target): void {
        enemy.changeToAnimation('spinAttackEnd', 'idle');
    },
    globalCooldown: 500,
    cooldown: 5000,
    prepTime: 1000,
    recoverTime: 400,
    initialCharges: 3,
    charges: 3,
    chargesRecovered: 3,
}


// TODO: keep the octopus hitbox from changing with its z position since we fight in underwater where the hero
// can easily change z position.
enemyDefinitions.octopus = {
    naturalDifficultyRating: 10,
    floating: true,
    abilities: [targetedDischargeAbility],
    alwaysReset: true,
    animations: octopusAnimations, aggroRadius: 192,
    life: 16, touchDamage: 2, update: updateOctopus,
    ignorePits: true,
    elementalMultipliers: {'lightning': 2},
    touchHit: {damage: 3, source: null},
    canBeKnockedBack: false,
    initialize(state: GameState, enemy: Enemy) {
    }
};

function updateOctopus(state: GameState, enemy: Enemy): void {
    enemy.useRandomAbility(state);
    if (enemy.activeAbility) {
        return;
    }
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
