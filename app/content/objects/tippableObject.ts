import { addParticleAnimations } from 'app/content/effects/animationEffect';
import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { directionMap, isPointOpen } from 'app/utils/field';
import { removeObjectFromArea } from 'app/utils/objects';

import {
    AreaInstance, Direction, DrawPriority, Frame, FrameAnimation, GameState, HitProperties, HitResult,
    BaseObjectDefinition, ObjectInstance, ObjectStatus, Rect,
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
        midHeight: true,
    };
    isNeutralTarget = true;
    isObject = <const>true;
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
    constructor(state: GameState, definition: BaseObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onGrab(state: GameState, direction: Direction): void {
        this.grabDirection = direction;
    }
    onHit(state: GameState, hit: HitProperties): HitResult {
        if (!this.fallDirection) {
            if (hit.canPush) {
                this.fallInDirection(state, hit.direction);
            }
            return { hit: true };
        }
        return { hit: true, blocked: true };
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
            if (this.pushCounter >= 20) {
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
        const movementProps = { canFall: true };
        if (isPointOpen(state, this.area, {x, y}, movementProps)
            && (!this.linkedObject || isPointOpen(state, this.linkedObject.area, {x, y}, movementProps))
        ) {
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
        addParticleAnimations(state, this.area, this.x + 8, this.y + 8, 2, particleFrames);
        removeObjectFromArea(state, this);
    }
    releaseBrokenPot(state: GameState) {
        for (const hero of [state.hero, state.hero.astralProjection, ...state.hero.clones]) {
            if (hero?.grabObject === this) {
                hero.grabObject = null;
                hero.action = null;
            }
        }
    }
    update(state: GameState) {
        if (this.fallingInPlace) {
            this.animationTime += FRAME_LENGTH;
            if (this.animationTime === 200) {
                this.releaseBrokenPot(state);
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
            this.releaseBrokenPot(state);
            // Not sure why I had this, with this, the pot is hidden behind floor switches sometimes.
            // this.drawPriority = 'background';
            addParticleAnimations(state, this.area, this.x + 8, this.y + 8, 2, particleFrames);
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
objectHash.tippable = TippableObject;
