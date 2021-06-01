import _ from 'lodash';
import { AnimationEffect } from 'app/content/animationEffect';
import { addObjectToArea } from 'app/content/areas';
import { Frost } from 'app/content/effects/frost';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {
    getVectorToNearbyTarget,
    throwIceGrenadeAtLocation,
} from 'app/content/enemies';
import { enemyDeathAnimation, snakeAnimations } from 'app/content/enemyAnimations';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation } from 'app/utils/animations';
import { playSound } from 'app/utils/sounds';
import { getDirection, hitTargets } from 'app/utils/field';


import { Enemy, GameState, HitProperties, HitResult } from 'app/types';


const peachAnimation = createAnimation('gfx/hud/icons.png', {w: 18, h: 18, content: {x: 1, y: 1, w: 16, h: 16}}, {x: 3});
const peachAnimations = {
    idle: {
        up: peachAnimation,
        down: peachAnimation,
        left: peachAnimation,
        right: peachAnimation,
    }
}

enemyDefinitions.frostHeart = {
    animations: peachAnimations, life: 16, scale: 3, touchDamage: 1, update: updateFrostHeart, params: {
        chargeLevel: 0,
        enrageLevel: 0,
        shieldLife: 8,
    },
    render: renderIceShield,
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        // If the shield is up, only fire damage can hurt it.
        if (enemy.params.shieldLife > 0) {
            if (hit.damage && hit.element === 'fire') {
                if (enemy.enemyInvulnerableFrames > 0) {
                    return {};
                }
                enemy.params.shieldLife = Math.max(0, enemy.params.shieldLife - hit.damage);
                enemy.enemyInvulnerableFrames = 20;
                playSound('enemyHit');
                return { hit: true };
            }
        }
        // Ice damage will regenerate the shield.
        if (hit.damage && hit.element === 'ice') {
            if (enemy.blockInvulnerableFrames > 0) {
                return {};
            }
            console.log('healed shield', enemy.params.shieldLife, hit.damage, state.time);
            enemy.params.shieldLife = Math.min(8, enemy.params.shieldLife + hit.damage);
            console.log('healed shield', enemy.params.shieldLife);
            enemy.blockInvulnerableFrames = 30;
            playSound('blocked');
            return { hit: true };
        }
        // Use the default hit behavior, the attack will be blocked if the shield is still up.
        return enemy.defaultOnHit(state, hit);
    }
};
enemyDefinitions.frostSerpent = {
    animations: snakeAnimations, life: 48, scale: 3, touchDamage: 2, update: updateFrostSerpent, flipRight: true,
    params: {
        submerged: true,
    },
};

function updateFrostHeart(this: void, state: GameState, enemy: Enemy): void {
    // The frost heart does nothing when attacking it from under the water.
    if (enemy.area.underwater) {
        enemy.shielded = false;
        return;
    }
    if (enemy.params.enrageTime > 0) {
        enemy.params.enrageTime -= FRAME_LENGTH;
        if (enemy.modeTime % 100 == 0) {
            const theta = 2 * Math.PI * Math.random();
            throwIceGrenadeAtLocation(state, enemy, {
                tx: state.hero.x + state.hero.w / 2 + 16 * Math.cos(theta),
                ty: state.hero.y + state.hero.h / 2 + 16 * Math.sin(theta),
            }, 2);
            enemy.params.shieldLife = Math.min(8, enemy.params.shieldLife + 1);
        }
        return;
    }
    enemy.shielded = enemy.params.shieldLife > 0;
    let chargeRate = 20;
    if (enemy.life < 16) chargeRate += 10;
    if (enemy.life < 10) chargeRate += 10;
    if (enemy.life < 8) chargeRate += 20;
    if (enemy.life <= 10 && enemy.params.enrageLevel === 0) {
        enemy.params.enrageLevel = 1;
        enemy.params.enrageTime = 4000;
        enemy.params.shieldLife++;
        enemy.modeTime = 0;
    } else if (enemy.life <= 4 && enemy.params.enrageLevel === 1) {
        enemy.params.enrageLevel = 2;
        enemy.params.enrageTime = 6000;
        enemy.params.shieldLife++;
        enemy.modeTime = 0;
    }
    enemy.params.chargeLevel = (enemy.params.chargeLevel || 0) + chargeRate;
    if (enemy.params.chargeLevel >= 4000) {
        enemy.params.chargeLevel = 0;
        const theta = 2 * Math.PI * Math.random();
        throwIceGrenadeAtLocation(state, enemy, {
            tx: state.hero.x + state.hero.w / 2 + 16 * Math.cos(theta),
            ty: state.hero.y + state.hero.h / 2 + 16 * Math.sin(theta),
        }, 2);
    }
}


function renderIceShield(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
    if (enemy.area?.underwater || enemy.params.shieldLife <= 0) {
        return;
    }
    const hitbox = enemy.getHitbox(state);
    context.save();
        context.globalAlpha *= (0.5 + 0.5 * enemy.params.shieldLife / 8);
        context.fillStyle = 'white';
        context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
    context.restore();
}


function updateFrostSerpent(this: void, state: GameState, enemy: Enemy): void {
    // The frost heart does nothing when attacking it from under the water.
    if (enemy.area.underwater) {
        // Underwater behavior
        return;
    }
    if (enemy.status === 'hidden' && !enemy.params.submerged) {
        enemy.status = 'normal';
    } else if (enemy.status === 'normal' && enemy.params.submerged) {
        enemy.status = 'hidden';
    }
    const heart = enemy.area.enemyTargets.find(target => target instanceof Enemy && target.definition.enemyType === 'frostHeart') as Enemy;
    const isEnraged = !heart || heart.life <= 1;
    if (isEnraged) {
        // Enraged behavior
    }
    if (enemy.mode === 'regenerate') {
        if (enemy.modeTime % 500 === 0) {
            enemy.life += 1;
        }
        if (enemy.life >= enemy.enemyDefinition.life) {
            enemy.setMode('swimming');
        }
        return;
    }
    if (enemy.life < 32) {
        const hitbox = enemy.getHitbox(state);
        const deathAnimation = new AnimationEffect({
            animation: enemyDeathAnimation,
            x: hitbox.x + hitbox.w / 2 - enemyDeathAnimation.frames[0].w / 2 * enemy.scale,
            // +1 to make sure the explosion appears in front of enemies the frame they die.
            y: hitbox.y + hitbox.h / 2 - enemyDeathAnimation.frames[0].h / 2 * enemy.scale + 1,
            scale: enemy.scale,
        });
        addObjectToArea(state, enemy.area, deathAnimation);
        enemy.setMode('regenerate');
        enemy.params.submerged = true;
        return;
    }
    if (enemy.params.submerged) {
        if (enemy.modeTime >= 3000) {
            const target = _.sample(enemy.area.allyTargets);
            const hitbox = target.getHitbox(state);
            const dx = hitbox.x + hitbox.w / 2 - 256;
            const dy = hitbox.y + hitbox.h / 2 - 256;
            const theta = Math.atan2(dy, dx);
            const enemyHitbox = enemy.getHitbox(state);
            enemy.x = 256 + Math.cos(theta) * 64 - enemyHitbox.w / 2;
            enemy.y = 256 + Math.sin(theta) * 64 - enemyHitbox.h / 2;
            enemy.params.submerged = false;
            enemy.params.attacksLeft = 3;
            if (!heart || heart.life <= 10) enemy.params.attacksLeft++;
            if (!heart || heart.life <= 4) enemy.params.attacksLeft++;
            enemy.setMode('chooseTarget');
            // Destroy the ice where the serpent emerges.
            hitTargets(state, enemy.area, {
                element: 'fire',
                hitCircle: {
                    x: enemy.x + enemyHitbox.w / 2,
                    y: enemy.y + enemyHitbox.h / 2,
                    r: 36,
                },
                hitTiles: true,
            })
        }
        return;
    }
    if (enemy.mode === 'chooseTarget') {
        if (enemy.modeTime < 1000) {
            return;
        }
        if (enemy.params.attacksLeft <= 0) {
            enemy.params.submerged = true;
            enemy.setMode('swimming');
            return;
        }
        enemy.params.attacksLeft--;
        const range = 96;
        const shieldVector = getVectorToNearbyTarget(state, enemy, range, [heart]);
        // If the shield is gone, always prioritize restoring the shield.
        if (shieldVector && heart.params.shieldLife <= 0) {
            enemy.d = getDirection(shieldVector.x, shieldVector.y);
            enemy.params.attackTheta = atan3(shieldVector.y, shieldVector.x);
            enemy.setMode('frostBreath');
            return;
        }
        let attackVector = getVectorToNearbyTarget(state, enemy, range, enemy.area.allyTargets);
        if (attackVector) {
            enemy.d = getDirection(attackVector.x, attackVector.y);
            enemy.params.attackTheta = atan3(attackVector.y, attackVector.x);
            enemy.setMode('frostBreathArc');
            return;
        }
        if (shieldVector && heart.params.shieldLife < 8) {
            enemy.d = getDirection(shieldVector.x, shieldVector.y);
            enemy.params.attackTheta = atan3(shieldVector.y, shieldVector.x);
            enemy.setMode('frostBreath');
            return;
        }
        attackVector = getVectorToNearbyTarget(state, enemy, range, enemy.area.neutralTargets.filter(o => o.definition?.type === 'torch' && o.status === 'active'));
        if (attackVector) {
            enemy.d = getDirection(attackVector.x, attackVector.y);
            enemy.params.attackTheta = atan3(attackVector.y, attackVector.x);
            enemy.setMode('frostBreath');
            return;
        }
        return;
    }
    if (enemy.mode === 'frostBreath' || enemy.mode === 'frostBreathArc') {
        if (enemy.modeTime % 40 === 0) {
            // Track a nearby target when using the frostBreathArc attack, otherwise attack in the same direction.
            if (enemy.mode === 'frostBreathArc') {
                const attackVector = getVectorToNearbyTarget(state, enemy, 64, enemy.area.allyTargets);
                if (attackVector) {
                    const targetTheta = atan3(attackVector.y, attackVector.x);
                    const dTheta = targetTheta - enemy.params.attackTheta;
                    if ((dTheta > 0 && dTheta <= Math.PI) || dTheta <= -Math.PI) {
                        enemy.params.attackTheta = (enemy.params.attackTheta + 0.05) % (2 * Math.PI);
                    } else if ((dTheta < 0 && dTheta >= -Math.PI) || dTheta >= Math.PI) {
                        enemy.params.attackTheta = (enemy.params.attackTheta - 0.05 + 2 * Math.PI) % (2 * Math.PI);
                    }
                    enemy.d = getDirection(Math.cos(enemy.params.attackTheta), Math.sin(enemy.params.attackTheta));
                }
            }
            shootFrostInCone(state, enemy, enemy.params.attackTheta);
        }
        if (enemy.modeTime >= 500) {
            enemy.setMode('chooseTarget');
        }
        return;
    }
}

// Returns the angle from the origin to (y, x) in radians in the range [0, 2 * Math.PI).
function atan3(y, x) {
    return (Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI);
}

function shootFrostInCone(state: GameState, enemy: Enemy, theta: number, damage = 1): void {
    const hitbox = enemy.getHitbox(state);
    const x = hitbox.x + hitbox.w / 2 + Math.cos(theta) * hitbox.w / 2;
    const y = hitbox.y + hitbox.h / 2 + Math.sin(theta) * hitbox.h / 2;
    const attackTheta = theta - Math.PI / 12 + Math.random() * Math.PI / 6;
    const frost = new Frost({
        damage,
        x,
        y,
        vx: 4 * Math.cos(attackTheta),
        vy: 4 * Math.sin(attackTheta),
        ignoreTargets: new Set([enemy]),
    });
    addObjectToArea(state, enemy.area, frost);
}

