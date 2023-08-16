import { FieldAnimationEffect } from 'app/content/effects/animationEffect';
import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { moveActor } from 'app/moveActor';
import { createAnimation, drawFrame, frameAnimation } from 'app/utils/animations';
import { directionMap } from 'app/utils/direction';
import { addEffectToArea } from 'app/utils/effects';
import { intersectArea, pad } from 'app/utils/index';
import { getObjectStatus, saveObjectStatus } from 'app/utils/objects';
import Random from 'app/utils/Random';


const underFrame = createAnimation('gfx/objects/icicleholemonster.png', {w: 16, h: 32}).frames[0];
const overFrame = createAnimation('gfx/objects/icicleholemonster.png', {w: 16, h: 32}, {x: 1}).frames[0];

export class AirStream implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'sprites';
    definition: AirStreamDefinition = null;
    isObject = <const>true;
    x: number;
    y: number;
    d: Direction;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    constructor(state: GameState, definition: AirStreamDefinition) {
        this.definition = definition;
        this.status = this.definition.status || 'normal';
        this.x = definition.x;
        this.y = definition.y;
        this.d = definition.d;
        // Activating an air stream will toggle it from its default behavior.
        if (getObjectStatus(state, this.definition)) {
            this.status = (this.definition.status === 'normal') ? 'off' : 'normal';
        }
    }
    getHitbox(): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    getEffectHitbox(): Rect {
        const effectHitbox = { x: this.x, y: this.y, w: 16, h: 16 };
        // TODO: stop this effect when it hits a solid tile.
        const d = 160;
        if (this.d === 'up') {
            effectHitbox.y -= d;
            effectHitbox.h += d;
        } else if (this.d === 'down') {
            effectHitbox.h += d;
        } else if (this.d === 'left') {
            effectHitbox.x -= d;
            effectHitbox.w += d;
        } else if (this.d === 'right') {
            effectHitbox.w += d;
        }
        return effectHitbox;
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
            addWindParticle(state, this.area, this);
        }
        const actors = [
            ...[state.hero, ...state.hero.clones].filter(h => h.area === this.area
                && !h.isInvisible && h.equippedBoots !== 'ironBoots' && h.action !== 'falling' && h.action !== 'fallen'),
            ...this.area.enemies,
        ];
        if (state.hero.astralProjection?.area === this.area) {
            actors.push(state.hero.astralProjection);
        }
        const effectHitbox = this.getEffectHitbox();
        const [dx, dy] = directionMap[this.d];
        for (const actor of actors) {
            const actorHitbox = actor.getHitbox(state);
            const overlapArea = intersectArea(actorHitbox, effectHitbox);
            if (overlapArea > 0) {
                const windForce = overlapArea / (actorHitbox.w * actorHitbox.h);
                let speed = 4 * windForce;
                if (actor.isAirborn) {
                    speed *= 1.5;
                }
                // Push the actor aloft slightly.
                // This is intended to be small enough that players still fall with normal boots
                // but large enough to keep players with cloud boots in the air.
                actor.z = Math.max(actor.z, Math.min(actor.z + 0.9 * windForce, 2));
                moveActor(state, actor, speed * dx, speed * dy, {
                    canFall: true,
                    canJump: true,
                    canSwim: true,
                });
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrame(context, underFrame, {x: this.x, y: this.y - 8, w: 16, h: 32});
        if (this.status === 'normal') {
            renderWindVectors(context, state, this.animationTime, this.getEffectHitbox());
        }
        drawFrame(context, overFrame, {x: this.x, y: this.y - 8, w: 16, h: 32});
    }
}
objectHash.airStream = AirStream;

const regenerationParticles
    = createAnimation('gfx/tiles/spiritparticlesregeneration.png', {w: 4, h: 4}, {cols: 4, duration: 6}).frames;

function addWindParticle(this: void,
    state: GameState, area: AreaInstance, airStream: AirStream
): void {
    let target = airStream.getEffectHitbox();
    const [dx, dy] = directionMap[airStream.d];
    target = pad(target, -2);
    const frame = Random.element(regenerationParticles);
    const particle = new FieldAnimationEffect({
        animation: frameAnimation(frame),
        drawPriority: 'foreground',
        x: target.x + Math.random() * Math.max(0, (target.w - Math.abs(dx) * 48)),
        y: target.y + Math.random() * Math.max(0, (target.h - Math.abs(dy) * 48)),
        z: 2 + 6 * Math.random(),
        vx: dx * 4 - 0.5 + (1 + 2 * dx) * Math.random(),
        vy: dy * 4 - 0.5 + (1 + 2 * dy) * Math.random(),
        vz: 0, az: 0,
        //ax: vx / 10, ay: vy / 10,
        ttl: 200,
    });
    addEffectToArea(state, area, particle);
}


function renderWindVectors(this: void,
    context: CanvasRenderingContext2D,
    state: GameState,
    animationTime: number,
    target: Rect
): void {
    context.save();
        context.globalAlpha *= 0.3;
        context.fillStyle = 'white';
        const baseValue = 128 * animationTime / 1000;
        let y = baseValue % 64 - 128;
        for (; y < target.h + 32; y += 32) {
            let x = ((y - baseValue) % 5 + 5) % 5;
            for (; x < target.w; x += 5) {
                const targetTop = (2 + Math.sin((y - baseValue + y / 2 + x) / 20)) * 10 + y;
                const targetBottom = targetTop + 32;
                const actualTop = Math.max(5 * Math.abs(target.w / 2 - x), targetTop);
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
        context.globalAlpha *= 0.2;
        context.fillStyle = '#A0A0A0';
        y = baseValue % 64 - 128;
        for (; y < target.h + 32; y += 32) {
            let x = ((y - baseValue) % 5 + 5) % 5;
            for (; x < target.w - 1; x += 5) {
                const targetTop = (2 + Math.cos((y - baseValue + y / 2 + x) / 20)) * 10 + y;
                const targetBottom = targetTop + 24;
                const actualTop = Math.max(5 * Math.abs(target.w / 2 - x), targetTop);
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
