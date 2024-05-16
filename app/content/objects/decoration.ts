import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame, getFrame } from 'app/utils/animations';
import { requireFrame } from 'app/utils/packedImages';
import { isPixelInShortRect } from 'app/utils/index';


export class Decoration implements ObjectInstance {
    area: AreaInstance;
    definition: DecorationDefinition;
    drawPriority: DrawPriority = 'foreground';
    isObject = <const>true;
    ignorePits = true;
    x: number;
    y: number;
    z: number;
    w: number;
    h: number;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    constructor(state: GameState, definition: DecorationDefinition) {
        this.definition = definition;
        this.drawPriority = definition.drawPriority || 'foreground';
        this.x = definition.x;
        this.y = definition.y;
        this.z = definition.z || 0;
        this.w = definition.w;
        this.h = definition.h;
    }
    getBehaviors(state: GameState, x?: number, y?: number): TileBehaviors|undefined {
        const decorationType = decorationTypes[this.definition.decorationType];
        return decorationType.getBehaviors?.(state, this, x, y) || decorationType.behaviors;
    }
    getHitbox(): Rect {
        const decorationType = decorationTypes[this.definition.decorationType];
        return decorationType.getHitbox?.(this) || this;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const decorationType = decorationTypes[this.definition.decorationType];
        decorationType.render(context, state, this);
    }
}

const [
    iceBeastStatueImage,
    /*lightningBeastStatueImage*/,
    fireBeastStatueImage
] = createAnimation('gfx/objects/spiritQuestStatue-draftSprites-58x60.png', {w: 58, h: 60}, {cols: 3}).frames;

const entranceLightFrame = requireFrame('gfx/objects/cavelight.png', {x: 0, y: 0, w: 64, h: 32});

const pedestalGeometry = {x: 0, y: 0, w: 96, h: 64, content: {x: 0, y: 16, w: 96, h: 48}};
const pedestalFrame = requireFrame('gfx/decorations/largeStatuePedestal.png', pedestalGeometry);
const glowingPedestalAnimation = createAnimation('gfx/decorations/largeStatuePedestalGlowing.png', pedestalGeometry,
    {cols: 3,
    duration: 10,
    // duration is: 1.0, 0.2, 1.0 etc
    frameMap: [0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 1],
});

const lightningBeastStatueFrame = requireFrame('gfx/decorations/largeStatueStorm.png', {x: 0, y: 0, w: 84, h: 88, content: {x: 16, y: 64, w: 56, h: 24}});

function getFrameHitbox(object: ObjectInstance, frame: FrameRectangle): Rect {
    return {
        x: object.x,
        y: object.y,
        w: (frame.content?.w || frame.w),
        h: (frame.content?.h || frame.h),
    };
}
function drawFrameContentAt(context: CanvasRenderingContext2D, frame: Frame, {x, y, z}: {x: number, y: number, z?: number}): void {
    drawFrame(context, frame, {
        ...frame,
        x: x - (frame.content?.x || 0),
        y: y - (frame.content?.y || 0) - (z || 0),
    });
}

interface DecorationType {
    render: (context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) => void
    getHitbox?: (decoration: Decoration) => Rect
    behaviors?: TileBehaviors
    getBehaviors?: (state: GameState, decoration: Decoration, x?: number, y?: number) => TileBehaviors
}
export const decorationTypes: {[key: string]: DecorationType} = {
    lightningBeastStatue: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            const frame = lightningBeastStatueFrame;
            drawFrameContentAt(context, frame, decoration);
        },
        behaviors: {
            solid: true,
        },
        getHitbox(decoration: Decoration): Rect {
            return getFrameHitbox(decoration, lightningBeastStatueFrame);
        },
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
    entranceLight: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            drawFrame(context, entranceLightFrame, {...entranceLightFrame, x: decoration.x, y: decoration.y});
        },
    },
    pedestal: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            drawFrameContentAt(context, pedestalFrame, decoration);
        },
        behaviors: {
            solid: true,
        },
        getHitbox(decoration: Decoration): Rect {
            return getFrameHitbox(decoration, pedestalFrame);
        },
    },
    pedestalGlowing: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            const frame = getFrame(glowingPedestalAnimation, decoration.animationTime);
            drawFrameContentAt(context, frame, decoration);
        },
        behaviors: {
            solid: true,
        },
        getHitbox(decoration: Decoration): Rect {
            const frame = getFrame(glowingPedestalAnimation, decoration.animationTime);
            return getFrameHitbox(decoration, frame);
        },
    }
}

const staffTowerFrame = requireFrame('gfx/staging/Tower.png', {x: 14, y: 17, w: 164, h: 209, content: {x: 0, y: 81, w: 164, h: 128}});
decorationTypes.staffTower = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, staffTowerFrame, decoration);
    },
    getBehaviors(state: GameState, decoration: Decoration, x?: number, y?: number): TileBehaviors {
        const hitbox = decoration.getHitbox();
        if (!isPixelInShortRect(x, y, hitbox)) {
            return {};
        }
        const radius = 82;
        // TODO: make this an ellipse instead of a circle.
        const dx = x - (hitbox.x + hitbox.w / 2), dy = y - (hitbox.y + hitbox.h / 2);
        const r2 = dx*dx + dy*dy;
        // The ring around the elevator is solid
        if (r2 < radius * radius) {
            return {solid: true};
        }
        return {};
    },
    getHitbox(decoration: Decoration): Rect {;
        return getFrameHitbox(decoration, staffTowerFrame);
    },
};


objectHash.decoration = Decoration;

declare global {
    export type DecorationType = keyof typeof decorationTypes;
}
