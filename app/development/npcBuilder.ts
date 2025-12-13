import {createCanvasAndContext} from 'app/utils/canvas';
import {createAnimation, drawFrame, drawSolidTintedFrame, frameAnimation} from 'app/utils/animations';
import {allImagesLoaded} from 'app/utils/images';
import {requireFrame} from 'app/utils/packedImages';


const npcFrame = requireFrame('gfx/npcs/Humans-Sheet.png', {x: 0, y: 0, w: 384, h: 990 });

const columns = [0, 96, 192, 288];

interface HumanNpcOptions {
    d: Direction
    isChild: boolean
    isWoman: boolean
    skin: number
    hairColor: number
    hairStyle: number
    eyeColor: number
    lipColor: number
    shirt: number
    pants: number
    shoes: number
}

function drawNpcFrame(context: CanvasRenderingContext2D, x: number, y: number, tx: number, ty: number) {
    drawFrame(context, {image: npcFrame.image, x: npcFrame.x + x, y: npcFrame.y + y, w: 24, h: 30}, {x: tx, y: ty, w: 24, h: 30});
}

export function drawHumanNpcFrame(
    context: CanvasRenderingContext2D,
    x: number, y: number,
    {
        isChild = false,
        isWoman = false,
        d = 'down',
        skin = 0,
        hairColor = 0,
        hairStyle = 0,
        eyeColor = 0,
        lipColor = 0,
        shirt = 0,
        pants = 0,
        shoes = 0,
    }: Partial<HumanNpcOptions>
): void {

    let xOffset = 0;
    if (d === 'up') {
        xOffset = 24;
    } else if (d === 'right' || d === 'left') {
        xOffset = 48;
    }
    const childOffset = isChild ? 30 : 0;
    // Do not draw the frame until the source image is loaded.
    const drawFrame = async () => {
        await allImagesLoaded();
        // Body
        drawNpcFrame(context, columns[skin] + xOffset, childOffset + (isWoman ? 90 : 0), x, y);
        // Hair
        drawNpcFrame(context, columns[hairColor] + xOffset, 180 + hairStyle * 60 + childOffset + (isWoman ? 150 : 0), x, y);
        // Eyes + Mouth (don't render when direction is up)
        if (d === 'down') {
            drawNpcFrame(context, columns[eyeColor] + (isWoman ? 48 : 0), 480 + childOffset, x, y);
            drawNpcFrame(context, columns[lipColor], 570 + childOffset, x, y);
        } else if (d === 'left' || d === 'right') {
            drawNpcFrame(context, columns[eyeColor] + (isWoman ? 48 : 0) + 24, 480 + childOffset, x, y);
            drawNpcFrame(context, columns[lipColor] + 24, 570 + childOffset, x, y);
        }
        // Shirt
        drawNpcFrame(context, columns[shirt] + xOffset, 660 + childOffset + (isWoman ? 90 : 0), x, y);
        // Pants
        if (pants >= 0) {
            drawNpcFrame(context, 72 * pants + xOffset, 840 + childOffset, x, y);
        }
        // Shoes
        if (shoes >= 0) {
            drawNpcFrame(context, 72 * shoes + xOffset, 930 + childOffset, x, y);
        }
    }
    drawFrame();
}

const cardinalDirections: Direction[] = ['up', 'down', 'left', 'right'];

export function createHumanNpcActorAnimations(options: Partial<HumanNpcOptions>): ActorAnimations {
    const [npcCanvas, npcContext] = createCanvasAndContext(24, 4 * 30);
    let y = 0;
    const frames: {[key in Direction]?: FrameAnimation} = {};
    for (const d of cardinalDirections) {
        drawHumanNpcFrame(npcContext, 0, y, {...options, d});
        frames[d] = frameAnimation({image: npcCanvas, x: 0, y, w: 24, h: 30, content: {x: 6, y: 20, w: 12, h: 10}});
        y += 30;

    }
    const animations: ActorAnimations = {
        idle: frames
    };
    return animations;
}
window['createHumanNpcActorAnimations'] = createHumanNpcActorAnimations;


const spiritLinesFrame = requireFrame('gfx/npcs/spiritmovesheet-tinted.png', {x: 0, y: 0, w: 160, h: 112});
const spiritTintFrame = requireFrame('gfx/npcs/spiritmovesheet-tinted.png', {x: 0, y: 112, w: 160, h: 112});

const spiritGeometry: FrameDimensions = {w: 20, h: 28, content: {x: 2, y: 12, w: 16, h: 16}};

const tintedSpiritActorAnimations: {[key in string]: ActorAnimations} = {};
export function createTintedSpiritActorAnimations(color: string): ActorAnimations {
    if (tintedSpiritActorAnimations[color]) {
        return tintedSpiritActorAnimations[color];
    }
    const [canvas, context] = createCanvasAndContext(spiritLinesFrame.w, spiritLinesFrame.h);
    // This part can only be done after all the images load, but we can return the empty frames immediately.
    (async () => {
        await allImagesLoaded();
        drawSolidTintedFrame(context, {...spiritTintFrame, color}, {x: 0, y: 0, w: 160, h: 112});
        drawFrame(context, spiritLinesFrame, {x: 0, y: 0, w: 160, h: 112});
    })();
    const spiritUpAnimation: FrameAnimation = createAnimation(canvas, spiritGeometry, { cols: 8, y: 2, duration: 10});
    const spiritDownAnimation: FrameAnimation = createAnimation(canvas, spiritGeometry, { cols: 8, y: 0, duration: 10});
    const spiritLeftAnimation: FrameAnimation = createAnimation(canvas, spiritGeometry, { cols: 8, y: 3, duration: 10});
    const spiritRightAnimation: FrameAnimation = createAnimation(canvas, spiritGeometry, { cols: 8, y: 1, duration: 10});
    const animations: ActorAnimations = {
        idle: {
            up: spiritUpAnimation,
            down: spiritDownAnimation,
            left: spiritLeftAnimation,
            right: spiritRightAnimation,
        },
    };
    tintedSpiritActorAnimations[color] = animations;
    return animations;
}
