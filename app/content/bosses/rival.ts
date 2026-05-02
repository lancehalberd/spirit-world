import {Rock} from 'app/content/effects/arrow';
import {enemyDefinitions} from 'app/content/enemies/enemyHash';
import {FRAME_LENGTH} from 'app/gameConstants';
import {rivalAnimations} from 'app/content/enemyAnimations';
import {appendScript} from 'app/scriptEvents';
import {removeTextCue} from 'app/content/effects/textCue';
import {editingState} from 'app/development/editingState';
import {directionMap, getCardinalDirection} from 'app/utils/direction';
import {
    moveEnemy,
    moveEnemyToTargetLocation,
} from 'app/utils/enemies';
import {hitTargets} from 'app/utils/field';
import {fillRect} from 'app/utils/index'
import {removeObjectFromArea} from 'app/utils/objects';
import {saveGame} from 'app/utils/saveGame';
import {
    getVectorToNearbyTarget,
    isTargetVisible,
} from 'app/utils/target';

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
        enemy.d = getCardinalDirection(Math.cos(theta), Math.sin(theta));
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
        return {...enemyHitbox, x: enemyHitbox.x - 20, w: 32};
    }
    if (d === 'right') {
        return {...enemyHitbox, x: enemyHitbox.x + enemyHitbox.w - 12, w: 32};
    }
    if (d === 'up') {
        return {...enemyHitbox, y: enemyHitbox.y - 20, h: 32};
    }
    return {...enemyHitbox, y: enemyHitbox.y + enemyHitbox.h - 12, h: 32};
}

type ThrowTargetType = ReturnType<typeof getVectorToNearbyTarget>;

const throwAbility: EnemyAbility<ThrowTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): ThrowTargetType|null {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: ThrowTargetType): void {
        enemy.useTaunt(state, 'throw');
        enemy.d = getCardinalDirection(target.x, target.y);
        enemy.changeToAnimation('prepareAttack');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: ThrowTargetType): void {
        enemy.changeToAnimation('attack');
        const dx = target.x, dy = target.y;
        Rock.spawn(state, enemy.area, {
            delay: 100,
            x: enemy.x + enemy.w / 2 + enemy.w / 4 * dx,
            y: enemy.y + enemy.h / 2 + enemy.h / 4 * dy + 6,
            z: 6,
            damage: 1,
            vx: 4 * dx,
            vy: 4 * dy,
            source: enemy,
        });
    },
    cooldown: 2000,
    initialCharges: 3,
    charges: 3,
    chargesRecovered: 3,
    prepTime: 300,
    recoverTime: 300,
};

const staffSwingHitBoxes = {
    down: [{x: 17, y: 22, w: 13, h: 32}, {x: 30, y: 41, w: 20, h: 22}, {x: 23, y: 50, w: 10, h: 10}],
    right: [{x: 46, y: 21, w: 21, h: 20}, {x: 31, y: 41, w: 28, h: 9}],
    up: [{x: 23, y: 1, w: 24, h: 24}, {x: 45, y: 9, w: 10, h: 30}],
    left: [{x: 3, y: 33, w: 24, h: 16}, {x: 13, y: 22, w: 30, h: 11}, {x: 7, y: 27, w: 6, h: 6}],
};
function getStaffSwingHitbox(enemy: Enemy, hitbox: Rect): Rect {
    return {
        ...hitbox,
        x: (enemy.x - rivalAnimations.staffSwing.down.frames[0].content.x) + hitbox.x,
        y: (enemy.y - rivalAnimations.staffSwing.down.frames[0].content.y) + hitbox.y,
    };
}
const staffSwingAbility: EnemyAbility<CardinalDirection> = {
    getTarget(this: void, state: GameState, enemy: Enemy): CardinalDirection|null {
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
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: CardinalDirection): void {
        enemy.useTaunt(state, 'staff');
        enemy.d = target;
        enemy.changeToAnimation('prepareStaffSwing');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: CardinalDirection): void {
        enemy.changeToAnimation('staffSwing', 'idle');
        enemy.z = Math.max(enemy.z + enemy.vz, 0);
        // enemy.makeSound(state, 'bossDeath');
        for (const hitbox of staffSwingHitBoxes[enemy.d]) {
            hitTargets(state, enemy.area, {
                damage: 2,
                hitbox: getStaffSwingHitbox(enemy, hitbox),
                hitAllies: true,
                knockAwayFromHit: true,
                isStaff: true,
                source: enemy,
            });
        }
    },
    cancelsOtherAbilities: true,
    cannotBeCanceled: true,
    cooldown: 3000,
    prepTime: rivalAnimations.prepareStaffSwing.down.duration + 400,
    recoverTime: rivalAnimations.staffSwing.down.duration + 500,
};

// This is hardcoded for the area outside of the tomb.
const midPoint: Coords = [128, 176];
function getTargetLocation(state: GameState, enemy: Enemy): Coords {
    const swingAbility = enemy.getAbility(staffSwingAbility);
    // The rival will try to move closer to the hero when his swing ability is available.
    const targetDistance = swingAbility.charges ? 16 : 48;
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
                return [cx - targetDistance, cy];
            }
            return [cx + targetDistance, cy];
        }
        return [cx + v[0] * targetDistance / mag, cy + v[1] * targetDistance / mag];
    }
    return midPoint;
}

enemyDefinitions.rival = {
    // This should match the NPC style of the Rival.
    animations: rivalAnimations,
    abilities: [rollAbility, staffSwingAbility, throwAbility],
    naturalDifficultyRating: 20,
    taunts: {
        throw: { text: 'Get out of here!', priority: 1},
        dodge: { text: 'Nice try!', priority: 2},
        smallDamage: { text: 'Ugh!', priority: 3},
        bigDamage: { text: `You'll pay for that`, priority: 3},
        staff: { text: 'Back off!', priority: 4},
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
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        if (!editingState.showHitboxes) {
            return;
        }
        if (enemy.currentAnimationKey === 'staffSwing' && enemy.animationTime < 100) {
            for (const hitbox of staffSwingHitBoxes[enemy.d]) {
                fillRect(context, getStaffSwingHitbox(enemy, hitbox), 'rgba(255, 0, 0, 0.2)');
            }
        }
    },
    acceleration: 0.3, speed: 1.5,
    params: {
    },
};


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
            if (!state.randomizerState && !state.savedState.objectFlags.skipRivalTombStory) {
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
        if (!state.randomizerState) {
            appendScript(state, '{@rival.tombOpened}');
        }
        enemy.params.speakWhenTombOpens = false;
    }

    // Short grace period before the boss takes any actions at all.
    if (enemy.time < 200) {
        return;
    }
    // Use the staff attack whenever possible. This actually makes the
    // fight a bit easier since this is when the rival is most vulnerable.
    if (!enemy.tryUsingAbility(state, staffSwingAbility)) {
        enemy.tryUsingAbility(state, throwAbility);
    }
    if (enemy.activeAbility?.definition === rollAbility) {
        const [x, y] = directionMap[enemy.d];
        const frame = enemy.animationTime / FRAME_LENGTH;
        const speed = rollSpeed[frame] || 0;
        moveEnemy(state, enemy, speed * x, speed * y);
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
