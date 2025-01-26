import {Flame} from 'app/content/effects/flame';
import {FlameWall} from 'app/content/effects/flameWall';
import {enemyDefinitions} from 'app/content/enemies/enemyHash';
import {Enemy} from 'app/content/enemy';
import {bossLaserBeamAbility, bossQuadRotatingLaserBeamAbility, bossLaserBeamBlenderbility} from 'app/content/enemyAbilities/laserBeam';
import {omniAnimation} from 'app/content/enemyAnimations';
import {fillFlameBeastLava} from 'app/content/specialBehaviors/crater';
import {addLavaBubbleEffectToBackground} from 'app/scenes/field/addAmbientEffects';
import {createAnimation, drawFrame} from 'app/utils/animations';
import {addEffectToArea} from 'app/utils/effects';
import {hitTargets} from 'app/utils/field';
import {getVectorToNearbyTarget} from 'app/utils/target';
import Random from 'app/utils/Random';


const flameHeartGeometry = {w: 48, h: 48, content: {x: 11, y: 16, w: 26, h: 18}};
const flameHeartIdleAnimation = createAnimation('gfx/bosses/flameHeartIdle.png', flameHeartGeometry, {cols: 9, duration: 6});
const flameHeartHurtAnimation = createAnimation('gfx/bosses/flameHeartHurt.png', flameHeartGeometry,
    {cols: 11, duration: 2, frameMap: [0, 1, 2, 3, 2, 1]},
);
const flameHeartDeathAnimation = createAnimation('gfx/bosses/flameHeartHurt.png', flameHeartGeometry,
    {cols: 11, duration: 2, frameMap: [0, 1, 2, 3, 4, 4, 5, 5]}, {loopFrame: 4},
);
const flameHeartPrepareAnimation = createAnimation('gfx/bosses/flameHeartAttack.png', flameHeartGeometry,
    {cols: 14, duration: 4},
    {loop: true, loopFrame: 6},
);
const flameHeartPrepareEndAnimation = createAnimation('gfx/bosses/flameHeartAttack.png', flameHeartGeometry,
    {x: 14, cols: 4, duration: 4}
);
const flameHeartAttackAnimation = createAnimation('gfx/bosses/flameHeartAttack.png', flameHeartGeometry,
    {x: 18, cols: 9, duration: 4},
    {loop: true, loopFrame: 4}
);
const flameHeartAttackEndAnimation = createAnimation('gfx/bosses/flameHeartAttack.png', flameHeartGeometry,
    {x: 27, cols: 4, duration: 4},
);

export const flameHeartAnimations = {
    idle: omniAnimation(flameHeartIdleAnimation),
    hurt: omniAnimation(flameHeartHurtAnimation),
    death: omniAnimation(flameHeartDeathAnimation),
    prepare: omniAnimation(flameHeartPrepareAnimation),
    prepareEnd: omniAnimation(flameHeartPrepareEndAnimation),
    attack: omniAnimation(flameHeartAttackAnimation),
    attackEnd: omniAnimation(flameHeartAttackEndAnimation),
};

enemyDefinitions.flameHeart = {
    naturalDifficultyRating: 20,
    animations: flameHeartAnimations, life: 50, scale: 2,
    update: updateFlameHeart,
    floating: true,
    params: {
        enrageLevel: 0,
        // This is the key that corresponds to the lava being drained enough to reveal the heart.
        // When it is set, the heart is vulnerable. Leave this blank to make it always vulnerable.
        lavaKey: 'craterLava4Objects',
    },
    initialMode: 'choose',
    immunities: ['fire'],
    elementalMultipliers: {'ice': 1.5, 'lightning': 1.2},
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        // The heart becomes protected when the lava starts to fill, reducing all incoming damage by
        // 80%
        if (enemy.params.isProtected) {
            hit = {
                ...hit,
                damage: hit.damage / 5,
            }
        }
        if (isFlameHeartExposed(state, enemy)) {
            return enemy.defaultOnHit(state, hit);
        }
        return {};
    },
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        if (isFlameHeartExposed(state, enemy)) {
            enemy.defaultRender(context, state);
            return;
        }
        let h = 0;
        if (state.savedState.objectFlags.craterLavaAnimation4_1) {
            h = 12;
        } else if (state.savedState.objectFlags.craterLavaAnimation4_2) {
            h = 24;
        } else if (state.savedState.objectFlags.craterLavaAnimation4_3) {
            h = 36;
        }
        if (h) {
            const frame = enemy.getFrame();
            drawFrame(context, {...frame, h}, { ...frame,
                x: enemy.x - (frame?.content?.x || 0) * enemy.scale,
                y: enemy.y - (frame?.content?.y || 0) * enemy.scale - enemy.z,
                w: frame.w * enemy.scale,
                h: h * enemy.scale,
            });
        }
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        if (isFlameHeartExposed(state, enemy)) {
            enemy.defaultRenderShadow(context, state);
        }
    },
};


function updateFlameHeart(state: GameState, enemy: Enemy): void {
    const flameBeast = getFlameBeast(state, enemy.area);
    const isExposed = isFlameHeartExposed(state, enemy);
    // The heart does not attack before it is first exposed.
    if (!isExposed) {
        // Remove solid/touch damage behaviors while the enemy is submerged in lava.
        delete enemy.behaviors;
        const hitbox = enemy.getHitbox();
        const x = hitbox.x + Math.random() * hitbox.w;
        const y = hitbox.y + Math.random() * hitbox.h;
        addLavaBubbleEffectToBackground(state, enemy.area, {x, y});
        hitTargets(state, enemy.area, {
            hitbox,
            hitTiles: true,
            element: 'fire',
            source: enemy,
        });
        // The heart regenerates life will covered in lava.
        if (enemy.time % 1000 === 0) {
            enemy.life = Math.min(enemy.life + 0.5, enemy.maxLife);
        }
        // Don't show the healthbar or attack if the heart has not been exposed yet.
        if (flameBeast.mode === 'hidden') {
            enemy.healthBarTime = 0;
            // Set this so it doesn't immediately attack on reveal.
            enemy.modeTime = 0;
            return;
        }
    } else {
        enemy.behaviors = {solid: true, touchHit: { damage: 4, element: 'fire', source: enemy}};
    }
    enemy.z = 6;
    // The heart is now considered enraged as long as it is covered in lava.
    const isEnraged = !isExposed;
    const target = getVectorToNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
    if (enemy.mode === 'choose') {
        if (enemy.modeTime >= 1000 || isEnraged) {
            // Use the next animation key to transition modes at the end of the current animation loop.
            if (enemy.currentAnimationKey === 'attack' || enemy.runAnimationSequence(['idle', 'prepare'])) {
                if (target?.mag < 100 || (isEnraged && Math.random() < 0.3)) {
                    enemy.params.theta = Math.atan2(target.y, target.x) - Math.PI / 4;
                    enemy.setMode('radialFlameAttack');
                } else if (Math.random() < 0.5) {
                    enemy.setMode('flameWallsAttack');
                } else {
                    enemy.setMode('laserAttack');
                }
            }
        }
    } else if (enemy.mode === 'flameWallsAttack') {
        if (enemy.modeTime >= 1000) {
            if (enemy.runAnimationSequence(['prepare', 'prepareEnd', 'attack'])) {
                const hitbox = enemy.getHitbox(state);
                FlameWall.createRadialFlameWall(state, enemy.area, {x: hitbox.x + hitbox.w / 2, y: hitbox.y + hitbox.h / 2},
                    isEnraged ? 8 : 4 + enemy.params.enrageLevel * 2, enemy);
                enemy.setMode('endAttack');
            }
        }
    } else if (enemy.mode === 'laserAttack') {
        if (enemy.modeTime >= 1000) {
            if (enemy.runAnimationSequence(['prepare', 'prepareEnd', 'attack']) && enemy.animationTime >= 200) {
                const target = getVectorToNearbyTarget(state, enemy, 1000, enemy.area.allyTargets) || {x: Math.random(), y: Math.random()};
                const baseTheta = target ? Math.atan2(target.y, target.x) : 2 * Math.PI * Math.random();
                enemy.setMode('endLaserAttack');
                if (enemy.params.enrageLevel === 2) {
                    bossLaserBeamBlenderbility.useAbility(state, enemy, baseTheta);
                    // Rotating laser lasts the full 5000ms.
                    enemy.modeTime = 0;
                } else if (enemy.params.enrageLevel === 1) {
                    bossQuadRotatingLaserBeamAbility.useAbility(state, enemy, baseTheta);
                    // Rotating laser lasts the full 5000ms.
                    enemy.modeTime = 800;
                } else {
                    bossLaserBeamAbility.useAbility(state, enemy, baseTheta);
                    // Laser last 1000ms.
                    enemy.modeTime = 4000;
                }
            }
        }
    } else if (enemy.mode === 'endLaserAttack') {
        if (enemy.modeTime >= 5000) {
            enemy.setMode('endAttack');
        }
    } else if (enemy.mode === 'radialFlameAttack') {
        const timeLimit = 4000 + 500 * enemy.params.enrageLevel;
        if (enemy.modeTime >= 500 && enemy.runAnimationSequence(['prepare', 'prepareEnd', 'attack'])) {
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
                        damage: 2,
                        source: enemy,
                    });
                    addEffectToArea(state, enemy.area, flame);
                }
                enemy.params.theta += Math.PI / 20;
            }
        }
        if (enemy.modeTime >= timeLimit + 500) {
            enemy.setMode('endAttack');
        }
    } else if (enemy.mode === 'endAttack') {
        // The heart will stay in the attack animation while enraged.
        if (isEnraged || enemy.runAnimationSequence(['attack', 'attackEnd', 'idle'])) {
            if (enemy.modeTime >= 1000) {
                enemy.setMode('choose');
            }
        }
    }
    if (enemy.life <= enemy.maxLife * 2 / 3 && enemy.params.enrageLevel === 0) {
        enemy.params.isProtected = true;
        enemy.params.enrageLevel = 1;
        enemy.modeTime = 0;
        fillLava(state, enemy);
    } else if (enemy.life <= enemy.maxLife * 1 / 3 && enemy.params.enrageLevel === 1) {
        enemy.params.isProtected = true;
        enemy.params.enrageLevel = 2;
        enemy.modeTime = 0;
        fillLava(state, enemy);
    }
    // Make the heart mortal again once the lava has finished filling up.
    if (enemy.isImmortal && !state.savedState.objectFlags.craterLava4) {
        delete enemy.isImmortal;
    }
    // After the fight starts, any time the lava is full and all switches are active, deactivate
    // a number of switches based on the current enrage level.
    const allBossSwitches = enemy.area.objects.filter(o => o.definition?.id === 'craterBossSwitch');
    const activeSwitches = allBossSwitches.filter(o => o.status === 'active');
    if (!state.savedState.objectFlags.craterLava4 && activeSwitches.length >= allBossSwitches.length) {
        const randomSwitches = Random.shuffle(activeSwitches);
        for (let i = 0; i < 2 * enemy.params.enrageLevel; i++) {
            randomSwitches[i].status = 'normal';
        }
        enemy.params.isProtected = false;
    }
}

function getFlameBeast(state: GameState, area: AreaInstance): Enemy {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'flameBeast') as Enemy;
}


function fillLava(state: GameState, enemy: Enemy) {
    if (!isFlameHeartExposed(state, enemy) || enemy.params.lavaKey !== 'craterLava4Objects') {
        return;
    }
    // Prevent killing the heart while the lava is filling.
    enemy.isImmortal = true;
    fillFlameBeastLava(state);
}

function isFlameHeartExposed(state: GameState, enemy: Enemy): boolean {
    return !enemy.params.lavaKey || !!state.savedState.objectFlags[enemy.params.lavaKey];
}
