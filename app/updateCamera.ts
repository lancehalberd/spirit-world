import {
    getAreaInstanceFromLocation, linkObjects,
    setConnectedAreas, switchToNextAreaSection,
} from 'app/content/areas';
import { editingState } from 'app/development/editingState';
import {CANVAS_WIDTH, CANVAS_HEIGHT} from 'app/gameConstants';
import { updateAreaSection } from 'app/utils/area';
import { checkIfAllEnemiesAreDefeated } from 'app/utils/checkIfAllEnemiesAreDefeated';
import { getAreaSize } from 'app/utils/getAreaSize';
import { addEffectToArea } from 'app/utils/effects';
import {getCameraTarget} from 'app/utils/fixCamera';
import { addObjectToArea } from 'app/utils/objects';
import { isObjectInsideTarget } from 'app/utils/index';

const cameraSpeed = 10;
export function updateCamera(state: GameState, speed?: number): void {
    if (!speed) {
        if (state.hero.action === 'jumpingDown' && !state.nextAreaSection && !state.nextAreaInstance) {
            speed = 4;
        } else {
            speed = editingState.isEditing ? 20 : (state.camera.speed ?? cameraSpeed);
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
                for (const frame of state.areaInstance.backgroundFrames) {
                    frame.canvas = null;
                    frame.context = null;
                }
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
            // This is done in updateAreaSection.
            //state.hero.safeD = state.hero.d;
            //state.hero.safeX = state.hero.x;
            //state.hero.safeY = state.hero.y;
            state.areaInstance.cameraOffset = {x: 0, y: 0};
            state.nextAreaInstance = null;
            // We don't seem to need this any more, but let's preserve it for a bit
            // in case we see issues with super tile transitions again.
            // An old bug used to be that you could briefly move after screen transition
            // when being pulled by the crystal bead flows in the waterfall tower, allowing
            // you to awkwardly screen transition back north after being pushed south.
            /*state.scriptEvents.activeEvents.push({
                type: 'wait',
                blockPlayerInput: true,
                duration: 2 * FRAME_LENGTH,
                time: state.time,
            });*/

            state.alternateAreaInstance = getAreaInstanceFromLocation(
                state,
                {...state.location, isSpiritWorld: !state.location.isSpiritWorld}
            );
            state.areaInstance.alternateArea = state.alternateAreaInstance;
            state.alternateAreaInstance.alternateArea = state.areaInstance;
            linkObjects(state);
            updateAreaSection(state, true);
            setConnectedAreas(state, lastAreaInstance);
            state.hero.area = state.areaInstance;
            if (editingState.isEditing) {
                editingState.needsRefresh = true;
                state.areaInstance.tilesDrawn = [];
                state.areaInstance.checkToRedrawTiles = true;
            }
            checkIfAllEnemiesAreDefeated(state, state.areaInstance);
            checkIfAllEnemiesAreDefeated(state, state.alternateAreaInstance);

            // Make sure to remove renderParent from the hero for any objects that are
            // no longer being rendered.
            if (state.hero.renderParent && state.hero.renderParent.area !== state.hero.area) {
                delete state.hero.renderParent;
            }
        }
        return;
    }
    const target = getCameraTarget(state);
    if (state.camera.x < target.x) {
        state.camera.x = Math.min(state.camera.x + speed, target.x);
    } else if (state.camera.x > target.x) {
        state.camera.x = Math.max(state.camera.x - speed, target.x);
    }
    if (state.camera.y < target.y) {
        state.camera.y = Math.min(state.camera.y + speed, target.y);
    } else if (state.camera.y > target.y) {
        state.camera.y = Math.max(state.camera.y - speed, target.y);
    }
    // Switch to the next area as soon as the screen is displayed entirely in the new section.
    // section is for the next area section, if one is present.
    if (state.nextAreaSection && isObjectInsideTarget({
        x: state.camera.x, y: state.camera.y, w: CANVAS_WIDTH, h: CANVAS_HEIGHT
    }, section)) {
        switchToNextAreaSection(state);
    }
}
