import {objectHash} from 'app/content/objects/objectHash';
import {showMessage} from 'app/scriptEvents';
import {createAnimation, drawFrameContentAt, getFrameHitbox} from 'app/utils/animations';


const headsetFrame = createAnimation('gfx/objects/furniture/dishware.png',
    {w: 16, h: 16}, {top: 128, cols: 2}
).frames[0];


export class ARGame implements ObjectInstance {
    area: AreaInstance;
    drawPriority: 'background' = 'background';
    isObject = <const>true;
    x = this.definition.x;
    y = this.definition.y;
    charge = 1;
    chargeStage = 0;
    status: ObjectStatus = 'normal';
    constructor(state: GameState, public definition: SimpleObjectDefinition) {}
    getBehaviors(state: GameState): TileBehaviors {
        if (!this.isVisible(state)) {
            return {}
        }
        return {
            solid: true,
        };
    }
    getHitbox(): Rect {
        return getFrameHitbox(headsetFrame, this);
    }
    isVisible(state: GameState): boolean {
        return state.hero.savedData.passiveTools.spiritSight > 0 && !state.arState.active
    }
    onGrab(state: GameState) {
        if (!this.isVisible(state)) {
            return;
        }
        showMessage(state, '{@arGame.start}');
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (!this.isVisible(state)) {
            return;
        }
        drawFrameContentAt(context, headsetFrame, this);
    }
}
objectHash.arGame = ARGame;
