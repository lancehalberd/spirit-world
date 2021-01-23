import { addParticleAnimations } from 'app/content/animationEffect';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { directionMap, isPointOpen } from 'app/utils/field';

import {
    Direction, DrawPriority, Frame, FrameAnimation, GameState,
    BaseObjectDefinition, ObjectInstance, ObjectStatus, ShortRectangle,
} from 'app/types';


//const crackedPotFrame: Frame = createAnimation('gfx/tiles/tippablepot.png', {w: 16, h: 18}).frames[0];
const particleFrames: Frame[] = createAnimation('gfx/tiles/tippablepot.png', {w: 16, h: 18}, {x: 6, cols: 5}).frames;
//const remainsFrame: Frame = createAnimation('gfx/tiles/tippablepot.png', {w: 16, h: 18}, {x: 3}).frames[0];
const fallingAnimation: FrameAnimation = createAnimation('gfx/tiles/tippablepot.png', {w: 16, h: 18},
    {cols: 6, duration: 4}, {loop: false}
);

export class TippableObject implements ObjectInstance {
    alwaysReset = true;
    behaviors = {
        solid: true,
    };
    drawPriority: DrawPriority = 'sprites';
    definition = null;
    x: number;
    y: number;
    fallFrame = 0;
    fallDirection: Direction;
    pushCounter: number = 0;
    pushedLastFrame: boolean = false;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    shattered = false;
    constructor(definition: BaseObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
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
            this.animationTime = -80;
        }
    }
    update(state: GameState) {
        if (this.fallDirection) {
            this.animationTime += FRAME_LENGTH;
            if (this.fallFrame < 16) {
                this.fallFrame++;
                this.x += directionMap[this.fallDirection][0];
                this.y += directionMap[this.fallDirection][1];
            }
            if (!this.shattered && this.animationTime >= (fallingAnimation.frames.length - 1) * FRAME_LENGTH * fallingAnimation.frameDuration) {
                this.shattered = true;
                this.drawPriority = 'background';
                addParticleAnimations(state, this.x, this.y, 2, particleFrames);
            }
        }
        if (!this.pushedLastFrame) {
            this.pushCounter = 0;
        } else {
            this.pushedLastFrame = false;
        }
    }
    render(context, state: GameState) {
        const frame = getFrame(fallingAnimation, this.animationTime);
        drawFrame(context, frame, { ...frame, x: this.x, y: this.y - 2 });
    }
}
