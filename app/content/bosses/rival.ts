import { playAreaSound } from 'app/content/areas';
import {
    getVectorToNearbyTarget,
} from 'app/content/enemies';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { vanaraBlackAnimations } from 'app/render/npcAnimations';
import { heroAnimations, staffAnimations } from 'app/render/heroAnimations';
import { drawFrameAt, getFrame } from 'app/utils/animations';
import { hitTargets } from 'app/utils/field';


import { Direction, Enemy, EnemyAbility, GameState, HitProperties, HitResult, Rect } from 'app/types';

const rivalAnimations = {
    ...vanaraBlackAnimations,
    roll: heroAnimations.roll,
    staffJump: heroAnimations.staffJump,
    staffSlam: heroAnimations.staffSlam,
}

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
        enemy.changeToAnimation('roll');
    },
    cooldown: 2000,
    initialCharges: 3,
    charges: 3,
    chargesRecovered: 3,
    prepTime: 0,
    recoverTime: rollSpeed.length * FRAME_LENGTH,
};

function getStaffHitbox(enemy: Enemy, d: Direction): Rect {
    const enemyHitbox = enemy.getHitbox();
    if (d === 'left') {
        return {...enemyHitbox, x: enemyHitbox.x - 64, w: 64};
    }
    if (d === 'right') {
        return {...enemyHitbox, x: enemyHitbox.x + enemyHitbox.w, w: 64};
    }
    if (d === 'up') {
        return {...enemyHitbox, y: enemyHitbox.y - 64, h: 64};
    }
    return {...enemyHitbox, y: enemyHitbox.y + enemyHitbox.h, h: 64};
}

const staffAbility: EnemyAbility<Direction> = {
    getTarget(this: void, state: GameState, enemy: Enemy): Direction|null {
        const enemyHitbox = enemy.getHitbox();
        for (const hero of [state.hero, state.hero.astralProjection, ...state.hero.clones]) {
            if (!hero) {
                continue;
            }
            if (hero.overlaps({...enemyHitbox, x: enemyHitbox.x - 64, w: 64})) {
                return 'left';
            }
            if (hero.overlaps({...enemyHitbox, x: enemyHitbox.x + enemyHitbox.w, w: 64})) {
                return 'right';
            }
            if (hero.overlaps({...enemyHitbox, y: enemyHitbox.y - 64, h: 64})) {
                return 'up';
            }
            if (hero.overlaps({...enemyHitbox, y: enemyHitbox.y + enemyHitbox.h, h: 64})) {
                return 'down';
            }
        }
        return null;
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: Direction): void {
        enemy.d = target;
        enemy.changeToAnimation('staffJump');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: Direction): void {
        enemy.changeToAnimation('staffSlam');
        enemy.z = Math.max(enemy.z + enemy.vz, 0);
        playAreaSound(state, state.areaInstance, 'bossDeath');
        hitTargets(state, state.areaInstance, {
            damage: 1,
            hitbox: getStaffHitbox(enemy, enemy.d),
            hitAllies: true,
            knockAwayFromHit: true,
            isStaff: true,
        });
        state.screenShakes.push({
            dx: 0, dy: 2, startTime: state.fieldTime, endTime: state.fieldTime + 200
        });
    },
    cooldown: 4000,
    prepTime: rivalAnimations.staffJump.down.duration,
    recoverTime: rivalAnimations.staffSlam.down.duration + 1000,
};



enemyDefinitions.rival = {
    // This should match the NPC style of the Rival.
    animations: rivalAnimations,
    abilities: [rollAbility, staffAbility],
    life: 12, touchDamage: 0, update: updateRival,
    onHit(this: void, state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        // Invulnerable while rolling.
        if (enemy.mode === 'roll') {
            return {};
        }
        return enemy.defaultOnHit(state, hit);
    },
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        enemy.defaultRender(context, state);
        if (enemy.activeAbility?.definition === staffAbility) {
            renderStaff(context, state, enemy);
        }
    },
    acceleration: 0.3, speed: 2,
    params: {
    },
};

function renderStaff(this: void, context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
    let animationTime = enemy.animationTime;
    if (enemy.activeAbility.used) {
        animationTime += enemy.activeAbility.definition.prepTime;
    }
    if (animationTime < staffAnimations[enemy.d].duration) {
        const frame = getFrame(staffAnimations[enemy.d], animationTime);
        let x = enemy.x - 61 + 7, y = enemy.y - 32 - 90 + 6;
        if (enemy.animationTime < heroAnimations.staffJump[enemy.d].duration) {
            y -= enemy.z;
        }
        drawFrameAt(context, frame, { x, y });
    }
}

function updateRival(this: void, state: GameState, enemy: Enemy): void {
    if (!enemy.activeAbility) {
        enemy.changeToAnimation('idle');
        if (!enemy.tryUsingAbility(state, staffAbility)) {
            enemy.tryUsingAbility(state, rollAbility);
        }
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
}
