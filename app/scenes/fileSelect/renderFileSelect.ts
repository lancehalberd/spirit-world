import {CANVAS_WIDTH, CANVAS_HEIGHT} from 'app/gameConstants';
import {getFileSelectOptions} from 'app/scenes/fileSelect/getFileSelectOptions';
import {fillRect, pad} from 'app/utils/index';

import type {FileSelectScene} from 'app/scenes/fileSelect/fileSelectScene';

export function renderFileSelect(context: CanvasRenderingContext2D, state: GameState, scene: FileSelectScene): void {
    const options = getFileSelectOptions(state, scene);
    let rowHeight = 20;
    let rowSpace = 0;
    let w = 144;
    let maxRows = 10;
    if (scene.gameMode === 'randomizer') {
        w = 180;
        rowHeight = 20;
        rowSpace = 4;
        maxRows = 7;
    } else if (scene.mode === 'customizeRandomizer') {
        w = 180;
    }
    const h = (rowHeight + rowSpace) * Math.min(maxRows, options.length) + 8;
    let r = {
        x: (CANVAS_WIDTH - w) / 2,
        y: Math.max(CANVAS_HEIGHT - h - 32, (CANVAS_HEIGHT - h) / 2),
        w,
        h,
    };
    fillRect(context, r, 'white');
    fillRect(context, pad(r, -2), 'black');

    r = pad(r, -4);

    const startingIndex = Math.max(0, Math.min(options.length - maxRows, scene.cursorIndex - Math.floor(maxRows / 2)));

    let x = r.x + 20, y = r.y;
    for (let i = startingIndex; i < options.length && i < startingIndex + maxRows; i++) {
        options[i].render(context, state, scene, {x, y, w: r.w - 20, h: rowHeight});
        if (scene.cursorIndex === i) {
            // Draw an arrow next to the selected option.
            context.fillStyle = 'white';
            context.beginPath();
            context.moveTo(r.x + 8, y);
            context.lineTo(r.x + 16, y + 8);
            context.lineTo(r.x + 8, y + 16);
            context.fill();
        }
        y += (rowHeight + rowSpace);
    }
}
