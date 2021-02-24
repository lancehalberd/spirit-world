import {  CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { renderField } from 'app/render';
import { renderHUD } from 'app/renderHUD';
import { drawText } from 'app/utils/simpleWhiteFont';
import { fillRect, pad } from 'app/utils/index';

import { GameState } from 'app/types';

const messageColumns = 25;
const messageRows = 5;

export function renderMessage(context: CanvasRenderingContext2D, state: GameState): void {
    renderField(context, state);
    renderHUD(context, state);
    const h = messageRows * (8 + 2) + 2;
    const w = messageColumns * 6 + 4;
    let r = {
        x: (CANVAS_WIDTH - w) / 2,
        y: CANVAS_HEIGHT - h - 32,
        w,
        h,
    };
    fillRect(context, pad(r, 2), 'white');
    fillRect(context, r, 'black');

    r = pad(r, -2);

    const textOptions = {
        textBaseline: 'bottom',
        textAlign: 'left',
        size: 8,
    };
    let x = r.x, y = r.y + 8;
    const { pageIndex, pages } = state.messageState;
    const message = pages[pageIndex];
    for (let i = 0; i < message.length; i += messageColumns) {
        let text = message.slice(i, i + messageColumns);
        drawText(context, text, x, y, textOptions);
        y += 10;
    }

}
