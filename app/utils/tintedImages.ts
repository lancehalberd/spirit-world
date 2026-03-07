import {createCanvasAndContext} from 'app/utils/canvas';
import {drawFrame} from 'app/utils/animations';

interface Tint {
    color: string
    amount: number
}

// Currently this needs to be as large as the largest image we will tint in each dimension
// In theory this is to improve performance, but I'm not sure this is actually useful.
const [globalTintCanvas, globalTintContext] = createCanvasAndContext(300, 300);
globalTintContext.imageSmoothingEnabled = false;

// Cache of solid tinted images to avoid recreating them each time they are used.
const tintedImages: Map<FrameImage, {[key in string]: Frame}> = new Map();
export function getSolidTintedImage(tint: string, frame: Frame): Frame {
    const tintMap = tintedImages.get(frame.image) ?? {};
    const key = tint + '-' + [frame.x,frame.y,frame.h,frame.w].join('-');
    if (tintMap[key]) {
        return tintMap[key];
    }
    tintedImages.set(frame.image, tintMap);
    // console.log('Creating new tinted image', key, frame.image);
    const [tintCanvas, tintContext] = createCanvasAndContext(frame.w, frame.h);
    const target = {x: 0, y: 0, w: frame.w, h: frame.h};
    drawNewSolidTintedImage(tintContext, tint, frame, target);
    const tintedFrame = {
        image: tintCanvas,
        ...target,
    };
    tintMap[key] = tintedFrame;
    return tintedFrame;
}

function drawNewSolidTintedImage(context: CanvasRenderingContext2D, tint: string, frame: Frame, target: Rect) {
    // First make a solid color in the shape of the image to tint.
    globalTintContext.save();
    globalTintContext.fillStyle = tint;
    globalTintContext.clearRect(0, 0, frame.w, frame.h);
    const tintRectangle = {x: 0, y: 0, w: frame.w, h: frame.h};
    drawFrame(globalTintContext, frame, tintRectangle);
    globalTintContext.globalCompositeOperation = "source-in";
    globalTintContext.fillRect(0, 0, frame.w, frame.h);
    drawFrame(context, { image: globalTintCanvas, ...tintRectangle}, target);
    globalTintContext.restore();
}


export function drawSolidTintedImage(context: CanvasRenderingContext2D, tint: string, frame: Frame, target: Rect) {
    const solidFrame = getSolidTintedImage(tint, frame);
    drawFrame(context, solidFrame, target);
}

export function drawTintedImage(context: CanvasRenderingContext2D, {color, amount}: Tint, frame: Frame, target: Rect): void {
    // First make a solid color in the shape of the image to tint.
    const solidFrame = getSolidTintedImage(color, frame);
    // Next draw the untinted image to the target.
    drawFrame(context, frame, target);
    // Finally draw the tint color on y of the target with the desired opacity.
    const oldAlpha = context.globalAlpha;
    context.globalAlpha *= amount; // This needs to be multiplicative since we might be drawing a partially transparent image already.
    drawFrame(context, solidFrame, target);
    context.globalAlpha = oldAlpha;
}
