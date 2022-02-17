import { showMessage } from 'app/render/renderMessage';
import { createAnimation, drawFrame } from 'app/utils/animations';

import {
    AreaInstance, GameState, Direction, Hero, SignDefinition,
    ObjectInstance, ObjectStatus, Rect,
} from 'app/types';

const signGeometry = {w: 16, h: 19, content: {x: 0, y: 3, w: 16, h: 16}};
const [shortSign] = createAnimation('gfx/tiles/signshort.png', signGeometry).frames;
const [shortSignSpirit] = createAnimation('gfx/tiles/shortsignspirit.png', signGeometry).frames;
const [tallSign] = createAnimation('gfx/tiles/signtall.png', signGeometry).frames;
const [tallSignSpirit] = createAnimation('gfx/tiles/signtallspirit.png', signGeometry).frames;

export const signStyles = {
    displayScreen: {
        w: 16,
        h: 16,
        render(context: CanvasRenderingContext2D, state: GameState, sign: Sign) {
            context.fillStyle = '#AAA';
            context.fillRect(sign.x, sign.y, 16, 14);
            context.fillStyle = '#000';
            context.fillRect(sign.x + 1, sign.y + 1, 14, 12);
            if (sign.status === 'normal' && state.time % 1000 < 500) {
                context.fillStyle = '#FFF';
                context.fillRect(sign.x + 3, sign.y + 3, 1, 2);
            }
        },
        isSpiritReadable: false,
    },
    largeDisplayScreen: {
        w: 32,
        h: 32,
        render(context: CanvasRenderingContext2D, state: GameState, sign: Sign) {
            context.fillStyle = '#AAA';
            context.fillRect(sign.x, sign.y, 32, 28);
            context.fillStyle = '#000';
            context.fillRect(sign.x + 1, sign.y + 1, 30, 26);
            if (sign.status === 'normal' && state.time % 1000 < 500) {
                context.fillStyle = '#FFF';
                context.fillRect(sign.x + 3, sign.y + 3, 1, 3);
            }
        },
        isSpiritReadable: false,
    },
    short: {
        w: 16,
        h: 16,
        normal: shortSign,
        spirit: shortSignSpirit,
        isSpiritReadable: true,
    },
    tall: {
        w: 16,
        h: 16,
        normal: tallSign,
        spirit: tallSignSpirit,
        isSpiritReadable: true,
    },
};

export class Sign implements ObjectInstance {
    area: AreaInstance;
    definition: SignDefinition;
    drawPriority: 'sprites' = 'sprites';
    behaviors = {
        solid: true,
    };
    isObject = <const>true;
    linkedObject: Sign;
    x: number;
    y: number;
    status: ObjectStatus = 'normal';
    isNeutralTarget = true;
    message: string;
    constructor(definition: SignDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.message = this.definition.message;
    }
    getHitbox(state: GameState): Rect {
        const style = signStyles[this.definition.style] || signStyles.short;
        return { x: this.x, y: this.y, w: style.w, h: style.h };
    }
    onGrab(state: GameState, direction: Direction, hero: Hero) {
        // Don't take actions that would start new scripts while running scripts.
        if (state.scriptEvents.activeEvents.length || state.scriptEvents.queue.length) {
            return
        }
        if (direction !== 'up' || this.status !== 'normal') {
            return;
        }
        const style = signStyles[this.definition.style] || signStyles.short;
        if (hero.isAstralProjection && !style.isSpiritReadable) {
            return;
        }
        showMessage(state, this.message);
        // Remove the grab action since the hero is reading the sign, not grabbing it.
        hero.action = null;
    }
    render(context, state: GameState) {
        const style = signStyles[this.definition.style] || signStyles.short;
        if (style.render) {
            style.render(context, state, this);
            return;
        }
        const frame = this.definition.spirit ? style.spirit : style.normal;
        drawFrame(context, frame, { ...frame, x: this.x - frame.content.x, y: this.y - frame.content.y });
    }
}
