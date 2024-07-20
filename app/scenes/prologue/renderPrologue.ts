import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { createAnimation, drawFrameAt, getFrame } from 'app/utils/animations';
import { fillRect } from 'app/utils/index';
import { drawText } from 'app/utils/simpleWhiteFont';
import { requireFrame } from 'app/utils/packedImages';


const scrollAnimation = createAnimation('gfx/prologue/scrollAnimation.png', {w: 256, h: 30},
    {rows: 3, duration: 3}, {loop: true}
);
const scrollFrame = requireFrame('gfx/prologue/scroll.png', {x: 0, y: 0, w: 256, h: 1307});
const lowerScroll = requireFrame('gfx/prologue/lowerScroll.png', {x: 0, y: 0, w: 256, h: 224});


// scroll rolls up from the bottom of the screen revealing the image underneath it and going off the top of the screen.
const unrollDuration = 2000;
const pauseDuration = 6000;
const panStartY = 1280 - 224, panEndY = 64;
const panFramesPerPixel = 3;
// const panDuration = panFramesPerPixel * (panStartY - panEndY) * 20;


export function renderPrologue(context: CanvasRenderingContext2D, state: GameState): void {
    let r = {x: 0, y: 0, w: CANVAS_WIDTH, h: CANVAS_HEIGHT};
    fillRect(context, r, 'black');
    const unrollTime = state.prologueTime;
    const unrollP = state.prologueTime / unrollDuration;
    const unrollY = 224 - Math.floor(254 * unrollP);
    const pauseTime = state.prologueTime - unrollDuration;
    const panTime = pauseTime - pauseDuration;

    // Render the main scroll on the bottom
    if (unrollTime < unrollDuration) {
        // Initially we only render the portion of the scroll that is below the unrolling scroll animation.
        const scrollY = unrollY + 15;
        if (scrollY < 224) {
            drawFrameAt(context, {...scrollFrame, y: panStartY + scrollY, h: 224 - scrollY}, {x: 0, y: scrollY});
        }
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
    const textTime = state.prologueTime - unrollDuration - 500;
    let startTime = 0, duration = 4500, pause = 500, sectionPause = 500, lineHeight = 18;
    renderFadeInText(context, 'Long ago,', textTime, startTime, duration);
    renderFadeInText(context, 'Humans and Vanara', textTime, startTime, duration, lineHeight);
    startTime += duration + pause;
    renderFadeInText(context, 'Lived in harmony with', textTime, startTime, duration);
    renderFadeInText(context, 'the Spirit World.', textTime, startTime, duration, lineHeight);
    startTime += duration + sectionPause;

    renderFadeInText(context, 'But one day,', textTime, startTime, duration);
    renderFadeInText(context, 'a foolish and greedy Vanara', textTime, startTime, duration, lineHeight);
    startTime += duration + pause;
    renderFadeInText(context, 'stole the power', textTime, startTime, duration);
    renderFadeInText(context, 'of the Spirit World', textTime, startTime, duration, lineHeight);
    startTime += duration + pause;
    renderFadeInText(context, 'and tried to enslave', textTime, startTime, duration);
    renderFadeInText(context, 'the world.', textTime, startTime, duration, lineHeight);
    startTime += duration + sectionPause;

    renderFadeInText(context, 'Just when it seemed', textTime, startTime, duration);
    renderFadeInText(context, 'that all hope was lost', textTime, startTime, duration, lineHeight);
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
    renderFadeInText(context, 'disasters might come', textTime, startTime, duration, lineHeight);
    startTime += duration + pause;
    renderFadeInText(context, 'if ever there was ', textTime, startTime, duration);
    renderFadeInText(context, 'another foolish enough', textTime, startTime, duration, lineHeight);
    startTime += duration + pause;
    renderFadeInText(context, 'to unlock the powers', textTime, startTime, 10 * duration);
    renderFadeInText(context, 'of the Spirit World?', textTime, startTime, 10 * duration, lineHeight);
    startTime += duration + sectionPause;

    if (unrollTime < unrollDuration) {
        // The unrolling scroll animation is drawn on top of the scroll as it reveals it.
        const frame = getFrame(scrollAnimation, state.prologueTime);
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
        drawText(context, text, 128, 184 + yOffset, {textAlign: 'center', maxWidth: 240, textBaseline: 'top'});
    context.restore();
}
