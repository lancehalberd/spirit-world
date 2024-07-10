import { GAME_KEY } from 'app/gameConstants';
import { wasGameKeyPressed, wasMenuConfirmKeyPressed } from 'app/userInput';
import { updateSoundSettings } from 'app/utils/soundSettings';

export function updateControls(state: GameState) {
    if (wasMenuConfirmKeyPressed(state) || wasGameKeyPressed(state, GAME_KEY.MENU) || wasGameKeyPressed(state, GAME_KEY.MAP)) {
        toggleShowControls(state);
        return;
    }
}

export function toggleShowControls(state: GameState) {
    state.showControls = !state.showControls;
    // No sounds play while the controls are showing.
    updateSoundSettings(state);
}
// This needs to be exposed to the audio toggle in the html page.
window['toggleShowControls'] = toggleShowControls;
