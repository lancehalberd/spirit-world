import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrameContentAt, getFrame, getFrameHitbox } from 'app/utils/animations';
import { requireFrame } from 'app/utils/packedImages';


export class Decoration implements ObjectInstance {
    area: AreaInstance;
    definition: DecorationDefinition;
    drawPriority: DrawPriority = 'sprites';
    isNeutralTarget = true;
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
        this.drawPriority = definition.drawPriority || 'sprites';
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
    getLightSources(state: GameState): LightSource[] {
        const decorationType = decorationTypes[this.definition.decorationType];
        return decorationType.getLightSources?.(state, this) || [];
    }
    getYDepth(): number {
        const decorationType = decorationTypes[this.definition.decorationType];
        if (decorationType.getYDepth) {
            return decorationType.getYDepth(this)
        }
        const hitbox = this.getHitbox();
        return hitbox.y + hitbox.h;
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
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        const decorationType = decorationTypes[this.definition.decorationType];
        decorationType.renderShadow?.(context, state, this);
    }
}

const [
    iceBeastStatueImage,
    /*lightningBeastStatueImage*/,
    fireBeastStatueImage
] = createAnimation('gfx/objects/spiritQuestStatue-draftSprites-58x60.png', {w: 58, h: 60}, {cols: 3}).frames;

const entranceLightFrame = requireFrame('gfx/objects/cavelight.png', {x: 0, y: 0, w: 64, h: 32});
const orbTreeFrame = requireFrame('gfx/objects/orbTree.png', {x: 0, y: 0, w: 26, h: 36, content: {x: 5, y: 19, w: 17, h: 12}});
const glassWindowFrame = requireFrame('gfx/objects/labObjects.png', {x: 0, y: 0, w: 64, h: 48});
const tubeFrontFrame = requireFrame('gfx/objects/labObjects.png', {x: 0, y: 59, w: 32, h: 53});
const tubeBackFrame = requireFrame('gfx/objects/labObjects.png', {x: 32, y: 59, w: 32, h: 53});
const tubeWaterAnimation = createAnimation('gfx/objects/labObjects.png', {w: 32, h: 53}, {top: 123, cols: 16});

const pedestalGeometry = {x: 0, y: 0, w: 96, h: 64, content: {x: 0, y: 16, w: 96, h: 48}};
const pedestalFrame = requireFrame('gfx/decorations/largeStatuePedestal.png', pedestalGeometry);
const glowingPedestalAnimation = createAnimation('gfx/decorations/largeStatuePedestalGlowing.png', pedestalGeometry,
    {cols: 3,
    duration: 10,
    // duration is: 1.0, 0.2, 1.0 etc
    frameMap: [0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 1],
});

const lightningBeastStatueFrame = requireFrame('gfx/decorations/largeStatueStorm.png', {x: 0, y: 0, w: 84, h: 88, content: {x: 16, y: 64, w: 56, h: 24}});

const [fireplaceFrame, fireplaceShadowFrame] = createAnimation('gfx/objects/furniture/woodAndFireplace.png',
    {w: 48, h: 64, content: {x: 2, y: 36, w: 44, h: 16}}, {cols: 2}
).frames;

interface DecorationType {
    render: (context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) => void
    renderShadow?: (context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) => void
    getHitbox?: (decoration: Decoration) => Rect
    behaviors?: TileBehaviors
    getBehaviors?: (state: GameState, decoration: Decoration, x?: number, y?: number) => TileBehaviors
    getLightSources?: (state: GameState, decoration: Decoration) => LightSource[]
    getYDepth?: (decoration: Decoration) => number
}
const fireplace: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, fireplaceFrame, decoration);
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, fireplaceShadowFrame, decoration);
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(fireplaceFrame, decoration);
    },
};
const tube: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, tubeBackFrame, decoration);
        const frame = getFrame(tubeWaterAnimation, decoration.animationTime);
        drawFrameContentAt(context, frame, decoration);
        drawFrameContentAt(context, tubeFrontFrame, decoration);
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return {x: decoration.x, y: decoration.y + 36, w: 32, h: 17};
    },
};
const window: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, glassWindowFrame, decoration);
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return {x: decoration.x, y: decoration.y + 42, w: 64, h: 6};
    },
};
export const decorationTypes = {
    fireplace,
    tube,
    window,
    lightningBeastStatue: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            const frame = lightningBeastStatueFrame;
            drawFrameContentAt(context, frame, decoration);
        },
        behaviors: {
            solid: true,
        },
        getHitbox(decoration: Decoration): Rect {
            return getFrameHitbox(lightningBeastStatueFrame, decoration);
        },
    } as DecorationType,
    fireBeastStatue: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            drawFrameContentAt(context, fireBeastStatueImage, {...fireBeastStatueImage, x: decoration.x, y: decoration.y});
        }
    } as DecorationType,
    iceBeastStatue: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            drawFrameContentAt(context, iceBeastStatueImage, {...iceBeastStatueImage, x: decoration.x, y: decoration.y});
        }
    } as DecorationType,
    entranceLight: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            drawFrameContentAt(context, entranceLightFrame, {...entranceLightFrame, x: decoration.x, y: decoration.y});
        },
    } as DecorationType,
    orbTree: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            drawFrameContentAt(context, orbTreeFrame, {...entranceLightFrame, x: decoration.x, y: decoration.y});
        },
        behaviors: {
            solid: true,
        },
        getHitbox(decoration: Decoration): Rect {
            return getFrameHitbox(orbTreeFrame, decoration);
        },
        getLightSources(state: GameState, decoration: Decoration): LightSource[] {
            const common = {
                brightness: 0.6,

                color: {r:255, g: 128, b: 0},
            };
            return [
                {...common, radius: 16, x: decoration.x - orbTreeFrame.content.x + 3, y: decoration.y - orbTreeFrame.content.y + 14},
                {...common, radius: 20, x: decoration.x - orbTreeFrame.content.x + 13, y: decoration.y - orbTreeFrame.content.y + 2},
                {...common, radius: 16, x: decoration.x - orbTreeFrame.content.x + 23, y: decoration.y - orbTreeFrame.content.y + 14},
            ];
        }
    } as DecorationType,
    pedestal: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            drawFrameContentAt(context, pedestalFrame, decoration);
        },
        behaviors: {
            solid: true,
        },
        getHitbox(decoration: Decoration): Rect {
            return getFrameHitbox(pedestalFrame, decoration);
        },
    } as DecorationType,
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
            return getFrameHitbox(frame, decoration);
        },
    } as DecorationType,
}

objectHash.decoration = Decoration;

declare global {
    export type DecorationType = keyof typeof decorationTypes;
}
