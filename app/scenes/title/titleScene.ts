import {CANVAS_WIDTH, CANVAS_HEIGHT, FRAME_LENGTH, GAME_KEY} from 'app/gameConstants';
import {setSaveFileToState} from 'app/scenes/fileSelect/setSaveFileToState';
import {sceneHash} from 'app/scenes/sceneHash';
import {showIntroScene} from 'app/scenes/intro/showIntroScene';
import {showPrologueScene} from 'app/scenes/prologue/showPrologueScene';
import {renderStandardFieldStack} from 'app/scenes/field/renderField';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import {requireImage} from 'app/utils/images';
import {fillRect, pad} from 'app/utils/index';
import {drawText} from 'app/utils/simpleWhiteFont';
import {playSound} from 'app/utils/sounds';

const WIDTH = 102;
const ROW_HEIGHT = 20;

const textOptions = <const>{
    textBaseline: 'middle',
    textAlign: 'left',
    size: 16,
};

function getTitleOptions(state: GameState): string[] {
    const titleMenu = ['START', 'SETTINGS'];
    // only display 'QUIT' if game is being played inside of Electron as a desktop app
    if (window.electronAPI && state.gameHasBeenInitialized) {
        return [...titleMenu, 'QUIT'];
    }
    return titleMenu;
}

export class TitleScene implements GameScene {
    capturesInput = true;
    idleTime = 0;
    menuIndex = 0;
    update(state: GameState) {
        const options = getTitleOptions(state);

        this.idleTime += FRAME_LENGTH;
        if (this.idleTime > 60000) {
            if (Math.random() < 0.5) {
                showPrologueScene(state);
            } else {
                showIntroScene(state);
            }
            return;
        }

        const selectedOption = options[this.menuIndex];
        if (wasGameKeyPressed(state, GAME_KEY.UP)) {
            this.menuIndex = (this.menuIndex - 1 + options.length) % options.length;
            playSound('menuTick');
            this.idleTime = 0;
        } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
            this.menuIndex = (this.menuIndex + 1) % options.length;
            playSound('menuTick');
            this.idleTime = 0;
        }
        if (wasConfirmKeyPressed(state)) {
            this.idleTime = 0;
            playSound('menuTick');
            switch (selectedOption) {
            case 'START':
                state.scene = 'fileSelect';
                setSaveFileToState(state, 0, 0);
                this.menuIndex = 0;
                break;
            case 'SETTINGS':
                state.scene = 'options';
                this.menuIndex = 0;
                break;
            case 'QUIT':
                console.log('quit game');
                // Will be implemented when the game is wrapped in Electron as a desktop app, unused now
                break;
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        renderStandardFieldStack(context, state);

        // draw options in a black box with a white border
        // located in bottom right corner of screen
        const options = getTitleOptions(state);
        const h = ROW_HEIGHT * options.length + 8;
        let r = {
            x: 7 * (CANVAS_WIDTH - WIDTH) / 8,
            y: CANVAS_HEIGHT - h - 16,
            w: WIDTH,
            h,
        };
        fillRect(context, r, 'white');
        fillRect(context, pad(r, -2), 'black');

        r = pad(r, -4);

        context.fillStyle = 'white';
        let x = r.x + 20, y = r.y + ROW_HEIGHT / 2;
        for (let i = 0; i < options.length; i++) {
            let text = options[i].slice(0, 13).toUpperCase();
            drawText(context, text, x, y, textOptions);
            if (this.menuIndex === i) {
                // Draw an arrow next to the selected option.
                context.beginPath();
                context.moveTo(r.x + 8, y - 8);
                context.lineTo(r.x + 16, y);
                context.lineTo(r.x + 8, y + 8);
                context.fill();
            }
            y += 20;
        }

        // Draw white title text as a dropshadow and gold title text on top of it
        // in top left corner of screen
        const goldText = requireImage('gfx/titleAssets/spiritquest-title-pixelperfect.png');
        const whiteText = requireImage('gfx/titleAssets/spiritquest-titlewhite-pixelperfect.png')

        const spiritWordDimensions = {x: 0, y: 0, height: 20, width: 52};
        const spiritWordDestination = {x: 26, y: 8, multiplier: 3}
        const questWordDimensions = {x: 53, y: 0, height: 20, width: 44};
        const questWordDestination = {
            x: spiritWordDestination.x - 20,
            y: (spiritWordDimensions.height * spiritWordDestination.multiplier) + spiritWordDestination.y,
            multiplier: 3
        };
        const whiteTextOffset = {x: 1, y: 1};
        context.drawImage(
            whiteText, spiritWordDimensions.x, spiritWordDimensions.y,
            spiritWordDimensions.width, spiritWordDimensions.height,
            spiritWordDestination.x + whiteTextOffset.x, spiritWordDestination.y + whiteTextOffset.y,
            spiritWordDestination.multiplier * spiritWordDimensions.width,
            spiritWordDestination.multiplier * spiritWordDimensions.height
        );
        context.drawImage(
            whiteText, questWordDimensions.x, questWordDimensions.y,
            questWordDimensions.width, questWordDimensions.height,
            questWordDestination.x + whiteTextOffset.x, questWordDestination.y + whiteTextOffset.y,
            questWordDestination.multiplier * questWordDimensions.width,
            questWordDestination.multiplier * questWordDimensions.height
        );
        context.drawImage(
            goldText, spiritWordDimensions.x, spiritWordDimensions.y,
            spiritWordDimensions.width, spiritWordDimensions.height,
            spiritWordDestination.x, spiritWordDestination.y,
            spiritWordDestination.multiplier * spiritWordDimensions.width,
            spiritWordDestination.multiplier * spiritWordDimensions.height
        );
        context.drawImage(
            goldText, questWordDimensions.x, questWordDimensions.y,
            questWordDimensions.width, questWordDimensions.height,
            questWordDestination.x, questWordDestination.y,
            questWordDestination.multiplier * questWordDimensions.width,
            questWordDestination.multiplier * questWordDimensions.height
        );
    }
}

sceneHash.title = new TitleScene();
