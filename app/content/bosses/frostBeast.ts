import { FieldAnimationEffect } from 'app/content/effects/animationEffect';
import { Frost } from 'app/content/effects/frost';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { throwIceGrenadeAtLocation } from 'app/content/effects/frostGrenade';
import { Enemy } from 'app/content/enemy';
import { enemyDeathAnimation, omniAnimation, snakeAnimations } from 'app/content/enemyAnimations';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, getFrame, drawFrame } from 'app/utils/animations';
//import { createCanvasAndContext } from 'app/utils/canvas';
import {getCardinalDirection} from 'app/utils/direction';
import { addEffectToArea } from 'app/utils/effects';
import {
    accelerateInDirection,
    isEnemyDefeated,
    moveEnemy,
    moveEnemyToTargetLocation,
} from 'app/utils/enemies';
import { hitTargets } from 'app/utils/field';
//import { allImagesLoaded } from 'app/utils/images';
import { sample } from 'app/utils/index';
import { getVectorToNearbyTarget } from 'app/utils/target';



// Center axies is basically at x=31
const frostGeometry = {w: 56, h: 56, content: {x: 18, y: 30, w: 26, h: 20}};
//const frostSurfaceGeometry = {w: 56, h: 28, content: {x: 18, y: 18, w: 26, h: 10}};
const frostSurfaceGeometry = {w: 56, h: 32, content: {x: 18, y: 22, w: 26, h: 10}};
const frostWaterGeometry = {w: 56, h: 28, content: {x: 18, y: 18, w: 26, h: 10}};
/*export const [iceElement] = createAnimation('gfx/hud/elementhud.png', frostGeometry, {x: 2}).frames;
const [frostHeartCanvas, frostHeartContext] = createCanvasAndContext(iceElement.w * 4, iceElement.h * 2);
const createFrostAnimation = async () => {
    await allImagesLoaded();
    drawFrame(frostHeartContext, iceElement, {x: 0, y: 0, w: iceElement.w * 2, h: iceElement.h * 2});
    frostHeartContext.save();
        frostHeartContext.translate((iceElement.w + iceElement.content.x + iceElement.content.w / 2) * 2, 0);
        frostHeartContext.scale(-1, 1);
        drawFrame(frostHeartContext, iceElement, {
            x: 2* (-iceElement.content.w / 2 - iceElement.content.x), y: 0,
            w: iceElement.w * 2, h: iceElement.h * 2
        });
    frostHeartContext.restore();
    drawFrame(frostHeartContext, iceElement, {...iceElement, x: 0, y: iceElement.h - 2});
    drawFrame(frostHeartContext, iceElement, {...iceElement, x: iceElement.w, y: iceElement.h});
    drawFrame(frostHeartContext, iceElement, {...iceElement, x: 2 * iceElement.w, y: iceElement.h});
    drawFrame(frostHeartContext, iceElement, {...iceElement, x: 3 * iceElement.w, y: iceElement.h - 2});
}
createFrostAnimation();
const frostHeartAnimation = createAnimation(frostHeartCanvas, {w: 40, h: 40, content: {x: 8, y: 20, w: 24, h: 16}}, {cols: 2});
*/
const shallowGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 11, w: 16, h: 5}};
const wadingAnimation = createAnimation('gfx/shallowloop.png', shallowGeometry, {cols: 3, duration: 10});
const frostHeartIdleAnimation = createAnimation('gfx/bosses/frostHeartIdle.png', frostGeometry, {cols: 8, frameMap: [0,1,2,3,4,5,6,7,6,5,4,3,2,1]});
const frostHeartSurfaceIdleAnimation = createAnimation('gfx/bosses/frostHeartIdle.png', frostSurfaceGeometry, {cols: 8, frameMap: [0,1,2,3,4,5,6,7,6,5,4,3,2,1]});
const frostHeartWaterIdleAnimation = createAnimation('gfx/bosses/frostHeartIdle.png', frostWaterGeometry, {top: 28, cols: 8, frameMap: [0,1,2,3,4,5,6,7,6,5,4,3,2,1]});
export const frostHeartAnimations = {
    idle: omniAnimation(frostHeartIdleAnimation),
};
export const frostHeartSurfaceAnimations = {
    idle: omniAnimation(frostHeartSurfaceIdleAnimation),
};
export const frostHeartWaterAnimations = {
    idle: omniAnimation(frostHeartWaterIdleAnimation),
};
const frostHeartShieldDamagedAnimations = [
    createAnimation('gfx/bosses/frostHeartShield.png', frostGeometry, {x: 0, cols: 4}, {loop: false}),
    createAnimation('gfx/bosses/frostHeartShield.png', frostGeometry, {x: 4, cols: 4}, {loop: false}),
    createAnimation('gfx/bosses/frostHeartShield.png', frostGeometry, {x: 8, cols: 4}, {loop: false}),
    createAnimation('gfx/bosses/frostHeartShield.png', frostGeometry, {x: 12, cols: 4}, {loop: false}),
    createAnimation('gfx/bosses/frostHeartShield.png', frostGeometry, {x: 16, cols: 4}, {loop: false}),
    createAnimation('gfx/bosses/frostHeartShield.png', frostGeometry, {x: 20, cols: 4}, {loop: false}),
    createAnimation('gfx/bosses/frostHeartShield.png', frostGeometry, {x: 24, cols: 6}, {loop: false}),
];
const frostHeartShieldGrowingAnimations = [
    createAnimation('gfx/bosses/frostHeartShieldGrow.png', frostGeometry, {x: 0, cols: 3}, {loop: false}),
    createAnimation('gfx/bosses/frostHeartShieldGrow.png', frostGeometry, {x: 3, cols: 2}, {loop: false}),
    createAnimation('gfx/bosses/frostHeartShieldGrow.png', frostGeometry, {x: 5, cols: 2}, {loop: false}),
    createAnimation('gfx/bosses/frostHeartShieldGrow.png', frostGeometry, {x: 7, cols: 2}, {loop: false}),
    createAnimation('gfx/bosses/frostHeartShieldGrow.png', frostGeometry, {x: 9, cols: 2}, {loop: false}),
    createAnimation('gfx/bosses/frostHeartShieldGrow.png', frostGeometry, {x: 11, cols: 2}, {loop: false}),
    createAnimation('gfx/bosses/frostHeartShieldGrow.png', frostGeometry, {x: 13, cols: 1}, {loop: false}),
];
const maxShieldLevel = frostHeartShieldGrowingAnimations.length;

interface FrostHeartParams {
    chargeLevel: number
    enrageLevel: number
    enrageTime?: number
    shieldLevel: number
    targetShieldLevel: number
    active?: boolean
}



enemyDefinitions.frostHeart = {
    naturalDifficultyRating: 20,
    floating: true,
    animations: frostHeartSurfaceAnimations, life: 50, scale: 2, touchDamage: 1, params: {
        chargeLevel: 0,
        enrageLevel: 0,
        shieldLevel: maxShieldLevel,
        targetShieldLevel: maxShieldLevel,
    },
    immunities: ['ice'],
    elementalMultipliers: {'fire': 1.5, 'lightning': 1.2},
    canSwim: true,
    renderOver: renderIceShield,
    getHitbox(enemy: Enemy<FrostHeartParams>) {
        const hitbox = enemy.getDefaultHitbox();
        if (enemy.params.shieldLevel > 0) {
            return {
                x: hitbox.x - 24,
                y: hitbox.y - 4,
                w: hitbox.w + 48,
                h: hitbox.h + 8,
            }
        }
        return hitbox;
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy<FrostHeartParams>) {
        // Only the underwater instance casts a shadow, the top instance is floating in the water.
        if (state.surfaceAreaInstance) {
            enemy.defaultRenderShadow(context, state);
        } else {
            const frame = getFrame(wadingAnimation, enemy.time);
            const hitbox = enemy.getHitbox();
            //const targetWidth = 2 * p + hitbox.w;
            //const targetHeight = 2 * p + hitbox.h;
            const scale = 3;
            //const scale = enemy.scale;// Math.round(Math.max(1, targetWidth / 24, targetHeight / 24) * 2) / 2;
            // Note enemy hitbox already incorporates the z value into the y value of the hitbox.
            drawFrame(context, frame, {
                x: hitbox.x - (frame.w * scale - hitbox.w) / 2,
                y: hitbox.y + hitbox.h - frame.h * scale + 2 * scale,
                w: frame.w * scale,
                h: frame.h * scale,
            });
        }
    },
    onHit(state: GameState, enemy: Enemy<FrostHeartParams>, hit: HitProperties): HitResult {
        // If the shield is up, only fire damage can hurt it.
        if (enemy.params.shieldLevel > 0) {
            if (hit.damage && hit.element === 'fire') {
                if (enemy.enemyInvulnerableFrames > 0) {
                    return {};
                }
                // What the shield's effective max life is relative to the player's damage.
                const maxShieldLife = 20;
                let shieldLife = enemy.params.shieldLevel / maxShieldLevel * maxShieldLife - hit.damage;
                enemy.params.targetShieldLevel = Math.max(0, Math.min(enemy.params.targetShieldLevel - 1, Math.floor(shieldLife / maxShieldLife * maxShieldLevel)));
                enemy.enemyInvulnerableFrames = 20;
                enemy.makeSound(state, 'enemyHit');
                return { hit: true };
            }
        }
        // Ice damage will regenerate the shield.
        if (hit.damage && hit.element === 'ice') {
            if (enemy.blockInvulnerableFrames > 0) {
                return {};
            }
            enemy.params.targetShieldLevel = Math.min(maxShieldLevel, enemy.params.targetShieldLevel + 1);
            enemy.blockInvulnerableFrames = 50;
            enemy.playBlockSound(state);
            return { hit: true };
        }
        if (enemy.area.underwater) {
            hit.damage /= 2;
        }
        // Use the default hit behavior, the attack will be blocked if the shield is still up.
        return enemy.defaultOnHit(state, hit);
    },
    getShieldPercent(state: GameState, enemy: Enemy<FrostHeartParams>) {
        return enemy.params.shieldLevel / maxShieldLevel;
    },
    update: updateFrostHeart,
};

enemyDefinitions.frostBeast = {
    naturalDifficultyRating: 100,
    animations: snakeAnimations, life: 80, scale: 3, touchDamage: 2, update: updateFrostSerpent, flipRight: true,
    canSwim: true,
    acceleration: 0.3, speed: 2,
    immunities: ['ice'],
    elementalMultipliers: {'fire': 1.5, 'lightning': 1.2},
    params: {
        submerged: true,
    },
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        if (isFrostBeastHidden(enemy)) {
            return {};
        }
        return enemy.defaultOnHit(state, hit);
    },
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        if (isFrostBeastHidden(enemy)) {
            return;
        }
        enemy.defaultRender(context, state);
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        if (isFrostBeastHidden(enemy)) {
            return;
        }
        enemy.defaultRenderShadow(context, state);
    }
};

function isFrostBeastHidden(enemy: Enemy) {
    return (enemy.area?.underwater && !enemy.params.submerged) || (!enemy.area?.underwater && enemy.params.submerged);
}

function getFrostHeart(state: GameState, area: AreaInstance): Enemy<FrostHeartParams> {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'frostHeart') as Enemy<FrostHeartParams>;
}

function getFrostSerpent(state: GameState, area: AreaInstance): Enemy {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'frostBeast') as Enemy;
}

/*function getShieldLevel(enemy: Enemy<FrostHeartParams>): number {
    return Math.ceil(enemy.params.shieldLevel);
}*/

function updateFrostHeart(state: GameState, enemy: Enemy<FrostHeartParams>): void {
    if (enemy.params.shieldLevel < enemy.params.targetShieldLevel) {
        // The shield takes a minimum of 2 seconds to fully regenerate.
        enemy.params.shieldLevel = Math.min(enemy.params.targetShieldLevel, enemy.params.shieldLevel + FRAME_LENGTH / 1000 * maxShieldLevel / 2);
    } else if (enemy.params.shieldLevel > enemy.params.targetShieldLevel) {
        // The shield takes a minimum of 1 second to be fully destroyed.
        enemy.params.shieldLevel = Math.max(enemy.params.targetShieldLevel, enemy.params.shieldLevel - FRAME_LENGTH / 1000 * maxShieldLevel);
    }
    // The surface+underwater heart are actually two bosses in two different areas that
    // are combined as if a single boss. Simlarly for the serpents.
    let surfaceHeart, underwaterHeart;
    if (state.surfaceAreaInstance) {
        surfaceHeart = getFrostHeart(state, state.surfaceAreaInstance);
        underwaterHeart = enemy;
    } else if (state.underwaterAreaInstance) {
        surfaceHeart = enemy;
        underwaterHeart = getFrostHeart(state, state.underwaterAreaInstance);
    }
    // Make sure the heart displays the correct animation.
    if (surfaceHeart) {
        surfaceHeart.animations = frostHeartSurfaceAnimations;
        surfaceHeart.changeToAnimation(surfaceHeart.currentAnimationKey);
    }
    if (underwaterHeart) {
        underwaterHeart.animations = frostHeartWaterAnimations;
        underwaterHeart.changeToAnimation(underwaterHeart.currentAnimationKey);
        underwaterHeart.z = 8;
    }
    // If either form is defeated, both are defeated.
    if (isEnemyDefeated(surfaceHeart) || isEnemyDefeated(underwaterHeart)) {
        enemy.status = 'gone';
        return;
    }
    if (enemy === underwaterHeart && surfaceHeart?.params?.active) {
        enemy.life = surfaceHeart.life;
        surfaceHeart.params.active = false;
        surfaceHeart.params.shieldLevel = maxShieldLevel;
    } else if (enemy === surfaceHeart && underwaterHeart?.params?.active) {
        enemy.life = underwaterHeart.life;
        underwaterHeart.params.active = false;
    }
    // Mark that this was the last active heart.
    enemy.params.active = true;
    // The frost heart does nothing when attacking it from under the water.
    if (enemy.area.underwater) {
        enemy.params.shieldLevel = 0;
        enemy.shielded = false;
        return;
    }
    enemy.shielded = enemy.params.shieldLevel > 0;
    if (enemy.params.enrageTime > 0) {
        enemy.params.enrageTime -= FRAME_LENGTH;
        if (enemy.params.enrageTime < 3000) {
            if (enemy.modeTime % 600 === 0) {
                const hitbox = enemy.getHitbox(state);
                const p = 1 + (3000 - enemy.params.enrageTime) / 600;
                for (let t = 0; t < 12; t++) {
                    const theta = 2 * Math.PI * (t + p / 2) / 12;
                    throwIceGrenadeAtLocation(state, enemy, {
                        tx: hitbox.x + hitbox.w / 2 + 2.5 * 16 * p * Math.cos(theta),
                        ty: hitbox.y + hitbox.h / 2 + 2.5 * 16 * p * Math.sin(theta),
                    }, {damage: 2, source: enemy});
                }
                enemy.params.targetShieldLevel = Math.min(maxShieldLevel, enemy.params.targetShieldLevel + 1);
            }
        } else if (enemy.modeTime % 200 === 0) {
            const theta = 2 * Math.PI * Math.random();
            throwIceGrenadeAtLocation(state, enemy, {
                tx: state.hero.x + state.hero.w / 2 + 16 * Math.cos(theta),
                ty: state.hero.y + state.hero.h / 2 + 16 * Math.sin(theta),
            }, {damage: 2, source: enemy});
            enemy.params.targetShieldLevel = Math.min(maxShieldLevel, enemy.params.targetShieldLevel + 1);
        }
        return;
    }
    if (enemy.life <= enemy.enemyDefinition.life * 0.7 && enemy.params.enrageLevel === 0) {
        enemy.params.enrageLevel = 1;
        enemy.params.enrageTime = 5000;
        enemy.params.targetShieldLevel = Math.min(maxShieldLevel, enemy.params.targetShieldLevel + 1);
        enemy.modeTime = 0;
        // Burn damaged is reduced by 80% when entering rage phase.
        enemy.burnDamage *= 0.2;
    } else if (enemy.life <= enemy.enemyDefinition.life * 0.3 && enemy.params.enrageLevel === 1) {
        enemy.params.enrageLevel = 2;
        enemy.params.enrageTime = 7000;
        enemy.params.targetShieldLevel = Math.min(maxShieldLevel, enemy.params.targetShieldLevel + 1);
        enemy.modeTime = 0;
        // Burn damaged is reduced by 80% when entering rage phase.
        enemy.burnDamage *= 0.2;
    }
    enemy.params.chargeLevel += FRAME_LENGTH;
    if (enemy.params.chargeLevel >= 4000) {
        if (enemy.params.chargeLevel % 500 === 0) {
            const theta = 2 * Math.PI * Math.random();
            throwIceGrenadeAtLocation(state, enemy, {
                tx: state.hero.x + state.hero.w / 2 + 16 * Math.cos(theta),
                ty: state.hero.y + state.hero.h / 2 + 16 * Math.sin(theta),
            }, {damage: 2, source: enemy});
        }
        if (enemy.params.chargeLevel >= 4000 + 500 * enemy.params.enrageLevel) {
            enemy.params.chargeLevel = 0;
        }
    }
}


function renderIceShield(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy<FrostHeartParams>): void {
    if (enemy.area?.underwater) {
        return;
    }
    // Make sure we wait for the final shield animation to finish before we stop rendering the shield.
    if (enemy.params.shieldLevel <= 0) {
        return;
    }
    // By default use the static frame for the current shield level.
    let frame = frostHeartShieldDamagedAnimations[maxShieldLevel - Math.ceil(enemy.params.shieldLevel)].frames[0];
    if (enemy.params.shieldLevel % 1) {
        if (enemy.params.shieldLevel > enemy.params.targetShieldLevel) {
            // Render shield hurt animation.
            // The first frame of this animation is the full frame for the previous shield level.
            const index = maxShieldLevel - Math.ceil(enemy.params.shieldLevel);
            const animation = frostHeartShieldDamagedAnimations[index];
            const frameIndex = Math.floor(animation.frames.length * (1 - (enemy.params.shieldLevel % 1)));
            //console.log('hurt', index, frameIndex);
            frame = animation.frames[frameIndex];
        } else if (enemy.params.shieldLevel < enemy.params.targetShieldLevel) {
            // Render shield growing animation.
            const index = Math.floor(enemy.params.shieldLevel);
            const animation = frostHeartShieldGrowingAnimations[index];
            const frameIndex = Math.floor(animation.frames.length * (enemy.params.shieldLevel % 1));
            //console.log('healed', index, frameIndex);
            frame = animation.frames[frameIndex];
        }
    }
    const hitbox = enemy.getHitbox();
    const scale = enemy.scale;
    // Note enemy hitbox already incorporates the z value into the y value of the hitbox.
    drawFrame(context, frame, {
        x: hitbox.x - (frame.w * scale - hitbox.w) / 2,
        y: hitbox.y + hitbox.h - frame.h * scale + 8 * scale,
        w: frame.w * scale,
        h: frame.h * scale,
    });
}


function updateFrostSerpent(state: GameState, enemy: Enemy): void {
    let surfaceSerpent, underwaterSerpent;
    if (state.surfaceAreaInstance) {
        surfaceSerpent = getFrostSerpent(state, state.surfaceAreaInstance);
        underwaterSerpent = enemy;
    } else if (state.underwaterAreaInstance) {
        surfaceSerpent = enemy;
        underwaterSerpent = getFrostSerpent(state, state.underwaterAreaInstance);
    }
    // If either serpent is defeated, both are defeated.
    if (isEnemyDefeated(surfaceSerpent) || isEnemyDefeated(underwaterSerpent)) {
        enemy.status = 'gone';
        return;
    }
    if (enemy === underwaterSerpent && surfaceSerpent?.params?.active) {
        enemy.life = surfaceSerpent.life;
        surfaceSerpent.params.active = false;
        surfaceSerpent.params.submerged = false;
        enemy.params.submerged = false;
    } else if (enemy === surfaceSerpent && underwaterSerpent?.params?.active) {
        enemy.life = underwaterSerpent.life;
        underwaterSerpent.params.active = false;
        underwaterSerpent.params.submerged = true;
        enemy.params.submerged = true;
    }
    enemy.params.active = true;
    const heart = getFrostHeart(state, enemy.area);
    const isEnraged = isEnemyDefeated(heart);
    // The serpent cannot be defeated as long as the heart is alive.
    enemy.isImmortal = !isEnraged;
    if (!isEnraged) {
        if (enemy.mode === 'regenerate') {
            enemy.enemyInvulnerableFrames = enemy.invulnerableFrames = 20;
            if (enemy.modeTime % 500 === 0) {
                enemy.life += 0.5;
                if (enemy.area.underwater) {
                    enemy.life += 0.5;
                }
            }
            if (enemy.life >= enemy.enemyDefinition.life) {
                enemy.setMode('swimming');
            }
            return;
        }
        if (enemy.life < enemy.enemyDefinition.life * 2 / 3) {
            const hitbox = enemy.getHitbox(state);
            const deathAnimation = new FieldAnimationEffect({
                animation: enemyDeathAnimation,
                x: hitbox.x + hitbox.w / 2 - enemyDeathAnimation.frames[0].w / 2 * enemy.scale,
                // +1 to make sure the explosion appears in front of enemies the frame they die.
                y: hitbox.y + hitbox.h / 2 - enemyDeathAnimation.frames[0].h / 2 * enemy.scale + 1,
                scale: enemy.scale,
            });
            addEffectToArea(state, enemy.area, deathAnimation);
            enemy.setMode('regenerate');
            enemy.params.submerged = true;
            enemy.burnDamage = 0;
            return;
        }
    }
    // The frost heart does nothing when attacking it from under the water.
    if (enemy.area.underwater) {
        if (isEnraged) {
            // Surface when enraged.
            if (enemy.params.submerged) {
                enemy.params.submerged = false;
                return;
            }
            return;
        }
        const target = sample(enemy.area.allyTargets);
        const hitbox = target.getHitbox(state);
        const dx = hitbox.x + hitbox.w / 2 - 256;
        const dy = hitbox.y + hitbox.h / 2 - 256;
        const theta = Math.atan2(dy, dx);
        const enemyHitbox = enemy.getHitbox(state);
        const targetX = 256 + Math.cos(theta) * 64 - enemyHitbox.w / 2;
        const targetY = 256 + Math.sin(theta) * 64 - enemyHitbox.h / 2;
        if (!enemy.params.submerged) {
            enemy.params.submerged = true;
            enemy.x = targetX;
            enemy.y = targetY;
            return;
        }
        // Underwater behavior (not enraged only)
        if (enemy.mode === 'guard') {
            enemy.params.attackTheta = theta;
            moveEnemyToTargetLocation(state, enemy, targetX, targetY);
            enemy.d = getCardinalDirection(Math.cos(theta), Math.sin(theta), enemy.d);
            enemy.changeToAnimation('idle')
            if (enemy.modeTime >= 2000) {
                enemy.setMode('prepare');
            }
        } else if (enemy.mode === 'prepare') {
            if (enemy.modeTime >= 500) {
                enemy.setMode('charge');
            }
        } else if (enemy.mode === 'charge') {
            accelerateInDirection(state, enemy, {
                x: Math.cos(enemy.params.attackTheta),
                y: Math.sin(enemy.params.attackTheta)
            });
            moveEnemy(state, enemy, enemy.vx, enemy.vy, {canSwim: true});
            if (enemy.modeTime >= 1500) {
                enemy.setMode('guard');
            }
        } else {
            enemy.setMode('guard');
        }
        return;
    }
    if (isEnraged) {
        if (enemy.params.submerged) {
            const enemyHitbox = enemy.getHitbox(state);
            enemy.x = 256 - enemyHitbox.w / 2;
            enemy.y = 256 - enemyHitbox.h / 2;
            enemy.params.submerged = false;
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
                source: enemy,
            });
            return;
        }
        if (enemy.mode === 'chooseTarget') {
            if (enemy.modeTime < 1000) {
                return;
            }
            enemy.params.attacksLeft--;
            const breathRange = 128;
            let attackVector = getVectorToNearbyTarget(state, enemy, breathRange, enemy.area.allyTargets);
            if (attackVector) {
                enemy.d = getCardinalDirection(attackVector.x, attackVector.y, enemy.d);
                enemy.changeToAnimation('idle');
                enemy.params.attackTheta = atan3(attackVector.y, attackVector.x);
                enemy.setMode('frostBreathArc');
                return;
            }
            const chargeRange = 512;
            attackVector = getVectorToNearbyTarget(state, enemy, chargeRange, enemy.area.allyTargets);
            if (attackVector) {
                enemy.d = getCardinalDirection(attackVector.x, attackVector.y, enemy.d);
                enemy.changeToAnimation('idle');
                enemy.params.attackTheta = atan3(attackVector.y, attackVector.x);
                enemy.setMode('charge');
                return;
            }
            return;
        } else if (enemy.mode === 'frostBreathArc' || enemy.mode === 'frostBreath') {
            if (enemy.modeTime % 40 === 0) {
                // Track a nearby target when using the frostBreathArc attack, otherwise attack in the same direction.
                const attackVector = getVectorToNearbyTarget(state, enemy, 128, enemy.area.allyTargets);
                if (attackVector) {
                    const targetTheta = atan3(attackVector.y, attackVector.x);
                    const dTheta = targetTheta - enemy.params.attackTheta;
                    if ((dTheta > 0 && dTheta <= Math.PI) || dTheta <= -Math.PI) {
                        enemy.params.attackTheta = (enemy.params.attackTheta + 0.05) % (2 * Math.PI);
                    } else if ((dTheta < 0 && dTheta >= -Math.PI) || dTheta >= Math.PI) {
                        enemy.params.attackTheta = (enemy.params.attackTheta - 0.05 + 2 * Math.PI) % (2 * Math.PI);
                    }
                    enemy.d = getCardinalDirection(Math.cos(enemy.params.attackTheta), Math.sin(enemy.params.attackTheta), enemy.d);
                    enemy.changeToAnimation('idle');
                }
                shootFrostInCone(state, enemy, enemy.params.attackTheta, 1, 5);
            }
            if (enemy.modeTime >= 1500) {
                enemy.setMode('chooseTarget');
            }
            return;
        } else if (enemy.mode === 'charge') {
            accelerateInDirection(state, enemy, {
                x: Math.cos(enemy.params.attackTheta),
                y: Math.sin(enemy.params.attackTheta)
            });
            moveEnemy(state, enemy, enemy.vx, enemy.vy, {canSwim: true});
            if (enemy.modeTime >= 1500) {
                enemy.setMode('chooseTarget');
            }
        }
        return;
    }
    if (enemy.params.submerged) {
        if (enemy.modeTime >= 3000) {
            const target = sample(enemy.area.allyTargets);
            const hitbox = target.getHitbox(state);
            const dx = hitbox.x + hitbox.w / 2 - 256;
            const dy = hitbox.y + hitbox.h / 2 - 256;
            const theta = Math.atan2(dy, dx);
            const enemyHitbox = enemy.getHitbox(state);
            enemy.x = 256 + Math.cos(theta) * 64 - enemyHitbox.w / 2;
            enemy.y = 256 + Math.sin(theta) * 64 - enemyHitbox.h / 2;
            enemy.params.submerged = false;
            enemy.params.attacksLeft = 2;
            if (!heart || heart.params.enrageLevel > 0) enemy.params.attacksLeft++;
            if (!heart || heart.params.enrageLevel > 1) enemy.params.attacksLeft++;
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
                source: enemy,
            });
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
        if (shieldVector && heart.params.shieldLevel <= 0) {
            enemy.d = getCardinalDirection(shieldVector.x, shieldVector.y, enemy.d);
            enemy.changeToAnimation('idle');
            enemy.params.attackTheta = atan3(shieldVector.y, shieldVector.x);
            enemy.setMode('frostBreath');
            return;
        }
        let attackVector = getVectorToNearbyTarget(state, enemy, range, enemy.area.allyTargets);
        if (attackVector) {
            enemy.d = getCardinalDirection(attackVector.x, attackVector.y, enemy.d);
            enemy.changeToAnimation('idle');
            enemy.params.attackTheta = atan3(attackVector.y, attackVector.x);
            enemy.setMode('frostBreathArc');
            return;
        }
        if (shieldVector && heart.params.shieldLevel < maxShieldLevel) {
            enemy.d = getCardinalDirection(shieldVector.x, shieldVector.y, enemy.d);
            enemy.changeToAnimation('idle');
            enemy.params.attackTheta = atan3(shieldVector.y, shieldVector.x);
            enemy.setMode('frostBreath');
            return;
        }
        attackVector = getVectorToNearbyTarget(state, enemy, range, enemy.area.neutralTargets.filter(o => o.definition?.type === 'torch' && o.status === 'active'));
        if (attackVector) {
            enemy.d = getCardinalDirection(attackVector.x, attackVector.y, enemy.d);
            enemy.changeToAnimation('idle');
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
                    enemy.d = getCardinalDirection(Math.cos(enemy.params.attackTheta), Math.sin(enemy.params.attackTheta), enemy.d);
                    enemy.changeToAnimation('idle');
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
function atan3(y: number, x: number) {
    return (Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI);
}

export function shootFrostInCone(state: GameState, enemy: Enemy, theta: number, damage = 2, speed = 4, hitEnemies = true): void {
    const hitbox = enemy.getHitbox();
    const x = hitbox.x + hitbox.w / 2 + Math.cos(theta) * hitbox.w / 2;
    const y = hitbox.y + hitbox.h / 2 + Math.sin(theta) * hitbox.h / 2;
    const attackTheta = theta - Math.PI / 10 + Math.random() * Math.PI / 5;
    const frost = new Frost({
        damage,
        x,
        y,
        vx: speed * Math.cos(attackTheta),
        vy: speed * Math.sin(attackTheta),
        hitEnemies,
        ignoreTargets: new Set([enemy]),
        source: enemy,
    });
    addEffectToArea(state, enemy.area, frost);
}

