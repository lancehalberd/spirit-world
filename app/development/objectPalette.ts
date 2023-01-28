import { hideTooltip, showTooltip } from 'app/development/tooltip';
import { createCanvasAndContext } from 'app/utils/canvas';
import { getMousePosition } from 'app/utils/mouse';

import { Rect } from 'app/types';

export interface ObjectPaletteItem<T extends string> {
    key: T
    render(context: CanvasRenderingContext2D, target: Rect): void
}
export class ObjectPalette<T extends string> {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    w = 320;
    h = 320;
    constructor(public selectedKey: T, public items: ObjectPaletteItem<T>[], public onSelect?: (key: T) => void) {
        [this.canvas, this.context] = createCanvasAndContext(this.w, this.h);
        this.canvas.onclick = () => {
            const [x, y] = getMousePosition(this.canvas);
            const index = Math.floor(x / 40) + 8 * Math.floor(y / 40);
            const item = this.items[index];
            if (item) {
                this.selectItem(item.key);
            }
        }
        this.canvas.onmousemove = () => {
            const [x, y] = getMousePosition(this.canvas);
            const index = Math.floor(x / 40) + 8 * Math.floor(y / 40);
            const item = this.items[index];
            if (item) {
                const [sx, sy] = getMousePosition();
                showTooltip(item.key, sx, sy + 10);
            } else {
                hideTooltip();
            }
        };
        this.canvas.onmouseout = () => {
            hideTooltip();
        };
        this.render();
    }
    selectItem(selectedKey: T) {
        this.selectedKey = selectedKey;
        this.onSelect?.(selectedKey);
        this.render();
    }
    render(): void {
        this.context.clearRect(0, 0, this.w, this.h);
        let x = 0, y = 0;
        for (const item of this.items) {
            item.render(this.context, {x: x + 4, y: y + 4, w: 32, h: 32});
            if (item.key === this.selectedKey) {
                this.context.beginPath();
                this.context.strokeStyle = 'black';
                this.context.strokeRect(x, y, 40, 40);
            }
            x += 40;
            if (x + 40 > this.w) {
                x = 0;
                y += 40;
            }
        }
    }
}
