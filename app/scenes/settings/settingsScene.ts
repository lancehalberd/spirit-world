import {GAME_KEY} from 'app/gameConstants';
import {showControlsScene} from 'app/scenes/controls/controlsScene';
import {pushScene} from 'app/scenes/sceneHash';
import {renderSettings} from 'app/scenes/settings/renderSettings';
import {getSettingsOptions} from 'app/state';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import {playSound } from 'app/utils/sounds';

export class SettingsScene implements GameScene {
    blocksInput = true;
    blocksUpdates = true;
    index = 0;
    update(state: GameState, interactive: boolean) {
        if (wasGameKeyPressed(state, GAME_KEY.MENU)) {
            state.sceneStack.pop();
            return;
        }

        const options = getSettingsOptions(state);
        const selectedOption = options[this.index];
        if (wasGameKeyPressed(state, GAME_KEY.UP)) {
            this.index = (this.index - 1 + options.length) % options.length;
            playSound('menuTick');
        } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
            this.index = (this.index + 1) % options.length;
            playSound('menuTick');
        }
        if (wasConfirmKeyPressed(state)) {
            playSound('menuTick');
            switch (selectedOption) {
            case 'VIEW CONTROLS':
                showControlsScene(state);
                break;
            case 'RESUME':
                state.sceneStack.pop();
                break;
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        renderSettings(context, state, this);
    }
}

const settingsScene = new SettingsScene();
export function showSettingsScene(state: GameState) {
    pushScene(state, settingsScene);
    settingsScene.index = 0;
}
