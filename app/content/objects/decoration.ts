import { FRAME_LENGTH } from 'app/gameConstants';
import {
    AreaInstance, DrawPriority, GameState,
    ObjectInstance, ObjectStatus, DecorationDefinition,
} from 'app/types';

export class Decoration implements ObjectInstance {
    area: AreaInstance;
    definition: DecorationDefinition;
    drawPriority: DrawPriority = 'foreground';
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

export const decorationTypes = {
    waterfall: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            context.save();
                context.globalAlpha = 0.7;
                context.fillStyle = '#2B68D5';
                context.fillRect(decoration.x, decoration.y - decoration.h, decoration.w, decoration.h);
                context.globalAlpha = 0.9;
                context.fillStyle = 'white';
                const baseValue = 128 * decoration.animationTime / 1000;
                let y = baseValue % 64 - 128;
                for (; y < decoration.h + 32; y += 32) {
                    let x = ((y - baseValue) % 5 + 5) % 5;
                    for (; x < decoration.w; x += 5) {
                        const targetTop = Math.sin((y - baseValue + y / 2 + x) / 20) * 32 + y;
                        const targetBottom = targetTop + 48;
                        const actualTop = Math.max(0, targetTop);
                        const actualBottom = Math.min(decoration.h, targetBottom);
                        if (actualBottom > actualTop) {
                            context.fillRect(
                                decoration.x + x, decoration.y - decoration.h + actualTop,
                                1, actualBottom - actualTop
                            );
                        }
                    }
                }
                context.globalAlpha = 0.8;
                context.fillStyle = '#0034A0';
                y = baseValue % 64 - 128;
                for (; y < decoration.h + 32; y += 32) {
                    let x = ((y - baseValue) % 5 + 5) % 5;
                    for (; x < decoration.w - 1; x += 5) {
                        const targetTop = Math.cos((y - baseValue + y / 2 + x) / 20) * 32 + y;
                        const targetBottom = targetTop + 32;
                        const actualTop = Math.max(0, targetTop);
                        const actualBottom = Math.min(decoration.h, targetBottom);
                        if (actualBottom > actualTop) {
                            context.fillRect(
                                decoration.x + x, decoration.y - decoration.h + actualTop,
                                2, actualBottom - actualTop
                            );
                        }
                    }
                }
            context.restore();
        }
    }
}

export type DecorationType = keyof typeof decorationTypes;
