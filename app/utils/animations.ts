import { FRAME_LENGTH } from 'app/gameConstants';
import { createCanvas, createCanvasAndContext, debugCanvas, drawCanvas } from 'app/utils/canvas';
import { requireFrame } from 'app/utils/packedImages';

export function frame(
    x: number, y: number, w: number, h: number,
    content: Rect = null
): FrameRectangle {
    return {x, y, w, h, content};
}

// Make a single frame into an FrameAnimation.
export function frameAnimation(frame: Frame): FrameAnimation {
    return {frames: [frame], frameDuration: 1, duration: 1};
}

export function framesAnimation(frames: Frame[], duration = 8, props: ExtraAnimationProperties = {}): FrameAnimation {
    return {frames, frameDuration: duration, ...props, duration: FRAME_LENGTH * frames.length * duration};
}

export function createAnimation(
    source: string | HTMLImageElement | HTMLCanvasElement,
    dimensions: FrameDimensions,
    {x = 0, y = 0, rows = 1, cols = 1, xSpace = 0, ySpace = 0, top = 0, left = 0, duration = 8, frameMap = null}: CreateAnimationOptions = {},
    props: ExtraAnimationProperties = {},
): FrameAnimation {
    let frames: Frame[] = [];
    let frame: Frame;
    if (typeof source === 'string') {
        frame = requireFrame(source);
    } else {
        frame = {image: source, x: 0, y: 0, w: 0, h: 0};
    }
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            frames[row * cols + col] = {
                ...dimensions,
                image: frame.image,
                x: frame.x + left + (dimensions.w + xSpace) * (x + col),
                y: frame.y + top + (dimensions.h + ySpace) * (y + row),
            };
        }
    }
    // Say an animation has 3 frames, but you want to order them 0, 1, 2, 1, then pass frameMap = [0, 1, 2, 1],
    // to remap the order of the frames accordingly.
    if (frameMap) {
       frames = frameMap.map(originalIndex => frames[originalIndex]);
    }
    return {frames, frameDuration: duration, ...props, duration: FRAME_LENGTH * frames.length * duration};
};


const [errorCanvas, errorContext] = createCanvasAndContext(16, 16);
errorContext.fillStyle = 'red';
errorContext.fillRect(0, 0, 16, 16);

export function getFrame(animation: FrameAnimation, animationTime: number): Frame {
    if (!animation) {
        console.error(new Error('Encountered falsey animation in getFrame'));
        debugger;
        return {image: errorCanvas, x: 0, y: 0, w: 16, h: 16};
    }
    animationTime = Math.max(animationTime, 0);
    let frameIndex = Math.floor(animationTime / (FRAME_LENGTH * (animation.frameDuration || 1)));
    if (animation.loop === false) { // You can set this to prevent an animation from looping.
        frameIndex = Math.min(frameIndex, animation.frames.length - 1);
    }
    if (animation.loopFrame && frameIndex >= animation.frames.length) {
        frameIndex -= animation.loopFrame;
        frameIndex %= (animation.frames.length - animation.loopFrame);
        frameIndex += animation.loopFrame;
    }
    return animation.frames[frameIndex % animation.frames.length];
};

export function drawFrame(
    context: CanvasRenderingContext2D,
    {image, x, y, w, h}: Frame,
    {x: tx, y: ty, w: tw, h: th}: Rect
): void {
    // Drawing canvas elements can fail in Safari so we use a special function
    // to avoid this.
    if (image instanceof HTMLCanvasElement) {
        drawCanvas(context, image,
            {x: x | 0, y: y | 0, w: w | 0, h: h | 0},
            {x: tx | 0, y: ty | 0, w: tw | 0, h: th | 0}
        );
        return;
    }
    // (x | 0) is faster than Math.floor(x)
    context.drawImage(image, x | 0, y | 0, w | 0, h | 0, tx | 0, ty | 0, tw | 0, th | 0);
}

export function drawFrameAt(
    context: CanvasRenderingContext2D,
    {image, content, x, y, w, h}: Frame,
    {x: tx, y: ty, w: tw, h: th}: {x: number, y: number, w?: number, h?: number}
): void {
    const cw = content?.w ?? w;
    const ch = content?.h ?? h;
    // First set tw/th to the target size of the content of the frame.
    tw = tw ?? cw;
    th = th ?? ch;
    const xScale = tw / cw;
    const yScale = th / ch;
    // Adjust tx/ty so that x/y will be the top left corner of the content of the frame.
    tx = tx - (content?.x || 0) * xScale;
    ty = ty - (content?.y || 0) * yScale;
    // Before drawing, set tw/th to the target size of the entire frame.
    tw = xScale * w;
    th = yScale * h;
    // (x | 0) is faster than Math.floor(x)
    // Drawing canvas elements can fail in Safari so we use a special function
    // to avoid this.
    if (image instanceof HTMLCanvasElement) {
        drawCanvas(context, image,
            {x: x | 0, y: y | 0, w: w | 0, h: h | 0},
            {x: tx | 0, y: ty | 0, w: tw | 0, h: th | 0}
        );
        return;
    }
    context.drawImage(image,
        x | 0, y | 0, w | 0, h | 0,
        tx | 0, ty | 0, tw | 0, th | 0);
}

export function drawFrameCenteredAt(
    context: CanvasRenderingContext2D,
    {image, content, x, y, w, h}: Frame,
    {x: tx, y: ty, w: tw, h: th}: {x: number, y: number, w: number, h: number}
): void {
    const cw = content?.w ?? w;
    const ch = content?.h ?? h;
    // Adjust tx/ty so that x/y will be the top left corner of the content of the frame.
    tx = tx - (content?.x || 0) + (tw - cw) / 2;
    ty = ty - (content?.y || 0) + (th - ch) / 2;
    // Drawing canvas elements can fail in Safari so we use a special function
    // to avoid this.
    if (image instanceof HTMLCanvasElement) {
        drawCanvas(context, image,
            {x: x | 0, y: y | 0, w: w | 0, h: h | 0},
            {x: tx | 0, y: ty | 0, w: tw | 0, h: th | 0}
        );
        return;
    }
    // (x | 0) is faster than Math.floor(x)
    context.drawImage(image,
        x | 0, y | 0, w | 0, h | 0,
        tx | 0, ty | 0, w | 0, h | 0);
}

export function drawFrameContentAt(
    context: CanvasRenderingContext2D,
    frame: Frame,
    {x, y, z}: {x: number, y: number, z?: number}
): void {
    drawFrame(context, frame, {
        ...frame,
        x: x - (frame.content?.x || 0),
        y: y - (frame.content?.y || 0) - (z || 0),
    });
}

export function getFrameHitbox({content, w, h}: Frame, {x, y}: {x: number, y: number}): Rect {
    return {
        x, y,
        w: content?.w ?? w,
        h: content?.h ?? h,
    };
}

export function drawSolidTintedFrame(context, frame: TintedFrame, target: Rect) {
    const [tintCanvas, tintContext] = createCanvasAndContext(frame.w, frame.h);
    // First make a solid color in the shape of the image to tint.
    tintContext.save();
        tintContext.fillStyle = frame.color;
        tintContext.clearRect(0, 0, frame.w, frame.h);
        const tintRectangle = {...frame, x: 0, y: 0};
        drawFrame(tintContext, frame, tintRectangle);
        tintContext.globalCompositeOperation = "source-in";
        tintContext.fillRect(0, 0, frame.w, frame.h);
        drawFrame(context, {...tintRectangle, image: tintCanvas}, target);
    tintContext.restore();
}

export function drawTintedImage(
    context: CanvasRenderingContext2D,
    frame: TintedFrame,
    target: Rect
) {
    const [tintCanvas, tintContext] = createCanvasAndContext(frame.w, frame.h);
    // First make a solid color in the shape of the image to tint.
    tintContext.save();
        tintContext.fillStyle = frame.color;
        tintContext.clearRect(0, 0, frame.w, frame.h);
        tintContext.drawImage(frame.image, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
        tintContext.globalCompositeOperation = "source-in";
        tintContext.fillRect(0, 0, frame.w, frame.h);
    tintContext.restore();
    context.save();
        // Next draw the untinted image to the target.
        context.drawImage(frame.image, frame.x, frame.y, frame.w, frame.h, target.x, target.y, target.w, target.h);
        // Finally draw the tint color on top of the target with the desired opacity.
        context.globalAlpha *= frame.amount; // This needs to be multiplicative since we might be drawing a partially transparent image already.
        context.drawImage(tintCanvas, 0, 0, frame.w, frame.h, target.x, target.y, target.w, target.h);
    context.restore();
}
debugCanvas;

/*export function drawFrameCenteredInTarget(
    context: CanvasRenderingContext2D,
    {image, x, y, w, h}: Frame,
    {x: tx, y: ty, w: tw, h: th}: Rect
): void {
    tx += Math.ceil((tw - w) / 2);
    ty += Math.ceil((th - h) / 2);
    // (x | 0) is faster than Math.floor(x)
    context.drawImage(image, x | 0, y | 0, w | 0, h | 0, tx | 0, ty | 0, w | 0, h | 0);
}*/

export function createFrameCanvas(frame: Frame, scale: number = 1): HTMLCanvasElement {
    const canvas = createCanvas(frame.w, frame.h);
    if (scale !== 1) {
        canvas.style.transform = `scale(${scale})`;
    }
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    drawFrame(context, frame, {x: 0, y: 0, w: frame.w, h: frame.h});
    return canvas;
}

// Convenience function for assigning a single animation to all directions for an ActorAnimation.
export function omniAnimation(animation: FrameAnimation) {
    return {
        up: animation, down: animation, left: animation, right: animation,
    };
}
