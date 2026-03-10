import {CANVAS_HEIGHT, CANVAS_WIDTH, GAME_KEY} from 'app/gameConstants';
import {showFieldScene} from 'app/scenes/field/showFieldScene';
import {sceneHash} from 'app/scenes/sceneHash';
import {fillRect, pad} from 'app/utils/index';
import {drawText} from 'app/utils/simpleWhiteFont';
import {
    fixProgressFlagsOnLoad,
    fixSpawnLocationOnLoad,
} from 'app/utils/fixState';
import {showTitleScene} from 'app/scenes/title/showTitleScene';
import {playSound} from 'app/utils/sounds';
import {wasGameKeyPressed, wasConfirmKeyPressed} from 'app/userInput';
import {returnToSpawnLocation} from 'app/utils/returnToSpawnLocation'

const WIDTH = CANVAS_WIDTH * 3 / 4;
const HEIGHT = 3 * CANVAS_HEIGHT / 8;

const textOptions = <const>{
    textBaseline: 'middle',
    textAlign: 'left',
    size: 16,
};

export class DefeatedMenuScene implements GameScene {
    sceneType = 'field';
    blocksInput = true;
    blocksUpdates = true;
    cursorIndex = 0;
    update(state: GameState) {
        if (wasGameKeyPressed(state, GAME_KEY.UP)) {
            this.cursorIndex = (this.cursorIndex + 1) % 2;
            playSound('tick');
        } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
            this.cursorIndex = (this.cursorIndex + 1) % 2;
            playSound('tick');
        } else if (wasConfirmKeyPressed(state)) {
            if (this.cursorIndex === 0) {
                fixProgressFlagsOnLoad(state);
                fixSpawnLocationOnLoad(state);
                returnToSpawnLocation(state);
                showFieldScene(state);
            } else if (this.cursorIndex === 1) {
                showTitleScene(state);
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        let r = {
            x: (CANVAS_WIDTH - WIDTH) / 2,
            y: CANVAS_HEIGHT - HEIGHT - 16,
            w: WIDTH,
            h: HEIGHT,
        };

        fillRect(context, r, 'white');
        fillRect(context, pad(r, -2), 'black');

        r = pad(r, -4);

        let x = r.x + 20, y = r.y + r.h / 4 - 2;
        drawText(context, 'TRY AGAIN?', x, y + 2, textOptions);

        x += 16;
        y = r.y + r.h * 2 / 4 + 2;
        let selectedY = y;
        drawText(context, 'CONTINUE', x, y + 2, textOptions);

        y = r.y + r.h * 3 / 4 + 2;
        if (this.cursorIndex === 1) {
            selectedY = y;
        }
        drawText(context, 'QUIT', x, y + 2, textOptions);

        // Draw an arrow next to the selected option.
        context.fillStyle = 'white';
        context.beginPath();
        context.moveTo(x - 12, selectedY - 8);
        context.lineTo(x - 4, selectedY);
        context.lineTo(x - 12, selectedY + 8);
        context.fill();
    }
}

sceneHash.defeatedMenu = new DefeatedMenuScene();
