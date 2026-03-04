import {GAME_KEY} from 'app/gameConstants';
import {wasMenuConfirmKeyPressed, wasGameKeyPressed} from 'app/userInput';
import {renderControls} from 'app/scenes/controls/renderControls'
import {pushScene} from 'app/scenes/sceneHash';

// This simple pause scene will display when the player attempts to pause the game when
// the field menu should not be displayed.
export class ControlsScene implements GameScene {
    blocksInput = true;
    blocksUpdates = true;
    update(state: GameState, interactive: boolean) {
        if (wasMenuConfirmKeyPressed(state)
            || wasGameKeyPressed(state, GAME_KEY.MENU)
            || wasGameKeyPressed(state, GAME_KEY.MAP)
        ) {
            state.sceneStack.pop();
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        renderControls(context, state);
    }
}

const controlsScene = new ControlsScene();
export function showControlsScene(state: GameState) {
    pushScene(state, controlsScene);
}

export function toggleControlsScene(state: GameState) {
    if (state.sceneStack[state.sceneStack.length - 1] === controlsScene) {
        state.sceneStack.pop();
    } else {
        pushScene(state, controlsScene);
    }
}
