import { createCanvasAndContext } from 'app/utils/canvas';
import { images } from 'app/utils/images';

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

export function packSprites(prefix: string, gridSize: number, columns: number, rows: number): PackedImageData[] {
    const packedImages: PackingImageData[] = [];
    for (const key of Object.keys(images)) {
        // Ignore already packed images.
        if (key.startsWith('gfx/packed_images')) {
            continue;
        }
        if (!key.startsWith(prefix)) {
            continue;
        }
        const {width, height} = images[key];
        if (width > gridSize * columns) {
            console.log('Image ' + key + ' is too wide to pack: ' + width);
            continue;
        }
        if (height > gridSize * rows) {
            console.log('Image ' + key + ' is too tall to pack: ' + height);
            continue;
        }
        let packed = false;
        for (const packedImage of packedImages) {
            if (packSprite(key, images[key], packedImage, gridSize)) {
                packed = true;
                break;
            }
        }
        if (!packed) {
            const [canvas, context] = createCanvasAndContext(gridSize * columns, gridSize * rows);
            const newPackedImage: PackingImageData = {
                packedImages: [],
                grid: booleanGrid(columns, rows),
                image: canvas,
                context,
            };
            packSprite(key, images[key], newPackedImage, gridSize);
            packedImages.push(newPackedImage);
        }
        // Loop through existing packedImages and try to place this image in free cells.
        // If the image cannot be placed, create a new packed image and place it there.
        // skip any images that exceed either dimension.
    }
    return packedImages;
}
window['packSprites'] = packSprites;

export function serializePackedImage(packedImage: PackingImageData): string {
    return `
{
    image: requireImage('gfx/packed_images/packed-sprites.png'),
    packedImages: [
`
    + packedImage.packedImages.map(i => `        {x:${i.x},y:${i.y},w:${i.w},h:${i.h},originalSource:'${i.originalSource}'}`).join(",\n") +
`
    ],
},`
}
window['serializePackedImage'] = serializePackedImage;

export function packSprite(key: string, image: HTMLImageElement, packedImage: PackingImageData, gridSize: number): boolean {
    const cellHeight = Math.ceil(image.height / gridSize);
    const cellWidth = Math.ceil(image.width / gridSize);
    const { grid } = packedImage;
    for (let y = 0; y <= grid.length - cellHeight; y++) {
        for (let x = 0; x <= grid[y].length - cellWidth; x++) {
            if (grid[y][x]) {
                // This spot is taken.
                continue;
            }
            if (addSpriteToLocation(key, image, packedImage, gridSize, [x, y])) {
                return true;
            }
        }
    }
    return false;
}

export function addSpriteToLocation(key: string, image: HTMLImageElement, packedImage: PackingImageData, gridSize: number, [x, y]: Coords): boolean {
    const cellHeight = Math.ceil(image.height / gridSize);
    const cellWidth = Math.ceil(image.width / gridSize);
    const { grid } = packedImage;
    // Check if all cells the image requires are unused.
    for (let sy = y; sy < y + cellHeight; sy++) {
        for (let sx = x; sx < x + cellWidth; sx++) {
            if (grid[sy][sx]) {
                return false;
            }
        }
    }
    packedImage.packedImages.push({
        x: x * gridSize,
        y: y * gridSize,
        w: image.width,
        h: image.height,
        originalSource: key,
    });
    packedImage.context.drawImage(image, x * gridSize, y * gridSize);
    // If they are all unused, add the image and mark the cells as used.
    for (let sy = y; sy < y + cellHeight; sy++) {
        for (let sx = x; sx < x + cellWidth; sx++) {
            grid[sy][sx] = true;
        }
    }
    return true;
}
