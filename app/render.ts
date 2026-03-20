import {editingState} from 'app/development/editingState';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from 'app/gameConstants';
import {getState} from 'app/state';
import {drawCanvas, mainContext} from 'app/utils/canvas';
import {drawOutlinedText} from 'app/utils/simpleWhiteFont';
//import { renderBossRushMenu } from './scenes/bossRush/renderBossRush';

let frameDurations: number[] = [];
export function render() {
    const context = mainContext;
    const state = getState();
    if (!state?.gameHasBeenInitialized) {
        return;
    }
    // Only render if the state has actually progressed since the last render.
    if (state.lastTimeRendered >= state.time) {
        return;
    }
    let startTime = Date.now();
    if (editingState.isEditing) {
        context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.save();
            context.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            context.scale(editingState.areaScale, editingState.areaScale);
            context.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
            renderInternal(context, state);
        context.restore();
    } else {
        renderInternal(context, state);
    }
    if (editingState.showRenderPerformance) {
        const duration = Date.now() - startTime;
        frameDurations.push(duration);
        if (frameDurations.length > 128) {
            frameDurations.shift();
        }
        let maxValue = 0;
        for (const duration of frameDurations) {
            maxValue = Math.max(maxValue, duration);
        }
        if (maxValue > 20) {
            drawOutlinedText(context, '' + maxValue, 0, 0, {textAlign: 'left', textBaseline: 'top'});
        }
        context.strokeStyle = 'blue'
        context.beginPath();
        const height = 200;
        const scale = Math.max(100, maxValue);
        for (let i = 0; i < frameDurations.length; i++) {
            if (frameDurations[i]) {
                context.moveTo(2 * i, CANVAS_HEIGHT);
                context.lineTo(2 * i, CANVAS_HEIGHT - height * frameDurations[i] / scale);
            }
        }
        context.stroke();
        context.strokeStyle = 'yellow'
        context.beginPath();
        context.moveTo(0,  CANVAS_HEIGHT - height * 20  / scale);
        context.lineTo(CANVAS_WIDTH,  CANVAS_HEIGHT - height * 20  / scale);
        context.stroke();
    }
}


export function renderInternal(context: CanvasRenderingContext2D, state: GameState) {
    state.lastTimeRendered = state.time;
    // Iterate through the scene stack once to split it into paused and active scenes.
    const activeScenes: GameScene[] = [];
    const pausedScenes: GameScene[] = [];
    let isPaused = false;
    for (let i = state.sceneStack.length - 1; i >= 0; i--) {
        const scene = state.sceneStack[i];
        if (isPaused) {
            pausedScenes.unshift(scene);
        } else {
            activeScenes.unshift(scene);
        }
        if (scene.blocksUpdates) {
            isPaused = true;
        }
    }
    // Paused scenes appear lower on the stack and will draw from their
    // buffer if it is defined.
    for (const pausedScene of pausedScenes) {
        if (pausedScene.buffer) {
            if (pausedScene.buffer.needsRefresh) {
                delete pausedScene.buffer.needsRefresh;
                pausedScene.render(pausedScene.buffer.context, state);
            }
            drawCanvas(context, pausedScene.buffer.canvas);
        } else {
            pausedScene.render(context, state);
        }
    }
    // Active scenes are always drawn fresh and automatically mark their
    // buffer as needing to be refeshed.
    for (const activeScene of activeScenes) {
        activeScene.render(context, state);
        if (activeScene.buffer) {
            activeScene.buffer.needsRefresh = true;
        }
    }
}
