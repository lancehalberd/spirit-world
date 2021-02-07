import {
    changeObjectStatus,
    checkIfAllSwitchesAreActivated,
    deactivateTargets,
    findObjectInstanceById,
} from 'app/content/objects';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { rectanglesOverlap } from 'app/utils/index';

import {
    FloorSwitchDefinition, GameState,
    ObjectInstance, ObjectStatus, ShortRectangle,
} from 'app/types';

const [upFrame, downFrame] = createAnimation('gfx/tiles/toggletiles.png', {w: 16, h: 16}, {cols: 2}).frames;

export class FloorSwitch implements ObjectInstance {
    drawPriority: 'background' = 'background';
    definition: FloorSwitchDefinition = null;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    constructor(definition: FloorSwitchDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x + 2, y: this.y + 2, w: 12, h: 12 };
    }
    isDepressed(state: GameState): boolean {
        const hitbox = this.getHitbox(state);
        if (rectanglesOverlap(state.hero, hitbox)) {
            return true;
        }
        for (const object of state.areaInstance.objects) {
            if (object === this || !object.getHitbox) {
                continue;
            }
            if (rectanglesOverlap(object.getHitbox(state), hitbox)) {
                return true;
            }
        }
        return false;
    }
    onToggle(state: GameState): void {
        if (this.status === 'active') {
            this.status = 'normal';
        } else {
            this.status = 'active';
        }
        if (this.definition.toggleOnRelease && this.definition.targetObjectId) {
            if (this.status === 'active') {
                checkIfAllSwitchesAreActivated(state, this);
            } else {
                deactivateTargets(state, this.definition.targetObjectId);
            }
            return;
        }
        // Don't apply the toggle effect on release unless toggleOnRelease is true.
        if (this.status === 'normal' && !this.definition.toggleOnRelease) {
            return;
        }
        if (this.definition.targetObjectId) {
            const object = findObjectInstanceById(state.areaInstance, this.definition.targetObjectId);
            this.toggleTargetStatus(state, object);
        } else {
            for (const object of state.areaInstance.objects) {
                this.toggleTargetStatus(state, object);
            }
        }
    }
    toggleTargetStatus(state: GameState, target: ObjectInstance): void {
        if (target.status === 'hiddenSwitch' || target.status === 'closedSwitch') {
            changeObjectStatus(state, target, 'normal');
        } else if (target.definition.status === 'closedSwitch') {
            changeObjectStatus(state, target, 'closedSwitch');
        }
    }

    update(state: GameState) {
        if (this.status === 'active' && !this.isDepressed(state)) {
            this.onToggle(state);
        } else if (this.status === 'normal' && this.isDepressed(state)) {
            this.onToggle(state);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.status === 'active') {
            drawFrame(context, downFrame, {...downFrame, x: this.x, y: this.y});
        } else {
            drawFrame(context, upFrame, {...upFrame, x: this.x, y: this.y});
        }
    }
}
