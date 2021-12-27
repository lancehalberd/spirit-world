import { getObjectStatus, saveObjectStatus } from 'app/content/objects';
import { editingState } from 'app/development/tileEditor';
import { FRAME_LENGTH } from 'app/gameConstants';
import { showMessage } from 'app/render/renderMessage';
import { readGetParameter, rectanglesOverlap } from 'app/utils/index';


import {
    AreaInstance, GameState, NarrationDefinition,
    ObjectInstance, ObjectStatus, Rect,
} from 'app/types';



const seed = readGetParameter('seed');

export class Narration implements ObjectInstance {
    area: AreaInstance;
    definition: NarrationDefinition;
    drawPriority = <const>'foreground';
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    time: number;
    constructor(state: GameState, definition: NarrationDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        if (seed || getObjectStatus(state, this.definition)) {
            this.status = 'gone';
        }
        this.time = 0;
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: this.definition.w, h: this.definition.h };
    }
    update(state: GameState) {
        if (this.status === 'gone') {
            return;
        }
        // If the flag gets set for some reason, set this object to gone so it won't trigger.
        if (getObjectStatus(state, this.definition)) {
            this.status = 'gone';
        }
        this.time += FRAME_LENGTH;
        if (this.time < this.definition.delay) {
            return;
        }
        const hero = state.hero.activeClone || state.hero;
        if (rectanglesOverlap(this.getHitbox(state), hero.getHitbox(state))) {
            showMessage(state, this.definition.message);
            saveObjectStatus(state, this.definition);
            this.status = 'gone';
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (editingState.isEditing) {
            context.save();
                context.globalAlpha = 0.4;
                context.fillStyle = 'yellow';
                const hitbox = this.getHitbox(state);
                context.fillRect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
            context.restore();
        }
    }
}
