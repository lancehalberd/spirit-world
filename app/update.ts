import { Enemy } from 'app/content/enemy';
import { editingState } from 'app/development/tileEditor';
import { FRAME_LENGTH } from 'app/gameConstants';
import { initializeGame } from 'app/initialize';
import { getState } from 'app/state';
import { updateHero } from 'app/updateActor';
import { updateCamera } from 'app/updateCamera';
import { areAllImagesLoaded } from 'app/utils/images';

let isGameInitialized = false;
export function update() {
    // Don't run the main loop until everything necessary is initialized.
    if (!isGameInitialized) {
        if (areAllImagesLoaded())  {
            initializeGame();
            isGameInitialized = true;
        }
        return;
    }
    const state = getState();
    state.time += FRAME_LENGTH;
    try {
        updateHero(state);
        updateCamera(state);
        if (!editingState.isEditing) {
            state.areaInstance.objects = state.areaInstance.objects.filter(e => !(e instanceof Enemy) || e.life > 0);
            for (const object of state.areaInstance.objects) {
                object?.update(state);
            }
        }
    } catch (e) {
        console.log(e.stack);
        debugger;
    }
}
