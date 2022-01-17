import { getObjectStatus, saveObjectStatus } from 'app/content/objects';

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
    status: ObjectStatus = 'normal';
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
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    update(state: GameState) {
        if (this.status === 'normal') {
            saveObjectStatus(state, this.definition);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status !== 'normal') {
            return;
        }
        context.beginPath();
        context.arc(this.x + 8, this.y + 8, 8, 0, 2 * Math.PI);
        context.strokeStyle = 'white';
        context.stroke();
    }
}
