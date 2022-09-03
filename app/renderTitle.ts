import {  CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { renderStandardFieldStack } from 'app/render';
import { renderHUD } from 'app/renderHUD';
import { getTitleOptions } from 'app/state';
import { drawText } from 'app/utils/simpleWhiteFont';
import { fillRect, pad } from 'app/utils/index';

import { GameState } from 'app/types';

const WIDTH = 144;
const ROW_HEIGHT = 20;

const textOptions = <const>{
    textBaseline: 'middle',
    textAlign: 'left',
    size: 16,
};

export function renderTitle(context: CanvasRenderingContext2D, state: GameState): void {
    renderStandardFieldStack(context, state);
    renderHUD(context, state);
    const options = getTitleOptions(state);
    const h = ROW_HEIGHT * options.length + 8;
    let r = {
        x: (CANVAS_WIDTH - WIDTH) / 2,
        y: CANVAS_HEIGHT - h - 32,
        w: WIDTH,
        h,
    };
    fillRect(context, r, 'white');
    fillRect(context, pad(r, -2), 'black');

    r = pad(r, -4);

    context.fillStyle = 'white';
    let x = r.x + 20, y = r.y + ROW_HEIGHT / 2;
    for (let i = 0; i < options.length; i++) {
        let text = options[i].slice(0, 13).toUpperCase();
        drawText(context, text, x, y, textOptions);
        if (state.menuIndex === i) {
            // Draw an arrow next to the selected option.
            context.beginPath();
            context.moveTo(r.x + 8, y - 8);
            context.lineTo(r.x + 16, y);
            context.lineTo(r.x + 8, y + 8);
            context.fill();
        }
        y += 20;
    }
}
