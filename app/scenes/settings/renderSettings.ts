import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { createAnimation, drawFrame } from 'app/utils/animations';
import { renderStandardFieldStack } from 'app/render/renderField';
import { fillRect, pad } from 'app/utils/index';
import { drawText } from 'app/utils/simpleWhiteFont';
import { getSettingsOptions } from 'app/state';

const MARGIN = 20;

const menuSlices = createAnimation('gfx/hud/menu9slice.png', {w: 8, h: 8}, {cols: 3, rows: 3}).frames;

export const outerMenuFrame = {
    x: MARGIN * 1.5,
    y: MARGIN * 1.5,
    w: CANVAS_WIDTH - 3 * MARGIN,
    h: CANVAS_HEIGHT - 2.5 * MARGIN,
};

export const innerMenuFrame = pad(outerMenuFrame, -10);

export function renderMenuFrame(context: CanvasRenderingContext2D, state: GameState, r: Rect): void {
    drawFrame(context, menuSlices[0], {x: r.x, y: r.y, w: 8, h: 8});
    drawFrame(context, menuSlices[1], {x: r.x + 8, y: r.y, w: r.w - 16, h: 8});
    drawFrame(context, menuSlices[2], {x: r.x + r.w - 8, y: r.y, w: 8, h: 8});

    drawFrame(context, menuSlices[3], {x: r.x, y: r.y + 8, w: 8, h: r.h - 16});
    drawFrame(context, menuSlices[4], {x: r.x + 8, y: r.y + 8, w: r.w - 16, h: r.h - 16});
    drawFrame(context, menuSlices[5], {x: r.x + r.w - 8, y: r.y + 8, w: 8, h: r.h - 16});

    drawFrame(context, menuSlices[6], {x: r.x, y: r.y + r.h - 8, w: 8, h: 8});
    drawFrame(context, menuSlices[7], {x: r.x + 8, y: r.y + r.h - 8, w: r.w - 16, h: 8});
    drawFrame(context, menuSlices[8], {x: r.x + r.w - 8, y: r.y + r.h - 8, w: 8, h: 8});
}

export function renderSettingsPurple(context: CanvasRenderingContext2D, state: GameState): void {
    renderMenuFrame(context, state, outerMenuFrame);
}

const WIDTH = CANVAS_WIDTH - 3 * MARGIN;
const ROW_HEIGHT = 20;

const textOptions = <const>{
    textBaseline: 'middle',
    textAlign: 'left',
    size: 16,
};

export function renderSettings(context: CanvasRenderingContext2D, state: GameState): void {
    renderStandardFieldStack(context, state);

    context.save();
    context.globalAlpha = 0.2;
    fillRect(context, {x:0, y:0, w:CANVAS_WIDTH, h:CANVAS_HEIGHT}, 'black');
    context.restore();

    // draw options in a black box with a white border
    // located in bottom right corner of screen
    const options = getSettingsOptions(state);
    const h = ROW_HEIGHT * options.length + 8;
    let r = {
        x: MARGIN * 1.5,
        y: MARGIN * 1.5,
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
