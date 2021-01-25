import { checkIfAllSwitchesAreActivated } from 'app/content/objects';
import { createAnimation, drawFrame } from 'app/utils/animations';

import {
    BallGoalDefinition, DrawPriority, GameState,
    ObjectInstance, ObjectStatus, ShortRectangle,
} from 'app/types';

const [emptyFrame, filledFrame] = createAnimation('gfx/tiles/circulardepression.png', {w: 16, h: 16}, {cols: 2}).frames;

export class BallGoal implements ObjectInstance {
    alwaysReset = true;
    behaviors = {
        solid: false,
    };
    drawPriority: DrawPriority = 'background';
    definition: BallGoalDefinition = null;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    constructor(definition: BallGoalDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(state: GameState): ShortRectangle {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    activate(state: GameState): void {
        this.status = 'active';
        // Once a ball activates the goal, it fills the goal and it becomes solid.
        this.behaviors = { solid: true };
        checkIfAllSwitchesAreActivated(state, this);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const target = { ...emptyFrame, x: this.x, y: this.y };
        if (this.status === 'active') {
            drawFrame(context, filledFrame, target);
        } else {
            drawFrame(context, emptyFrame, target);
        }
    }
}
