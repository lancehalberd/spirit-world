import {backpack, getLootFrame, getLootName} from 'app/content/loot';
import {
    arDeviceMenuOption,
    createMenuPanel,
    elementGeometry,
    emptyMenuElement,
    getDungeonOptions,
    getEyesOptions,
    getEquipmentOptions,
    getSystemOptions,
    getTechniqueOptions,
    getToolOptions,
    nimbusCloudMenuOption,
    peachMenuOption,
} from 'app/content/menu';
import {GAME_KEY} from 'app/gameConstants';
import {FieldMenuScene} from 'app/scenes/fieldMenu/fieldMenuScene';
import {showMapScene} from 'app/scenes/map/showMapScene';
import {showPauseScene} from 'app/scenes/pause/pauseScene';
import {
    showBootsMenuScene,
    showElementsMenuScene,
    showMaterialsMenuScene,
} from 'app/scenes/fieldMenu/subMenuScenes';
import {pushScene} from 'app/scenes/sceneHash';
import {canPauseGame} from 'app/state';
import {drawFrameCenteredAt} from 'app/utils/animations';
import {updateSoundSettings} from 'app/utils/soundSettings';
import {wasGameKeyPressed} from 'app/userInput';


const elementsMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: (state: GameState) => getLootName(state, {lootType: state.hero.savedData.element || 'neutral'}),
    isVisible: (state: GameState) => !!(
        state.hero.savedData.elements.fire ||
        state.hero.savedData.elements.ice ||
        state.hero.savedData.elements.lightning
    ),
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, getLootFrame(state, {lootType: state.hero.savedData.element || 'neutral'}), this);
    },
    onSelect(state: GameState) {
        showElementsMenuScene(state, this.x + 6, this.y + 6);
        return false;
    },
    // Allow opening panel while the editor is open.
    onUpgrade(state: GameState) {
        this.onSelect(state);
    },
};

const bootsMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: (state: GameState) => getLootName(state, {lootType: state.hero.savedData.equippedBoots}),
    isVisible: () => true,
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, getLootFrame(state, {lootType: state.hero.savedData.equippedBoots}), this);
    },
    onSelect(state: GameState) {
        showBootsMenuScene(state, this.x + 6, this.y + 6);
        return false;
    },
    // Allow opening panel while the editor is open.
    onUpgrade(state: GameState) {
        this.onSelect(state);
    },
};
const backpackMenuOption: MenuElement = {
    ...elementGeometry,
    getLabel: () => 'Backpack',
    isVisible: () => true,
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrameCenteredAt(context, backpack, this);
    },
    onSelect(state: GameState) {
        showMaterialsMenuScene(state, this.x + 6, this.y + 6);
        return false;
    },
    // Allow opening panel while the editor is open.
    onUpgrade(state: GameState) {
        this.onSelect(state);
    },
};

class MainMenuScene extends FieldMenuScene {
    cursor = {panelId: 'tools', optionIndex: 0};
    getPanels(state: GameState) {
        const panels: MenuPanel[] =  [
            createMenuPanel('tools', getToolOptions(state), 2, 2, {x: 33, y: 0, w: 48, h: 48}),
            createMenuPanel('menus', [elementsMenuOption, bootsMenuOption, backpackMenuOption], 3, 1, {x: 90, y: 0, w: 24, h: 81}),
            createMenuPanel('special', [nimbusCloudMenuOption, arDeviceMenuOption], 1, 2, {x: 33, y: 57, w: 48, h: 24}),
            // row on bottom left
            {
                id: 'dungeon',
                options: getDungeonOptions(state),
                x: 33, y: 90, w: 81, h: 30,
                rows: 1,
                columns: 3,
                rowHeight: 30,
                optionsOffset: {
                    x: 5,
                    y: 0,
                },
            },
            // right most column.
            createMenuPanel('equipment',
                [
                emptyMenuElement,
                ...getEquipmentOptions(state),
                ...getEyesOptions(state),
                ...getTechniqueOptions(state),
            ], 5, 3, {x: 123, y: 0, w: 72, h: 120}),
        ];
        // The 'return home' option is added to the system options for randomizer only, which increases the height of the panel a bit.
        const systemOptions = getSystemOptions(state);
        const systemPanelHeight = Math.max(87, systemOptions.length * 24);
        const systemPanel = createMenuPanel('system', systemOptions, systemOptions.length, 1, {x: 0, y: 0, w: 24, h: systemPanelHeight});
        panels.push(systemPanel);
        // Peach panel is displayed directly below the system panel.
        const peachPanel = createMenuPanel('peach', [peachMenuOption], 1, 1, {x: 0, y: systemPanel.y + systemPanel.h + 9, w: 24, h: 24});
        panels.push(peachPanel);
        return panels;
        /*return [
            // two left most columns
            createMenuPanel('equipment', getEquipmentOptions(state), 4, 2, {x: 0, y: 0, w: 48, h: 96}),
            createMenuPanel('elements', [elementsMenuOption], 1, 1, {x: 57, y: 6, w: 24, h: 24}),
            createMenuPanel('boots', [bootsMenuOption], 1, 1, {x: 57, y: 39, w: 24, h: 24}),
            createMenuPanel('backpack', [backpackMenuOption], 1, 1, {x: 57, y: 72, w: 24, h: 24}),

            // row on bottom left
            {
                id: 'dungeon',
                options: getDungeonOptions(state),
                x: 9, y: 105, w: 72, h: 30,
                rows: 1,
                columns: 3,
                rowHeight: 30,
                optionsOffset: {
                    x: 0,
                    y: 0,
                },
            },

            // top row in the middle.
            createMenuPanel('tools', getToolOptions(state), 2, 2, {x: 90, y: 6, w: 48, h: 51}),

            // Column under left side of tools
            createMenuPanel('nimbusCloud', [nimbusCloudMenuOption], 1, 1, {x: 147, y: 0, w: 24, h: 24}),
            createMenuPanel('arDevice', [arDeviceMenuOption], 1, 1, {x: 147, y: 33, w: 24, h: 24}),

            // Various rows shown under the active tools
            createMenuPanel('eyes', getEyesOptions(state), 1, 3, {x: 90, y: 66, w: 81, h: 24}),
            createMenuPanel('techniques', getTechniqueOptions(state), 1, 3, {x: 90, y: 99, w: 81, h: 24}),

            // system options on the far right
            createMenuPanel('menu', getSystemOptions(state), 4, 1, {x: 180, y: 0, w: 24, h: 96}),

            createMenuPanel('peach', [peachMenuOption], 1, 1, {x: 180, y: 106, w: 24, h: 24})
        ];*/
    }
    update(state: GameState, interactive: boolean) {
        // We allow switching directly from the main menu to the map for convenience.
        if (interactive && wasGameKeyPressed(state, GAME_KEY.MAP)) {
            this.closeScene(state);
            showMapScene(state);
            return;
        }
        super.update(state, interactive);
    }
}

const mainMenuScene = new MainMenuScene();
export function showMainMenuScene(state: GameState) {
    if (canPauseGame(state)) {
        pushScene(state, mainMenuScene);
        updateSoundSettings(state);
    } else {
        showPauseScene(state);
    }
}
