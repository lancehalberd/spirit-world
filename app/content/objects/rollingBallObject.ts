import { addParticleAnimations } from 'app/content/effects/animationEffect';
import { objectHash } from 'app/content/objects/objectHash';
import { lightStoneParticles } from 'app/content/tiles/constants';
import { FRAME_LENGTH } from 'app/gameConstants';
import { playAreaSound, stopSound } from 'app/musicController';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { directionMap, getTileBehaviorsAndObstacles, hitTargets, isPointOpen } from 'app/utils/field';
import { getObjectStatus, removeObjectFromArea, saveObjectStatus } from 'app/utils/objects';


const rollingAnimation = createAnimation('gfx/tiles/rollingboulder.png', {w: 16, h: 16}, {cols:4});
const rollingAnimationSpirit = createAnimation('gfx/tiles/rollingboulderspirit.png', {w: 16, h: 16}, {cols:4});

export class RollingBallObject implements ObjectInstance {
    area: AreaInstance;
    alwaysReset = true;
    behaviors = {
        solid: true,
        midHeight: true,
    };
    isNeutralTarget = true;
    drawPriority: 'sprites' = 'sprites';
    definition = null;
    x: number;
    y: number;
    z: number = 0;
    vz: number = 0;
    az: number = -0.2;
    isObject = <const>true;
    linkedObject: RollingBallObject;
    rollDirection: Direction;
    pushCounter: number = 0;
    pushedThisFrame: boolean = false;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    stuck: boolean = false;
    soundReference;
    constructor(state: GameState, definition: BaseObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = this.definition.status;
        if (getObjectStatus(state, this.definition)) {
            this.status = 'normal';
        }
    }
    changeStatus(state: GameState, status: ObjectStatus): void {
        if (status === 'normal') {
            saveObjectStatus(state, this.definition, true);
            if (this.status === 'hiddenEnemy' || this.status === 'hiddenSwitch') {
                this.z = 128;
                if (this.linkedObject) {
                    this.linkedObject.z = 128;
                }
            }
        }
        this.status = status;
        if (this.linkedObject) {
            this.linkedObject.status = status;
        }
    }
    cleanup() {
        this.stopRollingSound();
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onHit(state: GameState, {canPush, direction, isBonk, isStaff}: HitProperties): HitResult {
        // If the staff is allowed to hit rolling balls, it should shatter them instead of appear to
        // go through them.
        // Another option would be for it to bounce the staff back instead.
        if (isStaff && isBonk) {
            playAreaSound(state, this.area, 'rockShatter');
            addParticleAnimations(state, this.area, this.x + 8, this.y + 8, 0, lightStoneParticles);
            removeObjectFromArea(state, this);
            return {hit: true};
        }
        if (!this.rollDirection) {
            if (canPush) {
                this.rollInDirection(state, direction);
            }
            return { hit: true };
        }
        return {};
    }
    onPush(state: GameState, direction: Direction): void {
        if (!this.rollDirection) {
            this.pushCounter++;
            this.pushedThisFrame = true;
            if (this.pushCounter >= 20) {
                this.rollInDirection(state, direction);
            }
        }
    }
    rollInDirection(state: GameState, direction: Direction): void {
        if (this.stuck) {
            return;
        }
        const x = this.x + 8 + 16 * directionMap[direction][0];
        const y = this.y + 8 + 16 * directionMap[direction][1];
        const movementProperties = {canFall: true, canSwim: true, needsFullTile: true};
        if (isPointOpen(state, this.area, {x, y}, movementProperties)
            && (!this.linkedObject || isPointOpen(state, this.linkedObject.area, {x, y}, movementProperties))
        ) {
            this.rollDirection = direction;
            this.startRollingSound(state);
            if (this.linkedObject) {
                this.linkedObject.rollDirection = direction;
                this.linkedObject.startRollingSound(state);
            }
        }
    }
    startRollingSound(state) {
        this.soundReference = playAreaSound(state, this.area, 'rollingBall');
    }
    stopRollingSound() {
        if (this.soundReference) {
            stopSound(this.soundReference);
            this.soundReference = null;
        }
    }
    update(state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        if (this.z <= 0) {
            for (const object of this.area.objects) {
                if (object.definition?.type !== 'ballGoal' || object.status === 'active') {
                    continue;
                }
                if (Math.abs(this.x - object.x) <= 2 && Math.abs(this.y - object.y) <= 2) {
                    this.stopRollingSound();
                    playAreaSound(state, this.area, 'rollingBallSocket');
                    (object as BallGoal).activate(state);
                    // The activated BallGoal will render the ball in the depression, so we remove
                    // the original ball from the area.
                    removeObjectFromArea(state, this);
                    if (this.linkedObject) {
                        this.linkedObject.stopRollingSound();
                        const linkedGoal = (object as BallGoal).linkedObject;
                        if (linkedGoal) {
                            linkedGoal.activate(state);
                            removeObjectFromArea(state, this);
                        } else {
                            // If there is no alternate goal, the alternate ball is just stuck in place.
                            this.linkedObject.rollDirection = null;
                            this.linkedObject.stuck = true;
                        }
                    }
                    return;
                }
            }
        } else {
            this.vz = Math.max(-8, this.vz + this.az);
            this.z = Math.max(0, this.z + this.vz);
            if (this.z === 0 && this.vz <= -4) {
                state.screenShakes.push({
                    dx: 0,
                    dy: 2,
                    startTime: state.fieldTime,
                    endTime: state.fieldTime + 200,
                });
                playAreaSound(state, this.area, 'bossDeath');
            }
        }
        if (this.rollDirection) {
            this.animationTime += FRAME_LENGTH;
            const dx = 2 * directionMap[this.rollDirection][0];
            const dy = 2 * directionMap[this.rollDirection][1];
            const x = this.x + dx + (this.rollDirection === 'right' ? 15 : 1);
            const y = this.y + dy + (this.rollDirection === 'down' ? 15 : 1);
            // Rolling balls hurt actors and push on other objects.
            // Use a slightly larger hitbox so we trigger hitting objects before stopping.
            const bigHitbox = { x: this.x, y: this.y, w: 16, h: 16 };
            if (dx) {
                bigHitbox.x += dx;
            }
            if (dy) {
                bigHitbox.y += dy;
            }
            hitTargets(state, this.area, {
                canPush: true,
                damage: 2,
                direction: this.rollDirection,
                hitbox: bigHitbox,
                hitObjects: true,
                hitEnemies: true,
                knockAwayFrom: {x: this.x + 8, y: this.y + 8},
            });
            // Create a slightly smaller hitbox then adjust it so it only covers the front half
            // of the actual ball. This is to prevent the ball hitting things following behind it,
            // in particular a player with the spirit barrier on will overlap the back few pixels
            // of a ball when they push on it to make it roll.
            const smallHitbox = {
                x: this.x + 1,
                y: this.y + 1,
                w: 14,
                h: 14,
            };
            if (dx < 0) {
                smallHitbox.w = 7;
            } else if (dx > 0) {
                smallHitbox.x += 7;
                smallHitbox.w = 7;
            }
            if (dy < 0) {
                smallHitbox.h = 7;
            } else if (dy > 0) {
                smallHitbox.y += 7;
                smallHitbox.h = 7;
            }
            hitTargets(state, this.area, {
                canPush: true,
                damage: 2,
                direction: this.rollDirection,
                hitbox: smallHitbox,
                hitAllies: true,
                knockAwayFrom: {x: this.x + 8, y: this.y + 8},
            });
            // MC + clones do not obstruct rolling balls.
            const excludedObjects = new Set([this, state.hero, state.hero.astralProjection, ...state.hero.clones]);
            const { tileBehavior } = getTileBehaviorsAndObstacles(state, this.area, {x, y}, excludedObjects);
            if (!tileBehavior.solid && !tileBehavior.solidMap && !tileBehavior.outOfBounds) {
                this.x += dx;
                this.y += dy;
            } else {
                this.stopRollingSound();
                this.linkedObject?.stopRollingSound();
                playAreaSound(state, this.area, 'rollingBallHit');
                this.rollDirection = null;
            }
        }
        // Reset the pushCounter any time this object isn't being pushed.
        if (!this.pushedThisFrame) {
            this.pushCounter = 0;
        } else {
            this.pushedThisFrame = false;
        }
        if (this.linkedObject && this.linkedObject.rollDirection === null) {
            this.rollDirection = null;
            this.x = this.linkedObject.x;
            this.y = this.linkedObject.y;
        }
    }
    render(context, state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        context.save();
            if (this.z > 100) {
                context.globalAlpha *= Math.max(0, 1 - (this.z - 100) / 28);
            }
            const frame = getFrame(this.definition.spirit ? rollingAnimationSpirit : rollingAnimation, this.animationTime);
            drawFrame(context, frame, { ...frame, x: this.x, y: this.y - this.z });
        context.restore();
    }
}
objectHash.rollingBall = RollingBallObject;
