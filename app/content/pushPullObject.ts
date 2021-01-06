import { createAnimation, drawFrame } from 'app/utils/animations';
import { directionMap, isPointOpen } from 'app/utils/field';

import { Direction, Frame, GameState, BaseObjectDefinition, ObjectInstance, ObjectStatus, ShortRectangle } from 'app/types';

const tilesFrame = createAnimation('gfx/tiles/overworld.png', {w: 384, h: 640}).frames[0];
export const normalFrame: Frame = {image: tilesFrame.image, x: 16 * 1, y: 16 * 35, w: 16, h: 16};

export class PushPullObject implements ObjectInstance {
    behaviors = {
        solid: true,
    };
    drawPriority: 'background' = 'background';
    definition = null;
    x: number;
    y: number;
    grabDirection: Direction;
    pullingHeroDirection: Direction;
    pushFrame = 0;
    pushDirection: Direction;
    pushCounter: number = 0;
    pushedLastFrame: boolean = false;
    status: ObjectStatus = 'normal';
    constructor(definition: BaseObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): ShortRectangle {
        return { ...normalFrame, x: this.x, y: this.y };
    }
    onGrab(state: GameState, direction: Direction): void {
        this.grabDirection = direction;
    }
    onHit(state: GameState, direction: Direction): void {
        if (!this.pushDirection) {
            this.pushInDirection(state, direction);
        }
    }
    onPush(state: GameState, direction: Direction): void {
        if (!this.pushDirection) {
            this.pushCounter++;
            this.pushedLastFrame = true;
            if (this.pushCounter > 30) {
                this.pushInDirection(state, direction);
            }
        }
    }
    onPull(state: GameState, direction: Direction): void {
        this.pushInDirection(state, direction);
    }
    pushInDirection(state: GameState, direction: Direction): void {
        if (this.pushDirection) {
            return;
        }
        const x = this.x + 8 + 16 * directionMap[direction][0];
        const y = this.y + 8 + 16 * directionMap[direction][1];
        if (isPointOpen(state, {x, y})) {
            this.pushDirection = direction;
            this.pullingHeroDirection = direction;
            this.pushFrame = 0;
        }
    }
    update(state: GameState) {
        if (this.pushDirection) {
            if (this.pushFrame < 16) {
                this.pushFrame++;
                this.x += directionMap[this.pushDirection][0];
                this.y += directionMap[this.pushDirection][1];
            } else {
                this.pullingHeroDirection = null;
                this.pushDirection = null;
                this.pushFrame = 0;
            }
        } else if (!this.pushedLastFrame) {
            this.pushCounter = 0;
        } else {
            this.pushedLastFrame = false;
        }
    }
    render(context, state: GameState) {
        drawFrame(context, normalFrame, { ...normalFrame, x: this.x, y: this.y });
    }
}
