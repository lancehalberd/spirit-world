import { editingState } from 'app/development/editingState';
import { CANVAS_HEIGHT, CANVAS_SCALE, CANVAS_WIDTH } from 'app/gameConstants';
import { mainCanvas } from 'app/utils/canvas';
import { getMousePosition } from 'app/utils/mouse';

export function getAreaMousePosition(): Coords {
    // This gets the x/y coords in pixels from the top left corner of the screen.
    const [x, y] = getMousePosition(mainCanvas, CANVAS_SCALE);
    // When editing, these translations are applied before rendering to scale the screen from the center:
    // context.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    // context.scale(editingState.areaScale, editingState.areaScale);
    // context.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
    return [
        (x - CANVAS_WIDTH / 2) / editingState.areaScale + CANVAS_WIDTH / 2,
        (y - CANVAS_HEIGHT / 2) / editingState.areaScale + CANVAS_HEIGHT / 2,
    ];
}
