import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { shootFrostInCone } from 'app/content/bosses/frostBeast';
import { Flame } from 'app/content/effects/flame';
import { simpleLootTable } from 'app/content/lootTables';
import { snakeAnimations, snakeFlameAnimations, snakeFrostAnimations, snakeStormAnimations } from 'app/content/enemyAnimations';
import { renderLightningCircle, renderLightningRay } from 'app/render/renderLightning'
import { directionMap, directionToRadiansMap } from 'app/utils/direction';
import { addEffectToArea } from 'app/utils/effects';
import { canMoveEnemy, moveEnemy, paceRandomly } from 'app/utils/enemies';
import { hitTargets } from 'app/utils/field';;
import { getLineOfSightTargetAndDirection } from 'app/utils/target';
import Random from 'app/utils/Random';


const fireBallAbility: EnemyAbility<boolean> = {
    getTarget(this: void, state: GameState, enemy: Enemy): boolean {
        if (Math.random() < 0.01) {
            return true;
        }
        return !!getLineOfSightTargetAndDirection(state, enemy, enemy.area.allyTargets, enemy.d, 128,
            // The fireball can pass over water, pits and low walls.
            {canSwim: true, canFall: true, canPassLowWalls: true}
        ).target;
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
        addEffectToArea(state, enemy.area, flame);
        enemy.params.fireball = flame;
    },
    updateAbility(this: void, state: GameState, enemy: Enemy, target: boolean) {
        const fireball = enemy.params.fireball;
        const [dx, dy] = directionMap[enemy.d];
        fireball.animationTime = 0;
        fireball.scale = Math.min(1, fireball.scale + 0.05);
        const hitbox = enemy.getHitbox(state);
        fireball.x = hitbox.x + hitbox.w / 2 + dx * 3 * hitbox.w / 4;
        fireball.y = hitbox.y + hitbox.h / 2 + dy * 3 * hitbox.h / 4;
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
        addEffectToArea(state, enemy.area, flame);
    },
    cooldown: 600,
    charges: 1,
};


type LineOfSightTargetType = ReturnType<typeof getLineOfSightTargetAndDirection>;
const frostConeAbility: EnemyAbility<LineOfSightTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): LineOfSightTargetType {
        const target = getLineOfSightTargetAndDirection(state, enemy, enemy.area.allyTargets, undefined, 128,
            // The frost can pass over water, pits and low walls.
            {canSwim: true, canFall: true, canPassLowWalls: true}
        );
        return target.target ? target : undefined;
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: LineOfSightTargetType) {
        enemy.d = target.d;
        enemy.changeToAnimation('attack');
    },
    updateAbility(this: void, state: GameState, enemy: Enemy, target: LineOfSightTargetType) {
        const frostTime = enemy.activeAbility.time;
        if (frostTime >= 0 && frostTime % 100 === 0) {
            // Start with very slow projectiles to give the player some warning.
            shootFrostInCone(state, enemy, directionToRadiansMap[enemy.d], 2, Math.min(4, frostTime / 300), false);
        }
    },
    cooldown: 2000,
    initialCharges: 1,
    charges: 1,
    // This is actually the duration of the ability.
    prepTime: 1200,
    recoverTime: 400,
};



const baseSnakeDefinition: Partial<EnemyDefinition<any>> = {
    alwaysReset: true,
    flipRight: true,
    life: 3,
    //shadowRadius: 8,
    shadowOffset: {y: 2},
    update(state: GameState, enemy: Enemy): void {
        enemy.useRandomAbility(state);
        if (!enemy.activeAbility) {
            paceRandomly(state, enemy);
        }
    },
};

enemyDefinitions.snake = {
    ...baseSnakeDefinition,
    abilities: [],
    animations: snakeAnimations,
    life: 2,
    touchDamage: 1,
    lootTable: simpleLootTable,
    hybrids: {
        elementalFlame: 'snakeFlame',
        elementalFrost: 'snakeFrost',
        elementalStorm: 'snakeStorm',
    },
};

enemyDefinitions.snakeFlame = {
    ...baseSnakeDefinition,
    abilities: [fireBallAbility, leaveFlameAbility],
    animations: snakeFlameAnimations,
    baseMovementProperties: {canMoveInLava: true},
    touchHit: {damage: 1, element: 'fire'},
    elementalMultipliers: {'ice': 2},
    immunities: ['fire'],
};

enemyDefinitions.snakeFrost = {
    ...baseSnakeDefinition,
    abilities: [frostConeAbility],
    animations: snakeFrostAnimations,
    baseMovementProperties: {canSwim: true},
    elementalMultipliers: {'fire': 2},
    immunities: ['ice'],
    update(state: GameState, enemy: Enemy) {
        hitTargets(state, enemy.area, {
            element: 'ice',
            hitbox: enemy.getHitbox(),
            hitAllies: true,
            hitTiles: true,
            damage: 1,
            knockAwayFromHit: true,
        });
        baseSnakeDefinition.update(state, enemy);
    },
};

const maxImageCount = 13;
enemyDefinitions.snakeStorm = {
    ...baseSnakeDefinition,
    abilities: [],
    animations: snakeStormAnimations, speed: 10,
    // baseMovementProperties: {canSwim: true},
    touchHit: {damage: 1, element: 'lightning'},
    elementalMultipliers: {'fire': 1.5, 'ice': 1.5},
    immunities: ['lightning'],
    update(state: GameState, enemy: Enemy) {
        if (enemy.mode === 'choose' && enemy.modeTime === 400) {
            const choices: Direction[] = ['up', 'down', 'left', 'right'];
            while (choices.length) {
                const d = Random.removeElement(choices);
                if (canMoveEnemy(state, enemy, enemy.speed * directionMap[d][0], enemy.speed * directionMap[d][1])) {
                    enemy.d = d;
                    enemy.changeToAnimation('move');
                    enemy.setMode('walk')
                    break;
                }
            }
        }
        if (enemy.modeTime >= 400) {
            enemy.changeToAnimation('move');
            if (Math.random() < (enemy.modeTime - 600) / 2000 || !moveEnemy(state, enemy, enemy.speed * directionMap[enemy.d][0], enemy.speed * directionMap[enemy.d][1])) {
                enemy.setMode('choose');
            }
        }
        enemy.params.afterFrames = enemy.params.afterFrames ?? [];
        //if (enemy.time % 60 === 0) {
            const afterFrames = enemy.params.afterFrames;
            // Rough code for cloning a class instance found here:
            // https://stackoverflow.com/questions/41474986/how-to-clone-a-javascript-es6-class-instance
            const enemyClone = Object.assign(Object.create(Object.getPrototypeOf(enemy)), enemy);
            afterFrames.unshift(enemyClone);
            if (afterFrames.length > maxImageCount) {
                afterFrames.pop();
            }
        //}
    },
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        const afterFrames = enemy.params.afterFrames ?? [];
        for (let i = afterFrames.length - 1; i >= 0; i -= 2) {
            context.save();
                context.globalAlpha *= 0.6 * (1 - (i + 1) / (maxImageCount + 2));
                afterFrames[i].defaultRender(context, state);
            context.restore();
        }

        const hitbox1 = enemy.getHitbox();
        let renderedRay = false;
        if (afterFrames.length >= 10) {
            const hitbox2 = afterFrames[afterFrames.length - 1].getHitbox();
            const dx = hitbox1.x - hitbox2.x, dy = hitbox1.y - hitbox2.y;
            if (dx*dx + dy * dy > 50) {
                renderLightningRay(context, {
                    x1: hitbox1.x + hitbox1.w / 2, y1: hitbox1.y + hitbox1.h / 2,
                    x2: hitbox2.x + hitbox2.w / 2, y2: hitbox2.y + hitbox2.h / 2,
                    r: 8,
                }, {strength: 2});
                renderedRay = true;
            }
        }
        if (!renderedRay) {
            renderLightningCircle(context, {x: hitbox1.x + hitbox1.w / 2, y: hitbox1.y + hitbox1.h / 2, r: 12}, 2)
        }
    }
};
