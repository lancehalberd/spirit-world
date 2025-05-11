import { CANVAS_HEIGHT, CANVAS_WIDTH, FRAME_LENGTH } from 'app/gameConstants';
import { parseMessage } from 'app/render/renderMessage';
import { drawFrame } from 'app/utils/animations';
import { addEffectToArea, removeEffectFromArea } from 'app/utils/effects';


const characterWidth = 8;
const fadeDuration = 400;
const padding = 20;

interface TextCueProps {
    text: string
    duration?: number
    priority?: number

}

const rowHeight = 17;
export class TextCue implements EffectInstance {
    area: AreaInstance;
    done = false;
    drawPriority: DrawPriority = 'hud';
    behaviors: TileBehaviors;
    isEffect = <const>true;
    neverSkipFrames = true;
    x: number;
    y: number;
    // Add a slight delay to fading in text cues to prevent them from showing ahead of text dialogue when the two are triggered at the same time.
    time: number = -2 * FRAME_LENGTH;
    priority: number = this.props.priority ?? 0;
    duration: number = this.props.duration ?? 3000;
    textFrames: Frame[][];
    isUsingKeyboard: boolean = false;
    constructor(state: GameState, readonly props: TextCueProps) {
        // TextCue only supports a single page of messages.
        this.textFrames = parseMessage(state, this.props.text, CANVAS_WIDTH - 2 * padding)[0].frames;
        this.isUsingKeyboard = state.isUsingKeyboard;
    }
    fadeOut() {
        if (this.duration === 0) {
            this.duration = this.time + fadeDuration;
        } else {
            this.time = Math.max(this.time, this.duration - fadeDuration);
        }
    }
    update(state: GameState) {
        this.time += FRAME_LENGTH;
        // Update which keys are displayed if the player changes their input source while a message is already displayed.
        if (this.isUsingKeyboard !== state.isUsingKeyboard) {
            this.isUsingKeyboard = state.isUsingKeyboard;
            this.textFrames = parseMessage(state, this.props.text, CANVAS_WIDTH - 2 * padding)[0].frames;
        }
        if (this.duration && this.time >= this.duration) {
            this.done = true;
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        context.save();
            if (this.time < fadeDuration) {
                context.globalAlpha = Math.min(1, Math.max(0, this.time / fadeDuration));
            } else if (this.duration > 0 && this.time > this.duration - fadeDuration) {
                context.globalAlpha = Math.max(0, (this.duration - this.time) / fadeDuration);
            }
            let x = padding, y = CANVAS_HEIGHT - 36 - (this.textFrames.length - 1) * rowHeight;
            let maxWidth = 0;
            for (const frameRow of this.textFrames) {
                let rowWidth = 0;
                for (const frame of frameRow) {
                    rowWidth += frame?.w ?? characterWidth;
                }
                maxWidth = Math.max(maxWidth, rowWidth + 4);
            }
            context.save();
                context.fillStyle = 'black';
                context.globalAlpha *= 0.4;
                context.fillRect(((CANVAS_WIDTH - maxWidth) / 2) | 0, y - 2, maxWidth, this.textFrames.length * rowHeight + 4);
            context.restore();
            for (const frameRow of this.textFrames) {
                let rowWidth = 0;
                for (const frame of frameRow) {
                    rowWidth += frame?.w ?? characterWidth;
                }
                x = ((CANVAS_WIDTH - rowWidth) / 2) | 0;
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
                y += rowHeight;
            }
        context.restore();
    }
}

export function findTextCue(state: GameState): TextCue | undefined {
    for (const effect of state.areaInstance.effects) {
        if (effect instanceof TextCue) {
            return effect;
        }
    }
}

export function removeTextCue(state: GameState, priority: number = 10000): boolean {
    if (!state.areaInstance) {
        return false;
    }
    const effect = findTextCue(state);
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
