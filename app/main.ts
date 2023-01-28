import { CANVAS_SCALE } from 'app/gameConstants';
import { getContextMenu, hideContextMenu, showContextMenu } from 'app/development/contextMenu';
import { mainCanvas } from 'app/utils/canvas';
import { getMousePosition, } from 'app/utils/mouse';


let canvasCoords = null;
export function getCanvasCoords() {
    return canvasCoords;
}
// let dragStartCoords = null;
mainCanvas.addEventListener('mousemove', function () {
    // const [lastX, lastY] = canvasCoords || [-1, -1];
    const [x, y] = getMousePosition(mainCanvas, CANVAS_SCALE);
    canvasCoords = [x, y];
});

mainCanvas.addEventListener('mousedown', function (event) {
    if (event.which !== 1) {
        return;
    }
    const [x, y] = getMousePosition(mainCanvas, CANVAS_SCALE);
    canvasCoords = [x, y];
});


mainCanvas.addEventListener('mouseout', function (event) {
    canvasCoords = null;
});

document.addEventListener('mouseup', function (event) {
    if (event.which !== 1) {
        return;
    }
    if (!(event.target as HTMLElement).closest('.contextMenu')) {
        hideContextMenu();
    }
});

mainCanvas.addEventListener('contextmenu', function (event) {
    event.preventDefault();
    const [x, y] = getMousePosition();
    const menu = getContextMenu();
    showContextMenu(menu, x, y);
});
