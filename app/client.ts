import { addContextMenuListeners } from 'app/development/contextMenu';
import { editingState } from 'app/development/editingState';
import { refreshEditor } from 'app/development/editor';
import { FRAME_LENGTH } from 'app/gameConstants';
import { update } from 'app/update';
import { render } from 'app/render';
import { populateAllSections} from 'app/content/sections';
import { populateAllDialogue} from 'app/content/dialogue/dialogueList';
import { getState } from 'app/state';
import { updateMusic } from 'app/musicController';

export * from 'app/content/objects';
export * from 'app/content/dialogue';
export * from 'app/content/variants';
export * from 'app/content/specialBehaviors';
export * from 'app/development/tests';
export * from 'app/development/tileEditor';
export * from 'app/randomizer/main';

setInterval(update, FRAME_LENGTH);

populateAllSections();
populateAllDialogue();


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
