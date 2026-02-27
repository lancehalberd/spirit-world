import {frameSize, getActivePanelAndOption, updateMenuState} from 'app/content/menu';
import {dungeonMaps} from 'app/content/sections';
import {editingState} from 'app/development/editingState';
import {GAME_KEY} from 'app/gameConstants';
import {updateHeroMagicStats} from 'app/render/spiritBar';
import {
    wasGameKeyPressed,
    wasMenuConfirmKeyPressed,
} from 'app/userInput';
import {clamp, isPointInShortRect, pad} from 'app/utils/index';
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

function selectClosestElement(state: GameState, x: number, y: number) {
    for (const panel of state.fieldMenuState.panels) {
        // This padding should be adjusted to account for any gaps that appear between menus.
        if (isPointInShortRect(x, y, pad(panel, 5))) {
            state.fieldMenuState.cursor.panelId = panel.id;
            const column = ((x - panel.x) / frameSize) | 0;
            const row = ((y - panel.y) / frameSize) | 0;
            state.fieldMenuState.cursor.optionIndex = clamp(column + row * panel.columns, 0, panel.options.length - 1);
            return;
        }
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
    const {activePanel, activeOption} = getActivePanelAndOption(state);
    const x = activePanel.x + activeOption.x + frameSize / 2;
    const y = activePanel.y + activeOption.y + frameSize / 2;

    // Moving the cursor is accomplished by just moving to the closest element when
    // moving the cursor by a set amount in any direction.
    const movementDelta = frameSize + 3;
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        selectClosestElement(state, x, y - movementDelta);
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        selectClosestElement(state, x, y + movementDelta);
    }
    if (wasGameKeyPressed(state, GAME_KEY.LEFT)) {
        selectClosestElement(state, x - movementDelta, y);
    } else if (wasGameKeyPressed(state, GAME_KEY.RIGHT)) {
        selectClosestElement(state, x + movementDelta, y);
    }
    if (activeOption && wasMenuConfirmKeyPressed(state)) {
        if (editingState.isEditing) {
            activeOption.onUpgrade?.(state);
            updateHeroMagicStats(state);
        } else if (activeOption.isVisible?.(state)) {
            let toolIndex: number;
            if (wasGameKeyPressed(state, GAME_KEY.LEFT_TOOL)) {
                toolIndex = 0;
            } else if (wasGameKeyPressed(state, GAME_KEY.RIGHT_TOOL)) {
                toolIndex = 1;
            }
            if (activeOption.onSelect?.(state, toolIndex)) {
                state.paused = false;
                updateSoundSettings(state);
            }
        }
    }
}
