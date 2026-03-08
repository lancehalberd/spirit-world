import {renderEditor} from 'app/development/renderEditor';
import {renderStandardFieldStack, renderTransition} from 'app/scenes/field/renderField';
import {updateField} from 'app/scenes/field/updateField';
import {updateTransition} from 'app/scenes/field/updateTransition';
import {sceneHash} from 'app/scenes/sceneHash';


export class FieldScene implements GameScene {
    sceneType = 'field';
    paused = false;
    blocksInput = true;
    update(state: GameState, interactive: boolean) {
        if (state.transitionState && !state.areaInstance?.priorityObjects?.length) {
            updateTransition(state);
            return;
        }
        updateField(state, interactive);
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        if (state.transitionState && !state.areaInstance?.priorityObjects?.length) {
            renderTransition(context, state);
            return;
        }
        renderStandardFieldStack(context, state);
        renderEditor(context, state);
    }
}

sceneHash.field = new FieldScene();
