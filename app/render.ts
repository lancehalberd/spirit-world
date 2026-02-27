import {editingState} from 'app/development/editingState';
import {renderEditor} from 'app/development/renderEditor';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from 'app/gameConstants';
import {renderControls} from 'app/scenes/controls/renderControls';
import {renderDefeatedMenu} from 'app/scenes/defeated/renderDefeated';
import {renderStandardFieldStack, renderTransition, translateContextForAreaAndCamera} from 'app/render/renderField';
import {renderHUD} from 'app/renderHUD';
import {renderFieldMenu} from 'app/scenes/fieldMenu/renderFieldMenu';
import {renderIntro} from 'app/scenes/intro/renderIntro';
import {renderPrologue} from 'app/scenes/prologue/renderPrologue';
import {renderMap} from 'app/render/renderMap';
import {renderMessage} from 'app/render/renderMessage';
import {renderFileSelect} from 'app/scenes/fileSelect/renderFileSelect';
import {renderTitle} from 'app/scenes/title/renderTitle';
import {renderSettings} from 'app/scenes/settings/renderSettings';
import {getState, shouldHideMenu} from 'app/state';
import {mainContext} from 'app/utils/canvas';
import {drawOutlinedText} from 'app/utils/simpleWhiteFont';

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
    if (state.showControls) {
        renderControls(context, state);
        return;
    }
    if (state.scene === 'prologue') {
        renderPrologue(context, state);
        return;
    }
    if (state.scene === 'intro') {
        renderIntro(context, state);
        return;
    }
    if (state.transitionState && !state.areaInstance?.priorityObjects?.length) {
        if (state.paused && !shouldHideMenu(state)) {
            if (state.showMap) {
                renderTransition(context, state);
                renderHUD(context, state);
                renderMap(context, state);
                return;
            } else {
                renderFieldMenu(context, state, (context: CanvasRenderingContext2D, state: GameState) => {
                    renderTransition(context, state);
                    renderHUD(context, state);
                });
                return;
            }
        }
        renderTransition(context, state);
        return;
    }
    if (state.scene === 'fileSelect' || state.scene === 'chooseGameMode' ||
            state.scene === 'deleteSavedGame' || state.scene === 'deleteSavedGameConfirmation'
    ) {
        renderFileSelect(context, state);
        return;
    }
    if (state.scene === 'title') {
        renderTitle(context, state);
        return;
    }
    if (state.scene === 'options') {
        renderSettings(context, state);
        return;
    }
    if (state.defeatState.defeated) {
        renderFieldAndEditor(context, state);
        context.save();
            if (state.defeatState.reviving) {
                context.globalAlpha *= 0.7 * (1 - state.hero.life / state.hero.savedData.maxLife);
            } else {
                context.globalAlpha *= (state.hero.savedData.hasRevive ? 0.7 : 1) * Math.min(1, state.defeatState.time / 1000);
            }
            context.fillStyle = '#000';
            context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.restore();
        context.save();
            // render the hero + special effects on top of the dark background.
            translateContextForAreaAndCamera(context, state, state.areaInstance);
            for (const effect of state.areaInstance.objectsToRender) {
                if (effect.drawPriority === 'background-special') {
                    effect.render?.(context, state);
                }
            }
            state.hero.render(context, state);
            for (const effect of state.areaInstance.objectsToRender) {
                if (effect.drawPriority === 'foreground-special') {
                    effect.render?.(context, state);
                }
            }
        context.restore();
        // Draw the HUD onto the field.
        renderHUD(context, state);
        renderMessage(context, state);
        if (state.defeatState.time >= 2000) {
            renderDefeatedMenu(context, state);
        }
        renderHUD(context, state);
        renderMessage(context, state);
    } else if (state.paused && !shouldHideMenu(state)) {
        if (state.showMap) {
            renderFieldMenuBackground(context, state);
            renderMap(context, state);
        } else {
            renderFieldMenu(context, state, renderFieldMenuBackground);
        }
        renderMessage(context, state);
    } else {
        // Normal rendering during game play.
        renderFieldAndEditor(context, state);
        renderHUD(context, state);
        renderMessage(context, state);
    }
}

function renderFieldMenuBackground(context: CanvasRenderingContext2D, state: GameState) {
    renderFieldAndEditor(context, state);
    renderHUD(context, state);
}

function renderFieldAndEditor(context: CanvasRenderingContext2D, state: GameState) {
    state.lastTimeRendered = state.time;
    renderStandardFieldStack(context, state);

    // Render any editor specific graphics if appropriate.
    renderEditor(context, state);
}
