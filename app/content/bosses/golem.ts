import { FieldAnimationEffect } from 'app/content/effects/animationEffect';
import { addArcOfShockWaves, addRadialShockWaves } from 'app/content/effects/shockWave';
import { LaserBeam } from 'app/content/effects/laserBeam';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { Enemy } from 'app/content/enemy';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import {
    accelerateInDirection,
    moveEnemy,
    moveEnemyToTargetLocation,
} from 'app/utils/enemies';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { addScreenShake, hitTargets, isTargetHit } from 'app/utils/field';
import { pad } from 'app/utils/index';
import { getAreaSize } from 'app/utils/getAreaSize';
import { addObjectToArea } from 'app/utils/objects';
import { getNearbyTarget} from 'app/utils/target';


const LASER_CHARGE_TIME = 2000;
const FAST_LASER_CHARGE_TIME = 1000;
const SLAM_HANDS_DURATION = 4000;
// Period of time the golem pauses after using slam hands.
const SLAM_HANDS_PAUSE_DURATION = 3000;


const golemHeadGeometry: FrameDimensions = { w: 64, h: 64 };
const golemHeadAsleepAnimation: FrameAnimation = createAnimation('gfx/enemies/boss_golem_bodynew.png', golemHeadGeometry);
const golemHeadWarmupAnimation: FrameAnimation = createAnimation('gfx/enemies/boss_golem_bodynew.png', golemHeadGeometry, { y: 0, cols: 5}, {loop: false});
const golemHeadIdleAnimation: FrameAnimation = createAnimation('gfx/enemies/boss_golem_bodynew.png', golemHeadGeometry, { y: 1 });
// Used for warming up+cooling down from eye lasers
const golemHeadChargeEyesAnimation: FrameAnimation = createAnimation('gfx/enemies/boss_golem_bodynew.png', golemHeadGeometry, { y: 1, x: 1, cols: 2});
const golemHeadShootEyesAnimation: FrameAnimation = createAnimation('gfx/enemies/boss_golem_bodynew.png', golemHeadGeometry, { y: 1, x: 3, cols: 2});
const golemHeadChargeMouthAnimation: FrameAnimation = createAnimation('gfx/enemies/boss_golem_bodynew.png', golemHeadGeometry, { y: 2, x: 1, cols: 2});
const golemHeadShootMouthAnimation: FrameAnimation = createAnimation('gfx/enemies/boss_golem_bodynew.png', golemHeadGeometry, { y: 2, x: 3, cols: 2});

const golemHeadAngryIdleAnimation: FrameAnimation = createAnimation('gfx/enemies/boss_golem_bodynew.png', golemHeadGeometry, { y: 3 });
const golemHeadAngryChargeEyesAnimation: FrameAnimation = createAnimation('gfx/enemies/boss_golem_bodynew.png', golemHeadGeometry, { y: 3, x: 1, cols: 2});
const golemHeadAngryShootEyesAnimation: FrameAnimation = createAnimation('gfx/enemies/boss_golem_bodynew.png', golemHeadGeometry, { y: 3, x: 3, cols: 2});
const golemHeadAngryChargeMouthAnimation: FrameAnimation = createAnimation('gfx/enemies/boss_golem_bodynew.png', golemHeadGeometry, { y: 4, x: 1, cols: 2});
const golemHeadAngryShootMouthAnimation: FrameAnimation = createAnimation('gfx/enemies/boss_golem_bodynew.png', golemHeadGeometry, { y: 4, x: 3, cols: 2});

const golemHeadDeathAnimation: FrameAnimation = createAnimation('gfx/enemies/boss_golem_bodynew.png', golemHeadGeometry, { y: 5 });

const golemHeadAnimations: ActorAnimations = {
    asleep: {
        down: golemHeadAsleepAnimation,
    },
    warmup: {
        down: golemHeadWarmupAnimation,
    },
    idle: {
        down: golemHeadIdleAnimation,
    },
    chargeEyes: {
        down: golemHeadChargeEyesAnimation,
    },
    shootEyes: {
        down: golemHeadShootEyesAnimation,
    },
    chargeMouth: {
        down: golemHeadChargeMouthAnimation,
    },
    shootMouth: {
        down: golemHeadShootMouthAnimation,
    },
    angryIdle: {
        down: golemHeadAngryIdleAnimation,
    },
    angryChargeEyes: {
        down: golemHeadAngryChargeEyesAnimation,
    },
    angryShootEyes: {
        down: golemHeadAngryShootEyesAnimation,
    },
    angryChargeMouth: {
        down: golemHeadAngryChargeMouthAnimation,
    },
    angryShootMouth: {
        down: golemHeadAngryShootMouthAnimation,
    },
    death: {
        down:golemHeadDeathAnimation,
    },
};
/*
This is here for now, but I'll update it with any frames we add.
The BASE goes on top of the SLAM.

Slam: 20 FPS

Neutral: Just floats with the first frame
Slam: Frame 2, floats upward slowly, then right before slamming down raises up quickly.
Then slams down with Frame 3 and is -1 Y at first,
then returns to 0 Y so there is a "jolt" when it hits the ground.
When the hand comes back upward it is Frame 4.
Punch: Frame 5 for .2 seconds, then Frame 6.
After the punch happens we can make particles and stuff burst out.
I can make new ones if we don't have appropriate ones already.
After punching the wall, turns into Frame 4 while floating back.

*/
const golemHandGeometry: FrameDimensions = { w: 64, h: 64, content: {x: 16, y: 16, w: 32, h: 32} };

const golemSlamEffectAnimation: FrameAnimation = createAnimation('gfx/enemies/golem_hand_slam.png', golemHandGeometry, {cols: 5, duration: 2}, {loop: false});

const golemHandIdle: FrameAnimation = createAnimation('gfx/enemies/golem_hand_base.png', golemHandGeometry);
const golemHandPreparing: FrameAnimation = createAnimation('gfx/enemies/golem_hand_base.png', golemHandGeometry, {x: 1});
const golemHandSlamming: FrameAnimation = createAnimation('gfx/enemies/golem_hand_base.png', golemHandGeometry, {x: 2});
const golemHandReturning: FrameAnimation = createAnimation('gfx/enemies/golem_hand_base.png', golemHandGeometry, {x: 3});
const golemHandPunch: FrameAnimation = createAnimation('gfx/enemies/golem_hand_base.png', golemHandGeometry, {x: 4, cols: 2}, {loop: false});

export const golemHandAnimations: ActorAnimations = {
    idle: {
        left: golemHandIdle,
        right: golemHandIdle,
    },
    preparing: {
        left: golemHandPreparing,
        right: golemHandPreparing,
    },
    // Vulnerable if on the ground.
    slamming: {
        left: golemHandSlamming,
        right: golemHandSlamming,
    },
    // Vulnerable if on the ground.
    returning: {
        left: golemHandReturning,
        right: golemHandReturning,
    },
    // One side is vulnerable where the jewel sticks out.
    punching: {
        left: golemHandPunch,
        right: golemHandPunch,
    },
};


const golemHandHurtIdle: FrameAnimation = createAnimation('gfx/enemies/golem_hand_crack.png', golemHandGeometry);
const golemHandHurtPreparing: FrameAnimation = createAnimation('gfx/enemies/golem_hand_crack.png', golemHandGeometry, {x: 1});
const golemHandHurtSlamming: FrameAnimation = createAnimation('gfx/enemies/golem_hand_crack.png', golemHandGeometry, {x: 2});
const golemHandHurtReturning: FrameAnimation = createAnimation('gfx/enemies/golem_hand_crack.png', golemHandGeometry, {x: 3});
const golemHandHurtPunch: FrameAnimation = createAnimation('gfx/enemies/golem_hand_crack.png', golemHandGeometry, {x: 4, cols: 2}, {loop: false});

export const golemHandHurtAnimations: ActorAnimations = {
    idle: {
        left: golemHandHurtIdle,
        right: golemHandHurtIdle,
    },
    preparing: {
        left: golemHandHurtPreparing,
        right: golemHandHurtPreparing,
    },
    // Vulnerable if on the ground.
    slamming: {
        left: golemHandHurtSlamming,
        right: golemHandHurtSlamming,
    },
    // Vulnerable if on the ground.
    returning: {
        left: golemHandHurtReturning,
        right: golemHandHurtReturning,
    },
    // One side is vulnerable where the jewel sticks out.
    punching: {
        left: golemHandHurtPunch,
        right: golemHandHurtPunch,
    },
};

enemyDefinitions.golem = {
    animations: golemHeadAnimations, life: 12, touchHit: { damage: 1, canAlwaysKnockback: true },
    acceleration: 0.3, speed: 3,
    hasShadow: false,
    update: updateGolem,
    params: {
        enrageLevel: 0,
    },
    initialAnimation: 'warmup',
    initialMode: 'warmup',
    immunities: ['fire', 'ice'],
    elementalMultipliers: {'lightning': 2},
    taunts: {
        intro: { text: `Intruders will be eliminated.`, priority: 2, limit: 1},
        protect: { text: 'Protect the core', priority: 4, cooldown: 10000},
        punch: { text: `My punch is like a cannon.`, priority: 1, cooldown: 20000},
        flurry: { text: `Fall to my wrath!`, priority: 1, cooldown: 20000},
        doubleLaser: { text: "There's no escape!", priority: 1, cooldown: 20000},
    },
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        if (enemy.mode === 'chargeLaser') {
            context.save();
                const p = enemy.modeTime / LASER_CHARGE_TIME;
                context.globalAlpha *= 0.3 + 0.7 * p;
                const r = 1 + 16 * (1 - p);
                context.fillStyle = 'rgba(207,35,64,1)';
                context.beginPath();
                const [x, y] = getMouthLaserCoords(state, enemy);
                context.arc(x, y, r, 0, 2 * Math.PI);
                context.fill();
            context.restore();
        } else if (enemy.mode === 'chargeStrafeLaser') {
            context.save();
                const p = enemy.modeTime / FAST_LASER_CHARGE_TIME;
                context.globalAlpha *= 0.3 + 0.7 * p;
                const r = 1 + 16 * (1 - p);
                context.fillStyle = 'rgba(207,35,64,1)';
                context.beginPath();
                let [x, y] = getLeftEyeLaserCoords(state, enemy);
                context.arc(x, y, r, 0, 2 * Math.PI);
                [x, y] = getRightEyeLaserCoords(state, enemy);
                context.arc(x, y, r, 0, 2 * Math.PI);
                context.fill();
            context.restore();

        }
    },
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        // Thrown objects can hurt the golem as if it as an ordinary enemy.
        if (hit.isThrownObject) {
            return enemy.defaultOnHit(state, hit);
        }
        // Cannot damage the golem head at all unless it is in a mode where its mouth is open.
        if (!['chargeLaser', 'fireLaser', 'firingLaser', 'cooldown'].includes(enemy.mode)) {
            return enemy.defaultBlockHit(state, hit);
        }
        const hitbox = enemy.getHitbox(state);
        const innerHitbox = {
            x: hitbox.x + hitbox.w / 2 - 10,
            y: hitbox.y + hitbox.h - 20,
            w: 20,
            h: 20,
        };
        // If they miss the vulnerable section, the attack is blocked.
        if (!isTargetHit(innerHitbox, hit)) {
            return enemy.defaultBlockHit(state, hit);
        }
        if (hit.damage) {
            hit = {
                ...hit,
                damage: hit.isArrow ? hit.damage + 3 : hit.damage / 2,
            };
        }
        return enemy.defaultOnHit(state, hit);
    },
};
enemyDefinitions.golemHand = {
    animations: golemHandAnimations, life: 4, scale: 1, update: updateGolemHand,
    floating: true,
    flipRight: true,
    ignorePits: true,
    canBeKnockedBack: false, canBeKnockedDown: false,
    showHealthBar: true,
    acceleration: 0.3, speed: 4,
    immunities: ['fire', 'ice'],
    elementalMultipliers: {'lightning': 2},
    initialAnimation: 'idle',
    initialMode: 'return',
    params: {
        enrageLevel: 0,
        side: 'none',
    },
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        if (enemy.isInvulnerable || enemy.enemyInvulnerableFrames) {
            return {};
        }
        // Thrown objects can hurt the hands as if they were ordinary enemies.
        if (hit.isThrownObject) {
            return enemy.defaultOnHit(state, hit);
        }
        let hitJewel = false, hitHand = false;
        const hitbox = enemy.getHitbox(state);
        if (enemy.currentAnimationKey === 'slamming') {
            // The hand cannot be hit during the slamming animation.
            const jewelX = 11;
            const jewelHitbox = {
                x: hitbox.x + jewelX,
                y: hitbox.y + 11,
                w: 13,
                h: 9,
            };
            if (enemy.d === 'right') {
                jewelHitbox.x = hitbox.x + (32 - jewelX - jewelHitbox.w);
            }
            hitJewel = isTargetHit(pad(jewelHitbox, 2), hit);
        } else if (enemy.currentAnimationKey === 'returning') {
            // The hand cannot be hit during the returning animation.
            const jewelX = 14;
            const jewelHitbox = {
                x: hitbox.x + jewelX,
                y: hitbox.y + 7,
                w: 12,
                h: 11,
            };
            if (enemy.d === 'right') {
                jewelHitbox.x = hitbox.x + (32 - jewelX - jewelHitbox.w);
            }
            hitJewel = isTargetHit(pad(jewelHitbox, 2), hit);
        } else if (enemy.currentAnimationKey === 'punching') {
            const fistX = 1;
            const fistHitbox = {
                x: hitbox.x + fistX,
                y: hitbox.y + 12,
                w: 24,
                h: 34,
            };
            if (enemy.d === 'right') {
                fistHitbox.x = hitbox.x + (32 - fistX - fistHitbox.w);
            }
            hitHand = isTargetHit(fistHitbox, hit);
            const jewelX = 28;
            const jewelHitbox = {
                x: hitbox.x + jewelX,
                y: hitbox.y + 12,
                w: 6,
                h: 13,
            };
            if (enemy.d === 'right') {
                jewelHitbox.x = hitbox.x + (32 - jewelX - jewelHitbox.w);
            }
            hitJewel = isTargetHit(jewelHitbox, hit);
        } else {
            hitHand = true;
        }
        // Hands take reduced damage unless they are stunned.
        if (hitJewel) {
            return enemy.defaultOnHit(state, hit);
        }
        if (hitHand) {
            return enemy.defaultBlockHit(state, hit);
        }
        // This is the case if the hand is too high for the hit to effect in the current frame.
        return {};
    },
    render(this: void, context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        if (enemy.mode === 'appearing') {
            const frame = enemy.getFrame();
            const h = Math.floor(frame.h * enemy.modeTime / 1000);
            if (enemy.d === 'right' && enemy.enemyDefinition.flipRight) {
                // Flip the frame when facing right. We may need an additional flag for this behavior
                // if we don't do it for all enemies on the right frames.
                const w = frame.content?.w ?? frame.w;
                context.save();
                    context.translate((enemy.x | 0) + (w / 2) * enemy.scale, 0);
                    context.scale(-1, 1);
                    drawFrame(context, {...frame, h}, { ...frame,
                        x: - (w / 2 + frame.content?.x || 0) * enemy.scale,
                        y: enemy.y - (frame?.content?.y || 0) * enemy.scale - enemy.z + (frame.h - h) * enemy.scale,
                        w: frame.w * enemy.scale,
                        h: h * enemy.scale,
                    });
                context.restore();
            } else {
                drawFrame(context, {...frame, h}, { ...frame,
                    x: enemy.x - (frame?.content?.x || 0) * enemy.scale,
                    y: enemy.y - (frame?.content?.y || 0) * enemy.scale - enemy.z + (frame.h - h) * enemy.scale,
                    w: frame.w * enemy.scale,
                    h: h * enemy.scale,
                });
            }
        } else {
            enemy.defaultRender(context, state);
        }
    },
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        // When the hand is hurt, we draw the corresponding hurt frame on top of it
        // which will show the gem as cracked to signify the gem is what takes damage.
        if (enemy.enemyInvulnerableFrames) {
            // This only works if golemHandHurtAnimations parallels the `golemHandAnimations`
            // that the base golem hand uses to render.
            const animation = golemHandHurtAnimations[enemy.currentAnimationKey][enemy.d];
            const frame = getFrame(animation, enemy.animationTime);
            enemy.defaultRender(context, state, frame);
        }
    }
};

function getGolem(this: void, state: GameState, area: AreaInstance): Enemy {
    return area.objects.find(target => target instanceof Enemy && target.definition.enemyType === 'golem') as Enemy;
}

function getOtherHands(this: void, state: GameState, enemy: Enemy): Enemy[] {
    return enemy.area.objects.filter(target =>
        target !== enemy && target instanceof Enemy
        && target.definition.enemyType === 'golemHand' && !isEnemyDefeated(target)
    ) as Enemy[];
}


function isEnemyDefeated(enemy: Enemy): boolean {
    return !enemy || (enemy.life <= 0 && !enemy.isImmortal) || enemy.status === 'gone';
}

function getMouthLaserCoords(state: GameState, enemy: Enemy): number[] {
    const hitbox = enemy.getHitbox(state);
    return [hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h - 10];
}
function getLeftEyeLaserCoords(state: GameState, enemy: Enemy): number[] {
    const hitbox = enemy.getHitbox(state);
    return [hitbox.x + hitbox.w / 2 - 14, hitbox.y + 38];
}
function getRightEyeLaserCoords(state: GameState, enemy: Enemy): number[] {
    const hitbox = enemy.getHitbox(state);
    return [hitbox.x + hitbox.w / 2 + 14, hitbox.y + 38];
}

function fireLaser(this: void, state: GameState, enemy: Enemy, duration: number, radius: number, coords: number[]): LaserBeam {
    const [sx, sy] = coords;
    const laser = new LaserBeam({
        sx: sx, sy, tx: sx, ty: sy + 512,
        radius, damage: 2, duration,
    });
    addEffectToArea(state, enemy.area, laser);
    return laser;
}

function updateGolem(this: void, state: GameState, enemy: Enemy): void {
    enemy.d = 'down';
    // This gets all hands since the golem is not a golemHand.
    const hands = getOtherHands(state, enemy);
    // Boss moves slower for each hand remaining.
    enemy.speed = Math.max(1, enemy.enemyDefinition.speed - hands.length);
    const isAngry = enemy.params.enragedAttacks > 0;
    if (isAngry) {
        if (enemy.params.slamHands && hands.length) {
            enemy.speed = 1.5;
        } else {
            enemy.speed = Math.max(2, enemy.speed);
        }
    }
    // The golem cannot move when hands are taking certain actions or while firing a laser.
    // Golem can always move if both hands are defeated.
    const shouldMoveToPlayer =
        (enemy.mode === 'choose' || enemy.mode === 'chargeLaser' ||  enemy.mode === 'slamHands')
        && ((enemy.mode === 'slamHands' && enemy.modeTime < SLAM_HANDS_DURATION) || !hands.some(hand => hand.mode !== 'choose'))
        && !(enemy.mode === 'chargeLaser' && enemy.modeTime > LASER_CHARGE_TIME - 600)
        && (!enemy.params.mouthLaser || enemy.params.mouthLaser.done);

    const hitbox = enemy.getHitbox(state);
    const cx = hitbox.x + hitbox.w / 2;//, cy = hitbox.y + hitbox.h / 2;
    if (shouldMoveToPlayer) {
        const target = getNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
        if (target) {
            const targetHitbox = target.getHitbox(state);
            // Track the player's x position when possible.
            if (targetHitbox.x + targetHitbox.w / 2 < cx - 4) {
                moveEnemy(state, enemy, -enemy.speed, 0, {canFall: true});
            } else if (targetHitbox.x + targetHitbox.w / 2 > cx + 4) {
                moveEnemy(state, enemy, enemy.speed, 0, {canFall: true});
            }
        }
    }
    if (enemy.mode === 'warmup') {
        enemy.changeToAnimation('warmup');
        if (enemy.modeTime <= 1000) {
            enemy.animationTime = 0;
        }
        if (enemy.modeTime >= 2000) {
            enemy.useTaunt(state, 'intro');
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'choose') {
        enemy.changeToAnimation(isAngry ? 'angryIdle' : 'idle');
        if (enemy.params.enragedAttacks > 0) {
            enemy.setMode('prepareStrafe');
            return;
        }
        if (enemy.modeTime >= 1000 + 3000 * hands.length) {
            enemy.setMode('prepareAttack');
        }
    } else if (enemy.mode === 'prepareStrafe') {
        enemy.useTaunt(state, 'doubleLaser');
        const { section }  = getAreaSize(state);
        if (hitbox.x + hitbox.w / 2 <= section.x + section.w / 2) {
            if (moveEnemy(state, enemy, -enemy.speed, 0, {canFall: true})) {
                enemy.modeTime = 0;
            }
            enemy.vx = enemy.speed;
        } else {
            if (moveEnemy(state, enemy, enemy.speed, 0, {canFall: true})) {
                enemy.modeTime = 0;
            }
            enemy.vx = -enemy.speed;
        }
        // Only start strafe 400ms after reaching destination and all hands are ready.
        if (enemy.modeTime >= 400 && hands.every(hand => hand.mode === 'choose')) {
            if (enemy.params.slamHands && hands.length) {
                enemy.setMode('strafeSlamHands');
            } else {
                enemy.setMode('chargeStrafeLaser');
            }
        }
    } else if (enemy.mode === 'chargeStrafeLaser') {
        enemy.changeToAnimation(isAngry ? 'angryChargeEyes' : 'chargeEyes');
        if (enemy.modeTime >= FAST_LASER_CHARGE_TIME) {
            enemy.params.leftEyeLaser = fireLaser(state, enemy, 1500, 6, getLeftEyeLaserCoords(state, enemy));
            enemy.params.rightEyeLaser = fireLaser(state, enemy, 1500, 6, getRightEyeLaserCoords(state, enemy));
            enemy.setMode('fireStrafeLaser');
        }
    } else if (enemy.mode === 'fireStrafeLaser') {
        enemy.changeToAnimation(isAngry ? 'angryShootEyes' : 'shootEyes');
        if (moveEnemy(state, enemy, enemy.vx, 0, {canFall: true})) {
            enemy.modeTime = 0;
        }
        if (enemy.modeTime >= 400) {
            enemy.params.enragedAttacks--;
            removeEffectFromArea(state, enemy.params.leftEyeLaser);
            removeEffectFromArea(state, enemy.params.rightEyeLaser);
            delete enemy.params.leftEyeLaser;
            delete enemy.params.rightEyeLaser;
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'strafeSlamHands') {
        // Don't start strafing until a hand has started slamming.
        if (enemy.params.slamHands) {
            if (hands.some(hand => hand.mode === 'slamHand')) {
                enemy.params.slamHands = false;
            }
        } else {
            if (moveEnemy(state, enemy, enemy.vx, 0, {canFall: true})) {
                enemy.modeTime = 0;
            }
            if (enemy.modeTime >= 400) {
                enemy.params.enragedAttacks--;
                enemy.setMode('choose');
            }
        }
    } else if (enemy.mode === 'prepareAttack') {
        if (hands.every(hand => hand.mode === 'choose')) {
            // Golem has a 30% chance to use an enrage attack at enrage level 2.
            const enrageAttackChance = enemy.params.enrageLevel >= 2 ? 0.3 : 0;
            if (Math.random() <= enrageAttackChance) {
                enemy.params.slamHands = Math.random() < hands.length / 3;
                enemy.params.enragedAttacks = 1;
                enemy.setMode('choose');
            } else if (hands.length >= 2 && enemy.params.enrageLevel && Math.random() <= 0.75) {
                enemy.setMode('slamHands');
                enemy.useTaunt(state, 'flurry');
            } else {
                enemy.setMode('chargeLaser');
                if (hands.length) {
                    enemy.useTaunt(state, 'protect');
                }
            }
        }
    } else if (enemy.mode === 'chargeLaser') {
        enemy.changeToAnimation(isAngry ? 'angryChargeMouth' : 'chargeMouth');
        if (enemy.modeTime >= LASER_CHARGE_TIME) {
            enemy.setMode('fireLaser');
        }
    } else if (enemy.mode === 'fireLaser') {
        enemy.changeToAnimation(isAngry ? 'angryShootMouth' : 'shootMouth');
        enemy.params.mouthLaser = fireLaser(state, enemy, 900, 8, getMouthLaserCoords(state, enemy));
        enemy.setMode('firingLaser')
    } else if (enemy.mode === 'firingLaser') {
        if (enemy.modeTime >= 1000) {
            enemy.setMode('cooldown');
        }
    } else if (enemy.mode === 'cooldown') {
        enemy.changeToAnimation(isAngry ? 'angryChargeMouth' : 'chargeMouth');
        if (enemy.modeTime >= 1000 || enemy.params.enragedAttacks > 0) {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'slamHands') {
        if (enemy.modeTime >= SLAM_HANDS_DURATION + SLAM_HANDS_PAUSE_DURATION) {
            enemy.setMode('choose');
        }
    }
    // Enrage level increase for every 1/3 health missing.
    let targetEnrageLevel = 0;
    const healthIsCritical = enemy.life <= enemy.enemyDefinition.life * 1 / 3;
    if (enemy.life <= enemy.enemyDefinition.life * 2 / 3) {
        targetEnrageLevel++;
    }
    if (healthIsCritical) {
        targetEnrageLevel++;
    }
    if (enemy.params.enrageLevel < targetEnrageLevel) {
        enemy.params.enrageLevel = targetEnrageLevel;
        // Burn damaged is reduced by 80% when entering rage phase.
        enemy.burnDamage *= 0.2;
        enemy.params.enragedAttacks = targetEnrageLevel;
        // Immediately stop laser attack on becoming enraged to prevent further damage.
        if (enemy.mode === 'chargeLaser'
            || enemy.mode === 'fireLaser'
            || enemy.mode === 'firingLaser'
            || enemy.mode === 'cooldown'
        ) {
            if (enemy.params.mouthLaser) {
                removeEffectFromArea(state, enemy.params.mouthLaser);
                delete enemy.params.mouthLaser;
            }
            enemy.setMode('choose');
        }
        // If the hands are alive, add an additional initial enraged attack of slamming hands.
        enemy.params.slamHands = true;
        for (const hand of hands) {
            hand.setMode('choose');
        }
        // Create any missing hands when enraged.
        if (!hands.find(hand => hand.params.side === 'left')) {
            const leftHand = new Enemy(state, {
                type: 'enemy',
                id: '' + Math.random(),
                status: 'normal',
                enemyType: 'golemHand',
                x: hitbox.x - 16,
                y: hitbox.y + hitbox.h - 32,
            });
            leftHand.setMode('appearing');
            leftHand.params.side = 'left';
            addObjectToArea(state, enemy.area, leftHand);
        }
        if (!hands.find(hand => hand.params.side === 'right')) {
            const rightHand = new Enemy(state, {
                type: 'enemy',
                id: '' + Math.random(),
                status: 'normal',
                enemyType: 'golemHand',
                x: hitbox.x + hitbox.w - 16,
                y: hitbox.y + hitbox.h - 32,
            });
            rightHand.setMode('appearing');
            rightHand.params.side = 'right';
            addObjectToArea(state, enemy.area, rightHand);
        }
    }
    if (enemy.params.mouthLaser) {
        const [sx, sy] = getMouthLaserCoords(state, enemy);
        enemy.params.mouthLaser.sx = sx;
        enemy.params.mouthLaser.sy = sy;
        enemy.params.mouthLaser.tx = sx;
        enemy.params.mouthLaser.ty = sy + 512;
    }
    if (enemy.params.leftEyeLaser) {
        const [sx, sy] = getLeftEyeLaserCoords(state, enemy);
        enemy.params.leftEyeLaser.sx = sx;
        enemy.params.leftEyeLaser.sy = sy;
        enemy.params.leftEyeLaser.tx = sx;
        enemy.params.leftEyeLaser.ty = sy + 512;
    }
    if (enemy.params.rightEyeLaser) {
        const [sx, sy] = getRightEyeLaserCoords(state, enemy);
        enemy.params.rightEyeLaser.sx = sx;
        enemy.params.rightEyeLaser.sy = sy;
        enemy.params.rightEyeLaser.tx = sx;
        enemy.params.rightEyeLaser.ty = sy + 512;
    }
}

function moveHandToPosition(this: void, state: GameState, enemy: Enemy, otherHands: Enemy[]): void {
    const hitbox = enemy.getHitbox(state);
    const golem = getGolem(state, enemy.area);
    const golemHitbox = golem.getHitbox(state);
    // This offset is intended to make the hands lead the golems movement when strafing.
    let xOffset = 0;
    if (golem.mode === 'strafeSlamHands') {
        xOffset = golem.vx * 10;
        // Spread the hands out a little when leading the body.
        if (enemy.params.side === 'left') {
            xOffset -= 5;
        } else if (enemy.params.side === 'right') {
            xOffset += 5;
        }
    }
    if (!otherHands.find(hand => hand.mode !== 'hoverOverTarget' && hand.mode !== 'targetedSlam')) {
        // An isolated hand will center itself over the golem's weak spot
        const x = golemHitbox.x + golemHitbox.w / 2;
        const y = golemHitbox.y + golemHitbox.h + hitbox.h / 2;
        moveEnemyToTargetLocation(state, enemy, x + xOffset, y, undefined, {canFall: true});
    } else if (enemy.params.side === 'left') {
        const x = golemHitbox.x + golemHitbox.w / 2 - hitbox.w / 2 + 3;
        const y = golemHitbox.y + golemHitbox.h + hitbox.h / 2;
        moveEnemyToTargetLocation(state, enemy, x + xOffset, y, undefined, {canFall: true});
    } else if (enemy.params.side === 'right') {
        const x = golemHitbox.x + golemHitbox.w / 2 + hitbox.w / 2 - 3;
        const y = golemHitbox.y + golemHitbox.h + hitbox.h / 2;
        moveEnemyToTargetLocation(state, enemy, x + xOffset, y, undefined, {canFall: true});
    }
}

export function addSlamEffect(this: void, state: GameState, enemy: Enemy): void {
    const slamAnimation = new FieldAnimationEffect({
        drawPriority: 'background',
        animation: golemSlamEffectAnimation,
        x: enemy.x, y: enemy.y,
    });
    addEffectToArea(state, enemy.area, slamAnimation);
}

function updateGolemHand(this: void, state: GameState, enemy: Enemy): void {
    // For multiple golems we would need to associate hands with the golem closest to their spawn point.
    const golem = getGolem(state, enemy.area);
    const hitbox = enemy.getHitbox(state);
    const golemHitbox = golem?.getHitbox(state);
    // If the hand doesn't have a side yet, assign one based on its relative position to the golem.
    if (golemHitbox && enemy.params.side === 'none') {
        if (hitbox.x + hitbox.w / 2 <= golemHitbox.x + golemHitbox.w / 2) {
            enemy.params.side = 'left';
        } else {
            enemy.params.side = 'right';
        }
    }
    // The thumb is on the left and should face towards the middle so the hand on
    // the left side of the face (in global coordinates) needs to be reflected, which means
    // we need it to face 'right' because the 'right' frame is reflected by the engine.
    enemy.d = enemy.params.side === 'left' ? 'right' : 'left';
    // Currently hands without golems are not supported.
    // Don't do anything until the golem finishes warming up.
    if (!golem || golem.mode === 'warmup') {
        return;
    }
    // Prevent interacting with the hand when it is too high
    enemy.isInvulnerable = (enemy.z > 20);
    enemy.touchHit = (enemy.z <= 20 && enemy.mode !== 'targetedSlam' && enemy.mode !== 'appearing')
        ? enemy.enemyDefinition.touchHit : null;
    const otherHands = getOtherHands(state, enemy);
    const isSlammingHands = golem.mode === 'slamHands' || golem.mode === 'strafeSlamHands';
    if (enemy.mode === 'appearing') {
        enemy.changeToAnimation('idle');
        if (enemy.z < 10) {
            enemy.z++;
        }
        moveHandToPosition(state, enemy, otherHands);
        if (enemy.modeTime >= 1000) {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'choose') {
        enemy.changeToAnimation('idle');
        if (enemy.z < 10) {
            enemy.z++;
        }
        // Hands should move apart and stay apart just before the laser fires.
        if ((golem.mode === 'chargeLaser' && golem.modeTime > LASER_CHARGE_TIME - 100)
            || golem.mode === 'fireLaser'
            || golem.mode === 'firingLaser'
            || (golem.params.mouthLaser && !golem.params.mouthLaser.done)
        ) {
            if (enemy.params.side === 'left') {
                const x = golemHitbox.x + golemHitbox.w / 2 - hitbox.w;
                const y = golemHitbox.y + golemHitbox.h + hitbox.h / 2;
                moveEnemyToTargetLocation(state, enemy, x, y, undefined, {canFall: true});
            } else if (enemy.params.side === 'right') {
                const x = golemHitbox.x + golemHitbox.w / 2 + hitbox.w;
                const y = golemHitbox.y + golemHitbox.h + hitbox.h / 2;
                moveEnemyToTargetLocation(state, enemy, x, y, undefined, {canFall: true});
            }
            return;
        }
        moveHandToPosition(state, enemy, otherHands);
        // Do not start attacking with hands while charging the laser.
        if (golem.mode === 'prepareAttack'
            || golem.mode === 'chargeLaser'
            || golem.mode === 'fireLaser'
            || golem.mode === 'firingLaser'
            || golem.mode === 'prepareStrafe'
            || golem.mode === 'chargeStrafeLaser'
            || golem.mode === 'fireStrafeLaser'
        ) {
            return;
        }
        if (isSlammingHands) {
            enemy.setMode('raiseHand');
            return;
        }
        if (enemy.modeTime > 1000
            && (!otherHands.length || otherHands.some(hand => hand.mode === 'choose' && hand.modeTime >= 400))
        ) {
            const target = getNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
            if (!target || Math.random() < 0.6) {
                enemy.setMode('raiseHand');
            } else if (Math.random() < 0.5) {
                enemy.setMode('hoverOverTarget');
            } else {
                golem.useTaunt(state, 'punch');
                enemy.setMode('followTarget');
            }
        }
    } else if (enemy.mode === 'followTarget') {
        enemy.changeToAnimation('punching');
        if (enemy.z > 5) {
            enemy.z--;
        }
        const target = getNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
        if (target && enemy.modeTime < 1000) {
            const targetHitbox = target.getHitbox(state);
            const x = targetHitbox.x + targetHitbox.w / 2;
            const y = golemHitbox.y + golemHitbox.h + hitbox.h / 2 + 8;
            moveEnemyToTargetLocation(state, enemy, x, y, undefined, {canFall: true});
        }
        if (enemy.modeTime >= 1300) {
            enemy.setMode('punch');
        }
    } else if (enemy.mode === 'hoverOverTarget') {
        enemy.changeToAnimation('preparing');
        if (enemy.z < 40) {
            enemy.z++;
        }
        const target = getNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
        if (target && enemy.modeTime < 1000) {
            const targetHitbox = target.getHitbox(state);
            const x = targetHitbox.x + targetHitbox.w / 2;
            const y = targetHitbox.y + targetHitbox.h / 2;
            moveEnemyToTargetLocation(state, enemy, x, y, undefined, {canFall: true});
        }
        if (enemy.modeTime >= 1300) {
            enemy.setMode('targetedSlam');
        }
    } else if (enemy.mode === 'return') {
        enemy.changeToAnimation('returning');
        if (enemy.z < 10) {
            enemy.z++;
            moveHandToPosition(state, enemy, otherHands);
        } else {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'raiseHand') {
        enemy.changeToAnimation('preparing');
        moveHandToPosition(state, enemy, otherHands);
        if (enemy.z < 20) {
            enemy.z++;
            if (isSlammingHands && (golem.modeTime >= 1000 || golem.mode === 'strafeSlamHands')) {
                enemy.z++
            }
        } else {
            if (isSlammingHands) {
                // Wait a moment after raising both hands before slamming.
                if ((golem.mode !== 'strafeSlamHands' && golem.modeTime < 1000) || enemy.modeTime < 400) {
                    return;
                }
                // Stagger the hands so they hit in an even pattern
                if (!otherHands.length
                    || otherHands.some(hand =>
                        (hand.mode === 'raiseHand' && hand.modeTime > 200)
                        || (hand.mode === 'stunned' && hand.modeTime > 200)
                        || (hand.mode === 'slammed' && hand.modeTime > 200)
                    )
                ) {
                    enemy.setMode('slamHand');
                }
            } else if (enemy.modeTime > 400) {
                enemy.setMode('slamHand');
            }
        }
    } else if (enemy.mode === 'slamHand') {
        enemy.changeToAnimation('slamming');
        enemy.z -= 2;
        if (enemy.z <= 0) {
            enemy.z = 0;
            enemy.makeSound(state, 'bossDeath');
            addScreenShake(state, 0, 2);
            addSlamEffect(state, enemy);
            addArcOfShockWaves(
                state, enemy.area,
                [hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2],
                // We could increase the spark count for a more difficult version of the boss.
                2, // + (golem?.params.enrageLevel || 0),
                Math.PI / 2, Math.PI / 6, 20, {maxSpeed: 5, delay: 200}
            );
            if (isSlammingHands) {
                // Continue slamming until the last N seconds of the slam attack.
                if (golem.modeTime <= SLAM_HANDS_DURATION || golem.mode === 'strafeSlamHands') {
                    enemy.setMode('raiseHand');
                } else {
                    enemy.params.stunTime = SLAM_HANDS_DURATION + SLAM_HANDS_PAUSE_DURATION - golem.modeTime;
                    enemy.setMode('slammed');
                }
            } else {
                enemy.params.stunTime = 500;
                enemy.setMode('slammed');
            }
        }
    } else if (enemy.mode === 'targetedSlam') {
        enemy.changeToAnimation('slamming');
        enemy.z -= 3;
        if (enemy.z <= 0) {
            enemy.z = 0;
            enemy.makeSound(state, 'bossDeath');
            addScreenShake(state, 0, 3);
            addSlamEffect(state, enemy);
            addRadialShockWaves(
                state, enemy.area,
                [hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2 + 4],
                4, Math.PI / 4, 20, {maxSpeed: 5, delay: 200}
            );
            enemy.params.stunTime = 1500;
            enemy.setMode('stunned');
        }
    } else if (enemy.mode === 'punch') {
        enemy.changeToAnimation('punching');
        accelerateInDirection(state, enemy, {x: 0, y: 1});
        hitTargets(state, enemy.area, {
            hitbox,
            hitAllies: true,
            damage: 1,
            knockAwayFromHit: true,
        });
        if (!moveEnemy(state, enemy, enemy.vx, enemy.vy, {canFall: true})) {
            enemy.makeSound(state, 'bossDeath');
            addScreenShake(state, 0, 3);
            enemy.params.stunTime = 1500;
            enemy.setMode('stunned');
        }
    } else if (enemy.mode === 'stunned') {
        enemy.changeToAnimation('returning');
        if (enemy.modeTime >= enemy.params.stunTime) {
            enemy.setMode('return');
        }
    } else if (enemy.mode === 'slammed') {
        enemy.changeToAnimation('slamming');
        if (enemy.modeTime >= enemy.params.stunTime) {
            enemy.setMode('return');
        }
    }
}

