import {objectHash} from 'app/content/objects/objectHash';
import {showARGameScene} from 'app/scenes/arGame/arGameScene';
import {showChoiceScene} from 'app/scenes/choice/showChoiceScene';
import {appendCallback, parseScriptAsTextPage, showMessage} from 'app/scriptEvents';
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
    constructor(state: GameState, public definition: ARGameDefinition) {}
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
        if (!this.definition.gameId) {
            showMessage(state, `It's an AR device, but it doesn't seem to be working.`);
            return;
        }
        showMessage(state, `It's an AR device`);
        appendCallback(state, state => {
            showChoiceScene(state, parseScriptAsTextPage(state, 'Play AR?'),
                [{
                    text: 'Yes',
                    activate: (state: GameState) => {
                        showARGameScene(state, this.definition.gameId);
                    },
                },{
                    text: 'No',
                    activate(state: GameState) {
                        return;
                    },
                }]
            );
        });
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (!this.isVisible(state)) {
            return;
        }
        drawFrameContentAt(context, arDevice, this);
    }
}
objectHash.arGame = ARGame;
