import { createCanvas, tagElement } from 'app/dom';
import { KEY, isKeyDown } from 'app/keyCommands';
import { drawFrame } from 'app/utils/animations';
import { getMousePosition, isMouseDown } from 'app/utils/mouse';

import { Coords, Frame } from 'app/types';

export function runTileRipper(frame: Frame, size: number = 8) {
    const container = tagElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'space-between';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.right = '0';
    container.style.bottom = '0';
    container.style.overflow = 'scroll';
    container.style.backgroundColor = 'black';

    const sourceCanvas = createCanvas(frame.w, frame.h);
    container.appendChild(sourceCanvas);
    const sourceContext = sourceCanvas.getContext('2d');
    sourceContext.imageSmoothingEnabled = false;

    const targetCanvas = createCanvas(size, size);
    targetCanvas.style.margin = '0 auto';
    const targetContext = targetCanvas.getContext('2d');
    targetContext.imageSmoothingEnabled = false;
    container.appendChild(targetCanvas);

    document.body.appendChild(container);

    let mouseDownCoords: Coords = null;
    let lastSelectedFrame = null;
    function displaySelectedFrame(selectedFrame: Frame): void {
        lastSelectedFrame = selectedFrame;
        targetCanvas.width = selectedFrame.w;
        targetCanvas.height = selectedFrame.h;
        drawFrame(targetContext, {
                ...selectedFrame,
                x: frame.x + selectedFrame.x,
                y: frame.y + selectedFrame.y,
            },
            {...selectedFrame, x: 0, y: 0}
        );
        // Draw the selection on the source image.
        drawFrame(sourceContext, frame, {...frame, x: 0, y: 0});
        sourceContext.beginPath();
        sourceContext.strokeStyle = 'white';
        sourceContext.strokeRect(selectedFrame.x, selectedFrame.y, selectedFrame.w, selectedFrame.h);
        sourceContext.stroke();
    }
    displaySelectedFrame({image: frame.image, x: 0, y: 0, w: size, h: size});

    function selectRectangle(coordsA: Coords, coordsB: Coords) {
        let L = Math.floor(Math.min(coordsA[0], coordsB[0]) / size) * size;
        let R = Math.ceil(Math.max(coordsA[0], coordsB[0]) / size) * size;
        let T = Math.floor(Math.min(coordsA[1], coordsB[1]) / size) * size;
        let B = Math.ceil(Math.max(coordsA[1], coordsB[1]) / size) * size;
        displaySelectedFrame({
            image: frame.image,
            x: L,
            y: T,
            w: Math.max(size, (R-L)),
            h: Math.max(size, (B-T)),
        });
    }

    sourceCanvas.addEventListener('mousedown', () => {
        mouseDownCoords = getMousePosition(sourceCanvas);
        selectRectangle(mouseDownCoords, mouseDownCoords)
    });
    sourceCanvas.addEventListener('mousemove', () => {
        if (!isMouseDown()) {
            return;
        }
        selectRectangle(mouseDownCoords, getMousePosition(sourceCanvas));
    });

    function handleKeyCommand(e: KeyboardEvent): void {
        if (e.which === KEY.ESCAPE) {
            container.remove();
            document.removeEventListener('keydown', handleKeyCommand);
        }
        const speed = isKeyDown(KEY.SHIFT) ? size : 1;
        if (e.which === KEY.UP) {
            frame.y += speed;
            displaySelectedFrame(lastSelectedFrame);
        }
        if (e.which === KEY.DOWN) {
            frame.y -= speed;
            displaySelectedFrame(lastSelectedFrame);
        }
        if (e.which === KEY.LEFT) {
            frame.x += speed;
            displaySelectedFrame(lastSelectedFrame);
        }
        if (e.which === KEY.RIGHT) {
            frame.x -= speed;
            displaySelectedFrame(lastSelectedFrame);
        }
    }
    document.addEventListener('keydown', handleKeyCommand);
}
