import { showHint } from 'app/content/hints';
import { getLootHelpMessage } from 'app/content/loot';
import {
    getMenuRows,
    setEquippedBoots,
    setEquippedElement,
    setLeftTool,
    setRightTool,
} from 'app/content/menu';
import { dungeonMaps } from 'app/content/sections';
import { editingState } from 'app/development/editingState';
import { GAME_KEY } from 'app/gameConstants';
import {
    wasGameKeyPressed,
    wasMenuConfirmKeyPressed,
} from 'app/userInput';
import { showMessage } from 'app/scriptEvents';
import { isSectionExplored } from 'app/utils/sections';
import { updateSoundSettings } from 'app/utils/soundSettings';

export function updateInventory(state: GameState) {
    if (state.showMap) {
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
        return;
    }
    const menuRows = getMenuRows(state);
    // Cycle to the next row that isn't empty.
    // There is always at least one row since the help tool is always there.
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        do {
            state.menuRow = (state.menuRow + menuRows.length - 1) % menuRows.length;
        } while (!menuRows[state.menuRow].length)
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        do {
            state.menuRow = (state.menuRow + 1) % menuRows.length;
        } while (!menuRows[state.menuRow].length)
    }
    // Make sure menuRow always pointed to a populated row in bounds.
    // This value might be in a bad place when toggling the editor off while viewing the inventory,
    // for example when selecting an element and turning the editor off when no elements are owned.
    while (menuRows.length && !menuRows[state.menuRow]?.length) {
        state.menuRow = (state.menuRow + 1) % menuRows.length;
    }
    const menuRow = menuRows[state.menuRow];
    state.menuIndex = Math.min(menuRow.length - 1, state.menuIndex);
    if (wasGameKeyPressed(state, GAME_KEY.LEFT)) {
        state.menuIndex = (state.menuIndex + menuRow.length - 1) % menuRow.length;
    } else if (wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
        state.menuIndex = (state.menuIndex + 1) % menuRow.length;
    }

    if (wasMenuConfirmKeyPressed(state)) {
        const menuItem = menuRow[state.menuIndex];
        if (menuItem === 'help') {
            state.paused = false;
            updateSoundSettings(state);
            showHint(state);
            return;
        }
        if (menuItem === 'return') {
            state.paused = false;
            updateSoundSettings(state);
            showMessage(state, '{@nimbusCloud.returnMenu}');
            return;
        }
        if (state.hero.savedData.activeTools[menuItem]) {
            if (wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)) {
                if (state.hero.savedData.leftTool === menuItem) {
                    setLeftTool(state, state.hero.savedData.rightTool);
                }
                setRightTool(state, menuItem as ActiveTool);
            } else {
                // Assign to left tool as default action.
                // If a generic confirm key was pressed, cycle the current left tool
                // over to the right tool slot.
                if (!wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL) && state.hero.savedData.leftTool !== menuItem) {
                    setRightTool(state, state.hero.savedData.leftTool);
                }
                if (state.hero.savedData.rightTool === menuItem) {
                    setRightTool(state, state.hero.savedData.leftTool);
                }
                setLeftTool(state, menuItem as ActiveTool);
            }
            return;
        }
        if (menuItem === 'leatherBoots' || menuItem === 'ironBoots' || menuItem === 'cloudBoots') {
            setEquippedBoots(state, menuItem);
            return;
        }
        if (menuItem === 'neutral' || state.hero.savedData.element === menuItem) {
            setEquippedElement(state, null);
            return;
        } else if (state.hero.savedData.elements[menuItem]) {
            setEquippedElement(state, menuItem as MagicElement);
            return;
        }
        if (menuItem === 'nimbusCloud') {
            state.paused = false;
            updateSoundSettings(state);
            showMessage(state, '{@nimbusCloud.chooseDestination}');
            return;
        }
        if (state.hero.savedData.passiveTools[menuItem as PassiveTool]) {
            state.paused = false;
            updateSoundSettings(state);
            const helpMessage = getLootHelpMessage(state, menuItem, state.hero.savedData.passiveTools[menuItem]);
            showMessage(state, helpMessage);
        }
    }
}
