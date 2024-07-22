import { FRAME_LENGTH, GAME_KEY } from 'app/gameConstants';
import { isGameKeyDown, wasGameKeyPressed, wasMenuConfirmKeyPressed } from 'app/userInput';
import { isATrackPlaying } from 'app/utils/sounds';

export function updatePrologue(state: GameState) {
    if (!state.paused) {
        if (isGameKeyDown(state, GAME_KEY.LEFT)) {
            state.prologueTime -= FRAME_LENGTH;
        } else if (isGameKeyDown(state, GAME_KEY.RIGHT)) {
            state.prologueTime += 2 * FRAME_LENGTH;
        } else if (isGameKeyDown(state, GAME_KEY.UP)) {
            state.prologueTime += 10 * FRAME_LENGTH;
        } else  if (isGameKeyDown(state, GAME_KEY.DOWN)) {
            state.prologueTime -= 10 * FRAME_LENGTH;
        } else {
            if (state.prologueTime < 1000 && !isATrackPlaying() && !state.settings.muteAllSounds) {
                // Delay longer if the music hasn't started playing (unless the game is muted).
                state.prologueTime += FRAME_LENGTH / 4;
            } else {
                state.prologueTime += FRAME_LENGTH;
            }
        }
        state.prologueTime = Math.max(0, state.prologueTime);
    }
    if (wasGameKeyPressed(state, GAME_KEY.MENU)) {
        state.paused = !state.paused;
    }
    // This timestamp needs to be kept in sync with the rendering code in `renderPrologue` so that we switch
    // to the title shortly after the prologue fade to black.
    if (state.prologueTime >= 74000 || wasMenuConfirmKeyPressed(state) || wasGameKeyPressed(state, GAME_KEY.MAP)) {
        state.scene = 'title';
        return;
    }
}
