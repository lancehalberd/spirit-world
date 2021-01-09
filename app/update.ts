import { Enemy } from 'app/content/enemy';
import { editingState } from 'app/development/tileEditor';
import { FRAME_LENGTH, KEY_THRESHOLD } from 'app/gameConstants';
import { updateKeysStillDown } from 'app/keyCommands';
import { initializeGame } from 'app/initialize';
import { GAME_KEY, isKeyDown } from 'app/keyCommands';
import { getState } from 'app/state';
import { updateHero } from 'app/updateActor';
import { updateCamera } from 'app/updateCamera';
import { areAllImagesLoaded } from 'app/utils/images';

import { GameState, ActiveTool } from 'app/types';

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
        if (isKeyDown(GAME_KEY.MENU, KEY_THRESHOLD)) {
            state.paused = !state.paused;
        }
        if (!state.paused) {
            updateField(state);
        } else {
            const selectableTools: ActiveTool[] = [];
            if (state.hero.activeTools.bow) {
                selectableTools.push('bow');
            }
            if (state.hero.activeTools.staff) {
                selectableTools.push('staff');
            }
            if (state.hero.activeTools.invisibility) {
                selectableTools.push('invisibility');
            }
            if (state.hero.activeTools.clone) {
                selectableTools.push('clone');
            }
            if(selectableTools.length) {
                const selectedTool = selectableTools[state.menuIndex];
                if (isKeyDown(GAME_KEY.LEFT, KEY_THRESHOLD)) {
                    state.menuIndex = (state.menuIndex + selectableTools.length - 1) % selectableTools.length;
                } else if (isKeyDown(GAME_KEY.RIGHT, KEY_THRESHOLD)) {
                    state.menuIndex = (state.menuIndex + 1) % selectableTools.length;
                } else if (isKeyDown(GAME_KEY.LEFT_TOOL, KEY_THRESHOLD)) {
                    if (state.hero.rightTool === selectedTool) {
                        state.hero.rightTool = state.hero.leftTool;
                    }
                    state.hero.leftTool = selectedTool;
                } else if (isKeyDown(GAME_KEY.RIGHT_TOOL, KEY_THRESHOLD)) {
                    if (state.hero.leftTool === selectedTool) {
                        state.hero.leftTool = state.hero.rightTool;
                    }
                    state.hero.rightTool = selectedTool;
                }
            }
        }
        // Do this after all key checks, since doing it before we cause the key
        // to appear not pressed if there is a release threshold assigned.
        updateKeysStillDown();
    } catch (e) {
        console.log(e.stack);
        debugger;
    }
}

function updateField(state: GameState) {
    updateHero(state);
    updateCamera(state);
    if (!editingState.isEditing) {
        const originalLength = state.areaInstance.objects.length;
        state.areaInstance.objects = state.areaInstance.objects.filter(e => !(e instanceof Enemy) || e.life > 0);
        if (originalLength > state.areaInstance.objects.length) {
            if (!state.areaInstance.objects.some(e => (e instanceof Enemy) && e.isInCurrentSection(state))) {
                for (const object of state.areaInstance.objects) {
                    if (object.status === 'hiddenEnemy') {
                        object.status = 'normal';
                    }
                    if (object.status === 'closedEnemy') {
                        if (object.changeStatus) {
                            object.changeStatus(state, 'normal');
                        } else {
                            object.status = 'normal';
                        }
                    }
                }
            }
        }
        for (const object of state.areaInstance.objects) {
            object?.update(state);
        }
    }
}
