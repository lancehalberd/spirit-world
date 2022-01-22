import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import {
    moveEnemyFull,
} from 'app/content/enemies';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {
    beetleAnimations,
} from 'app/content/enemyAnimations';
import { lifeLootTable } from 'app/content/lootTables';

import { Enemy, GameState } from 'app/types';

enemyDefinitions.squirrel = {
    animations: beetleAnimations,
    speed: 2,
    life: 2, touchHit: { damage: 1},
    lootTable: lifeLootTable,
    initialMode: 'chooseDirection',
    update(this: void, state: GameState, enemy: Enemy) {
        if (enemy.mode === 'pause') {
            if (enemy.modeTime % 100 === 0) {
                addSparkleAnimation(state, enemy.area, enemy.getHitbox(state), { element: 'lightning' });
            }
            enemy.changeToAnimation('idle');
            if (enemy.modeTime >= 1000) {
                enemy.setMode('chooseDirection');
            }
        } else if (enemy.mode === 'chooseDirection') {
            enemy.changeToAnimation('idle');
            const theta = Math.floor(Math.random() * 4) * Math.PI / 2 + Math.PI / 4;
            enemy.vx = enemy.speed * Math.cos(theta);
            enemy.vy = enemy.speed * Math.sin(theta);
            enemy.setMode('run')
        } else if (enemy.mode === 'run') {
            enemy.changeToAnimation('move');
            // Pause sometime after moving for 4 seconds. Max time is theoretically 12s, but is likely much sooner.
            if (enemy.modeTime % 500 === 0 && Math.random() < (enemy.modeTime - 4000) / 8000) {
                enemy.setMode('pause');
            }
            if (!moveEnemyFull(state, enemy, enemy.vx, 0, {canWiggle: false})) {
                enemy.vx = -enemy.vx;
            }
            if (!moveEnemyFull(state, enemy, 0, enemy.vy, {canWiggle: false})) {
                enemy.vy = -enemy.vy;
            }
        }
    }
};
