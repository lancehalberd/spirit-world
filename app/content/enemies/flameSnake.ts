import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { flameAnimation } from 'app/content/effects/flame';
import { Flame } from 'app/content/effects/flame';

import { redSnakeAnimations } from 'app/content/enemyAnimations';
import { drawFrameCenteredAt } from 'app/utils/animations';
import { paceRandomly } from 'app/utils/enemies';
import { getLineOfSightTargetAndDirection } from 'app/utils/target';
import { addEffectToArea } from 'app/utils/effects';
import { directionMap } from 'app/utils/field';


import { Enemy, EnemyAbility, GameState, Rect } from 'app/types';

const fireBallAbility: EnemyAbility<boolean> = {
    getTarget(this: void, state: GameState, enemy: Enemy): boolean {
        if (Math.random() < 0.01) {
            return true;
        }
        return !!getLineOfSightTargetAndDirection(state, enemy, enemy.d).hero;
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: boolean) {
        const hitbox = enemy.getHitbox(state);
        const [dx, dy] = directionMap[enemy.d];
        const flame = new Flame({
            x: hitbox.x + hitbox.w / 2 + dx * hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2 - 1 + dy * hitbox.h / 2,
            isPreparing: true,
            vx: 0,
            vy: 0,
            z: 4,
            az: 0,
            scale: 0.1,
            ttl: 2000,
        });
        flame.x -= flame.w / 2;
        flame.y -= flame.h / 2;
        addEffectToArea(state, enemy.area, flame);
        enemy.params.fireball = flame;
    },
    updateAbility(this: void, state: GameState, enemy: Enemy, target: boolean) {
        const fireball = enemy.params.fireball;
        const [dx, dy] = directionMap[enemy.d];
        fireball.animationTime = 0;
        fireball.scale = Math.min(1, fireball.scale + 0.05);
        const hitbox = enemy.getHitbox(state);
        fireball.x = hitbox.x + hitbox.w / 2 + dx * 3 * hitbox.w / 4 - fireball.w / 2;
        fireball.y = hitbox.y + hitbox.h / 2 + dy * 3 * hitbox.h / 4 - fireball.h / 2;
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: boolean): void {
        const fireball = enemy.params.fireball;
        if (fireball) {
            const [dx, dy] = directionMap[enemy.d];
            fireball.vx = 3 * dx;
            fireball.vy = 3 * dy;
            fireball.isPreparing = false;
            delete enemy.params.fireball;
        }
    },
    cooldown: 2000,
    initialCharges: 2,
    charges: 3,
    prepTime: 800,
    recoverTime: 400,
};


const leaveFlameAbility: EnemyAbility<boolean> = {
    getTarget(this: void, state: GameState, enemy: Enemy): boolean {
        return true;
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: boolean): void {
        const hitbox = enemy.getHitbox(state);
        const flame = new Flame({
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2 - 1,
        });
        flame.x -= flame.w / 2;
        flame.y -= flame.h / 2;
        addEffectToArea(state, enemy.area, flame);
    },
    cooldown: 600,
    charges: 1,
};

enemyDefinitions.flameSnake = {
    abilities: [fireBallAbility, leaveFlameAbility],
    alwaysReset: true,
    animations: redSnakeAnimations, speed: 1.1,
    baseMovementProperties: {canMoveInLava: true},
    life: 3,
    touchHit: {damage: 1, element: 'fire'},
    flipRight: true,
    elementalMultipliers: {'ice': 2},
    immunities: ['fire'],
    update(state: GameState, enemy: Enemy): void {
        enemy.useRandomAbility(state);
        if (!enemy.activeAbility) {
            paceRandomly(state, enemy);
        }
    }, 
    renderPreview(context: CanvasRenderingContext2D, enemy: Enemy, target: Rect): void {
        enemy.defaultRenderPreview(context, target);
        drawFrameCenteredAt(context, flameAnimation.frames[0], target);
    },
};
