import { createCanvasAndContext, debugCanvas } from 'app/utils/canvas';


interface FontDefinition {
    face: string
    size: number
    color: string
    x?: number
    y?: number
}
type FontMap = {
    [key in string]: Frame
}

// Example string with most characters we use.
// "abcedfghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\"'?!.,;-"

export function packFont(
    imageWidth: number,
    font: FontDefinition,
    characters: string,
): FontMap {
    const fontMap: FontMap = {};
    let imageHeight = 20;
    let x = 0, y = 0, fontFrameHeight = 0, fontBaseLineOffset = 0;
    const [canvas, context] = createCanvasAndContext(imageWidth, imageHeight);

    context.imageSmoothingEnabled = true;
    context.textBaseline = 'top';
    context.textAlign = 'left';
    context.fillStyle = font.color;
    context.font = `${font.size}px ${font.face}`;
    const metricsMap: {[key: string]: TextMetrics} = {};
    for (const char of characters) {
        const metrics = context.measureText(char);
        const above = Math.ceil(metrics.actualBoundingBoxAscent);
        const below = Math.ceil(metrics.actualBoundingBoxDescent);
        const h = below + above;
        fontFrameHeight = Math.max(fontFrameHeight, h);
        fontBaseLineOffset = Math.max(fontBaseLineOffset, above);
        metricsMap[char] = metrics;
    }
    for (const char of characters) {
        const metrics = metricsMap[char];
        const left = Math.ceil(metrics.actualBoundingBoxLeft)
        const right = Math.ceil(metrics.actualBoundingBoxRight);
        const w = Math.ceil(left + right);
        if (x + w >= imageWidth) {
            x = 0;
            y += fontFrameHeight;
        }
        const contentY = fontBaseLineOffset - Math.ceil(metrics.actualBoundingBoxAscent);
        const contentH = fontBaseLineOffset + Math.ceil(metrics.actualBoundingBoxDescent) - contentY;
        fontMap[char] = {
            image: canvas,
            x, y,
            w,
            h: fontFrameHeight,
            content: {
                x: left,
                y: contentY,
                w: Math.ceil(metrics.width),
                h: contentH,
            },
        };
        imageHeight = Math.max(imageHeight, y + fontFrameHeight);
        x += w;
    }
    canvas.height = imageHeight;
    context.textBaseline = 'top';
    context.textAlign = 'left';
    context.fillStyle = font.color;
    context.font = `${font.size}px ${font.face}`;
    for (const char of characters) {
        const r: Frame = fontMap[char];
        fontMap[char].h = fontFrameHeight;
        context.strokeStyle = 'red';
        //context.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        context.strokeStyle = 'yellow';
        //context.strokeRect(r.x + r.content.x + 0.5, r.y + r.content.y + 0.5, r.content.w - 1, r.content.h - 1);
        context.fillText(char, r.x + r.content.x + (font.x ?? 0), r.y + fontBaseLineOffset + (font.y ?? 0));
    }

    debugCanvas(canvas, 6);
    return fontMap;
}
window['packFont'] = packFont;
