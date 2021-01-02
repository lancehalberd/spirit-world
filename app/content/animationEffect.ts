import { FRAME_LENGTH } from 'app/gameConstants';
import { drawFrame, getFrame } from 'app/utils/animations';

import { FrameAnimation, GameState } from 'app/types';


interface Props {
    animation: FrameAnimation,
    x?: number
    y?: number,
    z?: number,
    vx?: number,
    vy?: number,
    vz?: number,
}

export class AnimationEffect {
    definition = null;
    type = 'animationEffect' as 'animationEffect';
    animation: FrameAnimation;
    animationTime: number;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    constructor({animation, x = 0, y = 0, z = 17, vx = 0, vy = 0, vz = 0 }: Props) {
        this.animation = animation;
        this.animationTime = 0;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
    }
    update(state: GameState) {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.animationTime += FRAME_LENGTH;
        this.vz -= 0.5;
        if (this.z <= 0) {
            state.areaInstance.objects.splice(state.areaInstance.objects.indexOf(this), 1);
        }
    }
    render(context, state: GameState) {
        const frame = getFrame(this.animation, this.animationTime);
        drawFrame(context, frame, { ...frame, x: this.x, y: this.y - this.z });
    }
}
