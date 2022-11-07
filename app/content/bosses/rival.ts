import {
    getVectorToNearbyTarget,
} from 'app/content/enemies';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { vanaraBlackAnimations } from 'app/render/npcAnimations';
import { heroAnimations } from 'app/render/heroAnimations';


import { Direction, Enemy, EnemyAbility, GameState, HitProperties, HitResult } from 'app/types';

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
    },
    cooldown: 4000,
    prepTime: rivalAnimations.staffJump.down.duration,
    recoverTime: rivalAnimations.staffSlam.down.duration + 2000,
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
    /*render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {

    },*/
    acceleration: 0.3, speed: 2,
    params: {
    },
};


function updateRival(this: void, state: GameState, enemy: Enemy): void {
    if (!enemy.activeAbility) {
        if (!enemy.useAbility(state, staffAbility)) {
            enemy.useAbility(state, rollAbility);
        }
    }
}
