import { createCanvasAndContext } from 'app/utils/canvas';
import { images } from 'app/utils/images';

interface PackedImage extends Rect {
    originalSource: string
}

interface PackedImageData {
    packedImageSource: string
    packedImages: PackedImage[]
    image: HTMLImageElement | HTMLCanvasElement
}

// PackedImageData with additional fields used while packing.
interface PackingImageData extends PackedImageData {
    grid: boolean[][]
    context: CanvasRenderingContext2D
}

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
        if (!key.startsWith(prefix)) {
            continue;
        }
        console.log(key);
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
            if (packSprite(images[key], packedImage, gridSize)) {
                packed = true;
                break;
            }
        }
        if (!packed) {
            const [canvas, context] = createCanvasAndContext(gridSize * columns, gridSize * rows);
            const newPackedImage: PackingImageData = {
                packedImageSource: `${prefix}-pack-${packedImages.length}`,
                packedImages: [],
                grid: booleanGrid(columns, rows),
                image: canvas,
                context,
            };
            packSprite(images[key], newPackedImage, gridSize);
            packedImages.push(newPackedImage);
        }
        // Loop through existing packedImages and try to place this image in free cells.
        // If the image cannot be placed, create a new packed image and place it there.
        // skip any images that exceed either dimension.
    }
    return packedImages;
}
window['packSprites'] = packSprites;

export function packSprite(image: HTMLImageElement, packedImage: PackingImageData, gridSize: number): boolean {
    const cellHeight = Math.ceil(image.height / gridSize);
    const cellWidth = Math.ceil(image.width / gridSize);
    const { grid } = packedImage;
    for (let y = 0; y <= grid.length - cellHeight; y++) {
        for (let x = 0; x <= grid[y].length - cellWidth; x++) {
            if (grid[y][x]) {
                // This spot is taken.
                continue;
            }
            if (addSpriteToLocation(image, packedImage, gridSize, [x, y])) {
                return true;
            }
        }
    }
    return false;
}

export function addSpriteToLocation(image: HTMLImageElement, packedImage: PackingImageData, gridSize: number, [x, y]: Point): boolean {
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
        originalSource: image.src,
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
