import {renderEditor} from 'app/development/renderEditor';
import {renderStandardFieldStack, renderMutation, renderTransition} from 'app/scenes/field/renderField';
import {updateField} from 'app/scenes/field/updateField';
import {updateMutation, updateTransition} from 'app/scenes/field/updateTransition';
import {sceneHash} from 'app/scenes/sceneHash';


export class FieldScene implements GameScene {
    sceneType = 'field';
    paused = false;
    blocksInput = true;
    update(state: GameState, interactive: boolean) {
        if (!state.areaSet?.current) {
            return;
        }
        if (state.transitionState && !state.areaSet.current.priorityObjects?.length) {
            updateTransition(state, state.transitionState);
            return;
        }
        if (state.mutationState && !state.areaSet.current.priorityObjects?.length) {
            updateMutation(state, state.mutationState);
            return;
        }
        updateField(state, interactive);
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        if (!state.areaSet?.current) {
            return;
        }
        if (state.transitionState && !state.areaSet.current.priorityObjects?.length) {
            renderTransition(context, state, state.transitionState);
            return;
        }
        if (state.mutationState && !state.areaSet.current.priorityObjects?.length) {
            renderMutation(context, state, state.mutationState);
        }
        renderStandardFieldStack(context, state);
        renderEditor(context, state);
    }
}

sceneHash.field = new FieldScene();
