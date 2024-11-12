import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { simpleLootTable } from 'app/content/lootTables';
import { Enemy } from 'app/content/enemy';

import { omniAnimation } from 'app/content/enemyAnimations';
import { createAnimation } from 'app/utils/animations';
import { moveEnemyToTargetLocation, paceRandomly } from 'app/utils/enemies';
import { addObjectToArea, removeObjectFromArea } from 'app/utils/objects';
import { getVectorToTarget } from 'app/utils/target';

export const elementalFlameAnimation = createAnimation('gfx/enemies/elementalFlame.png', {w: 20, h: 20, content: {x: 2, y: 4, w: 16, h: 16}}, {cols: 4, duration: 5});
export const elementalFrostAnimation = createAnimation('gfx/enemies/elementalFrost.png', {w: 20, h: 20, content: {x: 2, y: 2, w: 16, h: 16}}, {cols: 10, duration: 10});
export const elementalStormAnimation = createAnimation('gfx/enemies/elementalStorm.png', {w: 20, h: 20, content: {x: 2, y: 2, w: 16, h: 16}}, {cols: 4, duration: 5});

interface ElementalProps {
    possessionTarget?: Enemy
    possessedTarget?: Enemy
    baseTargetType?: BossType|MinionType|EnemyType
}

const baseElementalDefinition: Partial<EnemyDefinition<ElementalProps>> = {
    flying: true,
    lootTable: simpleLootTable,
    speed: 1.5,
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy<ElementalProps>): void {
        if (enemy.params.possessedTarget) {
            // The possessed target becomes faintly visible in the spirit world.
            context.save();
                context.globalAlpha *= (0.25 + 0.05 * Math.sin(enemy.time / 200));
                enemy.params.possessedTarget.defaultRender(context, state);
            context.restore();
            context.save();
                context.globalAlpha *= (0.4 + 0.1 * Math.sin(enemy.time / 100));
                enemy.defaultRender(context, state);
            context.restore();
        } else {
            enemy.defaultRender(context, state);
        }
    },
    alternateRender(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy<ElementalProps>) {
        if (state.hero.savedData.passiveTools.trueSight > 0 && !enemy.params.possessedTarget) {
            context.save();
                context.globalAlpha *= (0.1 + 0.05 * Math.sin(enemy.time / 200));
                enemy.defaultRender(context, state);
            context.restore();
        }
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy<ElementalProps>) {
        if (!enemy.params.possessedTarget) {
            //enemy.defaultRenderShadow(context, state);
        }
    },
    updateFlyingZ(state: GameState, enemy: Enemy) {
        if (enemy.params.possessedTarget) {
            enemy.z = Math.max(1, enemy.params.possessedTarget.z);
        } else {
            enemy.z = 1;
        }
    },
    getHitbox(enemy: Enemy): Rect {
        if (enemy.params.possessedTarget) {
            return enemy.params.possessedTarget.getHitbox();
        } else {
            return enemy.getDefaultHitbox();
        }
    },
    onDeath(state: GameState, enemy: Enemy) {
        if (enemy.params.possessedTarget && enemy.params.baseTargetType) {
            const target = enemy.params.possessedTarget;
            const baseEnemy = new Enemy(state, {
                id: target.definition?.id,
                status: 'normal',
                type: 'enemy',
                enemyType: enemy.params.baseTargetType,
                x: target.x,
                y: target.y,
            });
            baseEnemy.z = target.z;
            removeObjectFromArea(state, target);
            addObjectToArea(state, enemy.area.alternateArea, baseEnemy);
        }
    }
};

enemyDefinitions.elementalFlame = {
    ...baseElementalDefinition,
    animations: {idle: omniAnimation(elementalFlameAnimation)}, life: 1, touchHit: {element: 'fire', damage: 1}, update: paceRandomlyAndPossess,
    immunities: ['fire', null],
};
enemyDefinitions.elementalFrost = {
    ...baseElementalDefinition,
    animations: {idle: omniAnimation(elementalFrostAnimation)}, life: 1, touchHit: {element: 'ice', damage: 1}, update: paceRandomlyAndPossess,
    immunities: ['ice', null],
};
enemyDefinitions.elementalStorm = {
    ...baseElementalDefinition,
    animations: {idle: omniAnimation(elementalStormAnimation)}, life: 1, touchHit: {element: 'lightning', damage: 1}, update: paceRandomlyAndPossess,
    immunities: ['lightning', null],
};

function isTargetAvailable(state: GameState, enemy: Enemy, target: Enemy) {
    return target && target.area === enemy.area.alternateArea && !target.isDefeated && target.status !== 'gone';
}

function paceRandomlyAndPossess(this: void, state: GameState, enemy: Enemy<ElementalProps>) {
    const hitbox = enemy.getHitbox(state);
    if (enemy.touchHit.element && enemy.time % 200 === 0) {
        addSparkleAnimation(state, enemy.area, hitbox, { element: enemy.touchHit.element });
    }
    if (!isTargetAvailable(state, enemy, enemy.params.possessedTarget)) {
        delete enemy.params.possessedTarget;
    }
    if (!isTargetAvailable(state, enemy, enemy.params.possessionTarget)) {
        delete enemy.params.possessionTarget;
    }
    // When a target is possessed, the elemental just matches the targets position
    if (enemy.params.possessedTarget) {
        enemy.flying = enemy.params.possessedTarget.flying;
        const hitbox = enemy.params.possessedTarget.getHitbox();
        enemy.x = hitbox.x + hitbox.w / 2 - 8;
        enemy.y = hitbox.y + hitbox.h / 2 - 8 + enemy.params.possessedTarget.z;
        enemy.z = enemy.params.possessedTarget.z;
        enemy.updateDrawPriority();
        return;
    } else {
        enemy.flying = true;
        enemy.updateDrawPriority();
    }

    // Search for an enemy in the alternate world to possess.
    // In cannon, the elementals only exist in the spirit world and possess enemies in the material world.
    for (const alternateEnemy of enemy.area.alternateArea.enemies) {
        if (!isTargetAvailable(state, enemy, alternateEnemy) || !alternateEnemy.isInCurrentSection(state)) {
            continue;
        }
        const hybridEnemyType = alternateEnemy.enemyDefinition?.hybrids?.[enemy.definition.enemyType as EnemyType];
        if (enemyDefinitions[hybridEnemyType]) {
            const mag = getVectorToTarget(state, enemy, alternateEnemy).mag;
            if (!enemy.params.possessionTarget || mag < getVectorToTarget(state, enemy, enemy.params.possessionTarget).mag) {
                enemy.params.possessionTarget = alternateEnemy;
                // Give the elemental different speeds when targeting enemies to make the results for a
                // particular situation less deterministic.
                enemy.speed = enemy.enemyDefinition.speed * (1 + Math.random() * 0.5);
            }
        }
    }

    // If there is currently a possession target, move towards it.
    const target = enemy.params.possessionTarget;
    if (target) {
        const hitbox = target.getHitbox();
        if (moveEnemyToTargetLocation(state, enemy, hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2) < 8) {
            const hybridEnemyType = target.enemyDefinition?.hybrids?.[enemy.definition.enemyType as EnemyType];
            const hybridEnemy = new Enemy(state, {
                id: target.definition?.id,
                status: 'normal',
                type: 'enemy',
                enemyType: hybridEnemyType,
                x: target.x,
                y: target.y,
            });
            hybridEnemy.z = target.z;
            removeObjectFromArea(state, target);
            addObjectToArea(state, enemy.area.alternateArea, hybridEnemy);

            enemy.params.possessedTarget = hybridEnemy;
            // Store the base type so that it can be recreated if thie elemental is destroyed.
            enemy.params.baseTargetType = enemy.params.possessionTarget.definition.enemyType;
            delete enemy.params.possessionTarget
        }
    } else {
        // Use normal speed when pacing.
        enemy.speed = enemy.enemyDefinition.speed;
        paceRandomly(state, enemy);
    }
}
