import { createAnimation, drawFrame } from 'app/utils/animations';
import { directionMap, getSolidObstacles, isPointOpen } from 'app/utils/field';

import { Direction, Frame, GameState, BaseObjectDefinition, ObjectInstance, ShortRectangle } from 'app/types';

const tilesFrame = createAnimation('gfx/tiles/overworld.png', {w: 384, h: 640}).frames[0];
export const normalFrame: Frame = {image: tilesFrame.image, x: 16 * 0, y: 16 * 35, w: 16, h: 16};
const rollingFrame: Frame = {image: tilesFrame.image, x: 16 * 3, y: 16 * 35, w: 16, h: 16};

export class RollingBallObject implements ObjectInstance {
    behaviors = {
        solid: true,
    };
    drawPriority: 'background' = 'background';
    definition = null;
    x: number;
    y: number;
    rollDirection: Direction;
    pushCounter: number = 0;
    pushedThisFrame: boolean = false;
    constructor(definition: BaseObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): ShortRectangle {
        return { ...normalFrame, x: this.x, y: this.y };
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
            const dx = 2 * directionMap[this.rollDirection][0];
            const dy = 2 * directionMap[this.rollDirection][1];
            const x = this.x + dx + (this.rollDirection === 'right' ? 15 : 0);
            const y = this.y + dy + (this.rollDirection === 'down' ? 15 : 0);
            const { objects, open } = getSolidObstacles(state, {x, y});
            if (open) {
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
        if (this.rollDirection) {
            drawFrame(context, rollingFrame, { ...rollingFrame, x: this.x, y: this.y });
        } else {
            drawFrame(context, normalFrame, { ...normalFrame, x: this.x, y: this.y });
        }
    }
}
