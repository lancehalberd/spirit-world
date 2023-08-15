import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { Blast } from 'app/content/effects/blast';
import { beetleWingedAnimations } from 'app/content/enemyAnimations';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { simpleLootTable } from 'app/content/lootTables';
import { addEffectToArea } from 'app/utils/effects';
import { scurryAndChase } from 'app/utils/enemies';
import { getVectorToNearbyTarget } from 'app/utils/target';





type NearbyTargetType = ReturnType<typeof getVectorToNearbyTarget>;
const flameBarrierAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType) {
        enemy.changeToAnimation('prepare');
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        enemy.changeToAnimation('attack');
        const hitbox = enemy.getHitbox(state);
        const blast = new Blast({
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2,
            damage: 1,
            element: 'fire',
            tellDuration: 400,
            persistDuration: 2000,
            radius: 32,
            source: enemy,
        });
        addEffectToArea(state, enemy.area, blast);
    },
    cooldown: 1000,
    charges: 1,
    initialCharges: 0,
    prepTime: 200,
    recoverTime: 2000,
};

const lightningShieldAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    prepareAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType) {
        enemy.shielded = true;
        if (enemy.time % 200 === 0) {
            const hitbox = enemy.getHitbox(state);
            for (let i = 0; i < 4; i ++) {
                const theta = Math.PI / 2 + 2 * Math.PI * i / 4;
                addSparkleAnimation(state, enemy.area, {
                    ...hitbox,
                    x: hitbox.x + 4 * Math.cos(theta),
                    y: hitbox.y + 4 * Math.sin(theta),
                    w: hitbox.w / 2,
                    h: hitbox.h / 2,
                }, {element: 'lightning', velocity: {x: enemy.vx, y: enemy.vy}});
            }
        }
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        enemy.shielded = false;
    },
    cooldown: 5000,
    charges: 1,
    initialCharges: 1,
    prepTime: 2000,
};

function renderShield(context: CanvasRenderingContext2D, hitbox: Rect, shielded = true, color = '#888'): void {
    context.strokeStyle = color; //enemy.params.shieldColor ?? '#888';
    if (shielded) {
        context.save();
            context.globalAlpha *= (0.7 + 0.3 * Math.random());
            context.beginPath();
            context.arc(hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, hitbox.w / 2, 0, 2 * Math.PI);
            context.stroke();
        context.restore();
    } else {
        let theta = Math.random() * Math.PI / 8;
        for (let i = 0; i < 4; i++) {
            context.beginPath();
            context.arc(hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, hitbox.w / 2, theta, theta + (1 + Math.random()) * Math.PI / 8);
            theta += 2 * Math.PI / 4 + Math.random() * Math.PI / 8;
            context.stroke();
        }
    }
}

const baseBeetleWingedDefinition: Partial<EnemyDefinition<any>> & { animations: ActorAnimations } = {
    alwaysReset: true,
    animations: beetleWingedAnimations,
    flying: true,
    acceleration: 0.1,
    aggroRadius: 112,
    life: 1,
    lootTable: simpleLootTable,
    update(state: GameState, enemy: Enemy): void {
        if (enemy.params.element && !enemy.activeAbility) {
            enemy.changeToAnimation('idle');
            enemy.useRandomAbility(state);
            if (enemy.time % 300 === 0) {
                const hitbox = enemy.getHitbox(state);
                const theta = Math.PI / 2 + 2 * Math.PI * enemy.time / 900;
                addSparkleAnimation(state, enemy.area, {
                    ...hitbox,
                    x: hitbox.x + 4 * Math.cos(theta),
                    y: hitbox.y + 4 * Math.sin(theta),
                    w: hitbox.w / 2,
                    h: hitbox.h / 2,
                }, { element: enemy.params.element, velocity: {x: enemy.vx, y: enemy.vy}});
            }
        }
        scurryAndChase(state, enemy);
    },
    renderPreview(context: CanvasRenderingContext2D, enemy: Enemy, target: Rect): void {
        enemy.defaultRenderPreview(context, target);
        renderShield(context, target, true, enemy.params.shieldColor);
    },
};



enemyDefinitions.beetleWinged = {
    ...baseBeetleWingedDefinition,
    touchDamage: 1,
    hybrids: {
        'elementalFlame': 'beetleWingedFlame',
        'elementalFrost': 'beetleWingedFrost',
        'elementalStorm': 'beetleWingedStorm',
    }
};

enemyDefinitions.beetleWingedFlame = {
    ...baseBeetleWingedDefinition,
    life: 3,
    abilities: [flameBarrierAbility],
    params: {
        element: 'fire',
        shieldColor: 'red',
    },
    immunities: ['fire'],
    touchHit: {damage: 1, element: 'fire'},
    elementalMultipliers: {'ice': 2},
};

enemyDefinitions.beetleWingedFrost = {
    ...baseBeetleWingedDefinition,
    life: 4,
    abilities: [],
    params: {
        element: 'ice',
        shieldColor: 'blue',
    },
    immunities: ['ice'],
    touchHit: {damage: 1, element: 'ice'},
    elementalMultipliers: {'fire': 2},
    onDeath(state: GameState, enemy: Enemy) {
        const hitbox = enemy.getHitbox(state);
        const blast = new Blast({
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2,
            damage: 1,
            element: 'ice',
            tellDuration: 0,
            persistDuration: 200,
            radius: 40,
        });
        addEffectToArea(state, enemy.area, blast);
    }
};

enemyDefinitions.beetleWingedStorm = {
    ...baseBeetleWingedDefinition,
    acceleration: 0.2,
    life: 2, touchDamage: 1,
    abilities: [lightningShieldAbility],
    params: {
        element: 'lightning',
        shieldColor: 'yellow',
    },
    immunities: ['lightning'],
    touchHit: {damage: 1, element: 'lightning'},
    elementalMultipliers: {'fire': 1.5, 'ice': 1.5},
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        renderShield(context, enemy.getHitbox(), enemy.shielded, enemy.params.shieldColor);
    } ,
};
