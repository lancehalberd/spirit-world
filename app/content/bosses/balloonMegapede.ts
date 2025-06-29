import {Enemy} from 'app/content/enemy';
import {enemyDefinitions} from 'app/content/enemies/enemyHash';
import {CrystalSpike} from 'app/content/effects/arrow';
import {
    centipedeHeadAnimations,
    centipedeBodyAnimations,
    centipedeWeakBodyAnimations,
    centipedeTailAnimations,
} from 'app/content/enemies/balloonCentipede';
import {editingState} from 'app/development/editingState';
import {drawFrameCenteredAt} from 'app/utils/animations';
import {getCardinalDirection} from 'app/utils/direction';
import {accelerateInDirection, moveEnemy} from 'app/utils/enemies';
import {getAreaSize} from 'app/utils/getAreaSize';
import {constrainAngle} from 'app/utils/index';
import {addObjectToArea} from 'app/utils/objects';
import {getNearbyTarget, getTargetingAnchor, getVectorToNearbyTarget} from 'app/utils/target';


type NearbyTargetType = ReturnType<typeof getVectorToNearbyTarget>;

const spikeProjectileAbility: EnemyAbility<NearbyTargetType> = {
    getTarget(this: void, state: GameState, enemy: Enemy): NearbyTargetType {
        return getVectorToNearbyTarget(state, enemy, enemy.aggroRadius, enemy.area.allyTargets);
    },
    useAbility(this: void, state: GameState, enemy: Enemy, target: NearbyTargetType): void {
        const {x, y} = getTargetingAnchor(enemy);
        const theta = Math.atan2(target.y, target.x);
        const dx = Math.cos(theta);
        const dy = Math.sin(theta);
        const hitbox = enemy.getHitbox();
        CrystalSpike.spawn(state, enemy.area, {
            ignoreWallsDuration: 200,
            x: x + hitbox.w / 4 * dx,
            y: y + hitbox.h / 4 * dy,
            damage: 2,
            vx: 4 * dx,
            vy: 4 * dy,
            source: enemy,
        });
    },
    cooldown: 4000,
    initialCharges: 0,
    charges: 1,
    prepTime: 0,
    recoverTime: 400,
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
    heading: number
}

enemyDefinitions.balloonMegapede = {
    naturalDifficultyRating: 60,
    abilities: [spikeProjectileAbility],
    scale: 3,
    // This is only used for aiming projectiles and should effectively be the entire battlefield.
    aggroRadius: 512,
    alwaysReset: true,
    floating: true,
    flipLeft: true,
    baseMovementProperties: {canFall: true, canSwim: true, canMoveInLava: true},
    animations: centipedeHeadAnimations,
    life: 8, touchDamage: 2,
    params: {length: 11, isHead: true, isControlled: true, isVulnerable: false, heading: 0},
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
        if (hit.element === 'ice') {
            hit.damage = 10 * enemy.maxLife;
        }
        return enemy.defaultOnHit(state, hit);
    },
    update(state: GameState, enemy: Enemy<BalloonMegapedeParams>): void {
        if (!enemy.params.isVulnerable) {
            enemy.healthBarTime = 80;
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
        if (!enemy.params.isHead && !enemy.params.parent && !enemy.params.isTail) {
            enemy.params.isControlled = true;
            enemy.params.isHead = true;
            // The head has double life.
            enemy.maxLife *= 2;
            enemy.life = enemy.maxLife;
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
    renderPreview(context: CanvasRenderingContext2D, enemy: Enemy, target: Rect = enemy.getHitbox()): void {
        drawFrameCenteredAt(context, centipedeBodyAnimations.idle.right.frames[0], {...target, x: target.x - 15});
        drawFrameCenteredAt(context, centipedeBodyAnimations.idle.right.frames[0], {...target, x: target.x - 5, y: target.y + 3});
        drawFrameCenteredAt(context, centipedeHeadAnimations.idle.right.frames[0], {...target, x: target.x + 5});
    },
    renderOver(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy<BalloonMegapedeParams>): void {
        if (editingState.showHitboxes) {
            if (enemy.params.isHead && enemy.params.targetPoint) {
                const {x, y} = enemy.params.targetPoint;
                context.fillStyle = 'blue';
                context.fillRect(x - 2, y + 2, 4, 4);
            }
        }
    }
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

const sectionPadding = 80;
function updateHead(state: GameState, enemy: Enemy<BalloonMegapedeParams>): void {
    enemy.isBoss = true;
    enemy.animations = centipedeHeadAnimations;
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
    // The centipede speed ranges from 2 to 1.5 based on how long the body is.
    enemy.speed = Math.min(3, Math.max(2, 3.1 - tailLength * 0.1));


    if (!enemy.params.targetPoint || enemy.modeTime > 8000) {
        const { section } = getAreaSize(state);
        const target = getNearbyTarget(state, enemy, 1000, enemy.area.allyTargets);
        if (target) {
            const {x, y} = getTargetingAnchor(target);
            enemy.params.targetPoint = {
                x: Math.max(section.x + sectionPadding, Math.min(section.x + section.w - sectionPadding, x - 80 + Math.random() * 160)),
                y: Math.max(section.y + sectionPadding, Math.min(section.y + section.h - sectionPadding, y - 80 + Math.random() * 160)),
            }
        } else {
            enemy.params.targetPoint = {
                x: section.x + sectionPadding + Math.random() * (section.w - 2 * sectionPadding),
                y: section.y + sectionPadding + Math.random() * (section.h - 2 * sectionPadding),
            }
        }
        enemy.modeTime = 0;
    }

    let {x, y} = enemy.params.targetPoint;
    const dx = x - enemy.x, dy = y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    enemy.acceleration = enemy.speed / 10; // + distance / 100);

    // This code roughly tries to move the head towards the tangent of a circle around the current target point.
    let theta = Math.atan2(dy, dx);
    const minRadius = 96, maxRadius = 160;
    /*if (distance < 32) {
        theta += Math.PI / 2;
    } else if (distance < 64) {
        theta += (Math.PI / 2) * Math.min(1, 1 - (distance - 32) / 32);
    }*/
    if (distance < maxRadius) {
        theta += (Math.PI / 2) * (1 - (distance - minRadius) / (maxRadius - minRadius));
    }
    //x = x + 96 * Math.cos(theta);
    //y = y + 96 * Math.sin(theta);
    //theta = Math.atan2(y - enemy.y, x - enemy.x);
    accelerateInDirection(state, enemy, {x: Math.cos(theta), y: Math.sin(theta)}, Math.PI / 6);
    // The enemy's heading is based on its velocity so long as it is moving.
    if (enemy.vx || enemy.vy) {
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        enemy.params.heading = Math.atan2(enemy.vy, enemy.vx);
    }
    enemy.d = getCardinalDirection(enemy.vx, enemy.vy, enemy.d);
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
        enemy.animations = centipedeBodyAnimations;
        enemy.changeToAnimation('move');
    } else {
        enemy.animations = centipedeWeakBodyAnimations;
        enemy.changeToAnimation('move');
        enemy.isBoss = false;
        delete enemy.definition.id;
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
    enemy.isBoss = false;
    delete enemy.definition.id;
    enemy.animations = centipedeTailAnimations;
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
    if (enemy.params.locations.length > 10) {
        /*const {x, y, z, d} = enemy.params.locations.shift();
        enemy.d = d;
        enemy.x = x;
        enemy.y = y;*/
        enemy.z = enemy.params.locations.shift().z;
        enemy.changeToAnimation('move');
    }
    constrainPartToParent(parent, enemy);
    enemy.d = getCardinalDirection(Math.cos(enemy.params.heading), Math.sin(enemy.params.heading), enemy.d);
    enemy.changeToAnimation('move');
}

const radiusRange = [0, 28];
const maxTheta = Math.PI / 6;
function constrainPartToParent(parent: Enemy<BalloonMegapedeParams>, child: Enemy<BalloonMegapedeParams>) {
    const dx = parent.x - child.x, dy = parent.y - child.y;
    let r = Math.max(radiusRange[0], Math.min(radiusRange[1], Math.sqrt(dx * dx + dy * dy)));
    const theta = constrainAngle(Math.atan2(dy, dx), parent.params.heading, maxTheta);
    child.x = parent.x - r * Math.cos(theta);
    child.y = parent.y - r * Math.sin(theta);
    child.params.heading = theta;
}
