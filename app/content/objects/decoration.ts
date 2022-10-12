import { FRAME_LENGTH } from 'app/gameConstants';
import { createCanvasAndContext } from 'app/dom';
import { createAnimation, drawFrame, drawFrameAt } from 'app/utils/animations';
import { requireImage } from 'app/utils/images';
import {
    AreaInstance, DrawPriority, Frame, FrameWithPattern, GameState,
    ObjectInstance, ObjectStatus, DecorationDefinition, Rect,
} from 'app/types';

export class Decoration implements ObjectInstance {
    area: AreaInstance;
    definition: DecorationDefinition;
    drawPriority: DrawPriority = 'foreground';
    isObject = <const>true;
    x: number;
    y: number;
    w: number;
    h: number;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    constructor(definition: DecorationDefinition) {
        this.definition = definition;
        this.drawPriority = definition.drawPriority || 'foreground';
        this.x = definition.x;
        this.y = definition.y;
        this.w = definition.w;
        this.h = definition.h;
    }
    getHitbox(state: GameState) {
        return {x: this.x, y: this.y - this.h, w: this.w, h: this.h};
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const decorationType = decorationTypes[this.definition.decorationType];
        decorationType.render(context, state, this);
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

const [
    iceBeastStatueImage,
    lightningBeastStatueImage,
    fireBeastStatueImage
] = createAnimation('gfx/objects/spiritQuestStatue-draftSprites-58x60.png', {w: 58, h: 60}, {cols: 3}).frames;

export const decorationTypes = {
    waterfall: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            if (useWaterfallTiles) {
                renderWaterfallTiles(context, state, decoration);
                return;
            }
            // Draw this 8 pixels past the bottom so that y sorting looks better.
            const h = decoration.h + 8;
            context.save();
                context.globalAlpha *= 0.6;
                context.fillStyle = '#2B68D5';
                context.fillRect(decoration.x, decoration.y + 8 - h, decoration.w, h);
            context.restore();
            context.save();
                context.globalAlpha *= 0.8;
                context.fillStyle = 'white';
                const baseValue = 128 * decoration.animationTime / 1000;
                let y = baseValue % 64 - 128;
                for (; y < decoration.h + 32; y += 32) {
                    let x = ((y - baseValue) % 5 + 5) % 5;
                    for (; x < decoration.w; x += 5) {
                        const targetTop = Math.sin((y - baseValue + y / 2 + x) / 20) * 32 + y;
                        const targetBottom = targetTop + 48;
                        const actualTop = Math.max(0, targetTop);
                        const actualBottom = Math.min(h, targetBottom);
                        if (actualBottom > actualTop) {
                            context.fillRect(
                                decoration.x + x, decoration.y + 8 - h + actualTop,
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
                for (; y < h + 32; y += 32) {
                    let x = ((y - baseValue) % 5 + 5) % 5;
                    for (; x < decoration.w - 1; x += 5) {
                        const targetTop = Math.cos((y - baseValue + y / 2 + x) / 20) * 32 + y;
                        const targetBottom = targetTop + 32;
                        const actualTop = Math.max(0, targetTop);
                        const actualBottom = Math.min(h, targetBottom);
                        if (actualBottom > actualTop) {
                            context.fillRect(
                                decoration.x + x, decoration.y + 8 - h + actualTop,
                                2, actualBottom - actualTop
                            );
                        }
                    }
                }
            context.restore();
        }
    },
    lightningBeastStatue: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            drawFrame(context, lightningBeastStatueImage, {...lightningBeastStatueImage, x: decoration.x, y: decoration.y});
        }
    },
    fireBeastStatue: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            drawFrame(context, fireBeastStatueImage, {...fireBeastStatueImage, x: decoration.x, y: decoration.y});
        }
    },
    iceBeastStatue: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            drawFrame(context, iceBeastStatueImage, {...iceBeastStatueImage, x: decoration.x, y: decoration.y});
        }
    },
}

function renderWaterfallTiles(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
    let y = decoration.y - decoration.h - 4;
    drawFrameAt(context, waterfallTL, {
        ...waterfallTL, x: decoration.x - 8, y,
    });
    fillPattern(context, waterfallTopPattern, {
        x: decoration.x + 8,
        y,
        w: decoration.w - 16,
        h: waterfallTopPattern.h,
    });
    drawFrameAt(context, waterfallTR, {
        ...waterfallTR, x: decoration.x + decoration.w - 8, y,
    });

    y += waterfallTR.h;
    const offset = {x: 0, y: Math.round(decoration.animationTime / 20) % 16};
    // Left Side
    fillPattern(context, waterfallLeftPattern, {
        x: decoration.x - 8,
        y,
        w: waterfallLeftPattern.w,
        h: decoration.h - 24,
    }, offset);
    // Middle
    fillPattern(context, waterfallMiddlePattern, {
        x: decoration.x + 8,
        y,
        w: decoration.w - 16,
        h: decoration.h - 24,
    }, offset);
    // Right Side
    fillPattern(context, waterfallRightPattern, {
        x: decoration.x + decoration.w - 8,
        y,
        w: waterfallRightPattern.w,
        h: decoration.h - 24,
    }, offset);

    y = decoration.y - 8;
    // Bottom
    drawFrameAt(context, waterfallBL, {
        ...waterfallBL, x: decoration.x - 8, y,
    });
    fillPattern(context, waterfallBottomPattern, {
        x: decoration.x + 8,
        y,
        w: decoration.w - 16,
        h: waterfallBottomPattern.h,
    });
    drawFrameAt(context, waterfallBR, {
        ...waterfallBR, x: decoration.x + decoration.w - 8, y,
    });
}

export type DecorationType = keyof typeof decorationTypes;
