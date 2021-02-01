import {  CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { renderField } from 'app/render';
import { renderHUD } from 'app/renderHUD';
import { getTitleOptions } from 'app/update';
import { drawSpecialFontText } from 'app/utils/drawText';
import { fillRect, pad } from 'app/utils/index';

import { GameState } from 'app/types';

const WIDTH = CANVAS_WIDTH / 2;
const ROW_HEIGHT = 20;




export function renderTitle(context: CanvasRenderingContext2D, state: GameState): void {
    renderField(context, state);
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




    const textOptions = {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 10,
        fillStyle: 'white',
    };
    const smallTextOptions = {
        textBaseline: 'middle',
        textAlign: 'left',
        size: 5,
        fillStyle: 'white',
    };
    context.fillStyle = 'white';
    let x = r.x + 20, y = r.y + ROW_HEIGHT / 2;
    for (let i = 0; i < options.length; i++) {
        let text = options[i].slice(0, 10);
        if (text.length > 10) {
            const spaceIndex = text.indexOf(' ');
            if (spaceIndex > 0) {
                drawSpecialFontText(context, text.slice(0, spaceIndex), x, y, smallTextOptions);
                drawSpecialFontText(context, text.slice(spaceIndex + 1), x, y + 6, smallTextOptions);
            } else {
                drawSpecialFontText(context, text, x, y, smallTextOptions);
            }
        } else {
            drawSpecialFontText(context, text, x, y, textOptions);
        }
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
