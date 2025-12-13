import {createCanvasAndContext} from 'app/utils/canvas';
import {images} from 'app/utils/images';
import {isObjectInsideTarget, removeElementFromArray} from 'app/utils/index';
import {framesBySource} from 'app/utils/packedImages';

function booleanGrid(columns: number, rows: number): boolean[][] {
    const grid: boolean[][] = [];
    for (let y = 0; y < rows; y++) {
        grid[y] = [];
        for (let x = 0; x < columns; x++) {
            grid[y][x] = false;
        }
    }
    return grid;
}

export function packSprites(prefixes: string[], gridSize: number = 16, columns: number = 64, rows: number = 160, padding: number = 0): PackedImageData[] {
    const packedImages: PackingImageData[] = [];
    for (const key of Object.keys(images)) {
        // Ignore already packed images.
        if (key.startsWith('gfx/packed_images')) {
            continue;
        }
        if (!prefixes.some(prefix => key.startsWith(prefix))) {
            continue;
        }
        const parentFrames = nestFrames(key);
        for (const parentFrame of parentFrames) {
            //const {width, height} = images[key];
            if (parentFrame.w > gridSize * columns) {
                console.log('Image ' + key + ':' + parentFrame.frameString + ' is too wide to pack: ' + parentFrame.w);
                continue;
            }
            if (parentFrame.h > gridSize * rows) {
                console.log('Image ' + key + ':' + parentFrame.frameString + ' is too tall to pack: ' + parentFrame.h);
                continue;
            }
            let packed = false;
            for (const packedImage of packedImages) {
                if (packSprite(key, images[key], parentFrame, packedImage, gridSize, padding)) {
                    packed = true;
                    break;
                }
            }
            if (!packed) {
                const width = gridSize * columns + padding * (columns - 1);
                const height = gridSize * rows + padding * (rows - 1);
                const [canvas, context] = createCanvasAndContext(width, height);
                const newPackedImage: PackingImageData = {
                    packedImages: [],
                    grid: booleanGrid(columns, rows),
                    image: canvas,
                    context,
                };
                packSprite(key, images[key], parentFrame, newPackedImage, gridSize, padding);
                packedImages.push(newPackedImage);
            }
        }
        // Loop through existing packedImages and try to place this image in free cells.
        // If the image cannot be placed, create a new packed image and place it there.
        // skip any images that exceed either dimension.
    }
    return packedImages;
}
window['packSprites'] = packSprites;

export function serializePackedImage(packedImage: PackingImageData, name: string): string {
    return `
{
    image: requireImage('gfx/packed_images/${name}.png'),
    packedImages: [
`
    + packedImage.packedImages.map(i => `        {x:${i.x},y:${i.y},w:${i.w},h:${i.h},originalSource:'${i.originalSource}',frameStrings:['${i.frameStrings.join("','")}']}`).join(",\n") +
`
    ],
},`
}
window['serializePackedImage'] = serializePackedImage;

type FrameWithFrameString = Rect & {frameString: string};
interface ParentFrame extends FrameWithFrameString {
    childFrames: FrameWithFrameString[]
}
function nestFrames(key: string): ParentFrame[] {
    // First convert all the frame strings for this image source back into actual frames.
    const frameStrings = framesBySource[key];
    const frames: FrameWithFrameString[] = [];
    for (const frameString of frameStrings) {
        const [x,y,w,h] = frameString.split(',').map(s => Number(s));
        frames.push({x,y,w,h,frameString});
    }
    const parentFrames: {[key in string]: ParentFrame} = {};
    function nestAinB(A: FrameWithFrameString, B: FrameWithFrameString) {
        const children = [
            A,
            ...(parentFrames[A.frameString]?.childFrames ?? []),
        ];
        parentFrames[B.frameString] = parentFrames[B.frameString] ?? {
            ...B,
            childFrames: [],
        };
        const parent = parentFrames[B.frameString];
        parent.childFrames = [...parent.childFrames, ...children];
        delete parentFrames[A.frameString];
    }
    while (frames.length) {
        const frame = frames.pop();
        let wasNested = false;
        for (const otherFrame of [...frames]) {
            if (isObjectInsideTarget(frame, otherFrame)) {
                nestAinB(frame, otherFrame);
                // Once the current frame is placed in another frame we can stop processing it,
                // it will be handled by the parent frame going forward.
                wasNested = true;
                break;
            } else if (isObjectInsideTarget(otherFrame, frame)) {
                nestAinB(otherFrame, frame);
                removeElementFromArray(frames, otherFrame);
            }
        }
        // If this frame was not nested or already added as a parent frame, add it as an empty parent frame now.
        if (!wasNested && !parentFrames[frame.frameString]) {
            parentFrames[frame.frameString] = {
                ...frame,
                childFrames: [],
            };
        }
    }
    return Object.values(parentFrames);
}
window.nestFrames = nestFrames;

function packSprite(key: string, image: HTMLImageElement, parentFrame: ParentFrame, packedImage: PackingImageData, gridSize: number, padding: number): boolean {
    const cellHeight = Math.ceil((parentFrame.h + padding) / (gridSize + padding));
    const cellWidth = Math.ceil((parentFrame.w + padding) / (gridSize + padding));
    const { grid } = packedImage;
    for (let y = 0; y <= grid.length - cellHeight; y++) {
        for (let x = 0; x <= grid[y].length - cellWidth; x++) {
            if (grid[y][x]) {
                // This spot is taken.
                continue;
            }
            if (addSpriteToLocation(key, image, parentFrame, packedImage, gridSize, [x, y], padding)) {
                return true;
            }
        }
    }
    return false;
}

function addSpriteToLocation(key: string, image: HTMLImageElement, parentFrame: ParentFrame, packedImage: PackingImageData, gridSize: number, [gx, gy]: Coords, padding: number): boolean {
    const cellHeight = Math.ceil((parentFrame.h + padding) / (gridSize + padding));
    const cellWidth = Math.ceil((parentFrame.w + padding) / (gridSize + padding));
    const { grid } = packedImage;
    // Check if all cells the image requires are unused.
    for (let sy = gy; sy < gy + cellHeight; sy++) {
        for (let sx = gx; sx < gx + cellWidth; sx++) {
            if (grid[sy][sx]) {
                return false;
            }
        }
    }
    const px = gx * (gridSize + padding);
    const py = gy * (gridSize + padding);
    const newPackedImage: PackedImage = {
        x: px,
        y: py,
        w: parentFrame.w,
        h: parentFrame.h,
        originalSource: key,
        frameStrings: [parentFrame.frameString],
    };
    for (const child of parentFrame.childFrames) {
        newPackedImage.frameStrings.push(child.frameString);
    }
    packedImage.packedImages.push(newPackedImage);
    // Uncomment this to see which parts of the grid the packaged images are taking up.
    /*packedImage.context.beginPath();
    packedImage.context.fillStyle = 'green'
    packedImage.context.rect(px, py, cellWidth * gridSize + padding * (cellWidth - 1), cellHeight * gridSize + padding * (cellHeight - 1))
    packedImage.context.fill();*/
    packedImage.context.drawImage(image,
        parentFrame.x, parentFrame.y, parentFrame.w, parentFrame.h,
        px, py, parentFrame.w, parentFrame.h,
    );
    // If they are all unused, add the image and mark the cells as used.
    for (let sy = gy; sy < gy + cellHeight; sy++) {
        for (let sx = gx; sx < gx + cellWidth; sx++) {
            grid[sy][sx] = true;
        }
    }
    return true;
}
