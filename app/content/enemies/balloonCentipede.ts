import {Enemy} from 'app/content/enemy';
import {enemyDefinitions} from 'app/content/enemies/enemyHash';
import {crystalNovaAbility, crystalProjectileAbility} from 'app/content/enemyAbilities/crystalProjectile';
import {FRAME_LENGTH} from 'app/gameConstants';
import {createAnimation, drawFrameCenteredAt} from 'app/utils/animations';
import {getCardinalDirection} from 'app/utils/direction';
import {accelerateInDirection, moveEnemy, moveEnemyFull} from 'app/utils/enemies';
import {addObjectToArea} from 'app/utils/objects';
import {getVectorToNearbyTarget} from 'app/utils/target';


const image = 'gfx/enemies/baloonCentipede.png';
const centipedeGeometry: FrameDimensions = { w: 22, h: 22, content: { x: 4, y: 2, w: 14, h: 13} };
const frameMap = [0,1,2,1];
const centipedeHeadDownAnimation: FrameAnimation = createAnimation(image, centipedeGeometry, { y: 0, cols: 3, frameMap});
const centipedeHeadRightAnimation: FrameAnimation = createAnimation(image, centipedeGeometry, { y: 1, cols: 3, frameMap});
const centipedeHeadUpAnimation: FrameAnimation = createAnimation(image, centipedeGeometry, { y: 2, cols: 3, frameMap});

const centipedeBodyDownAnimation: FrameAnimation = createAnimation(image, centipedeGeometry, { y: 3});
const centipedeBodyRightAnimation: FrameAnimation = createAnimation(image, centipedeGeometry, { y: 4});
const centipedeBodyUpAnimation: FrameAnimation = createAnimation(image, centipedeGeometry, { y: 5});


export const centipedeHeadAnimations: ActorAnimations = {
    idle: {
        up: centipedeHeadUpAnimation,
        down: centipedeHeadDownAnimation,
        right: centipedeHeadRightAnimation,
        left: centipedeHeadRightAnimation,
    },
};

export const centipedeBodyAnimations: ActorAnimations = {
    idle: {
        up: centipedeBodyUpAnimation,
        down: centipedeBodyDownAnimation,
        right: centipedeBodyRightAnimation,
        left: centipedeBodyRightAnimation,
    },
};


interface BalloonCentipedeParams {
    length?: number
    isHead?: boolean
    isControlled?: boolean
    parent?: Enemy<BalloonCentipedeParams>
    tail?: Enemy<BalloonCentipedeParams>
    locations?: {x: number, y: number, z: number, d: CardinalDirection}[]
    targetTheta?: number
    heading: number
    ttl?: number
}

const TWOPI = 2 * Math.PI;
function constrainAngle(angle: number, targetAngle: number, angleRadius: number) {
    const d1 = (2 * TWOPI + targetAngle - angle) % TWOPI;
    const d2 = TWOPI - d1;
    if (d1 < maxTheta || d2 < maxTheta) {
        return angle;
    }
    if (d1 < d2) {
        return (targetAngle - angleRadius) % TWOPI;
    }
    return (targetAngle + angleRadius) % TWOPI;
}
window.constrainAngle = constrainAngle;

const radiusRange = [0, 8];
const maxTheta = Math.PI / 2;
function constrainPartToParent(parent: Enemy<BalloonCentipedeParams>, child: Enemy<BalloonCentipedeParams>) {
    const dx = parent.x - child.x, dy = parent.y - child.y;
    let r = Math.max(radiusRange[0], Math.min(radiusRange[1], Math.sqrt(dx * dx + dy * dy)));
    const theta = constrainAngle(Math.atan2(dy, dx), parent.params.heading, maxTheta);
    child.x = parent.x - r * Math.cos(theta);
    child.y = parent.y - r * Math.sin(theta);
    child.params.heading = theta;
}

enemyDefinitions.balloonCentipede = {
    naturalDifficultyRating: 4,
    abilities: [crystalProjectileAbility],
    aggroRadius: 80,
    alwaysReset: true,
    floating: true,
    flipLeft: true,
    animations: centipedeHeadAnimations, speed: 1, acceleration: 0.05,
    baseMovementProperties: {canMoveInLava: true, canFall: true, canSwim: true},
    life: 4, touchDamage: 1,
    params: {length: 5, isHead: true, isControlled: true, heading: 0},
    onDeath(state: GameState, enemy: Enemy) {
        if (enemy.params.isHead || enemy.frozenAtDeath) {
            return;
        }
        crystalNovaAbility.useAbility(state, enemy, true);
    },
    update(state: GameState, enemy: Enemy<BalloonCentipedeParams>): void {
        if (!enemy.params.isHead) {
            enemy.life = 1;
        }
        if (enemy.params.isHead) {
            enemy.z = Math.max(Math.min(enemy.z + 1, 6), enemy.z + enemy.vz);
            // Oscillate towards z = 8
            enemy.az = enemy.speed * (8 - enemy.z) / 50;
            enemy.vz = enemy.vz + enemy.az;
        } else if (!enemy.params.parent?.params.isControlled) {
            // Gradually reduce the max z value to 5.
            enemy.z = Math.min(enemy.z + enemy.vz, Math.max(enemy.z - 1, 4));
            enemy.z = Math.max(enemy.z, 2);
            // Oscillate towards z = 4
            enemy.az = enemy.speed * (3 - enemy.z) / 100;
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
            constrainPartToParent(enemy, tail);
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
            // The enemy's heading is based on its velocity so long as it is moving.
            if (enemy.vx || enemy.vy) {
                enemy.params.heading = Math.atan2(enemy.vy, enemy.vx);
            }
            if (!moveEnemyFull(state, enemy, enemy.vx, 0, {canFall: true})) {
                enemy.vx = -enemy.vx;
            }
            if (!moveEnemyFull(state, enemy, 0, enemy.vy, {canFall: true})) {
                enemy.vy = -enemy.vy;
            }
            enemy.d = getCardinalDirection(enemy.vx, enemy.vy, enemy.d);
            enemy.changeToAnimation('move');
            // This is a bit of the hack to override the defined cooldown for the projectile ability.
            // Once the ability is in use, we update the remaining cooldown based on how long the tail is.
            if (enemy.activeAbility) {
                const spikeAbility = enemy.getAbility(crystalProjectileAbility);
                spikeAbility.cooldown = tailLength * 1000;
            }
            enemy.useRandomAbility(state);
        } else if (parent) {
            enemy.animations = centipedeBodyAnimations;
            enemy.changeToAnimation('move');
            if (parent?.area === enemy.area && !parent?.isDefeated && parent.params.isControlled && parent.life > 0) {
                // The tail will record the location of the parent for X frames and then
                // replay the exact same movement.
                enemy.params.locations = enemy.params.locations || [];
                enemy.params.locations.push({x: parent.x, y: parent.y, z: parent.z, d: parent.d});
                if (enemy.params.locations.length > 8) {
                    const {z, /*x, y, z, d*/} = enemy.params.locations.shift();
                    //enemy.d = d;
                    //enemy.x = x;
                    //enemy.y = y;
                    enemy.z = z;
                }
                constrainPartToParent(parent, enemy);
                enemy.d = getCardinalDirection(Math.cos(enemy.params.heading), Math.sin(enemy.params.heading), enemy.d);
                enemy.changeToAnimation('move');
            } else {
                // When the parent is removed scatter in a random direction.
                delete enemy.params.parent;
                enemy.vx = 2 * Math.random() - 1;
                enemy.vy = 2 * Math.random() - 1;
                enemy.vz = 2 * Math.random() - 1;
                enemy.enemyInvulnerableFrames = 25;
                enemy.invulnerableFrames = 25;
                // This will cause any additional tail pieces to break off.
                enemy.params.isControlled = false;
                enemy.params.ttl = (parent.params?.ttl ?? 1000) + 200 + 20 * ((Math.random() * 10) | 0);
            }
        } else {
            enemy.params.ttl = (enemy.params.ttl ?? 500) - FRAME_LENGTH;
            // Slowly drift to a stop if this is a body part without a parent.
            moveEnemy(state, enemy, enemy.vx, enemy.vy);
            enemy.vx *= 0.98;
            enemy.vy *= 0.98;
            // Detonate automatically after a bit.
            if (enemy.params.ttl <= 0) {
                enemy.showDeathAnimation(state);
            }
        }
    },
    renderPreview(context: CanvasRenderingContext2D, enemy: Enemy, target: Rect = enemy.getHitbox()): void {
        drawFrameCenteredAt(context, centipedeBodyAnimations.idle.right.frames[0], {...target, x: target.x - 15});
        drawFrameCenteredAt(context, centipedeBodyAnimations.idle.right.frames[0], {...target, x: target.x - 5, y: target.y + 3});
        drawFrameCenteredAt(context, centipedeHeadAnimations.idle.right.frames[0], {...target, x: target.x + 5});
    },
};
