import {createCanvasAndContext} from 'app/utils/canvas';

export interface ImageComparisonResult {
    matches: boolean
    // Fully transparent where pixels match, opaque black where they differ.
    diffCanvas: HTMLCanvasElement
}

export function drawImageToCanvas(image: HTMLImageElement): HTMLCanvasElement {
    const [canvas, context] = createCanvasAndContext(image.naturalWidth, image.naturalHeight);
    context.drawImage(image, 0, 0);
    return canvas;
}

export function compareCanvases(actualCanvas: HTMLCanvasElement, expectedCanvas: HTMLCanvasElement): ImageComparisonResult {
    const width = actualCanvas.width, height = actualCanvas.height;
    const [diffCanvas, diffContext] = createCanvasAndContext(width, height);
    if (width !== expectedCanvas.width || height !== expectedCanvas.height) {
        // Treat a size mismatch as a total mismatch and fill the diff canvas solid black.
        diffContext.fillStyle = 'black';
        diffContext.fillRect(0, 0, width, height);
        return {matches: false, diffCanvas};
    }
    const actualData = actualCanvas.getContext('2d').getImageData(0, 0, width, height);
    const expectedData = expectedCanvas.getContext('2d').getImageData(0, 0, width, height);
    const diffImageData = diffContext.createImageData(width, height);
    let matches = true;
    for (let i = 0; i < actualData.data.length; i += 4) {
        if (actualData.data[i] !== expectedData.data[i]
            || actualData.data[i + 1] !== expectedData.data[i + 1]
            || actualData.data[i + 2] !== expectedData.data[i + 2]
            || actualData.data[i + 3] !== expectedData.data[i + 3]
        ) {
            matches = false;
            // Opaque black indicates a mismatched pixel; everything else stays fully transparent.
            diffImageData.data[i + 3] = 255;
        }
    }
    diffContext.putImageData(diffImageData, 0, 0);
    return {matches, diffCanvas};
}
