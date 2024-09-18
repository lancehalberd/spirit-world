// These imports set global data that must be available before any randomizer logic can run successfully.
export * from 'app/content/objects';
export * from 'app/content/dialogue';
// In particular variantHash must be fully populated before any logic calls variantLogic.
export * from 'app/content/variants';
export * from 'app/content/specialBehaviors';
export * from 'app/development/tests';
export * from 'app/development/tileEditor';
export * from 'app/randomizer/main';

import { addContextMenuListeners } from 'app/development/contextMenu';
import { editingState } from 'app/development/editingState';
import { refreshEditor } from 'app/development/editor';

export * from 'app/generator/treeGraphs';

import { FRAME_LENGTH } from 'app/gameConstants';
import { update } from 'app/update';
import { render } from 'app/render';
import { populateAllSections} from 'app/content/sections';
import { populateAllDialogue} from 'app/content/dialogue/dialogueList';
import { getState } from 'app/state';
import { updateMusic } from 'app/musicController';

export * from 'app/development/packFont';

// setInterval(update, FRAME_LENGTH);

let isBrowserTimeThrottled = false, throttleCount = 0;

let focused = true;

window.onfocus = function() {
    focused = true;
};
window.onblur = function() {
    focused = false;
};

let nextUpdateTime = Date.now();
function updateLoop() {
    const now = Date.now();
    if (!isBrowserTimeThrottled) {
        // Track how many excessively late frames occur in a row and turn on the
        // isBrowserTimeThrottled once we hit 20 frames consectuive frames.
        if (now - nextUpdateTime > FRAME_LENGTH + 5 && focused) {
            throttleCount++;
            if (throttleCount > 20) {
                console.warn('20 consecutive frames were throttled, switching to throttled mode.');
                isBrowserTimeThrottled = true;
            }
        } else {
            throttleCount = 0;
        }
        setTimeout(updateLoop, FRAME_LENGTH);
        update();
        nextUpdateTime = now;
        return;
    }
    // In throttled mode we call this loop with higher granularity but only run the actual game
    // update based on how much real time is passed.
    setTimeout(updateLoop, 5);
    if (now >= nextUpdateTime) {
        nextUpdateTime += FRAME_LENGTH;
        update();
    }
    // If the update gets too far behind the actual time, catch up one frame.
    /*if (now >= nextUpdateTime) {
        nextUpdateTime += FRAME_LENGTH;
        update();
    }*/
    // If we are still behind the actual time, just sync the time without catching up.
    // This probably means the game is lagging for some reason so we just have to accept that
    // it will appear slow in this case.
    if (now >= nextUpdateTime) {
        nextUpdateTime = now;
    }
}
updateLoop();

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
