import {zones} from 'app/content/zones/zoneHash';
import {editingState} from 'app/development/editingState';
import {exportZoneToClipboard} from 'app/development/exportZone';
import {toggleEditing} from 'app/development/editor';
import {isObject, isSelectionValid, isVariant, updateObjectInstance} from 'app/development/objectEditor';
import {addVariantToArea} from 'app/development/variantEditor';
import {clearScriptEvents} from 'app/scriptEvents';
import {toggleShowControls} from 'app/scenes/controls/updateControls';
import {getState} from 'app/state';
import {isKeyboardKeyDown, KEY} from 'app/userInput'
import {enterLocation} from 'app/utils/enterLocation';
import {findAllZoneFlags} from 'app/utils/findAllZoneFlags';
import {cloneDeep} from 'app/utils/index';
import {isDefinitionFromSection} from 'app/utils/sections';


function refreshArea(state: GameState, doNotRefreshEditor = false) {
    enterLocation(state, state.location, {instant: true, doNotRefreshEditor});
}

export function addKeyboardShortcuts() {
    document.addEventListener('keydown', function(event: KeyboardEvent) {
        const state = getState();
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
        const isCommandDown = isKeyboardKeyDown(KEY.CONTROL) || isKeyboardKeyDown(KEY.COMMAND);
        const isShiftDown = isKeyboardKeyDown(KEY.SHIFT);
        const keyCode: number = event.which;

        if (isCommandDown && keyCode === KEY.BACK_SLASH) {
            state.alwaysHideMenu = !state.alwaysHideMenu;
            event.preventDefault();
            return;
        }
        if ((isCommandDown || isShiftDown) && keyCode === KEY.E) {
            toggleEditing(state);
            event.preventDefault();
            return;
        }
        if (keyCode === KEY.ESCAPE) {
            toggleShowControls(state);
            return;
        }
        if (!editingState.isEditing) {
            return;
        }
        //console.log(keyCode);
        // Don't override the refresh page command.
        if (keyCode === KEY.R && isCommandDown) {
            return;
        }
        if (keyCode === KEY.C && isCommandDown) {
            editingState.clipboardObjects = [];
            if (isSelectionValid(state, editingState)) {
                for (const object of editingState.selectedObjects) {
                    // The source section will be relative to the section the user is looking at when they initiate the copy action.
                    object._sourceSection = state.areaSection;
                    // Using the section the objects are actually from turns out to be unintutive.
                    // object._sourceSection = getAreaSectionForDefinition(state, object);
                }
                if (isShiftDown) {
                    editingState.clipboardObjects = editingState.selectedObjects.map(cloneDeep);
                } else {
                    editingState.clipboardObjects 
                        = editingState.selectedObjects.filter(object => isDefinitionFromSection(object, state.areaSection))
                                                      .map(cloneDeep);
                }
            } else {
                exportZoneToClipboard(state.zone);
                editingState.hasChanges = false;
            }
            event.preventDefault();
            return;
        }
        if (keyCode === KEY.V && isCommandDown) {
            if (editingState.clipboardObjects) {
                let areaNeedsRefresh = false;
                for (let pastedObject of editingState.clipboardObjects) {
                    if (isShiftDown) {
                        // If shift is held down, everything is copied relative to the super tile and we ignore any section restrictions
                        if (isObject(pastedObject)) {
                            updateObjectInstance(state, cloneDeep(pastedObject), null, state.areaInstance, true);
                        } else if (isVariant(pastedObject)) {
                            addVariantToArea(state, editingState, cloneDeep(pastedObject));
                            areaNeedsRefresh = true;
                        }
                    } else {
                        // Without shift down, we copy everything relative to the source/destination sections, and exclude anything
                        // that will not be inside the current section, which helps cut down on pasting objects to inaccessible locations
                        // off the edges of super tiles.
                        pastedObject = {
                            ...pastedObject,
                            x: pastedObject.x - 16 * pastedObject._sourceSection.x + 16 * state.areaSection.x,
                            y: pastedObject.y - 16 * pastedObject._sourceSection.y + 16 * state.areaSection.y,
                        };
                        // Skip this object if it would be pasted outside of the current section.
                        if (!isDefinitionFromSection(pastedObject, state.areaSection)) {
                            console.log('not in section:', pastedObject, state.areaSection);
                            continue;
                        }
                        if (isObject(pastedObject)) {
                            updateObjectInstance(state, cloneDeep(pastedObject), null, state.areaInstance, true);
                        } else if (isVariant(pastedObject)) {
                            addVariantToArea(state, editingState, cloneDeep(pastedObject));
                            areaNeedsRefresh = true;
                        }
                    }
                }
                if (areaNeedsRefresh) {
                    refreshArea(state);
                }
            }
            event.preventDefault();
            return;
        }
        if (keyCode === KEY.R && isShiftDown) {
            // Reset the entire zone if shift is down.
            // Reset all zone flags.
            state.savedState.zoneFlags = {};
            const flagsFromThisZone = findAllZoneFlags(zones[state.location.zoneKey]);
            for (const key of flagsFromThisZone) {
                delete state.savedState.objectFlags[key];
            }
            state.savedState.luckyBeetles = [];
            delete state.savedState.dungeonInventories[state.location.logicalZoneKey];
            state.location.x = state.hero.x;
            state.location.y = state.hero.y;
            // Calling this will instantiate the area again and place the player back in their current location.
            enterLocation(state, state.location, {instant: true});
            clearScriptEvents(state);
            event.preventDefault();
        } else if (keyCode === KEY.R) {
            // Reset the current screen as if you left and returned to it.
            state.location.x = state.hero.x;
            state.location.y = state.hero.y;
            // Calling this will instantiate the area again and place the player back in their current location.
            enterLocation(state, state.location, {instant: true});
            event.preventDefault();
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
