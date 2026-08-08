import {SPAWN_LOCATION_FULL} from 'app/content/spawnLocations';
import {applySpawnLocationToState} from 'app/development/contextMenu/setState';
import {screenshotTests} from 'app/development/testing/screenshotTests';
import {GAME_KEY} from 'app/gameConstants';
import {sceneHash} from 'app/scenes/sceneHash';
import {clearKeyboardState} from 'app/userInput';

// Safety caps so a future regression that breaks the transition (e.g. the hero getting stuck,
// or the screen transition never starting/completing) fails fast instead of hanging.
const MAX_WALK_FRAMES = 120;

// Simulates updating the scene holding the right key to make the player move to the right.
function stepFrameWalkingRight(state: GameState) {
    clearKeyboardState(state);
    state.keyboard.gameKeyValues[GAME_KEY.RIGHT] = 1;
    state.keyboard.gameKeysDown.add(GAME_KEY.RIGHT);
    sceneHash.field.update(state, true);
}

// Test light sources render correctly during an intra-area section transition.
screenshotTests.peachCaveSectionTransition = {
    setup(state: GameState) {
        // This should be just to the left of the scene transition in the first peach cave area.
        applySpawnLocationToState(state, {
            ...SPAWN_LOCATION_FULL,
            z: 0,
            x: 224,
            y: 144,
            d: 'right',
        });

        // Walk right until the screen transition starts.
        let frames = 0;
        while (!state.nextAreaSet && frames < MAX_WALK_FRAMES) {
            stepFrameWalkingRight(state);
            frames++;
        }
        if (!state.nextAreaSet) {
            console.error('peachCaveSectionTransition setup: section transition never started.');
            return;
        }

        // It should take ~12 frames to reach the mid point of the ransition (256(screen width) / 10(camera speed) / 2).
        frames = 0;
        for (let i = 0; i < 12; i++) {
            sceneHash.field.update(state, true);
            frames++;
        }
        if (!state.nextAreaSet) {
            console.error('peachCaveSectionTransition setup: transition finished earlier than expected.');
        }
    },
};
