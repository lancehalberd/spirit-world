import {addSparkleAnimation} from 'app/content/effects/animationEffect';
import {LightningBolt} from 'app/content/effects/lightningBolt';
import {Blast} from 'app/content/effects/blast';
import {enemyDefinitions} from 'app/content/enemies/enemyHash';
import {Enemy} from 'app/content/enemy';
import {omniAnimation} from 'app/content/enemyAnimations';
import {FRAME_LENGTH} from 'app/gameConstants';
import {createAnimation, getFrame } from 'app/utils/animations';
import {addEffectToArea} from 'app/utils/effects';
import {isTargetHit} from 'app/utils/field';
import {pad} from 'app/utils/index';
import {getVectorToNearbyTarget} from 'app/utils/target';

const stormHeartGeometry = {w: 64, h: 64, contenet: {x: 17, y: 17, w: 29, h: 29}};
const stormHeartIdleAnimation = createAnimation('gfx/bosses/stormHeartIdle.png', stormHeartGeometry, {cols: 27, duration: 4});
const stormHeartHurt1Animation = createAnimation('gfx/bosses/stormHeartDamaged.png', stormHeartGeometry, {cols: 7, duration: 4});
const stormHeartHurt2Animation = createAnimation('gfx/bosses/stormHeartDamaged.png', stormHeartGeometry, {x: 7, cols: 7, duration: 4});
const stormHeartHurt3Animation = createAnimation('gfx/bosses/stormHeartDamaged.png', stormHeartGeometry, {x: 14, cols: 7, duration: 4});
const stormHeartDeathAnimation = createAnimation('gfx/bosses/stormHeartDamaged.png', stormHeartGeometry, {x: 14, cols: 5, duration: 4}, {loop: false});
const stormHeartAttackPrepareAnimation = createAnimation('gfx/bosses/stormHeartAttack.png', stormHeartGeometry,
    {cols: 13, duration: 4});
const stormHeartAttackChargedAnimation = createAnimation('gfx/bosses/stormHeartAttack.png', stormHeartGeometry,
    {x: 5, cols: 8, duration: 2}, {loop: true, loopFrame: 5});
const stormHeartAttackRecoverAnimation = createAnimation('gfx/bosses/stormHeartAttack.png', stormHeartGeometry,
    {x: 13, cols: 4, duration: 4});

export const stormHeartAnimations = {
    idle: omniAnimation(stormHeartIdleAnimation),
    hurt1: omniAnimation(stormHeartHurt1Animation),
    hurt2: omniAnimation(stormHeartHurt2Animation),
    hurt3: omniAnimation(stormHeartHurt3Animation),
    death: omniAnimation(stormHeartDeathAnimation),
    prepare: omniAnimation(stormHeartAttackPrepareAnimation),
    charged: omniAnimation(stormHeartAttackChargedAnimation),
    recover: omniAnimation(stormHeartAttackRecoverAnimation),
};

const stormHeartCloudGeometry = stormHeartGeometry;
const stormHeartCloudBackFrames = createAnimation('gfx/bosses/stormHeartCloudBack.png', stormHeartCloudGeometry, {cols: 5}).frames;
const stormHeartCloudMiddleFrames = createAnimation('gfx/bosses/stormHeartCloudMiddle.png', stormHeartCloudGeometry, {cols: 5}).frames;
const stormHeartCloudFrontFrames = createAnimation('gfx/bosses/stormHeartCloudFront.png', stormHeartCloudGeometry, {cols: 5}).frames;
const stormHeartCloudAnimations: FrameAnimation[] = [
    createAnimation('gfx/bosses/stormHeartCloudParticles.png', stormHeartCloudGeometry, {x: 0, cols: 5}),
    createAnimation('gfx/bosses/stormHeartCloudParticles.png', stormHeartCloudGeometry, {x: 5, cols: 5}),
    createAnimation('gfx/bosses/stormHeartCloudParticles.png', stormHeartCloudGeometry, {x: 10, cols: 5}),
    createAnimation('gfx/bosses/stormHeartCloudParticles.png', stormHeartCloudGeometry, {x: 15, cols: 5}),
    createAnimation('gfx/bosses/stormHeartCloudParticles.png', stormHeartCloudGeometry, {x: 20, cols: 5}),
];
const maxCloudLife = stormHeartCloudAnimations.length - 1;

interface StormHeartParams {
    enrageLevel: number
    enrageTime: number
    cloudLife: number
    cloudRegenerateTimer: number
    cloudIsReforming: boolean
    theta: number
}

function getHeartHitbox(enemy: Enemy<StormHeartParams>): Rect {
    return {
        x: enemy.x + 40,
        y: enemy.y + 34,
        w: 48,
        h: 40 + Math.max(16, enemy.params.cloudLife * 8),
        //h: 16 + Math.max(16, Math.ceil((enemy.params.cloudLife + 1) / 2) * 16),
    };
};

const dischargeRadius = 128;
const stormHeartDischargeAbility = {
    getTarget(state: GameState, enemy: Enemy): Target {
        return getVectorToNearbyTarget(state, enemy, dischargeRadius, enemy.area.allyTargets)?.target;
    },
    prepareAbility(state: GameState, enemy: Enemy, target: Target): void {
        enemy.changeToAnimation('prepare', 'charged');
        const hitbox = enemy.getHitbox();
        const delay = stormHeartAttackPrepareAnimation.frameDuration;
        const discharge = new Blast({
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2,
            delay,
            damage: 4,
            element: 'lightning',
            tellDuration: this.prepTime - delay,
            radius: dischargeRadius,
            boundSource: enemy,
            source: enemy,
        });
        addEffectToArea(state, enemy.area, discharge);
    },
    useAbility(state: GameState, enemy: Enemy, target: Target): void {
        enemy.changeToAnimation('recover', 'idle');
    },
    cooldown: 1000,
    prepTime: 3000,
    recoverTime: 400,
}
const stormHeartLightningAbility = {
    getTarget(state: GameState, enemy: Enemy): Target {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets)?.target;
    },
    prepareAbility(state: GameState, enemy: Enemy, target: Target): void {
        enemy.changeToAnimation('prepare', 'charged');
    },
    useAbility(state: GameState, enemy: Enemy, target: Target): void {
        enemy.changeToAnimation('recover', 'idle');
        const hitbox = target.getHitbox();
        enemy.params.theta = (enemy.params.theta || 0) + Math.PI / 4;
        const lightningBolt = new LightningBolt({
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2,
            shockWaveTheta: enemy.params.theta,
            source: enemy,
        });
        addEffectToArea(state, enemy.area, lightningBolt);
    },
    charges: 3,
    chargesRecovered: 3,
    initialCharges: 3,
    cooldown: 1000,
    prepTime: 400,
    recoverTime: 400,
}

const stormHeart: EnemyDefinition<StormHeartParams> = {
    naturalDifficultyRating: 20,
    // This is intended to be able to target everything in the area.
    aggroRadius: 2000,
    // The storm heart is smaller than other hearts, but takes up a lot of space with its cloud barrier.
    animations: stormHeartAnimations, life: 60, scale: 2,
    abilities: [stormHeartDischargeAbility, stormHeartLightningAbility],
    tileBehaviors: { solid: true, touchHit: {damage: 0, canAlwaysKnockback: true, source: null}},
    hasShadow: false,
    params: {
        enrageLevel: 0,
        enrageTime: 0,
        cloudLife: maxCloudLife,
        cloudRegenerateTimer: 0,
        cloudIsReforming: false,
        theta: 0,
    },
    immunities: ['lightning'],
    elementalMultipliers: {'ice': 1.5, 'fire': 1.5},
    initialMode: 'waiting',
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy<StormHeartParams>) {
        let index = Math.floor(maxCloudLife - enemy.params.cloudLife);
        index = Math.min(maxCloudLife, Math.max(0, index));
        enemy.defaultRender(context, state, stormHeartCloudBackFrames[index]);
        enemy.defaultRender(context, state);
        enemy.defaultRender(context, state, stormHeartCloudMiddleFrames[index]);
        enemy.defaultRender(context, state, stormHeartCloudFrontFrames[index]);
        const particleAnimation = stormHeartCloudAnimations[index];
        enemy.defaultRender(context, state, getFrame(particleAnimation, enemy.time));
        /*context.save();
            context.globalAlpha *= 0.5;
            context.fillStyle = 'red';
            const hitbox = getHeartHitbox(enemy);
            context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
        context.restore();*/
    },
    getHitbox(enemy: Enemy<StormHeartParams>): Rect {
        return {
            x: enemy.x + 14,
            y: enemy.y + 34,
            w: 100,
            h: 40 + Math.max(16, enemy.params.cloudLife * 8),
            //h: 32 + Math.max(16, Math.ceil((enemy.params.cloudLife + 1) / 2) * 16),
        };
        /*return {
            x: enemy.x - 24,
            y: enemy.y - 48,
            w: 96,
            h: 48 + Math.max(16, Math.ceil((enemy.params.cloudLife + 1) / 2) * 16),
        };*/
    },
    onHit(state: GameState, enemy: Enemy<StormHeartParams>, hit: HitProperties): HitResult {
        const innerHitbox = getHeartHitbox(enemy);
        // Cloud cannot be damaged while it is reforming after a counter attack or while enraged
        if (enemy.params.cloudIsReforming
            || !isTargetHit(innerHitbox, hit) || isOrbProtectingHeart(state, enemy.area)
        ) {
            return { hit: true, stopped: true };
        }
        const shouldBeEnranged = enemy.params.enrageTime > 0 || enemy.params.enrageLevel < getStormHeartTargetEnrageLevel(enemy);
        // Incoming damage is reduced by 80% when preparing to enter rage phase.
        if (shouldBeEnranged && hit.damage) {
            hit = {...hit, damage: hit.damage *= 0.2};
        }
        if (enemy.params.cloudLife > 0) {
            enemy.params.cloudLife = Math.ceil(enemy.params.cloudLife - 1);
            enemy.params.cloudRegenerateTimer = 1500;
            enemy.makeSound(state, 'enemyHit');
            return { hit: true, stopped: true };
        }
        if (enemy.mode !== 'attack') {
            enemy.setMode('attack');
        }
        // Special logic for showing different hurt animations over the course of the fight
        if (enemy.currentAnimationKey === 'idle') {
            const maxLife = enemy.enemyDefinition.life
            const hurtLevel = Math.max(1, Math.min(3, Math.ceil(3 * (maxLife - enemy.life) / maxLife)));
            enemy.changeToAnimation('hurt' + hurtLevel);
        }
        return enemy.defaultOnHit(state, hit);
    },
    update: updateStormHeart,
};
enemyDefinitions.stormHeart = stormHeart;

function updateStormHeart(this: void, state: GameState, enemy: Enemy<StormHeartParams>): void {
    if (enemy.mode === 'waiting') {
        if (enemy.area === state.areaInstance && enemy.life < enemy.enemyDefinition.life) {
            enemy.setMode('choose');
        }
        enemy.healthBarTime = 0;
        if (enemy.params.cloudLife < maxCloudLife) {
            if (enemy.params.cloudRegenerateTimer > 0) {
                enemy.params.cloudRegenerateTimer -= FRAME_LENGTH;
            } else {
                enemy.params.cloudLife = Math.min(maxCloudLife, enemy.params.cloudLife + 0.1);
            }
        }
        return;
    }
    if (enemy.mode === 'attack') {
        // Add a small delay to show the damage frame before attacking.
        if (enemy.modeTime < 600) {
            return;
        }
        if (enemy.modeTime < 3300) {
            // When the hero is nearby, the heart will perform am AoE discharge attack
            // to protect itself.
            enemy.tryUsingAbility(state, stormHeartDischargeAbility);
            // When the hero is far away, the heart will summon a series of targeted
            // lightning bolts to protect itself.
            enemy.tryUsingAbility(state, stormHeartLightningAbility);
        }
        if (!enemy.activeAbility) {
            startRegeneratingCloud(enemy);
            enemy.setMode('choose');
        }
        return;
    }
    if (enemy.params.cloudLife < maxCloudLife) {
        if (enemy.params.cloudRegenerateTimer > 0) {
            enemy.params.cloudRegenerateTimer -= FRAME_LENGTH;
        } else {
            enemy.params.cloudLife = Math.min(maxCloudLife, enemy.params.cloudLife + 0.1);
        }
    } else {
        enemy.params.cloudIsReforming = false;
    }
    // Don't do any enrage mechanics until the cloud has finished reforming.
    if (enemy.params.cloudIsReforming) {
        return;
    }
    const isEnraged = enemy.params.enrageTime > 0;
    // const target = getVectorToNearbyTarget(state, enemy, isEnraged ? 144 : 500, enemy.area.allyTargets);
    if (isEnraged) {
        enemy.params.enrageTime -= FRAME_LENGTH;
        if (enemy.params.enrageTime % 2000 === 0) {
            enemy.params.theta = (enemy.params.theta || 0) + Math.PI / 4;
            const hitbox = state.hero.getHitbox();
            for (let i = 0; i < 4; i++) {
                const theta = enemy.params.theta + i * Math.PI / 2;
                const lightningBolt = new LightningBolt({
                    x: hitbox.x + hitbox.w / 2 + 64 * Math.cos(theta),
                    y: hitbox.y + hitbox.h / 2 + 64 * Math.sin(theta),
                    shockWaveTheta: enemy.params.theta,
                    source: enemy,
                });
                addEffectToArea(state, enemy.area, lightningBolt);
            }
        }
    }
    const targetEnrageLevel = getStormHeartTargetEnrageLevel(enemy);
    if (enemy.params.enrageLevel < targetEnrageLevel) {
        enemy.params.enrageLevel = targetEnrageLevel;
        enemy.params.enrageTime = 4500;
        enemy.modeTime = 0;
        // Burn damaged is reduced by 80% when entering rage phase.
        enemy.burnDamage *= 0.2;
        const orbs = getOrbs(state, enemy.area.alternateArea, 'off').reverse();
        if (orbs[0]) {
            orbs[0].status = 'normal';
        }
        if (orbs[1] && targetEnrageLevel >= 2) {
            orbs[1].status = 'normal';
        }
    }
    if (isOrbProtectingHeart(state, enemy.area)) {
        // This has the unintended side effect of making the heart visible from the spirit world,
        // but maybe this is an okay effect, let's see.
        enemy.enemyInvulnerableFrames = enemy.invulnerableFrames = 20;
        addSparkleAnimation(state, enemy.area, pad(enemy.getHitbox(), -8), { element: 'lightning' });
    }
}

function getOrbs(this: void, state: GameState, area: AreaInstance, status: ObjectStatus): Enemy[] {
    return area.enemies.filter(target => target.definition.enemyType === 'largeOrb' && target.status === status);
}

function getStormHeartTargetEnrageLevel(enemy: Enemy): number {
    if (enemy.life <= enemy.enemyDefinition.life * 1 / 3) {
        return 2;
    }
    if (enemy.life <= enemy.enemyDefinition.life * 2 / 3) {
        return 1;
    }
    return 0;
}

export function isOrbProtectingHeart(this: void, state: GameState, area: AreaInstance): boolean {
    return getOrbs(state, area.alternateArea, 'normal').length > 0;
}

function startRegeneratingCloud(enemy: Enemy) {
    enemy.params.cloudRegenerateTimer = 0;
    enemy.params.cloudIsReforming = true;
    enemy.params.cloudLife = 1;
}
