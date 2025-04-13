import {LightningBolt} from 'app/content/effects/lightningBolt';
import {FlameWall} from 'app/content/effects/flameWall';
import {throwIceGrenadeAtLocation} from 'app/content/effects/frostGrenade';
import {Enemy} from 'app/content/enemy';
import {FRAME_LENGTH} from 'app/gameConstants';
import {createAnimation, getFrame, reverseAnimation} from 'app/utils/animations';
import {enemyDefinitions} from 'app/content/enemies/enemyHash';
import {omniAnimation} from 'app/content/enemyAnimations';
import {rotateDirection} from 'app/utils/direction';
import {addEffectToArea} from 'app/utils/effects';

const flameIdolGeometry: FrameDimensions = {w: 48, h: 54, content: { x: 10, y: 30, w: 30, h: 22}};
const attackMap = [0, 3, 6, 9, 12, 15, 18, 21, 24, 28];
const flameIdolAttackAnimation: FrameAnimation = createAnimation('gfx/bosses/flameIdolCast.png', flameIdolGeometry, {cols: 29, duration: 3, frameMap: attackMap});
// This flame animation is played over the flame idol attack animation.
const flameIdolAttackFireAnimation: FrameAnimation = createAnimation('gfx/bosses/flameIdolCastFire.png', flameIdolGeometry, {cols: 29, duration: 3, frameMap: attackMap});
const flameIdolBreakingAnimation: FrameAnimation = createAnimation('gfx/bosses/flameIdolDestroyed.png', flameIdolGeometry, {cols: 4, duration: 3});
const flameIdolBrokenIdleAnimation: FrameAnimation = createAnimation('gfx/bosses/flameIdolDestroyedIdle.png', flameIdolGeometry, {cols: 5});
const flameIdolBrokenAttackAnimation: FrameAnimation = createAnimation('gfx/bosses/flameIdolDestroyedCast.png', flameIdolGeometry, {cols: 7, duration: 3});
const flameIdolIdleAnimation: FrameAnimation = createAnimation('gfx/bosses/flameIdolCast.png', flameIdolGeometry);
const flameIdolStillAnimation: FrameAnimation = createAnimation('gfx/bosses/flameIdolAwaken.png', flameIdolGeometry);
const flameIdolWakeAnimation: FrameAnimation = createAnimation('gfx/bosses/flameIdolAwaken.png', flameIdolGeometry, {x: 6, cols: 4, duration: 3}, {loop: false});
const flameIdolSleepAnimation: FrameAnimation = reverseAnimation(flameIdolWakeAnimation);
const flameIdolWarningAnimation: FrameAnimation = createAnimation('gfx/bosses/flameIdolAwaken.png', flameIdolGeometry, {x: 1, cols: 5});
// This glow animation is played over the idol during the warning mode.
const flameIdolGlowWarningAnimation: FrameAnimation = createAnimation('gfx/bosses/flameIdolGlow.png', flameIdolGeometry, {x: 1, cols: 3, frameMap:[0,1,2,1]});
// This glow animation is played over the idol during the broken idle animation.
// const flameIdolGlowBrokenAnimation: FrameAnimation = createAnimation('gfx/bosses/flameIdolGlow.png', flameIdolGeometry, { x: 4});

const flameIdolAnimations: ActorAnimations = {
    attack: omniAnimation(flameIdolAttackAnimation),
    breaking: omniAnimation(flameIdolBreakingAnimation),
    broken: omniAnimation(flameIdolBrokenIdleAnimation),
    brokenAttack: omniAnimation(flameIdolBrokenAttackAnimation),
    death: omniAnimation(flameIdolBrokenIdleAnimation),
    idle: omniAnimation(flameIdolIdleAnimation),
    still: omniAnimation(flameIdolStillAnimation),
    wake: omniAnimation(flameIdolWakeAnimation),
    sleep: omniAnimation(flameIdolSleepAnimation),
    warning: omniAnimation(flameIdolWarningAnimation),
};


const stormIdolGeometry: FrameDimensions = {w: 58, h: 54, content: { x: 21, y: 37, w: 17, h: 20}};
const stormIdolAttackAnimation: FrameAnimation = createAnimation('gfx/bosses/stormIdolCast.png', stormIdolGeometry, {cols: 14, duration: 3});
// This storm animation is played over the storm idol attack animation.
const stormIdolBreakingAnimation: FrameAnimation = createAnimation('gfx/bosses/stormIdolDestroyed.png', stormIdolGeometry, {cols: 4, duration: 3});
const stormIdolBrokenIdleAnimation: FrameAnimation = createAnimation('gfx/bosses/stormIdolDestroyedIdle.png', stormIdolGeometry, {cols: 4, duration: 3});
const stormIdolBrokenAttackAnimation: FrameAnimation = createAnimation('gfx/bosses/stormIdolDestroyedCast.png', stormIdolGeometry, {cols: 6, duration: 3});
const stormIdolIdleAnimation: FrameAnimation = createAnimation('gfx/bosses/stormIdolCast.png', stormIdolGeometry);
const stormIdolStillAnimation: FrameAnimation = createAnimation('gfx/bosses/stormIdolAwaken.png', stormIdolGeometry);
const stormIdolWakeAnimation: FrameAnimation = createAnimation('gfx/bosses/stormIdolAwaken.png', stormIdolGeometry, {x: 4, cols: 5, duration: 3}, {loop: false});
const stormIdolSleepAnimation: FrameAnimation = reverseAnimation(stormIdolWakeAnimation);
const stormIdolWarningAnimation: FrameAnimation = createAnimation('gfx/bosses/stormIdolAwaken.png', stormIdolGeometry, {x: 1, cols: 3});

const stormIdolAnimations: ActorAnimations = {
    attack: omniAnimation(stormIdolAttackAnimation),
    breaking: omniAnimation(stormIdolBreakingAnimation),
    broken: omniAnimation(stormIdolBrokenIdleAnimation),
    brokenAttack: omniAnimation(stormIdolBrokenAttackAnimation),
    death: omniAnimation(stormIdolBrokenIdleAnimation),
    idle: omniAnimation(stormIdolIdleAnimation),
    still: omniAnimation(stormIdolStillAnimation),
    wake: omniAnimation(stormIdolWakeAnimation),
    sleep: omniAnimation(stormIdolSleepAnimation),
    warning: omniAnimation(stormIdolWarningAnimation),
};

const frostIdolGeometry: FrameDimensions = {w: 48, h: 54, content: { x: 9, y: 32, w: 30, h: 22}};
const frostIdolAttackAnimation: FrameAnimation = createAnimation('gfx/bosses/frostIdolCast.png', frostIdolGeometry, {cols: 16, duration: 3, frameMap: [
    // Raise hands and make them glow
    14, 13, 12, 11, 10, 9, 8, 9, 8,
    // Hands slam together with energy burst
    5, 6, 7,
    // Energy fades away
    4, 3,
    // put hands down
    12, 13, 14,
]});
// This frost animation is played over the frost idol attack animation.
const frostIdolBreakingAnimation: FrameAnimation = createAnimation('gfx/bosses/frostIdolDestroyed.png', frostIdolGeometry, {cols: 4, duration: 3});
const frostIdolBrokenIdleAnimation: FrameAnimation = createAnimation('gfx/bosses/frostIdolDestroyedIdle.png', frostIdolGeometry, {cols: 5, duration: 4});
const frostIdolBrokenAttackAnimation: FrameAnimation = createAnimation('gfx/bosses/frostIdolDestroyedCast.png', frostIdolGeometry, {cols: 8, duration: 4});
const frostIdolIdleAnimation: FrameAnimation = createAnimation('gfx/bosses/frostIdolAwaken.png', frostIdolGeometry, {x: 10});
const frostIdolStillAnimation: FrameAnimation = createAnimation('gfx/bosses/frostIdolAwaken.png', frostIdolGeometry);
const frostIdolWakeAnimation: FrameAnimation = createAnimation('gfx/bosses/frostIdolAwaken.png', frostIdolGeometry, {x: 7, cols: 4, duration: 3}, {loop: false});
const frostIdolSleepAnimation: FrameAnimation = reverseAnimation(frostIdolWakeAnimation);
const frostIdolWarningAnimation: FrameAnimation = createAnimation('gfx/bosses/frostIdolAwaken.png', frostIdolGeometry, {x: 1, cols: 4});

const frostIdolAnimations: ActorAnimations = {
    attack: omniAnimation(frostIdolAttackAnimation),
    breaking: omniAnimation(frostIdolBreakingAnimation),
    broken: omniAnimation(frostIdolBrokenIdleAnimation),
    brokenAttack: omniAnimation(frostIdolBrokenAttackAnimation),
    death: omniAnimation(frostIdolBrokenIdleAnimation),
    idle: omniAnimation(frostIdolIdleAnimation),
    still: omniAnimation(frostIdolStillAnimation),
    wake: omniAnimation(frostIdolWakeAnimation),
    sleep: omniAnimation(frostIdolSleepAnimation),
    warning: omniAnimation(frostIdolWarningAnimation),
};

function onHitIdol(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
    // Idols take much less damage during their enraged phase.
    if (enemy.mode === 'enraged') {
        hit = {
            ...hit,
            damage: hit.damage / 4,
        }
    }
    return enemy.defaultOnHit(state, hit);
}
interface IdolParams {

}
const baseIdolDefinition: Partial<EnemyDefinition<IdolParams>> = {
    alwaysReset: true,
    scale: 1,
    isImmortal: true,
    life: 8, touchDamage: 1,
    onHit: onHitIdol,
    // Instead of rendering a shield, the health bars turn grey to indicate they are invulnerable.
    getShieldPercent: () => 0,
    afterUpdate(state: GameState, enemy: Enemy) {
        if (enemy.shielded) {
            enemy.healthBarColor = '#AAA';
        } else {
            delete enemy.healthBarColor;
        }
    }
};

enemyDefinitions.stormIdol = {
    ...baseIdolDefinition,
    naturalDifficultyRating: 8,
    animations: stormIdolAnimations,
    update: updateStormIdol,
    elementalMultipliers: {'fire': 1.5, 'ice': 1.5},
    immunities: ['lightning'],
};
enemyDefinitions.flameIdol = {
    ...baseIdolDefinition,
    naturalDifficultyRating: 8,
    animations: flameIdolAnimations,
    update: updateFlameIdol,
    elementalMultipliers: {'lightning': 1.5, 'ice': 2},
    immunities: ['fire'],
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        if (enemy.currentAnimationKey === 'attack') {
            const frame = getFrame(flameIdolAttackFireAnimation, enemy.animationTime);
            enemy.defaultRender(context, state, frame);
        }
        // Show additional warning glow animation on normal difficulty, but hide it on higher difficulties.
        if (enemy.currentAnimationKey === 'warning' && enemy.difficulty <= this.naturalDifficultyRating) {
            const frame = getFrame(flameIdolGlowWarningAnimation, enemy.animationTime);
            enemy.defaultRender(context, state, frame);
        }
        /*if (enemy.currentAnimationKey === 'brokenAttack') {
            const frame = getFrame(flameIdolAttackFireAnimation, enemy.animationTime);
            enemy.defaultRender(context, state, frame);
        }*/
    }
};
enemyDefinitions.frostIdol = {
    ...baseIdolDefinition,
    naturalDifficultyRating: 8,
    animations: frostIdolAnimations,
    update: updateFrostIdol,
    elementalMultipliers: {'lightning': 1.5, 'fire': 2},
    immunities: ['ice'],
};

function updateStormIdol(state: GameState, enemy: Enemy): void {
    updateElementalIdol(state, enemy, 8 * stormIdolAttackAnimation.frameDuration * FRAME_LENGTH, 180, () => {
        enemy.params.theta = (enemy.params.theta || 0) + Math.PI / 4;
        const lightningBolt = new LightningBolt({
            x: state.hero.x + state.hero.w / 2,
            y: state.hero.y + state.hero.h / 2,
            shockWaveTheta: enemy.params.theta,
            source: enemy,
        });
        addEffectToArea(state, enemy.area, lightningBolt);
    })
}
function updateFlameIdol(state: GameState, enemy: Enemy): void {
    updateElementalIdol(state, enemy, 4 * flameIdolAttackAnimation.frameDuration * FRAME_LENGTH, 180, () => {
        enemy.params.rotations = (enemy.params.rotations ?? Math.floor(Math.random() * 3)) + 1;
        const flameWall = new FlameWall({
            direction: rotateDirection('down', enemy.params.rotations),
            source: enemy,
        });
        addEffectToArea(state, enemy.area, flameWall);
    });
}
function updateFrostIdol(state: GameState, enemy: Enemy): void {
    updateElementalIdol(state, enemy,
        11 * frostIdolAttackAnimation.frameDuration * FRAME_LENGTH,
        5 * frostIdolBrokenAttackAnimation.frameDuration * FRAME_LENGTH,
        () => {
            enemy.params.theta = 2 * Math.PI * Math.random();
            const hitbox = enemy.getHitbox(state);
            throwIceGrenadeAtLocation(state, enemy, {
                tx: state.hero.x + state.hero.w / 2 + 16 * Math.cos(enemy.params.theta),
                ty: state.hero.y + state.hero.h / 2 + 16 * Math.sin(enemy.params.theta),
            }, {
                source: enemy,
                x: hitbox.x + 14,
                y: hitbox.y - 6,
            });
        }
    );
}

function updateElementalIdol(state: GameState, enemy: Enemy, attackTriggerTime: number, brokenAttackTriggerTime: number, triggerSpell: () => void) {
    // The statue is "destroyed" at 1 life, it will stay shielded and use its attack every 4 seconds
    // until all statues are "destroyed".
    if (enemy.life <= 0) {
        enemy.params.priority = undefined;
        if (!['broken', 'brokenAttack', 'breaking'].includes(enemy.currentAnimationKey)) {
            enemy.changeToAnimation('breaking', 'broken');
            enemy.shielded = true;
            enemy.invulnerableFrames = enemy.enemyInvulnerableFrames = 0;
        }
        if (enemy.currentAnimationKey === 'breaking') {
            return;
        }
        // When all bosses are at 1 life or lower, all the statues get destroyed.
        if (!enemy.area.objects.some(object =>
            object instanceof Enemy && object.definition?.type === 'boss' && object.life > 0
            && object.isFromCurrentSection(state)
        )) {
            enemy.showDeathAnimation(state);
            return;
        }
        /*if (enemy.currentAnimationKey !== 'broken' && enemy.currentAnimationKey !== 'brokenAttack') {
            const hitbox = enemy.getHitbox();
            enemy.addBossDeathEffect(state, {x: hitbox.x + hitbox.w / 2, y: hitbox.y - 14, w: 1, h: 1,});
            enemy.changeToAnimation('broken');
        }*/
        if (enemy.modeTime >= 4000 && enemy.currentAnimationKey !== 'brokenAttack') {
            enemy.changeToAnimation('brokenAttack', 'broken');
        }
        // Currently we use the same timing for all three statues, but this could be parameterized if necessary.
        if (enemy.currentAnimationKey === 'brokenAttack' && enemy.animationTime === brokenAttackTriggerTime) {
            triggerSpell();
            enemy.modeTime = 0;
        }
        return;
    }
    // This attack time is parameterized to match the animation of each idol.
    if (enemy.currentAnimationKey === 'attack' && enemy.animationTime === attackTriggerTime) {
        triggerSpell();
    }
    if (typeof enemy.params.priority === 'undefined') {
        enemy.params.priority = Math.random();
        enemy.setMode('shielded');
        enemy.shielded = true;
    }
    // Immediately put up shield on entering pinch mode.
    if (!enemy.params.pinchMode && enemy.life <= 4) {
        // Don't start pinch mode mid attack.
        if (enemy.currentAnimationKey !== 'attack') {
            enemy.params.pinchMode = true;
            enemy.setMode('enraged');
        }
        return;
    }
    // The idol does a single quick string of 4 attacks when enraged.
    if (enemy.mode === 'enraged') {
        if (enemy.currentAnimationKey === 'idle') {
            // Attacks at most once per second for 4 seconds.
            if (enemy.modeTime < 4000 && enemy.modeTime % 1000 < 500) {
                enemy.changeToAnimation('attack', 'idle');
            }
            if (enemy.modeTime >= 4000) {
                enemy.params.priority = Math.ceil(enemy.params.priority) + Math.random();
                enemy.changeToAnimation('sleep', 'still');
                enemy.shielded = true;
                enemy.invulnerableFrames = enemy.enemyInvulnerableFrames = 0;
            }
        }
        if (enemy.currentAnimationKey === 'still') {
            enemy.setMode('shielded');
        }
        return;
    }
    if (!enemy.area.objects.some(object => object instanceof Enemy && object.params.priority < enemy.params.priority)) {
        if (enemy.mode === 'attack') {
            if (enemy.currentAnimationKey === 'idle') {
                const timeLimit = enemy.params.pinchMode ? 2000 : 1000;
                if (enemy.modeTime < timeLimit && enemy.modeTime % 1000 < 500) {
                    enemy.changeToAnimation('attack', 'idle');
                }
                if (enemy.modeTime >= timeLimit) {
                    enemy.changeToAnimation('sleep', 'still');
                    enemy.shielded = true;
                    enemy.invulnerableFrames = enemy.enemyInvulnerableFrames = 0;
                }
            }
            if (enemy.currentAnimationKey === 'still') {
                enemy.setMode('shielded');
                enemy.params.priority = Math.ceil(enemy.params.priority) + Math.random();
            }
        } else {
            if (enemy.modeTime < 800) {
                enemy.changeToAnimation('warning');
            } else if (enemy.modeTime === 800) {
                enemy.changeToAnimation('wake', 'idle');
            } else if (enemy.modeTime >= 1000) {
                enemy.setMode('attack');
                enemy.shielded = false;
            }
        }
    } else {
        enemy.setMode('shielded');
        enemy.changeToAnimation('still');
        enemy.shielded = true;
    }
}
