import { addObjectToArea } from 'app/content/areas';
import { Flame } from 'app/content/effects/flame';
import { FlameWall } from 'app/content/effects/flameWall';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {
    //accelerateInDirection,
    getNearbyTarget,
    getVectorToNearbyTarget,
    getVectorToTarget,
    //moveEnemy,
    //moveEnemyToTargetLocation,
    paceRandomly,
} from 'app/content/enemies';
import { beetleHornedAnimations } from 'app/content/enemyAnimations';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation } from 'app/utils/animations';
import { getDirection } from 'app/utils/field';

import { AreaInstance, Enemy, GameState, ObjectInstance } from 'app/types';


const peachAnimation = createAnimation('gfx/hud/icons.png', {w: 18, h: 18, content: {x: 1, y: 1, w: 16, h: 16}}, {x: 0});
const peachAnimations = {
    idle: {
        up: peachAnimation,
        down: peachAnimation,
        left: peachAnimation,
        right: peachAnimation,
    },
};

enemyDefinitions.fireHeart = {
    animations: peachAnimations, life: 24, scale: 4, touchHit: { damage: 4, element: 'fire'}, update: updateFireHeart, params: {
        enrageLevel: 0,
    },
    initialMode: 'choose',
    immunities: ['fire'],
    elementalMultipliers: {'ice': 2},
};
enemyDefinitions.fireBeast = {
    animations: beetleHornedAnimations, life: 36, scale: 3, update: updateFireBeast,
    acceleration: 0.3, speed: 2,
    immunities: ['ice'],
    params: {
    },
};

function getFlameHeart(this: void, state: GameState, area: AreaInstance): Enemy {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'fireHeart') as Enemy;
}

/*
function getFireBeast(this: void, state: GameState, area: AreaInstance): Enemy {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'fireBeast') as Enemy;
}*/

function isEnemyDefeated(enemy: Enemy): boolean {
    return !enemy || (enemy.life <= 0 && !enemy.isImmortal) || enemy.status === 'gone';
}

function updateFireHeart(this: void, state: GameState, enemy: Enemy): void {
    const target = getVectorToNearbyTarget(state, enemy, 144, enemy.area.allyTargets);
    if (enemy.params.enrageTime > 0) {
        enemy.params.enrageTime -= FRAME_LENGTH;
        enemy.isInvulnerable = enemy.params.enrageTime > 0;
    }
    if (enemy.mode === 'choose') {
        if (enemy.modeTime === 1000 || enemy.params.enrageTime > 0) {
            if (target && Math.random() < 0.6) {
                enemy.params.theta = Math.atan2(target.y, target.x) - Math.PI / 4;
                enemy.setMode('radialFlameAttack');
            } else {
                enemy.setMode('flameWallsAttack');
            }
        }
    } else if (enemy.mode === 'flameWallsAttack') {
        if (enemy.modeTime === 1000) {
            const hitbox = enemy.getHitbox(state);
            FlameWall.createRadialFlameWall(state, enemy.area, {x: hitbox.x + hitbox.w / 2, y: hitbox.y + hitbox.h / 2});
        }
        if (enemy.modeTime >= 1500) {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'radialFlameAttack') {
        const timeLimit = 4000 + 500 * enemy.params.enrageLevel;
        if (enemy.modeTime % 100 === 0 && enemy.modeTime < timeLimit) {
            // To give the player warning, this attack powers up over 1 second and has low range at first.
            const power = Math.min(1, enemy.modeTime / 500);
            const speed = 1 + 2 * power;
            const hitbox = enemy.getHitbox(state);
            let count = 1 + enemy.params.enrageLevel;
            for (let i = 0; i < count; i++) {
                const theta = enemy.params.theta + i * 2 * Math.PI / count;
                const dx = Math.cos(theta);
                const dy = Math.sin(theta);
                const flame = new Flame({
                    x: hitbox.x + hitbox.w / 2 + 4 * dx,
                    y: hitbox.y + hitbox.h / 2 + 4 * dy,
                    vx: speed * dx,
                    vy: speed * dy,
                    ttl: 600,
                    damage: 4,
                });
                flame.x -= flame.w / 2;
                flame.y -= flame.h / 2;
                addObjectToArea(state, enemy.area, flame);
            }
            enemy.params.theta += Math.PI / 20;
        }
        if (enemy.modeTime >= timeLimit + 500) {
            enemy.setMode('choose');
        }
    }
    if (enemy.life <= enemy.enemyDefinition.life * 2 / 3 && enemy.params.enrageLevel === 0) {
        enemy.params.enrageLevel = 1;
        enemy.params.enrageTime = 5000;
        enemy.modeTime = 0;
    } else if (enemy.life <= enemy.enemyDefinition.life * 1 / 3 && enemy.params.enrageLevel === 1) {
        enemy.params.enrageLevel = 2;
        enemy.params.enrageTime = 7000;
        enemy.modeTime = 0;
    }
}

const fireBeastLeapStrike = (state: GameState, enemy: Enemy, target: ObjectInstance): void => {
    const enemyHitbox = enemy.getHitbox(state);
    const targetHitbox = target.getHitbox(state);
    const x = enemyHitbox.x + enemyHitbox.w / 2;
    const y = enemyHitbox.y + enemyHitbox.h / 2;
    const tx = targetHitbox.x + targetHitbox.w / 2;
    const ty = targetHitbox.y + targetHitbox.h / 2;
    enemy.vz = 5;
    enemy.az = -0.2;
    const duration = -2 * enemy.vz / enemy.az;
    enemy.vx = (tx - x) / duration;
    enemy.vy = (ty - y) / duration;
    enemy.params.strikes++;
    enemy.setAnimation('attack', enemy.d);
    enemy.setMode('leapStrike');
}

function updateFireBeast(this: void, state: GameState, enemy: Enemy): void {
    // This enemy in particular should not deal contact damage while it is in the air
    // since our heuristic of using the actual sprite overlap doesn't make sense this high in the air and
    // for these movements.
    enemy.isInvulnerable = (enemy.z > 8);
    enemy.touchHit = (enemy.z <= 0) ? { damage: 4, element: 'fire'} : null;
    if (enemy.mode === 'regenerate') {
        // Fall to the ground if we start regeneration mid leap.
        if (enemy.z > 0) {
            enemy.vz = Math.min(0, enemy.vz - 0.2);
            enemy.z = Math.max(0, enemy.z + enemy.vz);
        }
        // Cannot deal or take damage whil regenerating.
        enemy.enemyInvulnerableFrames = enemy.invulnerableFrames = 20;
        if (enemy.modeTime % 1000 === 0) {
            enemy.life += 0.5;
        }
        if (enemy.life >= enemy.enemyDefinition.life) {
            enemy.life = enemy.enemyDefinition.life;
            enemy.setMode('choose');
        }
        return;
    }
    if (enemy.life < enemy.enemyDefinition.life * 2 / 3) {
        if (!isEnemyDefeated(getFlameHeart(state, enemy.area))) {
            enemy.setMode('regenerate');
            return;
        }
    }
    const target = getNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
    if (!target) {
        paceRandomly(state, enemy);
        return;
    }
    const targetVector = getVectorToTarget(state, enemy, target);
    if (enemy.mode === 'choose') {
        enemy.d = getDirection(targetVector.x, targetVector.y);
        enemy.setAnimation('idle', enemy.d);
        if (enemy.modeTime >= 1000) {
            enemy.params.strikes = 0;
            fireBeastLeapStrike(state, enemy, target);
        }
    } else if (enemy.mode === 'leapStrike') {
        if (enemy.modeTime >= 200) {
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
            enemy.z += enemy.vz;
            enemy.vz += enemy.az;
            if (enemy.z <= 0) {
                enemy.z = 0;
                if (Math.random() < (2 + enemy.params.enrageLevel - enemy.params.strikes) / (2 + enemy.params.enrageLevel)) {
                    fireBeastLeapStrike(state, enemy, target);
                } else {
                    enemy.setMode('choose');
                }
            }
        }
    }
}

