import {enemyDefinitions} from 'app/content/enemies/enemyHash';
import {Enemy} from 'app/content/enemy';
import {FRAME_LENGTH} from 'app/gameConstants';
//import {bossLaserBeamAbility} from 'app/content/enemyAbilities/laserBeam';
import {useFastVolcanoAbility, useVolcanoAbility} from 'app/content/enemyAbilities/volcano';
import {addLavaBubbleEffectToBackground} from 'app/scenes/field/addAmbientEffects';
import {createAnimation, reverseAnimation} from 'app/utils/animations';
import {directionMap} from 'app/utils/direction';
import {isEnemyDefeated} from 'app/utils/enemies';
import {hitTargets} from 'app/utils/field';
import {addObjectToArea} from 'app/utils/objects';
import {
    getCardinalDirectionToTarget,
    getNearbyTarget,
    getTargetingAnchor,
    getVectorToTarget,
    getVectorToNearbyTarget,
    isTargetVisible,
} from 'app/utils/target';
import Random from 'app/utils/Random';

/*const flameBeastVerticalGeometry: FrameDimensions = {
    w: 156, h: 121,
    content: {x: 55, y: 26, w: 46, h: 62},
    anchor: {x: 77, y: 43},
};
const flameBeastHorizontalGeometry: FrameDimensions = {
    w: 156, h: 121,
    content: {x: 10, y: 69, w: 78, h: 28},
    anchor: {x: 42, y: 75},
};
// Frame at index 5 uses the full frame width which causes artifacts on nearby frames if they render the full width when rotated
// Instead of adding padding to all frames, we just use this smaller geometry for animations that use frame index 4 and 6.
const flameBeastWalkDownAnimation = createAnimation('gfx/bosses/flameBeast.png',
    flameBeastVerticalGeometry, {y: 1, cols: 6, duration: 6});
const flameBeastWalkRightAnimation = createAnimation('gfx/bosses/flameBeast.png',
    flameBeastHorizontalGeometry, {y: 2, cols: 8, duration: 6});*/


const flameBeastEmergingUpGeometry: FrameDimensions = {
    w: 156, h: 121,
    content: {x: 57, y: 50, w: 42, h: 24},
    anchor: {x: 78, y: 63},
};
const flameBeastEmergingDownGeometry: FrameDimensions = {
    w: 156, h: 121,
    content: {x: 57, y: 30, w: 42, h: 30},
    anchor: {x: 77, y: 43},
};
const flameBeastEmergingRightDownGeometry: FrameDimensions = {
    w: 156, h: 121,
    content: {x: 30, y: 57, w: 26, h: 26},
    anchor: {x: 40, y: 80},
};
const flameBeastEmergeUp = createAnimation('gfx/bosses/flameBeastNew.png',
    flameBeastEmergingUpGeometry, {y: 3, cols: 4, duration: 4}, {loop: false});
const flameBeastEmergeDown = createAnimation('gfx/bosses/flameBeastNew.png',
    flameBeastEmergingDownGeometry, {y: 11, cols: 4, duration: 4}, {loop: false});
const flameBeastEmergeRight = createAnimation('gfx/bosses/flameBeastNew.png',
    flameBeastEmergingRightDownGeometry, {y: 14, cols: 4, duration: 4}, {loop: false});

const flameBeastDeathUp = createAnimation('gfx/bosses/flameBeastNew.png',
    flameBeastEmergingUpGeometry, {y: 4, cols: 3, duration: 4}, {loop: false});
const flameBeastDeathDown = createAnimation('gfx/bosses/flameBeastNew.png',
    flameBeastEmergingDownGeometry, {y: 10, cols: 3, duration: 4}, {loop: false});
const flameBeastDeathRight = createAnimation('gfx/bosses/flameBeastNew.png',
    flameBeastEmergingRightDownGeometry, {y: 15, cols: 3, duration: 4}, {loop: false});


const flameBeastSubmergedUpGeometry: FrameDimensions = {
    w: 156, h: 121,
    content: {x: 57, y: 34, w: 42, h: 42},
    anchor: {x: 78, y: 63},
};
const flameBeastSubmergedDownGeometry: FrameDimensions = {
    w: 156, h: 121,
    content: {x: 57, y: 36, w: 42, h: 42},
    anchor: {x: 77, y: 43},
};
const flameBeastSubmergedRightDownGeometry: FrameDimensions = {
    w: 156, h: 121,
    content: {x: 30, y: 57, w: 58, h: 26},
    anchor: {x: 40, y: 80},
};
const flameBeastSubmergedIdleUp = createAnimation('gfx/bosses/flameBeastNew.png',
    flameBeastSubmergedUpGeometry, {y: 1, cols: 1, duration: 4}, {loop: false});
const flameBeastSubmergedIdleDown = createAnimation('gfx/bosses/flameBeastNew.png',
    flameBeastSubmergedDownGeometry, {y: 7, cols: 1, duration: 4}, {loop: false});
const flameBeastSubmergedIdleRight = createAnimation('gfx/bosses/flameBeastNew.png',
    flameBeastSubmergedRightDownGeometry, {y: 17, cols: 1, duration: 4}, {loop: false});
const flameBeastSubmergedAttackUp = createAnimation('gfx/bosses/flameBeastNew.png',
    flameBeastSubmergedUpGeometry, {y: 1, cols: 5, duration: 4}, {loop: false});
const flameBeastSubmergedAttackDown = createAnimation('gfx/bosses/flameBeastNew.png',
    flameBeastSubmergedDownGeometry, {y: 7, cols: 5, duration: 4}, {loop: false});
const flameBeastSubmergedAttackRight = createAnimation('gfx/bosses/flameBeastNew.png',
    flameBeastSubmergedRightDownGeometry, {y: 17, cols: 5, duration: 4}, {loop: false});
const flameBeastAttackActivationTime = flameBeastSubmergedAttackUp.frameDuration * 3 * FRAME_LENGTH;
const flameBeastAttackRecoverTime = flameBeastSubmergedAttackUp.duration - flameBeastAttackActivationTime;

const flameBeastAnimations = {
    idle: {
        up: flameBeastSubmergedIdleUp,
        down: flameBeastSubmergedIdleDown,
        left: flameBeastSubmergedIdleRight,
        right: flameBeastSubmergedIdleRight,
    },
    emerge: {
        up: flameBeastEmergeUp,
        down: flameBeastEmergeDown,
        left: flameBeastEmergeRight,
        right: flameBeastEmergeRight,
    },
    submerge: {
        up: reverseAnimation(flameBeastEmergeUp),
        down: reverseAnimation(flameBeastEmergeDown),
        left: reverseAnimation(flameBeastEmergeRight),
        right: reverseAnimation(flameBeastEmergeRight),
    },
    submergedAttack: {
        up: flameBeastSubmergedAttackUp,
        down: flameBeastSubmergedAttackDown,
        left: flameBeastSubmergedAttackRight,
        right: flameBeastSubmergedAttackRight,
    },
    death: {
        up: flameBeastDeathUp,
        down: flameBeastDeathDown,
        left: flameBeastDeathRight,
        right: flameBeastDeathRight,
    },
};

// TODO: Make lava vortex chase the player if the beast is enraged
const flameBeastLavaVortexAbility: EnemyAbility<Target> = {
    getTarget(state: GameState, enemy: Enemy): Target {
        return getVectorToNearbyTarget(state, enemy, 80, enemy.area.allyTargets)?.target;
    },
    prepareAbility(state: GameState, enemy: Enemy, target: Target) {
        enemy.changeToAnimation('submergedAttack');
    },
    useAbility(state: GameState, enemy: Enemy, target: Target): void {
        const [dx, dy] = directionMap[enemy.d];
        const anchor = getTargetingAnchor(enemy);
        const x = anchor.x + 64 * dx;
        const y = anchor.y + 64 * dy;
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
    },
    // There is no limit to how often the flame beast can use this ability.
    cooldown: 20,
    initialCooldown: 20,
    charges: 1,
    prepTime: flameBeastAttackActivationTime,
    recoverTime: flameBeastAttackRecoverTime,
};

// Override the volcano ability to use the correct frames for the Flame Beast.
const flameBeastVolcanoAbility: EnemyAbility<Target> = {
    getTarget(state: GameState, enemy: Enemy): Target {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets)?.target;
    },
    prepareAbility(state: GameState, enemy: Enemy, target: Target) {
        enemy.changeToAnimation('submerge');
    },
    updateAbility(state: GameState, enemy: Enemy, target: Target) {
        // Freeze at frame 3, which will have the flame beast sticking its head out.
        if (enemy.activeAbility.time < 400) {
            enemy.animationTime = Math.min(enemy.animationTime, 2 * flameBeastEmergeUp.frameDuration * FRAME_LENGTH);
        } else if (enemy.activeAbility.time === 400) {
            // Adjust the point the flames come out when facing left/right to match where the mouth is.
            const anchorDelta = {x: 20 * directionMap[enemy.d][0], y: 0};
            if (getFlameBeastEnrageLevel(state, enemy) > 0) {
                useFastVolcanoAbility(state, enemy, target, anchorDelta);
            } else {
                useVolcanoAbility(state, enemy, target, anchorDelta);
            }
            // On using the ability, switch back to the emerge animation at the same frame.
            enemy.changeToAnimation('emerge');
            enemy.animationTime = flameBeastEmergeUp.frameDuration * FRAME_LENGTH
        } else {
            enemy.animationTime = Math.min(enemy.animationTime, flameBeastEmergeUp.frameDuration * FRAME_LENGTH);
        }
    },
    prepTime: 800,
    cooldown: 1000,
    recoverTime: 800,
};

// TODO: fully emerge from lava and charge the player if the beast has line of sight for a charge attack.

enemyDefinitions.flameBeast = {
    naturalDifficultyRating: 100,
    aggroRadius: 128,
    abilities: [flameBeastLavaVortexAbility, flameBeastVolcanoAbility],
    shadowOffset: {x: 0, y: 6},
    animations: flameBeastAnimations, life: 80, update: updateFlameBeast,
    flipLeft: true,
    initialMode: 'hidden',
    acceleration: 0.3, speed: 2,
    immunities: ['fire'],
    elementalMultipliers: {'ice': 1.5, 'lightning': 1.2},
    params: {
        enrageLevel: 0,
    },
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        if (!isFlameBeastHittable(enemy)) {
            return {};
        }
        return enemy.defaultOnHit(state, hit);
    },
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        if (isFlameBeastHidden(enemy)) {
            return;
        }
        enemy.defaultRender(context, state);
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        if (isFlameBeastHidden(enemy)) {
            return;
        }
        if (enemy.mode === 'emerge' || enemy.mode === 'submerge' || enemy.mode === 'submergedAttack') {
            const anchor = getTargetingAnchor(enemy);
            context.save();
                context.fillStyle = '#E77136';
                context.translate(anchor.x, anchor.y);
                context.scale(1, 0.5);
                context.beginPath();
                context.arc(0, 0, 24, 0, 2 * Math.PI);
                context.fill();
            context.restore();
            return;
        }
        enemy.defaultRenderShadow(context, state);
    }
};

function isFlameBeastHidden(enemy: Enemy) {
    // When the boss is hidden at the start of the fight the health bar is not rendered.
    // We continue to render the healthbar when the boss is submerged during the fight.
    return enemy.mode === 'hidden' || enemy.mode === 'emergeWarning' || enemy.mode === 'submerged' || enemy.mode === 'regenerate';
}
function isFlameBeastHittable(enemy: Enemy) {
    if (isFlameBeastHidden(enemy)) {
        return false;
    }
    return true;
    // This was for when the hitboxes were bad for these animations.
    //return enemy.currentAnimationKey !== 'submerge' && enemy.currentAnimationKey !== 'emerge';
}

function getFlameHeart(state: GameState, area: AreaInstance): Enemy {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'flameHeart') as Enemy;
}

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

function getLavaMarkers(state: GameState, enemy: Enemy): ObjectInstance[] {
    const lavaMarkers: ObjectInstance[] = [];
    for (const object of enemy.area.objects) {
        if (object.definition?.type !== 'marker' || object.definition.id !== 'craterBossPoint') {
            continue;
        }
        lavaMarkers.push(object);
    }
    return lavaMarkers;
}

function getClosestLavaPoint(state: GameState, enemy: Enemy): Point {
    let bestDistance = 10000, bestPoint: Point = undefined;
    const visibleTargets = enemy.area.allyTargets.filter(target => isTargetVisible(state, enemy, target));
    const lavaMarkers = getLavaMarkers(state, enemy);
    for (const lavaMarker of lavaMarkers) {
        for (const target of visibleTargets) {
            const distance = getVectorToTarget(state, lavaMarker, target).mag;
            if (distance < bestDistance) {
                bestDistance = distance;
                bestPoint = getTargetingAnchor(lavaMarker);
            }
        }
    }
    if (!bestPoint) {
        return getTargetingAnchor(Random.element(lavaMarkers));
    }
    return bestPoint;
}

function updateFlameBeast(this: void, state: GameState, enemy: Enemy): void {
    const flameHeart = getFlameHeart(state, enemy.area);
    if (enemy.mode === 'hidden') {
        enemy.healthBarTime = 0;
        // The Flame Beast is not functional without lava markers to indicate where it
        // can emerge from/submerge into lava.
        if (getLavaMarkers(state, enemy).length <= 0) {
            return;
        }
        // If a flameheart is present, stay hidden until it is damaged.
        if (flameHeart && flameHeart.life >= flameHeart.enemyDefinition.life) {
            return;
        }
        enemy.status = 'normal';
        enemy.setMode('submerged');
        // Skip the normal delay to attack sooner at the start of the fight.
        enemy.modeTime = 3000;

        return;
    }
    if (!isFlameBeastHittable(enemy)) {
        delete enemy.behaviors;
    } else {
        enemy.behaviors = {touchHit: { damage: 4, element: 'fire', source: enemy}};
    }

    // Assuming there is a Flame Heart present, if the beast drops below 2/3 health it
    // will become invulnerable until it submerges again, at which point it will regenerate
    // until it reaches full life or the heart is defeated.
    if (enemy.life < enemy.enemyDefinition.life * 2 / 3) {
        if (!isEnemyDefeated(flameHeart)) {
            enemy.enemyInvulnerableFrames = enemy.invulnerableFrames = 20;
            if (enemy.mode === 'submerged') {
                enemy.setMode('regenerate');
            }
        }
    }
    if (enemy.mode === 'regenerate') {
        if (isEnemyDefeated(flameHeart)) {
            enemy.setMode('submerged');
            return;
        }
        if (enemy.modeTime % 1000 === 0) {
            enemy.life += 1;
        }
        if (enemy.life >= enemy.enemyDefinition.life) {
            enemy.life = enemy.enemyDefinition.life;
            enemy.setMode('submerged');
        }
        return;
    }

    const enrageLevel = getFlameBeastEnrageLevel(state, enemy);
    const submergeTime = 3000 - 500 * enrageLevel;
    if (enemy.mode === 'submerged') {
        if (enemy.modeTime >= submergeTime || enemy.modeTime >= 1000) {
            const {x, y} = getClosestLavaPoint(state, enemy);
            enemy.x = x;
            enemy.y = y;
            // Face a nearby target when choosing a pool to emerge from.
            const target = getNearbyTarget(state, enemy, 80, enemy.area.allyTargets);
            if (target) {
                enemy.d = getCardinalDirectionToTarget(enemy, target, enemy.d);
                enemy.setMode('emergeWarning');
            }
        }
        return;
    }
    if (enemy.mode === 'emergeWarning') {
        hitTargets(state, enemy.area, {
            hitTiles: true,
            element: 'fire',
            hitCircle: {
                x: enemy.x,
                y: enemy.y,
                r: 20,
            },
            source: enemy,
        });
        const x = enemy.x - 16 + 32 * Math.random();
        const y = enemy.y - 12 + 24 * Math.random();
        addLavaBubbleEffectToBackground(state, enemy.area, {x, y});
        // If there is no nearby target early in the attack, cancel it and search for a new target.
        if (enemy.modeTime < 700) {
            const target = getNearbyTarget(state, enemy, 96, enemy.area.allyTargets);
            if (!target) {
                enemy.setMode('submerged');
                // The submerge time is reduced to 1s when changing targets like this.
                enemy.modeTime = submergeTime - 1000;
                return;
            }
        }
        if (enemy.modeTime > 800) {
            enemy.setMode('emerge');
            // Update target right before actually emerging.
            const target = getNearbyTarget(state, enemy, 80, enemy.area.allyTargets);
            if (target) {
                enemy.d = getCardinalDirectionToTarget(enemy, target, enemy.d);
            }
        }
    }

    if (enemy.mode === 'emerge') {
        enemy.changeToAnimation('emerge');
        if (enemy.animationTime >= enemy.currentAnimation.duration) {
            enemy.setMode('submergedAttack');
        }
    }
    if (enemy.mode === 'submergedAttack') {
        if (!enemy.activeAbility) {
            if (enemy.modeTime < 100) {
                enemy.useRandomAbility(state);
            } else {
                enemy.setMode('submerge');
            }
        }
    }
    if (enemy.mode === 'submerge') {
        enemy.changeToAnimation('submerge')
        if (enemy.animationTime >= enemy.currentAnimation.duration) {
            enemy.setMode('submerged');
        }
    }
}
