import {
    createMenuPanel,
    getBootOptions,
    getElementOptions,
    getMaterialOptions,
} from 'app/content/menu';
import {FieldMenuScene} from 'app/scenes/fieldMenu/fieldMenuScene';
import {pushScene} from 'app/scenes/sceneHash';



class BootsMenuScene extends FieldMenuScene {
    cursor = {panelId: 'boots', optionIndex: 0};
    getPanels(state: GameState) {
        return [
            // Various rows shown under the active tools
            createMenuPanel('boots', getBootOptions(state), 1, 3, {x: this.x, y: this.y, w: 72, h: 24}),
        ];
    }
}

class ElementsMenuScene extends FieldMenuScene {
    cursor = {panelId: 'elements', optionIndex: 0};
    getPanels(state: GameState) {
        return [
            // Various rows shown under the active tools
            createMenuPanel('elements', getElementOptions(state), 2, 2, {x: this.x, y: this.y, w: 48, h: 48}),
        ];
    }
}

class MaterialsMenuScene extends FieldMenuScene {
    cursor = {panelId: 'elements', optionIndex: 0};
    getPanels(state: GameState) {
        return [
            {
                id: 'materials',
                options: getMaterialOptions(state),
                x: this.x, y: this.y, w: 48, h: 60,
                rows: 2,
                columns: 2,
                rowHeight: 30,
                optionsOffset: {
                    x: 0,
                    y: 0,
                },
            },
        ];
    }
}


const bootsMenueScene = new BootsMenuScene();
export function showBootsMenuScene(state: GameState, x = 0, y = 0) {
    bootsMenueScene.x = x;
    bootsMenueScene.y = y;
    pushScene(state, bootsMenueScene);
}

const elementsMenueScene = new ElementsMenuScene();
export function showElementsMenuScene(state: GameState, x = 0, y = 0) {
    elementsMenueScene.x = x;
    elementsMenueScene.y = y;
    pushScene(state, elementsMenueScene);
}

const materialsMenuScene = new MaterialsMenuScene();
export function showMaterialsMenuScene(state: GameState, x = 0, y = 0) {
    materialsMenuScene.x = x;
    materialsMenuScene.y = y;
    pushScene(state, materialsMenuScene);
}
