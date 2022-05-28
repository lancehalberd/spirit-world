import { getObjectStatus, saveObjectStatus } from 'app/content/objects';
import { FRAME_LENGTH } from 'app/gameConstants';

import {
    AreaInstance, GameState, ObjectInstance,
    ObjectStatus, SimpleObjectDefinition, Rect,
} from 'app/types';

export class AirBubbles implements ObjectInstance {
    area: AreaInstance;
    drawPriority: 'sprites' = 'sprites';
    definition: SimpleObjectDefinition = null;
    isObject = <const>true;
    x: number;
    y: number;
    charge = 1;
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
    getHitbox(state: GameState): Rect {
        const r = 8 - (2 + 6 * Math.max(0, this.charge));
        return { x: this.x + r, y: this.y + r, w: 16 - 2 * r, h: 16 - 2 * r };
    }
    update(state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        this.animationTime += FRAME_LENGTH;
        this.charge = Math.min(this.charge + 0.01, 1);
        saveObjectStatus(state, this.definition);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status !== 'normal') {
            return;
        }

        const gradient = context.createLinearGradient(0, -12, 0, 16);
        gradient.addColorStop(0.3 + 0.1 * Math.cos(this.animationTime / 400), 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(0.8 + 0.1 * Math.cos(this.animationTime / 400), 'rgba(255, 255, 255, 0.7)');
        context.save();
            context.fillStyle = gradient;
            const r = 2 + 6 * Math.max(0, this.charge);
            context.translate(this.x, this.y + 8);
            context.beginPath();
            context.arc(8, - r / 2, r, 0, 2 * Math.PI);
            context.fill();
            context.scale(1, 0.4);
            context.beginPath();
            context.arc(8, 0, r, 0, 2 * Math.PI);
            context.strokeStyle = 'white';
            context.stroke();
        context.restore();
    }
}
