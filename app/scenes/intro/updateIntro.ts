import { FRAME_LENGTH, GAME_KEY } from 'app/gameConstants';
import { isGameKeyDown, isKeyboardKeyDown, KEY, wasGameKeyPressed, wasMenuConfirmKeyPressed } from 'app/userInput';
import { isATrackPlaying } from 'app/utils/sounds';
import { showTitleScene } from 'app/scenes/title/showTitleScene';

export const FADE_TIME = 1500;
export const PANEL_DURATION = 7000;
export const FULL_PANEL_DURATION = (2 * FADE_TIME + PANEL_DURATION);
// 6 panels, each fades in+out.
export const INTRO_DURATION = 6 * FULL_PANEL_DURATION;
export function updateIntro(state: GameState) {
    if (isKeyboardKeyDown(KEY.SHIFT)) {
        if (isGameKeyDown(state, GAME_KEY.LEFT)) {
            state.prologueTime -= 5 * FRAME_LENGTH;
        } else if (isGameKeyDown(state, GAME_KEY.RIGHT)) {
            state.prologueTime += 5 * FRAME_LENGTH;
        } else if (isGameKeyDown(state, GAME_KEY.UP)) {
            state.prologueTime += 25 * FRAME_LENGTH;
        } else  if (isGameKeyDown(state, GAME_KEY.DOWN)) {
            state.prologueTime -= 25 * FRAME_LENGTH;
        }
    } else {
        if (state.prologueTime < 1000 && !isATrackPlaying() && !state.settings.muteAllSounds) {
            // Delay longer if the music hasn't started playing (unless the game is muted).
            state.prologueTime += FRAME_LENGTH / 4;
        } else {
            state.prologueTime += FRAME_LENGTH;
        }
    }
    state.prologueTime = Math.max(0, state.prologueTime);
    // This timestamp needs to be kept in sync with the rendering code in `renderPrologue` so that we switch
    // to the title shortly after the prologue fade to black.
    if (state.prologueTime >= INTRO_DURATION
        || wasMenuConfirmKeyPressed(state)
        || wasGameKeyPressed(state, GAME_KEY.MENU)
        || wasGameKeyPressed(state, GAME_KEY.MAP)
    ) {
        showTitleScene(state);
        return;
    }
}
