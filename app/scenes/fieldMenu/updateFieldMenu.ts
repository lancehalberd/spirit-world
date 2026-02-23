import { updateMenuState} from 'app/content/menu';
import {dungeonMaps} from 'app/content/sections';
import {editingState} from 'app/development/editingState';
import {GAME_KEY} from 'app/gameConstants';
import {
    wasGameKeyPressed,
    wasMenuConfirmKeyPressed,
} from 'app/userInput';
import {isSectionExplored} from 'app/utils/sections';
import {updateSoundSettings} from 'app/utils/soundSettings';


function updateMap(state: GameState) {
    const floorKeys = Object.keys(dungeonMaps[state.areaSection?.definition.mapId]?.floors || {});
    const showFullMap = state.savedState.dungeonInventories[state.location.logicalZoneKey]?.map || editingState.isEditing;
    let safety = 0;
    if (floorKeys.length && wasGameKeyPressed(state, GAME_KEY.UP)) {
        do {
            state.menuIndex = (state.menuIndex + 1) % floorKeys.length;
        } while (++safety < 1000 && !showFullMap
            && !dungeonMaps[state.areaSection?.definition.mapId]?.floors[floorKeys[state.menuIndex]].sections?.find(section => isSectionExplored(state, section)));
        editingState.selectedSections = [];
    } else if (floorKeys.length && wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        do {
            state.menuIndex = (state.menuIndex + floorKeys.length - 1) % floorKeys.length;
        } while (++safety < 1000 && !showFullMap
            && !dungeonMaps[state.areaSection?.definition.mapId]?.floors[floorKeys[state.menuIndex]]?.sections?.find(section => isSectionExplored(state, section)));
        editingState.selectedSections = [];
    }
    if (safety > 500) {
        console.log('infinite loop warning');
        debugger;
    }
    if (wasMenuConfirmKeyPressed(state)) {
        state.paused = false;
        updateSoundSettings(state);
        editingState.selectedSections = [];
    }
}

export function updateFieldMenu(state: GameState) {
    if (state.showMap) {
        updateMap(state);
        return;
    }
    if (state.fieldMenuState.needsRefresh) {
        delete state.fieldMenuState.needsRefresh;
        updateMenuState(state);
    }
    const grid = state.fieldMenuState.grid;
    const cursor = state.fieldMenuState.cursor;
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        cursor.y = (cursor.y + grid.length - 1) % grid.length;
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        cursor.y = (cursor.y + 1) % grid.length;
    }
    const menuRow = grid[cursor.y];
    cursor.x = Math.min(menuRow.length - 1, cursor.x);
    if (wasGameKeyPressed(state, GAME_KEY.LEFT)) {
        cursor.x = (cursor.x + menuRow.length - 1) % menuRow.length;
    } else if (wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
        cursor.x = (cursor.x + 1) % menuRow.length;
    }
    // Cycle to the next row that isn't empty.
    // There is always at least one row since the help tool is always there.
    /*if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        do {
            cursor.y = (cursor.y + grid.length - 1) % grid.length;
        } while (cursor.y > 0 && !grid[cursor.y]?.length)
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        do {
            cursor.y = (cursor.y + 1) % grid.length;
        } while (cursor.y < grid.length - 1 && !grid[cursor.y]?.length)
    }
    // Make sure menuRow always pointed to a populated row in bounds.
    // This value might be in a bad place when toggling the editor off while viewing the inventory,
    // for example when selecting an element and turning the editor off when no elements are owned.
    while (cursor.y !== 0 && grid.length && !grid[cursor.y]?.length) {
        cursor.y = (cursor.y + 1) % grid.length;
    }
    const menuRow = grid[cursor.y];
    cursor.x = Math.min(menuRow.length - 1, cursor.x);
    if (wasGameKeyPressed(state, GAME_KEY.LEFT)) {
        cursor.x = (cursor.x + menuRow.length - 1) % menuRow.length;
    } else if (wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
        cursor.x = (cursor.x + 1) % menuRow.length;
    }*/

    if (wasMenuConfirmKeyPressed(state)) {
        const menuElement = grid[cursor.y][cursor.x];
        if (editingState.isEditing) {
            menuElement?.onUpgrade(state);
        } else if (menuElement?.isVisible?.(state)) {
            let toolIndex: number;
            if (wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL)) {
                toolIndex = 0;
            } else if (wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)) {
                toolIndex = 1;
            }
            menuElement?.onSelect(state, toolIndex);
        }
    }
}
