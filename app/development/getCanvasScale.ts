

const mainGameElement = document.getElementsByClassName('mainGame')[0] as HTMLElement;
export function getCanvasScale(): number {
    return Number(mainGameElement.style.transform.split(/\(|\)/)[1]);
}
