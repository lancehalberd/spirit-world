import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { GroundSpike } from 'app/content/effects/groundSpike';
import {
    beetleAnimations,
    climbingBeetleAnimations,
    beetleHornedAnimations,
    beetleMiniAnimations,
    floorEyeAnimations,
} from 'app/content/enemyAnimations';
import { certainLifeLootTable, simpleLootTable, lifeLootTable, moneyLootTable } from 'app/content/lootTables';
import { renderIndicator } from 'app/content/objects/indicator';
import { editingState } from 'app/development/editingState';
import {
    paceAndCharge, scurryAndChase,
} from 'app/utils/enemies';
import { getNearbyTarget } from 'app/utils/target';
import { addEffectToArea } from 'app/utils/effects';

export * from 'app/content/enemies/arrowTurret';
export * from 'app/content/enemies/balloonCentipede';
export * from 'app/content/enemies/beetleWinged';
export * from 'app/content/enemies/crusher';
export * from 'app/content/enemies/crystalBat';
export * from 'app/content/enemies/crystalGuardian';
export * from 'app/content/enemies/elemental';
export * from 'app/content/enemies/lightningDrone';
export * from 'app/content/enemies/luckyBeetle';
export * from 'app/content/enemies/mushroom';
export * from 'app/content/enemies/orb';
export * from 'app/content/enemies/plant';
export * from 'app/content/enemies/sentryBot';
export * from 'app/content/enemies/snake';
export * from 'app/content/enemies/squirrel';
export * from 'app/content/enemies/vortex';

export const enemyTypes = <const>[
    'arrowTurret',
    'balloonCentipede',
    'beetle', 'climbingBeetle', 'beetleHorned', 'beetleMini',
    'beetleWinged', 'beetleWingedFlame', 'beetleWingedFrost', 'beetleWingedStorm',
    'crusher', 'crystalBat', 'crystalGuardian',
    'mushroom',
    'floorEye',
    'elementalFlame', 'elementalFrost', 'elementalStorm',
    'lightningDrone',
    'luckyBeetle',
    'plant', 'plantFlame', 'plantFrost', 'plantStorm',
    'smallOrb', 'largeOrb',
    'sentryBot',
    'snake', 'snakeFlame', 'snakeFrost', 'snakeStorm',
    'squirrel', 'squirrelFlame', 'squirrelFrost', 'squirrelStorm',
    'vortex',
    // Placeable boss minions, not intended to be used outside of their boss fights.
    // This is for the Golem Boss, use "Crusher" for a standalone enemy.
    'golemHand',
    'guardianProjection',
];
declare global {
    export type EnemyType = typeof enemyTypes[number];
}


enemyDefinitions.beetle = {
    animations: beetleAnimations, acceleration: 0.05, life: 2, touchDamage: 1, update: scurryAndChase,
    lootTable: simpleLootTable,
};
enemyDefinitions.climbingBeetle = {
    animations: climbingBeetleAnimations, acceleration: 0.05, life: 2, touchDamage: 1,
    lootTable: simpleLootTable,
    tileBehaviors: {touchHit: { damage: 1}, solid: true},
    canBeKnockedBack: false,
};
enemyDefinitions.beetleHorned = {
    animations: beetleHornedAnimations, life: 3, touchDamage: 1, update: paceAndCharge,
    aggroRadius: 128,
    lootTable: moneyLootTable,
};
enemyDefinitions.beetleMini = {
    animations: beetleMiniAnimations, aggroRadius: 32,
    acceleration: 0.02,
    speed: 0.8,
    hasShadow: false, life: 1, touchDamage: 1, update: scurryAndChase,
    lootTable: lifeLootTable,
};


function isUnderTile(state: GameState, enemy: Enemy): boolean {
    const hitbox = enemy.getHitbox(state);
    const tx = Math.floor((hitbox.x + hitbox.w / 2) / 16);
    const ty = Math.floor((hitbox.y + hitbox.h / 2) / 16);
    const behavior = enemy.area.behaviorGrid?.[ty]?.[tx];
    // Hide the enemy as long as there is something on top of it.
    return !!(behavior?.solid || behavior?.cuttable);
}

enemyDefinitions.floorEye = {
    animations: floorEyeAnimations, aggroRadius: 96,
    hasShadow: false,
    initialMode: 'closed',
    lootTable: certainLifeLootTable,
    // This will get set to 2 when the eye is open.
    touchDamage: 0,
    life: 4, update: updateFloorEye,
    elementalMultipliers: {'lightning': 2},
    render: (context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) => {
        // Render normally while editing.
        if (editingState.isEditing) {
            enemy.defaultRender(context, state);
        }
    },
    drawPriority: 'background',
    canBeKnockedBack: false,
    renderShadow(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        if (enemy.status === 'gone' || enemy.status === 'hidden') {
            return;
        }
        if (isUnderTile(state, enemy)) {
            if (state.hero.savedData.passiveTools.trueSight) {
                renderIndicator(context, enemy.getHitbox(), enemy.animationTime);
            }
            return;
        }
        enemy.defaultRender(context, state);
    },
};
function updateFloorEye(state: GameState, enemy: Enemy): void {
    if (enemy.mode === 'open') {
        enemy.isInvulnerable = isUnderTile(state, enemy);
        const target = getNearbyTarget(state, enemy, enemy.enemyDefinition.aggroRadius, enemy.area.allyTargets);
        if (enemy.animationTime >= enemy.currentAnimation.duration) {
            enemy.changeToAnimation('open');
        }

        if (target && enemy.modeTime > 1000 && enemy.modeTime % 1000 === 500) {
            enemy.changeToAnimation('attack');
            const targetHitbox = target.getHitbox(state);
            const spike = new GroundSpike({
                x: targetHitbox.x + targetHitbox.w / 2,
                y: targetHitbox.y + targetHitbox.h / 2,
                damage: 4,
            });
            addEffectToArea(state, enemy.area, spike);
        }
        if (enemy.modeTime >= 4400) {
            enemy.setMode('closing')
        }
    } else if (enemy.mode === 'opening') {
        enemy.changeToAnimation('opening');
        enemy.isInvulnerable = true;
        if (enemy.modeTime >= enemy.currentAnimation.frameDuration * 2) {
            enemy.setMode('open');
        }
    } else if (enemy.mode === 'closing') {
        enemy.changeToAnimation('closing');
        enemy.isInvulnerable = true;
        if (enemy.animationTime >= enemy.currentAnimation.duration) {
            enemy.setMode('closed');
        }
    } else {
        enemy.changeToAnimation('idle');
        enemy.isInvulnerable = true;
        enemy.mode = 'closed';
        if (enemy.modeTime >= 2000) {
            const target = getNearbyTarget(state, enemy, enemy.enemyDefinition.aggroRadius, enemy.area.allyTargets);
            if (target) {
                enemy.setMode('opening');
            }
        }
    }
    enemy.touchHit = enemy.isInvulnerable ? null : { damage: 2 };
}

