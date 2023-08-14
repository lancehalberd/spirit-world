import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { GrowingThorn } from 'app/content/effects/growingThorn';
import { GroundSpike } from 'app/content/effects/groundSpike';
import {
    beetleAnimations,
    climbingBeetleAnimations,
    beetleHornedAnimations,
    beetleMiniAnimations,
    beetleWingedAnimations,
    entAnimations,
    floorEyeAnimations,
} from 'app/content/enemyAnimations';
import { certainLifeLootTable, simpleLootTable, lifeLootTable, moneyLootTable } from 'app/content/lootTables';
import { renderIndicator } from 'app/content/objects/indicator';
import { editingState } from 'app/development/editingState';
import { FRAME_LENGTH } from 'app/gameConstants';
import {
    paceAndCharge, scurryAndChase,
} from 'app/utils/enemies';
import { getNearbyTarget, getVectorToNearbyTarget } from 'app/utils/target';
import { addEffectToArea } from 'app/utils/effects';

export * from 'app/content/enemies/arrowTurret';
export * from 'app/content/enemies/balloonCentipede';
export * from 'app/content/enemies/crusher';
export * from 'app/content/enemies/crystalBat';
export * from 'app/content/enemies/crystalGuardian';
export * from 'app/content/enemies/electricSquirrel';
export * from 'app/content/enemies/elemental';
export * from 'app/content/enemies/lightningDrone';
export * from 'app/content/enemies/luckyBeetle';
export * from 'app/content/enemies/plant';
export * from 'app/content/enemies/sentryBot';
export * from 'app/content/enemies/snake';
export * from 'app/content/enemies/squirrel';
export * from 'app/content/enemies/vortex';

export const enemyTypes = <const>[
    'arrowTurret',
    'balloonCentipede',
    'beetle', 'climbingBeetle', 'beetleHorned', 'beetleMini', 'beetleWinged',
    'crusher', 'crystalBat', 'crystalGuardian',
    'electricSquirrel', 'ent',

    'floorEye',
    'elementalFlame', 'elementalFrost', 'elementalStorm',
    // These are designed for the golem boss but could be use in isolation with some adjustments.
    'golemHand',
    'lightningBug', 'lightningDrone',
    'luckyBeetle',
    'plant', 'plantFlame', 'plantFrost', 'plantStorm',
    'sentryBot',
    'snake', 'snakeFlame', 'snakeFrost', 'snakeStorm',
    'squirrel',
    'vortex',
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
enemyDefinitions.beetleWinged = {
    animations: beetleWingedAnimations,
    flying: true, acceleration: 0.1, aggroRadius: 112,
    life: 1, touchDamage: 1, update: scurryAndChase,
    lootTable: simpleLootTable,
    elementalMultipliers: {'lightning': 2},
};

enemyDefinitions.lightningBug = {
    alwaysReset: true,
    animations: beetleWingedAnimations, acceleration: 0.2, speed: 1, aggroRadius: 112, flying: true,
    life: 3, touchDamage: 1, update: updateStormLightningBug,
    params: {
        shieldColor: 'yellow',
    },
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) {
        renderLightningShield(context, enemy.getHitbox(), enemy.shielded, enemy.params.shieldColor);
    } ,
    immunities: ['lightning'],
    renderPreview(context: CanvasRenderingContext2D, enemy: Enemy, target: Rect): void {
        enemy.defaultRenderPreview(context, target);
        renderLightningShield(context, target, true, enemy.params.shieldColor);
    },
};

enemyDefinitions.ent = {
    alwaysReset: true,
    animations: entAnimations, aggroRadius: 128,
    life: 8, touchDamage: 2, update: updateEnt,
    ignorePits: true,
    elementalMultipliers: {'fire': 2},
    // The damage from tile behaviors will trigger when the player attempts to move into the same pixel,
    // which is more specific than touch damage on enemies which requires actually being in the same pixel.
    tileBehaviors: {touchHit: { damage: 2}, solid: true},
    canBeKnockedBack: false,
};

function updateEnt(state: GameState, enemy: Enemy): void {
    if (enemy.mode === 'attack') {
        const target = getNearbyTarget(state, enemy, enemy.enemyDefinition.aggroRadius, enemy.area.allyTargets, new Set([state.hero.astralProjection]));

        if (enemy.modeTime > 0 && enemy.modeTime % 500 === 0 && target) {
            const targetHitbox = target.getHitbox(state);
            const thorns = new GrowingThorn({
                x: targetHitbox.x + targetHitbox.w / 2,
                y: targetHitbox.y + targetHitbox.h / 2,
                damage: 1,
            });
            addEffectToArea(state, enemy.area, thorns);
        }
        if (enemy.modeTime >= 2000) {
            enemy.setMode('recover')
        }
    } else if (enemy.mode === 'recover') {
        if (enemy.modeTime >= 3000) {
            enemy.setMode('wait')
        }
    } else {
        if (enemy.modeTime >= 1000) {
            const target = getNearbyTarget(state, enemy, enemy.enemyDefinition.aggroRadius, enemy.area.allyTargets, new Set([state.hero.astralProjection]));
            if (target) {
                enemy.setMode('attack');
            }
        }
    }
}

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
            if (state.hero.passiveTools.trueSight) {
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

function updateStormLightningBug(state: GameState, enemy: Enemy): void {
    scurryAndChase(state, enemy);
    enemy.params.shieldCooldown = enemy.params.shieldCooldown ?? 1000 + Math.random() * 1000;
    if (enemy.params.shieldCooldown > 0) {
        enemy.params.shieldCooldown -= FRAME_LENGTH;
        if (enemy.params.shieldCooldown < 3000) {
            enemy.shielded = false;
        }
    } else {
        const chaseVector = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
        if (chaseVector) {
            enemy.params.shieldCooldown = 5000;
            enemy.shielded = true;
        }
    }
    if (enemy.shielded) {
        if (enemy.animationTime % 200 === 0) {
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
    } else {
        if (enemy.animationTime % 300 === 0) {
            const hitbox = enemy.getHitbox(state);
            const theta = Math.PI / 2 + 2 * Math.PI * enemy.animationTime / 900;
            addSparkleAnimation(state, enemy.area, {
                ...hitbox,
                x: hitbox.x + 4 * Math.cos(theta),
                y: hitbox.y + 4 * Math.sin(theta),
                w: hitbox.w / 2,
                h: hitbox.h / 2,
            }, { element: 'lightning', velocity: {x: enemy.vx, y: enemy.vy}});
        }
    }
}

function renderLightningShield(context: CanvasRenderingContext2D, hitbox: Rect, shielded = true, color = '#888'): void {
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

/*
function updateWallLaser(state: GameState, enemy: Enemy): void {
    function shoot() {
        const hitbox = enemy.getHitbox(state);
        const dx = directionMap[enemy.d][0];
        const dy = directionMap[enemy.d][1];
        const arrow = new EnemyArrow({
            x: hitbox.x + hitbox.w / 2 + hitbox.w / 2 * dx,
            y: hitbox.y + hitbox.h / 2 + hitbox.h / 2 * dy,
            vx: 4 * dx,
            vy: 4 * dy,
        });
        addEffectToArea(state, enemy.area, arrow);
    }
    if (enemy.params.alwaysShoot) {
        if (enemy.modeTime % 300 === FRAME_LENGTH) {
            shoot();
        }
        return;
    }
    if (enemy.mode === 'shoot') {
        const {hero} = getLineOfSightTargetAndDirection(state, enemy, enemy.d, true);
        if (!hero && enemy.modeTime > 900) {
            enemy.setMode('wait');
        } else if (enemy.modeTime % 300 === FRAME_LENGTH) {
            shoot();
        }
    } else if (enemy.mode === 'charge') {
        if (enemy.modeTime >= 500) {
            enemy.setMode('shoot');
        }
    } else {
        const {hero} = getLineOfSightTargetAndDirection(state, enemy, enemy.d, true);
        if (hero) {
            enemy.setMode('charge');
        }
    }
}*/

