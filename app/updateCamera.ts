import {
    addObjectToArea, checkIfAllEnemiesAreDefeated, createAreaInstance, getAreaFromLocation, getAreaSize, linkObjects,
    setAreaSection, switchToNextAreaSection,
} from 'app/content/areas';
import { displayTileEditorPropertyPanel, editingState } from 'app/development/tileEditor';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';

import { GameState } from 'app/types';

const cameraSpeed = 10;
export function updateCamera(state: GameState, speed = cameraSpeed): void {
    const { w, h, section } = getAreaSize(state);
    // Quickly move the character to the desired initial position for displaying the next area.
    if (state.nextAreaInstance) {
        let finished = true;
        if (state.nextAreaInstance.cameraOffset.x < 0 && state.camera.x > -CANVAS_WIDTH) {
            state.camera.x = Math.max(state.camera.x - speed, -CANVAS_WIDTH);
            finished = false;
        }
        if (state.nextAreaInstance.cameraOffset.x > 0 && state.camera.x < w) {
            state.camera.x = Math.min(state.camera.x + speed, w);
            finished = false;
        }
        if (state.nextAreaInstance.cameraOffset.y < 0 && state.camera.y > -CANVAS_HEIGHT) {
            state.camera.y = Math.max(state.camera.y - speed, -CANVAS_HEIGHT);
            finished = false;
        }
        if (state.nextAreaInstance.cameraOffset.y > 0 && state.camera.y < h) {
            state.camera.y = Math.min(state.camera.y + speed, h);
            finished = false;
        }
        if (finished) {
            // Null out references to canvas/context in case that helps GC them faster.
            state.areaInstance.canvas = null;
            state.areaInstance.context = null;
            // The held chakram can transition between areas with the hero.
            for (const object of state.areaInstance.objects) {
                if (object.changesAreas) {
                    console.log('adding', object, state.nextAreaInstance);
                    addObjectToArea(state, state.nextAreaInstance, object);
                    object.x -= state.nextAreaInstance.cameraOffset.x;
                    object.y -= state.nextAreaInstance.cameraOffset.y;
                }
            }
            state.areaInstance = state.nextAreaInstance;
            state.hero.x -= state.areaInstance.cameraOffset.x;
            state.hero.y -= state.areaInstance.cameraOffset.y;
            state.camera.x -= state.areaInstance.cameraOffset.x;
            state.camera.y -= state.areaInstance.cameraOffset.y;
            state.hero.safeD = state.hero.d;
            state.hero.safeX = state.hero.x;
            state.hero.safeY = state.hero.y;
            state.areaInstance.cameraOffset = {x: 0, y: 0};
            state.nextAreaInstance = null;
            const alternateArea = getAreaFromLocation({...state.location, isSpiritWorld: !state.location.isSpiritWorld});
            state.alternateAreaInstance = createAreaInstance(state, alternateArea);
            state.areaInstance.alternateArea = state.alternateAreaInstance;
            state.alternateAreaInstance.alternateArea = state.areaInstance;
            linkObjects(state);
            setAreaSection(state, state.hero.d);
            state.hero.area = state.areaInstance;
            if (editingState.isEditing) {
                displayTileEditorPropertyPanel();
                state.areaInstance.tilesDrawn = [];
                state.areaInstance.checkToRedrawTiles = true;
            }
            checkIfAllEnemiesAreDefeated(state, state.areaInstance);
            checkIfAllEnemiesAreDefeated(state, state.alternateAreaInstance);
        }
        return;
    }
    const hero = (state.hero.spiritRadius > 0 && state.hero.astralProjection) || state.hero.activeClone || state.hero;
    let targetX = Math.floor(hero.x - CANVAS_WIDTH / 2 + 16 / 2);
    // Constrain the camera to display only/center the current section.
    if (section.w >= CANVAS_WIDTH) {
        targetX = Math.max(section.x, Math.min(section.x + section.w - CANVAS_WIDTH, targetX));
    } else {
        // This will center on the current section if it is smaller than the screen width.
        targetX = Math.round(section.x + section.w / 2 - CANVAS_WIDTH / 2);
    }
    let targetY = Math.floor(hero.y - CANVAS_HEIGHT / 2 + 16 / 2);
    if (section.h >= CANVAS_HEIGHT) {
        targetY = Math.max(section.y, Math.min(section.y + section.h - CANVAS_HEIGHT, targetY));
    } else {
        // This will center on the current section if it is smaller than the screen height.
        targetY = Math.round(section.y + section.h / 2 - CANVAS_HEIGHT / 2);
    }
    let finished = !!state.nextAreaSection;
    if (state.camera.x < targetX) {
        state.camera.x = Math.min(state.camera.x + speed, targetX);
        finished = false;
    } else if (state.camera.x > targetX) {
        state.camera.x = Math.max(state.camera.x - speed, targetX);
        finished = false;
    }
    if (state.camera.y < targetY) {
        state.camera.y = Math.min(state.camera.y + speed, targetY);
        finished = false;
    } else if (state.camera.y > targetY) {
        state.camera.y = Math.max(state.camera.y - speed, targetY);
        finished = false;
    }
    if (finished) {
        switchToNextAreaSection(state);
    }
}
