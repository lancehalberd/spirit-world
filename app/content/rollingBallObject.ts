import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { directionMap, getTileBehaviorsAndObstacles, isPointOpen } from 'app/utils/field';

import { Direction, GameState, BaseObjectDefinition, ObjectInstance, ObjectStatus, ShortRectangle } from 'app/types';

const rollingAnimation = createAnimation('gfx/tiles/rollingboulder.png', {w: 16, h: 16}, {cols:4});

export class RollingBallObject implements ObjectInstance {
    alwaysReset = true;
    behaviors = {
        solid: true,
    };
    drawPriority: 'sprites' = 'sprites';
    definition = null;
    x: number;
    y: number;
    rollDirection: Direction;
    pushCounter: number = 0;
    pushedThisFrame: boolean = false;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    constructor(definition: BaseObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;

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
        const x = this.x + 8 + 16 * directionMap[direction][0];
        const y = this.y + 8 + 16 * directionMap[direction][1];
        if (isPointOpen(state, {x, y})) {
            this.rollDirection = direction;
        }
    }
    update(state: GameState) {
        if (this.rollDirection) {
            this.animationTime += FRAME_LENGTH;
            const dx = 2 * directionMap[this.rollDirection][0];
            const dy = 2 * directionMap[this.rollDirection][1];
            const x = this.x + dx + (this.rollDirection === 'right' ? 15 : 0);
            const y = this.y + dy + (this.rollDirection === 'down' ? 15 : 0);
            const { objects, tileBehavior } = getTileBehaviorsAndObstacles(state, {x, y});
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
                this.rollDirection = null;
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
        const frame = getFrame(rollingAnimation, this.animationTime);
        drawFrame(context, frame, { ...frame, x: this.x, y: this.y });
    }
}
