import { GAME_KEY } from 'app/gameConstants';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import { playSound } from 'app/utils/sounds';
import { getSettingsOptions } from 'app/state';
import { initializeTitle } from 'app/scenes/title/initializeTitle';
import { toggleShowControls } from 'app/scenes/controls/updateControls';

export function updateSettings(state: GameState) {
    const options = getSettingsOptions(state);

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
        case 'VOLUME OFF':
            console.log('volume off');
            break;
        case 'VOLUME LOW':
            console.log('volume low');
            break;
        case 'VOLUME MED':
            console.log('volume med');
            break;
        case 'VOLUME HI':
            console.log('volume hi');
            break;
        case 'VIEW CONTROLS':
            console.log('view controls');
            toggleShowControls(state);
            break;
        case 'RESUME':
            if (state.location.zoneKey === 'title') {
                state.scene = 'title';
                initializeTitle(state);
                state.menuIndex = 0;
            } else {
                state.scene = 'game';
            }
            break;
        }
    }
}