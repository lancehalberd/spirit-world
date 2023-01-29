import { AnimationEffect } from 'app/content/effects/animationEffect';
import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, frameAnimation, getFrame } from 'app/utils/animations';
import { addEffectToArea } from 'app/utils/effects';
import { getObjectStatus, saveObjectStatus } from 'app/utils/objects';
import Random from 'app/utils/Random';

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
    getHitbox(state?: GameState): Rect {
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
    consumeCharge(state: GameState) {
        this.charge = Math.max(this.charge - 0.02, -0.3);
        const particleDelay = this.charge > 0 ? 100 : 500;
        if (state.fieldTime % particleDelay === 0) {
            addRegenerationParticle(state, this.area, this.x + 8, this.y + 8, 0);
        }
    }
}
objectHash.airBubbles = AirBubbles;

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

const regenerationParticles
    = createAnimation('gfx/tiles/spiritparticlesregeneration.png', {w: 4, h: 4}, {cols: 4, duration: 6}).frames;

export function addRegenerationParticle(
    state: GameState, area: AreaInstance, x: number, y: number, z: number
): void {
    const theta = 2 * Math.PI * Math.random();
    const frame = Random.element(regenerationParticles);
    const vx = Math.cos(theta) / 4;
    const vy = Math.sin(theta) / 4;
    const particle = new AnimationEffect({
        animation: frameAnimation(frame),
        drawPriority: 'foreground',
        x: x - 2 + vx, y: y + vy, z,
        vx, vy, vz: 0, az: 0.04,
        //ax: vx / 10, ay: vy / 10,
        ttl: 600,
    });
    particle.behaviors.brightness = 1
    particle.behaviors.lightRadius = 2;
    addEffectToArea(state, area, particle);
}
