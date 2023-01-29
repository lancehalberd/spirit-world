import { activateTarget, getObjectStatus } from 'app/content/objects';
import { FRAME_LENGTH } from 'app/gameConstants';
import { showMessage } from 'app/render/renderMessage';
import { createAnimation, drawFrameAt, getFrame } from 'app/utils/animations';
import { findObjectInstanceById } from 'app/utils/findObjectInstanceById';
import { saveGame } from 'app/utils/saveGame';

import {
    AreaInstance, GameState, Frame, FrameAnimation, KeyBlockDefinition,
    ObjectInstance, ObjectStatus, Rect,
} from 'app/types';

const blockGeometry = {w: 32, h: 36, content: {x: 0, y: 4, w: 32, h: 32}};
const blockAnimationProperties = {
    cols: 13,
    duration: 5,
    frameMap: [0, 1, 1, 2, 3, 4, 5, 5, 5, 5, 5, 6, 7, 8, 9, 9, 10, 10, 11, 11, 12]
};
// The key block sticks up until it reaches frame 9.
const blockedDuration = blockAnimationProperties.frameMap.indexOf(9) * blockAnimationProperties.duration * FRAME_LENGTH;
const smallKeyBlockAnimation = createAnimation('gfx/tiles/locked_tile_small.png', blockGeometry, blockAnimationProperties, {loop: false});
const bigKeyBlockAnimation = createAnimation('gfx/tiles/locked_tile.png', blockGeometry, blockAnimationProperties, {loop: false});

export class KeyBlock implements ObjectInstance {
    area: AreaInstance;
    definition: KeyBlockDefinition;
    isObject = <const>true;
    x: number;
    y: number;
    status: ObjectStatus = 'locked';
    isNeutralTarget = true;
    isOpen = false;
    animation: FrameAnimation = null;
    animationTime = 0;
    constructor(state: GameState, definition: KeyBlockDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.status = this.definition.status;
        this.animation = this.status === 'bigKeyLocked' ? bigKeyBlockAnimation : smallKeyBlockAnimation;
        if (getObjectStatus(state, definition)) {
            // Remove opened keyblocks so they can be used as doors.
            this.isOpen = true;
            this.animationTime = this.animation.duration
        }
    }
    isCompletelyOpen() {
        return this.isOpen && this.animationTime >= blockedDuration;
    }
    getDrawPriority(state: GameState) {
        return this.isCompletelyOpen() ? 'background' : 'sprites';
    }
    getBehaviors(state: GameState) {
        return this.isCompletelyOpen() ? null : { solid: true };
    }
    getHitbox(state: GameState): Rect {
        return { x: this.x, y: this.y, w: 32, h: 32 };
    }
    tryToUnlock(state: GameState): boolean {
        if (this.isOpen) {
            return false;
        }
        const dungeonInventory = state.savedState.dungeonInventories[state.location.logicalZoneKey];
        if (this.status === 'locked' && dungeonInventory?.smallKeys) {
            dungeonInventory.smallKeys--;
            this.isOpen = true;
        } else if (this.status === 'bigKeyLocked' && dungeonInventory?.bigKey) {
            this.isOpen = true;
        } else {
            return false;
        }
        if (this.definition.id) {
            state.savedState.objectFlags[this.definition.id] = true;
            // Immediately save that the target object has been activated,
            // but wait for the animation to finsh before activating the target.
            // Saving the flag immediately is important in case the player leaves the screen
            // mid animation.
            if (this.definition.targetObjectId) {
                state.savedState.objectFlags[this.definition.targetObjectId] = true;
            }
        } else {
            console.error('Keyblock was missing an id', this);
            debugger;
        }
        saveGame(state);
        return true;
    }
    onGrab(state: GameState) {
        if (this.isOpen) {
            state.hero.action = null;
            return;
        }
        if (!this.tryToUnlock(state)) {
            if (this.status === 'bigKeyLocked') {
                showMessage(state, 'This device requires a special key.');
            } else if (this.status === 'locked') {
                showMessage(state, 'This device requires a key.');
            }
            state.hero.action = null;
        }
    }
    update(state: GameState) {
        if (this.isOpen && this.animationTime < this.animation.duration) {
            this.animationTime += FRAME_LENGTH;
            if (this.animationTime === blockedDuration && this.definition.targetObjectId) {
                const target = findObjectInstanceById(this.area, this.definition.targetObjectId, false);
                activateTarget(state, target);
            }
        }
    }
    render(context, state: GameState) {
        let frame: Frame = getFrame(this.animation, this.animationTime);
        if (!frame) {
            debugger;
        }
        drawFrameAt(context, frame, { x: this.x, y: this.y });
    }
}
