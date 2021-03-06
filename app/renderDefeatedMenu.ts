import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { fillRect, pad } from 'app/utils/index';

import { GameState } from 'app/types';

const WIDTH = CANVAS_WIDTH * 3 / 4;
const HEIGHT = CANVAS_HEIGHT / 4;

export function renderDefeatedMenu(context: CanvasRenderingContext2D, state: GameState): void {

    let r = {
        x: (CANVAS_WIDTH - WIDTH) / 2,
        y: CANVAS_HEIGHT - HEIGHT - 32,
        w: WIDTH,
        h: HEIGHT,
    };

    fillRect(context, r, 'white');
    fillRect(context, pad(r, -2), 'black');

    r = pad(r, -4);


    let x = r.x + 20, y = r.y + r.h / 4;
    let selectedY = y;
    context.textBaseline = 'middle';
    context.textAlign = 'left';
    context.font = '16px Arial';
    context.fillStyle = 'white';
    context.fillText('CONTINUE', x, y + 2);

    y = r.y + r.h * 3 / 4
    if (state.menuIndex === 1) {
        selectedY = y;
    }
    context.fillText('QUIT', x, y + 2);

    // Draw an arrow next to the selected option.
    context.beginPath();
    context.moveTo(r.x + 8, selectedY - 8);
    context.lineTo(r.x + 16, selectedY);
    context.lineTo(r.x + 8, selectedY + 8);
    context.fill();
}
