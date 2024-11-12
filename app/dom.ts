import { rectangleCenter } from 'app/utils/index';

export function query(className: string): HTMLElement {
    return document.querySelector(className);
}

export function queryAll(className: string): NodeListOf<HTMLElement> {
    return document.querySelectorAll(className);
}

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
export function titleDiv(titleMarkup: string) {
    return titleMarkup && tag('div', 'title', titleMarkup);
}
export function bodyDiv(bodyMarkup: string) {
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
    handler: (element: Element, event: Event) => any,
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
