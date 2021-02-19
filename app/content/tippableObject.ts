import { addParticleAnimations } from 'app/content/animationEffect';
import { removeObjectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { directionMap, isPointOpen } from 'app/utils/field';

import {
    AreaInstance, Direction, DrawPriority, Frame, FrameAnimation, GameState,
    BaseObjectDefinition, ObjectInstance, ObjectStatus, ShortRectangle,
} from 'app/types';


//const crackedPotFrame: Frame = createAnimation('gfx/tiles/tippablepot.png', {w: 16, h: 18}).frames[0];
const particleFrames: Frame[] = createAnimation('gfx/tiles/tippablepot.png', {w: 16, h: 18}, {x: 6, cols: 5}).frames;
//const remainsFrame: Frame = createAnimation('gfx/tiles/tippablepot.png', {w: 16, h: 18}, {x: 3}).frames[0];
const fallingAnimation: FrameAnimation = createAnimation('gfx/tiles/tippablepot.png', {w: 16, h: 18},
    {cols: 6, duration: 4}, {loop: false}
);

export class TippableObject implements ObjectInstance {
    area: AreaInstance;
    alwaysReset = true;
    behaviors = {
        destructible: true,
        solid: true,
    };
    drawPriority: DrawPriority = 'sprites';
    definition = null;
    x: number;
    y: number;
    fallFrame = 0;
    fallingInPlace: boolean = false;
    fallDirection: Direction;
    grabDirection: Direction;
    linkedObject: TippableObject;
    pullingHeroDirection: Direction;
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
    onGrab(state: GameState, direction: Direction): void {
        this.grabDirection = direction;
    }
    onHit(state: GameState, direction: Direction): void {
        if (!this.fallDirection) {
            this.fallInDirection(state, direction);
        }
    }
    onPull(state: GameState, direction: Direction): void {
        if (!this.fallDirection && !this.fallingInPlace && this.grabDirection === direction) {
            this.fallInDirection(state, direction);
        } else if (!this.fallDirection && !this.fallingInPlace) {
            this.fallingInPlace = true;
            this.animationTime = -80;
            if (this.linkedObject) {
                this.linkedObject.fallingInPlace = true;
                this.linkedObject.animationTime = -80;
            }
        }
    }
    onPush(state: GameState, direction: Direction): void {
        if (!this.fallDirection && !this.fallingInPlace) {
            this.pushCounter++;
            this.pushedLastFrame = true;
            if (this.pushCounter >= 25) {
                this.fallInDirection(state, direction);
            }
        }
    }
    fallInDirection(state: GameState, direction: Direction): void {
        if (this.fallDirection || this.fallingInPlace) {
            return;
        }
        const x = this.x + 8 + 16 * directionMap[direction][0];
        const y = this.y + 8 + 16 * directionMap[direction][1];
        if (isPointOpen(state, this.area, {x, y}) && (!this.linkedObject || isPointOpen(state, this.linkedObject.area, {x, y}))) {
            this.fallDirection = direction;
            this.animationTime = -80;
            this.pullingHeroDirection = direction;
            if (this.linkedObject) {
                this.linkedObject.fallDirection = direction;
                this.linkedObject.animationTime = -80;
                this.linkedObject.pullingHeroDirection = direction;
            }
        }
    }
    onDestroy(state: GameState, dx: number, dy: number) {
        addParticleAnimations(state, this.area, this.x, this.y, 2, particleFrames);
        removeObjectFromArea(state, this);
    }
    update(state: GameState) {
        if (this.fallingInPlace) {
            this.animationTime += FRAME_LENGTH;
            if (this.animationTime === 200) {
                const hero = state.hero.activeClone || state.hero;
                if (hero.grabObject === this) {
                    hero.grabObject = null;
                    hero.action = null;
                }
            }
        } if (this.fallDirection) {
            this.animationTime += FRAME_LENGTH;
            if (this.fallFrame < 16) {
                this.fallFrame++;
                this.x += directionMap[this.fallDirection][0];
                this.y += directionMap[this.fallDirection][1];
            }
        }
        if (!this.shattered && this.animationTime >= (fallingAnimation.frames.length - 1) * FRAME_LENGTH * fallingAnimation.frameDuration) {
            this.shattered = true;
            this.pullingHeroDirection = null;
            const hero = state.hero.activeClone || state.hero;
            if (hero.grabObject === this) {
                hero.grabObject = null;
                hero.action = null;
            }
            // Not sure why I had this, with this, the pot is hidden behind floor switches sometimes.
            // this.drawPriority = 'background';
            addParticleAnimations(state, this.area, this.x, this.y, 2, particleFrames);
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
