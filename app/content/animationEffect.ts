import { addObjectToArea, removeObjectFromArea } from 'app/content/areas';
import { FRAME_LENGTH } from 'app/gameConstants';
import { drawFrame, frameAnimation, getFrame } from 'app/utils/animations';

import { AreaInstance, Frame, FrameAnimation, GameState, ObjectInstance, ObjectStatus } from 'app/types';


interface Props {
    animation: FrameAnimation,
    x?: number
    y?: number,
    z?: number,
    vx?: number,
    vy?: number,
    vz?: number,
    az?: number,
    scale?: number,
}

export class AnimationEffect implements ObjectInstance {
    area: AreaInstance;
    definition = null;
    animation: FrameAnimation;
    animationTime: number;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    az: number;
    scale: number;
    status: ObjectStatus = 'normal';
    constructor({animation, x = 0, y = 0, z = 0, vx = 0, vy = 0, vz = 0, az = 0, scale = 1}: Props) {
        this.animation = animation;
        this.animationTime = 0;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.az = az;
        this.scale = scale;
    }
    update(state: GameState) {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.animationTime += FRAME_LENGTH;
        this.vz += this.az;
        if (this.z < 0 || (!this.animation.loop && this.animationTime >= this.animation.duration)) {
            removeObjectFromArea(state, this);
        }
    }
    render(context, state: GameState) {
        const frame = getFrame(this.animation, this.animationTime);
        drawFrame(context, frame, { ...frame,
            x: this.x, y: this.y - this.z,
            w: frame.w * this.scale,
            h: frame.h * this.scale,
        });
    }
}

export function addParticleAnimations(state: GameState, area: AreaInstance, x: number, y: number, z: number, particles: Frame[]): void {
    if (!particles) {
        return;
    }
    let theta = Math.random() * 2 * Math.PI;
    for (const frame of particles) {
        const vx = Math.cos(theta);
        const vy = Math.sin(theta);
        addObjectToArea(state, area,
            new AnimationEffect({
                animation: frameAnimation(frame),
                x: x + vx, y: y + vy, z,
                vx, vy, vz: 1.5, az: -0.2,
            })
        );
        theta += Math.PI * 2 / (particles.length);
    }
}
