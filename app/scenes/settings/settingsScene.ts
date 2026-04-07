import {GAME_KEY} from 'app/gameConstants';
import {showChoiceScene} from 'app/scenes/choice/showChoiceScene';
import {showControlsScene} from 'app/scenes/controls/controlsScene';
import {isFieldSceneInStack} from 'app/scenes/field/showFieldScene';
import {pushScene} from 'app/scenes/sceneHash';
import {showTitleScene} from 'app/scenes/title/showTitleScene';
import {CANVAS_WIDTH, CANVAS_HEIGHT} from 'app/gameConstants';
import {parseScriptAsTextPage} from 'app/scriptEvents';
import {wasGameKeyPressed} from 'app/userInput';
import {clamp, fillRect, pad} from 'app/utils/index';
import {drawText,} from 'app/utils/simpleWhiteFont';
import {playSound } from 'app/utils/sounds';
import {updateAndExportSoundSettings} from 'app/utils/soundSettings';


const MARGIN = 20;
const WIDTH = CANVAS_WIDTH - 3 * MARGIN;
const ROW_HEIGHT = 20;

const textOptions = <const>{
    textBaseline: 'middle',
    textAlign: 'left',
    size: 16,
};

const musicVolume = 'MUSIC';
const effectsVolume = 'EFFECTS';
const muteAllSounds = 'MUTE ALL';
const viewControls = 'VIEW CONTROLS';
const returnToTitle = 'QUIT';


function getSettingsOptions(state: GameState): string[] {
    // add volume, other global game settings here
    const settingsOptions = [
        'RESUME',
        musicVolume,
        effectsVolume,
        muteAllSounds,
        viewControls,
    ];
    // only display 'FULLSCREEN' toggle if game is being played inside of Electron as a desktop app
    if (window.electronAPI && state.gameHasBeenInitialized) {
        settingsOptions.push('FULLSCREEN');
    }
    if (isFieldSceneInStack(state)) {
        settingsOptions.push(returnToTitle);
    }
    return settingsOptions;
}

export class SettingsScene implements GameScene {
    blocksInput = true;
    blocksUpdates = true;
    cursorIndex = 0;
    update(state: GameState, interactive: boolean) {
        if (wasGameKeyPressed(state, GAME_KEY.MENU) || wasGameKeyPressed(state, GAME_KEY.CANCEL)) {
            state.sceneStack.pop();
            return;
        }

        const options = getSettingsOptions(state);
        const selectedOption = options[this.cursorIndex];
        if (wasGameKeyPressed(state, GAME_KEY.UP)) {
            this.cursorIndex = (this.cursorIndex - 1 + options.length) % options.length;
            playSound('menuTick');
        } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
            this.cursorIndex = (this.cursorIndex + 1) % options.length;
            playSound('menuTick');
        }
        let delta = 0;
        if (wasGameKeyPressed(state, GAME_KEY.LEFT)) {
            delta = - 1;
        } else if (wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
            delta = 1;
        }
        if (delta !== 0) {
            switch (selectedOption) {
            case musicVolume:
                state.settings.musicVolume = clamp((state.settings.musicVolume ?? 1) + delta / 10, 0, 1);
                updateAndExportSoundSettings(state);
                playSound('menuTick');
                break;
            case effectsVolume:
                state.settings.soundVolume = clamp((state.settings.soundVolume ?? 1) + delta / 10, 0, 1);
                updateAndExportSoundSettings(state);
                playSound('menuTick');
                break;
            }
        }
        if (wasGameKeyPressed(state, GAME_KEY.CONFIRM)) {
            switch (selectedOption) {
            case viewControls:
                showControlsScene(state);
                playSound('menuTick');
                break;
            case returnToTitle:
                showChoiceScene(state, parseScriptAsTextPage(state, 'Return to Title?'),
                    [{
                        text: 'Yes',
                        activate(state: GameState) {
                            showTitleScene(state);
                        },
                    },{
                        text: 'No',
                        activate(state: GameState) {
                            state.sceneStack.pop();
                        },
                    }]
                )
                playSound('menuTick');
                break;
            case muteAllSounds:
                state.settings.muteAllSounds = !state.settings.muteAllSounds;
                updateAndExportSoundSettings(state);
                playSound('menuTick');
                break;
            case 'RESUME':
                state.sceneStack.pop();
                playSound('menuTick');
                break;
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        context.save();
        context.globalAlpha = 0.5;
        fillRect(context, {x:0, y:0, w:CANVAS_WIDTH, h:CANVAS_HEIGHT}, 'black');
        context.restore();

        // draw options in a black box with a white border
        // located in bottom right corner of screen
        const options = getSettingsOptions(state);
        const h = ROW_HEIGHT * options.length + 8;
        let r = {
            x: MARGIN * 1.5,
            y: MARGIN * 1.5,
            w: WIDTH,
            h,
        };
        fillRect(context, r, 'white');
        fillRect(context, pad(r, -2), 'black');

        r = pad(r, -4);

        let x = r.x + 20, y = r.y + ROW_HEIGHT / 2;
        for (let i = 0; i < options.length; i++) {
            let text = options[i];
            context.fillStyle = 'white';
            drawText(context, text, x, y, textOptions);
            if (text === musicVolume) {
                renderVolumeBar(context, {x: x + 80, y}, (state.settings.musicVolume ?? 1));
            }
            if (text === effectsVolume) {
                renderVolumeBar(context, {x: x + 80, y}, (state.settings.soundVolume ?? 1));
            }
            if (text === muteAllSounds) {
                const s = 12;
                const r = {x: x + 80, y: y - s / 2, w: s, h: s};
                fillRect(context, r, 'white');
                fillRect(context, pad(r, -1), 'black');
                if (state.settings.muteAllSounds) {
                    fillRect(context, pad(r, -1), '#0F0');
                }
            }
            if (this.cursorIndex === i) {
                // Draw an arrow next to the selected option.
                context.fillStyle = 'white';
                context.beginPath();
                context.moveTo(r.x + 8, y - 8);
                context.lineTo(r.x + 16, y);
                context.lineTo(r.x + 8, y + 8);
                context.fill();
            }
            y += 20;
        }
    }
}

const volumeTicks = 10;
function renderVolumeBar(context: CanvasRenderingContext2D, {x, y}: Point, volume: number) {
    volume = Math.round(volume * volumeTicks);
    for (let i = 0; i < volumeTicks; i++) {
        if (volume > i) {
            fillRect(context, {x: x + 5 * i, y: y - 12 / 2, w: 3, h: 12}, '#FFF');
        } else {
            fillRect(context, {x: x + 5 * i, y: y - 10 / 2, w: 1, h: 10}, '#888');
        }
    }
}

const settingsScene = new SettingsScene();
export function showSettingsScene(state: GameState) {
    pushScene(state, settingsScene);
    settingsScene.cursorIndex = 0;
}
