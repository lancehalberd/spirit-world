import { renderIndicator } from 'app/content/objects/indicator';
import { objectHash } from 'app/content/objects/objectHash';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { checkIfAllSwitchesAreActivated } from 'app/utils/switches';


const [emptyFrame, filledFrame] = createAnimation('gfx/objects/circulardepression.png', {w: 16, h: 16}, {cols: 2}).frames;

export class BallGoal implements ObjectInstance {
    area: AreaInstance;
    alwaysReset = true;
    behaviors: TileBehaviors = {
        blocksStaff: true,
        solid: false,
    };
    applyBehaviorsToGrid = true;
    drawPriority: DrawPriority = 'background';
    definition: BallGoalDefinition = null;
    x: number;
    y: number;
    isObject = <const>true;
    linkedObject: BallGoal;
    status: ObjectStatus = 'normal';
    disabled = false;
    showTrueSightIndicator = false;
    constructor(state: GameState, definition: BallGoalDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
    }
    getHitbox(): Rect {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
    activate(state: GameState): void {
        this.status = 'active';
        // Once a ball activates the goal, it fills the goal and it becomes solid.
        this.behaviors = { solid: true };
        if (!this.disabled) {
            checkIfAllSwitchesAreActivated(state, this.area, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const target = { ...emptyFrame, x: this.x, y: this.y };
        if (this.status === 'active') {
            drawFrame(context, filledFrame, target);
        } else {
            drawFrame(context, emptyFrame, target);
        }
        if (this.showTrueSightIndicator && state.hero.savedData.passiveTools.trueSight) {
            renderIndicator(context, this.getHitbox(), state.fieldTime);
        }
    }
}
objectHash.ballGoal = BallGoal;

class _BallGoal extends BallGoal {}
declare global {
    export interface BallGoal extends _BallGoal {}
}
