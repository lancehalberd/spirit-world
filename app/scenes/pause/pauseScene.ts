import {CANVAS_HEIGHT, GAME_KEY} from 'app/gameConstants';
import {drawOutlinedText} from 'app/utils/simpleWhiteFont';
import {KEY, isKeyboardKeyDown, wasGameKeyPressed} from 'app/userInput';
import {pushScene} from 'app/scenes/sceneHash';

// This simple pause scene will display when the player attempts to pause the game when
// the field menu should not be displayed.
export class PauseScene implements GameScene {
    blocksInput = true;
    blocksUpdates = true;
    wasAdvanceKeyPressed = false;
    update(state: GameState, interactive: boolean) {
        // Hack to detect single key press.
        const isAdvanceKeyPressed = isKeyboardKeyDown(KEY.PERIOD);
        this.blocksUpdates = this.blocksInput = !(isAdvanceKeyPressed && !this.wasAdvanceKeyPressed);
        this.wasAdvanceKeyPressed = isAdvanceKeyPressed;

        if (wasGameKeyPressed(state, GAME_KEY.MENU)) {
            state.sceneStack.pop()
            return;
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        // Remove the PAUSE text while holding shift in case we want to save a capture of the game.
        if (isKeyboardKeyDown(KEY.SHIFT)) {
            return;
        }
        drawOutlinedText(context, `PAUSED`, 8,  CANVAS_HEIGHT - 24, {
            textBaseline: 'top',
            textAlign: 'left',
            size: 16,
        });
    }
}

const pauseScene = new PauseScene();
export function showPauseScene(state: GameState) {
    pushScene(state, pauseScene);
}
