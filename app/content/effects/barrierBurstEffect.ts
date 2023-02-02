import { addSparkleAnimation, AnimationEffect } from 'app/content/effects/animationEffect';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, frameAnimation, getFrame, drawFrameCenteredAt } from 'app/utils/animations';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';
import { hitTargets } from 'app/utils/field';
import Random from 'app/utils/Random';

import { AreaInstance, DrawPriority, GameState, EffectInstance, MagicElement } from 'app/types';

const burstAnimation = createAnimation('gfx/effects/45radiusburst.png', {w: 90, h: 90}, {cols: 9, duration: 2});

const frameRadii = [15, 20, 28, 30, 35, 40, 45, 50];

interface Props {
    x?: number
    y?: number
    element: MagicElement
}

const duration = burstAnimation.duration;

export class BarrierBurstEffect implements EffectInstance {
    area: AreaInstance;
    animationTime: number;
    drawPriority: DrawPriority = 'foreground';
    destroyedObjects: boolean = false;
    element: MagicElement;
    isEffect = <const>true;
    x: number;
    y: number;
    isPlayerAttack = true;
    constructor({x = 0, y = 0, element }: Props) {
        this.animationTime = 0;
        this.x = x;
        this.y = y;
        this.element = element;
    }
    getRadius() {
        const frameIndex = Math.floor(this.animationTime / burstAnimation.frameDuration / FRAME_LENGTH);
        return frameRadii[frameIndex] ?? 0;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
        const r = this.getRadius();
        if (r > 0) {
            hitTargets(state, this.area, {
                damage: 2,
                canPush: true,
                cutsGround: true,
                knockAwayFromHit: true,
                hitEnemies: true,
                hitCircle: {x: this.x, y: this.y, r},
                hitObjects: true,
                hitTiles: true,
                element: this.element,
            });
            let theta = 2 * Math.PI * Math.random();
            for (let i = 0; i < 4; i++) {
                addBurstParticle(state, this.area,
                    this.x + r * Math.cos(theta),
                    this.y + r * Math.sin(theta),
                    i, this.element);
                theta += 2 * Math.PI / 4;
            }
        }
        if (this.animationTime >= duration) {
            removeEffectFromArea(state, this);
        }
    }
    render(context, state: GameState) {
        const frame = getFrame(burstAnimation, this.animationTime);
        // Debug code for viewing the hitCircle
        /*const r = this.getRadius();
        if (r > 0) {
            context.save();
                context.globalAlpha *= 0.5;
                context.beginPath();
                context.arc(this.x, this.y, r, 0, 2 * Math.PI);
                context.fillStyle = 'red';
                context.fill();
            context.restore();
        }*/
        drawFrameCenteredAt(context, frame, {
            ...frame,
            x: this.x - frame.w / 2,
            y: this.y - frame.h / 2,
        });
    }
}


const regenerationParticles
    = createAnimation('gfx/tiles/spiritparticlesregeneration.png', {w: 4, h: 4}, {cols: 4, duration: 6}).frames;

export function addBurstParticle(
    state: GameState, area: AreaInstance,
    x: number, y: number, z: number, element: MagicElement
): void {
    const theta = 2 * Math.PI * Math.random();
    const vx = 1.5 * Math.cos(theta);
    const vy = 1.5 * Math.sin(theta);
    if (element === null ){
        const frame = Random.element(regenerationParticles);
        const particle = new AnimationEffect({
            animation: frameAnimation(frame),
            drawPriority: 'foreground',
            x: x + vx, y: y + vy, z,
            vx, vy, vz: 1,
            //ax: vx / 10, ay: vy / 10,
            ttl: 160,
        });
        addEffectToArea(state, area, particle);
    } else {
        addSparkleAnimation(state, area, {x, y, w: 0, h: 0},
            {
                velocity: { x: vx, y:vy, z: 1},
                element,
                z,
            }
        );
    }
}
