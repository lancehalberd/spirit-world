import {renderField} from 'app/scenes/field/renderField';
import {updateField} from 'app/scenes/field/updateField';
import {sceneHash} from 'app/scenes/sceneHash';


export class FieldScene implements GameScene {
    sceneType = 'field';
    paused = false;
    blocksInput = true;
    update(state: GameState) {
        updateField(state);
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        renderField(context, state);
    }
}

sceneHash.field = new FieldScene();
