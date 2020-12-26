import * as _ from 'lodash';

import { FrameDimensions, FullRectangle, ShortRectangle } from 'app/types';

export function ifdefor<T>(value: T, defaultValue: T = null): T {
    if (value !== undefined && !(typeof value === 'number' && isNaN(value))) {
        return value;
    }
    return defaultValue;
}

export function isPointInRect(x: number, y: number, l: number, t: number, w: number, h: number): boolean {
    return !(y < t || y > (t + h) || x < l || x > (l + w));
}

export function isPointInShortRect(x: number, y: number, {x: l = 0, y: t = 0, w = 0, h = 0}: ShortRectangle): boolean {
    return !(y < t || y > t + h || x < l || x > l + w);
}

export function isPointInRectObject(x: number, y: number, rectangle: FullRectangle): boolean {
    if (!rectangle || ifdefor(rectangle.top) === null || ifdefor(rectangle.left) === null
         || ifdefor(rectangle.width) === null || ifdefor(rectangle.height) === null) {
        return false;
    }
    return !(y < rectangle.top || y > (rectangle.top + rectangle.height)
        || x < rectangle.left || x > (rectangle.left + rectangle.width));
}


export function rectanglesOverlap(A: FullRectangle, B: FullRectangle) {
    return !(A.bottom < B.top || A.top > B.bottom || A.right < B.left || A.left > B.right);
}

export function collision(element1: HTMLElement, element2: HTMLElement): boolean {
    if (!element1 || !element2) {
        debugger;
        return false;
    }
    const { y: t, x: l, width: w, height: h } = element1.getBoundingClientRect();
    const b = t + h;
    const r = l + w;
    const { y: T, x: L, width: W, height: H } = element2.getBoundingClientRect();
    const B = T + H;
    const R = L + W;
    return !(B < t || T > b || R < l || L > r);
}

// returns the area overlap between two divs.
export function getCollisionArea(element1: HTMLElement, element2: HTMLElement) {
    const { y: t, x: l, width: w, height: h } = element1.getBoundingClientRect();
    const b = t + h;
    const r = l + w;
    const { y: T, x: L, width: W, height: H } = element2.getBoundingClientRect();
    const B = T + H;
    const R = L + W;
    return Math.max(Math.min(B - t, b - T), 0) * Math.max(Math.min(R - l, r - L), 0);
}

export function getElementRectangle(element: HTMLElement, container = null): ShortRectangle {
    let b = element.getBoundingClientRect();
    const rect = { x: b.left, y: b.top, w: b.width, h: b.height };
    // If container is specified, return the rectangle relative to the container's coordinates.
    if (container) {
        const containerRect = container.getBoundingClientRect();
        rect.x -= containerRect.left;
        rect.y -= containerRect.top;
    }
    return rect;
}

export function fillRect(context: CanvasRenderingContext2D, {x, y, w, h}: ShortRectangle, color: string = null) {
    if (color) {
        context.fillStyle = color;
    }
    context.fillRect(x, y, w, h);
}
export function drawRect(context: CanvasRenderingContext2D, rectangle: ShortRectangle) {
    context.rect(rectangle.x, rectangle.y, rectangle.w, rectangle.h);
}

export function rectangle(left: number, top: number, width: number, height: number): FullRectangle {
    return {left: left, top: top, width: width, height: height, right: left + width, bottom: top + height};
}
export function r(x: number, y: number, w: number, h: number): ShortRectangle {
    return {x, y, w, h};
}
export function d(w: number, h: number): FrameDimensions {
    return {w, h};
}
export function pad({x, y, w, h}: ShortRectangle, m: number): ShortRectangle {
    return {x: x - m, w: w + 2 * m, y: y - m, h: h + 2 * m};
}
export function rectangleCenter(rectangle: FullRectangle): [number, number] {
    return [rectangle.left + rectangle.width / 2, rectangle.top + rectangle.height / 2];
}
export function rectangleFromPoints(A: {x: number, y: number}, B: {x: number, y: number}): FullRectangle {
    var left = Math.min(A.x, B.x);
    var top = Math.min(A.y, B.y);
    return rectangle(left, top, Math.abs(A.x - B.x), Math.abs(A.y - B.y));
}

export function drawRunningAnts(context: CanvasRenderingContext2D, rectangle: FullRectangle) {
    context.save();
    context.strokeStyle = 'black';
    var frame = Math.floor(Date.now() / 80) % 10;
    if (frame < 5) {
        context.setLineDash([frame, 5, 5 - frame, 0]);
    } else {
        context.setLineDash([0, frame - 5, 5, 10 - frame]);
    }
    context.strokeRect(rectangle.left, rectangle.top, rectangle.width, rectangle.height);
    context.strokeStyle = 'white';
    frame = (frame + 5) % 10;
    if (frame < 5) {
        context.setLineDash([frame, 5, 5 - frame, 0]);
    } else {
        context.setLineDash([0, frame - 5, 5, 10 - frame]);
    }
    context.strokeRect(rectangle.left, rectangle.top, rectangle.width, rectangle.height);
    context.restore();
}


export function arrMod<T>(array: T[], index: number): T {
    return array[(index % array.length + array.length) % array.length];
}

export function removeElementFromArray<T>(array: T[], element: T, throwErrorIfMissing = false): T {
    const index = array.indexOf(element);
    if (index < 0) {
        if (throwErrorIfMissing) throw new Error("Element was not found to remove from array.");
        return;
    }
    return array.splice(index, 1)[0];
}


// Return the minimum angle between two angles, specified in degrees.
export function getThetaDistance(angle1: number, angle2: number): number {
    const diff = Math.abs(angle1 - angle2) % 360;
    return Math.min(diff, 360 - diff);
}

export function saveToFile(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    // This might prevent leaking memory.
    URL.revokeObjectURL(a.href);
}

export function readFromFile(): Promise<string> {
    return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.type = 'file';
        input.click();
        input.onchange = function () {
            console.log('on change');
            console.log(input.files);
            if (!input.files[0]) {
                return;
            }
            const reader = new FileReader();
            reader.readAsText(input.files[0], "UTF-8");
            reader.onload = function (event) {
                console.log('Loaded file contents');
                resolve('' + event.target.result);
            }
            reader.onerror = function (event) {
                console.log(event);
                reject("error reading file");
                debugger;
            }
        };
    });
}
