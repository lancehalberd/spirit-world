import {enemyDefinitions} from 'app/content/enemies/enemyHash';
import {Enemy} from 'app/content/enemy';
import {crystalNovaAbility, crystalProjectileAbility, crystalProjectileArcAbility} from 'app/content/enemyAbilities/crystalProjectile';
import {groundSpikeAbility, groundSpikeLineAbility} from 'app/content/enemyAbilities/groundSpike';
import {
    beetleAnimations,
    climbingBeetleAnimations,
    beetleHornedAnimations,
    beetleMiniAnimations,
    floorEyeAnimations,
} from 'app/content/enemyAnimations';
import {certainLifeLootTable, simpleLootTable, lifeLootTable, moneyLootTable} from 'app/content/lootTables';
import {renderIndicator} from 'app/content/objects/indicator';
import {editingState} from 'app/development/editingState';
import {directionMap} from 'app/utils/direction';
import {paceAndCharge, scurryAndChase} from 'app/utils/enemies';
import {coverTile} from 'app/utils/field';
import {addObjectToArea} from 'app/utils/objects';
import { getNearbyTarget } from 'app/utils/target';

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
    naturalDifficultyRating: 1,
    abilities: [],
    animations: beetleAnimations, acceleration: 0.05, life: 2, touchDamage: 1,
    lootTable: simpleLootTable,
    shadowRadius: 9,
    initialize(state: GameState, enemy: Enemy<any>) {
        if (enemy.difficulty > this.naturalDifficultyRating) {
            enemy.gainAbility(crystalProjectileAbility);
        }
    },
    update(state: GameState, enemy: Enemy<any>) {
        enemy.useRandomAbility(state);
        scurryAndChase(state, enemy);
    },
    onDeath(state: GameState, enemy: Enemy<any>) {
        if (enemy.difficulty <= this.naturalDifficultyRating) {
            return;
        }
        const baseTheta = 2 * Math.PI * Math.random();
        const hitbox = enemy.getHitbox();
        for (let i = 0; i < 3; i++) {
            const theta = baseTheta + 2 * Math.PI * i / 3;
            const dx = Math.cos(theta), dy = Math.sin(theta);
            const miniBeetle = new Enemy(state, {
                status: 'normal',
                type: 'enemy',
                enemyType: 'beetleMini',
                x: hitbox.x + hitbox.w / 2 + dx * hitbox.w / 2,
                y: hitbox.y + hitbox.h / 2 + dy * hitbox.h / 2,
            });
            miniBeetle.vx = dx;
            miniBeetle.vy = dy;
            miniBeetle.z = enemy.z;
            miniBeetle.invulnerableFrames = miniBeetle.enemyInvulnerableFrames = 20;
            addObjectToArea(state, enemy.area, miniBeetle);
        }
    }
};

enemyDefinitions.climbingBeetle = {
    naturalDifficultyRating: 1,
    animations: climbingBeetleAnimations, acceleration: 0.05, life: 2, touchDamage: 1,
    aggroRadius: 96,
    lootTable: simpleLootTable,
    tileBehaviors: {touchHit: { damage: 1}, solid: true},
    canBeKnockedBack: false,
    initialize(state: GameState, enemy: Enemy<any>) {
        if (enemy.difficulty > this.naturalDifficultyRating) {
            enemy.life *= 2;
            enemy.gainAbility(groundSpikeLineAbility);
            enemy.gainAbility(groundSpikeAbility);
        }
    },
    update(state: GameState, enemy: Enemy<any>) {
        enemy.useRandomAbility(state);
    },
    onDeath(state: GameState, enemy: Enemy<any>) {
        if (enemy.difficulty <= this.naturalDifficultyRating) {
            return;
        }
        crystalNovaAbility.useAbility(state, enemy, true);
    }
};
const thornsTilesIndex = 184;
enemyDefinitions.beetleHorned = {
    naturalDifficultyRating: 2,
    animations: beetleHornedAnimations, life: 3, touchDamage: 1, update: paceAndCharge,
    aggroRadius: 128,
    lootTable: moneyLootTable,
    shadowRadius: 9,
    afterUpdate(state: GameState, enemy: Enemy<any>) {
        if (enemy.difficulty <= this.naturalDifficultyRating) {
            return;
        }
        if (enemy.mode === 'charge') {
            const hitbox = enemy.getHitbox();
            const tx = ((hitbox.x + hitbox.w / 2) / 16) | 0;
            const ty = ((hitbox.y + hitbox.h / 2) / 16) | 0;
            coverTile(state, enemy.area, tx, ty, thornsTilesIndex);
        } else if (enemy.mode === 'stunned' && enemy.modeTime <= 0) {
            const [x, y] = directionMap[enemy.d];
            crystalProjectileArcAbility.useAbility(state, enemy, {x: -x, y: -y});
        }
    },
};
enemyDefinitions.beetleMini = {
    naturalDifficultyRating: 1,
    animations: beetleMiniAnimations, aggroRadius: 32,
    acceleration: 0.02,
    speed: 0.8,
    hasShadow: false, life: 1, touchDamage: 1, update: scurryAndChase,
    lootTable: lifeLootTable,
    initialize(state: GameState, enemy: Enemy<any>) {
        if (enemy.difficulty > this.naturalDifficultyRating) {
            enemy.life *= 1.5;
            enemy.speed = 1.2;
            enemy.aggroRadius = 96;
            enemy.acceleration = 0.05;
        }
    },
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
    naturalDifficultyRating: 4,
    abilities: [groundSpikeAbility],
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
        if (enemy.animationTime >= enemy.currentAnimation.duration) {
            enemy.changeToAnimation('open');
        }
        if (enemy.modeTime >= 1000) {
            enemy.useRandomAbility(state);
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

