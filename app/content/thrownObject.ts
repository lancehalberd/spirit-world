import { drawFrame } from 'app/utils/animations';

import {Frame, GameState } from 'app/types';


interface Props {
    frame: Frame,
    x?: number
    y?: number,
    z?: number,
    vx?: number,
    vy?: number,
    vz?: number,
}

export class ThrownObject {
    definition = null;
    type = 'thrownObject' as 'thrownObject';
    frame: Frame;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    constructor({frame, x = 0, y = 0, z = 17, vx = 0, vy = 0, vz = 0 }: Props) {
        this.frame = frame;
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
        this.vz -= 0.5;
        if (this.z <= 0) {
            state.areaInstance.objects.splice(state.areaInstance.objects.indexOf(this), 1);
        }
    }
    render(context, state: GameState) {
        drawFrame(context, this.frame, { ...this.frame, x: this.x, y: this.y - this.z });
    }
}
