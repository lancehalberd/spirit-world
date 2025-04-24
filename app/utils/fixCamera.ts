import { CANVAS_WIDTH, CANVAS_HEIGHT } from 'app/gameConstants';
import { getAreaSize } from 'app/utils/getAreaSize';


// Instantly move the camera to the current target location.
// This logic needs to be kept up to date with the target location logic in `updateCamera`.
export function fixCamera(state: GameState): void {
    const { w, h } = getAreaSize(state);
    if (state.nextAreaInstance) {
        if (state.nextAreaInstance.cameraOffset.x < 0 && state.camera.x > -CANVAS_WIDTH) {
            state.camera.x = -CANVAS_WIDTH;
        }
        if (state.nextAreaInstance.cameraOffset.x > 0 && state.camera.x < w) {
            state.camera.x = w;
        }
        if (state.nextAreaInstance.cameraOffset.y < 0 && state.camera.y > -CANVAS_HEIGHT) {
            state.camera.y = -CANVAS_HEIGHT;
        }
        if (state.nextAreaInstance.cameraOffset.y > 0 && state.camera.y < h) {
            state.camera.y = h;
        }
        return;
    }
    const target = getCameraTarget(state);
    state.camera.x = target.x;
    state.camera.y = target.y;
}

export function getCameraTarget(state: GameState): Point {
    const {section} = getAreaSize(state);
    const hero = (state.hero.spiritRadius > 0 && state.hero.astralProjection) || state.hero;
    const focalPoint = state.scriptEvents.cameraTarget ?? {x: hero.x + 8, y: hero.y + 8};
    let targetX = Math.floor(focalPoint.x - CANVAS_WIDTH / 2);
    // Constrain the camera to display only/center the current section.
    if (section.w >= CANVAS_WIDTH) {
        targetX = Math.max(section.x, Math.min(section.x + section.w - CANVAS_WIDTH, targetX));
    } else {
        // This will center on the current section if it is smaller than the screen width.
        targetX = Math.round(section.x + section.w / 2 - CANVAS_WIDTH / 2);
    }
    let targetY = Math.floor(focalPoint.y - CANVAS_HEIGHT / 2);
    if (section.h >= CANVAS_HEIGHT) {
        targetY = Math.max(section.y, Math.min(section.y + section.h - CANVAS_HEIGHT, targetY));
    } else {
        // This will center on the current section if it is smaller than the screen height.
        targetY = Math.round(section.y + section.h / 2 - CANVAS_HEIGHT / 2);
    }
    return {x: targetX, y: targetY};
}
