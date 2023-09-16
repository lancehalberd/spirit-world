import { FieldAnimationEffect } from 'app/content/effects/animationEffect';
import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { moveActor } from 'app/moveActor';
import { createAnimation, drawFrame, frameAnimation } from 'app/utils/animations';
import { directionMap } from 'app/utils/direction';
import { addEffectToArea } from 'app/utils/effects';
import { getTileBehaviorsAndObstacles } from 'app/utils/field';
import { intersectArea } from 'app/utils/index';
import { getObjectStatus, saveObjectStatus } from 'app/utils/objects';
import Random from 'app/utils/Random';


const underFrame = createAnimation('gfx/objects/icicleholemonster.png', {w: 16, h: 32}).frames[0];
const overFrame = createAnimation('gfx/objects/icicleholemonster.png', {w: 16, h: 32}, {x: 1}).frames[0];

const maxLength = 192;

export class AirStream implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'background';
    definition: AirStreamDefinition = null;
    isObject = <const>true;
    ignorePits = true;
    x: number;
    y: number;
    d: Direction;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    airLength: number;
    constructor(state: GameState, definition: AirStreamDefinition) {
        this.definition = definition;
        this.status = this.definition.status || 'normal';
        this.x = definition.x;
        this.y = definition.y;
        this.d = definition.d;
        this.airLength = definition.length || maxLength;
        // Activating an air stream will toggle it from its default behavior.
        if (getObjectStatus(state, this.definition)) {
            this.status = (this.definition.status === 'normal') ? 'off' : 'normal';
        }
    }
    getHitbox(): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    getEffectHitboxAndBlockedPoint(state: GameState): {effectHitbox: Rect, blockedPoint?: {x: number,y : number}} {
        let blockedPoint: {x: number, y: number};
        const [dx, dy] = directionMap[this.d];
        const cx = this.x + 8, cy = this.y + 8;
        for (length = 16; length < this.airLength; length += 8) {
            const x = cx + length * dx;
            const y = cy + length * dy;
            const { tileBehavior } = getTileBehaviorsAndObstacles(state, this.area, {x, y});
            if (tileBehavior?.solid && !tileBehavior?.low && !tileBehavior?.isSouthernWall) {
                blockedPoint = {x, y};
                // This number is pretty specific. At <= 16 the airflow won't push the player the full
                // amount when they are blocking the air (because we use overlap area to approximate the length overlap)
                // And at >= 20 the airflow can push the player when behind a full tile wall like a pot.
                // 18 seems to work well. If we run into problems with this, we should reduce this to +8 and the
                // change the calculation for windForce to be based on the amount of edge exposed to the airFlow
                // rather than the overlapping area.
                length = Math.min(this.airLength, length + 18);
                break;
            }
        }
        const x = cx + length * dx;
        const y = cy + length * dy;
        return {
            effectHitbox: {
                x: Math.min(x, this.x),
                y: Math.min(y, this.y),
                w: Math.max(16, Math.abs(cx - x)),
                h: Math.max(16, Math.abs(cy - y)),
            },
            blockedPoint,
        };
    }
    getYDepth(): number {
        return this.y + 16 + 4;
    }
    update(state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        // TODO: Support on/off interval.
        this.animationTime += FRAME_LENGTH;0
        saveObjectStatus(state, this.definition);
        const {effectHitbox, blockedPoint} = this.getEffectHitboxAndBlockedPoint(state);
        // This makes the number of particles proportional to the size of the air stream, which
        // makes the particle density consistent across different sized air streams.
        // It is based on 1 particle every 20ms for a max length air stream.
        /*const interval = ((20 * 16 * this.airLength / effectHitbox.h / effectHitbox.w / 20) | 0) * 20;
        if (this.animationTime % interval === 0) {
            addWindParticle(state, this.area, this);
        }*/
        if (this.animationTime % 60 === 0) {
            const boundingBox = {...effectHitbox};
            if (blockedPoint) {
                if (this.d === 'up') boundingBox.y = blockedPoint.y - 4;
                if (this.d === 'down') boundingBox.h = blockedPoint.y - effectHitbox.y + 4;
                if (this.d === 'left') boundingBox.x = blockedPoint.x - 4;
                if (this.d === 'right') boundingBox.w = blockedPoint.x - effectHitbox.x + 4;
            }
            addWindParticle2(state, this.area, this, boundingBox);
        }
        // TODO: Spawn wind particles orthogonally to direction from the blocked point.
        const actors = [
            ...[state.hero, ...state.hero.clones].filter(h => h.area === this.area
                && !h.isInvisible && h.savedData.equippedBoots !== 'ironBoots' && h.action !== 'falling' && h.action !== 'fallen' && h.action !== 'grabbing'),
            ...this.area.enemies,
        ];
        if (state.hero.astralProjection?.area === this.area) {
            actors.push(state.hero.astralProjection);
        }
        const [dx, dy] = directionMap[this.d];
        for (const actor of actors) {
            const actorHitbox = actor.getHitbox();
            const overlapArea = intersectArea(actorHitbox, effectHitbox);
            const windForce = overlapArea / (actorHitbox.w * actorHitbox.h);
            if (windForce > 0.1) {
                let speed = 4 * windForce;
                if (actor.isAirborn) {
                    speed *= 1.25;
                }
                // Push the actor aloft slightly.
                // This is intended to be small enough that players still fall with normal boots
                // but large enough to keep players with cloud boots in the air.
                actor.z = Math.max(actor.z, Math.min(actor.z + 0.3 * windForce, 2));
                moveActor(state, actor, speed * dx, speed * dy, {
                    canFall: true,
                    canJump: true,
                    canSwim: true,
                    canPush: false,
                });
                // Reduce player velocity if it is against the air stream.
                if (actor.vx * dx < 0) actor.vx += dx;
                if (actor.vy * dy < 0) actor.vy += dy;
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.d === 'down') {
            drawFrame(context, underFrame, {x: this.x, y: this.y, w: 16, h: 32});
        }
        if (this.status === 'normal') {
            //renderWindVectors(context, state, this.animationTime, this.getEffectHitbox(state), this.d);
        }
        if (this.d === 'down') {
            drawFrame(context, overFrame, {x: this.x, y: this.y, w: 16, h: 32});
        }
    }
}
objectHash.airStream = AirStream;

const regenerationParticles
    = createAnimation('gfx/tiles/spiritparticlesregeneration.png', {w: 4, h: 4}, {cols: 4, duration: 6}).frames;

function addWindParticle2(this: void,
    state: GameState, area: AreaInstance, airStream: AirStream, boundingBox: Rect
): void {
    const [dx, dy] = directionMap[airStream.d];
    const x = airStream.x + 6 + Math.random() * 4 - 2, y = airStream.y + 6 + Math.random() * 4 - 2;
    const vx = dx * 5 - 0.5 + (1 + dx) * Math.random(), vy = dy * 5 - 0.5 + (1 + dy) * Math.random();
    const frame = Random.element(regenerationParticles);
    const particle = new FieldAnimationEffect({
        animation: frameAnimation(frame),
        drawPriority: 'sprites',
        x,
        y,
        z: 0,
        vx,
        vy,
        vz: 0, az: 0,
        //ax: vx / 10, ay: vy / 10,
        boundingBox,
    });
    addEffectToArea(state, area, particle);
}
/*
function addWindParticle(this: void,
    state: GameState, area: AreaInstance, airStream: AirStream
): void {
    let target = airStream.getEffectHitbox(state);
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
    target: Rect,
    d: Direction
): void {
    // TODO: rotate this so that it points the correct direction:
    // context.rotate(directionMapToAngle[d])
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
}*/
