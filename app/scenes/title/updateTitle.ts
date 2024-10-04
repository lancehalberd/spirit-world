import { GAME_KEY } from 'app/gameConstants';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import { playSound } from 'app/utils/sounds';
import {
    getTitleOptions,
    getFileSelectOptions,
    setSaveFileToState,
} from 'app/state';

export function updateTitle(state: GameState) {
    const options = getTitleOptions(state);

    const selectedOption = options[state.menuIndex];
    if (wasGameKeyPressed(state, GAME_KEY.UP)) {
        state.menuIndex = (state.menuIndex - 1 + options.length) % options.length;
        playSound('menuTick');
    } else if (wasGameKeyPressed(state, GAME_KEY.DOWN)) {
        state.menuIndex = (state.menuIndex + 1) % options.length;
        playSound('menuTick');
    }
    if (wasConfirmKeyPressed(state)) {
        playSound('menuTick');
        console.log({selectedOption});
        switch (selectedOption) {
        case 'START':
            state.scene = 'fileSelect';
            getFileSelectOptions(state);
            setSaveFileToState(0, 0);
            state.menuIndex = 0;
            break;
        case 'SETTINGS':
            console.log('display settings');
            state.scene = 'options';
            state.menuIndex = 0;
            break;
        case 'QUIT':
            console.log('quit game');
            break;
        }
    }
}
