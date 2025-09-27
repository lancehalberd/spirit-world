import {objectHash} from 'app/content/objects/objectHash';
import {setSpawnLocation} from 'app/content/spawnLocations';
import {FRAME_LENGTH} from 'app/gameConstants';
import {appendScript} from 'app/scriptEvents';
import {createAnimation, drawFrameContentAt, drawFrameContentReflectedAt, getFrame, getFrameHitbox} from 'app/utils/animations';
import {directionMap} from 'app/utils/direction';
import {enterZoneByTarget} from 'app/utils/enterZoneByTarget';
import {isPointInShortRect} from 'app/utils/index';
import {requireFrame} from 'app/utils/packedImages';
import {getVariantRandom} from 'app/utils/variants';


export class Decoration implements ObjectInstance {
    area: AreaInstance;
    isNeutralTarget = true;
    isObject = <const>true;
    ignorePits = true;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    child: ObjectInstance;

    drawPriority: DrawPriority = this.definition.drawPriority || 'sprites';
    x = this.definition.x;
    y = this.definition.y;
    z = this.definition.z || 0;
    w = this.definition.w;
    h = this.definition.h;
    d = this.definition.d || 'up';
    constructor(state: GameState, public definition: DecorationDefinition) {}
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
    canGrab(state: GameState): boolean {
        const decorationType = decorationTypes[this.definition.decorationType];
        return !!decorationType.onGrab || !!this.getBehaviors(state)?.solid;
    }
    onGrab(state: GameState, direction: Direction, hero: Hero) {
        const decorationType = decorationTypes[this.definition.decorationType];
        decorationType.onGrab?.(state, this, direction, hero);
    }
    onInitialize(state: GameState) {
        const targetId = this.definition.targetObjectId;
        if (targetId && targetId !== this.child?.definition?.id) {
            this.child = this.area.objects.find(o => o.definition?.id === targetId);
            this.child.renderParent = this;
        }
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const decorationType = decorationTypes[this.definition.decorationType];
        decorationType.render(context, state, this);
    }
    alternateRender(context: CanvasRenderingContext2D, state: GameState) {
        const decorationType = decorationTypes[this.definition.decorationType];
        decorationType.alternateRender?.(context, state, this);
    }
    renderShadow(context: CanvasRenderingContext2D, state: GameState) {
        const decorationType = decorationTypes[this.definition.decorationType];
        decorationType.renderShadow?.(context, state, this);
    }
    renderForeground(context: CanvasRenderingContext2D, state: GameState) {
        const decorationType = decorationTypes[this.definition.decorationType];
        // If the entire decoration is rendered in the foreground, call both render
        // functions here.
        if (this.drawPriority === 'foreground') {
            decorationType.render(context, state, this);
        }
        decorationType.renderForeground?.(context, state, this);
    }
}

const entranceLightFrame = requireFrame('gfx/objects/cavelight.png', {x: 0, y: 0, w: 64, h: 32});
const orbTreeFrame = requireFrame('gfx/objects/orbTree.png', {x: 0, y: 0, w: 26, h: 36, content: {x: 5, y: 19, w: 17, h: 12}});
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

const flameBeastStatueFrame = requireFrame('gfx/decorations/flameBeastStatue.png', {x: 0, y: 0, w: 95, h: 88, content: {x: 16, y: 64, w: 56, h: 24}});
const frostBeastStatueFrame = requireFrame('gfx/decorations/frostBeastStatue.png', {x: 0, y: 0, w: 115, h: 98, content: {x: 16, y: 58, w: 88, h: 32}});
const stormBeastStatueFrame = requireFrame('gfx/decorations/largeStatueStorm.png', {x: 0, y: 0, w: 84, h: 88, content: {x: 16, y: 64, w: 56, h: 24}});

interface DecorationType {
    render: (context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) => void
    alternateRender?: (context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) => void
    renderShadow?: (context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) => void
    renderForeground?: (context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) => void
    getHitbox?: (decoration: Decoration) => Rect
    behaviors?: TileBehaviors
    getBehaviors?: (state: GameState, decoration: Decoration, x?: number, y?: number) => TileBehaviors
    getLightSources?: (state: GameState, decoration: Decoration) => LightSource[]
    getYDepth?: (decoration: Decoration) => number
    onGrab?:(state: GameState, decoration: Decoration, direction: Direction, hero: Hero) => void
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



const [anvilFrame, anvilShadowFrame] = createAnimation('gfx/objects/furniture/anvil.png',
    {w: 32, h: 18, content: {x: 4, y: 6, w: 22, h: 10}}, {cols: 2}
).frames;
const anvil: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, anvilFrame, decoration);
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, anvilShadowFrame, decoration);
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(anvilFrame, decoration);
    },
};

const [
    basketEmptyFrame, basketRiceFrame, basketBeansFrame,
    basketClothesFrame, basketLidFrame, basketShadowFrame,
] = createAnimation('gfx/objects/furniture/baskets.png',
    {w: 16, h: 16, content: {x: 1, y: 6, w: 15, h: 10}}, {cols: 6}
).frames;
const basketFrames = [basketEmptyFrame, basketRiceFrame, basketBeansFrame,
    basketClothesFrame, basketLidFrame];
const basket: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        const random = getVariantRandom(decoration.definition);
        const variantFrame = random.element(basketFrames);
        drawFrameContentAt(context, variantFrame, decoration);
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, basketShadowFrame, decoration);
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(basketEmptyFrame, decoration);
    },
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
        if (decoration.d === 'left') {
            drawFrameContentReflectedAt(context, horizontalBearFrame, decoration);
        } else if (decoration.d === 'right') {
            drawFrameContentAt(context, horizontalBearFrame, decoration);
        } else {
            drawFrameContentAt(context, verticalBearFrame, decoration);
        }
    },
    getHitbox(decoration: Decoration): Rect {
        if (decoration.d === 'left' || decoration.d === 'right') {
            return getFrameHitbox(horizontalBearFrame, decoration);
        }
        return getFrameHitbox(verticalBearFrame, decoration);
    },
};

const chairFrame= requireFrame('gfx/objects/furniture/table.png', {x: 48, y: 0, w: 16, h: 16, content: {x: 2, y: 0, w: 13, h: 16}});
const chair: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, chairFrame, decoration);
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(chairFrame, decoration);
    },
};

const [fireplaceFrame, fireplaceShadowFrame] = createAnimation('gfx/objects/furniture/woodAndFireplace.png',
    {w: 48, h: 64, content: {x: 2, y: 36, w: 44, h: 16}}, {cols: 2}
).frames;
const fireplaceLogsFrame = requireFrame('gfx/objects/furniture/woodAndFireplace.png', {x: 96, y: 32, w: 32, h: 32})
const fireplaceAnimation = createAnimation('gfx/objects/furniture/woodAndFireplace.png', {w: 32, h:32},
    {left: 128, top: 32, cols: 4, duration: 6}
);
const fireplace: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, fireplaceFrame, decoration);
        const random = getVariantRandom(decoration.definition);
        const target = {
            x: decoration.x + 6,
            y: decoration.y - 4,
        };
        if (random.mutateAndGenerate() < 0.5) {
            const frame = getFrame(fireplaceAnimation, decoration.animationTime);
            drawFrameContentAt(context, frame, target);
        } else if (random.mutateAndGenerate() < 0.5) {
            drawFrameContentAt(context, fireplaceLogsFrame, target);
        }
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

const glassWallFrame = requireFrame('gfx/objects/labObjects.png', {x: 0, y: 0, w: 64, h: 48});
const glassWall: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, glassWallFrame, decoration);
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return {x: decoration.x, y: decoration.y + 42, w: 64, h: 6};
    },
};

const kettleFrames = createAnimation('gfx/objects/furniture/dishware.png',
    {w: 16, h: 16, content: {x: 4, y: 6, w: 8, h: 6}}, {top: 128, cols: 2}
).frames;
const kettle: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        const random = getVariantRandom(decoration.definition);
        const variantFrame = random.element(kettleFrames);
        if (decoration.d === 'left') {
            drawFrameContentReflectedAt(context, variantFrame, decoration);
        } else {
            drawFrameContentAt(context, variantFrame, decoration);
        }
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(kettleFrames[0], decoration);
    },
};

const [fancyPlate, fancyBowl, fancyCup, fancyMug] = createAnimation('gfx/objects/furniture/dishware.png',
    {w: 16, h: 16}, {cols: 4}
).frames;
const [
    fancyForkUp, fancyKnifeUp, fancySpoonUp,
    fancyForkDown, fancyKnifeDown, fancySpoonDown,
    fancyForkLeft, fancyKnifeLeft, fancySpoonLeft,
] = createAnimation('gfx/objects/furniture/dishware.png',
    {w: 16, h: 16}, {y: 1, cols: 3, rows: 3}
).frames;
const fancySilverwareMap = {
    up: [fancyForkUp, fancyKnifeUp, fancySpoonUp],
    down: [fancyForkDown, fancyKnifeDown, fancySpoonDown],
    left: [fancyForkLeft, fancyKnifeLeft, fancySpoonLeft],
    right: [fancyForkLeft, fancyKnifeLeft, fancySpoonLeft],
};
const placeSettingFancy: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        const random = getVariantRandom(decoration.definition);
        const variantFrame = random.mutate().element([fancyPlate, fancyBowl]);
        const elements = [{
            frame: variantFrame,
            x: decoration.x,
            y: decoration.y,
            reflected: false,
        }];

        const [dx, dy] = directionMap[decoration.d];
        const forward = [dx, dy];
        const right = [-dy, dx];
        if (random.mutateAndGenerate() < 0.3) {
            const variantFrame = random.mutate().element([fancyCup, fancyMug]);
            elements.push({
                frame: variantFrame,
                x: decoration.x + 7 * forward[0] + 7 * right[0],
                y: decoration.y + 7 * forward[1] + 7 * right[1],
                reflected: false
            });
        }
        const silverWareSet = [...fancySilverwareMap[decoration.d]];
        if (random.mutateAndGenerate() < 0.3) {
            const variantFrame = random.mutate().removeElement(silverWareSet);
            elements.push({
                frame: variantFrame,
                x: decoration.x - 1 * forward[0] + 7 * right[0],
                y: decoration.y - 1 * forward[1] + 7 * right[1],
                reflected: decoration.d === 'right',
            });
        }
        if (random.mutateAndGenerate() < 0.3) {
            const variantFrame = random.mutate().removeElement(silverWareSet);
            elements.push({
                frame: variantFrame,
                x: decoration.x - 1 * forward[0] - 7 * right[0],
                y: decoration.y - 1 * forward[1] - 7 * right[1],
                reflected: decoration.d === 'right',
            });
        }
        elements.sort((a, b) => b.y - a.y);
        for (const element of elements) {
            if (element.reflected){
                drawFrameContentReflectedAt(context, element.frame, element);
            } else {
                drawFrameContentAt(context, element.frame, element);
            }
        }
    },
    getHitbox(decoration: Decoration): Rect {
        return {x: decoration.x, y: decoration.y, w: 16, h: 16};
    },
};
const [clayPlate, clayBowl, clayCup] = createAnimation('gfx/objects/furniture/dishware.png',
    {w: 16, h: 16}, {y: 4, cols: 3}
).frames;
const [
    clayForkUp, clayKnifeUp, claySpoonUp,
    clayForkDown, clayKnifeDown, claySpoonDown,
    clayForkLeft, clayKnifeLeft, claySpoonLeft,
] = createAnimation('gfx/objects/furniture/dishware.png',
    {w: 16, h: 16}, {y: 5, cols: 3, rows: 3}
).frames;
const claySilverwareMap = {
    up: [clayForkUp, clayKnifeUp, claySpoonUp],
    down: [clayForkDown, clayKnifeDown, claySpoonDown],
    left: [clayForkLeft, clayKnifeLeft, claySpoonLeft],
    right: [clayForkLeft, clayKnifeLeft, claySpoonLeft],
};
const placeSettingNormal: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        const random = getVariantRandom(decoration.definition);
        const variantFrame = random.mutate().element([clayPlate, clayBowl]);
        const elements = [{
            frame: variantFrame,
            x: decoration.x,
            y: decoration.y,
            reflected: false,
        }];

        const [dx, dy] = directionMap[decoration.d];
        const forward = [dx, dy];
        const right = [-dy, dx];
        if (random.mutateAndGenerate() < 0.3) {
            elements.push({
                frame: clayCup,
                x: decoration.x + 7 * forward[0] + 7 * right[0],
                y: decoration.y + 7 * forward[1] + 7 * right[1],
                reflected: false
            });
        }
        const silverWareSet = [...claySilverwareMap[decoration.d]];
        if (random.mutateAndGenerate() < 0.3) {
            const variantFrame = random.mutate().removeElement(silverWareSet);
            elements.push({
                frame: variantFrame,
                x: decoration.x - 1 * forward[0] + 7 * right[0],
                y: decoration.y - 1 * forward[1] + 7 * right[1],
                reflected: decoration.d === 'right',
            });
        }
        if (random.mutateAndGenerate() < 0.3) {
            const variantFrame = random.mutate().removeElement(silverWareSet);
            elements.push({
                frame: variantFrame,
                x: decoration.x - 1 * forward[0] - 7 * right[0],
                y: decoration.y - 1 * forward[1] - 7 * right[1],
                reflected: decoration.d === 'right',
            });
        }
        elements.sort((a, b) => b.y - a.y);
        for (const element of elements) {
            if (element.reflected){
                drawFrameContentReflectedAt(context, element.frame, element);
            } else {
                drawFrameContentAt(context, element.frame, element);
            }
        }
    },
    getHitbox(decoration: Decoration): Rect {
        return {x: decoration.x, y: decoration.y, w: 16, h: 16};
    },
};

const pottedPlantFrames = createAnimation('gfx/objects/furniture/pottedPlants.png',
    {w: 16, h: 32, content: {x: 3, y: 21, w: 10, h: 10}}, {cols: 3}
).frames;
const pottedPlant: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        const random = getVariantRandom(decoration.definition);
        const variantFrame = random.element(pottedPlantFrames);
        drawFrameContentAt(context, variantFrame, decoration);
    },
    renderShadow(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        //drawFrameContentAt(context, stumpShadowFrame, decoration);
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(pottedPlantFrames[0], decoration);
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

export const tableFrames= createAnimation('gfx/objects/furniture/table.png',
    {w: 16, h: 16}, {cols: 3, rows: 4}
).frames;
const tableTopRow = tableFrames.slice(0, 3);
const tableMiddleRow = tableFrames.slice(3, 6);
const tableBottomRow = tableFrames.slice(6, 9);
const tableLegsRow = tableFrames.slice(9, 12);

const table: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        for (let y = decoration.y; y < decoration.y + decoration.h; y += 16) {
            let row = tableMiddleRow;
            if (y === decoration.y) {
                row = tableTopRow;
            } else if (y >= decoration.y + decoration.h - 16) {
                row = tableLegsRow;
            } else if (y >= decoration.y + decoration.h - 32) {
                row = tableBottomRow;
            }
            for (let x = decoration.x; x < decoration.x + decoration.w; x += 16) {
                let frame = row[1];
                if (x === decoration.x) {
                    frame = row[0];
                } else if (x >= decoration.x + decoration.w - 16) {
                    frame = row[2];
                }
                drawFrameContentAt(context, frame, {x, y});
            }
        }
    },
    behaviors: {
        solid: true,
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



const darkWindowFrame = requireFrame('gfx/objects/furniture/windows.png', {x: 7, y: 8, w: 19, h: 18});
const lightWindowFrame = requireFrame('gfx/objects/furniture/windows.png', {x: 39, y: 8, w: 19, h: 18});

// Jade City unlit windows added here: not sure how you want these implemented.
// const lightUnlitWindowFrame = requireFrame('gfx/tiles/jadeCityLight.png', {x: 103, y: 70, w: 19, h: 18});
// const darkUnlitWindowFrame = requireFrame('gfx/tiles/jadeCityDark.png', {x: 103, y: 70, w: 19, h: 18});

const verticalLightBeamFrame = requireFrame('gfx/objects/furniture/windows.png', {x: 8, y: 43, w: 17, h: 47});
const sideLightBeamFrame = requireFrame('gfx/objects/furniture/windows.png', {x: 37, y: 53, w: 27, h: 37});
const verticalFloorLightFrame = requireFrame('gfx/objects/furniture/windows.png', {x: 8, y: 105, w: 17, h: 17});
const horizontalFloorLightFrame = requireFrame('gfx/objects/furniture/windows.png', {x: 37, y: 107, w: 19, h: 15});
const windowOctogonal: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        if (decoration.d === 'up') {
            const frame = decoration.definition.spirit ? darkWindowFrame : lightWindowFrame;
            drawFrameContentAt(context, frame, decoration);
            // Do not render light beams in the Spirit World.
            if (decoration.area.definition.isSpiritWorld) {
                return;
            }
            context.save();
                context.globalAlpha *= 0.5;
                drawFrameContentAt(context, verticalFloorLightFrame, {x: decoration.x + 1, y: decoration.y + 33});
            context.restore();
        }
        if (decoration.d === 'right') {
            // The window itself is not visible from the side, so we use the light on the floor as the
            // object position.
            // Do not render light beams in the Spirit World.
            if (decoration.area.definition.isSpiritWorld) {
                return;
            }
            context.save();
                context.globalAlpha *= 0.5;
                drawFrameContentAt(context, horizontalFloorLightFrame, decoration);
            context.restore();
        }
        if (decoration.d === 'left') {
            // The window itself is not visible from the side, so we use the light on the floor as the
            // object position.
            // Do not render light beams in the Spirit World.
            if (decoration.area.definition.isSpiritWorld) {
                return;
            }
            context.save();
                context.globalAlpha *= 0.5;
                drawFrameContentReflectedAt(context, horizontalFloorLightFrame, decoration);
            context.restore();
        }
    },
    renderForeground(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        // Do not render light beams in the Spirit World.
        if (decoration.area.definition.isSpiritWorld) {
            return;
        }
        if (decoration.d === 'up') {
            context.save();
                context.globalAlpha *= 0.1;
                drawFrameContentAt(context, verticalLightBeamFrame, {x: decoration.x + 1, y: decoration.y + 3});
            context.restore();
        }
        if (decoration.d === 'right') {
            context.save();
                context.globalAlpha *= 0.1;
                drawFrameContentAt(context, sideLightBeamFrame, {x: decoration.x, y: decoration.y - 22});
            context.restore();
        }
        if (decoration.d === 'left') {
            context.save();
                context.globalAlpha *= 0.1;
                drawFrameContentReflectedAt(context, sideLightBeamFrame, {x: decoration.x - 8, y: decoration.y - 22});
            context.restore();
        }
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(darkWindowFrame, decoration);
    },
};

const cocoonFrame= requireFrame('gfx/objects/cocoon.png', {x: 0, y: 0, w: 24, h: 42, content: {x: 2, y: 22, w: 20, h: 20}});
const cocoonBackFrame= requireFrame('gfx/objects/cocoon.png', {x: 24, y: 0, w: 24, h: 42, content: {x: 2, y: 22, w: 20, h: 20}});
const cocoon: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        if (decoration.d === 'right') {
            drawFrameContentReflectedAt(context, cocoonBackFrame, decoration);
            if (decoration.child) {
                decoration.child.x = decoration.x;
                decoration.child.y = decoration.y;
                decoration.child.render(context, state);
            }
            // Draw contained object here.
            drawFrameContentReflectedAt(context, cocoonFrame, decoration);
        } else {
            drawFrameContentAt(context, cocoonBackFrame, decoration);
            if (decoration.child) {
                decoration.child.x = decoration.x;
                decoration.child.y = decoration.y;
                decoration.child.render(context, state);
            }
            // Draw contained object here.
            drawFrameContentAt(context, cocoonFrame, decoration);
        }
    },
    alternateRender(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        /*if (decoration.child?.alternateRender) {
            decoration.child.x = decoration.x;
            decoration.child.y = decoration.y;
            decoration.child.alternateRender(context, state);
        }*/
    },
    getBehaviors(state: GameState, decoration: Decoration) {
        return {
            solid: decoration.z < 30 && decoration.definition.drawPriority !== 'foreground',
        };
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(cocoonFrame, decoration);
    },
    onGrab(state: GameState, decoration: Decoration, direction: Direction, hero: Hero) {
        hero.action = null;
        if (decoration.definition.id === 'dreamPod') {
            enterZoneByTarget(state, 'dream', 'cocoonTeleporter');
        } else if (decoration.child) {
            decoration.child.onGrab?.(state, direction, hero);
        }
    }
};


const smallLightDomeFrame = requireFrame('gfx/tiles/jadeCityLight.png', {x: 162, y: 20, w: 26, h: 23});
const bigLightDomeFrame = requireFrame('gfx/tiles/jadeCityLight.png', {x: 104, y: 3, w: 47, h: 43});
const smallLightDome: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, smallLightDomeFrame, decoration);
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(smallLightDomeFrame, decoration);
    },
};

const bigLightDome: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, bigLightDomeFrame, decoration);
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(bigLightDomeFrame, decoration);
    },
};


const smallDarkDomeFrame= requireFrame('gfx/tiles/jadeCityDark.png', {x: 162, y: 20, w: 26, h: 23});
const bigDarkDomeFrame= requireFrame('gfx/tiles/jadeCityDark.png', {x: 104, y: 3, w: 47, h: 43});
const smallDarkDome: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, smallDarkDomeFrame, decoration);
    },
    behaviors: {
        solid: true,
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(smallDarkDomeFrame, decoration);
    },
};

const bigDarkDome: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, bigDarkDomeFrame, decoration);
    },
    behaviors: {
        solid: false,
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(bigDarkDomeFrame, decoration);
    },
};


const [helixBaseFrame] = createAnimation('gfx/objects/helixBaseCombined.png',
    {w: 356, h: 325, content: {x: 120, y: 273, w: 114, h: 46}}, {}
).frames;
const helixBase: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, helixBaseFrame, decoration);
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(helixBaseFrame, decoration);
    },
};

const [helixTopFrame] = createAnimation('gfx/objects/helixTop.png',
    {w: 132, h: 292, content: {x: 124, y: 168, w: 124, h: 120}}, {left: 127, top: 2}
).frames;
const helixTop: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, helixTopFrame, decoration);
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(helixTopFrame, decoration);
    },
};

// Walls for the spirit tree, as rectangles relative to the top left corner of the frame.
const spiritTreeWalls: Rect[] = [
    {x: 57, y: 241, w: 125, h: 27},
    {x: 62, y: 268, w: 29, h: 16},
    {x: 105, y: 266, w: 33, h: 23},
    {x: 144, y: 251, w: 27, h: 31},
];
const spiritTreeFrame = requireFrame('gfx/objects/spiritTree.png', {x: 0, y: 0, w: 240, h: 304, content: {x: 50, y: 230, w: 135, h: 60}});
const spiritTree: DecorationType = {
    render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
        drawFrameContentAt(context, spiritTreeFrame, decoration);
    },
    getBehaviors(state: GameState, decoration: Decoration, x?: number, y?: number): TileBehaviors|undefined {
        // Adjust the x/y values to be relative to the top left corner of the frame, to match the coordinates
        // used when defining the walls.
        x = x - (decoration.x - spiritTreeFrame.content.x);
        y = y - (decoration.y - spiritTreeFrame.content.y);
        for (const r of spiritTreeWalls) {
            if (isPointInShortRect(x, y, r)) {
                return {solid: true};
            }
        }
        return {};
    },
    getYDepth(decoration: Decoration): number {
        return decoration.y + 16;
    },
    getHitbox(decoration: Decoration): Rect {
        return getFrameHitbox(spiritTreeFrame, decoration);
    },
    onGrab(state: GameState, decoration: Decoration, direction: Direction, hero: Hero) {
        state.hero.action = null;
        setSpawnLocation(state, {
            ...state.location,
            x: decoration.x + spiritTreeFrame.content.w / 2 - 8,
            y: decoration.y + spiritTreeFrame.content.h + 4,
        });
        appendScript(state, '{@spiritTree.interact}');
        return;
    }
};

export const decorationTypes = {
    helixBase,
    helixTop,
    anvil,
    basket,
    bearRug,
    bed,
    cocoon,
    floorBed,
    chair,
    cushion,
    kettle,
    logPile,
    fireplace,
    glassWall,
    placeSettingFancy,
    placeSettingNormal,
    pottedPlant,
    shelves,
    stump,
    table,
    tube,
    windowOctogonal,
    smallLightDome,
    bigLightDome,
    smallDarkDome,
    bigDarkDome,
    lightningBeastStatue: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            const frame = stormBeastStatueFrame;
            drawFrameContentAt(context, frame, decoration);
        },
        behaviors: {
            solid: true,
        },
        getHitbox(decoration: Decoration): Rect {
            // If the hitbox looks strange in the editor, remember that the statues are placed at high z values in the game.
            return getFrameHitbox(stormBeastStatueFrame, decoration);
        },
    } as DecorationType,
    fireBeastStatue: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            const frame = flameBeastStatueFrame;
            drawFrameContentAt(context, frame, decoration);
        },
        behaviors: {
            solid: true,
        },
        getHitbox(decoration: Decoration): Rect {
            // If the hitbox looks strange in the editor, remember that the statues are placed at high z values in the game.
            return getFrameHitbox(flameBeastStatueFrame, decoration);
        },
    } as DecorationType,
    iceBeastStatue: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            drawFrameContentAt(context, frostBeastStatueFrame, decoration);
        },
        behaviors: {
            solid: true,
        },
        getHitbox(decoration: Decoration): Rect {
            // If the hitbox looks strange in the editor, remember that the statues are placed at high z values in the game.
            return getFrameHitbox(frostBeastStatueFrame, decoration);
        },
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
    spiritTree,
}

objectHash.decoration = Decoration;

declare global {
    export type DecorationType = keyof typeof decorationTypes;
}
