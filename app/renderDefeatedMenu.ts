import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { fillRect, pad } from 'app/utils/index';
import { drawText } from 'app/utils/simpleWhiteFont';

const WIDTH = CANVAS_WIDTH * 3 / 4;
const HEIGHT = 3 * CANVAS_HEIGHT / 8;

const textOptions = <const>{
    textBaseline: 'middle',
    textAlign: 'left',
    size: 16,
};

export function renderDefeatedMenu(context: CanvasRenderingContext2D, state: GameState): void {

    let r = {
        x: (CANVAS_WIDTH - WIDTH) / 2,
        y: CANVAS_HEIGHT - HEIGHT - 16,
        w: WIDTH,
        h: HEIGHT,
    };

    if (!state.defeatState.reviving) {
        fillRect(context, r, 'white');
        fillRect(context, pad(r, -2), 'black');
    }

    r = pad(r, -4);

    let x = r.x + 20, y = r.y + r.h / 4 - 2;
    if (state.defeatState.reviving) {
        context.save();
            const missingLife = state.hero.maxLife - state.hero.life;
            if (missingLife < 3) {
                context.globalAlpha *= missingLife / 3;
            }
            drawText(context, 'HANG IN THERE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 32, {
                textBaseline: 'middle',
                textAlign: 'center',
                size: 16,
            });
        context.restore();
        return;
    } else {
        drawText(context, 'TRY AGAIN?', x, y + 2, textOptions);
    }

    x += 16;
    y = r.y + r.h * 2 / 4 + 2;
    let selectedY = y;
    drawText(context, 'CONTINUE', x, y + 2, textOptions);

    y = r.y + r.h * 3 / 4 + 2;
    if (state.menuIndex === 1) {
        selectedY = y;
    }
    drawText(context, 'QUIT', x, y + 2, textOptions);

    // Draw an arrow next to the selected option.
    context.fillStyle = 'white';
    context.beginPath();
    context.moveTo(x - 12, selectedY - 8);
    context.lineTo(x - 4, selectedY);
    context.lineTo(x - 12, selectedY + 8);
    context.fill();
}
