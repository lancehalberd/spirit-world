import { removeObjectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { directionMap, getTileBehaviorsAndObstacles, isPointOpen } from 'app/utils/field';
import { playSound, stopSound } from 'app/utils/sounds';

import { AreaInstance, BallGoal, Direction, GameState, BaseObjectDefinition, ObjectInstance, ObjectStatus, ShortRectangle } from 'app/types';

const rollingAnimation = createAnimation('gfx/tiles/rollingboulder.png', {w: 16, h: 16}, {cols:4});
const rollingAnimationSpirit = createAnimation('gfx/tiles/rollingboulderspirit.png', {w: 16, h: 16}, {cols:4});

export class RollingBallObject implements ObjectInstance {
    area: AreaInstance;
    alwaysReset = true;
    behaviors = {
        solid: true,
    };
    drawPriority: 'sprites' = 'sprites';
    definition = null;
    x: number;
    y: number;
    linkedObject: RollingBallObject;
    rollDirection: Direction;
    pushCounter: number = 0;
    pushedThisFrame: boolean = false;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    stuck: boolean = false;
    soundReference;
    constructor(definition: BaseObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    cleanup() {
        this.stopRollingSound();
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onHit(state: GameState, direction: Direction): void {
        if (!this.rollDirection) {
            this.rollInDirection(state, direction);
        }
    }
    onPush(state: GameState, direction: Direction): void {
        if (!this.rollDirection) {
            this.pushCounter++;
            this.pushedThisFrame = true;
            if (this.pushCounter >= 25) {
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
        if (isPointOpen(state, this.area, {x, y}) && (!this.linkedObject || isPointOpen(state, this.linkedObject.area, {x, y}))) {
            this.rollDirection = direction;
            this.soundReference = playSound('rollingBall');
            if (this.linkedObject) {
                this.linkedObject.rollDirection = direction;
            }
        }
    }
    stopRollingSound() {
        if (this.soundReference) {
            stopSound(this.soundReference);
            this.soundReference = null;
        }
    }
    update(state: GameState) {
        if (this.rollDirection) {
            this.animationTime += FRAME_LENGTH;
            const dx = 2 * directionMap[this.rollDirection][0];
            const dy = 2 * directionMap[this.rollDirection][1];
            const x = this.x + dx + (this.rollDirection === 'right' ? 15 : 0);
            const y = this.y + dy + (this.rollDirection === 'down' ? 15 : 0);
            for (const object of state.areaInstance.objects) {
                if (object.definition?.type !== 'ballGoal') {
                    continue;
                }
                if (Math.abs(this.x - object.x) <= 2 && Math.abs(this.y - object.y) <= 2) {
                    this.stopRollingSound();
                    playSound('rollingBallSocket');
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
            const { objects, tileBehavior } = getTileBehaviorsAndObstacles(state, this.area, {x, y}, new Set([this]));
            if (!tileBehavior.solid && !tileBehavior.pit && !tileBehavior.outOfBounds) {
                this.x += dx;
                this.y += dy;
            } else {
                if (objects.length) {
                    for (const object of objects) {
                        if (object.onHit) {
                            object.onHit(state, this.rollDirection);
                        }
                    }
                }
                this.stopRollingSound();
                this.linkedObject?.stopRollingSound();
                playSound('rollingBallHit');
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
        const frame = getFrame(this.definition.spirit ? rollingAnimationSpirit : rollingAnimation, this.animationTime);
        drawFrame(context, frame, { ...frame, x: this.x, y: this.y });
    }
}
