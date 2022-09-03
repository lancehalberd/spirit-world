import { getObjectStatus, saveObjectStatus } from 'app/content/objects';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';

import {
    AreaInstance, FrameAnimation, GameState, ObjectInstance,
    ObjectStatus, SimpleObjectDefinition, Rect,
} from 'app/types';

function animationSet(source: string): FrameAnimation[] {
    return [
        createAnimation(source, {w: 16, h: 32}, {x: 0, cols: 4, duration: 5}),
        createAnimation(source, {w: 16, h: 32}, {x: 4, cols: 4, duration: 5}),
        createAnimation(source, {w: 16, h: 32}, {x: 8, cols: 4, duration: 5}),
        createAnimation(source, {w: 16, h: 32}, {x: 12, cols: 4, duration: 5}),
    ];
}

const floorAnimations = animationSet('gfx/tiles/spirit_regeneration_bottom.png');
const backAnimations = animationSet('gfx/tiles/spirit_regeneration_middle.png');
const frontAnimations = animationSet('gfx/tiles/spirit_regeneration_front.png');

export class AirBubbles implements ObjectInstance {
    area: AreaInstance;
    drawPriority: 'background' = 'background';
    definition: SimpleObjectDefinition = null;
    isObject = <const>true;
    x: number;
    y: number;
    charge = 1;
    chargeStage = 0;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    backPart: ObjectInstance;
    frontPart: ObjectInstance;
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.status = this.definition.status || 'normal';
        this.x = definition.x;
        this.y = definition.y;
        if (getObjectStatus(state, definition)) {
            this.status = 'normal';
        }
        this.backPart = new AirBubbleBack(this);
        this.frontPart = new AirBubbleFront(this);
    }
    getParts(state: GameState) {
        return [this.backPart, this.frontPart];
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    update(state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        this.backPart.x = this.x;
        this.backPart.y = this.y - 14;
        this.frontPart.x = this.x;
        this.frontPart.y = this.y + 2;
        this.animationTime += FRAME_LENGTH;
        this.charge = Math.min(this.charge + 0.01, 1);
        this.chargeStage = Math.max(0, Math.min(3, Math.floor(4 - 4 * this.charge)));
        saveObjectStatus(state, this.definition);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        const frame = getFrame(floorAnimations[this.chargeStage], this.animationTime);
        drawFrame(context, frame, {...frame, x: this.x, y: this.y - 16});
    }
}

export class AirBubbleBack implements ObjectInstance {
    area: AreaInstance;
    drawPriority: 'sprites' = 'sprites';
    airBubble: AirBubbles;
    isObject = <const>true;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    constructor(airBubble: AirBubbles) {
        this.airBubble = airBubble;
    }
    getHitbox(state: GameState): Rect {
        return this.airBubble.getHitbox(state);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.airBubble.status !== 'normal') {
            return;
        }
        const frame = getFrame(backAnimations[this.airBubble.chargeStage], this.airBubble.animationTime);
        drawFrame(context, frame, {...frame, x: this.airBubble.x, y: this.airBubble.y - 16});
    }
}

export class AirBubbleFront implements ObjectInstance {
    area: AreaInstance;
    drawPriority: 'sprites' = 'sprites';
    airBubble: AirBubbles;
    isObject = <const>true;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    constructor(airBubble: AirBubbles) {
        this.airBubble = airBubble;
    }
    getHitbox(state: GameState): Rect {
        return this.airBubble.getHitbox(state);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.airBubble.status !== 'normal') {
            return;
        }
        const frame = getFrame(frontAnimations[this.airBubble.chargeStage], this.airBubble.animationTime);
        drawFrame(context, frame, {...frame, x: this.airBubble.x, y: this.airBubble.y - 16});
    }
}
