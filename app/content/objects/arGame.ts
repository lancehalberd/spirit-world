import {objectHash} from 'app/content/objects/objectHash';
import {showMessage} from 'app/scriptEvents';
import {drawFrameContentAt, getFrameHitbox} from 'app/utils/animations';
import {arDevice} from 'app/content/loot';


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
        return getFrameHitbox(arDevice, this);
    }
    isVisible(state: GameState): boolean {
        return state.hero.savedData.passiveTools.spiritSight > 0 && !state.arState.active
    }
    onGrab(state: GameState) {
        if (!this.isVisible(state)) {
            return;
        }
        state.arState.scene = 'choose';
        if (this.definition.id === 'heroesAR') {
            state.arState.scene = 'hota';
        }
        showMessage(state, '{@arGame.start}');
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (!this.isVisible(state)) {
            return;
        }
        drawFrameContentAt(context, arDevice, this);
    }
}
objectHash.arGame = ARGame;
