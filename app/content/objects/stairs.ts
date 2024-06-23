import { objectHash } from 'app/content/objects/objectHash';
import { editingState } from 'app/development/editingState';
import { drawFrame } from 'app/utils/animations';
import { createCanvasAndContext } from 'app/utils/canvas';
import { requireFrame } from 'app/utils/packedImages';


// 202x562, 28x75
// 5px railing, 3px left, 12px middle, 3px right, 5px right
// 202, 205, 206, 222, 225,
// railing 3px top, 9px bottom

const leftStairsTop: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 207, y: 567, w: 3, h: 3});
const leftStairsMiddle: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 207, y: 570, w: 3, h: 8});
const leftStairsBottom: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 207, y: 631, w: 3, h: 2});
const centerStairsTop: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 210, y: 567, w: 12, h: 3});
const centerStairsMiddle: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 210, y: 570, w: 12, h: 8});
const centerStairsBottom: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 210, y: 631, w: 12, h: 2});
const rightStairsTop: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 222, y: 567, w: 3, h: 3});
const rightStairsMiddle: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 222, y: 570, w: 3, h: 8});
const rightStairsBottom: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 222, y: 631, w: 3, h: 2});

// 203,646 26x75 9px bottom, 4px top, 5px wide
const leftRailTop: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 202, y: 562, w: 5, h: 3});
const leftRailMiddle: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 202, y: 565, w: 5, h: 10});
const leftRailBottom: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 202, y: 628, w: 5, h: 9});
const rightRailTop: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 225, y: 562, w: 5, h: 3});
const rightRailMiddle: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 225, y: 565, w: 5, h: 10});
const rightRailBottom: Frame = requireFrame('gfx/tiles/futuristic.png', {x: 225, y: 628, w: 5, h: 9});


interface VerticalFrames {
    top: Frame
    middle: Frame
    bottom: Frame
}
interface HorizontalFrames {
    left: Frame
    center: Frame
    right: Frame
}
interface StairsStyle {
    stairs: {
        top: HorizontalFrames
        middle: HorizontalFrames
        bottom: HorizontalFrames
    }
    // These are not used for the conveyer belt styles.
    // They are also only supported for the up/down directions.
    leftRailing?: VerticalFrames
    rightRailing?: VerticalFrames
}

export const stairsStyles: {[key: string]: StairsStyle} = {
    // The height of this should be 10 + N*8
    futuristic: {
        stairs: {
            top: {left: leftStairsTop, center: centerStairsTop, right: rightStairsTop},
            middle: {left: leftStairsMiddle, center: centerStairsMiddle, right: rightStairsMiddle},
            bottom: {left: leftStairsBottom, center: centerStairsBottom, right: rightStairsBottom},
        },
        leftRailing: {top: leftRailTop, middle: leftRailMiddle, bottom: leftRailBottom},
        rightRailing: {top: rightRailTop, middle: rightRailMiddle, bottom: rightRailBottom},
    },
};
const defaultStairsStyle = stairsStyles.futuristic;

function renderVerticalSlice(this: void, context: CanvasRenderingContext2D, target: Rect, {top, middle, bottom}: VerticalFrames) {
    drawFrame(context, top,
        { ...top, x: target.x, y: target.y}
    );
    const h = target.h - top.h - bottom.h;
    if (h > 0) {
        drawFrame(context, middle, { ...middle, x: target.x, y: target.y + top.h, h});
    }
    drawFrame(context, bottom,
        { ...bottom, x: target.x, y: target.y + target.h - bottom.h}
    );
}

function renderHorizontalSlice(this: void, context: CanvasRenderingContext2D, target: Rect, {left, center, right}: HorizontalFrames) {
    drawFrame(context, left,
        { ...left, x: target.x, y: target.y}
    );
    const w = target.w - left.w - right.w;
    if (w > 0) {
        drawFrame(context, center, { ...center, x: target.x + left.w, y: target.y, w});
    }
    drawFrame(context, right,
        { ...right, x: target.x + target.w - right.w, y: target.y}
    );
}

export class Stairs implements ObjectInstance {
    area: AreaInstance;
    behaviors: TileBehaviors = {
        isGround: true,
        // Currently isGround does not block falling in pits by itself, we must also set
        // groundHeight > 0 to prevent falling into pits under the stairs.
        groundHeight: 1,
    };
    drawPriority: DrawPriority = 'background';
    isObject = <const>true;
    isNeutralTarget = true;
    ignorePits = true;
    x = this.definition.x;
    y = this.definition.y;
    status = this.definition.status;
    style: StairsStyle = stairsStyles[this.definition.style] || defaultStairsStyle;
    leftRailing?: Railing = this.style.leftRailing && new Railing(this, 'left');
    rightRailing?: Railing = this.style.rightRailing && new Railing(this, 'right');
    pattern?: CanvasPattern;
    constructor(state: GameState, public definition: StairsDefinition) {
    }
    getParts() {
        const parts: ObjectInstance[] = [];
        if (this.leftRailing) {
            parts.push(this.leftRailing);
        }
        if (this.rightRailing) {
            parts.push(this.rightRailing);
        }
        return parts;
    }
    getHitbox(state: GameState) {
        return this.definition;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (!this.pattern ) {
            const middleFrames = this.style.stairs.middle;
            const h = middleFrames.left.h;
            const [patternCanvas, patternContext] = createCanvasAndContext(this.definition.w, h);
            renderHorizontalSlice(patternContext, {x: 0, y: 0, w: this.definition.w, h}, middleFrames);
            this.pattern = context.createPattern(patternCanvas, 'repeat');
        }
        const topFrames = this.style.stairs.top;
        const topH = topFrames.left.h;
        const bottomFrames = this.style.stairs.bottom;
        const bottomH = bottomFrames.left.h;
        renderHorizontalSlice(context, {x: this.definition.x, y: this.definition.y, w: this.definition.w, h: topH}, topFrames);
        const h = this.definition.h - topH - bottomH;
        if (h > 0) {
            context.save();
                context.translate(this.x, this.y + topH);
                context.fillStyle = this.pattern;
                context.fillRect(0, 0, this.definition.w, h);
            context.restore();
            //drawFrame(context, middle, { ...middle, x: target.x, y: target.y + top.h, h});
        }
        renderHorizontalSlice(context, {
            x: this.definition.x,
            y: this.definition.y + this.definition.h - bottomH,
            w: this.definition.w,
            h: bottomH
        }, bottomFrames);
    }
}
// The railings are separated so that they can be solid and render with 'sprites' priority.
class Railing implements ObjectInstance {
    behaviors: TileBehaviors = {
        solid: true,
        midHeight: true,
    };
    drawPriority: DrawPriority = 'background';
    status: ObjectStatus;
    x: number;
    y: number;
    isObject = <const>true;
    pullingHeroDirection: Direction;
    frames: VerticalFrames= this.side === 'left' ? this.stairs.style.leftRailing : this.stairs.style.rightRailing;
    constructor(public stairs: Stairs, public side: 'left' | 'right') {
    }
    getHitbox(): Rect {
        const w = this.frames.top.w;
        const overhang = 6;
        if (this.side === 'left') {
            return { x: this.stairs.x - w, y: this.stairs.y - overhang, w, h: this.stairs.definition.h + 2 * overhang };
        }
        return { x: this.stairs.x + this.stairs.definition.w, y: this.stairs.y - overhang, w, h: this.stairs.definition.h + 2 * overhang };
    }
    get area(): AreaInstance {
        return this.stairs.area;
    }
    render(context, state: GameState) {
        const hitbox = this.getHitbox();
        const shadowH = 2;
        renderVerticalSlice(context, {...hitbox, h: hitbox.h + shadowH}, this.frames);
        /*
        let x = hitbox.x;
        drawFrame(context, this.frames.top,
            { ...this.frames.top, x, y: hitbox.y}
        );
        const h = hitbox.h + shadowH - this.frames.top.h - this.frames.bottom.h;
        if (h > 0) {
            drawFrame(context, this.frames.middle, { ...this.frames.middle, x, y: hitbox.y + this.frames.top.h, h});
        }
        drawFrame(context, this.frames.bottom,
            { ...this.frames.bottom, x, y: hitbox.y + hitbox.h - this.frames.bottom.h + shadowH}
        );*/
        if (editingState.showWalls) {
            context.save();
                context.globalAlpha *= 0.5;
                const r = this.getHitbox();
                context.fillStyle = 'red';
                context.fillRect(r.x, r.y, r.w, r.h);
            context.restore();
        }
    }
}

objectHash.stairs = Stairs;
