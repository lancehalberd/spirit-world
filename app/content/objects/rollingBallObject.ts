import { addParticleAnimations } from 'app/content/effects/animationEffect';
import { objectHash } from 'app/content/objects/objectHash';
import { lightStoneParticles } from 'app/content/tiles/constants';
import { FRAME_LENGTH } from 'app/gameConstants';
import { moveObject } from 'app/movement/moveObject';
import { playAreaSound, stopSound } from 'app/musicController';
import { createAnimation, drawFrame, drawFrameAt, getFrame } from 'app/utils/animations';
import { directionMap, hitTargets } from 'app/utils/field';
import { getObjectStatus, removeObjectFromArea, saveObjectStatus } from 'app/utils/objects';


const rollingAnimation = createAnimation('gfx/tiles/rollingboulder.png', {w: 16, h: 16}, {cols:4});
const rollingAnimationSpirit = createAnimation('gfx/tiles/rollingboulderspirit.png', {w: 16, h: 16}, {cols:4});
const smallShadowFrame: Frame = createAnimation('gfx/smallshadow.png', { w: 16, h: 16 }).frames[0];

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
    groundHeight = 0;
    constructor(state: GameState, definition: BaseObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = this.definition.status;
        if (getObjectStatus(state, this.definition)) {
            if (this.definition.status !== 'normal') {
                this.z = 128;
                if (this.linkedObject) {
                    this.linkedObject.z = 128;
                }
            }
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
    getHitbox(): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onHit(state: GameState, {canPush, direction, isBonk, isStaff}: HitProperties): HitResult {
        if (this.z > this.groundHeight) {
            return {};
        }
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
            return { blocked: true, hit: true };
        }
        return { blocked: true, hit: true };
    }
    onPush(state: GameState, direction: Direction): void {
        if (this.z > this.groundHeight) {
            return;
        }
        if (!this.rollDirection) {
            this.pushCounter++;
            this.pushedThisFrame = true;
            if (this.pushCounter >= 10) {
                this.rollInDirection(state, direction);
            }
        }
    }
    rollInDirection(state: GameState, direction: Direction): void {
        if (this.stuck || this.rollDirection) {
            return;
        }
        if (this.move(state, direction)) {
            this.rollDirection = direction;
            this.startRollingSound(state);
            if (this.linkedObject) {
                this.linkedObject.startRollingSound(state);
            }
        }
    }
    // Returns true if the hit stops this object.
    hitAhead(state: GameState, direction: Direction): boolean {
        const [dx, dy] = directionMap[direction];
        const bigHitbox = { x: this.x + dx, y: this.y + dy, w: 16, h: 16 };
        const hitResult = hitTargets(state, this.area, {
            canPush: true,
            damage: 2,
            direction,
            hitbox: bigHitbox,
            hitObjects: true,
            hitEnemies: true,
            knockAwayFrom: {x: this.x + 8, y: this.y + 8},
            ignoreTargets: new Set([this]),
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
            direction,
            hitbox: smallHitbox,
            hitAllies: true,
            knockAwayFrom: {x: this.x + 8, y: this.y + 8},
        });

        return hitResult.blocked;
    }
    move(state: GameState, direction: Direction): boolean {
        //console.log('move', direction, this.x, this.y);
        const [dx, dy] = directionMap[direction];
        const {mx, my} = moveObject(state, this, 2 * dx, 2 * dy, {
            canFall: true,
            canWiggle: true,
            canSwim: true,
            excludedObjects: new Set([this, state.hero]),
        });
        if (!mx && !my) {
            //console.log('base object did not move');
            return false;
        }
        if (this.linkedObject) {
            const linkedResult = moveObject(state, this.linkedObject, mx, my, {
                canFall: true,
                canWiggle: false,
                canSwim: true,
                excludedObjects: new Set([this.linkedObject]),
            });
            this.x = this.linkedObject.x;
            this.y = this.linkedObject.y;
            if (!linkedResult.mx && !linkedResult.my) {
                //console.log('linked object did not move');
                return false;
            }
        }
        this.animationTime += FRAME_LENGTH;
        let stopped = this.hitAhead(state, direction);
        if (this.linkedObject) {
            stopped = this.linkedObject.hitAhead(state, direction) || stopped;
        }
        //console.log('was stopped by hit?', stopped);
        return !stopped;
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
        // Unlink this ball if the linked ball is destroyed.
        if (this.linkedObject && !this.linkedObject.area) {
            delete this.linkedObject;
        }
        if (this.status !== 'normal') {
            return;
        }
        if (this.rollDirection) {
            if (!this.move(state, this.rollDirection)) {
                this.stopRollingSound();
                this.linkedObject?.stopRollingSound();
                playAreaSound(state, this.area, 'rollingBallHit');
                this.rollDirection = null;
            }
        }
        if (this.z <= 0) {
            for (const object of this.area.objects) {
                if (object.definition?.type !== 'ballGoal' || object.status === 'active') {
                    continue;
                }
                if (Math.abs(this.x - object.x) <= 4 && Math.abs(this.y - object.y) <= 4) {
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
                            removeObjectFromArea(state, this.linkedObject);
                        } else {
                            // If there is no alternate goal, the alternate ball is just stuck in place.
                            // This looks bad so we should avoid it.
                            this.linkedObject.rollDirection = null;
                            this.linkedObject.stuck = true;
                        }
                    }
                    return;
                }
            }
        } else if (this.z > this.groundHeight) {
            this.vz = Math.max(-8, this.vz + this.az);
            this.z = Math.max(this.groundHeight, this.z + this.vz);
            if (this.z === this.groundHeight && this.vz <= -4) {
                this.vz = 0;
                state.screenShakes.push({
                    dx: 0,
                    dy: 2,
                    startTime: state.fieldTime,
                    endTime: state.fieldTime + 200,
                });
                playAreaSound(state, this.area, 'bossDeath');
                hitTargets(state, this.area, {
                    damage: 2,
                    direction: this.rollDirection,
                    hitbox: this.getHitbox(),
                    hitAllies: true,
                    hitObjects: true,
                    hitEnemies: true,
                    hitTiles: true,
                    // Falling balls can destroy even some unliftable tiles.
                    crushingPower: 3,
                    knockAwayFrom: {x: this.x + 8, y: this.y + 8},
                });
            }
        }
        // Reset the pushCounter any time this object isn't being pushed.
        if (!this.pushedThisFrame) {
            this.pushCounter = 0;
        } else {
            this.pushedThisFrame = false;
        }
    }
    render(context, state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        const frame = getFrame(this.definition.spirit ? rollingAnimationSpirit : rollingAnimation, this.animationTime);
        drawFrame(context, frame, { ...frame, x: this.x, y: this.y - this.z });
    }
    renderShadow(context, state: GameState) {
        if (this.status === 'hidden' || this.status === 'hiddenEnemy'
            || this.status === 'hiddenSwitch' || this.status === 'gone'
        ) {
            return;
        }
        drawFrameAt(context, smallShadowFrame, {x: this.x, y: this.y});
    }
}
objectHash.rollingBall = RollingBallObject;
