import { addEffectToArea, removeEffectFromArea } from 'app/content/areas';
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
    priority?: number

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
    priority: number = 0;
    duration: number;
    constructor(state, { duration = 3000, priority = 0, text }: TextCueProps) {
        // TextCue only supports a single page of messages.
        this.textFrames = parseMessage(state, text, CANVAS_WIDTH - 2 * padding)[0].frames;
        this.duration = duration;
        this.priority = priority;
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
            let x = padding, y = CANVAS_HEIGHT - 36 - (this.textFrames.length - 1) * 16;
            for (const frameRow of this.textFrames) {
                let rowWidth = 0;
                for (const frame of frameRow) {
                    rowWidth += frame?.w ?? characterWidth;
                }
                x = (CANVAS_WIDTH - rowWidth) / 2;
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
            }
        context.restore();
    }
}

export function removeTextCue(state: GameState, priority: number = 10000): boolean {
    if (!state.areaInstance) {
        return false;
    }
    const effect = state.areaInstance.effects.find(
        effect => effect instanceof TextCue
    ) as TextCue;
    if (effect && effect.priority <= priority) {
        removeEffectFromArea(state, effect);
        return true;
    }
    return !effect;
}

export function addTextCue(state: GameState, text: string, duration = 3000, priority = 0): boolean {
    // Only add the new cue if it can override the previous one.
    if (removeTextCue(state)) {
        addEffectToArea(state, state.areaInstance, new TextCue(state, {
            duration,
            priority,
            text,
        }));
        return true;
    }
    return false;
}
