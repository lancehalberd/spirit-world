import { editingState } from 'app/development/editingState';
import { exportZoneToClipboard } from 'app/development/exportZone';
import { toggleEditing } from 'app/development/editor';
import { updateObjectInstance } from 'app/development/objectEditor';
import { toggleShowControls } from 'app/scenes/controls/updateControls';
import { getState } from 'app/state';
import { isKeyboardKeyDown, KEY } from 'app/userInput'
import { enterLocation } from 'app/utils/enterLocation';

export function addKeyboardShortcuts() {
    document.addEventListener('keydown', function(event: KeyboardEvent) {
        if (event.repeat) {
            return;
        }
        // Don't process keys if an input is targeted, otherwise we prevent typing in
        // the input.
        if ((event.target as HTMLElement).closest('input')
            || (event.target as HTMLElement).closest('textarea')
            || (event.target as HTMLElement).closest('select')
        ) {
            return;
        }
        const commandIsDown = isKeyboardKeyDown(KEY.CONTROL) || isKeyboardKeyDown(KEY.COMMAND);
        const isShiftDown = isKeyboardKeyDown(KEY.SHIFT);
        const keyCode: number = event.which;

        if (commandIsDown && keyCode === KEY.BACK_SLASH) {
            const state = getState();
            state.alwaysHideMenu = !state.alwaysHideMenu;
            event.preventDefault();
            return;
        }
        if ((commandIsDown || isShiftDown) && keyCode === KEY.E) {
            toggleEditing(getState());
            event.preventDefault();
            return;
        }
        if (keyCode === KEY.ESCAPE) {
            toggleShowControls(getState());
            return;
        }
        if (!editingState.isEditing) {
            return;
        }
        //console.log(keyCode);
        // Don't override the refresh page command.
        if (keyCode === KEY.R && commandIsDown) {
            return;
        }
        if (keyCode === KEY.C && commandIsDown) {
            if (getState().areaInstance.definition.objects.includes(editingState.selectedObject)) {
                editingState.clipboardObject = {...editingState.selectedObject};
            } else {
                exportZoneToClipboard(getState().zone);
                editingState.hasChanges = false;
                event.preventDefault();
            }
            return;
        }
        if (keyCode === KEY.V && commandIsDown) {
            if (editingState.clipboardObject) {
                const state = getState();
                updateObjectInstance(state, {...editingState.clipboardObject}, null, state.areaInstance, true);
            }
            event.preventDefault();
            return;
        }
        if (keyCode === KEY.R && isShiftDown) {
            // Reset the entire zone if shift is down.
            const state = getState();
            // Reset all zone flags.
            state.savedState.zoneFlags = {};
            for (const floor of state.zone.floors) {
                for (const grid of [floor.grid, floor.spiritGrid]) {
                    for (const row of grid) {
                        for (const areaDefinition of row) {
                            for (const object of areaDefinition?.objects ?? []) {
                                delete state.savedState.objectFlags[object.id];
                                for (const suffix of ['melted', 'position']) {
                                    delete state.savedState.objectFlags[object.id + '-' + suffix];
                                }
                            }
                        }
                    }
                }
            }
            // Ad Hoc overrides for keys set by script objects.
            if (state.location.zoneKey === 'peachCave') {
                delete state.savedState.objectFlags.peachCaveTree;
            }
            state.savedState.luckyBeetles = [];
            delete state.savedState.dungeonInventories[state.location.logicalZoneKey];
            state.location.x = state.hero.x;
            state.location.y = state.hero.y;
            // Calling this will instantiate the area again and place the player back in their current location.
            enterLocation(state, state.location, {instant: true});
        } else if (keyCode === KEY.R) {
            // Reset the current screen as if you left and returned to it.
            const state = getState();
            state.location.x = state.hero.x;
            state.location.y = state.hero.y;
            // Calling this will instantiate the area again and place the player back in their current location.
            enterLocation(state, state.location, {instant: true});
        }
    });
}

export function defeatAllEnemies() {
    const state = getState();
    const allEnemies = [...state.areaInstance?.enemies, ...state.alternateAreaInstance?.enemies];
    for (const enemy of allEnemies) {
        enemy.showDeathAnimation(state);
    }
    event.preventDefault();
}
