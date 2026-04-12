import {CANVAS_WIDTH, CANVAS_HEIGHT, GAME_KEY} from 'app/gameConstants';
import {dungeonMaps} from 'app/content/sections';
import {editingState} from 'app/development/editingState';
import {showMainMenuScene} from 'app/scenes/fieldMenu/mainMenuScene';
import {renderMap} from 'app/scenes/map/renderMap';
import {sceneHash} from 'app/scenes/sceneHash';
import {createCanvasBuffer} from 'app/utils/canvas';
import {isSectionExplored} from 'app/utils/sections';
import {updateSoundSettings} from 'app/utils/soundSettings';
import {wasGameKeyPressed} from 'app/userInput';


export class MapScene implements GameScene {
    floorIndex = 0;
    sceneType = 'map';
    blocksInput = true;
    blocksUpdates = true;
    needsRefresh?: boolean
    panels: MenuPanel[] = [];
    panelsBuffer: CanvasBuffer = createCanvasBuffer(CANVAS_WIDTH, CANVAS_HEIGHT);
    buffer: CanvasBuffer = createCanvasBuffer(CANVAS_WIDTH, CANVAS_HEIGHT);
    cursor: {
        // Which panel the cursor is in
        panelId: string
        // Which option the cursor has selected.
        optionIndex: number
    }
    closeScene(state: GameState) {
        while (state.sceneStack.includes(this)) {
            state.sceneStack.pop();
        }
        updateSoundSettings(state);
            editingState.selectedSections = [];
    }
    update(state: GameState, interactive: boolean) {
        // Currently the map doesn't update unless the player interacts with it.
        if (!interactive) {
            return;
        }
        if (wasGameKeyPressed(state, GAME_KEY.CANCEL)) {
            this.closeScene(state);
            return;
        }
        if (wasGameKeyPressed(state, GAME_KEY.MENU)) {
            this.closeScene(state);
            showMainMenuScene(state);
            return;
        }
        if (wasGameKeyPressed(state, GAME_KEY.MAP)) {
            this.closeScene(state);
            return;
        }
        const floorKeys = Object.keys(dungeonMaps[state.areaSection?.definition.mapId]?.floors || {});
        const showFullMap = state.savedState.dungeonInventories[state.location.logicalZoneKey]?.map || editingState.isEditing;
        let safety = 0;
        if (floorKeys.length && wasGameKeyPressed(state, GAME_KEY.UP)) {
            do {
                this.floorIndex = (this.floorIndex + 1) % floorKeys.length;
            } while (++safety < 1000 && !showFullMap
                && !dungeonMaps[state.areaSection?.definition.mapId]?.floors[floorKeys[this.floorIndex]].sections?.find(section => isSectionExplored(state, section)));
            editingState.selectedSections = [];
        } else if (floorKeys.length && wasGameKeyPressed(state, GAME_KEY.DOWN)) {
            do {
                this.floorIndex = (this.floorIndex + floorKeys.length - 1) % floorKeys.length;
            } while (++safety < 1000 && !showFullMap
                && !dungeonMaps[state.areaSection?.definition.mapId]?.floors[floorKeys[this.floorIndex]]?.sections?.find(section => isSectionExplored(state, section)));
            editingState.selectedSections = [];
        }
        if (safety > 500) {
            console.log('infinite loop warning');
            debugger;
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        renderMap(context, state, this);
    }
}

sceneHash.map = new MapScene();
