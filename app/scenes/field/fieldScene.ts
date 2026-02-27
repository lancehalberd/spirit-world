import {renderField} from 'app/scenes/field/renderField';
import {updateField} from 'app/scenes/field/updateField';
import {sceneHash} from 'app/scenes/sceneHash';



export class FieldScene implements GameScene {
    capturesInput = true;
    idleTime = 0;
    menuIndex = 0;
    update(state: GameState) {
        updateField(state);
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        renderField(context, state);
    }
}

sceneHash.field = new FieldScene();
