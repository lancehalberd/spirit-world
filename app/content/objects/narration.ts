import { getObjectStatus, saveObjectStatus } from 'app/content/objects';
import { FRAME_LENGTH } from 'app/gameConstants';
import { setScript } from 'app/scriptEvents';
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
    isObject = <const>true;
    x: number;
    y: number;
    ignorePits = true;
    status: ObjectStatus = 'normal';
    trigger: NarrationDefinition['trigger'];
    time: number;
    previewColor = 'yellow';
    constructor(state: GameState, definition: NarrationDefinition) {
        this.definition = definition;
        this.trigger = definition.trigger || 'touch';
        this.x = definition.x;
        this.y = definition.y;
        if (seed || getObjectStatus(state, this.definition)) {
            this.status = 'gone';
        }
        this.time = 0;
    }
    isActive(state: GameState) {
        return this.status === 'gone';
    }
    onActivate(state: GameState) {
        if (this.status !== 'gone' && this.trigger === 'activate') {
            this.runScript(state);
        }
    }
    onEnterArea(state: GameState): void {
        if (this.status !== 'gone' && this.trigger === 'enterSection') {
            this.runScript(state);
        }
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: this.definition.w, h: this.definition.h };
    }
    runScript(state: GameState): void {
        setScript(state, this.definition.message);
        saveObjectStatus(state, this.definition);
        this.status = 'gone';
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
        if (this.trigger === 'touch') {
            // This 'knocked' check is a hack to prevent triggering narration while falling.
            if (state.hero.action !== 'knocked' && state.hero.action !== 'jumpingDown'
                && rectanglesOverlap(this.getHitbox(state), state.hero.getHitbox(state))
            ) {
                this.runScript(state);
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
    }
}
