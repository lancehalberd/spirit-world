import { LightningBolt } from 'app/content/effects/lightningBolt';
import { FlameWall } from 'app/content/effects/flameWall';
import { throwIceGrenadeAtLocation } from 'app/content/effects/frostGrenade';
import { Enemy } from 'app/content/enemy';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { fireIdolAnimations, iceIdolAnimations, lightningIdolAnimations } from 'app/content/enemyAnimations';
import { rotateDirection } from 'app/utils/direction';
import { addEffectToArea } from 'app/utils/effects';


import { GameState, HitProperties, HitResult } from 'app/types';

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

enemyDefinitions.stormIdol = {
    alwaysReset: true,
    animations: lightningIdolAnimations, scale: 1,
    isImmortal: true,
    life: 8, touchDamage: 1, update: updateStormIdol,
    elementalMultipliers: {'fire': 1.5, 'ice': 1.5},
    immunities: ['lightning'],
    onHit: onHitIdol,
};
enemyDefinitions.flameIdol = {
    alwaysReset: true,
    animations: fireIdolAnimations, scale: 1,
    isImmortal: true,
    life: 8, touchDamage: 1, update: updateFlameIdol,
    elementalMultipliers: {'lightning': 1.5, 'ice': 2},
    immunities: ['fire'],
    onHit: onHitIdol,
};
enemyDefinitions.frostIdol = {
    alwaysReset: true,
    animations: iceIdolAnimations, scale: 1,
    isImmortal: true,
    life: 8, touchDamage: 1, update: updateFrostIdol,
    elementalMultipliers: {'lightning': 1.5, 'fire': 2},
    immunities: ['ice'],
    onHit: onHitIdol,
};

function updateStormIdol(state: GameState, enemy: Enemy): void {
    updateElementalIdol(state, enemy, () => {
        enemy.params.theta = (enemy.params.theta || 0) + Math.PI / 4;
        const lightningBolt = new LightningBolt({
            x: state.hero.x + state.hero.w / 2,
            y: state.hero.y + state.hero.h / 2,
            shockWaveTheta: enemy.params.theta,
        });
        addEffectToArea(state, enemy.area, lightningBolt);
    })
}
function updateFlameIdol(state: GameState, enemy: Enemy): void {
    updateElementalIdol(state, enemy, () => {
        enemy.params.rotations = (enemy.params.rotations ?? Math.floor(Math.random() * 3)) + 1;
        const flameWall = new FlameWall({
            direction: rotateDirection('down', enemy.params.rotations),
        });
        addEffectToArea(state, enemy.area, flameWall);
    });
}
function updateFrostIdol(state: GameState, enemy: Enemy): void {
    updateElementalIdol(state, enemy, () => {
        enemy.params.theta = 2 * Math.PI * Math.random();
        throwIceGrenadeAtLocation(state, enemy, {
            tx: state.hero.x + state.hero.w / 2 + 16 * Math.cos(enemy.params.theta),
            ty: state.hero.y + state.hero.h / 2 + 16 * Math.sin(enemy.params.theta),
        });
    })
}

// attackBall: primary attack; attackBallDead: attack when idol is defeated
// use "wake" animation when transitioning to "living" animations, but not
// "defeated" or "dead" animations
function updateElementalIdol(state: GameState, enemy: Enemy, attack: () => void) {
    // Attack animations should revert to there "idle" state when completed.
    if (enemy.currentAnimationKey === 'attackBall') {
        if (enemy.animationTime >= enemy.currentAnimation.duration) {
            enemy.changeToAnimation('idle');
        }
    }
    if (enemy.currentAnimationKey === 'attackBallDead') {
        if (enemy.animationTime >= enemy.currentAnimation.duration) {
            enemy.changeToAnimation('broken');
        }
    }
    // The statue is "destroyed" at 1 life, it will stay shielded and use its attack every 4 seconds
    // until all statues are "destroyed".
    if (enemy.life <= 0) {
        enemy.params.priority = undefined;
        // When all bosses are at 1 life or lower, all the statues get destroyed.
        if (!enemy.area.objects.some(object =>
            object instanceof Enemy && object.definition?.type === 'boss' && object.life > 0
            && object.isFromCurrentSection(state)
        )) {
            enemy.showDeathAnimation(state);
            return;
        }
        enemy.shielded = true;
        if (enemy.modeTime < 3300) {
            enemy.changeToAnimation('broken');
        } else if (enemy.modeTime < 4000) {
            enemy.changeToAnimation('attackBallDead');
        } else {
            attack();
            enemy.setMode('attack');
        }
        return;
    }
    if (typeof enemy.params.priority === 'undefined') {
        enemy.params.priority = Math.random();
        enemy.setMode('shielded');
        enemy.shielded = true;
    }
    // Immediately put up shield on entering pinch mode.
    if (!enemy.params.pinchMode && enemy.life <= 4) {
        enemy.params.pinchMode = true;
        enemy.setMode('enraged');
        return;
    }
    // The idol does a single quick string of 4 attacks when enraged.
    if (enemy.mode === 'enraged') {
        if (enemy.modeTime % 1000 === 20) {
            enemy.changeToAnimation('attackBall');
        }
        if (enemy.modeTime % 1000 === 600) {
            attack();
        }
        if (enemy.modeTime >= 4000) {
            enemy.params.priority = Math.ceil(enemy.params.priority) + Math.random();
            enemy.setMode('shielded');
            enemy.shielded = true;
        }
        return;
    }
    if (!enemy.area.objects.some(object => object instanceof Enemy && object.params.priority < enemy.params.priority)) {
        if (enemy.mode === 'attack') {
            if (!enemy.params.pinchMode) {
                if (enemy.modeTime === 400) {
                    enemy.changeToAnimation('attackBall');
                }
                if (enemy.modeTime === 1000) {
                    attack();
                }
            } else {
                if (enemy.modeTime === 100 || enemy.modeTime === 1000) {
                    enemy.changeToAnimation('attackBall');
                }
                if (enemy.modeTime === 700 || enemy.modeTime === 1600) {
                    attack();
                }
            }
            if (enemy.modeTime >= 2000) {
                enemy.params.priority = Math.ceil(enemy.params.priority) + Math.random();
                enemy.setMode('shielded');
                enemy.changeToAnimation('still');
                enemy.shielded = true;
            }
        } else {
            enemy.changeToAnimation('warning');
            if (enemy.modeTime === 800) {
                enemy.changeToAnimation('wake');
            }
            if (enemy.modeTime >= 1000) {
                enemy.changeToAnimation('idle');
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
