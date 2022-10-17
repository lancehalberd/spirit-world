import { addEffectToArea } from 'app/content/areas';
import { LightningBolt } from 'app/content/effects/lightningBolt';
import { FlameWall } from 'app/content/effects/flameWall';
import {
    throwIceGrenadeAtLocation,
} from 'app/content/enemies';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { fireIdolAnimations, iceIdolAnimations, lightningIdolAnimations } from 'app/content/enemyAnimations';
import { rotateDirection } from 'app/utils/field';


import { Enemy, GameState } from 'app/types';

enemyDefinitions.stormIdol = {
    alwaysReset: true,
    animations: lightningIdolAnimations, scale: 1,
    isImmortal: true,
    life: 8, touchDamage: 1, update: updateStormIdol, renderOver: renderIdolShield,
    immunities: ['lightning'],
};
enemyDefinitions.flameIdol = {
    alwaysReset: true,
    animations: fireIdolAnimations, scale: 1,
    isImmortal: true,
    life: 8, touchDamage: 1, update: updateFlameIdol, renderOver: renderIdolShield,
    immunities: ['fire'],
};
enemyDefinitions.frostIdol = {
    alwaysReset: true,
    animations: iceIdolAnimations, scale: 1,
    isImmortal: true,
    life: 8, touchDamage: 1, update: updateFrostIdol, renderOver: renderIdolShield,
    immunities: ['ice'],
};


function updateStormIdol(state: GameState, enemy: Enemy): void {
    enemy.params.shieldColor = 'yellow';
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
    enemy.params.shieldColor = 'red';
    updateElementalIdol(state, enemy, () => {
        enemy.params.rotations = (enemy.params.rotations ?? Math.floor(Math.random() * 3)) + 1;
        const flameWall = new FlameWall({
            direction: rotateDirection('down', enemy.params.rotations),
        });
        addEffectToArea(state, enemy.area, flameWall);
    });
}
function updateFrostIdol(state: GameState, enemy: Enemy): void {
    enemy.params.shieldColor = '#08F';
    updateElementalIdol(state, enemy, () => {
        enemy.params.theta = 2 * Math.PI * Math.random();
        throwIceGrenadeAtLocation(state, enemy, {
            tx: state.hero.x + state.hero.w / 2 + 16 * Math.cos(enemy.params.theta),
            ty: state.hero.y + state.hero.h / 2 + 16 * Math.sin(enemy.params.theta),
        });
    })
}

function updateElementalIdol(state: GameState, enemy: Enemy, attack: () => void) {
    // The statue is "destroyed" at 1 life, it will stay shielded and use its attack every 4 seconds
    // until all statues are "destroyed".
    if (enemy.life <= 0) {
        enemy.params.priority = undefined;
        // When all bosses are at 1 life or lower, all the statues get destroyed.
        if (!enemy.area.objects.some(object =>
            object instanceof Enemy && object.definition.type === 'boss' && object.life > 0
        )) {
            enemy.showDeathAnimation(state);
            return;
        }
        enemy.shielded = true;
        if (enemy.modeTime >= 4000) {
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
        enemy.shielded = true;
        return;
    }
    // The idol does a single quick string of 4 attacks when enraged.
    if (enemy.mode === 'enraged') {
        if (enemy.modeTime % 1000 === 500) {
            attack();
        }
        if (enemy.modeTime >= 4000) {
            enemy.params.priority = Math.ceil(enemy.params.priority) + Math.random();
            enemy.setMode('shielded');
        }
        return;
    }
    if (!enemy.area.objects.some(object => object instanceof Enemy && object.params.priority < enemy.params.priority)) {
        if (enemy.mode === 'attack') {
            if (!enemy.params.pinchMode) {
                if (enemy.modeTime === 200) {
                    enemy.changeToAnimation('attackBall');
                }
                if (enemy.modeTime === 1000) {
                    attack();
                    enemy.changeToAnimation('idle');
                }
            } else {
                if (enemy.modeTime === 500 || enemy.modeTime === 1000) {
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
            if (enemy.modeTime > 1000) {
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

function renderIdolShield(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
    if (enemy.shielded) {
        const hitbox = enemy.getHitbox(state);
        context.save();
            context.globalAlpha *= 0.5;
            context.fillStyle = enemy.params.shieldColor ?? '#888';
            context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
        context.restore();
    }
}
