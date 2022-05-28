import { unlockAudio } from 'app/utils/sounds';

import { Coords } from 'app/types';

let mousePosition: Coords = [-1000, -1000];
let mouseIsDown: boolean = false;

export function isMouseDown(): boolean {
    return mouseIsDown;
}


export function getMousePosition(container: HTMLElement = null, scale = 1): Coords {
    if (container) {
        const containerRect:DOMRect = container.getBoundingClientRect();
        return [
            (mousePosition[0] - containerRect.x) / scale,
            (mousePosition[1] - containerRect.y) / scale,
        ];
    }
    return [mousePosition[0] / scale, mousePosition[1] / scale];
}

function onMouseMove(event) {
    mousePosition = [event.pageX, event.pageY];
    // console.log(mousePosition);
}
function onMouseDown(event) {
    if (event.which === 1) mouseIsDown = true;
}
function onMouseUp(event) {
    if (event.which === 1) mouseIsDown = false;
    unlockAudio();
}

export function bindMouseListeners() {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
}
/* This would in theory be used if we ever cleaned up the application
export function unbindMouseListeners() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mouseup', onMouseUp);
    // Prevent mouse from being "stuck down"
    mouseIsDown = false;
}*/


export function isMouseOverElement(element: HTMLElement): boolean {
    const rect:DOMRect = element.getBoundingClientRect();
    return mousePosition[0] >= rect.x && mousePosition[0] <= rect.x + rect.width
        && mousePosition[1] >= rect.y && mousePosition[1] <= rect.y + rect.height;
}
