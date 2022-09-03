import { addObjectToArea, getAreaSize } from 'app/content/areas';
import {
    accelerateInDirection,
    getVectorToNearbyTarget,
    hasEnemyLeftSection,
    moveEnemyToTargetLocation,
} from 'app/content/enemies';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { beetleWingedAnimations } from 'app/content/enemyAnimations';
import { certainLifeLootTable } from 'app/content/lootTables';


import { Enemy, GameState } from 'app/types';

enemyDefinitions.beetleBoss = {
    // Reset the boss to its starting position if you leave the arena.
    alwaysReset: true,
    animations: beetleWingedAnimations, flying: true, scale: 4,
    acceleration: 0.5, speed: 2,
    initialMode: 'hidden',
    life: 16, touchDamage: 1, update: updateBeetleBoss,
};
enemyDefinitions.beetleBossWingedMinionDefinition = {
    // Despawn these if you leave the boss arena.
    alwaysReset: true,
    animations: beetleWingedAnimations,
    flying: true, acceleration: 0.5, speed: 3,
    life: 1, touchDamage: 1, update: flyBy,
    lootTable: certainLifeLootTable,
};

function updateBeetleBoss(state: GameState, enemy: Enemy): void {
    const hitbox = enemy.getHitbox(state);
    const { section } = getAreaSize(state);
    if (enemy.mode === 'hidden') {
        enemy.healthBarTime = 0;
        enemy.y = -64;
        enemy.setMode('enter');
        enemy.alwaysUpdate = true;
        return;
    }
    if (enemy.mode === 'enter') {
        // Don't show the healthbar immediately.
        if (enemy.modeTime < 2000) {
            enemy.healthBarTime = 0;
        }
        if (enemy.modeTime < 1500) {
            return;
        }
        if (moveEnemyToTargetLocation(state, enemy, enemy.definition.x + hitbox.w / 2, enemy.definition.y + hitbox.h / 2) === 0) {
            enemy.setMode('choose');
        }
        return;
    }
    if (enemy.life <= 8) {
        enemy.speed = enemyDefinitions.beetleBoss.speed + 1;
    }
    if (enemy.mode === 'choose' && enemy.modeTime > 500) {
        enemy.vx = enemy.vy = 0;
        // This boss is meant to not be too challenging for new players,
        // so it summons minions that drop life rewards more frequently as the player loses life.
        const summonChance = 0.2 + Math.max(0, 0.6 * (4 - state.hero.life) / 2);
        if (Math.random() < summonChance && !enemy.params.summonedRecently) {
            enemy.params.summonedRecently = true;
            enemy.setMode('retreat');
            enemy.params.summonTheta = Math.random() * 2 * Math.PI;
        } else if (Math.random() < 0.3) {
            enemy.setMode('circle');
            enemy.params.summonedRecently = false;
        } else {
            const vector = getVectorToNearbyTarget(state, enemy, 32 * 32, enemy.area.allyTargets);
            if (vector) {
                enemy.params.summonedRecently = false;
                enemy.setMode('rush');
                enemy.vx = vector.x;
                enemy.vy = vector.y;
            }
        }
    } else if (enemy.mode === 'circle') {
        // In theory the enemy circles the center of the area moving clockwise.
        accelerateInDirection(state, enemy, {
            x: section.y + section.h / 2 - (hitbox.y + hitbox.h / 2),
            y: (hitbox.x + hitbox.w / 2) - (section.x + section.w / 2),
        });
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        if (enemy.modeTime > 10000 / enemy.speed) {
            enemy.setMode('return');
        }
    } else if (enemy.mode === 'return') {
        if (moveEnemyToTargetLocation(state, enemy, section.x + section.w / 2, section.y + 16 + hitbox.h / 2) === 0) {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'retreat') {
        if (moveEnemyToTargetLocation(state, enemy, section.x + section.w / 2, section.y - 24 + hitbox.h / 2) === 0) {
            enemy.setMode('summon');
        }
    } else if (enemy.mode === 'summon') {
        if (enemy.modeTime === 500 || enemy.modeTime === 1000 || enemy.modeTime === 1500) {
            const theta = enemy.params.summonTheta + 2 * Math.PI * enemy.modeTime / 500 / 3;
            const minion = new Enemy(state, {
                type: 'enemy',
                id: '' + Math.random(),
                status: 'normal',
                enemyType: 'beetleBossWingedMinionDefinition',
                x: section.x + section.w / 2 + (section.w / 2 + 32) * Math.cos(theta),
                y: section.y + section.h / 2 + (section.h / 2 + 32) * Math.sin(theta),
            });
            // Have to set area before calling getVectorToNearbyTarget.
            minion.area = enemy.area;
            const vector = getVectorToNearbyTarget(state, minion, 1000, enemy.area.allyTargets);
            if (vector) {
                minion.vx = minion.speed * vector.x;
                minion.vy = minion.speed * vector.y;
                // Since the minion is spawnd from off screen, we need to set this flag to
                // allow it to update. (monsters spawned offscreen do not update by default)
                minion.alwaysUpdate = true;
                addObjectToArea(state, enemy.area, minion);
            } else {
                console.log('could not find nearby hero to target');
            }
        }
        if (enemy.modeTime > 3000) {
            enemy.setMode('choose');
        }
    } else if (enemy.mode === 'rush') {
        // Just accelerate in the direction the boss chose when it entered this mode.
        accelerateInDirection(state, enemy, {x: enemy.vx, y: enemy.vy});
        if (enemy.modeTime <= 1000) {
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
        }
        if (enemy.modeTime >= 1500) {
            // If the player has less than 2 health always return immediately.
            const returnChance = 0.4 + Math.max(0, 0.6 * (4 - state.hero.life) / 2);
            if (enemy.life > 8 || Math.random() > returnChance) {
                enemy.setMode('return');
            } else {
                const vector = getVectorToNearbyTarget(state, enemy, 32 * 32, enemy.area.allyTargets);
                if (vector) {
                    enemy.setMode('rush');
                    enemy.vx = vector.x;
                    enemy.vy = vector.y;
                } else {
                    enemy.setMode('return');
                }
            }
        }
    }
}

function flyBy(state: GameState, enemy: Enemy): void {
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;
    // Remove the enemy once it has moved off the screen entirely.
    if (hasEnemyLeftSection(state, enemy)) {
        // The main control loop will remove enemies with this status and then
        // check if anything should trigger if all enemies are defeated.
        enemy.status = 'gone';
    }
}

