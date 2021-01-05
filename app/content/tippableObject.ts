import { createAnimation, drawFrame } from 'app/utils/animations';
import { directionMap, isPointOpen } from 'app/utils/field';

import { Direction, Frame, GameState, BaseObjectDefinition, ObjectInstance, ShortRectangle } from 'app/types';

const tilesFrame = createAnimation('gfx/tiles/overworld.png', {w: 384, h: 640}).frames[0];
export const standingFrame: Frame = {image: tilesFrame.image, x: 16 * 20, y: 16 * 8, w: 16, h: 16};
const fallenFrame: Frame = {image: tilesFrame.image, x: 16 * 21, y: 16 * 8, w: 16, h: 16};

export class TippableObject implements ObjectInstance {
    behaviors = {
        solid: true,
    };
    drawPriority: 'background' = 'background';
    definition = null;
    x: number;
    y: number;
    fallFrame = 0;
    fallDirection: Direction;
    pushCounter: number = 0;
    pushedLastFrame: boolean = false;
    constructor(definition: BaseObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): ShortRectangle {
        return { ...standingFrame, x: this.x, y: this.y };
    }
    onHit(state: GameState, direction: Direction): void {
        if (!this.fallDirection) {
            this.fallInDirection(state, direction);
        }
    }
    onPush(state: GameState, direction: Direction): void {
        if (!this.fallDirection) {
            this.pushCounter++;
            this.pushedLastFrame = true;
            if (this.pushCounter >= 25) {
                this.fallInDirection(state, direction);
            }
        }
    }
    fallInDirection(state: GameState, direction: Direction): void {
        const x = this.x + 8 + 16 * directionMap[direction][0];
        const y = this.y + 8 + 16 * directionMap[direction][1];
        if (isPointOpen(state, {x, y})) {
            this.fallDirection = direction;
        }
    }
    update(state: GameState) {
        if (this.fallDirection) {
            if (this.fallFrame < 16) {
                this.fallFrame++;
                this.x += directionMap[this.fallDirection][0];
                this.y += directionMap[this.fallDirection][1];
            }
        }
        if (!this.pushedLastFrame) {
            this.pushCounter = 0;
        } else {
            this.pushedLastFrame = false;
        }
    }
    render(context, state: GameState) {
        if (this.fallFrame < 8) {
            drawFrame(context, standingFrame, { ...standingFrame, x: this.x, y: this.y });
        } else {
            drawFrame(context, fallenFrame, { ...fallenFrame, x: this.x, y: this.y });
        }
    }
}
