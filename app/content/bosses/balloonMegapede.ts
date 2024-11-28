import { Enemy } from 'app/content/enemy';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { CrystalSpike } from 'app/content/effects/arrow';

import { beetleAnimations, beetleHornedAnimations, beetleMiniAnimations, beetleWingedAnimations } from 'app/content/enemyAnimations';
import { drawFrameCenteredAt } from 'app/utils/animations';
import { accelerateInDirection, moveEnemy } from 'app/utils/enemies';
import { getAreaSize } from 'app/utils/getAreaSize';
import { addObjectToArea } from 'app/utils/objects';
import { getVectorToNearbyTarget } from 'app/utils/target';



type NearbyTargetType = ReturnType<typeof getVectorToNearbyTarget>;

const spikeProjectileAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        const theta = Math.atan2(target.y, target.x);
        const dx = Math.cos(theta);
        const dy = Math.sin(theta);
        const hitbox = enemy.getHitbox();
        CrystalSpike.spawn(state, enemy.area, {
            ignoreWallsDuration: 200,
            x: hitbox.x + hitbox.w / 2 + hitbox.w / 4 * dx,
            y: hitbox.y + hitbox.h / 2 + hitbox.h / 4 * dy,
            damage: 2,
            vx: 4 * dx,
            vy: 4 * dy,
            source: enemy,
        });
    },
    cooldown: 4000,
    initialCharges: 0,
    charges: 1,
    prepTime: 200,
    recoverTime: 200,
};

interface BalloonMegapedeParams {
    length?: number
    isHead?: boolean
    isTail?: boolean
    isControlled?: boolean
    isVulnerable?: boolean
    parent?: Enemy<BalloonMegapedeParams>
    tail?: Enemy<BalloonMegapedeParams>
    locations?: {x: number, y: number, z: number, d: CardinalDirection}[]
    targetPoint?: {x: number, y: number}
}

enemyDefinitions.balloonMegapede = {
    naturalDifficultyRating: 60,
    abilities: [spikeProjectileAbility],
    scale: 2,
    // This is only used for aiming projectiles and should effectively be the entire battlefield.
    aggroRadius: 512,
    alwaysReset: true,
    floating: true,
    baseMovementProperties: {canFall: true, canSwim: true, canMoveInLava: true},
    animations: beetleHornedAnimations, speed: 1, acceleration: 0.05,
    life: 8, touchDamage: 2,
    params: {length: 11, isHead: true, isControlled: true, isVulnerable: false},
    onDeath(state: GameState, enemy: Enemy) {
        if (enemy.params.isHead) {
            return;
        }
        let count = enemy.params.isTail ? 20 : 8;
        for (let i = 0; i < count; i++) {
            const theta = 2 * Math.PI * i / count;
            const dx = Math.cos(theta);
            const dy = Math.sin(theta);
            const hitbox = enemy.getHitbox();
            CrystalSpike.spawn(state, enemy.area, {
                ignoreWallsDuration: 200,
                x: hitbox.x + hitbox.w / 2 + hitbox.w / 4 * dx,
                y: hitbox.y + hitbox.h / 2 + hitbox.h / 4 * dy,
                damage: 2,
                vx: 2 * dx,
                vy: 2 * dy,
                source: enemy,
            });
        }
    },
    onHit(state: GameState, enemy: Enemy, hit: HitProperties): HitResult {
        if (!enemy.params.isVulnerable) {
            return {blocked: true, stopped: true};
        }
        return enemy.defaultOnHit(state, hit);
    },
    update(state: GameState, enemy: Enemy<BalloonMegapedeParams>): void {
        if (!enemy.params.isVulnerable) {
            enemy.healthBarTime = 0;
        }
        if (enemy.params.length > 1) {
            const definition = enemy.definition as BossObjectDefinition;
            const tail = new Enemy(state, {
                id: definition.id,
                status: 'normal',
                type: 'boss',
                enemyType: 'balloonMegapede',
                lootType: definition.lootType,
                lootLevel: definition.lootLevel,
                lootAmount: definition.lootAmount,
                x: enemy.x,
                y: enemy.y,
            });
            tail.z = enemy.z;
            tail.params = {
                length: enemy.params.length - 1,
                parent: enemy,
                isControlled: true,
            };
            addObjectToArea(state, enemy.area, tail);
            enemy.params.length = 0;
            enemy.params.tail = tail;
        }
        if (enemy.params.parent?.isDefeated) {
            delete enemy.params.parent;
        }
        if (enemy.params.tail?.isDefeated) {
            delete enemy.params.tail;
        }

        // A body part without a parent becomes a head.
        if (!enemy.params.parent && !enemy.params.isTail) {
            enemy.params.isControlled = true;
            enemy.params.isHead = true;
        }

        if (enemy.params.isHead) {
            return updateHead(state, enemy);
        }
        // A body part without a tail becomes a tail.
        if (!enemy.params.tail) {
            enemy.params.isTail = true;
            return updateTail(state, enemy);
        }
        updateBody(state, enemy);
    },
    renderPreview(context: CanvasRenderingContext2D, enemy: Enemy, target: Rect): void {
        drawFrameCenteredAt(context, beetleAnimations.idle.left.frames[0], {...target, x: target.x + 15});
        drawFrameCenteredAt(context, beetleAnimations.idle.left.frames[0], {...target, x: target.x + 5, y: target.y + 3});
        drawFrameCenteredAt(context, beetleHornedAnimations.idle.left.frames[0], {...target, x: target.x - 5});
    },
};

function getTailLength(enemy: Enemy<BalloonMegapedeParams>): number {
    let tailLength = 0, tail = enemy.params.tail;
    while (tail) {
        tailLength++;
        tail = tail.params.tail;
    }
    return tailLength;
}

function getHeadLength(enemy: Enemy<BalloonMegapedeParams>): number {
    let headLength = 0, parent = enemy.params.parent;
    while (parent) {
        headLength++;
        parent = parent.params.parent;
    }
    return headLength;
}


function updateHead(state: GameState, enemy: Enemy<BalloonMegapedeParams>): void {
    enemy.animations = beetleHornedAnimations;
    enemy.changeToAnimation('move');
    enemy.z = Math.max(Math.min(enemy.z + 1, 8), enemy.z + enemy.vz);
    // Oscillate towards z = 12
    enemy.az = enemy.speed * (12 - enemy.z) / 50;
    enemy.vz = enemy.vz + enemy.az;
    const tailLength = getTailLength(enemy);
    if (!enemy.params.isVulnerable && enemy.modeTime >= 500 && tailLength <= 1) {
        enemy.params.isVulnerable = true;
        enemy.enemyInvulnerableFrames = 10;
    }
    // The centipede speed ranges from 2 to 0.5 based on how long the body is.
    enemy.speed = Math.min(2, Math.max(1, 2.5 - tailLength * 0.1));
    enemy.acceleration = enemy.speed / 10;

    if (!enemy.params.targetPoint || enemy.modeTime > 8000) {
        const { section } = getAreaSize(state);
        enemy.params.targetPoint = {
            x: section.x + 64 + Math.random() * (section.w - 128),
            y: section.y + 64 + Math.random() * (section.h - 128),
        }
    }

    let {x, y} = enemy.params.targetPoint;

    // This code roughly tries to move the head towards the tangent of a circle around the current target point.
    let theta = Math.atan2(y - enemy.y, x - enemy.x);
    theta += Math.PI / 3;
    //x = x + 96 * Math.cos(theta);
    //y = y + 96 * Math.sin(theta);
    //theta = Math.atan2(y - enemy.y, x - enemy.x);
    accelerateInDirection(state, enemy, {x: Math.cos(theta), y: Math.sin(theta)});
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;
    enemy.changeToAnimation('move');
    // This is a bit of the hack to override the defined cooldown for the projectile ability.
    // Once the ability is in use, we update the remaining cooldown based on how long the tail is.
    if (enemy.activeAbility) {
        const spikeAbility = enemy.getAbility(spikeProjectileAbility);
        spikeAbility.cooldown = tailLength * 500;
    }
    enemy.useRandomAbility(state);
}

function updateBody(state: GameState, enemy: Enemy<BalloonMegapedeParams>) {
    if (!enemy.params.isVulnerable) {
        enemy.animations = beetleAnimations;
        enemy.changeToAnimation('move');
    } else {
        enemy.animations = beetleMiniAnimations;
        enemy.changeToAnimation('move');
    }
    const parent = enemy.params.parent;
    if (parent) {
        if (!enemy.params.isVulnerable && enemy.modeTime >= 500) {
            const tailLength = getTailLength(enemy);
            const headLength = getHeadLength(enemy);
            if (tailLength === headLength || tailLength === headLength + 1) {
                enemy.params.isVulnerable = true;
                enemy.enemyInvulnerableFrames = 10;
            }
        }
        followParent(state, enemy);
    } else {
        // The boss is designed so that this code should never run.
        // Slowly drift to a stop if this is a body part without a parent.
        moveEnemy(state, enemy, enemy.vx, enemy.vy);
        enemy.vx *= 0.98;
        enemy.vy *= 0.98;
        // Detonate automatically after a bit.
        if (enemy.modeTime >= 2000) {
            enemy.showDeathAnimation(state);
        }
    }
}

function updateTail(state: GameState, enemy: Enemy<BalloonMegapedeParams>) {
    enemy.animations = beetleWingedAnimations;
    enemy.changeToAnimation('move');
    const parent = enemy.params.parent;
    if (parent) {
        followParent(state, enemy);
        enemy.modeTime = 0;
    } else {
        // Slowly drift to a stop if this is a body part without a parent.
        moveEnemy(state, enemy, enemy.vx, enemy.vy);
        enemy.vx *= 0.98;
        enemy.vy *= 0.98;
        // Detonate automatically after a bit.
        if (enemy.modeTime >= 2000) {
            enemy.showDeathAnimation(state);
        }
    }
}

function followParent(state: GameState, enemy: Enemy<BalloonMegapedeParams>): void {
    const parent = enemy.params.parent;
    // The tail will record the location of the parent for X frames and then
    // replay the exact same movement.
    enemy.params.locations = enemy.params.locations || [];
    enemy.params.locations.push({x: parent.x, y: parent.y, z: parent.z, d: parent.d});
    if (enemy.params.locations.length > 20) {
        const {x, y, z, d} = enemy.params.locations.shift();
        enemy.d = d;
        enemy.x = x;
        enemy.y = y;
        enemy.z = z;
        enemy.changeToAnimation('move');
    }
}
