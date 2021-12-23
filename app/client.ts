import { addContextMenuListeners } from 'app/development/contextMenu';
import { FRAME_LENGTH } from 'app/gameConstants';
import { update } from 'app/update';
import { render } from 'app/render';
export * from 'app/development/tests';
export * from 'app/randomizer/utils';

setInterval(update, FRAME_LENGTH);


function renderLoop() {
    try {
        window.requestAnimationFrame(renderLoop);
        render();
    } catch (e) {
        console.log(e);
        debugger;
    }
}
renderLoop();

addContextMenuListeners();
