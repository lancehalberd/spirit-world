import { addEffectToArea } from 'app/content/areas';
import { Flame } from 'app/content/effects/flame';
import { FlameWall } from 'app/content/effects/flameWall';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { createCanvasAndContext, debugCanvas } from 'app/dom';
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
import { createAnimation, drawFrame } from 'app/utils/animations';
import { getDirection } from 'app/utils/field';
import { allImagesLoaded } from 'app/utils/images';

import { AreaInstance, EffectInstance, Enemy, GameState, ObjectInstance } from 'app/types';

const flameGeometry = {w: 20, h: 20, content: {x: 2, y: 2, w: 16, h: 16}};
export const [
    /* container */, fireElement, /* elementShine */
] = createAnimation('gfx/hud/elementhud.png',
    flameGeometry, {cols: 2}
).frames;
const [flameHeartCanvas, flameHeartContext] = createCanvasAndContext(fireElement.w * 4, fireElement.h * 2);
const createFlameAnimation = async () => {
    await allImagesLoaded();
    drawFrame(flameHeartContext, fireElement, {x: 0, y: 0, w: fireElement.w * 2, h: fireElement.h * 2});
    flameHeartContext.save();
        flameHeartContext.translate((fireElement.w + fireElement.content.x + fireElement.content.w / 2) * 2, 0);
        flameHeartContext.scale(-1, 1);
        drawFrame(flameHeartContext, fireElement, {
            x: 2* (-fireElement.content.w / 2 - fireElement.content.x), y: 0,
            w: fireElement.w * 2, h: fireElement.h * 2
        });
    flameHeartContext.restore();
    drawFrame(flameHeartContext, fireElement, {...fireElement, x: 0, y: 2});
    drawFrame(flameHeartContext, fireElement, {...fireElement, x: fireElement.w, y: 0});
    drawFrame(flameHeartContext, fireElement, {...fireElement, x: 2 * fireElement.w, y: 0});
    drawFrame(flameHeartContext, fireElement, {...fireElement, x: 3 * fireElement.w, y: 2});
}
debugCanvas;//(flameHeartCanvas);
createFlameAnimation();
const flameHeartAnimation = createAnimation(flameHeartCanvas, {w: 40, h: 40, content: {x: 4, y: 4, w: 32, h: 32}}, {cols: 2});


const flameHeartAnimations = {
    idle: {
        up: flameHeartAnimation,
        down: flameHeartAnimation,
        left: flameHeartAnimation,
        right: flameHeartAnimation,
    },
};

enemyDefinitions.flameHeart = {
    animations: flameHeartAnimations, life: 24, scale: 2, touchHit: { damage: 4, element: 'fire'}, update: updateFireHeart, params: {
        enrageLevel: 0,
    },
    initialMode: 'choose',
    immunities: ['fire'],
    elementalMultipliers: {'ice': 2},
};
enemyDefinitions.flameBeast = {
    animations: beetleHornedAnimations, life: 36, scale: 4, update: updateFireBeast,
    acceleration: 0.3, speed: 2,
    immunities: ['fire'],
    elementalMultipliers: {'ice': 2},
    params: {
        enrageLevel: 0,
    },
};

function getFlameHeart(this: void, state: GameState, area: AreaInstance): Enemy {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'flameHeart') as Enemy;
}

/*
function getFireBeast(this: void, state: GameState, area: AreaInstance): Enemy {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'flameBeast') as Enemy;
}*/

function isEnemyDefeated(enemy: Enemy): boolean {
    return !enemy || (enemy.life <= 0 && !enemy.isImmortal) || enemy.status === 'gone';
}

function updateFireHeart(this: void, state: GameState, enemy: Enemy): void {
    const isEnraged = enemy.params.enrageTime > 0;
    const target = getVectorToNearbyTarget(state, enemy, isEnraged ? 144 : 500, enemy.area.allyTargets);
    if (isEnraged) {
        enemy.params.enrageTime -= FRAME_LENGTH;
        enemy.enemyInvulnerableFrames = enemy.invulnerableFrames = 20;
    }
    if (enemy.mode === 'choose') {
        if (enemy.modeTime === 1000 || isEnraged) {
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
            FlameWall.createRadialFlameWall(state, enemy.area, {x: hitbox.x + hitbox.w / 2, y: hitbox.y + hitbox.h / 2},
                isEnraged ? 8 : 4 + enemy.params.enrageLevel * 2);
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
                    ttl: 600 + (isEnraged ? 1000 : enemy.params.enrageLevel * 500),
                    damage: 4,
                });
                flame.x -= flame.w / 2;
                flame.y -= flame.h / 2;
                addEffectToArea(state, enemy.area, flame);
            }
            enemy.params.theta += Math.PI / 20;
        }
        if (enemy.modeTime >= timeLimit + 500) {
            enemy.setMode('choose');
        }
    }
    if (enemy.life <= enemy.enemyDefinition.life * 2 / 3 && enemy.params.enrageLevel === 0) {
        enemy.params.enrageLevel = 1;
        enemy.params.enrageTime = 6000;
        enemy.modeTime = 0;
    } else if (enemy.life <= enemy.enemyDefinition.life * 1 / 3 && enemy.params.enrageLevel === 1) {
        enemy.params.enrageLevel = 2;
        enemy.params.enrageTime = 8000;
        enemy.modeTime = 0;
    }
}

const flameBeastLeapStrike = (state: GameState, enemy: Enemy, target: EffectInstance | ObjectInstance): void => {
    const enemyHitbox = enemy.getHitbox(state);
    const targetHitbox = target.getHitbox(state);
    const x = enemyHitbox.x + enemyHitbox.w / 2;
    const y = enemyHitbox.y + enemyHitbox.h / 2;
    const tx = targetHitbox.x + targetHitbox.w / 2;
    const ty = targetHitbox.y + targetHitbox.h / 2;
    enemy.vz = enemy.params.strikes ? 3 : 4;
    enemy.az = -0.2;
    const duration = -2 * enemy.vz / enemy.az;
    enemy.vx = (tx - x) / duration;
    enemy.vy = (ty - y) / duration;
    enemy.params.strikes++;
    enemy.setAnimation('attack', enemy.d);
    enemy.setMode('leapStrike');
    spawnGiantFlame(state, enemy);
};

const spawnGiantFlame = (state: GameState, enemy: Enemy): void => {
    const enemyHitbox = enemy.getHitbox(state);
    const x = enemyHitbox.x + enemyHitbox.w / 2;
    const y = enemyHitbox.y + enemyHitbox.h / 2;
    const flame = new Flame({
        x,
        y,
        ttl: 2000 + enemy.params.enrageLevel * 500,
        scale: 4,
        damage: 4,
    });
    flame.x -= flame.w / 2;
    flame.y -= flame.h / 2;
    addEffectToArea(state, enemy.area, flame);
};

function updateFireBeast(this: void, state: GameState, enemy: Enemy): void {
    const flameHeart = getFlameHeart(state, enemy.area);
    if (flameHeart && flameHeart.life >= flameHeart.enemyDefinition.life) {
        enemy.status = 'hidden';
        return;
    }
    if (enemy.status === 'hidden') {
        enemy.z = 300;
        enemy.status = 'normal';
        enemy.setMode('leapStrike');
    }
    // This enemy in particular should not deal contact damage while it is in the air
    // since our heuristic of using the actual sprite overlap doesn't make sense this high in the air and
    // for these movements.
    enemy.isInvulnerable = (enemy.z > 8);
    enemy.touchHit = (enemy.z <= 0) ? { damage: 4, element: 'fire'} : null;
    if (enemy.mode === 'regenerate') {
        // Fall to the ground if we start regeneration mid leap.
        if (enemy.z > 0) {
            enemy.vz = Math.max(-6, Math.min(0, enemy.vz - 0.2));
            enemy.z = Math.max(0, enemy.z + enemy.vz);
            return;
        }
        if (isEnemyDefeated(flameHeart)) {
            enemy.setMode('choose');
            return;
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
        if (!isEnemyDefeated(flameHeart)) {
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
            flameBeastLeapStrike(state, enemy, target);
        }
    } else if (enemy.mode === 'leapStrike') {
        if (enemy.modeTime >= 200) {
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
            enemy.z += enemy.vz;
            enemy.vz = Math.max(-8, enemy.vz - 0.2);
            if (enemy.z <= 0) {
                enemy.z = 0;
                if (Math.random() < (2 + enemy.params.enrageLevel - enemy.params.strikes) / (2 + enemy.params.enrageLevel)) {
                    flameBeastLeapStrike(state, enemy, target);
                } else {
                    enemy.setMode('choose');
                }
            }
        }
    }
}

