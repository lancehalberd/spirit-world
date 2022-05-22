import { tagElement } from 'app/dom';

let tooltipElement: HTMLElement;

export function showTooltip(this: void, text: string, x: number, y: number): void {
    hideTooltip();
    tooltipElement = tagElement('div');
    tooltipElement.style.position = 'absolute';
    tooltipElement.style.background = 'white';
    tooltipElement.style.border = '1px solid black';
    tooltipElement.style.padding = '4px';
    tooltipElement.style.fontFamily = 'sans-serif';
    tooltipElement.style.left = `${x}px`;
    tooltipElement.style.top = `${y}px`;
    tooltipElement.style.pointerEvents = 'none';
    tooltipElement.innerText = text;
    document.body.append(tooltipElement);
}

export function hideTooltip(): void {
    if (tooltipElement) {
        tooltipElement.remove();
        tooltipElement = null;
    }
}
