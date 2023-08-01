import { FRAME_LENGTH } from 'app/gameConstants';
import { createCanvasAndContext } from 'app/dom';
import { drawFrameAt } from 'app/utils/animations';
import { requireImage } from 'app/utils/images';
import {
    AreaInstance, DrawPriority, Frame, FrameWithPattern, GameState,
    ObjectInstance, ObjectStatus, WaterfallDefinition, Rect,
} from 'app/types';

export class Waterfall implements ObjectInstance {
    area: AreaInstance;
    definition: WaterfallDefinition;
    drawPriority: DrawPriority = 'sprites';
    ignorePits = true;
    isObject = <const>true;
    x: number;
    y: number;
    w: number;
    h: number;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    back: WaterfallBack;
    constructor(definition: WaterfallDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.w = definition.w;
        this.h = definition.h;
        this.back = new WaterfallBack(this);
    }
    getHitbox(): Rect {
        return {x: this.x, y: this.y - this.h, w: this.w, h: this.h - 8};
    }
    getParts() {
        return [this.back];
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (useWaterfallTiles) {
            renderWaterfallTiles(context, state, this);
            return;
        }
        renderWaterfallVectors(context, state, this.animationTime, this.getHitbox());
    }
}

class WaterfallBack implements ObjectInstance {
    area: AreaInstance;
    drawPriority: DrawPriority = 'sprites';
    isObject = <const>true;
    x: number;
    y: number;
    w: number;
    h: number;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    constructor(private waterfall: Waterfall) {
    }
    getHitbox(): Rect {
        return {x: this.waterfall.x, y: this.waterfall.y - this.waterfall.h, w: this.waterfall.w, h: this.waterfall.h};
    }
    getYDepth(): number {
        return this.waterfall.y - 16;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const target = this.getHitbox();
        context.save();
            context.globalAlpha *= 0.6;
            context.fillStyle = '#2B68D5';
            context.fillRect(target.x, target.y, target.w, target.h - 3);
        context.restore();
        renderWaterfallVectors(context, state, this.waterfall.animationTime, target);
    }
}

const waterfallImage = requireImage('gfx/tiles/waterfalltilesdeep.png');

const waterfallTopPattern: FrameWithPattern = {image: waterfallImage, x: 16, y: 12, w: 32, h: 20};
const waterfallMiddlePattern: FrameWithPattern = {image: waterfallImage, x: 16, y: 32, w: 32, h: 16};
const waterfallBottomPattern: FrameWithPattern = {image: waterfallImage, x: 16, y: 48, w: 32, h: 16};
const waterfallLeftPattern: FrameWithPattern = {image: waterfallImage, x: 0, y: 32, w: 16, h: 16};
const waterfallRightPattern: FrameWithPattern = {image: waterfallImage, x: 48, y: 32, w: 16, h: 16};

const waterfallTL: Frame = {image: waterfallImage, x: 0, y: 12, w: 16, h: 20};
const waterfallTR: Frame = {image: waterfallImage, x: 48, y: 12, w: 16, h: 20};
const waterfallBL: Frame = {image: waterfallImage, x: 0, y: 48, w: 16, h: 16};
const waterfallBR: Frame = {image: waterfallImage, x: 48, y: 48, w: 16, h: 16};


function fillPattern(context: CanvasRenderingContext2D, frame: FrameWithPattern, target: Rect, offset = {x: 0, y: 0}) {
    if (!frame.pattern ) {
        const [patternCanvas, patternContext] = createCanvasAndContext(frame.w, frame.h);
        drawFrameAt(patternContext, frame, {x: 0, y: 0});
        frame.pattern = context.createPattern(patternCanvas, 'repeat');
    }
    context.save();
        context.translate(target.x + offset.x, target.y + offset.y);
        context.fillStyle = frame.pattern;
        context.fillRect(-offset.x, -offset.y, target.w, target.h);
    context.restore();
}

const useWaterfallTiles = false;


function renderWaterfallVectors(this: void,
    context: CanvasRenderingContext2D,
    state: GameState,
    animationTime: number,
    target: Rect
): void {
    context.save();
        context.globalAlpha *= 0.8;
        context.fillStyle = 'white';
        const baseValue = 128 * animationTime / 1000;
        let y = baseValue % 64 - 128;
        for (; y < target.h + 32; y += 32) {
            let x = ((y - baseValue) % 5 + 5) % 5;
            for (; x < target.w; x += 5) {
                const targetTop = Math.sin((y - baseValue + y / 2 + x) / 20) * 32 + y;
                const targetBottom = targetTop + 48;
                const actualTop = Math.max(0, targetTop);
                const actualBottom = Math.min(target.h - x % 3, targetBottom);
                if (actualBottom > actualTop) {
                    context.fillRect(
                        target.x + x, target.y + actualTop,
                        1, actualBottom - actualTop
                    );
                }
            }
        }
    context.restore();
    context.save();
        context.globalAlpha *= 0.7;
        context.fillStyle = '#0034A0';
        y = baseValue % 64 - 128;
        for (; y < target.h + 32; y += 32) {
            let x = ((y - baseValue) % 5 + 5) % 5;
            for (; x < target.w - 1; x += 5) {
                const targetTop = Math.cos((y - baseValue + y / 2 + x) / 20) * 32 + y;
                const targetBottom = targetTop + 32;
                const actualTop = Math.max(0, targetTop);
                const actualBottom = Math.min(target.h - x % 2, targetBottom);
                if (actualBottom > actualTop) {
                    context.fillRect(
                        target.x + x, target.y + actualTop,
                        2, actualBottom - actualTop
                    );
                }
            }
        }
    context.restore();
}

function renderWaterfallTiles(context: CanvasRenderingContext2D, state: GameState, waterfall: Waterfall) {
    let y = waterfall.y - waterfall.h - 4;
    drawFrameAt(context, waterfallTL, {
        ...waterfallTL, x: waterfall.x - 8, y,
    });
    fillPattern(context, waterfallTopPattern, {
        x: waterfall.x + 8,
        y,
        w: waterfall.w - 16,
        h: waterfallTopPattern.h,
    });
    drawFrameAt(context, waterfallTR, {
        ...waterfallTR, x: waterfall.x + waterfall.w - 8, y,
    });

    y += waterfallTR.h;
    const offset = {x: 0, y: Math.round(waterfall.animationTime / 20) % 16};
    // Left Side
    fillPattern(context, waterfallLeftPattern, {
        x: waterfall.x - 8,
        y,
        w: waterfallLeftPattern.w,
        h: waterfall.h - 24,
    }, offset);
    // Middle
    fillPattern(context, waterfallMiddlePattern, {
        x: waterfall.x + 8,
        y,
        w: waterfall.w - 16,
        h: waterfall.h - 24,
    }, offset);
    // Right Side
    fillPattern(context, waterfallRightPattern, {
        x: waterfall.x + waterfall.w - 8,
        y,
        w: waterfallRightPattern.w,
        h: waterfall.h - 24,
    }, offset);

    y = waterfall.y - 8;
    // Bottom
    drawFrameAt(context, waterfallBL, {
        ...waterfallBL, x: waterfall.x - 8, y,
    });
    fillPattern(context, waterfallBottomPattern, {
        x: waterfall.x + 8,
        y,
        w: waterfall.w - 16,
        h: waterfallBottomPattern.h,
    });
    drawFrameAt(context, waterfallBR, {
        ...waterfallBR, x: waterfall.x + waterfall.w - 8, y,
    });
}
