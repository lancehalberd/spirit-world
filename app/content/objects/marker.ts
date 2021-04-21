import { editingState } from 'app/development/tileEditor';

import {
    DrawPriority, GameState, ObjectInstance,
    ObjectStatus, ShortRectangle, SimpleObjectDefinition,
} from 'app/types';


export class Marker implements ObjectInstance {
    drawPriority: DrawPriority = 'background';
    definition: SimpleObjectDefinition = null;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    constructor(definition: SimpleObjectDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (editingState.isEditing) {
            context.strokeStyle = 'red';
            context.beginPath();
            context.moveTo(this.x + 2, this.y + 2);
            context.lineTo(this.x + 14, this.y + 14);
            context.moveTo(this.x + 14, this.y + 2);
            context.lineTo(this.x + 2, this.y + 14);
            context.stroke();
        }
    }
}
