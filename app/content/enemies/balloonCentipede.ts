import { Enemy } from 'app/content/enemy';
import { enemyDefinitions } from 'app/content/enemies/enemyHash';
import { CrystalSpike } from 'app/content/effects/arrow';

import { beetleAnimations, beetleHornedAnimations } from 'app/content/enemyAnimations';
import { drawFrameCenteredAt } from 'app/utils/animations';
import { accelerateInDirection, moveEnemy, moveEnemyFull } from 'app/utils/enemies';
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
        });
    },
    cooldown: 4000,
    initialCharges: 0,
    charges: 1,
    prepTime: 200,
    recoverTime: 200,
};

interface BalloonCentipedeParams {
    length?: number
    isHead?: boolean
    isControlled?: boolean
    parent?: Enemy<BalloonCentipedeParams>
    tail?: Enemy<BalloonCentipedeParams>
    locations?: {x: number, y: number, z: number, d: CardinalDirection}[]
    targetTheta?: number
}

enemyDefinitions.balloonCentipede = {
    abilities: [spikeProjectileAbility],
    aggroRadius: 80,
    alwaysReset: true,
    floating: true,
    animations: beetleHornedAnimations, speed: 1, acceleration: 0.05,
    baseMovementProperties: {canMoveInLava: true, canFall: true, canSwim: true},
    life: 1, touchDamage: 1,
    params: {length: 5, isHead: true, isControlled: true},
    onDeath(state: GameState, enemy: Enemy) {
        if (enemy.params.isHead || enemy.frozenAtDeath) {
            return;
        }
        for (let i = 0; i < 8; i++) {
            const theta = 2 * Math.PI * i / 8;
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
            });
        }
    },
    update(state: GameState, enemy: Enemy<BalloonCentipedeParams>): void {
        if (enemy.params.isHead || !enemy.params.parent?.params.isControlled) {
            enemy.z = Math.max(Math.min(enemy.z + 1, 6), enemy.z + enemy.vz);
            // Oscillate towards z = 8
            enemy.az = enemy.speed * (8 - enemy.z) / 50;
            enemy.vz = enemy.vz + enemy.az;
        }

        // Put this after the z code so that nothing spawns at z = 0 and falls into pits.
        if (enemy.params.length > 1) {
            const tail = new Enemy(state, {
                id: '',
                status: 'normal',
                type: 'enemy',
                enemyType: 'balloonCentipede',
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

        const parent = enemy.params.parent;
        if (enemy.params.isHead) {
            if (enemy.params.tail?.isDefeated) {
                delete enemy.params.tail;
            }
            let tailLength = 0, tail = enemy.params.tail;
            while (tail) {
                tailLength++;
                tail = tail.params.tail;
            }
            // The centipede speed ranges from 2 to 0.5 based on how long the body is.
            enemy.speed = Math.min(2, Math.max(0.5, 2 - tailLength * 0.2));
            enemy.acceleration = enemy.speed / 10;

            // Move at a random angle by default.
            enemy.params.targetTheta = Math.atan2(enemy.vy, enemy.vx);
            enemy.params.targetTheta += Math.PI / 4 * Math.cos(enemy.modeTime / 2000);
            let theta = enemy.params.targetTheta;
            // Move towards a nearby target if one is found.
            const target = getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
            if (target) {
                theta = Math.atan2(target.y, target.x);
            }
            accelerateInDirection(state, enemy, {x: Math.cos(theta), y: Math.sin(theta)});
            if (!moveEnemyFull(state, enemy, enemy.vx, 0, {canFall: true})) {
                enemy.vx = -enemy.vx;
            }
            if (!moveEnemyFull(state, enemy, 0, enemy.vy, {canFall: true})) {
                enemy.vy = -enemy.vy;
            }
            enemy.changeToAnimation('move');
            // This is a bit of the hack to override the defined cooldown for the projectile ability.
            // Once the ability is in use, we update the remaining cooldown based on how long the tail is.
            if (enemy.activeAbility) {
                const spikeAbility = enemy.getAbility(spikeProjectileAbility);
                spikeAbility.cooldown = tailLength * 1000;
            }
            enemy.useRandomAbility(state);
        } else if (parent) {
            enemy.animations = beetleAnimations;
            enemy.changeToAnimation('move');
            if (parent?.area === enemy.area && !parent?.isDefeated && parent.params.isControlled) {
                // The tail will record the location of the parent for X frames and then
                // replay the exact same movement.
                enemy.params.locations = enemy.params.locations || [];
                enemy.params.locations.push({x: parent.x, y: parent.y, z: parent.z, d: parent.d});
                if (enemy.params.locations.length > 8) {
                    const {x, y, z, d} = enemy.params.locations.shift();
                    enemy.d = d;
                    enemy.x = x;
                    enemy.y = y;
                    enemy.z = z;
                    enemy.changeToAnimation('move');
                }
            } else {
                // When the parent is removed scatter in a random direction.
                delete enemy.params.parent;
                enemy.vx = 2 * Math.random() - 1;
                enemy.vy = 2 * Math.random() - 1;
                enemy.vz = 2 * Math.random() - 1;
                // This will cause any additional tail pieces to break off.
                enemy.params.isControlled = false;
                enemy.animationTime = 20 * ((Math.random() * 100) | 0);
            }
        } else {
            // Slowly drift to a stop if this is a body part without a parent.
            moveEnemy(state, enemy, enemy.vx, enemy.vy);
            enemy.vx *= 0.98;
            enemy.vy *= 0.98;
            // Detonate automatically after a bit.
            if (enemy.animationTime >= 4000) {
                enemy.showDeathAnimation(state);
            }
        }
    },
    renderPreview(context: CanvasRenderingContext2D, enemy: Enemy, target: Rect): void {
        drawFrameCenteredAt(context, beetleAnimations.idle.left.frames[0], {...target, x: target.x + 15});
        drawFrameCenteredAt(context, beetleAnimations.idle.left.frames[0], {...target, x: target.x + 5, y: target.y + 3});
        drawFrameCenteredAt(context, beetleHornedAnimations.idle.left.frames[0], {...target, x: target.x - 5});
    },
};
