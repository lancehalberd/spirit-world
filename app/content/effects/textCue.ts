import { removeEffectFromArea } from 'app/content/areas';
import { CANVAS_HEIGHT, FRAME_LENGTH } from 'app/gameConstants';
import { drawFrame } from 'app/utils/animations';
import { characterMap } from 'app/utils/simpleWhiteFont';

import {
    AreaInstance, DrawPriority, EffectInstance, GameState, TileBehaviors,
} from 'app/types';

const characterWidth = 8;
const fadeDuration = 400;

interface TextCueProps {
    text: string
    duration?: number
}

export class TextCue implements EffectInstance {
    area: AreaInstance;
    done = false;
    drawPriority: DrawPriority = 'hud';
    behaviors: TileBehaviors;
    x: number;
    y: number;
    text: string;
    time: number = 0;
    duration: number;
    constructor({ duration = 3000, text }: TextCueProps) {
        this.text = text;
        this.duration = duration;
    }
    update(state: GameState) {
        this.time += FRAME_LENGTH;
        if (this.time >= this.duration) {
            this.done = true;
            removeEffectFromArea(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        context.save();
            if (this.time < fadeDuration) {
                context.globalAlpha = Math.min(1, this.time / fadeDuration);
            } else if (this.time > this.duration - fadeDuration) {
                context.globalAlpha = Math.max(0, (this.duration - this.time) / fadeDuration);
            }
            let x = 20, y = CANVAS_HEIGHT - 24;
            for (const c of this.text) {
                const frame = characterMap[c];
                if (!frame) {
                    x += characterWidth;
                    continue;
                }
                drawFrame(context, frame, {
                    x: x - (frame.content?.x || 0),
                    y: y - (frame.content?.y || 0), w: frame.w, h: frame.h});
                x += frame.w;
            }
        context.restore();
    }
}
