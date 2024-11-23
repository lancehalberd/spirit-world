import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { goldenBeetleAnimations } from 'app/content/enemyAnimations';
import { LootDropObject } from 'app/content/objects/lootObject';
import { FRAME_LENGTH } from 'app/gameConstants';
import { getCardinalDirection } from 'app/utils/direction';
import { moveEnemyFull } from 'app/utils/enemies';
import { addObjectToArea } from 'app/utils/objects';
import { saveGame } from 'app/utils/saveGame';
import { getVectorToTarget } from 'app/utils/target';


function spawnMoney(state: GameState, enemy: Enemy, amount: number): void {
    let theta = 2 * Math.PI * Math.random();
    for (const coinAmount of [20, 10, 5, 1]) {
        while (coinAmount <= amount) {
            const vx = Math.cos(theta), vy = Math.sin(theta);
            amount -= coinAmount;
            const speed = Math.random() / 10 + 1 / 10;
            const coin = new LootDropObject(state, {
                id: 'drop',
                type: 'loot',
                lootType: 'money',
                lootAmount: coinAmount,
                x: enemy.x + 2 * vx,
                y: enemy.y + 2 * vy,
                vx: vx * speed,
                vy: vy * speed,
                vz: 5,
                status: 'normal'
            });
            addObjectToArea(state, enemy.area, coin);
            coin.x -= (coin.frame.content?.w || coin.frame.w) / 2;
            coin.y -= (coin.frame.content?.h || coin.frame.h) / 2;
            theta += Math.PI / 3 + Math.random() * Math.PI / 12;
        }
    }
}

interface LuckyBeetleParams {
    hits: number
    duration: number
    switch: boolean
}

enemyDefinitions.luckyBeetle = {
    naturalDifficultyRating: 1,
    animations: goldenBeetleAnimations,
    speed: 1,
    life: 1, touchHit: { damage: 1},
    isImmortal: true,
    params: {hits: 0, duration: 20000, switch: false},
    tileBehaviors: {brightness: 0.6, lightRadius: 32},
    update(this: void, state: GameState, enemy: Enemy<LuckyBeetleParams>) {
        enemy.life = 1;
        if (enemy.params.hits) {
            enemy.params.duration -= FRAME_LENGTH;
        }
        enemy.speed = 1 + enemy.params.hits / 2;
        if (enemy.params.duration < 0) {
            enemy.showDeathAnimation(state);
            return;
        }
        if (enemy.animationTime % 100 === 0) {
            addSparkleAnimation(state, enemy.area, enemy.getHitbox(), {});
        }
        enemy.d = getCardinalDirection(enemy.vx, enemy.vy, 'down');
        enemy.changeToAnimation('move');
        if (!moveEnemyFull(state, enemy, enemy.vx, 0, {canWiggle: false})) {
            enemy.vx = -enemy.vx;
            enemy.params.switch = !enemy.params.switch;
        }
        if (!moveEnemyFull(state, enemy, 0, enemy.vy, {canWiggle: false})) {
            enemy.vy = -enemy.vy;
            enemy.params.switch = !enemy.params.switch;
        }
        enemy.vx *= 0.98;
        enemy.vy *= 0.98;
        // Default behavior is to try circling the nearest ally target
        const {x, y} = getVectorToTarget(state, enemy, state.hero) || {x: 0, y: 0};
        if (enemy.params.switch) {
            enemy.vx -= y;// * enemy.params.hits / 10;
            enemy.vy += x;// * enemy.params.hits / 10;
        } else {
            enemy.vx += y;// * enemy.params.hits / 10;
            enemy.vy -= x;// * enemy.params.hits / 10;
        }
        const mag = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
        if (mag > enemy.speed) {
            enemy.vx /= mag;
            enemy.vy /= mag;
        }
    },
    onDeath(this: void, state: GameState, enemy: Enemy<LuckyBeetleParams>): void {
        spawnMoney(state, enemy, enemy.params.hits * 2);
        state.savedState.luckyBeetles.unshift(enemy.definition.id);
        if (state.savedState.luckyBeetles.length > 3) {
            state.savedState.luckyBeetles.pop();
        }
        saveGame(state);
    },
    onHit(this: void, state: GameState, enemy: Enemy<LuckyBeetleParams>, hit: HitProperties): HitResult {
        const result = enemy.defaultOnHit(state, hit);
        if (hit.source){
            const {x, y, mag} = getVectorToTarget(state, enemy, state.hero);
            if (mag) {
                enemy.vx = -5 * x;
                enemy.vy = -5 * y;
            }
        }
        if (result.hit) {
            enemy.params.hits++;
            // The net result of this is that you have anywhere from 10-20s before it disappears,
            // with more time if you hit it less.
            enemy.params.duration -= 1000;
            spawnMoney(state, enemy, enemy.params.hits);
        }
        return result;
    }
};
