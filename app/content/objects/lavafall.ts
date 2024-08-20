import { objectHash } from 'app/content/objects/objectHash';
import { FRAME_LENGTH } from 'app/gameConstants';
import { createAnimation, drawFrameAt, getFrame } from 'app/utils/animations';
//import { createCanvasAndContext } from 'app/utils/canvas';

const lavaFallAnimation = createAnimation('gfx/tiles/lavaAnimations.png', {w: 48, h: 40}, {top: 176, cols: 8, duration: 4})

export class Lavafall implements ObjectInstance {
    area: AreaInstance;
    definition: WaterfallDefinition;
    behaviors: TileBehaviors = {
        touchHit: {
            element: 'fire',
            damage: 4,
        },
    };
    drawPriority: DrawPriority = 'background';
    ignorePits = true;
    isObject = <const>true;
    x: number;
    y: number;
    w: number;
    h: number;
    status: ObjectStatus = 'normal';
    animationTime = 0;
    constructor(state: GameState, definition: WaterfallDefinition) {
        this.definition = definition;
        this.x = definition.x;
        this.y = definition.y;
        this.w = definition.w;
        this.h = definition.h;
        // this.animationTime = Math.floor(Math.random() * lavaFallAnimation.duration / 20) * 20;
    }
    getHitbox(): Rect {
        return {x: this.x, y: this.y, w: this.w, h: this.h};
    }
    getYDepth() {
        return this.y + this.h + 8;
    }
    update(state: GameState) {
        this.animationTime += FRAME_LENGTH;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        let animationTime = this.animationTime;
        let frame = getFrame(lavaFallAnimation, animationTime);
        //renderWaterfallTiles(context, state, this);
        // TOP
        drawFrameAt(context, {...frame, x: frame.x, y: frame.y, w: 16, h: 12}, {x: this.x, y: this.y});
        for (let x = this.x + 16; x <= this.x + this.w - 32; x += 16) {
            drawFrameAt(context, {...frame, x: frame.x + 16, y: frame.y, w: 16, h: 12}, {x, y: this.y});
        }
        drawFrameAt(context, {...frame, x: frame.x + 32, y: frame.y, w: 16, h: 12}, {x: this.x + this.w - 16, y: this.y});

        // MIDDLE
        for (let y = this.y + 12; y <= this.y + this.h - 28; y += 16) {
            //animationTime *= 1.2;
            //frame = getFrame(lavaFallAnimation, animationTime);
            drawFrameAt(context, {...frame, x: frame.x, y: frame.y + 12, w: 16, h: 16}, {x: this.x, y});
            for (let x = this.x + 16; x <= this.x + this.w - 28; x += 16) {
                drawFrameAt(context, {...frame, x: frame.x + 16, y: frame.y + 12, w: 16, h: 16}, {x, y});
            }
            drawFrameAt(context, {...frame, x: frame.x + 32, y: frame.y + 12, w: 16, h: 16}, {x: this.x + this.w - 16, y});
        }

        // BOTTOM
        //animationTime *= 1.2;
        //frame = getFrame(lavaFallAnimation, animationTime);
        drawFrameAt(context, {...frame, x: frame.x, y: frame.y + 28, w: 16, h: 12}, {x: this.x, y: this.y + this.h - 12});
        for (let x = this.x + 16; x <= this.x + this.w - 32; x += 16) {
            drawFrameAt(context, {...frame, x: frame.x + 16, y: frame.y + 28, w: 16, h: 12}, {x, y: this.y + this.h - 12});
        }
        drawFrameAt(context, {...frame, x: frame.x + 32, y: frame.y + 28, w: 16, h: 12}, {x: this.x + this.w - 16, y: this.y + this.h - 12});
        //drawFrameAt(context, frame, {x: this.x, y: this.y});
    }
}

objectHash.lavafall = Lavafall;
