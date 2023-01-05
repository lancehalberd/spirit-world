import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { addEffectToArea } from 'app/content/areas';
import { LightningBolt } from 'app/content/effects/lightningBolt';
import { LightningDischarge } from 'app/content/effects/lightningDischarge';
import { Spark } from 'app/content/effects/spark';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { allTiles } from 'app/content/tiles';
import { debugCanvas } from 'app/dom';
import {
    accelerateInDirection,
    getNearbyTarget,
    //getVectorToNearbyTarget,
    getVectorToTarget,
    hasEnemyLeftSection,
    // moveEnemy,
    moveEnemyToTargetLocation,
    //paceRandomly,
} from 'app/content/enemies';
import { beetleWingedAnimations } from 'app/content/enemyAnimations';
import { createCanvasAndContext } from 'app/dom';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, drawFrameAt } from 'app/utils/animations';
import { pad, rectanglesOverlap } from 'app/utils/index';
import { getDirection } from 'app/utils/field';
import { playSound } from 'app/musicController';
import Random from 'app/utils/Random';
import { allImagesLoaded } from 'app/utils/images';

import { AreaInstance, Enemy, GameState, HitProperties, HitResult, Rect } from 'app/types';

// This is just the spirit sight frame.

const stormGeometry = {w: 20, h: 20, content: {x: 4, y: 10, w: 12, h: 8}};
export const [lightningElement] = createAnimation('gfx/hud/elementhud.png', stormGeometry, {x: 3}).frames;
const [stormHeartCanvas, stormHeartContext] = createCanvasAndContext(lightningElement.w * 4, lightningElement.h * 2);
const createFlameAnimation = async () => {
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
createFlameAnimation();
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
                    x: enemy.x - 32 + 16 * column,
                    y: enemy.y - 32 + 16 * row,
                });
            }
        }
    }
}


enemyDefinitions.stormHeart = {
    // The storm heart is smaller than other hearts, but takes up a lot of space with its cloud barrier.
    animations: stormHeartAnimations, life: 24, scale: 2, touchHit: { damage: 0 },
    hasShadow: false,
    update: updateStormHeart,
    params: {
        enrageLevel: 0,
        counterAttackTimer: 0,
        cloudLife: 7,
        cloudRegenerateTimer: 0,
    },
    immunities: ['lightning'],
    elementalMultipliers: {'ice': 1.5, 'fire': 1.5},
    initialMode: 'hidden',
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        let frameIndex = Math.floor(7 - enemy.params.cloudLife);
        frameIndex = Math.min(7, Math.max(0, frameIndex));
        drawCloudFormation(context, state, enemy, frameIndex);
        /*
        context.save();
            context.globalAlpha *= 0.5;
            const hitbox = enemy.getHitbox(state);
            context.fillStyle = 'white';
            context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
            const innerHitbox = {
                x: enemy.x,
                y: enemy.y,
                w: 32,
                h: 16 + Math.max(16, Math.ceil((enemy.params.cloudLife + 1) / 2) * 16),
            };
            context.fillStyle = 'red';
            context.fillRect(innerHitbox.x, innerHitbox.y, innerHitbox.w, innerHitbox.h);
        context.restore();*/
    },
    renderPreview(context: CanvasRenderingContext2D, enemy: Enemy, target: Rect): void {
        enemy.defaultRenderPreview(context, target, {x: 0, y: 0, w: 32, h: 32});
    },
    getHitbox(enemy: Enemy): Rect {
        return {
            x: enemy.x - 32,
            y: enemy.y - 32,
            w: 96,
            h: 48 + Math.max(16, Math.ceil((enemy.params.cloudLife + 1) / 2) * 16),
        };
    },
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        const hitInnerBox = hit.hitbox && rectanglesOverlap({
            x: enemy.x,
            y: enemy.y,
            w: 32,
            h: 16 + Math.max(16, Math.ceil((enemy.params.cloudLife + 1) / 2) * 16),
        }, hit.hitbox);
        // Cloud cannot be damaged while it is reforming after a counter attack or while enraged
        if (enemy.params.cloudIsReforming || enemy.params.enrageTime > 0 || !hitInnerBox) {
            return { hit: true, stopped: true };
        }
        if (enemy.params.cloudLife > 0) {
            enemy.params.cloudLife = Math.ceil(enemy.params.cloudLife - 1);
            if (hit.damage > 1) {
                if (enemy.params.cloudLife % 2 !== 0) {
                    enemy.params.cloudLife--;
                }
            }
            enemy.params.cloudRegenerateTimer = 1500;
            playSound('enemyHit');
            return { hit: true, stopped: true };
        }
        if (!(enemy.params.counterAttackTimer > 0)) {
            const target = getNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
            const { mag } = getVectorToTarget(state, enemy, target);
            enemy.params.counterAttackMode = (mag >= 90) ? 'bolts' : 'discharge';
            enemy.params.counterAttackTimer = 3200;
        }
        return enemy.defaultOnHit(state, hit);
    }
};
enemyDefinitions.stormBeast = {
    animations: beetleWingedAnimations, life: 36, scale: 4, update: updateStormBeast, flying: true,
    acceleration: 0.3, speed: 4,
    touchHit: { damage: 4, element: 'lightning'},
    immunities: ['lightning'],
    elementalMultipliers: {'ice': 1.5, 'fire': 1.5},
    initialMode: 'hidden',
    params: {
        enrageLevel: 0,
    },
};

function getStormHeart(this: void, state: GameState, area: AreaInstance): Enemy {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'stormHeart') as Enemy;
}

/*
function getStormBeast(this: void, state: GameState, area: AreaInstance): Enemy {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'flameBeast') as Enemy;
}*/

function isEnemyDefeated(enemy: Enemy): boolean {
    return !enemy || (enemy.life <= 0 && !enemy.isImmortal) || enemy.status === 'gone';
}

function updateStormHeart(this: void, state: GameState, enemy: Enemy): void {
    if (enemy.mode === 'hidden') {
        if (enemy.area === state.areaInstance) {
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
                    radius: 96,
                    source: enemy,
                });
                addEffectToArea(state, enemy.area, discharge);
            }
        } else if (enemy.params.counterAttackMode === 'bolts') {
            // When the hero is far away, the heart will summon a series of targeted
            // lightning bolts to protect itself.
            if (enemy.params.counterAttackTimer % 1000 === 0) {
                const hitbox = state.hero.getHitbox(state);
                enemy.params.theta = (enemy.params.theta || 0) + Math.PI / 4;
                const lightningBolt = new LightningBolt({
                    x: hitbox.x + hitbox.w / 2,
                    y: hitbox.y + hitbox.h / 2,
                    shockWaveTheta: enemy.params.theta,
                });
                addEffectToArea(state, enemy.area, lightningBolt);
            }
        }
        if (enemy.params.counterAttackTimer <= 0) {
            enemy.params.cloudRegenerateTimer = 0;
            enemy.params.cloudIsReforming = true;
            enemy.params.cloudLife = 1;
        }
        enemy.params.previousLife = enemy.life;
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
        enemy.enemyInvulnerableFrames = enemy.invulnerableFrames = 20;
        if (enemy.params.enrageTime % 2000 === 0) {
            enemy.params.theta = (enemy.params.theta || 0) + Math.PI / 4;
            const hitbox = state.hero.getHitbox(state);
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
    if (enemy.life <= enemy.enemyDefinition.life * 2 / 3 && enemy.params.enrageLevel === 0) {
        enemy.params.enrageLevel = 1;
        enemy.params.enrageTime = 6500;
        enemy.modeTime = 0;
    } else if (enemy.life <= enemy.enemyDefinition.life * 1 / 3 && enemy.params.enrageLevel === 1) {
        enemy.params.enrageLevel = 2;
        enemy.params.enrageTime = 8500;
        enemy.modeTime = 0;
    }
}

interface Path {
    start: number[]
    end: number[]
}

const stormBeastPaths = [
    { start: [256, -64], end: [128, 256]},
    { start: [-64, 256], end: [256, 384]},
    { start: [256, 576], end: [384, 256]},
];

function updateStormBeast(this: void, state: GameState, enemy: Enemy): void {
    if (enemy.mode === 'hidden') {
        if (enemy.area === state.areaInstance) {
            enemy.setMode('choose');
        }
        enemy.healthBarTime = 0;
        return;
    }
    const stormHeart = getStormHeart(state, enemy.area);
    const target = getNearbyTarget(state, enemy, 2000, enemy.area.allyTargets);
    if (enemy.status === 'hidden') {
        if (enemy.mode === 'regenerate') {
            if (isEnemyDefeated(stormHeart)) {
                enemy.setMode('choose');
                return;
            }
            // Cannot deal or take damage while regenerating.
            enemy.enemyInvulnerableFrames = enemy.invulnerableFrames = 20;
            if (enemy.modeTime % 100 === 0) {
                const box = pad(stormHeart.getHitbox(state), - 16)
                addSparkleAnimation(state, enemy.area, box, { element: 'lightning' });
            }
            if (enemy.modeTime % 1000 === 0) {
                enemy.life += 0.5;
                // Drains a little life from the heart to regenerate.
                stormHeart.life -= 0.1;
            }
            if (enemy.life >= enemy.enemyDefinition.life) {
                enemy.life = enemy.enemyDefinition.life;
                enemy.setMode('choose');
            }
            return;
        }
        enemy.status = 'normal';
        // Occasionally the Storm Beast will just fly across the screen at the player.
        if (target && Math.random() <= 0.2) {
            const theta = 2 * Math.PI * Math.random();
            enemy.x = 256 + 400 * Math.cos(theta);
            enemy.y = 256 + 400 * Math.sin(theta);
            enemy.params.targetVector = getVectorToTarget(state, enemy, target);
            enemy.vx = enemy.params.targetVector.x;
            enemy.vy = enemy.params.targetVector.y;
            enemy.setMode('charge');
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
        enemy.setMode('approach');
        return;
    }
    if (enemy.life < enemy.enemyDefinition.life * 2 / 3) {
        if (!isEnemyDefeated(stormHeart)) {
            enemy.setMode('regenerate');
            const sparkCount = 8;
            const hitbox = enemy.getHitbox(state);
            for (let i = 0; i < sparkCount; i++) {
                const theta = i * 2 * Math.PI / sparkCount;
                addSparkleAnimation(state, enemy.area, {
                    x: hitbox.x + hitbox.w / 2 + 4 * i * Math.cos(theta),
                    y: hitbox.y + hitbox.h / 2 + 4 * i * Math.sin(theta),
                    w: 0,
                    h: 0,
                }, { element: 'lightning', delay: i * 3 * FRAME_LENGTH });
                addSparkleAnimation(state, enemy.area, {
                    x: hitbox.x + hitbox.w / 2 + 4 * i * Math.cos(theta + Math.PI),
                    y: hitbox.y + hitbox.h / 2 + 4 * i * Math.sin(theta + Math.PI),
                    w: 0,
                    h: 0,
                }, { element: 'lightning', delay: i * 3 * FRAME_LENGTH });
            }
            enemy.status = 'hidden';
            return;
        }
    }
    if (!target) {
        return;
    }
    const targetVector = getVectorToTarget(state, enemy, target);
    if (enemy.mode === 'choose') {
        enemy.d = getDirection(targetVector.x, targetVector.y);
        enemy.setAnimation('idle', enemy.d);
    } else if (enemy.mode === 'approach') {
        const [x, y] = enemy.params.targetLocation;
        if (moveEnemyToTargetLocation(state, enemy, x, y) < 5) {
            enemy.setMode('attackPlatform');
        }
    } else if (enemy.mode === 'attackPlatform') {
        const hitbox = enemy.getHitbox(state);
        const cx = hitbox.x + hitbox.w / 2, cy = hitbox.y + hitbox.h / 2;
        if (enemy.modeTime && enemy.modeTime % 800 === 0) {
            const sparkCount = 3 + enemy.modeTime / 800;
            const baseTheta = Math.atan2(256 - cy, 256 - cx);
            for (let i = 0; i < sparkCount; i++) {
                const theta = baseTheta - Math.PI / 6 + Math.PI / 3 * i / (sparkCount - 1);
                const dx = Math.cos(theta), dy = Math.sin(theta);
                const spark = new Spark({
                    x: cx + 16 * dx,
                    y: cy + 16 * dy,
                    vx: 3 * dx,
                    vy: 3 * dy,
                    ttl: 2000,
                });
                addEffectToArea(state, enemy.area, spark);
            }
        }
        const timeLimit = isEnemyDefeated(stormHeart) ? 3000 : 2000;
        if (enemy.modeTime >= timeLimit) {
            // Fly away from the platform.
            enemy.params.targetVector = {x: cx - 256, y: cy - 256};
            enemy.vy = enemy.vx = 0;
            enemy.setMode('charge');
        }
    } else if (enemy.mode === 'charge') {
        accelerateInDirection(state, enemy, enemy.params.targetVector);
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        if (hasEnemyLeftSection(state, enemy)) {
            enemy.setMode('choose');
            enemy.status = 'hidden';
        }
    }
}

