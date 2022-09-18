import { drawFrame } from 'app/utils/animations';
import { rectangleCenter } from 'app/utils/index';

import { Frame } from 'app/types';

export function query(className): HTMLElement {
    return document.querySelector(className);
}

export function queryAll(className): NodeListOf<HTMLElement> {
    return document.querySelectorAll(className);
}

export const mainCanvas:HTMLCanvasElement = query('.js-mainCanvas') as HTMLCanvasElement;
window['mainCanvas'] = mainCanvas;
// mainCanvas.width = mainCanvas.height = 512;
export const mainContext = mainCanvas.getContext('2d');
mainContext.imageSmoothingEnabled = false;
window['mainContext'] = mainContext;

export function createCanvas(width, height, classes = ''): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.className = classes;
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

export function createCanvasAndContext(width, height): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    return [canvas, context];
}

export function createFrameCanvas(frame: Frame, scale: number = 1): HTMLCanvasElement {
    const canvas = createCanvas(frame.w, frame.h);
    if (scale !== 1) {
        canvas.style.transform = `scale(${scale})`;
    }
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    drawFrame(context, frame, {x: 0, y: 0, w: frame.w, h: frame.h});
    return canvas;
}

const CANVAS_SCALE = 10;

export function debugCanvas(canvas: HTMLCanvasElement | Frame) {
    if (canvas instanceof HTMLCanvasElement) {
        document.body.append(canvas);
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.backgroundColor = 'blue';
    } else {
        document.body.append(canvas.image);
        canvas.image.style.position = 'absolute';
        canvas.image.style.top = '0';
        canvas.image.style.backgroundColor = 'blue';
        canvas.image.style.transformOrigin = '0 0';
        canvas.image.style.transform = `scale(${CANVAS_SCALE})`;
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = `${canvas.y * CANVAS_SCALE}px`;
        div.style.left = `${canvas.x * CANVAS_SCALE}px`;
        div.style.height = `${canvas.h * CANVAS_SCALE}px`;
        div.style.width = `${canvas.w * CANVAS_SCALE}px`;
        div.style.border = '1px solid red';
        div.style.boxSizing = 'border-box';
        document.body.append(div);
    }
}
window['debugCanvas'] = debugCanvas;

export const mouseContainer:HTMLElement = query('.js-mouseContainer');
export const mainContent: HTMLElement = query('.js-gameContent');

export function tag(type: string, classes: string = '', content: string | number = '') {
    return '<' + type + ' class="' + classes + '">' + content + '</' + type + '>';
}
export function tagElement(type: string, classes: string = '', content: string | number = ''):HTMLElement {
    const element:HTMLElement = document.createElement(type);
    element.className = classes || '';
    element.innerHTML = '' + (content || '');
    return element;
}

export const divider = tag('div', 'centered medium', tag('div', 'divider'));
export function titleDiv(titleMarkup) {
    return titleMarkup && tag('div', 'title', titleMarkup);
}
export function bodyDiv(bodyMarkup) {
    return bodyMarkup && tag('div', 'body', bodyMarkup)
};

export function findEmptyElement(elements: NodeListOf<HTMLElement>): HTMLElement {
    return [...elements].find(element => element.innerHTML === '');
}

export function getClosestElement(element: HTMLElement, elements: Array<HTMLElement>, threshold: number): HTMLElement {
    let closestElement = null;
    let closestDistanceSquared = threshold * threshold;
    const center = rectangleCenter(element.getBoundingClientRect());
    elements.forEach(element => {
        const elementCenter = rectangleCenter(element.getBoundingClientRect());
        const d2 = (center[0] - elementCenter[0]) ** 2 + (center[1] - elementCenter[1]) ** 2;
        if (d2 <= closestDistanceSquared) {
            closestDistanceSquared = d2;
            closestElement = element;
        }
    });
    return closestElement;
}

export function toggleElements(elements: NodeListOf<HTMLElement>, show: boolean) {
    elements.forEach(element => toggleElement(element, show));
}

export function toggleElement(element: HTMLElement, show: boolean) {
    element.style.display = show ? '' : 'none';
}

export function handleChildEvent(
    eventType: string,
    container: HTMLElement,
    selector: string,
    handler: (HTMLElement, Event) => any,
) {
    container.addEventListener(eventType, event => {
        const element: HTMLElement = event.target as HTMLElement;
        const matchedElement = element.closest(selector);
        if (matchedElement) {
            return handler(matchedElement, event);
        }
    });
}

export function getElementIndex(element: HTMLElement) {
    return [...element.parentElement.children].indexOf(element);
}
