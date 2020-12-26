import { FRAME_LENGTH } from 'app/gameConstants';
import { update } from 'app/update';
import { render } from 'app/render';

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
