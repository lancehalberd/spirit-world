import { GAME_KEY } from 'app/gameConstants';
import {
    wasGameKeyPressed,
    wasConfirmKeyPressed,
} from 'app/userInput';
import { playSound } from 'app/utils/sounds';
import { getSettingsOptions } from 'app/state';
import { showTitleScene } from 'app/scenes/title/showTitleScene';
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
        switch (selectedOption) {
        case 'VIEW CONTROLS':
            toggleShowControls(state);
            break;
        case 'RESUME':
            if (state.location.zoneKey === 'title') {
                showTitleScene(state);
            } else {
                state.scene = 'game';
            }
            break;
        }
    }
}
