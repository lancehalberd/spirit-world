import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { LightningBolt } from 'app/content/effects/lightningBolt';
import { LightningDischarge } from 'app/content/effects/lightningDischarge';
import { addArcOfShockWaves } from 'app/content/effects/shockWave';
import { Spark } from 'app/content/effects/spark';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { Enemy } from 'app/content/enemy';
import { chargedLightningBoltAbility, lightningBoltAbility } from 'app/content/enemyAbilities/lightningBolt'
import { allTiles } from 'app/content/tiles';
import { omniAnimation } from 'app/content/enemyAnimations';
import { FRAME_LENGTH } from 'app/gameConstants';
import { renderLightningCircle } from 'app/render/renderLightning';
import { createAnimation, drawFrame, drawFrameAt, getFrame } from 'app/utils/animations';
import { createCanvasAndContext, debugCanvas } from 'app/utils/canvas';
import { addEffectToArea } from 'app/utils/effects';
import {
    accelerateInDirection,
    hasEnemyLeftSection,
    // moveEnemy,
    moveEnemyToTargetLocation,
    //paceRandomly,
} from 'app/utils/enemies';
import { hitTargets, isTargetHit } from 'app/utils/field';
import { getAreaSize } from 'app/utils/getAreaSize';
import { allImagesLoaded } from 'app/utils/images';
import { pad } from 'app/utils/index';
import Random from 'app/utils/Random';
import {
    getNearbyTarget,
    getVectorToTarget,
    getVectorToNearbyTarget,
} from 'app/utils/target';


// This is just the spirit sight frame.

const stormHeartGeometry = {w: 20, h: 20, content: {x: 4, y: 10, w: 12, h: 8}};
export const [lightningElement] = createAnimation('gfx/hud/elementhud.png', stormHeartGeometry, {x: 3}).frames;
const [stormHeartCanvas, stormHeartContext] = createCanvasAndContext(lightningElement.w * 4, lightningElement.h * 2);
const createStormAnimation = async () => {
    await allImagesLoaded();
    drawFrame(stormHeartContext, lightningElement, {x: 0, y: 0, w: lightningElement.w * 2, h: lightningElement.h * 2});
    stormHeartContext.save();
        stormHeartContext.translate((lightningElement.w + lightningElement.content.x + lightningElement.content.w / 2) * 2, 0);
        stormHeartContext.scale(-1, 1);
        drawFrame(stormHeartContext, lightningElement, {
            x: 2* (-lightningElement.content.w / 2 - lightningElement.content.x), y: 0,
            w: lightningElement.w * 2, h: lightningElement.h * 2
        });
    stormHeartContext.restore();
    drawFrame(stormHeartContext, lightningElement, {...lightningElement, x: 0, y: 2});
    drawFrame(stormHeartContext, lightningElement, {...lightningElement, x: lightningElement.w, y: 0});
    drawFrame(stormHeartContext, lightningElement, {...lightningElement, x: 2 * lightningElement.w, y: 0});
    drawFrame(stormHeartContext, lightningElement, {...lightningElement, x: 3 * lightningElement.w, y: 2});
}
createStormAnimation();
const stormHeartAnimation = createAnimation(stormHeartCanvas, {w: 40, h: 40, content: {x: 8, y: 20, w: 24, h: 16}}, {cols: 2});

debugCanvas;//(stormHeartCanvas);

export const stormHeartAnimations = {
    idle: {
        up: stormHeartAnimation,
        down: stormHeartAnimation,
        left: stormHeartAnimation,
        right: stormHeartAnimation,
    },
};


/*
FLYING - Frames 1-4 looping at 5 FPS
Summon Bolts/Transform - Frames 5-6. Timing depends more on your design of how long the warning is, but the animation has it at 2 FPS.
I'd suggest adding some of the lightning effect during frame 5 to help indicate an attack/something is about to happen.
Charging - Frames 7-8 loop at 5 FPS
Shooting Lightning - Frames 8-11 (not a typo, 8 is used in both animations). Again timing depends a bit on how long you want the warning to be.
Frame 8 is the warning. Frame 9 is at 20 FPS and when the attack begins. Frames 10-11 are at 5 FPS to loop back to the flying animation.
Transformed - 12-13 loop. Runs at 2 FPS.
*/

// The hitbox won't rotate with the frame so we use a fairly small square hitbox that will be approximately correct regardless of rotation.
const stormBeastGeometry = {w: 156, h: 121, content: {x: 53, y: 39, w: 50, h: 50}};
// Frame at index 5 uses the full frame width which causes artifacts on nearby frames if they render the full width when rotated
// Instead of adding padding to all frames, we just use this smaller geometry for animations that use frame index 4 and 6.
const stormBeastSmallGeometry = {w: 154, h: 121, content: {x: 52, y: 39, w: 50, h: 50}};
const stormBeastFlyingAnimation = createAnimation('gfx/enemies/stormbeast1.png', stormBeastGeometry, {cols: 4, duration: 10});
const stormBeastPrepareCastAnimation = createAnimation('gfx/enemies/stormbeast1.png', stormBeastSmallGeometry, {xSpace: 2, x: 4, cols: 1, duration: 10});
const stormBeastCastAnimation = createAnimation('gfx/enemies/stormbeast1.png', stormBeastGeometry, {x: 5, cols: 1, duration: 10});
const stormBeastChargingAnimation = createAnimation('gfx/enemies/stormbeast1.png', stormBeastSmallGeometry, {xSpace: 2, x: 6, cols: 2, duration: 10});
const stormBeastPrepareAttackAnimation = createAnimation('gfx/enemies/stormbeast1.png', stormBeastGeometry, {x: 7, cols: 1, duration: 10});
const stormBeastAttackAnimation = createAnimation('gfx/enemies/stormbeast1.png', stormBeastGeometry, {x: 8, cols: 1, duration: 10});
const stormBeastAttackRecoverAnimation = createAnimation('gfx/enemies/stormbeast1.png', stormBeastGeometry, {x: 9, cols: 2, duration: 10});
const stormBeastBallAnimation = createAnimation('gfx/enemies/stormbeast1.png', stormBeastGeometry, {x: 11, cols: 2, duration: 10});

const stormBeastAnimations = {
    idle: omniAnimation(stormBeastFlyingAnimation),
    flying: omniAnimation(stormBeastFlyingAnimation),
    prepareCast: omniAnimation(stormBeastPrepareCastAnimation),
    cast: omniAnimation(stormBeastCastAnimation),
    charging: omniAnimation(stormBeastChargingAnimation),
    prepareAttack: omniAnimation(stormBeastPrepareAttackAnimation),
    attack: omniAnimation(stormBeastAttackAnimation),
    attackRecover: omniAnimation(stormBeastAttackRecoverAnimation),
    ball: omniAnimation(stormBeastBallAnimation),
}

const stormBeastFlyingGlowAnimation = createAnimation('gfx/enemies/stormbeast2.png', stormBeastGeometry, {cols: 4, duration: 10});
const stormBeastPrepareCastGlowAnimation = createAnimation('gfx/enemies/stormbeast2.png', stormBeastGeometry, {x: 4, cols: 1, duration: 10});
const stormBeastCastGlowAnimation = createAnimation('gfx/enemies/stormbeast2.png', stormBeastGeometry, {x: 5, cols: 1, duration: 10});
const stormBeastChargingGlowAnimation = createAnimation('gfx/enemies/stormbeast2.png', stormBeastGeometry, {x: 6, cols: 2, duration: 10});
const stormBeastPrepareAttackGlowAnimation = createAnimation('gfx/enemies/stormbeast2.png', stormBeastGeometry, {x: 7, cols: 1, duration: 10});
const stormBeastAttackGlowAnimation = createAnimation('gfx/enemies/stormbeast2.png', stormBeastGeometry, {x: 8, cols: 1, duration: 10});
const stormBeastAttackRecoverGlowAnimation = createAnimation('gfx/enemies/stormbeast2.png', stormBeastGeometry, {x: 9, cols: 2, duration: 10});
const stormBeastBallGlowAnimation = createAnimation('gfx/enemies/stormbeast2.png', stormBeastGeometry, {x: 11, cols: 2, duration: 10});

const stormBeastGlowAnimations = {
    idle: omniAnimation(stormBeastFlyingGlowAnimation),
    flying: omniAnimation(stormBeastFlyingGlowAnimation),
    prepareCast: omniAnimation(stormBeastPrepareCastGlowAnimation),
    cast: omniAnimation(stormBeastCastGlowAnimation),
    charging: omniAnimation(stormBeastChargingGlowAnimation),
    prepareAttack: omniAnimation(stormBeastPrepareAttackGlowAnimation),
    attack: omniAnimation(stormBeastAttackGlowAnimation),
    attackRecover: omniAnimation(stormBeastAttackRecoverGlowAnimation),
    ball: omniAnimation(stormBeastBallGlowAnimation),
}

const cloudFormations = [
    [0,406,395,395,407,0,0,406,395,395,407,0,0,406,395,395,407,0,0,406,395,395,407,0],
    [406,413,399,399,412,407,406,413,399,399,412,407,406,413,399,399,412,407,406,413,399,399,412,407],
    [398,399,399,399,399,400,398,399,399,399,399,400,398,399,399,399,399,400,398,399,399,399,399,400],
    [398,399,399,399,399,400,398,399,399,399,399,400,398,399,399,399,399,400,398,399,399,399,399,400],
    [398,399,399,399,399,400,398,399,399,399,399,400,398,399,399,399,399,400,398,399,408,409,399,400],
    [410,409,399,399,408,411,410,409,408,409,408,411,410,403,403,403,403,411,410,403,411,410,403,411],
    [0,410,403,403,411,0,0,410,411,410,411,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,406,395,395,407,0,0,406,395,395,407,0,0,406,395,395,407,0,0,406,395,395,407,0],
    [406,413,399,399,412,407,406,413,399,399,412,407,406,413,399,399,412,407,406,413,399,399,412,407],
    [398,399,399,399,399,400,398,399,399,399,399,400,398,399,399,399,399,400,398,399,408,409,399,400],
    [398,399,399,399,399,400,398,399,408,409,399,400,398,408,403,403,409,400,398,408,411,410,409,400],
    [398,408,403,403,409,400,398,408,411,410,409,400,398,400,0,0,398,400,398,400,0,0,398,400],
    [410,411,0,0,410,411,410,411,0,0,410,411,410,411,0,0,410,411,410,411,0,0,410,411],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const drawCloudFormation = (context: CanvasRenderingContext2D, state: GameState, enemy: Enemy, frame: number): void => {
    for (let row = 0; row < 7; row++) {
        const ty = row + (frame >= 4 ? 7 : 0);
        for (let column = 0; column < 6; column++) {
            const tx = column + (frame % 4) * 6;
            const tile = allTiles[cloudFormations[ty][tx]];
            if (tile) {
                drawFrameAt(context, tile.frame, {
                    x: enemy.x - 24 + 16 * column,
                    y: enemy.y - 48 + 16 * row,
                });
            }
        }
    }
}

interface CloudParams {
    enrageLevel: number
    enrageTime: number
    counterAttackTimer: number
    cloudLife: number
    cloudRegenerateTimer: number
    cloudIsReforming: boolean
    counterAttackMode: 'bolts' | 'discharge'
}


function getHeartHitbox(enemy: Enemy<CloudParams>): Rect {
    return {
        x: enemy.x + 8,
        y: enemy.y,
        w: 32,
        h: 16 + Math.max(16, Math.ceil((enemy.params.cloudLife + 1) / 2) * 16),
    };
};

const stormHeart: EnemyDefinition<CloudParams> = {
    // The storm heart is smaller than other hearts, but takes up a lot of space with its cloud barrier.
    animations: stormHeartAnimations, life: 60, scale: 2,
    tileBehaviors: { solid: true, touchHit: {damage: 0, canAlwaysKnockback: true  }},
    hasShadow: false,
    update: updateStormHeart,
    params: {
        enrageLevel: 0,
        enrageTime: 0,
        counterAttackTimer: 0,
        cloudLife: 7,
        cloudRegenerateTimer: 0,
        cloudIsReforming: false,
        counterAttackMode: 'bolts',
    },
    immunities: ['lightning'],
    elementalMultipliers: {'ice': 1.5, 'fire': 1.5},
    initialMode: 'waiting',
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy<CloudParams>): void {
        let frameIndex = Math.floor(7 - enemy.params.cloudLife);
        frameIndex = Math.min(7, Math.max(0, frameIndex));
        drawCloudFormation(context, state, enemy, frameIndex);

        /*context.save();
            context.globalAlpha *= 0.5;
            const hitbox = enemy.getHitbox(state);
            context.fillStyle = 'white';
            context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
            const innerHitbox = getHeartHitbox(enemy);
            context.fillStyle = 'red';
            context.fillRect(innerHitbox.x, innerHitbox.y, innerHitbox.w, innerHitbox.h);
        context.restore();*/
    },
    renderPreview(context: CanvasRenderingContext2D, enemy: Enemy<CloudParams>, target: Rect): void {
        enemy.defaultRenderPreview(context, target, {x: 0, y: 0, w: 32, h: 32});
    },
    getHitbox(enemy: Enemy<CloudParams>): Rect {
        return {
            x: enemy.x - 16,
            y: enemy.y - 40,
            w: 80,
            h: 32 + Math.max(16, Math.ceil((enemy.params.cloudLife + 1) / 2) * 16),
        };
        /*return {
            x: enemy.x - 24,
            y: enemy.y - 48,
            w: 96,
            h: 48 + Math.max(16, Math.ceil((enemy.params.cloudLife + 1) / 2) * 16),
        };*/
    },
    onHit(state: GameState, enemy: Enemy<CloudParams>, hit: HitProperties): HitResult {
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
            if (hit.damage > 1) {
                if (enemy.params.cloudLife % 2 !== 0) {
                    enemy.params.cloudLife--;
                }
            }
            enemy.params.cloudRegenerateTimer = 1500;
            enemy.makeSound(state, 'enemyHit');
            return { hit: true, stopped: true };
        }
        if (!(enemy.params.counterAttackTimer > 0)) {
            const target = getNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
            const mag = target ? getVectorToTarget(state, enemy, target)?.mag : 0;
            enemy.params.counterAttackMode = (mag >= 128) ? 'bolts' : 'discharge';
            enemy.params.counterAttackTimer = 3200;
        }
        return enemy.defaultOnHit(state, hit);
    }
};
enemyDefinitions.stormHeart = stormHeart;

function getStormHeart(this: void, state: GameState, area: AreaInstance): Enemy<CloudParams> {
    return area.enemies.find(target => target.definition.enemyType === 'stormHeart') as Enemy<CloudParams>;
}

function getOrbs(this: void, state: GameState, area: AreaInstance, status: ObjectStatus): Enemy[] {
    return area.enemies.filter(target => target.definition.enemyType === 'largeOrb' && target.status === status);
}

/*
function getStormBeast(this: void, state: GameState, area: AreaInstance): Enemy {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'flameBeast') as Enemy;
}*/

function isEnemyDefeated(enemy: Enemy): boolean {
    return !enemy || (enemy.life <= 0 && !enemy.isImmortal) || enemy.status === 'gone';
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

function isOrbProtectingHeart(this: void, state: GameState, area: AreaInstance): boolean {
    return getOrbs(state, area.alternateArea, 'normal').length > 0;
}

function updateStormHeart(this: void, state: GameState, enemy: Enemy): void {
    if (enemy.mode === 'waiting') {
        if (enemy.area === state.areaInstance && enemy.life < enemy.enemyDefinition.life) {
            enemy.setMode('choose');
        }
        enemy.healthBarTime = 0;
        return;
    }
    if (enemy.params.counterAttackTimer > 0) {
        enemy.params.counterAttackTimer -= FRAME_LENGTH;
        if (enemy.params.counterAttackMode === 'discharge') {
            // When the hero is nearby, the heart will perform a slow AoE discharge attack
            // to protect itself.
            if (enemy.params.counterAttackTimer === 3000) {
                const hitbox = enemy.getHitbox(state);
                const discharge = new LightningDischarge({
                    x: hitbox.x + hitbox.w / 2,
                    y: hitbox.y + hitbox.h / 2,
                    tellDuration: 3000,
                    radius: 128,
                    source: enemy,
                });
                addEffectToArea(state, enemy.area, discharge);
            }
        } else if (enemy.params.counterAttackMode === 'bolts') {
            // When the hero is far away, the heart will summon a series of targeted
            // lightning bolts to protect itself.
            if (enemy.params.counterAttackTimer % 1000 === 0) {
                const target = getNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
                if (target) {
                    const hitbox = target.getHitbox();
                    enemy.params.theta = (enemy.params.theta || 0) + Math.PI / 4;
                    const lightningBolt = new LightningBolt({
                        x: hitbox.x + hitbox.w / 2,
                        y: hitbox.y + hitbox.h / 2,
                        shockWaveTheta: enemy.params.theta,
                    });
                    addEffectToArea(state, enemy.area, lightningBolt);
                } else {
                    // Abort counterattack if we can no longer find a target.
                    enemy.params.counterAttackTimer = 0;
                }
            }
        }
        if (enemy.params.counterAttackTimer <= 0) {
            enemy.params.cloudRegenerateTimer = 0;
            enemy.params.cloudIsReforming = true;
            enemy.params.cloudLife = 1;
        }
    } else if (enemy.params.cloudLife < 7) {
        if (enemy.params.cloudRegenerateTimer > 0) {
            enemy.params.cloudRegenerateTimer -= FRAME_LENGTH;
        } else {
            enemy.params.cloudLife = Math.min(7, enemy.params.cloudLife + 0.1);
        }
    } else {
        enemy.params.cloudIsReforming = false;
    }
    // Don't do any enrage mechanics until the cloud has finished reforming.
    if (enemy.params.counterAttackTimer > 0 || enemy.params.cloudIsReforming) {
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

interface Path {
    start: number[]
    end: number[]
}

const stormBeastPaths = [
    { start: [320, -80], end: [216, 320]},
    { start: [-80, 320], end: [320, 424]},
    { start: [320, 720], end: [424, 320]},
];


type NearbyTargetType = ReturnType<typeof getVectorToNearbyTarget>;

const sparkAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        enemy.changeToAnimation('prepareAttack');
        faceCenter(state, enemy);
    },
    updateAbility(state: GameState, enemy: Enemy, target: NearbyTargetType) {
        if (enemy.activeAbility.time >= enemy.activeAbility.definition.prepTime - 100) {
            enemy.changeToAnimation('attack');
        }
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        const { section } = getAreaSize(state);
        enemy.changeToAnimation('attackRecover');
        const hitbox = enemy.getHitbox(state);
        const cx = hitbox.x + hitbox.w / 2, cy = hitbox.y + hitbox.h / 2;
        const sparkCount = Math.min(7, Math.max(4, 2 + enemy.modeTime / 1000));
        const baseTheta = Math.atan2(section.y + section.h / 2 - cy, section.x + section.w / 2 - cx);
        enemy.rotation = baseTheta - Math.PI / 2;
        addArcOfShockWaves(state, enemy.area, [cx, cy], sparkCount, baseTheta, Math.PI / 2 / (sparkCount - 2), 44, {
            damage: 2,
            maxSpeed: 5,
            ttl: 4000,
            //delay: 400,
        });
        /*for (let i = 0; i < sparkCount; i++) {
            const theta = baseTheta - Math.PI / 4 + Math.PI / 2 * i / (sparkCount - 1);
            const dx = Math.cos(theta), dy = Math.sin(theta);
            const spark = new Spark({
                x: cx + 16 * dx,
                y: cy + 16 * dy,
                vx: 3 * dx,
                vy: 3 * dy,
                damage: 2,
                ttl: 2000,
            });
            addEffectToArea(state, enemy.area, spark);
        }*/
    },
    cooldown: 2000,
    initialCharges: 3,
    charges: 3,
    prepTime: 600,
    recoverTime: 200,
};

const stormBeastLightningAbility = {
    ...lightningBoltAbility,
    // Allow targeting between worlds.
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, state.hero.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        enemy.changeToAnimation('prepareCast');
        const {x, y} = getVectorToTarget(state, enemy, target.target);
        const theta = Math.atan2(y, x);
        enemy.rotation = theta - Math.PI / 2;
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        lightningBoltAbility.useAbility(state, enemy, target);
        enemy.changeToAnimation('cast');
    },
    cooldown: 2000,
    initialCharges: 2,
    charges: 2,
    prepTime: 600,
    recoverTime: 400,
}

const stormBeastChargedLightningAbility = {
    ...chargedLightningBoltAbility,
    // Allow targeting between worlds.
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, state.hero.area.allyTargets);
    },
    // This powerful ability only activates once the heart is at half health or below.
    isEnabled(state: GameState, enemy: Enemy): boolean {
        const stormHeart = getStormHeart(state, enemy.area);
        if (isEnemyDefeated(stormHeart)) {
            return true;
        }
        return stormHeart.life <= stormHeart.enemyDefinition.life / 2;
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        enemy.changeToAnimation('prepareCast');
        const {x, y} = getVectorToTarget(state, enemy, target.target);
        const theta = Math.atan2(y, x);
        enemy.rotation = theta - Math.PI / 2;
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        chargedLightningBoltAbility.useAbility(state, enemy, target);
        enemy.changeToAnimation('cast');
    },
    prepTime: 600,
    recoverTime: 400,
}

enemyDefinitions.stormBeast = {
    animations: stormBeastAnimations, life: 90, scale: 1, flying: true,
    aggroRadius: 2000,
    abilities: [sparkAbility, stormBeastLightningAbility, stormBeastChargedLightningAbility],
    acceleration: 0.3, speed: 4,
    touchHit: { damage: 4, element: 'lightning'},
    immunities: ['lightning'],
    elementalMultipliers: {'ice': 1.5, 'fire': 1.5},
    initialMode: 'hidden',
    params: {
        enrageLevel: 0,
    },
    update: updateStormBeast,
    afterUpdate(state: GameState, enemy: Enemy) {
        enemy.isInvulnerable = enemy.currentAnimationKey === 'ball';
    },
    renderShadow(this: void, context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        if (enemy.mode === 'hidden') {
            return;
        }
        const animation = stormBeastGlowAnimations[enemy.currentAnimationKey]?.down;
        if (animation) {
            const frame = getFrame(animation, enemy.animationTime);
            enemy.defaultRender(context, state, frame);
        }
    },
    renderOver(this: void, context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        if (enemy.currentAnimationKey === 'ball') {
            const circle = getBallLightningCircle(enemy);
            renderLightningCircle(context, {...circle, r: circle.r + 8}, 4, 50);
        }
        if (enemy.currentAnimationKey === 'prepareCast') {
            const hitbox = enemy.getHitbox();
            const circle = {
                x: hitbox.x + hitbox.w / 2 - 30 * Math.sin(enemy.rotation),
                y: hitbox.y + hitbox.h / 2 + 30 * Math.cos(enemy.rotation),
                r: Math.min(32, 8 + enemy.animationTime / 10),
            };
            // This is based on the prep time for the lightning bolt animation and causes
            // the circle to rapidly shrink for the last 200ms.
            //if (enemy.animationTime > 400) {
            //    circle.r = Math.max(0, 40 - (enemy.animationTime - 400) / 5);
            //}
            if (circle.r > 4) {
                renderLightningCircle(context, circle, 4, 50);
            }
        }
        /*if (enemy.currentAnimationKey === 'cast') {
            const hitbox = enemy.getHitbox();
            const circle = {
                x: hitbox.x + hitbox.w / 2 - 30 * Math.sin(enemy.rotation),
                y: hitbox.y + hitbox.h / 2 + 30 * Math.cos(enemy.rotation),
                r: Math.max(0, 40 - enemy.animationTime / 4),
            };
            if (circle.r > 4) {
                renderLightningCircle(context, circle, 4, 50);
            }
        }*/
    },
};

function faceCenter(state: GameState, enemy: Enemy): void {
    const { section } = getAreaSize(state);
    const hitbox = enemy.getHitbox(state);
    const cx = hitbox.x + hitbox.w / 2, cy = hitbox.y + hitbox.h / 2;
    const baseTheta = Math.atan2(section.y + section.h / 2 - cy, section.x + section.w / 2 - cx);
    enemy.rotation = baseTheta - Math.PI / 2;
}

function getBallLightningCircle(enemy: Enemy): Circle {
    const r = Math.min(32, enemy.animationTime / 20);
    const hitbox = enemy.getHitbox();
    return {
        x: hitbox.x + hitbox.w / 2,
        y: hitbox.y + hitbox.h / 2,
        r,
    };
}

function leaveScreen(enemy: Enemy): void {
    enemy.setMode('leave');
    if (!(enemy.params.enrageTime > 0)) {
        enemy.changeToAnimation('flying');
    }
    const theta = Math.random() * 2 * Math.PI;
    enemy.rotation = theta - Math.PI / 2;
    enemy.params.targetVector = {x: Math.cos(theta), y: Math.sin(theta)};
    enemy.vx = 0;
    enemy.vy = 0;
}

function updateStormBeast(this: void, state: GameState, enemy: Enemy): void {
    const stormHeart = getStormHeart(state, enemy.area);
    if (enemy.mode === 'hidden') {
        // Stay hidden until the player enters the same area and damages the storm heart(or no heart is present).
        if (enemy.area === state.areaInstance && (!stormHeart || stormHeart?.life < stormHeart?.enemyDefinition.life)) {
            const { section } = getAreaSize(state);
            enemy.status = 'normal';
            enemy.setMode('enter');
            enemy.changeToAnimation('ball');
            enemy.x = section.x + section.w / 2;
            enemy.y = section.y - 48;
        }
        enemy.healthBarTime = 0;
        return;
    }
    // If the hero
    if (enemy.mode !== 'regenerate' && enemy.mode !== 'transform' && enemy.area !== state.areaInstance) {
        enemy.setMode('attackOtherWorld');
        const t = {x: 320, y: 320};
        if (moveEnemyToTargetLocation(state, enemy, t.x, t.y) < 10) {
            faceCenter(state, enemy);
            enemy.useRandomAbility(state);
        } else {
            const hitbox = enemy.getHitbox();
            enemy.rotation = Math.atan2(t.y - (hitbox.y + hitbox.h / 2), t.x - (hitbox.x + hitbox.w / 2)) - Math.PI / 2;
        }
        return;
    }
    // Leave the screen when the hero returns.
    if (enemy.mode === 'attackOtherWorld' && enemy.area === state.areaInstance) {
        leaveScreen(enemy);
        return;
    }
    // While the beast is a ball of lightning, it moves super fast and does AoE lightning damage around it.
    if (enemy.currentAnimationKey === 'ball') {
        enemy.speed = 6;
        hitTargets(state, enemy.area, {
            hitCircle: getBallLightningCircle(enemy),
            damage: 4,
            element: 'lightning',
            hitAllies: true,
        });
    } else {
        enemy.speed = 4;
    }
    const maxLife = enemy.enemyDefinition.life;
    if (isEnemyDefeated(stormHeart)) {
        if (enemy.life <= maxLife * 2 / 3 && enemy.params.enrageLevel === 0) {
            enemy.params.enrageLevel = 1;
            enemy.params.enrageTime = 4500;
            // Burn damaged is reduced by 80% when entering rage phase.
            enemy.burnDamage *= 0.2;
        } else if (enemy.life <= maxLife * 1 / 3 && enemy.params.enrageLevel === 1) {
            enemy.params.enrageLevel = 2;
            enemy.params.enrageTime = 4500;
            // Burn damaged is reduced by 80% when entering rage phase.
            enemy.burnDamage *= 0.2;
        }
    } else if (enemy.mode !== 'regenerate' && enemy.mode !== 'transform' && isOrbProtectingHeart(state, enemy.area)) {
        enemy.setMode('protect');
        const t = {x: 400, y: 320};
        if (moveEnemyToTargetLocation(state, enemy, t.x, t.y) < 10) {
            faceCenter(state, enemy);
            // Attack on cooldown once the heart stops raging unless the beast needs to regenerate.
            if (stormHeart.params.enrageTime <= 0 && enemy.life >= enemy.enemyDefinition.life * 2 / 3) {
                enemy.useRandomAbility(state);
            }
        } else {
            const hitbox = enemy.getHitbox();
            enemy.rotation = Math.atan2(t.y - (hitbox.y + hitbox.h / 2), t.x - (hitbox.x + hitbox.w / 2)) - Math.PI / 2;
        }
    }
    if (enemy.mode === 'protect' && !isOrbProtectingHeart(state, enemy.area)) {
        leaveScreen(enemy);
        return;
    }
    const target = getNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
    // The storm beast teleports to the center of the screen as a ball of lightning.
    if (enemy.mode === 'enter') {
        const { section } = getAreaSize(state);
        if (moveEnemyToTargetLocation(state, enemy, section.x + section.w / 2, section.y + section.h / 2 - 80) < 10) {
            enemy.setMode('attack');
        }
        return;
    }
    // The storm beast accelerates in a chosen direction until it is completely off of the screen.
    if (enemy.mode === 'leave') {
        accelerateInDirection(state, enemy, enemy.params.targetVector);
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        if (hasEnemyLeftSection(state, enemy, 48) && enemy.modeTime > 2000) {
            enemy.setMode('choose');
        }
        return;
    }
    const isEnraged = enemy.params.enrageTime > 0;
    if (isEnraged) {
        enemy.params.enrageTime -= FRAME_LENGTH;
    }
    if (enemy.mode === 'transform') {
        if (enemy.modeTime <= 100) {
            enemy.changeToAnimation('prepareCast');
        } else {
            enemy.changeToAnimation('cast');
        }
        if (enemy.modeTime >= 200) {
            enemy.changeToAnimation('ball');
            if (enemy.life < maxLife * 2 / 3 && !isEnemyDefeated(stormHeart)) {
                enemy.setMode('regenerate');
            } else {
                leaveScreen(enemy);
            }
        }
        return;
    }
    if (enemy.mode === 'regenerate') {
        if (isEnemyDefeated(stormHeart)) {
            leaveScreen(enemy);
            return;
        }
        const heartBox = stormHeart.getHitbox();
        if (moveEnemyToTargetLocation(state, enemy, heartBox.x + heartBox.w / 2, heartBox.y + heartBox.h / 2) < 10) {
            if (enemy.modeTime % 100 === 0) {
                enemy.life += 0.1;
                // Drains a little life from the heart to regenerate.
                // stormHeart.life -= 0.1;
            }
        }
        if (enemy.life >= maxLife) {
            enemy.life = maxLife;
            leaveScreen(enemy);
        }
        return;
    }
    if (!enemy.activeAbility && enemy.life < enemy.enemyDefinition.life * 2 / 3
        && !isEnemyDefeated(stormHeart) && enemy.currentAnimationKey !== 'ball'
    ) {
        enemy.setMode('transform');
        return;
    }
    if (isEnraged && enemy.currentAnimationKey !== 'ball') {
        enemy.setMode('transform');
        return;
    }
    // The storm beast uses random abilities for a set period of time.
    if (enemy.mode === 'attack') {
        if (!enemy.activeAbility) {
            enemy.changeToAnimation('idle');
            const timeLimit = isEnemyDefeated(stormHeart) ? 4000 : 3000;
            if (enemy.modeTime > timeLimit) {
                leaveScreen(enemy);
                return;
            }
        }
        if (enemy.modeTime >= 600) {
            enemy.useRandomAbility(state);
        }
        return;
    }
    if (enemy.mode === 'choose') {
        // Occasionally the Storm Beast will just fly across the screen at the player.
        if (isEnraged || Math.random() <= 0.2) {
            const theta = 2 * Math.PI * Math.random();
            enemy.x = 256 + 400 * Math.cos(theta);
            enemy.y = 256 + 400 * Math.sin(theta);
            if (target) {
                enemy.params.targetVector = getVectorToTarget(state, enemy, target);
            } else {
                const { section } = getAreaSize(state);
                enemy.params.targetVector = {
                    x: section.x + section.w / 2 - enemy.x,
                    y: section.y + section.h / 2 - enemy.y,
                };
            }
            enemy.vx = 0;
            enemy.vy = 0;
            enemy.rotation = Math.atan2(enemy.params.targetVector.y, enemy.params.targetVector.x) - Math.PI / 2;
            enemy.setMode('charge');
            // Beast stays in ball lightning form the entire enrage phase.
            if (!isEnraged) {
                enemy.changeToAnimation('charging');
            }
            return;
        }
        // Usually the Storm Beast will pick a location near the platform to fly to
        // and perform an attack.
        if (!enemy.params.paths?.length) {
            enemy.params.paths = [...stormBeastPaths];
        }
        const path = Random.removeElement(enemy.params.paths as Path[]);
        enemy.params.targetLocation = path.end;
        enemy.x = path.start[0];
        enemy.y = path.start[1];
        const theta = Math.atan2(path.end[1] - path.start[1], path.end[0] - path.start[0]);
        enemy.rotation = theta - Math.PI / 2;
        enemy.changeToAnimation('ball');
        enemy.setMode('approach');
        return;
    }
    if (enemy.mode === 'approach') {
        const [x, y] = enemy.params.targetLocation;
        if (moveEnemyToTargetLocation(state, enemy, x, y) < 5) {
            faceCenter(state, enemy);
            enemy.setMode('attack');
        }
        return;
    }
    if (enemy.mode === 'charge') {
        if (isEnraged && enemy.modeTime % 200 === 0) {
            enemy.speed = 3;
            // This is already orthogonal to the direction the beast is moving.
            let theta = enemy.rotation;
            if (enemy.modeTime % 400 === 0) {
                theta += Math.PI;
            }
            const dx = Math.cos(theta), dy = Math.sin(theta);
            const hitbox = enemy.getHitbox();
            const spark = new Spark({
                x: hitbox.x + hitbox.w / 2 + 4 * dx,
                y: hitbox.y + hitbox.h / 2 + 4 * dy,
                vx: 2 * dx,
                vy: 2 * dy,
                damage: 2,
                ttl: 2000,
                hitCircle: {
                    x: 0, y: 0, r: 8
                },
            });
            addEffectToArea(state, enemy.area, spark);
        }
        accelerateInDirection(state, enemy, enemy.params.targetVector);
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        if (hasEnemyLeftSection(state, enemy, 48)) {
            enemy.setMode('choose');
        }
    }
}

