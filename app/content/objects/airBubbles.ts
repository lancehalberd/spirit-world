import { saveGame } from 'app/state';

import {
    AreaInstance, GameState, ObjectInstance,
    ObjectStatus, SimpleObjectDefinition, ShortRectangle,
} from 'app/types';

export class AirBubbles implements ObjectInstance {
    area: AreaInstance;
    drawPriority: 'sprites' = 'sprites';
    definition: SimpleObjectDefinition = null;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    constructor(state: GameState, definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.status = this.definition.status || 'normal';
        this.x = definition.x;
        this.y = definition.y;
        if (state.savedState.objectFlags[this.definition.id]) {
            this.status = 'normal';
        }
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    update(state: GameState) {
        if (this.definition.saveStatus && this.status === 'normal' && this.definition.id && !state.savedState.objectFlags[this.definition.id]) {
            state.savedState.objectFlags[this.definition.id] = true;
            saveGame();
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
