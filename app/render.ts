import { editingState } from 'app/development/editingState';
import { renderEditor } from 'app/development/renderEditor';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from 'app/gameConstants';
import { renderControls } from 'app/scenes/controls/renderControls';
import { renderDefeatedMenu } from 'app/scenes/defeated/renderDefeated';
import { renderStandardFieldStack, renderTransition, translateContextForAreaAndCamera } from 'app/render/renderField';
import { renderHUD } from 'app/renderHUD';
import { renderInventory } from 'app/scenes/inventory/renderInventory';
import { renderPrologue } from 'app/scenes/prologue/renderPrologue';
import { renderMap } from 'app/render/renderMap';
import { renderMessage } from 'app/render/renderMessage';
import { renderTitle } from 'app/scenes/title/renderTitle';
import { getState, shouldHideMenu } from 'app/state';
import { mainContext } from 'app/utils/canvas';

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
    if (state.transitionState && !state.areaInstance?.priorityObjects?.length) {
        renderTransition(context, state);
        renderHUD(context, state);
        if (state.paused && !shouldHideMenu(state)) {
            if (state.showMap) {
                renderMap(context, state);
            } else {
                renderInventory(context, state);
            }
        }
        return;
    }
    if (state.scene === 'title' || state.scene === 'chooseGameMode' ||
            state.scene === 'deleteSavedGame' || state.scene === 'deleteSavedGameConfirmation'
    ) {
        renderTitle(context, state);
        return;
    }
    state.lastTimeRendered = state.time;
    renderStandardFieldStack(context, state);
    renderMessage(context, state);

    // Render any editor specific graphics if appropriate.
    renderEditor(context, state);
    if (state.defeatState.defeated) {
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
        if (state.defeatState.time >= 2000) {
            renderDefeatedMenu(context, state);
        }
        return;
    }
    renderHUD(context, state);
    if (state.paused && !shouldHideMenu(state)) {
        if (state.showMap) {
            renderMap(context, state);
        } else {
            renderInventory(context, state);
        }
    }
}
