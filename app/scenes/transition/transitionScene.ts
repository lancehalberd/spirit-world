import {CANVAS_HEIGHT, CANVAS_WIDTH, FRAME_LENGTH, GAME_KEY} from 'app/gameConstants';
import {showPauseScene} from 'app/scenes/pause/pauseScene';
import {KEY, isKeyboardKeyDown, wasGameKeyPressed} from 'app/userInput';
import {createCanvasBuffer, drawCanvas, mainCanvas} from 'app/utils/canvas';
import {removeElementFromArray} from 'app/utils/index';

interface TransitionProps {
    // Defaults to the current stack.
    oldStack: GameScene[]
    // Defaults to the current stack.
    newStack: GameScene[]
    // Stack elements that will be placed over the transition(and remain active). Defaults to an empty array.
    // This is used when we need to show a transition behind elements, for example if we show the HUD
    // while the field transitions, or we show the boss rush menu while the boss rush preview transitions beneath it.
    activeStack: GameScene[]
    transitionType: 'fade'|'circle'
    transitionColor: string
    duration: number
    // Called once after switching to the new stack.
    onSwitch?: (state: GameState, transitionScene: TransitionScene) => void
}

// This simple pause scene will display when the player attempts to pause the game when
// the field menu should not be displayed.
export class TransitionScene implements GameScene {
    blocksInput = true;
    blocksRenders = false;
    blocksUpdates = true;
    internalBuffer: CanvasBuffer = createCanvasBuffer(CANVAS_WIDTH, CANVAS_HEIGHT);
    props: TransitionProps
    transitionTime = 0;
    update(state: GameState, interactive: boolean) {
        if (interactive && wasGameKeyPressed(state, GAME_KEY.MENU) && isKeyboardKeyDown(KEY.SHIFT)) {
            showPauseScene(state);
        }
        this.transitionTime += FRAME_LENGTH;
        const hideDuration = this.props.duration / 2;
        // Switch the scene stack at the halfway mark.
        if (this.transitionTime >= hideDuration && this.transitionTime - FRAME_LENGTH < hideDuration) {
            this.internalBuffer.needsRefresh = true;
            this.blocksRenders = false;
            state.sceneStack = [...this.props.newStack, this, ...this.props.activeStack];
            // This is called after setting sceneStack in case it is used to set a new stack directly.
            this.props.onSwitch?.(state, this);
        }
        if (this.transitionTime >= this.props.duration) {
            // This does not set the entire sceneStack in case the scene stack was manually adjusted
            // in the `this.props.onSwitch` call.
            removeElementFromArray(state.sceneStack, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        // This should draw the scene stack beneath this scene to the buffer once.
        if (this.internalBuffer.needsRefresh) {
            this.internalBuffer.needsRefresh = false;
            this.blocksRenders = true;
            drawCanvas(this.internalBuffer.context, mainCanvas);
        } else {
            drawCanvas(context, this.internalBuffer.canvas);
        }
        const hideDuration = this.props.duration / 2;
        const showDuration = this.props.duration / 2;
        if (this.props.transitionType === 'fade') {
            if (this.transitionTime <= hideDuration) {
                context.save();
                    const p = Math.min(1, 1.5 * this.transitionTime / hideDuration);
                    context.globalAlpha = p;
                    context.fillStyle = this.props.transitionColor;
                    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                context.restore();
            } else {
                context.save();
                    const alpha = 1.5 - 1.5 * (this.transitionTime - hideDuration) / showDuration;
                    context.globalAlpha = Math.max(0, Math.min(1, alpha));
                    context.fillStyle = this.props.transitionColor;
                    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                context.restore();
            }
        } else {
            const x = state.hero.x + state.hero.w / 2 - state.camera.x;
            const y = state.hero.y + 2 - state.camera.y;
            if (this.transitionTime <= hideDuration) {
                context.save();
                    const p = 1 - 1.5 * this.transitionTime / hideDuration;
                    const radius = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * Math.max(0, Math.min(1, p));
                    context.fillStyle = '#000';
                    context.beginPath();
                    context.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                    context.arc(x, y, radius, 0, 2 * Math.PI, true);
                    context.fill();
                context.restore();
            } else {
                context.save();
                    const p = 1.5 * (this.transitionTime - hideDuration) / showDuration - 0.5;
                    const radius = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * Math.max(0, Math.min(1, p));
                    context.fillStyle = '#000';
                    context.beginPath();
                    context.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                    context.arc(x, y, radius, 0, 2 * Math.PI, true);
                    context.fill();
                context.restore();
            }
        }
    }
}

export function showTransitionScene(state: GameState, {
    oldStack = state.sceneStack,
    newStack = state.sceneStack,
    activeStack = [],
    transitionType = 'fade',
    transitionColor = '#000',
    duration = 1000,
    onSwitch,
}: Partial<TransitionProps>, transitionScene = new TransitionScene()): TransitionScene {
    // If we are reusing an existing transition scene in progress,
    // we need to make some adjustments based on its current state.
    if (transitionScene.transitionTime > 0) {
        const p = transitionScene.transitionTime / transitionScene.props.duration;
        if (p >= 0.5) {
            // If we have passed the halfway mark we swap the old fade in time to be the new fade out time.
            transitionScene.transitionTime = duration * (1 - p);
            oldStack = transitionScene.props.newStack;
        } else {
            // Prior to the halfway mark, we can keep using the same transition values from before.
            transitionScene.transitionTime = duration * p;
            oldStack = transitionScene.props.oldStack;
        }
    } else {
        transitionScene.internalBuffer.needsRefresh = true;
        transitionScene.blocksRenders = false;
        transitionScene.transitionTime = 0;
    }
    transitionScene.props = {
        oldStack, newStack, activeStack, transitionType, transitionColor, duration, onSwitch
    };
    state.sceneStack = [...oldStack, transitionScene, ...activeStack];
    return transitionScene;
}
