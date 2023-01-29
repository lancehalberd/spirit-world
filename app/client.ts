import { addContextMenuListeners } from 'app/development/contextMenu';
import { editingState } from 'app/development/editingState';
import { refreshEditor } from 'app/development/editor';
import { FRAME_LENGTH } from 'app/gameConstants';
import { update } from 'app/update';
import { render } from 'app/render';
import { getState } from 'app/state';
import { updateMusic } from 'app/musicController';

export * from 'app/content/specialBehaviors';
export * from 'app/development/tests';
export * from 'app/randomizer/main';

setInterval(update, FRAME_LENGTH);


function renderLoop() {
    try {
        const state = getState();
        if (editingState.isEditing && editingState.needsRefresh) {
            refreshEditor(state);
        }
        window.requestAnimationFrame(renderLoop);
        render();
        updateMusic(state);
    } catch (e) {
        console.log(e);
        debugger;
    }
}
renderLoop();

addContextMenuListeners();
