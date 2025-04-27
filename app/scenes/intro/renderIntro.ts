import {CANVAS_WIDTH, CANVAS_HEIGHT} from 'app/gameConstants';
import {FADE_TIME, FULL_PANEL_DURATION} from 'app/scenes/intro/updateIntro';
import {drawFrameAt} from 'app/utils/animations';
import {fillRect} from 'app/utils/index';
import {requireFrame} from 'app/utils/packedImages';
import {drawOutlinedText} from 'app/utils/simpleWhiteFont';

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

export function renderIntro(context: CanvasRenderingContext2D, state: GameState): void {
    let r = {x: 0, y: 0, w: CANVAS_WIDTH, h: CANVAS_HEIGHT};
    fillRect(context, r, 'black');
    const panelIndex = Math.floor(state.prologueTime / FULL_PANEL_DURATION);
    const panelTime = state.prologueTime % FULL_PANEL_DURATION;
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
/*
function renderFadeInText(
    context: CanvasRenderingContext2D,
    text: string,
    time: number,
    start: number,
    duration: number,
    yOffset: number = 0,
) {
    if (time < start || time > start + duration) {
        return;
    }
    const fadeInDuration = 1000, fadeOutDuration = 1000;
    const fadeInTime = time - start;
    const fadeOutTime = time - (start + duration - fadeOutDuration);
    const alpha = Math.min(Math.min(1, Math.max(0, fadeInTime / fadeInDuration)), Math.max(0, 1 - fadeOutTime / fadeOutDuration));
    context.save();
        context.globalAlpha *= alpha;
        context.font = '15px PixelScript';
        context.textAlign = 'center';
        context.textBaseline = 'top';
        // Text metrics do not match between Safari and Chrome/FF and Safari renders this text too low.
        // This will render the text a bit higher on Safari so that it doesn't go off the bottom of the screen.
        if (context.measureText('H').fontBoundingBoxAscent < 5) {
            yOffset -= 5;
        }
        context.fillText(text, 128, 186 + yOffset);
        //drawText(context, text, 128, 186 + yOffset, {textAlign: 'center', maxWidth: 240, textBaseline: 'top'});
    context.restore();
}*/
