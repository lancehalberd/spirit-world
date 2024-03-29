import {
    getAreaInstanceFromLocation, linkObjects,
    setConnectedAreas, switchToNextAreaSection,
} from 'app/content/areas';
import { editingState } from 'app/development/editingState';
import { CANVAS_WIDTH, CANVAS_HEIGHT, FRAME_LENGTH } from 'app/gameConstants';
import { setAreaSection } from 'app/utils/area';
import { checkIfAllEnemiesAreDefeated } from 'app/utils/checkIfAllEnemiesAreDefeated';
import { getAreaSize } from 'app/utils/getAreaSize';
import { addEffectToArea } from 'app/utils/effects';
import { addObjectToArea } from 'app/utils/objects';
import { isObjectInsideTarget } from 'app/utils/index';

const cameraSpeed = 10;
export function updateCamera(state: GameState, speed?: number): void {
    if (!speed) {
        if (state.hero.action === 'jumpingDown' && !state.nextAreaSection && !state.nextAreaInstance) {
            speed = 4;
        } else {
            speed = editingState.isEditing ? 20 : cameraSpeed;
        }
    }
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
            if (!editingState.isEditing) {
                state.areaInstance.canvas = null;
                state.areaInstance.context = null;
            }
            // The held chakram can transition between areas with the hero.
            for (const object of state.areaInstance.objects) {
                if (object.changesAreas) {
                    addObjectToArea(state, state.nextAreaInstance, object);
                    object.x -= state.nextAreaInstance.cameraOffset.x;
                    object.y -= state.nextAreaInstance.cameraOffset.y;
                }
            }
            for (const effect of state.areaInstance.effects) {
                if (effect.changesAreas) {
                    addEffectToArea(state, state.nextAreaInstance, effect);
                    effect.x -= state.nextAreaInstance.cameraOffset.x;
                    effect.y -= state.nextAreaInstance.cameraOffset.y;
                }
            }
            const lastAreaInstance = state.areaInstance;
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
            state.scriptEvents.activeEvents.push({
                type: 'wait',
                blockPlayerInput: true,
                duration: 2 * FRAME_LENGTH,
                time: state.time,
            });

            state.alternateAreaInstance = getAreaInstanceFromLocation(
                state,
                {...state.location, isSpiritWorld: !state.location.isSpiritWorld}
            );
            state.areaInstance.alternateArea = state.alternateAreaInstance;
            state.alternateAreaInstance.alternateArea = state.areaInstance;
            linkObjects(state);
            setAreaSection(state);
            setConnectedAreas(state, lastAreaInstance);
            state.hero.area = state.areaInstance;
            if (editingState.isEditing) {
                editingState.needsRefresh = true;
                state.areaInstance.tilesDrawn = [];
                state.areaInstance.checkToRedrawTiles = true;
            }
            checkIfAllEnemiesAreDefeated(state, state.areaInstance);
            checkIfAllEnemiesAreDefeated(state, state.alternateAreaInstance);
        }
        return;
    }
    const hero = (state.hero.spiritRadius > 0 && state.hero.astralProjection) || state.hero;
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
    if (state.camera.x < targetX) {
        state.camera.x = Math.min(state.camera.x + speed, targetX);
    } else if (state.camera.x > targetX) {
        state.camera.x = Math.max(state.camera.x - speed, targetX);
    }
    if (state.camera.y < targetY) {
        state.camera.y = Math.min(state.camera.y + speed, targetY);
    } else if (state.camera.y > targetY) {
        state.camera.y = Math.max(state.camera.y - speed, targetY);
    }
    // Switch to the next area as soon as the screen is displayed entirely in the new section.
    // section is for the next area section, if one is present.
    if (state.nextAreaSection && isObjectInsideTarget({
        x: state.camera.x, y: state.camera.y, w: CANVAS_WIDTH, h: CANVAS_HEIGHT
    }, section)) {
        switchToNextAreaSection(state);
    }
}
