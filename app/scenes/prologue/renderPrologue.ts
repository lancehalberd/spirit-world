import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { createAnimation, drawFrameAt, getFrame } from 'app/utils/animations';
import { fillRect } from 'app/utils/index';
import { requireFrame } from 'app/utils/packedImages';

const scrollAnimation = createAnimation('gfx/prologue/scrollAnimation.png', {w: 256, h: 30},
    {rows: 3, duration: 3}, {loop: true}
);
const scrollFrame = requireFrame('gfx/prologue/scroll.png', {x: 0, y: 0, w: 256, h: 1307});
const lowerScroll = requireFrame('gfx/prologue/lowerScroll.png', {x: 0, y: 0, w: 256, h: 224});


// scroll rolls up from the bottom of the screen revealing the image underneath it and going off the top of the screen.
const initialPause = 1000;
const unrollDuration = 1000;
const pauseDuration = 6000;
const panStartY = 1280 - 224, panEndY = 64;
const panFramesPerPixel = 3;
// const panDuration = panFramesPerPixel * (panStartY - panEndY) * 20;


export function renderPrologue(context: CanvasRenderingContext2D, state: GameState): void {
    let r = {x: 0, y: 0, w: CANVAS_WIDTH, h: CANVAS_HEIGHT};
    fillRect(context, r, 'black');
    const unrollTime = Math.max(0, state.prologueTime - initialPause);
    const unrollP = unrollTime / unrollDuration;
    const unrollY = 87 - Math.floor(144 * unrollP);
    const pauseTime = unrollTime - unrollDuration;
    const panTime = pauseTime - pauseDuration;

    // Initially we only render the portion of the scroll that is below the unrolling scroll animation.
    const scrollH = Math.floor(224 * unrollP) + 70;
    const scrollY = unrollY + 15;
    // Render the main scroll on the bottom
    if (scrollH + scrollY < scrollFrame.h - panStartY) {
        drawFrameAt(context, {...scrollFrame, y: scrollFrame.h - scrollH, h: scrollH}, {x: 0, y: scrollY});
    } else {
        let panY = panStartY;
        if (panTime > 0) {
            //panY = panStartY + Math.floor((panEndY - panStartY) * Math.min(1, panTime / panDuration));
            const pixels = Math.floor(panTime / 20 / panFramesPerPixel);
            panY = Math.max(panEndY, panY - pixels);
        }
        drawFrameAt(context, {...scrollFrame, y: panY, h: 224}, {x: 0, y: 0});
    }

    if (unrollTime > unrollDuration - 500 && unrollTime < unrollDuration + 500) {
        context.save();
            context.globalAlpha *= Math.min(1, (unrollTime - (unrollDuration - 500)) / 1000);
            drawFrameAt(context, lowerScroll, {x: 0, y: 0});
        context.restore();
    } else if (unrollTime >= unrollDuration) {
        drawFrameAt(context, lowerScroll, {x: 0, y: 0});
    }
    const textTime = unrollTime - unrollDuration - 500;
    let startTime = 0, duration = 4500, longDuration = 7000, pause = 500, sectionPause = 500, lineHeight = 20;
    renderFadeInText(context, 'Long ago,', textTime, startTime, duration);
    renderFadeInText(context, 'Humans and Vanara', textTime, startTime, duration, lineHeight);
    startTime += duration + pause;
    renderFadeInText(context, 'Lived in harmony with the Spirits.', textTime, startTime, duration, 10);
    //renderFadeInText(context, 'the Spirit World.', textTime, startTime, duration, lineHeight);
    startTime += duration + sectionPause;

    renderFadeInText(context, 'But one day,', textTime, startTime, duration);
    renderFadeInText(context, 'a foolish and greedy Vanara', textTime, startTime, duration, lineHeight);
    startTime += duration + pause;
    renderFadeInText(context, 'stole the power of the Spirits', textTime, startTime, longDuration);
    renderFadeInText(context, 'and tried to enslave the world.', textTime, startTime, longDuration, lineHeight);
    startTime += longDuration + sectionPause;
    //renderFadeInText(context, 'and tried to enslave', textTime, startTime, duration);
    //renderFadeInText(context, 'the world.', textTime, startTime, duration, lineHeight);
    //startTime += duration + sectionPause;

    renderFadeInText(context, 'But just when it seemed', textTime, startTime, duration);
    renderFadeInText(context, 'that all hope was lost,', textTime, startTime, duration, lineHeight);
    startTime += duration + pause;
    renderFadeInText(context, 'The Spirit Gods sent', textTime, startTime, duration);
    renderFadeInText(context, 'a brave Champion', textTime, startTime, duration, lineHeight);
    startTime += duration + pause;
    renderFadeInText(context, 'to defeat the Monkey King', textTime, startTime, duration);
    renderFadeInText(context, 'and free the world.', textTime, startTime, duration, lineHeight);
    startTime += duration + sectionPause;

    renderFadeInText(context, 'To protect the future', textTime, startTime, duration);
    renderFadeInText(context, 'of both worlds', textTime, startTime, duration, lineHeight);
    startTime += duration + pause;
    renderFadeInText(context, 'The Jade Champion sealed', textTime, startTime, duration);
    renderFadeInText(context, 'the Spirit World', textTime, startTime, duration, lineHeight);
    startTime += duration + pause;
    renderFadeInText(context, 'and trained her descendants', textTime, startTime, duration);
    renderFadeInText(context, 'to protect the balance.', textTime, startTime, duration, lineHeight);
    startTime += duration + sectionPause;

    renderFadeInText(context, 'For who knows what', textTime, startTime, duration);
    renderFadeInText(context, 'disasters might come,', textTime, startTime, duration, lineHeight);
    startTime += duration + pause;
    renderFadeInText(context, 'if ever there was', textTime, startTime, duration);
    renderFadeInText(context, 'another foolish enough', textTime, startTime, duration, lineHeight);
    startTime += duration + pause;
    // Extra long duration here to keep this text on screen as it fades to black.
    renderFadeInText(context, 'to unlock the powers', textTime, startTime, 10 * duration);
    renderFadeInText(context, 'of the Spirit World...', textTime, startTime, 10 * duration, lineHeight);
    startTime += duration + sectionPause;

    if (unrollTime < unrollDuration) {
        // The unrolling scroll animation is drawn on top of the scroll as it reveals it.
        const frame = getFrame(scrollAnimation, unrollTime);
        drawFrameAt(context, frame, {x: 0, y: unrollY});
    }


    if (textTime >= startTime) {
        context.save();
        context.globalAlpha *= Math.min(1, (textTime - startTime) / 2000);
        context.fillStyle = 'black';
        context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.restore();
    }

}

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
}
