import Random from 'app/utils/Random';


export function isPointInRect(x: number, y: number, l: number, t: number, w: number, h: number): boolean {
    return !(y <= t || y >= (t + h) || x <= l || x >= (l + w));
}

export function isPointInShortRect(x: number, y: number, {x: l = 0, y: t = 0, w = 0, h = 0}: Rect): boolean {
    return !(y <= t || y >= t + h || x <= l || x >= l + w);
}

export function isPixelInShortRect(x: number, y: number, {x: l = 0, y: t = 0, w = 0, h = 0}: Rect): boolean {
    return !(y < t || y >= t + h || x < l || x >= l + w);
}

// Warning: For some reason I noticed this function was taking 200x longer than other simple function calls
// made inside field::getTileBehaviorsAndObstacles when profiling.
// I assume this is because chrome was not optimizing the call, and may have to do with the object spreading.
export function roundRect({x, y, w, h}: Rect): Rect {
    return {x: x | 0, y: y | 0, w: w | 0, h: h | 0 };
}

// This is similar to rectanglesOverlap, except that the rectangles here represent pixel grids
// and only overlap if they share an actual pixel.
export function boxesIntersect(A: Rect, B: Rect) {
    return !(A.y + A.h - 1 < B.y || A.y > B.y + B.h - 1 || A.x + A.w - 1 < B.x || A.x > B.x + B.w - 1);
}

export function isObjectInsideTarget(object: Rect, target: Rect): boolean {
    return object.x >= target.x && object.y >= target.y
        && object.x + object.w <= target.x + target.w && object.y + object.h <= target.y + target.h;
}

export function intersectArea(A: Rect, B: Rect): number {
    const l = Math.max(A.x, B.x), r = Math.min(A.x + A.w, B.x + B.w);
    const t = Math.max(A.y, B.y), b = Math.min(A.y + A.h, B.y + B.h);
    return Math.max(0, r - l) * Math.max(0, b - t)
}

// Get the smallest rectangle that contains both rectangles.
export function getBoundingRect(A: Rect, B: Rect): Rect {
    const l = Math.min(A.x, B.x), r = Math.max(A.x + A.w, B.x + B.w);
    const t = Math.min(A.y, B.y), b = Math.max(A.y + A.h, B.y + B.h);
    return {x: l, y: t, w: r - l, h: b - t};
}

export function rectanglesOverlap(A: Rect, B: Rect) {
    return !(A.y + A.h <= B.y || A.y >= B.y + B.h || A.x + A.w <= B.x || A.x >= B.x + B.w);
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

export function getElementRectangle(element: HTMLElement, container: HTMLElement = null): Rect {
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

export function fillRect(context: CanvasRenderingContext2D, {x, y, w, h}: Rect, color: string = null) {
    if (color) {
        context.fillStyle = color;
    }
    context.fillRect(x, y, w, h);
}
export function drawRect(context: CanvasRenderingContext2D, rectangle: Rect) {
    context.rect(rectangle.x, rectangle.y, rectangle.w, rectangle.h);
}

export function rectangle(left: number, top: number, width: number, height: number): FullRectangle {
    return {left: left, top: top, width: width, height: height, right: left + width, bottom: top + height};
}
export function r(x: number, y: number, w: number, h: number): Rect {
    return {x, y, w, h};
}
export function d(w: number, h: number): FrameDimensions {
    return {w, h};
}
export function pad({x, y, w, h}: Rect, m: number): Rect {
    return {x: x - m, w: w + 2 * m, y: y - m, h: h + 2 * m};
}
export function scaleRect({x, y, w, h}: Rect, scale: number): Rect {
    return {x: x * scale, w: w * scale, y: y * scale, h: h * scale};
}
export function translateRect({x, y, w, h}: Rect, tx: number, ty: number): Rect {
    return {x: x + tx, w, y: y + ty, h};
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

export function saveToFile(content: string, fileName: string, contentType: string) {
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
            if (!input.files[0]) {
                return;
            }
            const reader = new FileReader();
            reader.readAsText(input.files[0], "UTF-8");
            reader.onload = function (event) {
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

export function readImageFromFile(): Promise<{image: HTMLImageElement, fileName: string}> {
    return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.type = 'file';
        input.click();
        input.onchange = function (event: Event) {
            const target = (event.target as HTMLInputElement);
            const files = target.files;
            if (!input.files[0]) {
                return;
            }
            const reader = new FileReader();
            reader.onload = function () {
                const source = reader.result;
                const image = new Image();
                image.src = source.toString();
                image.onload = () => {
                    resolve({image, fileName: files.item(0).name});
                };
            }
            reader.onerror = function (event) {
                console.log(event);
                reject("error reading image file");
                debugger;
            }
            reader.readAsDataURL(files[0]);
        };
    });
}

export function readGetParameter(parameterName: string, defaultValue: string = ''): string {
    for (const item of location.search.substr(1).split('&')) {
        const tmp = item.split('=');
        if (tmp[0] === parameterName) {
            return decodeURIComponent(tmp[1]);
        }
    }
    return defaultValue;
}

export function readGetParameterAsInt(parameterName: string, defaultValue = 0): number {
    const number = parseInt(readGetParameter(parameterName), 10);
    return isNaN(number) ? defaultValue : number;
}

export function cloneDeep<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

export function sample<T>(collection: Collection<T>): T {
    return Random.element(collection);
}

export function fillGrid<T>(value: T, w: number, h: number): T[][] {
    const grid: T[][] = [];
    for (let y = 0; y < h; y++){
        grid[y] = [];
        for (let x = 0; x < w; x++){
            grid[y][x] = value;
        }
    }
    return grid;
}
