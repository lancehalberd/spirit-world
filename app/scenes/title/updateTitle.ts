import { GAME_KEY } from 'app/gameConstants';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import { playSound } from 'app/utils/sounds';
import { getTitleOptions } from 'app/state';
import {
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
            break;
        case 'OPTIONS':
            console.log('display options');
            break;
        case 'QUIT':
            console.log('quit game');
            break;
        }
    }
}
