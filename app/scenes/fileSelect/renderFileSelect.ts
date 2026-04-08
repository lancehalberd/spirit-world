import {CANVAS_WIDTH, CANVAS_HEIGHT} from 'app/gameConstants';
import {getFileSelectOptions} from 'app/scenes/fileSelect/getFileSelectOptions';
import {fillRect, pad} from 'app/utils/index';

import type {FileSelectScene} from 'app/scenes/fileSelect/fileSelectScene';


const WIDTH = 144;
const ROW_HEIGHT = 20;

export function renderFileSelect(context: CanvasRenderingContext2D, state: GameState, scene: FileSelectScene): void {
    const options = getFileSelectOptions(state, scene);
    const h = ROW_HEIGHT * options.length + 8;
    let w = WIDTH;
    if (scene.mode === 'customizeRandomizer') {
        w = 180;
    }
    let r = {
        x: (CANVAS_WIDTH - w) / 2,
        y: CANVAS_HEIGHT - h - 32,
        w,
        h,
    };
    fillRect(context, r, 'white');
    fillRect(context, pad(r, -2), 'black');

    r = pad(r, -4);

    let x = r.x + 20, y = r.y;
    for (let i = 0; i < options.length; i++) {
        options[i].render(context, state, scene, {x, y, w: r.w - 20, h: ROW_HEIGHT});
        if (scene.cursorIndex === i) {
            // Draw an arrow next to the selected option.
            context.fillStyle = 'white';
            context.beginPath();
            context.moveTo(r.x + 8, y);
            context.lineTo(r.x + 16, y + 8);
            context.lineTo(r.x + 8, y + 16);
            context.fill();
        }
        y += 20;
    }
}
