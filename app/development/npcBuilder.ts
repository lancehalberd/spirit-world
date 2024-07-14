import { createCanvasAndContext } from 'app/utils/canvas';
import { drawFrame, frameAnimation } from 'app/utils/animations';
import { allImagesLoaded } from 'app/utils/images';
import { requireFrame } from 'app/utils/packedImages';


const npcImage = requireFrame('gfx/npcs/Humans-Sheet.png', {x: 0, y: 0, w: 384, h: 990 });

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
    drawFrame(context, {image: npcImage.image, x, y, w: 24, h: 30}, {x: tx, y: ty, w: 24, h: 30});
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
        drawNpcFrame(context, 72 * pants + xOffset, 840 + childOffset, x, y);
        // Shoes
        drawNpcFrame(context, 72 * shoes + xOffset, 930 + childOffset, x, y);
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
