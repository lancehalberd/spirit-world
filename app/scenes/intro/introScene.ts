import {FRAME_LENGTH, GAME_KEY} from 'app/gameConstants';
import {CANVAS_WIDTH, CANVAS_HEIGHT} from 'app/gameConstants';
import {sceneHash} from 'app/scenes/sceneHash';
import {showTitleScene} from 'app/scenes/title/showTitleScene';
import {isGameKeyDown, isKeyboardKeyDown, KEY, wasGameKeyPressed, wasMenuConfirmKeyPressed} from 'app/userInput';
import {drawFrameAt} from 'app/utils/animations';
import {fillRect} from 'app/utils/index';
import {requireFrame} from 'app/utils/packedImages';
import {drawOutlinedText} from 'app/utils/simpleWhiteFont';
import {isATrackPlaying} from 'app/utils/sounds';

const panels = [
    requireFrame('gfx/prologue/panel1.png', {x: 0, y: 0, w: 256, h: 224}),
    requireFrame('gfx/prologue/panel2.png', {x: 0, y: 0, w: 256, h: 224}),
    requireFrame('gfx/prologue/panel3.png', {x: 0, y: 0, w: 256, h: 224}),
    requireFrame('gfx/prologue/panel4.png', {x: 0, y: 0, w: 256, h: 224}),
    requireFrame('gfx/prologue/panel5.png', {x: 0, y: 0, w: 256, h: 224}),
    requireFrame('gfx/prologue/panel6.png', {x: 0, y: 0, w: 256, h: 224}),
];
const textLines = [
    ['Long ago,', 'Humans and Vanara', 'Lived in harmony', 'with the Spirits'],
    ['But one day,', 'a Greedy Vanara', 'stole the power', 'of the Spirits', 'and tried to',  'enslave the world'],
    ['But just when it seemed', 'that all hope was lost,', 'The Spirit Gods sent', 'a brave Champion'],
    ['to defeat the Monkey King', 'and free the world'],
    ['To protect the future', 'of both worlds', 'The Jade Champion sealed', 'the Spirit World and', 'trained her descendants', 'to protect the balance'],
    ['For who knows what', 'disasters might come,', 'if there was another',  'foolish enough', 'to unlock the powers', 'of the Spirit World...'],
];

const FADE_TIME = 1500;
const PANEL_DURATION = 7000;
const FULL_PANEL_DURATION = (2 * FADE_TIME + PANEL_DURATION);
// 6 panels, each fades in+out.
const INTRO_DURATION = 6 * FULL_PANEL_DURATION;

export class IntroScene implements GameScene {
    capturesInput = true;
    prologueTime = 0;
    update(state: GameState) {
        if (isKeyboardKeyDown(KEY.SHIFT)) {
            if (isGameKeyDown(state, GAME_KEY.LEFT)) {
                this.prologueTime -= 5 * FRAME_LENGTH;
            } else if (isGameKeyDown(state, GAME_KEY.RIGHT)) {
                this.prologueTime += 5 * FRAME_LENGTH;
            } else if (isGameKeyDown(state, GAME_KEY.UP)) {
                this.prologueTime += 25 * FRAME_LENGTH;
            } else  if (isGameKeyDown(state, GAME_KEY.DOWN)) {
                this.prologueTime -= 25 * FRAME_LENGTH;
            }
        } else {
            if (this.prologueTime < 1000 && !isATrackPlaying() && !state.settings.muteAllSounds) {
                // Delay longer if the music hasn't started playing (unless the game is muted).
                this.prologueTime += FRAME_LENGTH / 4;
            } else {
                this.prologueTime += FRAME_LENGTH;
            }
        }
        this.prologueTime = Math.max(0, this.prologueTime);
        // This timestamp needs to be kept in sync with the rendering code so that we switch
        // to the title shortly after the prologue fades to black.
        if (this.prologueTime >= INTRO_DURATION
            || wasMenuConfirmKeyPressed(state)
            || wasGameKeyPressed(state, GAME_KEY.MENU)
            || wasGameKeyPressed(state, GAME_KEY.MAP)
        ) {
            showTitleScene(state);
            return;
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        let r = {x: 0, y: 0, w: CANVAS_WIDTH, h: CANVAS_HEIGHT};
        fillRect(context, r, 'black');
        const panelIndex = Math.floor(this.prologueTime / FULL_PANEL_DURATION);
        const panelTime = this.prologueTime % FULL_PANEL_DURATION;
        const opacity = Math.min(
            // Max opacity is 1
            1,
            // Fade in from 0 to 1 over the interval [0, FADE_TIME]
            panelTime / FADE_TIME,
            // Fade out from 1 to 0, over the intervale [FULL_PANEL_DURATION - FADE_TIME, FULL_PANEL_DURATION]
            (FULL_PANEL_DURATION - panelTime) / FADE_TIME
        ) ** 2;
        const panelFrame = panels[panelIndex];
        context.save();
            context.globalAlpha *= opacity;
            drawFrameAt(context, panelFrame, r);
        context.restore();
        const textOpacity = Math.max(0, Math.min(
            // Max opacity is 1
            1,
            // Fade in from 0 to 1 over the interval [0, FADE_TIME]
            (panelTime - FADE_TIME - 1000) / 500,
            // Fade out from 1 to 0, over the intervale [FULL_PANEL_DURATION - FADE_TIME, FULL_PANEL_DURATION]
            (FULL_PANEL_DURATION - panelTime) / 500
        ));
        context.save();
            context.globalAlpha *= textOpacity;
            const panelLines = textLines[panelIndex];
            for (let i = 0; i < panelLines.length; i++) {
                const line = panelLines[i];
                drawOutlinedText(context, line, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20 * (panelLines.length - i), {textAlign: 'center', textBaseline: 'middle'});
            }
        context.restore();
    }
}

sceneHash.intro = new IntroScene();

