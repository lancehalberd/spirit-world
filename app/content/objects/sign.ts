import { objectHash } from 'app/content/objects/objectHash';
import { specialBehaviorsHash } from 'app/content/specialBehaviors/specialBehaviorsHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { showMessage } from 'app/scriptEvents';
import { createAnimation, drawFrame, drawFrameAt, getFrame } from 'app/utils/animations';
import { requireFrame } from 'app/utils/packedImages';


const signGeometry = {w: 16, h: 19, content: {x: 0, y: 3, w: 16, h: 16}};
const [shortSign] = createAnimation('gfx/tiles/signshort.png', signGeometry).frames;
const [shortSignSpirit] = createAnimation('gfx/tiles/shortsignspirit.png', signGeometry).frames;
const [tallSign] = createAnimation('gfx/tiles/signtall.png', signGeometry).frames;
const [tallSignSpirit] = createAnimation('gfx/tiles/signtallspirit.png', signGeometry).frames;
const plaqueGeometry = {w: 16, h: 16, content: {x: 0, y: -2, w: 16, h: 16}};
const [nicePlaque] = createAnimation('gfx/objects/plaque.png', plaqueGeometry).frames;
const [brokenPlaque] = createAnimation('gfx/objects/plaque_broken.png', plaqueGeometry).frames;

const tabletOn1 = requireFrame('gfx/tiles/futuristic.png', {x: 6, y: 1155, w: 36, h: 26});
const tabletOn2 = requireFrame('gfx/tiles/futuristic.png', {x: 54, y: 1155, w: 36, h: 26});
const tabletOff = requireFrame('gfx/tiles/futuristic.png', {x: 102, y: 1187, w: 36, h: 26});

const tabletHideAnimation = createAnimation('gfx/tiles/futuristic.png', {w: 48, h: 32, content: {x: 6, w: 36, y: 5, h: 26}}, {left: 0, top: 1214, cols: 18, duration: 4}, {loop: false});

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
    stoneTerminal: {
        w: 32,
        h: 14,
        getFrame(state: GameState, sign: Sign): Frame {
            if (sign.status === 'hidden') {
                return getFrame(tabletHideAnimation, sign.animationTime);
            } else if (sign.status === 'normal') {
                if (sign.animationTime < tabletHideAnimation.duration) {
                    return getFrame(tabletHideAnimation, tabletHideAnimation.duration - sign.animationTime);
                } else {
                    return (state.time % 1000 < 500) ? tabletOn1 : tabletOn2;
                }
            }
            return tabletOff;
        },
        render(context: CanvasRenderingContext2D, state: GameState, sign: Sign) {
            const frame = signStyles.stoneTerminal.getFrame(state, sign);
            drawFrameAt(context, {...frame, h: 13}, {x: sign.x - 2, y: sign.y - 10});
        },
        // Hack to render the outline around the terminal under the player.
        renderShadow(context: CanvasRenderingContext2D, state: GameState, sign: Sign) {
            const frame = signStyles.stoneTerminal.getFrame(state, sign);
            drawFrameAt(context, {...frame, h: frame.h - 13, y: frame.y + 13}, {x: sign.x - 2, y: sign.y - 10 + 13});
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
    nicePlaque: {
        w: 16,
        h: 16,
        normal: nicePlaque,
        spirit: nicePlaque,
        isSpiritReadable: true,
    },
    brokenPlaque: {
        w: 16,
        h: 16,
        normal: brokenPlaque,
        spirit: brokenPlaque,
        isSpiritReadable: true,
    },
};

export class Sign implements ObjectInstance {
    area: AreaInstance;
    drawPriority: 'sprites' = 'sprites';
    behaviors = {
        solid: true,
        midHeight: true,
    };
    isObject = <const>true;
    linkedObject: Sign;
    x = this.definition.x;
    y = this.definition.y;
    status: ObjectStatus = this.definition.status ?? 'normal';
    isNeutralTarget = true;
    message = this.definition.message;
    // If we support more animations later, we will need to make this variable based on the sign style.
    // Right now we only use this for hiding/showing the tablets that sink into the ground.
    animationTime = tabletHideAnimation.duration;
    constructor(state: GameState, public definition: SignDefinition) {
    }
    getHitbox(state: GameState): Rect {
        const style = signStyles[this.definition.style] || signStyles.short;
        return { x: this.x, y: this.y, w: style.w, h: style.h };
    }
    onActivate(state: GameState) {
        if (this.status === 'hidden') {
            this.status = 'normal';
            this.animationTime = 0;
        }
    }
    onDeactivate(state: GameState) {
        if (this.status === 'normal') {
            this.status = 'hidden';
            this.animationTime = 0;
        }
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
        if (this.definition.specialBehaviorKey) {
            const specialBehavior = specialBehaviorsHash[this.definition.specialBehaviorKey] as SpecialSignBehavior;
            if (specialBehavior.onRead) {
                specialBehavior?.onRead?.(state, this);
                hero.action = null;
                return;
            }
        }
        showMessage(state, this.message);
        // Remove the grab action since the hero is reading the sign, not grabbing it.
        hero.action = null;
    }
    update() {
        this.animationTime += FRAME_LENGTH;
    }
    render(context, state: GameState) {
        const style = signStyles[this.definition.style] || signStyles.short;
        if (style.render) {
            style.render(context, state, this);
            return;
        }
        const frame = this.definition.spirit ? style.spirit : style.normal;
        drawFrame(context, frame, { ...frame, x: this.x - (frame.content?.x ?? 0), y: this.y - (frame.content?.y ?? 0) });
    }
    renderShadow(context, state: GameState) {
        const style = signStyles[this.definition.style] || signStyles.short;
        if (style.renderShadow) {
            style.renderShadow(context, state, this);
            return;
        }
    }
}
objectHash.sign = Sign;

class _Sign extends Sign {}
declare global {
    export interface Sign extends _Sign {}
}
