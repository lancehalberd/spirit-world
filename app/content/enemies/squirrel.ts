import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import {
    brownSquirrelAnimations,
} from 'app/content/enemyAnimations';
import { lifeLootTable } from 'app/content/lootTables';
import {
    moveEnemyFull,
} from 'app/utils/enemies';
import { getDirection } from 'app/utils/field';

import { Enemy, GameState } from 'app/types';

enemyDefinitions.squirrel = {
    animations: brownSquirrelAnimations,
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
            const theta = Math.floor(Math.random() * 4) * Math.PI / 2 + Math.PI / 4;
            enemy.vx = enemy.speed * Math.cos(theta);
            enemy.vy = enemy.speed * Math.sin(theta);
            enemy.d = getDirection(enemy.vx, enemy.vy);
            enemy.changeToAnimation('idle');
            enemy.setMode('run')
        } else if (enemy.mode === 'run') {
            // Revert theta back to 45 degree angle if it gets messed up from being knocked by a hit.
            const theta = (Math.round(Math.atan2(enemy.vy, enemy.vx) * 4 / 2 / Math.PI - 0.5) + 0.5) * Math.PI / 2;
            enemy.vx = enemy.speed * Math.cos(theta);
            enemy.vy = enemy.speed * Math.sin(theta);
            enemy.d = getDirection(enemy.vx, enemy.vy);
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
            enemy.d = getDirection(enemy.vx, enemy.vy);
            enemy.changeToAnimation('idle');
        }
    }
};
