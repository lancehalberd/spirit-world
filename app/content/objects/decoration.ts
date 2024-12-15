import {objectHash} from 'app/content/objects/objectHash';
import {FRAME_LENGTH} from 'app/gameConstants';
import {createAnimation, drawFrameContentAt, getFrame, getFrameHitbox} from 'app/utils/animations';
import {requireFrame} from 'app/utils/packedImages';
import {getVariantRandom} from 'app/utils/variants';


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


interface DecorationType {
    render: (context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) => void
    renderShadow?: (context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) => void
    getHitbox?: (decoration: Decoration) => Rect
    behaviors?: TileBehaviors
    getBehaviors?: (state: GameState, decoration: Decoration, x?: number, y?: number) => TileBehaviors
    getLightSources?: (state: GameState, decoration: Decoration) => LightSource[]
    getYDepth?: (decoration: Decoration) => number
}

const [oneLog, oneLogShadow, twoLogs, twoLogsShadow, threeLogs, threeLogsShadow] = createAnimation('gfx/objects/furniture/woodAndFireplace.png',
    {w: 16, h: 24, content: {x: 0, y: 9, w: 16, h: 14}}, {top: 120, cols: 6}
).frames;
const logPile: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        const random = getVariantRandom(decoration.definition);
        for (let x = decoration.x; x < decoration.x + decoration.w; x += 16) {
            if (x + 16 > decoration.x + decoration.w) {
                drawFrameContentAt(context, oneLog, {x: x - 4, y: decoration.y});
                return;
            }
            if (random.generateAndMutate() < 0.3){
                drawFrameContentAt(context, twoLogs, {x, y: decoration.y});
            } else {
                drawFrameContentAt(context, threeLogs, {x, y: decoration.y});
            }
        }
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        const random = getVariantRandom(decoration.definition);
        for (let x = decoration.x; x < decoration.x + decoration.w; x += 16) {
            if (x + 16 > decoration.x + decoration.w) {
                drawFrameContentAt(context, oneLogShadow, {x: x - 4, y: decoration.y});
                return;
            }
            if (random.generateAndMutate() < 0.3){
                drawFrameContentAt(context, twoLogsShadow, {x, y: decoration.y});
            } else {
                drawFrameContentAt(context, threeLogsShadow, {x, y: decoration.y});
            }
        }
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return {
            x: decoration.x,
            y: decoration.y,
            w: decoration.w,
            h: oneLog.content.h,
        };
    },
    /*getYDepth(decoration: Decoration): number {
        return decoration.y + 6;
    },*/
};

const [bedFrame, bedCoversFrame, bedShadowFrame] = createAnimation('gfx/objects/furniture/beds.png',
    {w: 32, h: 48, content: {x: 0, y: 8, w: 32, h: 38}}, {cols: 3}
).frames;
const bed: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, bedFrame, decoration);
        drawFrameContentAt(context, bedCoversFrame, decoration);
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, bedShadowFrame, decoration);
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(bedFrame, decoration);
    },
};
const [floorBedFrame, floorBedCoversFrame, floorBedShadowFrame] = createAnimation('gfx/objects/furniture/beds.png',
    {w: 32, h: 48, content: {x: 3, y: 7, w: 26, h: 34}}, {y: 1, cols: 3}
).frames;
const floorBed: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, floorBedFrame, decoration);
        drawFrameContentAt(context, floorBedCoversFrame, decoration);
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, floorBedShadowFrame, decoration);
    },
    behaviors: {
        groundHeight: 2,
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(floorBedFrame, decoration);
    },
};
const cushionFrames = createAnimation('gfx/objects/furniture/beds.png',
    {w: 16, h: 16, content: {x: 1, y: 0, w: 14, h: 14}}, {top: 112, cols: 4}
).frames;
const [cushionShadaowFrame] = createAnimation('gfx/objects/furniture/beds.png',
    {w: 16, h: 16, content: {x: 1, y: 0, w: 14, h: 14}}, {top: 112, x: 4}
).frames;
const cushion: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        const random = getVariantRandom(decoration.definition);
        const variantFrame = random.element(cushionFrames);
        drawFrameContentAt(context, variantFrame, decoration);
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, cushionShadaowFrame, decoration);
    },
    behaviors: {
        groundHeight: 2,
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(cushionFrames[0], decoration);
    },
};


const verticalBearFrame = requireFrame('gfx/objects/furniture/rugs.png', {x: 0, y: 48, w: 32, h: 48});
const horizontalBearFrame = requireFrame('gfx/objects/furniture/rugs.png', {x: 32, y: 48, w: 48, h: 32});
const bearRug: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        const frame = decoration.w >= decoration.h ? horizontalBearFrame : verticalBearFrame;
        drawFrameContentAt(context, frame, decoration);
    },
    getHitbox(decoration: Decoration): Rect {
        const frame = decoration.w >= decoration.h ? horizontalBearFrame : verticalBearFrame;
        return getFrameHitbox(frame, decoration);
    },
};

const [stumpFrame, stumpShadowFrame, stumpAxe1Frame, stumpAxe2Frame] = createAnimation('gfx/objects/furniture/woodAndFireplace.png',
    {w: 32, h: 23, content: {x: 8, y: 8, w: 16, h: 12}}, {top: 76, cols: 4}
).frames;
const stump: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, stumpFrame, decoration);
        const random = getVariantRandom(decoration.definition);
        const variantFrame = random.element([null, stumpAxe1Frame, stumpAxe2Frame]);
        if (variantFrame){
            drawFrameContentAt(context, variantFrame, {x: decoration.x + 2, y: decoration.y});
        }
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, stumpShadowFrame, decoration);
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(stumpFrame, decoration);
    },
    getYDepth(decoration: Decoration): number {
        return decoration.y + 6;
    },
};

const [fireplaceFrame, fireplaceShadowFrame] = createAnimation('gfx/objects/furniture/woodAndFireplace.png',
    {w: 48, h: 64, content: {x: 2, y: 36, w: 44, h: 16}}, {cols: 2}
).frames;
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

const tallWideShelves = requireFrame('gfx/objects/furniture/shelves.png', {x: 0, y: 10, w: 32, h: 38, content: {x: 0, y: 22, w: 32, h: 16}});
const shortWideShelves = requireFrame('gfx/objects/furniture/shelves.png', {x: 80, y: 28, w: 32, h: 20, content: {x: 0, y: 4, w: 32, h: 16}});
const tallNarrowShelves = requireFrame('gfx/objects/furniture/shelves.png', {x: 48, y: 10, w: 16, h: 38, content: {x: 0, y: 22, w: 16, h: 16}});
const shortNarrowShelves = requireFrame('gfx/objects/furniture/shelves.png', {x: 128, y: 28, w: 16, h: 20, content: {x: 0, y: 4, w: 16, h: 16}});
// A single shelf is 28x8
const wideBookFrames = createAnimation('gfx/objects/furniture/shelves.png', {w: 14, h: 8},
    {left: 2, top: 51, cols: 2, rows: 3, ySpace: 1}
).frames;
wideBookFrames.push(...createAnimation('gfx/objects/furniture/shelves.png', {w: 14, h: 8},
    {left: 2, top: 117, cols: 2, rows: 1}
).frames);
const narrowBookFrames = createAnimation('gfx/objects/furniture/shelves.png', {w: 12, h: 8},
    {left: 50, top: 51, cols: 1, rows: 3, ySpace: 1}
).frames;
narrowBookFrames.push(...createAnimation('gfx/objects/furniture/shelves.png', {w: 12, h: 8},
    {left: 130, top: 53, cols: 1, rows: 2, ySpace: 8}
).frames);
const topLeftCobwebs = requireFrame('gfx/objects/furniture/shelves.png', {x: 2, y: 100, w: 5, h: 5});
const topRightCobwebs = requireFrame('gfx/objects/furniture/shelves.png', {x: 26, y: 100, w: 4, h: 4});


// Y value of the top of the shelves relative to the bottom of the shelves.
const shelfYOffsets = [-10, -19, -28]
const shelves: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        const random = getVariantRandom(decoration.definition);
        let x = decoration.x;
        while (x < decoration.x + decoration.w) {
            if (x <= decoration.x + decoration.w - 32) {
                const variantFrame = random.element([tallWideShelves, shortWideShelves]);
                drawFrameContentAt(context, variantFrame, {x, y: decoration.y});
                const bottom = decoration.y - variantFrame.content.y + variantFrame.h;
                for (const offset of shelfYOffsets) {
                    const y = bottom + offset;
                    drawFrameContentAt(context, random.mutate().element(wideBookFrames), {x: x + 2, y});
                    drawFrameContentAt(context, random.mutate().element(wideBookFrames), {x: x + 16, y});
                    if (random.generateAndMutate() < 0.1) {
                        drawFrameContentAt(context, topLeftCobwebs, {x: x + 2, y});
                    }
                    if (random.generateAndMutate() < 0.1) {
                        drawFrameContentAt(context, topRightCobwebs, {x: x + 25, y});
                    }
                    // Only render the bottom frame for short shelves.
                    if (variantFrame === shortWideShelves) {
                        break;
                    }
                }
                x += 32;
            } else {
                const variantFrame = random.element([tallNarrowShelves, shortNarrowShelves]);
                drawFrameContentAt(context, variantFrame, {x, y: decoration.y});
                const bottom = decoration.y - variantFrame.content.y + variantFrame.h;
                for (const offset of shelfYOffsets) {
                    const y = bottom + offset;
                    drawFrameContentAt(context, random.mutate().element(narrowBookFrames), {x: x + 2, y});
                    if (random.generateAndMutate() < 0.1) {
                        drawFrameContentAt(context, topLeftCobwebs, {x: x + 2, y});
                    } else if (random.generateAndMutate() < 0.1) {
                        drawFrameContentAt(context, topRightCobwebs, {x: x + 10, y});
                    }
                    // Only render the bottom frame for short shelves.
                    if (variantFrame === shortNarrowShelves) {
                        break;
                    }
                }
                x += 16;
            }
            random.mutate();

        }
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return {x: decoration.x, y: decoration.y, w: decoration.w, h: 16};
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
    bearRug,
    bed,
    floorBed,
    cushion,
    stump,
    logPile,
    fireplace,
    shelves,
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
