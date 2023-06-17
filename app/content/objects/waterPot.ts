import { PouredWaterEffect } from 'app/content/effects/PouredWaterEffect';
import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { addEffectToArea } from 'app/utils/effects';


const fullPodAnimation = createAnimation('gfx/tiles/pod.png', {w: 16, h: 16}, {cols: 2, y: 0, duration: 24});
const tippingPodAnimation = createAnimation('gfx/tiles/pod.png', {w: 16, h: 16}, {cols: 4, y: 1, duration: 4});
const emptyPodAnimation = createAnimation('gfx/tiles/pod.png', {w: 16, h: 16}, {cols: 2, y: 2, duration: 24});


export class WaterPot implements ObjectInstance {
    area: AreaInstance;
    alwaysReset = true;
    behaviors = {
        solid: true,
        midHeight: true,
    };
    drawPriority: DrawPriority = 'sprites';
    definition: SimpleObjectDefinition = null;
    x: number;
    y: number;
    fallFrame = 0;
    grabDirection: Direction;
    isNeutralTarget = true;
    isObject = <const>true;
    linkedObject: WaterPot;
    pushCounter: number = 0;
    pushedLastFrame: boolean = false;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    tipped = false;
    constructor(state: GameState, definition: SimpleObjectDefinition) {
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
        if (hit.direction === 'left') {
            if (hit.canPush) {
                this.pour(state);
            }
        }
        return { hit: true };
    }
    onPull(state: GameState, direction: Direction): void {
        if (this.grabDirection === direction && direction === 'left') {
            this.pour(state);
        }
    }
    onPush(state: GameState, direction: Direction): void {
        if (direction === 'left') {
            this.pushCounter++;
            this.pushedLastFrame = true;
            if (this.pushCounter >= 15) {
                this.pour(state);
            }
        }
    }
    pour(state: GameState): void {
        if (this.tipped) {
            return;
        }
        this.tipped = true;
        this.animationTime = 0;
        if (this.linkedObject) {
            this.linkedObject.tipped = true;
            this.linkedObject.animationTime = 0;
        }
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        if (this.tipped && this.animationTime === FRAME_LENGTH * tippingPodAnimation.frameDuration) {
            addEffectToArea(state, this.area, new PouredWaterEffect({
                x: this.x - 12,
                y: this.y + 2,
            }));
        }
        if (!this.pushedLastFrame) {
            this.pushCounter = 0;
        } else {
            this.pushedLastFrame = false;
        }
    }
    render(context, state: GameState) {
        let frame;
        if (!this.tipped) {
            frame = getFrame(fullPodAnimation, this.animationTime);
        } else if (this.animationTime < tippingPodAnimation.duration) {
            frame = getFrame(tippingPodAnimation, this.animationTime);
        } else {
            frame = getFrame(emptyPodAnimation, this.animationTime);
        }
        drawFrame(context, frame, { ...frame, x: this.x, y: this.y });
    }
}
objectHash.waterPot = WaterPot;
