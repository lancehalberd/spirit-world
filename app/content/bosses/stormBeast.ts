import {isOrbProtectingHeart} from 'app/content/bosses/stormHeart';
import {addArcOfShockWaves} from 'app/content/effects/shockWave';
import {Spark} from 'app/content/effects/spark';
import {enemyDefinitions } from 'app/content/enemies/enemyHash';
import {chargedLightningBoltAbility, lightningBoltAbility} from 'app/content/enemyAbilities/lightningBolt'
import {omniAnimation} from 'app/content/enemyAnimations';
import {FRAME_LENGTH} from 'app/gameConstants';
import {renderLightningCircle} from 'app/render/renderLightning';
import {createAnimation, getFrame} from 'app/utils/animations';
import {addEffectToArea} from 'app/utils/effects';
import {
    accelerateInDirection,
    hasEnemyLeftSection,
    isEnemyDefeated,
    moveEnemyToTargetLocation,
} from 'app/utils/enemies';
import {hitTargets} from 'app/utils/field';
import {getAreaSize} from 'app/utils/getAreaSize';
import Random from 'app/utils/Random';
import {
    getNearbyTarget,
    getVectorToTarget,
    getVectorToNearbyTarget,
} from 'app/utils/target';

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

function getStormHeart(this: void, state: GameState, area: AreaInstance): Enemy {
    return area.enemies.find(target => target.definition.enemyType === 'stormHeart') as Enemy;
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
            source: enemy,
            //delay: 400,
        });
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
    naturalDifficultyRating: 100,
    animations: stormBeastAnimations, life: 90, scale: 1, flying: true,
    aggroRadius: 2000,
    abilities: [sparkAbility, stormBeastLightningAbility, stormBeastChargedLightningAbility],
    acceleration: 0.3, speed: 4,
    touchHit: { damage: 4, element: 'lightning', source: null},
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
        const animation = stormBeastGlowAnimations[enemy.currentAnimationKey as keyof typeof stormBeastGlowAnimations]?.down;
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


function updateStormBeast(state: GameState, enemy: Enemy): void {
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
            source: enemy,
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
        if (enemy.modeTime >= 1000) {
            if (moveEnemyToTargetLocation(state, enemy, section.x + section.w / 2, section.y + section.h / 2 - 80) < 10) {
                enemy.setMode('attack');
            }
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
    // The storm beast uses random abilities until it reaches a certain life threshold.
    if (enemy.mode === 'attackUntilDamaged') {
        if (!enemy.activeAbility) {
            enemy.changeToAnimation('idle');
            if (enemy.life <= enemy.params.attackLifeThreshold) {
                leaveScreen(enemy);
                return;
            }
        }
        if (enemy.modeTime % 2000 === 600) {
            enemy.useRandomAbility(state);
        }
        return;
    }
    // The storm beast uses random abilities until a certain time limit is reached.
    if (enemy.mode === 'attack') {
        if (!enemy.activeAbility) {
            enemy.changeToAnimation('idle');
            if (enemy.modeTime > 3000) {
                leaveScreen(enemy);
                return;
            }
        }
        if (enemy.modeTime % 1200 === 600) {
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
            enemy.setMode('attackUntilDamaged');
            enemy.params.attackLifeThreshold = enemy.life - 10;
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
                source: enemy,
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

