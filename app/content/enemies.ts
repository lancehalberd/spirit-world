import { sample } from 'lodash';

import { addSparkleAnimation } from 'app/content/effects/animationEffect';
import { Clone } from 'app/content/objects/clone';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { AnimationEffect } from 'app/content/effects/animationEffect';
import { EnemyArrow } from 'app/content/effects/arrow';
import { Flame } from 'app/content/effects/flame';
import { FrostGrenade } from 'app/content/effects/frostGrenade';
import { GrowingThorn } from 'app/content/effects/growingThorn';
import { GroundSpike } from 'app/content/effects/groundSpike';
import { SpikePod } from 'app/content/effects/spikePod';
import {
    beetleAnimations,
    climbingBeetleAnimations,
    beetleHornedAnimations,
    beetleMiniAnimations,
    beetleWingedAnimations,
    entAnimations,
    snakeAnimations,
} from 'app/content/enemyAnimations';
import { certainLifeLootTable, simpleLootTable, lifeLootTable, moneyLootTable } from 'app/content/lootTables';
import { addEffectToArea, getAreaSize } from 'app/content/areas';
import { editingState } from 'app/development/tileEditor';
import { FRAME_LENGTH } from 'app/gameConstants';
import { moveActor } from 'app/moveActor';
import { createAnimation } from 'app/utils/animations';
import { directionMap, getDirection } from 'app/utils/field';
import { playSound } from 'app/utils/sounds';

import {
    ActorAnimations, Direction, EffectInstance,
    Enemy, FrameAnimation, FrameDimensions, GameState,
    Hero, HitProperties, HitResult, LootTable,
    MagicElement, MovementProperties, ObjectInstance, Rect,
    TileBehaviors,
} from 'app/types';

export * from 'app/content/enemies/electricSquirrel';
export * from 'app/content/enemies/lightningDrone';
export * from 'app/content/enemies/sentryBot';
export * from 'app/content/enemies/squirrel';

export const enemyTypes = <const>[
    'arrowTurret',
    'beetle', 'climbingBeetle', 'beetleHorned', 'beetleMini', 'beetleWinged',
    'crystalGuardian',
    'electricSquirrel', 'ent',
    'flameSnake', 'frostBeetle',
    'floorEye',
    'lightningBug', 'lightningDrone',
    'sentryBot', 'snake', 'squirrel',
    'wallLaser',
];
// Not intended for use in the editor.
export type EnemyType = typeof enemyTypes[number];

export interface EnemyDefinition {
    alwaysReset?: boolean
    animations: ActorAnimations
    aggroRadius?: number
    tileBehaviors?: TileBehaviors
    canBeKnockedBack?: boolean
    canBeKnockedDown?: boolean
    flipRight?: boolean
    flying?: boolean
    hasShadow?: boolean
    ignorePits?: boolean
    life?: number
    lootTable?: LootTable
    // This enemy won't be destroyed when reaching 0 life.
    isImmortal?: boolean
    immunities?: MagicElement[]
    elementalMultipliers?: {[key in MagicElement]?: number}
    initialMode?: string
    params?: any
    speed?: number
    acceleration?: number
    scale?: number
    touchDamage?: number
    touchHit?: HitProperties
    update?: (state: GameState, enemy: Enemy) => void
    onDeath?: (state: GameState, enemy: Enemy) => void
    onHit?: (state: GameState, enemy: Enemy, hit: HitProperties) => HitResult
    // Optional render function called instead of the standard render logic.
    render?: (context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) => void
    // Optional render function called after the standard render.
    renderOver?: (context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) => void
    getHealthPercent?: (state: GameState, enemy: Enemy) => number
    getShieldPercent?: (state: GameState, enemy: Enemy) => number
    getHitbox?: (state: GameState, enemy: Enemy) => Rect
}

enemyDefinitions.arrowTurret = {
    animations: beetleAnimations, life: 4, touchDamage: 1, update: spinAndShoot,
    lootTable: simpleLootTable,
    canBeKnockedBack: false,
};
enemyDefinitions.snake = {
    animations: snakeAnimations, life: 2, touchDamage: 1, update: paceRandomly, flipRight: true,
    lootTable: simpleLootTable,
};
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
};
enemyDefinitions.wallLaser = {
    animations: snakeAnimations, life: 1, touchDamage: 1, update: updateWallLaser, flipRight: true,
    lootTable: simpleLootTable, params: { alwaysShoot: false },
};
enemyDefinitions.flameSnake = {
    alwaysReset: true,
    animations: snakeAnimations, speed: 1.1,
    life: 3, touchDamage: 1, update: updateFlameSnake, flipRight: true,
    immunities: ['fire'],
};
enemyDefinitions.frostBeetle = {
    alwaysReset: true,
    animations: beetleAnimations, speed: 0.7, aggroRadius: 112,
    life: 5, touchDamage: 1, update: updateFrostBeetle,
    immunities: ['ice'],
};
enemyDefinitions.lightningBug = {
    alwaysReset: true,
    animations: beetleWingedAnimations, acceleration: 0.2, speed: 1, aggroRadius: 112, flying: true,
    life: 3, touchDamage: 1, update: updateStormLightningBug, renderOver: renderLightningShield,
    immunities: ['lightning'],
};

enemyDefinitions.ent = {
    alwaysReset: true,
    animations: entAnimations, aggroRadius: 128,
    life: 8, touchDamage: 2, update: updateEnt,
    ignorePits: true,
    // The damage from tile behaviors will trigger when the player attempts to move into the same pixel,
    // which is more specific than touch damage on enemies which requires actually being in the same pixel.
    tileBehaviors: {touchHit: { damage: 2}, solid: true},
    canBeKnockedBack: false,
};

enemyDefinitions.crystalGuardian = {
    alwaysReset: true,
    params: {
        shieldLife: 4,
    },
    animations: entAnimations, aggroRadius: 128,
    life: 8, touchDamage: 2,
    canBeKnockedBack: false,
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        // If the shield is up, only fire damage can hurt it.
        if (enemy.params.shieldLife > 0) {
            if (hit.canDamageCrystalShields) {
                enemy.params.shieldLife = Math.max(0, enemy.params.shieldLife - hit.damage);
                playSound('enemyHit');
                return { hit: true };
            }
        }
        // Use the default hit behavior, the attack will be blocked if the shield is still up.
        return enemy.defaultOnHit(state, hit);
    },
    update(state: GameState, enemy: Enemy): void {
        enemy.shielded = enemy.params.shieldLife > 0;
        // Summon a pod once very 2 seconds if a target is nearby.
        if (enemy.modeTime >= 2000) {
            const v = getVectorToNearbyTarget(state, enemy, enemy.enemyDefinition.aggroRadius, enemy.area.allyTargets);
            if (v) {
                const {x, y} = v;
                // This should spawn in a ficed radius around the guardian in between it and the target.
                addEffectToArea(state, enemy.area, new SpikePod({
                    x: enemy.x + enemy.w / 2 + 48 * x,
                    y: enemy.y + enemy.h / 2 + 48 * y,
                    damage: 2,
                }));
                enemy.modeTime = 0;
            }
        }
    },
    ignorePits: true,
    // The damage from tile behaviors will trigger when the player attempts to move into the same pixel,
    // which is more specific than touch damage on enemies which requires actually being in the same pixel.
    tileBehaviors: {touchHit: {damage: 2 }, solid: true},
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        const defaultParams = enemyDefinitions.crystalGuardian.params;
        if (enemy.params.shieldLife <= 0) {
            return;
        }
        const hitbox = enemy.getHitbox(state);
        context.save();
            context.globalAlpha *= (0.4 + 0.4 * enemy.params.shieldLife / defaultParams.shieldLife);
            context.fillStyle = 'white';
            context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
        context.restore();
        // Debug the vector to where the pod will by created.
        /*const v = getVectorToNearbyTarget(state, enemy, enemy.enemyDefinition.aggroRadius, enemy.area.allyTargets);
        if (v) {
            context.beginPath();
            context.moveTo(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
            context.lineTo(enemy.x + enemy.w / 2 + v.x * 48, enemy.y + enemy.h / 2 + v.y * 48);
            context.strokeStyle = 'red';
            context.stroke();
        }*/
    }
};

function updateEnt(state: GameState, enemy: Enemy): void {
    if (enemy.mode === 'attack') {
        const target = getNearbyTarget(state, enemy, enemy.enemyDefinition.aggroRadius, enemy.area.allyTargets, new Set([state.hero.astralProjection]));

        if (enemy.modeTime > 0 && enemy.modeTime % 500 === 0 && target) {
            const targetHitbox = target.getHitbox(state);
            const thorns = new GrowingThorn({
                x: targetHitbox.x + targetHitbox.w / 2,
                y: targetHitbox.y + targetHitbox.h / 2,
                damage: 2,
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


enemyDefinitions.floorEye = {
    animations: climbingBeetleAnimations, aggroRadius: 96,
    hasShadow: false,
    initialMode: 'closed',
    lootTable: certainLifeLootTable,
    // TODO: Set this to 2 and add a way to remove touch damage when the eye is not fully open.
    touchDamage: 0,
    life: 4, update: updateFloorEye,
    render: renderUnderTiles,
    canBeKnockedBack: false,
};
function renderUnderTiles(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
    // Render normally while editing.
    if (editingState.isEditing) {
        enemy.defaultRender(context, state);
    }
    const hitbox = enemy.getHitbox(state);
    const tx = Math.floor((hitbox.x + hitbox.w / 2) / 16);
    const ty = Math.floor((hitbox.y + hitbox.h / 2) / 16);
    if (!enemy.area) {
        return;
    }
    const behavior = enemy.area.behaviorGrid?.[ty]?.[tx];
    // Hide the enemy as long as there is something on top of it.
    if (behavior?.solid || behavior?.cuttable) {
        return;
    }
    context.save();
        if (enemy.mode === 'closing') {
            context.globalAlpha *= Math.max(0.3, 1 - enemy.modeTime / 1000);
        } else if (enemy.mode === 'opening') {
            context.globalAlpha *= Math.min(1, 0.3 + enemy.modeTime / 1000);
        } else if (enemy.mode === 'closed') {
            context.globalAlpha = 0.3;
        }
        enemy.defaultRender(context, state);
    context.restore();
}
function updateFloorEye(state: GameState, enemy: Enemy): void {
    if (enemy.mode === 'attack') {
        enemy.isInvulnerable = false;
        const target = getNearbyTarget(state, enemy, enemy.enemyDefinition.aggroRadius, enemy.area.allyTargets);

        if (target && enemy.modeTime % 1000 === 0) {
            const targetHitbox = target.getHitbox(state);
            const spike = new GroundSpike({
                x: targetHitbox.x + targetHitbox.w / 2,
                y: targetHitbox.y + targetHitbox.h / 2,
                damage: 4,
            });
            addEffectToArea(state, enemy.area, spike);
        }
        if (enemy.modeTime >= 2000) {
            enemy.setMode('closing')
        }
    } else if (enemy.mode === 'opening') {
        enemy.isInvulnerable = true;
        if (enemy.modeTime >= 1000) {
            enemy.setMode('attack')
        }
    } else if (enemy.mode === 'closing') {
        enemy.isInvulnerable = true;
        if (enemy.modeTime >= 1000) {
            enemy.setMode('closed')
        }
    } else {
        enemy.isInvulnerable = true;
        enemy.mode = 'closed';
        if (enemy.modeTime >= 1000) {
            const target = getNearbyTarget(state, enemy, enemy.enemyDefinition.aggroRadius, enemy.area.allyTargets);
            if (target) {
                enemy.setMode('opening');
            }
        }
    }
}

function updateFlameSnake(state: GameState, enemy: Enemy): void {
    paceRandomly(state, enemy);
    if (enemy.params.flameCooldown > 0) {
        enemy.params.flameCooldown -= FRAME_LENGTH;
    } else {
        const hitbox = enemy.getHitbox(state);
        const flame = new Flame({
            x: hitbox.x + hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2 - 1,
        });
        flame.x -= flame.w / 2;
        flame.y -= flame.h / 2;
        addEffectToArea(state, enemy.area, flame);
        enemy.params.flameCooldown = 400;
    }
    enemy.params.shootCooldown = enemy.params.shootCooldown ?? 1000 + Math.random() * 1000;
    if (enemy.params.shootCooldown > 0) {
        enemy.params.shootCooldown -= FRAME_LENGTH;
    } else if (enemy.modeTime >= 200) {
        const {hero} = getLineOfSightTargetAndDirection(state, enemy, enemy.d);
        if (!hero) {
            return;
        }
        enemy.params.shootCooldown = 2000;
        const hitbox = enemy.getHitbox(state);
        const [dx, dy] = directionMap[enemy.d];
        const flame = new Flame({
            x: hitbox.x + hitbox.w / 2 + dx * hitbox.w / 2,
            y: hitbox.y + hitbox.h / 2 - 1 + dy * hitbox.h / 2,
            vx: 4 * dx,
            vy: 4 * dy,
            ttl: 1000,
        });
        flame.x -= flame.w / 2;
        flame.y -= flame.h / 2;
        addEffectToArea(state, enemy.area, flame);
        enemy.params.flameCooldown = 400;
    }
}
function updateFrostBeetle(state: GameState, enemy: Enemy): void {
    if (enemy.params.shootCooldown > 0) {
        enemy.params.shootCooldown -= FRAME_LENGTH;
    } else {
        const attackVector = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius / 2, enemy.area.allyTargets);
        if (attackVector) {
            throwIceGrenadeAtLocation(state, enemy, {
                tx: state.hero.x + state.hero.w / 2,
                ty: state.hero.y + state.hero.h / 2,
            });
            enemy.params.shootCooldown = 3000;
        } else {
            scurryAndChase(state, enemy);
        }
    }
}
function updateStormLightningBug(state: GameState, enemy: Enemy): void {
    enemy.params.shieldColor = 'yellow';
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

function renderLightningShield(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
    const hitbox = enemy.getHitbox(state);
    context.strokeStyle = enemy.params.shieldColor ?? '#888';
    if (enemy.shielded) {
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
export function throwIceGrenadeAtLocation(state: GameState, enemy: Enemy, {tx, ty}: {tx: number, ty: number}, damage = 1): void {
    const hitbox = enemy.getHitbox(state);
    const x = hitbox.x + hitbox.w / 2;
    const y = hitbox.y + hitbox.h / 2;
    const z = 8;
    const vz = 4;
    const az = -0.2;
    const duration = -2 * vz / az;
    const frostGrenade = new FrostGrenade({
        damage,
        x,
        y,
        z,
        vx: (tx - x) / duration,
        vy: (ty - y) / duration,
        vz,
        az,
    });
    addEffectToArea(state, enemy.area, frostGrenade);
}

function spinAndShoot(state: GameState, enemy: Enemy): void {
    if (typeof enemy.params.currentTheta === 'undefined') {
        enemy.params.lastTheta = enemy.params.currentTheta = Math.floor(Math.random() * 2) * Math.PI / 4;
    }
    if (enemy.mode === 'shoot') {
        if (enemy.modeTime === 100) {
            for (let i = 0; i < 4; i++) {
                const hitbox = enemy.getHitbox(state);
                const dx = Math.cos(enemy.params.currentTheta + i * Math.PI / 2);
                const dy = Math.sin(enemy.params.currentTheta + i * Math.PI / 2);
                const arrow = new EnemyArrow({
                    x: hitbox.x + hitbox.w / 2 + hitbox.w / 2 * dx,
                    y: hitbox.y + hitbox.h / 2 + hitbox.h / 2 * dy,
                    vx: 4 * dx,
                    vy: 4 * dy,
                });
                addEffectToArea(state, enemy.area, arrow);
            }
        }
        if (enemy.modeTime >= 500) {
            enemy.setMode('spin');
        }
    } else {
        enemy.params.currentTheta = enemy.params.lastTheta + Math.PI / 4 * enemy.modeTime / 1000;
        if (enemy.modeTime >= 500) {
            enemy.params.lastTheta = enemy.params.currentTheta = (enemy.params.lastTheta + Math.PI / 4) % (2 * Math.PI);
            enemy.setMode('shoot');
        }
    }
}

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
}

export function moveEnemyToTargetLocation(state: GameState, enemy: Enemy, tx: number, ty: number): number {
    const hitbox = enemy.getHitbox(state);
    const dx = tx - (hitbox.x + hitbox.w / 2), dy = ty - (hitbox.y + hitbox.h / 2);
    enemy.d = getDirection(dx, dy);
    enemy.currentAnimation = enemy.enemyDefinition.animations.idle[enemy.d];
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > enemy.speed) {
        moveEnemy(state, enemy, enemy.speed * dx / mag, enemy.speed * dy / mag, {
            boundToSection: false,
            boundToSectionPadding: 0,
        });
        return mag - enemy.speed;
    }
    moveEnemy(state, enemy, dx, dy, {});
    return 0;
}

// The enemy choose a vector and accelerates in that direction for a bit.
// The enemy slides a bit since it doesn't immediately move in the desired direction.
const maxScurryTime = 4000;
const minScurryTime = 1000;
function scurryRandomly(state: GameState, enemy: Enemy) {
    if (enemy.mode === 'choose' && enemy.modeTime > 200) {
        enemy.params.theta = 2 * Math.PI * Math.random();
        enemy.setMode('scurry');
        enemy.currentAnimation = enemy.enemyDefinition.animations.idle[enemy.d];
    }
    let tvx = 0, tvy = 0;
    if (enemy.mode === 'scurry') {
        tvx = enemy.speed * Math.cos(enemy.params.theta);
        tvy = enemy.speed * Math.sin(enemy.params.theta);
        if (enemy.modeTime > minScurryTime &&
            Math.random() < (enemy.modeTime - minScurryTime) / (maxScurryTime - minScurryTime)
        ) {
            enemy.setMode('choose');
        }
    }
    const ax = tvx - enemy.vx;
    const ay = tvy - enemy.vy;
    accelerateInDirection(state, enemy, {x: ax, y: ay});
    moveEnemy(state, enemy, enemy.vx, enemy.vy, {});
}

export function accelerateInDirection(state: GameState, enemy: Enemy, a: {x: number, y: number}): void {
    let mag = Math.sqrt(a.x * a.x + a.y * a.y);
    if (mag) {
        enemy.vx = enemy.vx + enemy.acceleration * a.x / mag;
        enemy.vy = enemy.vy + enemy.acceleration * a.y / mag;
        mag = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
        if (mag > enemy.speed) {
            enemy.vx = enemy.speed * enemy.vx / mag;
            enemy.vy = enemy.speed * enemy.vy / mag;
        }
    }
}

function scurryAndChase(state: GameState, enemy: Enemy) {
    const chaseVector = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    if (chaseVector) {
        accelerateInDirection(state, enemy, chaseVector);
        moveEnemy(state, enemy, enemy.vx, enemy.vy, {});
    } else {
        scurryRandomly(state, enemy);
    }
}

export function paceAndCharge(state: GameState, enemy: Enemy) {
    if (enemy.mode === 'knocked') {
        enemy.animationTime = 0;
        enemy.z += enemy.vz;
        enemy.vz -= 0.5;
        moveEnemy(state, enemy, enemy.vx, enemy.vy, {canFall: true});
        if (enemy.z < 0) {
            enemy.z = 0;
        }
    } else if (enemy.mode === 'stunned') {
        enemy.animationTime = 0;
        if (enemy.modeTime > 500) {
            enemy.setMode('choose');
            enemy.setAnimation('idle', enemy.d);
        }
    } else if (enemy.mode !== 'charge') {
        const {d, hero} = getLineOfSightTargetAndDirection(state, enemy);
        if (hero) {
            enemy.d = d;
            enemy.setMode('charge');
            enemy.canBeKnockedBack = false;
            enemy.setAnimation('attack', enemy.d);
        } else {
            paceRandomly(state, enemy);
        }
    } else if (enemy.mode === 'charge') {
        if (enemy.modeTime < 400) {
            enemy.animationTime = 0;
            return;
        }
        if (!moveEnemyFull(state, enemy, 3 * enemy.speed * directionMap[enemy.d][0], 3 * enemy.speed * directionMap[enemy.d][1], {canFall: true, canWiggle: false})) {
            enemy.setMode('stunned');
            enemy.canBeKnockedBack = true;
            enemy.knockBack(state, {
                vx: -enemy.speed * directionMap[enemy.d][0],
                vy: -enemy.speed * directionMap[enemy.d][1],
                vz: 4,
            });
        }
    }
}

export function getVectorToTarget(state: GameState, source: EffectInstance | ObjectInstance, target: EffectInstance | ObjectInstance):{x: number, y: number, mag: number} {
    const hitbox = source.getHitbox(state);
    const targetHitbox = target.getHitbox(state);
    const dx = (targetHitbox.x + targetHitbox.w / 2) - (hitbox.x + hitbox.w / 2);
    const dy = (targetHitbox.y + targetHitbox.h / 2) - (hitbox.y + hitbox.h / 2);
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag) {
        return {mag, x: dx / mag, y: dy / mag};
    }
    return {mag, x: 0, y: 1};
}

export function getVectorToNearbyTarget(state: GameState,
    source: EffectInstance | ObjectInstance, radius: number,
    targets: (EffectInstance | ObjectInstance)[]
): {x: number, y: number, mag: number, target: EffectInstance | ObjectInstance} | null {
    const hitbox = source.getHitbox(state);
    for (const target of targets) {
        if (!target || target.area !== source.area || !target.getHitbox) {
            continue;
        }
        const targetHitbox = target.getHitbox(state);
        const dx = (targetHitbox.x + targetHitbox.w / 2) - (hitbox.x + hitbox.w / 2);
        const dy = (targetHitbox.y + targetHitbox.h / 2) - (hitbox.y + hitbox.h / 2);
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag <= radius) {
            if (mag) {
                return {mag, x: dx / mag, y: dy / mag, target};
            }
            return {mag, x: 0, y: 1, target};
        }
    }
    return null;
}

export function getVectorToNearestTargetOrRandom(state: GameState, source: EffectInstance | ObjectInstance,
    targets: (EffectInstance | ObjectInstance)[]
): {x: number, y: number} {
    const v = getVectorToNearbyTarget(state, source, 1000, targets);
    if (v) {
        return v;
    }
    const dx = Math.random();
    const dy = Math.random();
    if (!dx && !dy) {
        return {x: 0, y: 1};
    }
    const mag = Math.sqrt(dx * dx + dy * dy);
    return {x: dx / mag, y: dy / mag};
}

export function getNearbyTarget(state: GameState, enemy: Enemy, radius: number,
    targets: (EffectInstance | ObjectInstance)[], ignoreTargets: Set<EffectInstance | ObjectInstance> = null
): EffectInstance | ObjectInstance {
    const hitbox = enemy.getHitbox(state);
    for (const target of targets) {
        if (!target || target.area !== enemy.area || !target.getHitbox || ignoreTargets?.has(target)) {
            continue;
        }
        const targetHitbox = target.getHitbox(state);
        const dx = (targetHitbox.x + targetHitbox.w / 2) - (hitbox.x + hitbox.w / 2);
        const dy = (targetHitbox.y + targetHitbox.h / 2) - (hitbox.y + hitbox.h / 2);
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag <= radius) {
            return target;
        }
    }
    return null;
}

function getLineOfSightTargetAndDirection(state: GameState, enemy: Enemy, direction: Direction = null, projectile: boolean = false): {d: Direction, hero: Hero} {
    const hitbox = enemy.getHitbox(state);
    for (const hero of [state.hero, state.hero.astralProjection, ...state.hero.clones]) {
        if (!hero || hero.area !== enemy.area) {
            continue;
        }
        // Reduce dimensions of hitbox for these checks so that the hero is not in line of sight when they are most of a tile
        // off (like 0.5px in line of sight), otherwise the hero can't hide from line of sight on another tile if
        // they aren't perfectly lined up with the tile.
        if (hitbox.x + 1 < hero.x + hero.w && hitbox.x + hitbox.w - 1 > hero.x && (direction !== 'left' && direction !== 'right')) {
            if ((hero.y < hitbox.y && direction === 'down') || (hero.y > hitbox.y && direction === 'up')) {
                continue
            }
            const x = Math.floor(hitbox.x / 16);
            const y1 = Math.floor(hero.y / 16), y2 = Math.floor(hitbox.y / 16);
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            let blocked = false;
            for (let y = minY; y <= maxY; y++) {
                const tileBehavior = {...(enemy.area?.behaviorGrid[y]?.[x] || {})};
                if (tileBehavior.solid || (!projectile && (tileBehavior.pit || tileBehavior.water))) {
                    blocked = true;
                    break;
                }
            }
            if (!blocked) {
                return {
                    d: hero.y < hitbox.y ? 'up' : 'down',
                    hero,
                };
            }
        }
        if (hitbox.y + 1 < hero.y + hero.h && hitbox.y + hitbox.h - 1 > hero.y && (direction !== 'up' && direction !== 'down')) {
            if ((hero.x < hitbox.x && direction === 'right') || (hero.x > hitbox.x && direction === 'left')) {
                continue
            }
            const y = Math.floor(hitbox.y / 16);
            const x1 = Math.floor(hero.x / 16), x2 = Math.floor(hitbox.x / 16);
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            let blocked = false;
            for (let x = minX; x <= maxX; x++) {
                const tileBehavior = {...(enemy.area?.behaviorGrid[y]?.[x] || {})};
                if (tileBehavior.solid || (!projectile && (tileBehavior.pit || tileBehavior.water))) {
                    blocked = true;
                    break;
                }
            }
            if (!blocked) {
                return {
                    d: hero.x < hitbox.x ? 'left' : 'right',
                    hero,
                };
            }
        }
    }
    return {d: null, hero: null};
}

// The enemy pauses to choose a random direction, then moves in that direction for a bit and repeats.
// If the enemy encounters an obstacle, it will change directions more quickly.
export function paceRandomly(state: GameState, enemy: Enemy) {
    if (enemy.mode !== 'walk' && enemy.modeTime > 200) {
        enemy.setMode('walk');
        enemy.d = sample(['up', 'down', 'left', 'right']);
        enemy.currentAnimation = enemy.enemyDefinition.animations.idle[enemy.d];
    }
    if (enemy.mode === 'walk') {
        if (enemy.modeTime >= 200) {
            if (!moveEnemy(state, enemy, enemy.speed * directionMap[enemy.d][0], enemy.speed * directionMap[enemy.d][1], {})) {
                enemy.setMode('choose');
                enemy.modeTime = 200;
            }
        }
        if (enemy.modeTime > 700 && Math.random() < (enemy.modeTime - 700) / 3000) {
            enemy.setMode('choose');
        }
    }
}

// Returns true if the enemy moves at all.
export function moveEnemy(state: GameState, enemy: Enemy, dx: number, dy: number, movementProperties: MovementProperties): boolean {
    const {mx, my} = moveEnemyProper(state, enemy, dx, dy, movementProperties);
    return mx !== 0 || my !== 0;
}

// Returns true only if the enemy moves the full amount.
export function moveEnemyFull(state: GameState, enemy: Enemy, dx: number, dy: number, movementProperties: MovementProperties): boolean {
    const {mx, my} = moveEnemyProper(state, enemy, dx, dy, movementProperties);
    return Math.abs(mx - dx) < 0.01 && Math.abs(my - dy) < 0.01;
}

export function moveEnemyProper(state: GameState, enemy: Enemy, dx: number, dy: number, movementProperties: MovementProperties): {mx: number, my: number} {
    if (!movementProperties.excludedObjects) {
        movementProperties.excludedObjects = new Set();
    }
    movementProperties.excludedObjects.add(state.hero);
    movementProperties.excludedObjects.add(state.hero.astralProjection);
    movementProperties.boundToSectionPadding = movementProperties.boundToSectionPadding ?? 16;
    movementProperties.boundToSection = movementProperties.boundToSection ?? true;
    for (const clone of enemy.area.objects.filter(object => object instanceof Clone)) {
        movementProperties.excludedObjects.add(clone);
    }
    if (enemy.flying) {
        const hitbox = enemy.getHitbox(state);
        const ax = enemy.x + dx;
        const ay = enemy.y + dy;
        if (movementProperties.boundToSection) {
            const p = movementProperties.boundToSectionPadding ?? 0;
            const { section } = getAreaSize(state);
            if (ax < section.x + p || ax + hitbox.w > section.x + section.w - p
                || ay < section.y + p || ay + hitbox.h > section.y + section.h - p
            ) {
                return {mx: 0, my: 0};
            }
        }
        enemy.x = ax;
        enemy.y = ay;
        return {mx: dx, my: dy};
    }
    return moveActor(state, enemy, dx, dy, movementProperties);
}

const fallGeometry: FrameDimensions = {w: 24, h: 24};
export const enemyFallAnimation: FrameAnimation = createAnimation('gfx/effects/enemyfall.png', fallGeometry, { cols: 10, duration: 4}, { loop: false });


export function checkForFloorEffects(state: GameState, enemy: Enemy) {
    const behaviorGrid = enemy.area.behaviorGrid;
    const tileSize = 16;

    const hitbox = enemy.getHitbox(state);
    let leftColumn = Math.floor((hitbox.x + 6) / tileSize);
    let rightColumn = Math.floor((hitbox.x + hitbox.w - 7) / tileSize);
    let topRow = Math.floor((hitbox.y + 6) / tileSize);
    let bottomRow = Math.floor((hitbox.y + hitbox.h - 7) / tileSize);

    for (let row = topRow; row <= bottomRow; row++) {
        for (let column = leftColumn; column <= rightColumn; column++) {
            const behaviors = behaviorGrid?.[row]?.[column];
            // This will happen when the player moves off the edge of the screen.
            if (!behaviors) {
                //startSwimming = false;
                continue;
            }
            /*if (behaviors.climbable) {
                startClimbing = true;
            }
            if (!behaviors.water) {
                startSwimming = false;
            }*/
            if (behaviors.pit && enemy.z <= 0
                && !enemy.flying
                // Bosses don't fall in pits.
                && enemy.definition?.type !== 'boss'
                // Specific enemies can be set to ignore pits.
                && !enemy.enemyDefinition.ignorePits
            ) {
                const pitAnimation = new AnimationEffect({
                    animation: enemyFallAnimation,
                    x: column * 16 - 4, y: row * 16 - 4,
                });
                addEffectToArea(state, enemy.area, pitAnimation);
                enemy.status = 'gone';
                return;
            }
        }
    }
}

export function hasEnemyLeftSection(state: GameState, enemy: Enemy): boolean {
    const { section } = getAreaSize(state);
    const hitbox = enemy.getHitbox(state);
    return (enemy.vx < 0 && hitbox.x + hitbox.w < section.x - 32)
        || (enemy.vx > 0 && hitbox.x > section.x + section.w + 32)
        || (enemy.vy < 0 && hitbox.y + hitbox.h < section.y - 32)
        || (enemy.vy > 0 && hitbox.y > section.y + section.h + 32);
}
