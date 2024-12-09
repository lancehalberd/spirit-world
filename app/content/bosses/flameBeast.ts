import { Flame } from 'app/content/effects/flame';
import { FlameWall } from 'app/content/effects/flameWall';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { Enemy } from 'app/content/enemy';
import {bossLaserBeamAbility, bossQuadRotatingLaserBeamAbility, bossQuadLaserBlenderBeamAbility} from 'app/content/enemyAbilities/laserBeam';
import {beetleHornedAnimations, omniAnimation} from 'app/content/enemyAnimations';
import {fillFlameBeastLava} from 'app/content/specialBehaviors/crater';
import {addLavaBubbleEffectToBackground} from 'app/scenes/field/addAmbientEffects';
import {createAnimation, drawFrame} from 'app/utils/animations';
import { getCardinalDirection } from 'app/utils/direction';
import { addEffectToArea } from 'app/utils/effects';
import {isEnemyDefeated, paceRandomly} from 'app/utils/enemies';
import {hitTargets} from 'app/utils/field';
import {addObjectToArea} from 'app/utils/objects';
import { getNearbyTarget, getVectorToTarget, getVectorToNearbyTarget } from 'app/utils/target';
import Random from 'app/utils/Random';


const flameHeartGeometry = {w: 48, h: 48, content: {x: 11, y: 14, w: 26, h: 24}};
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


type LeakStrikeTargetType = ReturnType<typeof getVectorToNearbyTarget>;

const leapStrikeAbility: EnemyAbility<LeakStrikeTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): LeakStrikeTargetType {
        return getVectorToNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: LeakStrikeTargetType): void {
        const enemyHitbox = enemy.getHitbox();
        const targetHitbox = target.target.getHitbox();
        const x = enemyHitbox.x + enemyHitbox.w / 2;
        const y = enemyHitbox.y + enemyHitbox.h / 2;
        const tx = targetHitbox.x + targetHitbox.w / 2;
        const ty = targetHitbox.y + targetHitbox.h / 2;
        const abilityWithCharges = enemy.getAbility(leapStrikeAbility);
        enemy.vz = (abilityWithCharges.charges > 0) ? 3 : 4;
        enemy.az = -0.2;
        const duration = -2 * enemy.vz / enemy.az;
        enemy.vx = (tx - x) / duration;
        enemy.vy = (ty - y) / duration;
        enemy.setAnimation('attack', enemy.d);
        enemy.setMode('leapStrike');
        spawnLavaVorex(state, enemy);
    },
    cooldown: 2000,
    initialCharges: 2,
    charges: 2,
    prepTime: 200,
    recoverTime: 100,
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
enemyDefinitions.flameBeast = {
    naturalDifficultyRating: 100,
    abilities: [leapStrikeAbility],
    animations: beetleHornedAnimations, life: 80, scale: 4, update: updateFireBeast,
    initialMode: 'hidden',
    acceleration: 0.3, speed: 2,
    immunities: ['fire'],
    elementalMultipliers: {'ice': 1.5, 'lightning': 1.2},
    params: {
        enrageLevel: 0,
    },
};

function getFlameHeart(state: GameState, area: AreaInstance): Enemy {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'flameHeart') as Enemy;
}

function isFlameHeartExposed(state: GameState, enemy: Enemy): boolean {
    return !enemy.params.lavaKey || !!state.savedState.objectFlags[enemy.params.lavaKey];
}


function getFlameBeast(state: GameState, area: AreaInstance): Enemy {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'flameBeast') as Enemy;
}

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
            enemy.life = Math.min(enemy.life + 0.5, enemy.enemyDefinition.life);
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
                    bossQuadLaserBlenderBeamAbility.useAbility(state, enemy, baseTheta);
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
    if (enemy.life <= enemy.enemyDefinition.life * 2 / 3 && enemy.params.enrageLevel === 0) {
        enemy.params.isProtected = true;
        enemy.params.enrageLevel = 1;
        enemy.modeTime = 0;
        fillLava(state, enemy);
    } else if (enemy.life <= enemy.enemyDefinition.life * 1 / 3 && enemy.params.enrageLevel === 1) {
        enemy.params.isProtected = true;
        enemy.params.enrageLevel = 2;
        enemy.modeTime = 0;
        fillLava(state, enemy);
    }
    // After the fight starts, any time the lava is full and all switches are active, deactivate
    // a number of switches based on the current enrage level.
    const activeSwitches = enemy.area.objects.filter(o => o.definition?.id === 'craterBossSwitch' && o.status === 'active');
    if (!state.savedState.objectFlags.craterLava4 && activeSwitches.length >= 8) {
        const randomSwitches = Random.shuffle(activeSwitches);
        for (let i = 0; i < 2 * enemy.params.enrageLevel; i++) {
            randomSwitches[i].status = 'normal';
        }
        enemy.params.isProtected = false;
    }
}

function fillLava(state: GameState, enemy: Enemy) {
    if (!isFlameHeartExposed(state, enemy) || enemy.params.lavaKey !== 'craterLava4Objects') {
        return;
    }
    fillFlameBeastLava(state);
}

const spawnLavaVorex = (state: GameState, enemy: Enemy): void => {
    const enemyHitbox = enemy.getHitbox(state);
    const x = enemyHitbox.x + enemyHitbox.w / 2;
    const y = enemyHitbox.y + enemyHitbox.h / 2;
    const lavaVortex = new Enemy(state, {
        type: 'enemy',
        enemyType: 'vortexLava',
        x, y,
    });
    const hitbox = lavaVortex.getHitbox();
    lavaVortex.x -= hitbox.w / 2;
    lavaVortex.y -= hitbox.h / 2;
    lavaVortex.params.duration = 5000;
    addObjectToArea(state, enemy.area, lavaVortex);
    /*const flame = new Flame({
        x,
        y,
        ttl: 2000 + getFlameBeastEnrageLevel(state, enemy) * 500,
        scale: 4,
        damage: 3,
        source: enemy,
    });
    addEffectToArea(state, enemy.area, flame);*/
};

function getFlameBeastEnrageLevel(state: GameState, enemy: Enemy) {
    let enrageLevel = 0;
    const flameHeart = getFlameHeart(state, enemy.area);
    if (!flameHeart) {
        enrageLevel++;
    }
    if (enemy.life <= enemy.enemyDefinition.life / 3) {
        enrageLevel++;
    }
    if (enemy.life <= 2 * enemy.enemyDefinition.life / 3) {
        enrageLevel++;
    }
    return enrageLevel;
}

function updateFireBeast(this: void, state: GameState, enemy: Enemy): void {
    const flameHeart = getFlameHeart(state, enemy.area);
    // This is a bit brittle as it depends on the boss having a specific number of starting abilities.
    if (!flameHeart && enemy.abilities.length < 2) {
        enemy.gainAbility(bossLaserBeamAbility);
    }
    if (enemy.mode === 'hidden') {
        enemy.healthBarTime = 0;
        enemy.z = 300;
        // If a flameheart is present, stay hidden until it is damaged.
        if (flameHeart && flameHeart.life >= flameHeart.enemyDefinition.life) {
            return;
        }
        enemy.status = 'normal';
        enemy.setMode('choose');
    }
    // This enemy in particular should not deal contact damage while it is in the air
    // since our heuristic of using the actual sprite overlap doesn't make sense this high in the air and
    // for these movements.
    enemy.isInvulnerable = (enemy.z > 8);
    enemy.touchHit = (enemy.z <= 0) ? { damage: 2, element: 'fire', source: null} : null;
    if (enemy.mode === 'regenerate') {
        // Fall to the ground if we start regeneration mid leap.
        if (enemy.z > 0) {
            return;
        }
        if (isEnemyDefeated(flameHeart)) {
            enemy.setMode('choose');
            return;
        }
        // Cannot deal or take damage whil regenerating.
        enemy.enemyInvulnerableFrames = enemy.invulnerableFrames = 20;
        if (enemy.modeTime % 1000 === 0) {
            enemy.life += 1;
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
    } else if (enemy.mode === 'walk') {
        enemy.setMode('choose');
    }
    const targetVector = getVectorToTarget(state, enemy, target);
    if (enemy.mode === 'leapStrike') {
        if (enemy.z > 0) {
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
        }
        if (enemy.z <= 0 && enemy.vz <= 0) {
            enemy.z = 0;
            // Has a chance to generate a new leapstrike charge depending on enrage level.
            const abilityWithCharges = enemy.getAbility(leapStrikeAbility);
            if (Math.random() < getFlameBeastEnrageLevel(state, enemy) / 4) {
                if (abilityWithCharges.charges < (leapStrikeAbility.charges || 1)) {
                    abilityWithCharges.charges++;
                }
            }
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'choose' && enemy.z <= 0) {
        enemy.d = getCardinalDirection(targetVector.x, targetVector.y);
        enemy.setAnimation('idle', enemy.d);
        enemy.useRandomAbility(state);
    }
}

