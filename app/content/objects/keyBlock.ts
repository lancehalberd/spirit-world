import { activateTarget, findObjectInstanceById, getObjectStatus } from 'app/content/objects';
import { showMessage } from 'app/render/renderMessage';
import { saveGame } from 'app/state';
import { createAnimation, drawFrame } from 'app/utils/animations';

import {
    AreaInstance, GameState, Direction, Frame, KeyBlockDefinition,
    ObjectInstance, ObjectStatus, Rect,
} from 'app/types';

const blockGeometry = {w: 16, h: 19, content: {x: 0, y: 3, w: 16, h: 16}};
const [smallKeyBlock] = createAnimation('gfx/tiles/signshort.png', blockGeometry).frames;
const [smallKeyBlockOpen] = createAnimation('gfx/tiles/shortsignspirit.png', blockGeometry).frames;
const [bigKeyBlock] = createAnimation('gfx/tiles/signtall.png', blockGeometry).frames;
const [bigKeyBlockOpen] = createAnimation('gfx/tiles/signtallspirit.png', blockGeometry).frames;

export class KeyBlock implements ObjectInstance {
    area: AreaInstance;
    definition: KeyBlockDefinition;
    drawPriority: 'sprites' = 'sprites';
    behaviors = {
        solid: true,
    };
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    isNeutralTarget = true;
    constructor(state: GameState, definition: KeyBlockDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        if (getObjectStatus(state, definition)) {
            // Remove opened keyblocks so they can be used as doors.
            this.status = this.definition.targetObjectId ? 'normal' : 'hidden';
        } else {
            this.status = this.definition.status;
        }
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    onPush(state: GameState, direction: Direction): void {
        if (direction === this.definition.d) {
            this.tryToUnlock(state);
        }
    }
    tryToUnlock(state: GameState): boolean {
        const dungeonInventory = state.savedState.dungeonInventories[state.location.zoneKey];
        if (this.status === 'locked' && dungeonInventory?.smallKeys) {
            dungeonInventory.smallKeys--;
        } else if (this.status === 'bigKeyLocked' && dungeonInventory?.bigKey) {
        } else {
            return false;
        }
        this.status = this.definition.targetObjectId ? 'normal' : 'hidden';
        if (this.definition.id) {
            state.savedState.objectFlags[this.definition.id] = true;
            if (this.definition.targetObjectId) {
                state.savedState.objectFlags[this.definition.targetObjectId] = true;
                const target = findObjectInstanceById(this.area, this.definition.targetObjectId, false);
                activateTarget(state, target);
            }
        } else {
            console.error('Keyblock was missing an id', this);
            debugger;
        }
        saveGame();
        return true;
    }
    onGrab(state: GameState) {
        if (!this.tryToUnlock(state)) {
            if (this.status === 'bigKeyLocked') {
                showMessage(state, 'This device requires a special key.');
                state.hero.action = null;
            } else if (this.status === 'locked') {
                showMessage(state, 'This device requires a key.');
                state.hero.action = null;
            }
        }
    }
    render(context, state: GameState) {
        if (this.status === 'hidden') {
            return;
        }
        let frame: Frame;
        if (this.definition.status === 'bigKeyLocked') {
            if (this.status === 'normal') {
                frame = bigKeyBlockOpen;
            } else {
                frame = bigKeyBlock;
            }
        } else if (this.definition.status === 'locked') {
            if (this.status === 'normal') {
                frame = smallKeyBlockOpen;
            } else {
                frame = smallKeyBlock;
            }
        }
        if (!frame) {
            debugger;
        }
        drawFrame(context, frame, { ...frame, x: this.x - frame.content.x, y: this.y - frame.content.y });
    }
}
