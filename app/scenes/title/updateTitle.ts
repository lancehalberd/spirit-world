import { FRAME_LENGTH, GAME_KEY } from 'app/gameConstants';
import {showPrologueScene} from 'app/scenes/prologue/showPrologueScene';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import { playSound } from 'app/utils/sounds';
import {
    getTitleOptions,
    setSaveFileToState,
} from 'app/state';

export function updateTitle(state: GameState) {
    const options = getTitleOptions(state);

    state.idleTime += FRAME_LENGTH;
    if (state.idleTime > 60000) {
        showPrologueScene(state);
        return;
    }

    const selectedOption = options[state.menuIndex];
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        state.menuIndex = (state.menuIndex - 1 + options.length) % options.length;
        playSound('menuTick');
        state.idleTime = 0;
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        state.menuIndex = (state.menuIndex + 1) % options.length;
        playSound('menuTick');
        state.idleTime = 0;
    }
    if (wasConfirmKeyPressed(state)) {
        state.idleTime = 0;
        playSound('menuTick');
        switch (selectedOption) {
        case 'START':
            state.scene = 'fileSelect';
            setSaveFileToState(0, 0);
            state.menuIndex = 0;
            break;
        case 'SETTINGS':
            state.scene = 'options';
            state.menuIndex = 0;
            break;
        case 'QUIT':
            console.log('quit game');
            // Will be implemented when the game is wrapped in Electron as a desktop app, unused now
            break;
        }
    }
}
