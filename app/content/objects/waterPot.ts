import { FRAME_LENGTH } from 'app/gameConstants';
import { addObjectToArea } from 'app/content/areas';
import { growVine, PouredWaterEffect } from 'app/content/effects/PouredWaterEffect';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { directionMap } from 'app/utils/field';

import {
    AreaInstance, Direction, DrawPriority, FrameAnimation, GameState,
    ObjectInstance, ObjectStatus, ShortRectangle, SimpleObjectDefinition,
} from 'app/types';


const fallingAnimation: FrameAnimation = createAnimation('gfx/tiles/tippablepot.png', {w: 16, h: 18},
    {cols: 6, duration: 4}, {loop: false}
);

export class WaterPot implements ObjectInstance {
    area: AreaInstance;
    alwaysReset = true;
    behaviors = {
        solid: true,
    };
    drawPriority: DrawPriority = 'sprites';
    definition: SimpleObjectDefinition = null;
    x: number;
    y: number;
    fallFrame = 0;
    fallDirection: Direction;
    grabDirection: Direction;
    linkedObject: WaterPot;
    pushCounter: number = 0;
    pushedLastFrame: boolean = false;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    shattered = false;
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    add(state: GameState, area: AreaInstance) {
        this.area = area;
        area.objects.push(this);
        if (!state.savedState.objectFlags[this.definition.id]) {
            return;
        }
        // If this water pot was already tipped over, we need to start in the tipped state, and find a vine
        // to grow nearby.
        this.shattered = true;
        this.animationTime = 2000;
        this.fallDirection = 'left'; // This just needs to be set to any direction.
        const tx = Math.floor(this.x / 16);
        const ty = Math.floor(this.y / 16);
        for (let x = tx - 1; x <= tx + 1; x++) {
            for (let y = ty; y < 32; y++) {
                // ignore the tile this object is on.
                if (x === tx && y === ty) {
                    continue;
                }
                const tileBehavior = area?.behaviorGrid[y]?.[x];
                if (tileBehavior?.growTiles) {
                    growVine(this.area, x, y);
                    return;
                }
                // Stop searching once we find a non-solid tile.
                if (!tileBehavior?.solid) {
                    break;
                }
            }
        }
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onGrab(state: GameState, direction: Direction): void {
        this.grabDirection = direction;
    }
    onHit(state: GameState, direction: Direction): void {
        if (!this.fallDirection && direction === 'left' || direction === 'right') {
            this.pourInDirection(state, direction);
        }
    }
    onPull(state: GameState, direction: Direction): void {
        if (!this.fallDirection && this.grabDirection === direction) {
            this.pourInDirection(state, direction);
        }
    }
    onPush(state: GameState, direction: Direction): void {
        if (!this.fallDirection) {
            this.pushCounter++;
            this.pushedLastFrame = true;
            if (this.pushCounter >= 25) {
                this.pourInDirection(state, direction);
            }
        }
    }
    pourInDirection(state: GameState, direction: Direction): void {
        if (this.fallDirection) {
            return;
        }
        this.fallDirection = direction;
        this.animationTime = -80;
        if (this.linkedObject) {
            this.linkedObject.fallDirection = direction;
            this.linkedObject.animationTime = -80;
        }
    }
    update(state: GameState) {
        if (this.fallDirection) {
            this.animationTime += FRAME_LENGTH;
            if (this.fallFrame < 16) {
                this.fallFrame++;
            }
        }
        if (!this.shattered && this.animationTime >= (fallingAnimation.frames.length - 1) * FRAME_LENGTH * fallingAnimation.frameDuration) {
            this.shattered = true;
            for (const hero of [state.hero, ...state.hero.clones]) {
                if (hero.grabObject === this) {
                    hero.grabObject = null;
                    hero.action = null;
                }
            }
            addObjectToArea(state, this.area, new PouredWaterEffect({
                x: this.x + 8 + 16 * directionMap[this.fallDirection][0],
                y: this.y + 2 + 16 * directionMap[this.fallDirection][1],
            }));
            state.savedState.objectFlags[this.definition.id] = true;
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
        if (!this.shattered) {
            context.beginPath();
            context.fillStyle = '#9999FF';
            context.arc(this.x + 8, this.y + 2, 4, 0, 2 * Math.PI);
            context.fill();
        }
    }
}
