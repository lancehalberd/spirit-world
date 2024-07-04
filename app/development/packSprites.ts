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
            if (packSprite(key, images[key], packedImage, gridSize, padding)) {
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
            packSprite(key, images[key], newPackedImage, gridSize, padding);
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

function packSprite(key: string, image: HTMLImageElement, packedImage: PackingImageData, gridSize: number, padding: number): boolean {
    const cellHeight = Math.ceil((image.height + padding) / (gridSize + padding));
    const cellWidth = Math.ceil((image.width + padding) / (gridSize + padding));
    const { grid } = packedImage;
    for (let y = 0; y <= grid.length - cellHeight; y++) {
        for (let x = 0; x <= grid[y].length - cellWidth; x++) {
            if (grid[y][x]) {
                // This spot is taken.
                continue;
            }
            if (addSpriteToLocation(key, image, packedImage, gridSize, [x, y], padding)) {
                return true;
            }
        }
    }
    return false;
}

function addSpriteToLocation(key: string, image: HTMLImageElement, packedImage: PackingImageData, gridSize: number, [gx, gy]: Coords, padding: number): boolean {
    const cellHeight = Math.ceil((image.height + padding) / (gridSize + padding));
    const cellWidth = Math.ceil((image.width + padding) / (gridSize + padding));
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
    packedImage.packedImages.push({
        x: px,
        y: py,
        w: image.width,
        h: image.height,
        originalSource: key,
    });
    // Uncomment this to see which parts of the grid the packaged images are taking up.
    /*packedImage.context.beginPath();
    packedImage.context.fillStyle = 'green'
    packedImage.context.rect(px, py, cellWidth * gridSize + padding * (cellWidth - 1), cellHeight * gridSize + padding * (cellHeight - 1))
    packedImage.context.fill();*/
    packedImage.context.drawImage(image, px, py);
    // If they are all unused, add the image and mark the cells as used.
    for (let sy = gy; sy < gy + cellHeight; sy++) {
        for (let sx = gx; sx < gx + cellWidth; sx++) {
            grid[sy][sx] = true;
        }
    }
    return true;
}
