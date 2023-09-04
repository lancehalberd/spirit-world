import { CrystalSpike } from 'app/content/effects/arrow';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { FRAME_LENGTH, isRandomizer } from 'app/gameConstants';
import { rivalAnimations } from 'app/content/enemyAnimations';
import { heroAnimations, staffAnimations } from 'app/render/heroAnimations';
import { appendScript } from 'app/scriptEvents';
import { removeTextCue } from 'app/content/effects/textCue';
import { drawFrameAt, getFrame } from 'app/utils/animations';
import {
    moveEnemy,
    moveEnemyToTargetLocation,
} from 'app/utils/enemies';
import { directionMap, getDirection, hitTargets } from 'app/utils/field';
import { removeObjectFromArea } from 'app/utils/objects';
import { saveGame } from 'app/utils/saveGame';
import {
    getVectorToNearbyTarget,
    isTargetVisible,
} from 'app/utils/target';



// const rivalMergedAnimations = {
//     ...rivalAnimations,
//     staffJump: heroAnimations.staffJump,
//     staffSlam: heroAnimations.staffSlam,
// }

const rollSpeed = [
    5, 5, 5, 5,
    4, 4, 4, 4,
    3, 3, 3, 3,
    2, 2, 2, 2,
];

type RollTargetType = ReturnType<typeof getVectorToNearbyTarget>;

const rollAbility: EnemyAbility<RollTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): RollTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: RollTargetType): void {
        let theta = Math.atan2(target.y, target.x);
        theta += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
        enemy.d = getDirection(Math.cos(theta), Math.sin(theta), true);
        enemy.changeToAnimation('roll');
    },
    cooldown: 4000,
    initialCharges: 2,
    cancelsOtherAbilities: true,
    cannotBeCanceled: true,
    charges: 2,
    chargesRecovered: 2,
    prepTime: 0,
    recoverTime: rollSpeed.length * FRAME_LENGTH,
};

function getStaffHitbox(enemy: Enemy, d: Direction): Rect {
    const enemyHitbox = enemy.getHitbox();
    if (d === 'left') {
        return {...enemyHitbox, x: enemyHitbox.x - 48, w: 48};
    }
    if (d === 'right') {
        return {...enemyHitbox, x: enemyHitbox.x + enemyHitbox.w, w: 48};
    }
    if (d === 'up') {
        return {...enemyHitbox, y: enemyHitbox.y - 48, h: 48};
    }
    return {...enemyHitbox, y: enemyHitbox.y + enemyHitbox.h, h: 48};
}

type ThrowTargetType = ReturnType<typeof getVectorToNearbyTarget>;

const throwAbility: EnemyAbility<ThrowTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): ThrowTargetType|null {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: ThrowTargetType): void {
        enemy.useTaunt(state, 'throw');
        enemy.d = getDirection(target.x, target.y);
        enemy.changeToAnimation('kneel');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: ThrowTargetType): void {
        enemy.changeToAnimation('roll');
        const dx = target.x, dy = target.y;
        CrystalSpike.spawn(state, enemy.area, {
            delay: 100,
            x: enemy.x + enemy.w / 2 + enemy.w / 4 * dx,
            y: enemy.y + enemy.h / 2 + enemy.h / 4 * dy,
            damage: 1,
            vx: 4 * dx,
            vy: 4 * dy,
        });
    },
    cooldown: 1000,
    initialCharges: 3,
    charges: 3,
    chargesRecovered: 3,
    prepTime: 300,
    recoverTime: 300,
};

const staffAbility: EnemyAbility<Direction> = {
    getTarget(this: void, state: GameState, enemy: Enemy): Direction|null {
        for (const hero of [state.hero, state.hero.astralProjection, ...state.hero.clones]) {
            if (!hero) {
                continue;
            }
            for (const d of <const>['left', 'right', 'up', 'down']) {
                if (hero.overlaps(getStaffHitbox(enemy, d))) {
                    return d;
                }
            }
        }
        return null;
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: Direction): void {
        enemy.useTaunt(state, 'staff');
        enemy.d = target;
        enemy.changeToAnimation('staffJump');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: Direction): void {
        enemy.changeToAnimation('staffSlam');
        enemy.z = Math.max(enemy.z + enemy.vz, 0);
        enemy.makeSound(state, 'bossDeath');
        hitTargets(state, enemy.area, {
            damage: 2,
            hitbox: getStaffHitbox(enemy, enemy.d),
            hitAllies: true,
            knockAwayFromHit: true,
            isStaff: true,
        });
        state.screenShakes.push({
            dx: 0, dy: 2, startTime: state.fieldTime, endTime: state.fieldTime + 200
        });
    },
    cancelsOtherAbilities: true,
    cannotBeCanceled: true,
    cooldown: 4000,
    prepTime: rivalAnimations.staffJump.down.duration,
    recoverTime: rivalAnimations.staffSlam.down.duration + 500,
};

// This is hardcoded for the area outside of the tomb.
const midPoint: Coords = [128, 176];
function getTargetLocation(state: GameState, enemy: Enemy): Coords {
    for (const target of enemy.area.allyTargets) {
        if (!isTargetVisible(state, enemy, target)) {
            continue;
        }
        const enemyHitbox = enemy.getHitbox();
        const targetHitbox = target.getHitbox(state);
        const cx = targetHitbox.x + targetHitbox.w / 2;
        const cy = targetHitbox.y + targetHitbox.h / 2;
        // Vector from the target to the mid point.
        const v = [midPoint[0] - cx, midPoint[1] - cy];
        const mag = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
        if (mag <= 36) {
            // Target is close to the center, try to be directly left/right
            // while staying on the same side of the target.
            if (cx > enemyHitbox.x + enemyHitbox.w / 2) {
                return [cx - 48, cy];
            }
            return [cx + 48, cy];
        }
        return [cx + v[0] * 48 / mag, cy + v[1] * 48 / mag];
    }
    return midPoint;
}

enemyDefinitions.rival = {
    // This should match the NPC style of the Rival.
    animations: rivalAnimations,
    abilities: [rollAbility, staffAbility, throwAbility],
    taunts: {
        throw: { text: 'Get out of here!', priority: 1},
        dodge: { text: 'Nice try!', priority: 2},
        smallDamage: { text: 'Ugh!', priority: 3},
        bigDamage: { text: `You'll pay for that`, priority: 3},
        staff: { text: 'Dodge this!', priority: 4},
    },
    isImmortal: true,
    life: 7, touchDamage: 0, update: updateRival,
    onHit(this: void, state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        if (enemy.invulnerableFrames) {
            return {};
        }
        // Invulnerable while rolling.
        if (enemy.activeAbility?.definition === rollAbility) {
            return {};
        }
        if (enemy.tryUsingAbility(state, rollAbility)) {
            enemy.useTaunt(state, 'dodge');
            return {};
        }
        // Gain a use of the roll ability on taking damage in order to avoid followup attacks.
        const abilityWithCharges = enemy.getAbility(rollAbility);
        if (abilityWithCharges.charges < (rollAbility.charges || 1)) {
            abilityWithCharges.charges++;
        }
        const hitResult = enemy.defaultOnHit(state, hit);
        if (hitResult.damageDealt) {
            if (hitResult.damageDealt <= 1) enemy.useTaunt(state, 'smallDamage');
            else enemy.useTaunt(state, 'bigDamage');
        }
        return hitResult;
    },
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        enemy.defaultRender(context, state);
        if (enemy.activeAbility?.definition === staffAbility) {
            renderStaff(context, state, enemy);
        }
    },
    acceleration: 0.3, speed: 1.5,
    params: {
    },
};

function renderStaff(this: void, context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
    let animationTime = enemy.animationTime;
    if (enemy.activeAbility.used) {
        animationTime += enemy.activeAbility.definition.prepTime;
    }
    if (animationTime < staffAnimations[enemy.d].duration + 20) {
        const frame = getFrame(staffAnimations[enemy.d], animationTime);
        let x = enemy.x - 61 + 7, y = enemy.y - 32 - 90 + 6;
        if (enemy.animationTime < heroAnimations.staffJump[enemy.d].duration) {
            y -= enemy.z;
        }
        drawFrameAt(context, frame, { x, y });
    }
}

function updateRival(this: void, state: GameState, enemy: Enemy): void {
    if (enemy.area !== state.hero.area) {
        enemy.healthBarTime = 0;
        enemy.setMode('hidden');
        return;
    }
    if (!enemy.params.introduced) {
        enemy.params.introduced = true;
        appendScript(state, '{@rival.startFirstFight}');
    }
    // Don't run any update logic while cutscenes are playing.
    if (state.scriptEvents.queue.length || state.scriptEvents.activeEvents.length) {
        return;
    }
    if (enemy.life <= 0) {
        if (enemy.mode !== 'escaping') {
            // Remove any attack effects on defeat.
            enemy.area.effects = enemy.area.effects.filter(effect => !effect.isEnemyAttack);
            removeTextCue(state);
            enemy.activeAbility = null;
            enemy.faceTarget(state);
            enemy.changeToAnimation('kneel');
            enemy.z = 0;
            enemy.healthBarTime = -10000;
            enemy.invulnerableFrames = 0;
            state.scriptEvents.queue.push({
                type: 'wait',
                blockPlayerInput: true,
                duration: 1000,
            });
            if (!isRandomizer && !state.savedState.objectFlags.skipRivalTombStory) {
                appendScript(state, '{@rival.lostFirstFight}');
            }
            enemy.setMode('escaping');
            state.savedState.objectFlags[enemy.definition.id] = true;
            saveGame(state);
            return;
        }
    }
    if (enemy.mode === 'escaping') {
        const hitbox = enemy.getHitbox();
        if (enemy.x > 64) {
            const yTarget = Math.max(hitbox.y + hitbox.h / 2, midPoint[1]);
            moveEnemyToTargetLocation(state, enemy, 64, yTarget, 'move');
        } else {
            moveEnemyToTargetLocation(state, enemy, hitbox.x + hitbox.w / 2, 300, 'move');
            if (enemy.y >= 280) {
                removeObjectFromArea(state, enemy);
            }
        }
        return;
    }

    // When the tomb is opened for the first time, the Rival warns he will go to the elder.
    if (!state.savedState.objectFlags.tombEntrance) {
        enemy.params.speakWhenTombOpens = true;
    }
    if (enemy.params.speakWhenTombOpens && state.savedState.objectFlags.tombEntrance) {
        appendScript(state, '{@rival.tombOpened}');
        enemy.params.speakWhenTombOpens = false;
    }

    // Short grace period before the boss takes any actions at all.
    if (enemy.time < 200) {
        return;
    }
    // Use the staff attack whenever possible. This actually makes the
    // fight a bit easier since this is when the rival is most vulnerable.
    enemy.tryUsingAbility(state, staffAbility);
    if (!enemy.activeAbility) {
        enemy.tryUsingAbility(state, throwAbility);
    }
    if (enemy.activeAbility?.definition === rollAbility) {
        const [x, y] = directionMap[enemy.d];
        const frame = enemy.animationTime / FRAME_LENGTH;
        const speed = rollSpeed[frame] || 0;
        moveEnemy(state, enemy, speed * x, speed * y, {});
    }
    if (enemy.activeAbility?.definition === staffAbility) {
        const jumpDuration = enemy.activeAbility.definition.prepTime;
        if (!enemy.activeAbility.used) {
            // Jumping up
           // console.log(hero.animationTime, jumpDuration, slamDuration);
            if (enemy.animationTime < jumpDuration - FRAME_LENGTH) {
                enemy.vz = 1 - 1 * enemy.animationTime / jumpDuration;
                enemy.z += enemy.vz;
            } else if (enemy.animationTime === jumpDuration - FRAME_LENGTH) {
                enemy.vz = -4;
                enemy.z = Math.max(enemy.z + enemy.vz, 0);
            }
        } else {
            // Slamming down.
            enemy.z = Math.max(enemy.z + enemy.vz, 0);
        }
    }
    if (!enemy.activeAbility) {
        const targetLocation = getTargetLocation(state, enemy);
        const distance = enemy.distanceToPoint(targetLocation);
        if ((distance > 1 && enemy.currentAnimationKey === 'move') || distance > 12) {
            moveEnemyToTargetLocation(state, enemy, targetLocation[0], targetLocation[1]);
            enemy.faceTarget(state);
            enemy.changeToAnimation('move');
        } else {
            enemy.changeToAnimation('idle');
        }
    }
}
