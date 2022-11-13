import { removeEffectFromArea } from 'app/content/areas';
import { CANVAS_HEIGHT, CANVAS_WIDTH, FRAME_LENGTH } from 'app/gameConstants';
import { parseMessage } from 'app/render/renderMessage';
import { drawFrame } from 'app/utils/animations';

import {
    AreaInstance, DrawPriority, EffectInstance, Frame, GameState, TileBehaviors,
} from 'app/types';

const characterWidth = 8;
const fadeDuration = 400;
const padding = 20;

interface TextCueProps {
    text: string
    duration?: number
}

export class TextCue implements EffectInstance {
    area: AreaInstance;
    done = false;
    drawPriority: DrawPriority = 'hud';
    behaviors: TileBehaviors;
    isEffect = <const>true;
    x: number;
    y: number;
    textFrames: Frame[][];
    time: number = 0;
    duration: number;
    constructor(state, { duration = 3000, text }: TextCueProps) {
        // TextCue only supports a single page of messages.
        this.textFrames = parseMessage(state, text, CANVAS_WIDTH - 2 * padding)[0].frames;
        this.duration = duration;
    }
    update(state: GameState) {
        this.time += FRAME_LENGTH;
        if (this.duration && this.time >= this.duration) {
            this.done = true;
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        context.save();
            if (this.time < fadeDuration) {
                context.globalAlpha = Math.min(1, this.time / fadeDuration);
            } else if (this.duration > 0 && this.time > this.duration - fadeDuration) {
                context.globalAlpha = Math.max(0, (this.duration - this.time) / fadeDuration);
            }
            let x = padding, y = CANVAS_HEIGHT - 24 - (this.textFrames.length - 1) * 16;
            for (const frameRow of this.textFrames) {
                for (const frame of frameRow) {
                    if (!frame) {
                        x += characterWidth;
                        continue;
                    }
                    drawFrame(context, frame, {
                        x: x - (frame.content?.x || 0),
                        y: y - (frame.content?.y || 0), w: frame.w, h: frame.h});
                    x += frame.w;
                }
                y += 16;
                x = padding;
            }
        context.restore();
    }
}
