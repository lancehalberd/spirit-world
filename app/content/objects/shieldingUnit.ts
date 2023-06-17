import { FieldAnimationEffect } from 'app/content/effects/animationEffect';
import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, frameAnimation } from 'app/utils/animations';
import { addEffectToArea } from 'app/utils/effects';
import { pad } from 'app/utils/index';
import { getObjectStatus, saveObjectStatus } from 'app/utils/objects';
import Random from 'app/utils/Random';


const underFrame = createAnimation('gfx/objects/icicleholemonster.png', {w: 16, h: 32}).frames[0];
const overFrame = createAnimation('gfx/objects/icicleholemonster.png', {w: 16, h: 32}, {x: 1}).frames[0];

export class ShieldingUnit implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'sprites';
    definition: SimpleObjectDefinition = null;
    isObject = <const>true;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.status = this.definition.status || 'normal';
        this.x = definition.x;
        this.y = definition.y;
        if (getObjectStatus(state, definition)) {
            this.status = 'normal';
        }
    }
    getHitbox(): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    getYDepth(): number {
        return this.y + 16 + 4;
    }
    update(state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        this.animationTime += FRAME_LENGTH;0
        saveObjectStatus(state, this.definition);
        if (this.animationTime % 60 === 0) {
            addRegenerationParticle(state, this.area, this.getHitbox());
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrame(context, underFrame, {x: this.x, y: this.y - 24, w: 16, h: 32});
        if (this.status === 'normal') {
            renderDustfallVectors(context, state, this.animationTime, {x: this.x + 3, y: this.y - 16, w: 10, h: 24});
        }
        drawFrame(context, overFrame, {x: this.x, y: this.y - 24, w: 16, h: 32});
    }
}
objectHash.shieldingUnit = ShieldingUnit;

const regenerationParticles
    = createAnimation('gfx/tiles/spiritparticlesregeneration.png', {w: 4, h: 4}, {cols: 4, duration: 6}).frames;

function addRegenerationParticle(
    state: GameState, area: AreaInstance, target: Rect
): void {
    target = pad(target, -2);
    const theta = 2 * Math.PI * Math.random();
    const frame = Random.element(regenerationParticles);
    const vx = Math.cos(theta) / 4;
    const vy = Math.sin(theta) / 4;
    const particle = new FieldAnimationEffect({
        animation: frameAnimation(frame),
        drawPriority: 'foreground',
        x: target.x + Math.random() * target.w,
        y: target.y + Math.random() * target.h, z: 0,
        vx, vy, vz: 0, az: 0.04,
        //ax: vx / 10, ay: vy / 10,
        ttl: 600,
    });
    particle.behaviors.brightness = 1
    particle.behaviors.lightRadius = 2;
    addEffectToArea(state, area, particle);
}


function renderDustfallVectors(this: void,
    context: CanvasRenderingContext2D,
    state: GameState,
    animationTime: number,
    target: Rect
): void {
    context.save();
        context.globalAlpha *= 0.8;
        context.fillStyle = 'white';
        const baseValue = 128 * animationTime / 1000;
        let y = baseValue % 64 - 128;
        for (; y < target.h + 32; y += 32) {
            let x = ((y - baseValue) % 5 + 5) % 5;
            for (; x < target.w; x += 5) {
                const targetTop = Math.sin((y - baseValue + y / 2 + x) / 20) * 32 + y;
                const targetBottom = targetTop + 48;
                const actualTop = Math.max(0, targetTop);
                const actualBottom = Math.min(target.h - x % 3, targetBottom);
                if (actualBottom > actualTop) {
                    context.fillRect(
                        target.x + x, target.y + actualTop,
                        1, actualBottom - actualTop
                    );
                }
            }
        }
    context.restore();
    context.save();
        context.globalAlpha *= 0.7;
        context.fillStyle = '#A0A0A0';
        y = baseValue % 64 - 128;
        for (; y < target.h + 32; y += 32) {
            let x = ((y - baseValue) % 5 + 5) % 5;
            for (; x < target.w - 1; x += 5) {
                const targetTop = Math.cos((y - baseValue + y / 2 + x) / 20) * 32 + y;
                const targetBottom = targetTop + 32;
                const actualTop = Math.max(0, targetTop);
                const actualBottom = Math.min(target.h - x % 2, targetBottom);
                if (actualBottom > actualTop) {
                    context.fillRect(
                        target.x + x, target.y + actualTop,
                        2, actualBottom - actualTop
                    );
                }
            }
        }
    context.restore();
}
