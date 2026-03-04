import {FRAME_LENGTH, GAME_KEY} from 'app/gameConstants';
import {renderPrologue} from 'app/scenes/prologue/renderPrologue';
import {showTitleScene} from 'app/scenes/title/showTitleScene';
import {sceneHash} from 'app/scenes/sceneHash';
import {isGameKeyDown, isKeyboardKeyDown, KEY, wasGameKeyPressed, wasMenuConfirmKeyPressed} from 'app/userInput';
import {isATrackPlaying, playTrack} from 'app/utils/sounds';


export class PrologueScene implements GameScene {
    blocksInput = true;
    blocksUpdates = true;
    time = 0;
    update(state: GameState) {
        if (isKeyboardKeyDown(KEY.SHIFT)) {
            if (isGameKeyDown(state, GAME_KEY.LEFT)) {
                this.time -= 5 * FRAME_LENGTH;
            } else if (isGameKeyDown(state, GAME_KEY.RIGHT)) {
                this.time += 5 * FRAME_LENGTH;
            } else if (isGameKeyDown(state, GAME_KEY.UP)) {
                this.time += 25 * FRAME_LENGTH;
            } else  if (isGameKeyDown(state, GAME_KEY.DOWN)) {
                this.time -= 25 * FRAME_LENGTH;
            }
        } else {
            if (this.time < 1000 && !isATrackPlaying() && !state.settings.muteAllSounds) {
                // Delay longer if the music hasn't started playing (unless the game is muted).
                this.time += FRAME_LENGTH / 4;
            } else {
                this.time += FRAME_LENGTH;
            }
        }
        this.time = Math.max(0, this.time);
        // This timestamp needs to be kept in sync with the rendering code in `renderPrologue` so that we switch
        // to the title shortly after the prologue fade to black.
        if (this.time >= 74000
            || wasMenuConfirmKeyPressed(state)
            || wasGameKeyPressed(state, GAME_KEY.MENU)
            || wasGameKeyPressed(state, GAME_KEY.MAP)
        ) {
            showTitleScene(state);
            return;
        }
    }
    updateMusic(state: GameState) {
        playTrack('dungeonTheme', this.time / 1000);
        return true;
    }
    render(context: CanvasRenderingContext2D, state: GameState): void {
        renderPrologue(context, state, this);
    }
}

sceneHash.prologue = new PrologueScene();

