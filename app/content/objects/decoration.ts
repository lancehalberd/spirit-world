import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrame } from 'app/utils/animations';


export class Decoration implements ObjectInstance {
    area: AreaInstance;
    definition: DecorationDefinition;
    drawPriority: DrawPriority = 'foreground';
    isObject = <const>true;
    x: number;
    y: number;
    w: number;
    h: number;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    constructor(state: GameState, definition: DecorationDefinition) {
        this.definition = definition;
        this.drawPriority = definition.drawPriority || 'foreground';
        this.x = definition.x;
        this.y = definition.y;
        this.w = definition.w;
        this.h = definition.h;
    }
    getHitbox(state: GameState): Rect {
        return this;
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
    lightningBeastStatueImage,
    fireBeastStatueImage
] = createAnimation('gfx/objects/spiritQuestStatue-draftSprites-58x60.png', {w: 58, h: 60}, {cols: 3}).frames;

export const decorationTypes = {
    lightningBeastStatue: {
        render(context: CanvasRenderingContext2D, state: GameState, decoration: Decoration) {
            drawFrame(context, lightningBeastStatueImage, {...lightningBeastStatueImage, x: decoration.x, y: decoration.y});
        }
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
}
objectHash.decoration = Decoration;

declare global {
    export type DecorationType = keyof typeof decorationTypes;
}
